import { Body, Controller, Get, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { PermissionAction, PermissionModule, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermission } from '../common/decorators/permissions.decorator';
import { SettingsService } from './settings.service';
import { MailService } from '../common/services/mail.service';
import { TestMailDto, UpdateMailSettingsDto } from './settings.dto';
import { AnalyticsService } from '../analytics/analytics.service';
import { ReportQueryDto } from '../reports/report-query.dto';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class SettingsController {
  constructor(
    private settingsService: SettingsService,
    private mailService: MailService,
    private analyticsService: AnalyticsService,
  ) {}

  @Get('mail')
  @Roles(UserRole.ROOT, UserRole.ADMIN)
  @RequirePermission(PermissionModule.SETTINGS, PermissionAction.VIEW)
  getMailSettings() {
    return this.settingsService.getMailSettings();
  }

  @Patch('mail')
  @Roles(UserRole.ROOT, UserRole.ADMIN)
  updateMailSettings(@Body() dto: UpdateMailSettingsDto) {
    return this.settingsService.updateMailSettings(dto);
  }

  @Post('mail/test')
  @Roles(UserRole.ROOT, UserRole.ADMIN)
  async sendTestMail(@Body() dto: TestMailDto) {
    await this.mailService.sendTestMail(dto.to);
    return { message: 'Test email sent' };
  }

  @Get('traffic')
  @Roles(UserRole.ROOT, UserRole.ADMIN)
  @RequirePermission(PermissionModule.SETTINGS, PermissionAction.VIEW)
  getTrafficStats(@Query() query: ReportQueryDto) {
    return this.analyticsService.getTrafficStats(query);
  }
}
