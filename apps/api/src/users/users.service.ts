import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuditAction, Prisma, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateStaffUserDto, UpdateStaffUserDto } from './dto/user.dto';

const STAFF_ROLES: UserRole[] = [UserRole.ROOT, UserRole.ADMIN, UserRole.USER];

const staffSelect = {
  id: true,
  name: true,
  email: true,
  loginId: true,
  mobile: true,
  role: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  findAllStaff(page = 1, limit = 20, search?: string) {
    const where: Prisma.UserWhereInput = {
      role: { in: STAFF_ROLES },
      dealerId: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { loginId: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return this.paginate(
      this.prisma.user.findMany({
        where,
        select: staffSelect,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.user.count({ where }),
      page,
      limit,
    );
  }

  async findOneStaff(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, role: { in: STAFF_ROLES }, dealerId: null },
      select: staffSelect,
    });
    if (!user) throw new NotFoundException('Staff user not found');
    return user;
  }

  async createStaff(
    dto: CreateStaffUserDto,
    actor: { sub: string; role: UserRole },
    ip?: string,
  ) {
    this.assertStaffRole(dto.role);
    this.assertCanAssignRole(actor.role, dto.role);

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        loginId: dto.loginId ?? dto.email,
        mobile: dto.mobile,
        passwordHash,
        role: dto.role,
        status: dto.status ?? UserStatus.ACTIVE,
      },
      select: staffSelect,
    });

    await this.audit.log({
      userId: actor.sub,
      userRole: actor.role,
      action: AuditAction.CREATE,
      module: 'SETTINGS',
      targetId: user.id,
      afterData: user,
      ipAddress: ip,
    });

    return user;
  }

  async updateStaff(
    id: string,
    dto: UpdateStaffUserDto,
    actor: { sub: string; role: UserRole },
    ip?: string,
  ) {
    const before = await this.findOneStaff(id);

    this.assertCanManageTarget(actor, before);

    if (dto.role !== undefined) {
      this.assertStaffRole(dto.role);
      this.assertCanAssignRole(actor.role, dto.role, before.role);
    }

    if (before.role === UserRole.ROOT && dto.role && dto.role !== UserRole.ROOT) {
      await this.assertNotLastRoot(id);
    }

    const data: Prisma.UserUpdateInput = {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.email !== undefined ? { email: dto.email } : {}),
      ...(dto.loginId !== undefined ? { loginId: dto.loginId } : {}),
      ...(dto.mobile !== undefined ? { mobile: dto.mobile } : {}),
      ...(dto.role !== undefined ? { role: dto.role } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
    };

    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: staffSelect,
    });

    await this.audit.log({
      userId: actor.sub,
      userRole: actor.role,
      action: AuditAction.UPDATE,
      module: 'SETTINGS',
      targetId: id,
      beforeData: before,
      afterData: user,
      ipAddress: ip,
    });

    return user;
  }

  async removeStaff(id: string, actor: { sub: string; role: UserRole }, ip?: string) {
    const before = await this.findOneStaff(id);

    this.assertCanManageTarget(actor, before);
    this.assertNotSelf(actor.sub, id);

    if (before.role === UserRole.ROOT) {
      await this.assertNotLastRoot(id);
    }

    const [orders, jobCards, claims] = await Promise.all([
      this.prisma.order.count({ where: { createdById: id } }),
      this.prisma.jobCard.count({ where: { createdById: id } }),
      this.prisma.warrantyClaim.count({ where: { createdById: id } }),
    ]);

    if (orders + jobCards + claims > 0) {
      throw new BadRequestException(
        'Cannot delete staff user with existing orders, job cards, or warranty claims',
      );
    }

    await this.prisma.$transaction([
      this.prisma.userPermission.deleteMany({ where: { userId: id } }),
      this.prisma.auditLog.updateMany({ where: { userId: id }, data: { userId: null } }),
      this.prisma.user.delete({ where: { id } }),
    ]);

    await this.audit.log({
      userId: actor.sub,
      userRole: actor.role,
      action: AuditAction.DELETE,
      module: 'SETTINGS',
      targetId: id,
      beforeData: before,
      ipAddress: ip,
    });

    return { message: 'Staff user deleted' };
  }

  private assertStaffRole(role: UserRole) {
    if (!STAFF_ROLES.includes(role)) {
      throw new BadRequestException('Invalid staff role');
    }
  }

  private assertCanAssignRole(actorRole: UserRole, targetRole: UserRole, currentRole?: UserRole) {
    if (actorRole === UserRole.ROOT) return;

    if (targetRole === UserRole.ROOT || currentRole === UserRole.ROOT) {
      throw new ForbiddenException('Only ROOT can manage ROOT accounts');
    }
  }

  private assertCanManageTarget(actor: { sub: string; role: UserRole }, target: { id: string; role: UserRole }) {
    if (actor.role === UserRole.ROOT) return;
    if (target.role === UserRole.ROOT) {
      throw new ForbiddenException('Only ROOT can manage ROOT accounts');
    }
  }

  private assertNotSelf(actorId: string, targetId: string) {
    if (actorId === targetId) {
      throw new BadRequestException('Cannot delete your own account');
    }
  }

  private async assertNotLastRoot(excludeId?: string) {
    const rootCount = await this.prisma.user.count({
      where: {
        role: UserRole.ROOT,
        dealerId: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });

    if (rootCount === 0) {
      throw new BadRequestException('At least one ROOT account is required');
    }
  }

  private async paginate<T>(dataPromise: Promise<T[]>, countPromise: Promise<number>, page: number, limit: number) {
    const [data, total] = await Promise.all([dataPromise, countPromise]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
