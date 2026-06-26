import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuditAction, Prisma, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateDealerDto, UpdateDealerDto } from './dto/dealer.dto';

const STAFF_ROLES: UserRole[] = [UserRole.ROOT, UserRole.ADMIN, UserRole.USER];

const dealerInclude = {
  contactUser: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
} satisfies Prisma.DealerInclude;

@Injectable()
export class DealersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  findAll(page = 1, limit = 20, search?: string) {
    const where = search
      ? {
          OR: [
            { dealerName: { contains: search, mode: 'insensitive' as const } },
            { dealerCode: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    return this.paginate(
      this.prisma.dealer.findMany({
        where,
        include: dealerInclude,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.dealer.count({ where }),
      page,
      limit,
    );
  }

  async findOne(id: string, user: { role: UserRole; dealerId?: string }) {
    const dealer = await this.prisma.dealer.findUnique({
      where: { id },
      include: dealerInclude,
    });
    if (!dealer) throw new NotFoundException('Dealer not found');

    if (user.role === UserRole.DEALER && user.dealerId !== id) {
      throw new ForbiddenException('Access denied');
    }

    return dealer;
  }

  private async resolveContactUser(contactUserId?: string | null) {
    if (!contactUserId) return null;

    const contactUser = await this.prisma.user.findFirst({
      where: {
        id: contactUserId,
        role: { in: STAFF_ROLES },
        dealerId: null,
        status: UserStatus.ACTIVE,
      },
    });

    if (!contactUser) {
      throw new BadRequestException('Invalid contact user');
    }

    return contactUser;
  }

  async getNextDealerCode() {
    const dealerCode = await this.generateNextDealerCode();
    return { dealerCode };
  }

  private async generateNextDealerCode(): Promise<string> {
    const dealers = await this.prisma.dealer.findMany({
      where: {
        dealerCode: {
          startsWith: 'FH',
          mode: 'insensitive',
        },
      },
      select: { dealerCode: true },
    });

    let maxNum = 0;
    for (const { dealerCode } of dealers) {
      const match = /^FH(\d+)$/i.exec(dealerCode.trim());
      if (match) {
        maxNum = Math.max(maxNum, Number.parseInt(match[1], 10));
      }
    }

    return `FH${String(maxNum + 1).padStart(3, '0')}`;
  }

  async create(dto: CreateDealerDto, actor: { sub: string; role: UserRole }, ip?: string) {
    const contactUser = await this.resolveContactUser(dto.contactUserId);
    const dealerCode = dto.dealerCode?.trim() || (await this.generateNextDealerCode());
    const loginId = dto.loginId?.trim() || dealerCode;
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const dealer = await this.prisma.dealer.create({
      data: {
        dealerName: dto.dealerName,
        dealerCode,
        email: dto.email,
        mobile: dto.mobile,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        gstNumber: dto.gstNumber,
        contactPerson: contactUser?.name ?? dto.contactPerson,
        ...(contactUser ? { contactUser: { connect: { id: contactUser.id } } } : {}),
        loginId,
        status: dto.status,
      },
      include: dealerInclude,
    });

    await this.prisma.user.create({
      data: {
        name: dto.dealerName,
        email: dto.email,
        loginId,
        mobile: dto.mobile,
        passwordHash,
        role: UserRole.DEALER,
        dealerId: dealer.id,
      },
    });

    await this.audit.log({
      userId: actor.sub,
      userRole: actor.role,
      action: AuditAction.CREATE,
      module: 'DEALER',
      targetId: dealer.id,
      afterData: dealer,
      ipAddress: ip,
    });

    return dealer;
  }

  async update(
    id: string,
    dto: UpdateDealerDto,
    actor: { sub: string; role: UserRole },
    ip?: string,
  ) {
    const before = await this.prisma.dealer.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Dealer not found');

    const contactUser =
      dto.contactUserId !== undefined
        ? await this.resolveContactUser(dto.contactUserId || null)
        : undefined;

    const dealerData: Prisma.DealerUpdateInput = {
      ...(dto.dealerName !== undefined ? { dealerName: dto.dealerName } : {}),
      ...(dto.email !== undefined ? { email: dto.email } : {}),
      ...(dto.mobile !== undefined ? { mobile: dto.mobile } : {}),
      ...(dto.address !== undefined ? { address: dto.address } : {}),
      ...(dto.city !== undefined ? { city: dto.city } : {}),
      ...(dto.state !== undefined ? { state: dto.state } : {}),
      ...(dto.gstNumber !== undefined ? { gstNumber: dto.gstNumber } : {}),
      ...(dto.loginId !== undefined ? { loginId: dto.loginId || before.dealerCode } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
    };

    if (dto.contactUserId !== undefined) {
      dealerData.contactUser = contactUser
        ? { connect: { id: contactUser.id } }
        : { disconnect: true };
      dealerData.contactPerson = contactUser?.name ?? null;
    } else if (dto.contactPerson !== undefined) {
      dealerData.contactPerson = dto.contactPerson;
    }

    const dealer = await this.prisma.dealer.update({
      where: { id },
      data: dealerData,
      include: dealerInclude,
    });

    const userData: {
      name?: string;
      email?: string;
      mobile?: string | null;
      loginId?: string | null;
      status?: UserStatus;
      passwordHash?: string;
    } = {};

    if (dto.dealerName !== undefined) userData.name = dto.dealerName;
    if (dto.email !== undefined) userData.email = dto.email;
    if (dto.mobile !== undefined) userData.mobile = dto.mobile;
    if (dto.loginId !== undefined) userData.loginId = dto.loginId || before.dealerCode;
    if (dto.status !== undefined) userData.status = dto.status as UserStatus;
    if (dto.password) userData.passwordHash = await bcrypt.hash(dto.password, 10);

    if (Object.keys(userData).length > 0) {
      await this.prisma.user.updateMany({
        where: { dealerId: id, role: UserRole.DEALER },
        data: userData,
      });
    }

    await this.audit.log({
      userId: actor.sub,
      userRole: actor.role,
      action: AuditAction.UPDATE,
      module: 'DEALER',
      targetId: id,
      beforeData: before,
      afterData: dealer,
      ipAddress: ip,
    });

    return dealer;
  }

  async remove(id: string, actor: { sub: string; role: UserRole }, ip?: string) {
    const before = await this.prisma.dealer.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Dealer not found');

    const [orders, jobCards, claims] = await Promise.all([
      this.prisma.order.count({ where: { dealerId: id } }),
      this.prisma.jobCard.count({ where: { dealerId: id } }),
      this.prisma.warrantyClaim.count({ where: { dealerId: id } }),
    ]);

    if (orders + jobCards + claims > 0) {
      throw new BadRequestException(
        'Cannot delete dealer with existing orders, job cards, or warranty claims',
      );
    }

    await this.prisma.$transaction([
      this.prisma.user.deleteMany({ where: { dealerId: id } }),
      this.prisma.cart.deleteMany({ where: { dealerId: id } }),
      this.prisma.dealer.delete({ where: { id } }),
    ]);

    await this.audit.log({
      userId: actor.sub,
      userRole: actor.role,
      action: AuditAction.DELETE,
      module: 'DEALER',
      targetId: id,
      beforeData: before,
      ipAddress: ip,
    });

    return { message: 'Dealer deleted' };
  }

  private async paginate<T>(dataPromise: Promise<T[]>, countPromise: Promise<number>, page: number, limit: number) {
    const [data, total] = await Promise.all([dataPromise, countPromise]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
