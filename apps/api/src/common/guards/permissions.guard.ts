import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, PermissionModule, PermissionAction } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<{
      module: PermissionModule;
      action: PermissionAction;
    }>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!required) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (user.role === UserRole.ROOT) return true;
    if (user.role === UserRole.DEALER) {
      throw new ForbiddenException('Dealer cannot access admin resources');
    }

    if (user.role === UserRole.ADMIN || user.role === UserRole.USER) {
      if (required.module === PermissionModule.SETTINGS && required.action !== PermissionAction.VIEW) {
        throw new ForbiddenException('Cannot modify system settings');
      }
      return true;
    }

    const permission = await this.prisma.permission.findUnique({
      where: {
        module_action: { module: required.module, action: required.action },
      },
    });

    if (!permission) {
      throw new ForbiddenException('Permission is not configured');
    }

    const userPermission = await this.prisma.userPermission.findUnique({
      where: {
        userId_permissionId: {
          userId: user.sub,
          permissionId: permission.id,
        },
      },
    });

    if (!userPermission?.granted) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
