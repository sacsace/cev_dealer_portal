import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, JobCardStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { deleteStoredFile, saveUploadedImage } from '../common/utils/file-storage.util';
import { CreateJobCardDto, UpdateJobCardDto } from './dto/job-card.dto';

@Injectable()
export class JobCardsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findAll(
    user: { role: UserRole; dealerId?: string },
    page = 1,
    limit = 20,
    search?: string,
  ) {
    const where: Record<string, unknown> = {};

    if (user.role === UserRole.DEALER) {
      if (!user.dealerId) throw new ForbiddenException();
      where.dealerId = user.dealerId;
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
        include: { files: true, carModel: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.jobCard.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, user: { role: UserRole; dealerId?: string }) {
    const jobCard = await this.prisma.jobCard.findUnique({
      where: { id },
      include: { files: true, carModel: true, dealer: true },
    });

    if (!jobCard) throw new NotFoundException('Job card not found');
    if (user.role === UserRole.DEALER && jobCard.dealerId !== user.dealerId) {
      throw new ForbiddenException('Access denied');
    }

    return jobCard;
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

  async remove(
    id: string,
    user: { sub: string; role: UserRole; dealerId?: string },
    ip?: string,
  ) {
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
