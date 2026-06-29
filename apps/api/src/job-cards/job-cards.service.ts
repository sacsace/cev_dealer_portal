import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, JobCardStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { MailService } from '../common/services/mail.service';
import { deleteStoredFile, saveUploadedImage } from '../common/utils/file-storage.util';
import { CreateJobCardDto, UpdateJobCardDto } from './dto/job-card.dto';
import { AdminUpdateJobCardDto } from './dto/admin-update-job-card.dto';
import { buildJobCardReviewEmail } from './job-card-review-mail.util';

@Injectable()
export class JobCardsService {
  private readonly logger = new Logger(JobCardsService.name);

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private mail: MailService,
  ) {}

  private readonly jobCardDetailInclude = {
    files: true,
    carModel: true,
    dealer: true,
    reviewEntries: {
      orderBy: { createdAt: 'desc' as const },
    },
  };

  async findAll(
    user: { role: UserRole; dealerId?: string },
    page = 1,
    limit = 20,
    search?: string,
    progress?: 'active' | 'completed',
  ) {
    const where: Record<string, unknown> = {};

    if (user.role === UserRole.DEALER) {
      if (!user.dealerId) throw new ForbiddenException();
      where.dealerId = user.dealerId;
    }

    if (progress === 'completed') {
      where.status = {
        in: [JobCardStatus.APPROVED, JobCardStatus.REJECTED, JobCardStatus.CLOSED],
      };
    } else if (progress === 'active') {
      where.status = {
        in: [JobCardStatus.CREATED, JobCardStatus.SUBMITTED, JobCardStatus.UNDER_REVIEW],
      };
    }

    if (search) {
      where.OR = [
        { jobCardNo: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { vin: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
        { carModelName: { contains: search, mode: 'insensitive' } },
        { registrationNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.jobCard.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { files: true, carModel: true, dealer: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.jobCard.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, user: { role: UserRole; dealerId?: string }) {
    const jobCard = await this.prisma.jobCard.findUnique({
      where: { id },
      include: this.jobCardDetailInclude,
    });

    if (!jobCard) throw new NotFoundException('Job card not found');
    if (user.role === UserRole.DEALER && jobCard.dealerId !== user.dealerId) {
      throw new ForbiddenException('Access denied');
    }

    return jobCard;
  }

  async lookupByVin(
    vin: string,
    user: { role: UserRole; dealerId?: string },
  ) {
    const normalized = vin.toUpperCase();
    if (!/^[A-Z0-9]{17}$/.test(normalized)) {
      throw new BadRequestException('Invalid VIN');
    }

    const where: Record<string, unknown> = { vin: normalized };
    if (user.role === UserRole.DEALER) {
      if (!user.dealerId) throw new ForbiddenException();
      where.dealerId = user.dealerId;
    }

    const jobCard = await this.prisma.jobCard.findFirst({
      where,
      orderBy: { updatedAt: 'desc' },
      include: { carModel: true },
    });

    if (jobCard) {
      return {
        carModelId: jobCard.carModelId,
        carModelName: jobCard.carModelName ?? jobCard.carModel?.modelName ?? null,
      };
    }

    const claimWhere: Record<string, unknown> = { vin: normalized };
    if (user.role === UserRole.DEALER) {
      claimWhere.dealerId = user.dealerId;
    }

    const claim = await this.prisma.warrantyClaim.findFirst({
      where: claimWhere,
      orderBy: { updatedAt: 'desc' },
      select: { carModelName: true },
    });

    if (claim?.carModelName) {
      return { carModelId: null, carModelName: claim.carModelName };
    }

    return { carModelId: null, carModelName: null };
  }

  async create(
    dto: CreateJobCardDto,
    user: { sub: string; role: UserRole; dealerId?: string; dealer?: { dealerName: string; dealerCode: string } },
    ip?: string,
  ) {
    if (!user.dealerId || !user.dealer) {
      throw new ForbiddenException('Dealer account required');
    }

    const jobCardNo = `JC-${Date.now()}`;

    const jobCard = await this.prisma.jobCard.create({
      data: {
        jobCardNo,
        jobCardDate: new Date(),
        vin: dto.vin,
        carModelId: dto.carModelId,
        carModelName: dto.carModelName,
        fitment: dto.fitment,
        gdmsNo: dto.gdmsNo,
        type: dto.type,
        kilometers: dto.kilometers,
        customerName: dto.customerName,
        mobile: dto.mobile,
        dealerId: user.dealerId,
        dealerName: user.dealer.dealerName,
        dealerCode: user.dealer.dealerCode,
        place: dto.place,
        checkedBy: dto.checkedBy,
        typeOfProblem: dto.typeOfProblem,
        jobType: dto.jobType,
        registrationNumber: dto.registrationNumber,
        dateOfFitment: dto.dateOfFitment ? new Date(dto.dateOfFitment) : undefined,
        customerAddress: dto.customerAddress,
        customerComplaint: dto.customerComplaint,
        notes: dto.notes,
        observation: dto.observation,
        rectification: dto.rectification,
        status: JobCardStatus.CREATED,
        createdById: user.sub,
      },
      include: { files: true },
    });

    await this.audit.log({
      userId: user.sub,
      userRole: user.role,
      action: AuditAction.CREATE,
      module: 'JOB_CARDS',
      targetId: jobCard.id,
      afterData: jobCard,
      ipAddress: ip,
    });

    return jobCard;
  }

  async update(
    id: string,
    dto: UpdateJobCardDto,
    user: { sub: string; role: UserRole; dealerId?: string },
    ip?: string,
  ) {
    const before = await this.findOne(id, user);

    const jobCard = await this.prisma.jobCard.update({
      where: { id },
      data: {
        ...dto,
        dateOfFitment: dto.dateOfFitment ? new Date(dto.dateOfFitment) : undefined,
      },
      include: { files: true },
    });

    await this.audit.log({
      userId: user.sub,
      userRole: user.role,
      action: AuditAction.UPDATE,
      module: 'JOB_CARDS',
      targetId: id,
      beforeData: before,
      afterData: jobCard,
      ipAddress: ip,
    });

    return jobCard;
  }

  private async notifyCreatorOnReview(
    jobCard: { id: string; jobCardNo: string; status: JobCardStatus; createdById: string; dealerId: string },
    dto: AdminUpdateJobCardDto,
    reviewerName: string,
  ) {
    const [creator, dealer] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: jobCard.createdById },
        select: { email: true, name: true },
      }),
      this.prisma.dealer.findUnique({
        where: { id: jobCard.dealerId },
        select: { email: true },
      }),
    ]);

    const to = creator?.email ?? dealer?.email;
    if (!to) {
      this.logger.warn(`Job card ${jobCard.jobCardNo}: no recipient email for review notification`);
      return;
    }

    const mailContent = buildJobCardReviewEmail({
      jobCardNo: jobCard.jobCardNo,
      status: jobCard.status,
      observation: dto.observation,
      rectification: dto.rectification,
      reviewerName,
    });

    try {
      await this.mail.sendMail({
        to,
        subject: mailContent.subject,
        text: mailContent.text,
        html: mailContent.html,
      });
    } catch (err) {
      this.logger.warn(
        `Job card ${jobCard.jobCardNo}: failed to send review email to ${to}: ${
          err instanceof Error ? err.message : 'unknown error'
        }`,
      );
    }
  }

  async adminReview(
    id: string,
    dto: AdminUpdateJobCardDto,
    user: { sub: string; role: UserRole; dealerId?: string },
    ip?: string,
  ) {
    if (user.role === UserRole.DEALER) {
      throw new ForbiddenException('Access denied');
    }

    const before = await this.findOne(id, user);

    const data: {
      status?: JobCardStatus;
      observation?: string;
      rectification?: string;
    } = {};

    if (dto.status !== undefined) data.status = dto.status;
    if (dto.observation !== undefined) data.observation = dto.observation;
    if (dto.rectification !== undefined) data.rectification = dto.rectification;

    const jobCard = await this.prisma.jobCard.update({
      where: { id },
      data,
      include: this.jobCardDetailInclude,
    });

    const author = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { name: true },
    });
    const reviewerName = author?.name ?? 'Admin';

    await this.prisma.jobCardReviewEntry.create({
      data: {
        jobCardId: id,
        status: jobCard.status,
        observation: dto.observation,
        rectification: dto.rectification,
        authorId: user.sub,
        authorName: reviewerName,
        authorRole: user.role,
      },
    });

    await this.notifyCreatorOnReview(jobCard, dto, reviewerName);

    const withReviews = await this.prisma.jobCard.findUnique({
      where: { id },
      include: this.jobCardDetailInclude,
    });

    await this.audit.log({
      userId: user.sub,
      userRole: user.role,
      action: AuditAction.UPDATE,
      module: 'JOB_CARDS',
      targetId: id,
      beforeData: before,
      afterData: withReviews,
      ipAddress: ip,
    });

    return withReviews!;
  }

  async markAsReceived(
    id: string,
    user: { sub: string; role: UserRole; dealerId?: string },
    ip?: string,
  ) {
    if (user.role === UserRole.DEALER) {
      throw new ForbiddenException('Access denied');
    }

    const before = await this.findOne(id, user);
    if (before.status !== JobCardStatus.CREATED) {
      return before;
    }

    const jobCard = await this.prisma.jobCard.update({
      where: { id },
      data: { status: JobCardStatus.SUBMITTED },
      include: this.jobCardDetailInclude,
    });

    await this.audit.log({
      userId: user.sub,
      userRole: user.role,
      action: AuditAction.UPDATE,
      module: 'JOB_CARDS',
      targetId: id,
      beforeData: before,
      afterData: jobCard,
      ipAddress: ip,
    });

    return jobCard;
  }

  async remove(
    id: string,
    user: { sub: string; role: UserRole; dealerId?: string },
    ip?: string,
  ) {
    if (user.role !== UserRole.DEALER && user.role !== UserRole.ROOT) {
      throw new ForbiddenException('Only ROOT can delete job cards');
    }

    const before = await this.findOne(id, user);

    const linkedClaims = await this.prisma.warrantyClaim.count({ where: { jobCardId: id } });
    if (linkedClaims > 0) {
      throw new BadRequestException('Cannot delete job card linked to warranty claims');
    }

    for (const file of before.files) {
      await deleteStoredFile(file.fileUrl);
    }

    await this.prisma.$transaction([
      this.prisma.jobCardFile.deleteMany({ where: { jobCardId: id } }),
      this.prisma.jobCard.delete({ where: { id } }),
    ]);

    await this.audit.log({
      userId: user.sub,
      userRole: user.role,
      action: AuditAction.DELETE,
      module: 'JOB_CARDS',
      targetId: id,
      beforeData: before,
      ipAddress: ip,
    });

    return { message: 'Job card deleted' };
  }

  async uploadFile(
    id: string,
    file: Express.Multer.File,
    user: { sub: string; role: UserRole; dealerId?: string },
    ip?: string,
  ) {
    await this.findOne(id, user);

    const saved = await saveUploadedImage('job-cards', id, file);
    const record = await this.prisma.jobCardFile.create({
      data: {
        jobCardId: id,
        fileName: file.originalname,
        fileUrl: saved.fileUrl,
        fileType: file.mimetype,
      },
    });

    await this.audit.log({
      userId: user.sub,
      userRole: user.role,
      action: AuditAction.UPDATE,
      module: 'JOB_CARDS',
      targetId: id,
      afterData: record,
      ipAddress: ip,
    });

    return record;
  }

  async removeFile(
    id: string,
    fileId: string,
    user: { sub: string; role: UserRole; dealerId?: string },
    ip?: string,
  ) {
    await this.findOne(id, user);

    const file = await this.prisma.jobCardFile.findFirst({
      where: { id: fileId, jobCardId: id },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    await deleteStoredFile(file.fileUrl);
    await this.prisma.jobCardFile.delete({ where: { id: fileId } });

    await this.audit.log({
      userId: user.sub,
      userRole: user.role,
      action: AuditAction.UPDATE,
      module: 'JOB_CARDS',
      targetId: id,
      beforeData: file,
      ipAddress: ip,
    });

    return { message: 'File deleted' };
  }
}
