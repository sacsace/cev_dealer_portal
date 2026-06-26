import { Injectable } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    userId?: string;
    userRole?: string;
    action: AuditAction;
    module: string;
    targetId?: string;
    beforeData?: unknown;
    afterData?: unknown;
    ipAddress?: string;
  }) {
    await this.prisma.auditLog.create({
      data: {
        userId: params.userId,
        userRole: params.userRole,
        action: params.action,
        module: params.module,
        targetId: params.targetId,
        beforeData: params.beforeData as object | undefined,
        afterData: params.afterData as object | undefined,
        ipAddress: params.ipAddress,
      },
    });
  }
}
