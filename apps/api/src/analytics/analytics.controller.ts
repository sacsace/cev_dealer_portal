import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AnalyticsService } from './analytics.service';
import { RecordPageVisitDto } from '../settings/settings.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Post('visits')
  recordVisit(@Body() body: RecordPageVisitDto, @Req() req: Request) {
    if (!body.path?.startsWith('/') || body.path.length > 500) {
      return { ok: false };
    }

    return this.analyticsService.recordVisit({
      path: body.path,
      referrer: body.referrer,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
  }
}
