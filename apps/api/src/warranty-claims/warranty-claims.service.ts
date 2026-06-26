import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, UserRole, WarrantyClaimStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import {
  ApproveWarrantyClaimDto,
  CreateWarrantyClaimDto,
  RejectWarrantyClaimDto,
} from './dto/warranty-claim.dto';

@Injectable()
export class WarrantyClaimsService {
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
        { warrantyClaimNo: { contains: search, mode: 'insensitive' } },
        { invoiceNo: { contains: search, mode: 'insensitive' } },
        { jobCardNo: { contains: search, mode: 'insensitive' } },
        { vin: { contains: search, mode: 'insensitive' } },
        { partNumber: { contains: search, mode: 'insensitive' } },
        { partName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.warrantyClaim.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { files: true, jobCard: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.warrantyClaim.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, user: { role: UserRole; dealerId?: string }) {
    const claim = await this.prisma.warrantyClaim.findUnique({
      where: { id },
      include: { files: true, jobCard: true, dealer: true },
    });

    if (!claim) throw new NotFoundException('Warranty claim not found');
    if (user.role === UserRole.DEALER && claim.dealerId !== user.dealerId) {
      throw new ForbiddenException('Access denied');
    }

    return claim;
  }

  async create(
    dto: CreateWarrantyClaimDto,
    user: {
      sub: string;
      role: UserRole;
      dealerId?: string;
      dealer?: { dealerName: string; dealerCode: string };
    },
    ip?: string,
  ) {
    if (!user.dealerId || !user.dealer) {
      throw new ForbiddenException('Dealer account required');
    }

    const warrantyClaimNo = `WC-${Date.now()}`;

    const claim = await this.prisma.warrantyClaim.create({
      data: {
        warrantyClaimNo,
        warrantyClaimDate: new Date(dto.warrantyClaimDate),
        invoiceNo: dto.invoiceNo,
        jobCardId: dto.jobCardId,
        jobCardNo: dto.jobCardNo,
        vin: dto.vin,
        carModelName: dto.carModelName,
        partNumber: dto.partNumber,
        partName: dto.partName,
        quantity: dto.quantity,
        claimAmount: dto.claimAmount,
        reasonForClaim: dto.reasonForClaim,
        problemDescription: dto.problemDescription,
        dealerId: user.dealerId,
        dealerName: user.dealer.dealerName,
        dealerCode: user.dealer.dealerCode,
        place: dto.place,
        status: WarrantyClaimStatus.DRAFT,
        createdById: user.sub,
      },
    });

    await this.audit.log({
      userId: user.sub,
      userRole: user.role,
      action: AuditAction.CREATE,
      module: 'WARRANTY_CLAIMS',
      targetId: claim.id,
      afterData: claim,
      ipAddress: ip,
    });

    return claim;
  }

  async update(
    id: string,
    dto: CreateWarrantyClaimDto,
    user: { sub: string; role: UserRole; dealerId?: string },
    ip?: string,
  ) {
    const before = await this.findOne(id, user);

    if (user.role === UserRole.DEALER && before.status !== WarrantyClaimStatus.DRAFT) {
      throw new BadRequestException('Only draft claims can be edited');
    }

    const claim = await this.prisma.warrantyClaim.update({
      where: { id },
      data: {
        ...dto,
        warrantyClaimDate: dto.warrantyClaimDate
          ? new Date(dto.warrantyClaimDate)
          : undefined,
      },
    });

    await this.audit.log({
      userId: user.sub,
      userRole: user.role,
      action: AuditAction.UPDATE,
      module: 'WARRANTY_CLAIMS',
      targetId: id,
      beforeData: before,
      afterData: claim,
      ipAddress: ip,
    });

    return claim;
  }

  async submit(id: string, user: { sub: string; role: UserRole; dealerId?: string }, ip?: string) {
    const before = await this.findOne(id, user);
    const claim = await this.prisma.warrantyClaim.update({
      where: { id },
      data: { status: WarrantyClaimStatus.SUBMITTED },
    });

    await this.audit.log({
      userId: user.sub,
      userRole: user.role,
      action: AuditAction.UPDATE,
      module: 'WARRANTY_CLAIMS',
      targetId: id,
      beforeData: before,
      afterData: claim,
      ipAddress: ip,
    });

    return claim;
  }

  async approve(
    id: string,
    dto: ApproveWarrantyClaimDto,
    actor: { sub: string; role: UserRole },
    ip?: string,
  ) {
    const before = await this.findOne(id, actor);
    const claim = await this.prisma.warrantyClaim.update({
      where: { id },
      data: {
        status: WarrantyClaimStatus.APPROVED,
        remark: dto.remark,
      },
    });

    await this.audit.log({
      userId: actor.sub,
      userRole: actor.role,
      action: AuditAction.APPROVE,
      module: 'WARRANTY_CLAIMS',
      targetId: id,
      beforeData: before,
      afterData: claim,
      ipAddress: ip,
    });

    return claim;
  }

  async reject(
    id: string,
    dto: RejectWarrantyClaimDto,
    actor: { sub: string; role: UserRole },
    ip?: string,
  ) {
    const before = await this.findOne(id, actor);
    const claim = await this.prisma.warrantyClaim.update({
      where: { id },
      data: {
        status: WarrantyClaimStatus.REJECTED,
        rejectReason: dto.rejectReason,
      },
    });

    await this.audit.log({
      userId: actor.sub,
      userRole: actor.role,
      action: AuditAction.REJECT,
      module: 'WARRANTY_CLAIMS',
      targetId: id,
      beforeData: before,
      afterData: claim,
      ipAddress: ip,
    });

    return claim;
  }

  async remove(
    id: string,
    user: { sub: string; role: UserRole; dealerId?: string },
    ip?: string,
  ) {
    const before = await this.findOne(id, user);

    const deletableStatuses: WarrantyClaimStatus[] =
      user.role === UserRole.DEALER
        ? [WarrantyClaimStatus.DRAFT, WarrantyClaimStatus.REJECTED]
        : [
            WarrantyClaimStatus.DRAFT,
            WarrantyClaimStatus.REJECTED,
            WarrantyClaimStatus.SUBMITTED,
          ];

    if (!deletableStatuses.includes(before.status)) {
      throw new BadRequestException('This claim cannot be deleted in its current status');
    }

    await this.prisma.$transaction([
      this.prisma.warrantyClaimFile.deleteMany({ where: { warrantyClaimId: id } }),
      this.prisma.warrantyClaim.delete({ where: { id } }),
    ]);

    await this.audit.log({
      userId: user.sub,
      userRole: user.role,
      action: AuditAction.DELETE,
      module: 'WARRANTY_CLAIMS',
      targetId: id,
      beforeData: before,
      ipAddress: ip,
    });

    return { message: 'Warranty claim deleted' };
  }
}
