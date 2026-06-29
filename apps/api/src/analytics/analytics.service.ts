import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReportQueryDto } from '../reports/report-query.dto';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  private buildDateRange(from?: string, to?: string): Prisma.DateTimeFilter | undefined {
    if (!from && !to) return undefined;
    const range: Prisma.DateTimeFilter = {};
    if (from) range.gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      range.lte = end;
    }
    return range;
  }

  async recordVisit(input: {
    path: string;
    role?: string;
    userId?: string;
    referrer?: string;
    userAgent?: string;
    ipAddress?: string;
  }) {
    const path = input.path.slice(0, 500);
    await this.prisma.pageVisit.create({
      data: {
        path,
        role: input.role,
        userId: input.userId,
        referrer: input.referrer?.slice(0, 500),
        userAgent: input.userAgent?.slice(0, 500),
        ipAddress: input.ipAddress,
      },
    });
    return { ok: true };
  }

  async getTrafficStats(query: ReportQueryDto) {
    const createdAt = this.buildDateRange(query.from, query.to);
    const where: Prisma.PageVisitWhereInput = createdAt ? { createdAt } : {};

    const visits = await this.prisma.pageVisit.findMany({
      where,
      select: { path: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });

    const totalVisits = visits.length;
    const byPathMap = new Map<string, number>();
    const byRoleMap = new Map<string, number>();
    const byDayMap = new Map<string, number>();

    for (const visit of visits) {
      byPathMap.set(visit.path, (byPathMap.get(visit.path) ?? 0) + 1);
      const role = visit.role ?? 'ANONYMOUS';
      byRoleMap.set(role, (byRoleMap.get(role) ?? 0) + 1);
      const day = visit.createdAt.toISOString().slice(0, 10);
      byDayMap.set(day, (byDayMap.get(day) ?? 0) + 1);
    }

    const sortDesc = (a: { count: number }, b: { count: number }) => b.count - a.count;

    return {
      filters: { from: query.from ?? null, to: query.to ?? null },
      summary: {
        totalVisits,
        uniquePaths: byPathMap.size,
      },
      byPath: [...byPathMap.entries()]
        .map(([path, count]) => ({ path, count }))
        .sort(sortDesc)
        .slice(0, 20),
      byRole: [...byRoleMap.entries()]
        .map(([role, count]) => ({ role, count }))
        .sort(sortDesc),
      byDay: [...byDayMap.entries()]
        .map(([day, count]) => ({ day, count }))
        .sort((a, b) => a.day.localeCompare(b.day)),
    };
  }
}
