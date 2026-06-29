import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { PermissionAction, PermissionModule, UserRole } from '@prisma/client';
import { ReportsService } from './reports.service';
import { ReportExportQueryDto, ReportQueryDto } from './report-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermission } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('summary')
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.REPORTS, PermissionAction.VIEW)
  getSummary(
    @CurrentUser() user: { role: UserRole; dealerId?: string },
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getSummary(user, query);
  }

  @Get('orders/analysis')
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.REPORTS, PermissionAction.VIEW)
  getOrderAnalysis(
    @CurrentUser() user: { role: UserRole; dealerId?: string },
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getOrderAnalysis(user, query);
  }

  @Get('claims/analysis')
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.REPORTS, PermissionAction.VIEW)
  getClaimAnalysis(
    @CurrentUser() user: { role: UserRole; dealerId?: string },
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getClaimAnalysis(user, query);
  }

  @Get('claims/handlers')
  @Roles(UserRole.ROOT, UserRole.ADMIN)
  @RequirePermission(PermissionModule.REPORTS, PermissionAction.VIEW)
  getClaimHandlerStats(
    @CurrentUser() user: { role: UserRole; dealerId?: string },
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getClaimHandlerStats(user, query);
  }

  @Get('export')
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.REPORTS, PermissionAction.EXPORT)
  async exportExcel(
    @CurrentUser() user: { role: UserRole; dealerId?: string },
    @Query() query: ReportExportQueryDto,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.buildExcel(user, query);
    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `cev-report-${query.type}-${stamp}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(Buffer.from(buffer));
  }
}
