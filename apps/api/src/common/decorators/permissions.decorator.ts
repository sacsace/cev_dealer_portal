import { SetMetadata } from '@nestjs/common';
import { PermissionModule, PermissionAction } from '@prisma/client';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermission = (module: PermissionModule, action: PermissionAction) =>
  SetMetadata(PERMISSIONS_KEY, { module, action });
