import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AuditAction, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { ChangePasswordDto, LoginDto, UpdateDealerProfileDto, UpdateProfileDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private audit: AuditService,
  ) {}

  async login(dto: LoginDto, ipAddress?: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.loginId },
          { loginId: dto.loginId },
          { dealer: { dealerCode: dto.loginId } },
          { dealer: { loginId: dto.loginId } },
        ],
      },
      include: { dealer: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.audit.log({
      userId: user.id,
      userRole: user.role,
      action: AuditAction.LOGIN,
      module: 'AUTH',
      ipAddress,
    });

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      dealerId: user.dealerId ?? undefined,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN') ?? '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN') ?? '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: this.toAuthUser(user),
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { dealer: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException();
    }

    return this.toAuthUser(user);
  }

  private toAuthUser(user: {
    id: string;
    name: string;
    email: string;
    mobile?: string | null;
    role: UserRole;
    dealer?: {
      id: string;
      dealerName: string;
      dealerCode: string;
      email: string;
      mobile?: string | null;
      address?: string | null;
      city?: string | null;
      state?: string | null;
      gstNumber?: string | null;
      contactPerson?: string | null;
    } | null;
  }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile ?? null,
      role: user.role,
      dealer: user.dealer
        ? {
            id: user.dealer.id,
            dealerName: user.dealer.dealerName,
            dealerCode: user.dealer.dealerCode,
            email: user.dealer.email,
            mobile: user.dealer.mobile ?? null,
            address: user.dealer.address ?? null,
            city: user.dealer.city ?? null,
            state: user.dealer.state ?? null,
            gstNumber: user.dealer.gstNumber ?? null,
            contactPerson: user.dealer.contactPerson ?? null,
          }
        : null,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException();
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing && existing.id !== userId) {
        throw new ConflictException('Email is already in use');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.mobile !== undefined ? { mobile: dto.mobile || null } : {}),
      },
      include: { dealer: true },
    });

    await this.audit.log({
      userId,
      userRole: user.role,
      action: AuditAction.UPDATE,
      module: 'AUTH',
      targetId: userId,
      ipAddress,
    });

    return this.toAuthUser(updated);
  }

  async updateDealerProfile(
    userId: string,
    dto: UpdateDealerProfileDto,
    ipAddress?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { dealer: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException();
    }

    if (user.role !== UserRole.DEALER || !user.dealerId || !user.dealer) {
      throw new ForbiddenException('Dealer account required');
    }

    if (dto.email && dto.email !== user.dealer.email) {
      const existingDealer = await this.prisma.dealer.findUnique({ where: { email: dto.email } });
      if (existingDealer && existingDealer.id !== user.dealerId) {
        throw new ConflictException('Email is already in use');
      }

      const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Email is already in use');
      }
    }

    const dealer = await this.prisma.dealer.update({
      where: { id: user.dealerId },
      data: {
        ...(dto.dealerName !== undefined ? { dealerName: dto.dealerName } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.mobile !== undefined ? { mobile: dto.mobile || null } : {}),
        ...(dto.address !== undefined ? { address: dto.address || null } : {}),
        ...(dto.city !== undefined ? { city: dto.city || null } : {}),
        ...(dto.state !== undefined ? { state: dto.state || null } : {}),
        ...(dto.gstNumber !== undefined ? { gstNumber: dto.gstNumber || null } : {}),
        ...(dto.contactPerson !== undefined ? { contactPerson: dto.contactPerson || null } : {}),
      },
    });

    const userUpdate: {
      name?: string;
      email?: string;
      mobile?: string | null;
    } = {};

    if (dto.dealerName !== undefined) userUpdate.name = dto.dealerName;
    if (dto.email !== undefined) userUpdate.email = dto.email;
    if (dto.mobile !== undefined) userUpdate.mobile = dto.mobile || null;

    const updatedUser =
      Object.keys(userUpdate).length > 0
        ? await this.prisma.user.update({
            where: { id: userId },
            data: userUpdate,
            include: { dealer: true },
          })
        : await this.prisma.user.findUnique({
            where: { id: userId },
            include: { dealer: true },
          });

    await this.audit.log({
      userId,
      userRole: user.role,
      action: AuditAction.UPDATE,
      module: 'DEALER',
      targetId: dealer.id,
      afterData: dealer,
      ipAddress,
    });

    return this.toAuthUser(updatedUser!);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const accessToken = this.jwtService.sign(
        {
          sub: payload.sub,
          email: payload.email,
          role: payload.role,
          dealerId: payload.dealerId,
        },
        {
          secret: this.config.get('JWT_SECRET'),
          expiresIn: this.config.get('JWT_EXPIRES_IN') ?? '15m',
        },
      );

      return { accessToken };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.audit.log({
      userId,
      userRole: user.role,
      action: AuditAction.PASSWORD_CHANGE,
      module: 'AUTH',
      ipAddress,
    });

    return { message: 'Password changed successfully' };
  }

  async logout(userId: string, userRole: UserRole, ipAddress?: string) {
    await this.audit.log({
      userId,
      userRole,
      action: AuditAction.LOGOUT,
      module: 'AUTH',
      ipAddress,
    });
    return { message: 'Logged out successfully' };
  }
}
