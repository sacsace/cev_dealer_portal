import { Injectable } from '@nestjs/common';
import {
  AuditAction,
  OrderStatus,
  Prisma,
  UserRole,
  WarrantyClaimStatus,
} from '@prisma/client';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';
import { ReportExportQueryDto, ReportQueryDto } from './report-query.dto';

type ReportUser = { role: UserRole; dealerId?: string };

type CountAmountRow = { key: string; label: string; count: number; amount: number };

@Injectable()
export class ReportsService {
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

  private resolveDealerId(user: ReportUser, dealerId?: string) {
    if (user.role === UserRole.DEALER) return user.dealerId;
    return dealerId || undefined;
  }

  private buildOrderWhere(user: ReportUser, query: ReportQueryDto): Prisma.OrderWhereInput {
    const where: Prisma.OrderWhereInput = {};
    const createdAt = this.buildDateRange(query.from, query.to);
    if (createdAt) where.createdAt = createdAt;

    const dealerId = this.resolveDealerId(user, query.dealerId);
    if (dealerId) where.dealerId = dealerId;

    return where;
  }

  private buildClaimWhere(user: ReportUser, query: ReportQueryDto): Prisma.WarrantyClaimWhereInput {
    const where: Prisma.WarrantyClaimWhereInput = {};
    const createdAt = this.buildDateRange(query.from, query.to);
    if (createdAt) where.createdAt = createdAt;

    const dealerId = this.resolveDealerId(user, query.dealerId);
    if (dealerId) where.dealerId = dealerId;

    return where;
  }

  private toNumber(value: Prisma.Decimal | number | null | undefined) {
    return value == null ? 0 : Number(value);
  }

  private monthKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  async getSummary(user: ReportUser, query: ReportQueryDto) {
    const orderWhere = this.buildOrderWhere(user, query);
    const claimWhere = this.buildClaimWhere(user, query);
    const dealerId = this.resolveDealerId(user, query.dealerId);

    const dealerWhere: Prisma.DealerWhereInput = dealerId ? { id: dealerId } : {};

    const [totalDealers, orders, claims, totalJobCards, totalParts, lowStockParts, lowStockList] =
      await Promise.all([
        this.prisma.dealer.count({ where: dealerWhere }),
        this.prisma.order.findMany({
          where: orderWhere,
          select: { status: true, grandTotal: true },
        }),
        this.prisma.warrantyClaim.findMany({
          where: claimWhere,
          select: { status: true, claimAmount: true },
        }),
        this.prisma.jobCard.count({
          where: dealerId ? { dealerId } : undefined,
        }),
        this.prisma.part.count(),
        this.prisma.part.count({ where: { stockQuantity: { lte: 0 } } }),
        this.prisma.part.findMany({
          where: { stockQuantity: { lte: 0 } },
          select: {
            partNumber: true,
            partName: true,
            stockQuantity: true,
            dealerPrice: true,
          },
          orderBy: { stockQuantity: 'asc' },
          take: 100,
        }),
      ]);

    const ordersByStatus = orders.reduce<Record<string, number>>((acc, order) => {
      acc[order.status] = (acc[order.status] ?? 0) + 1;
      return acc;
    }, {});

    const claimsByStatus = claims.reduce<Record<string, number>>((acc, claim) => {
      acc[claim.status] = (acc[claim.status] ?? 0) + 1;
      return acc;
    }, {});

    const orderTotalAmount = orders.reduce((sum, o) => sum + this.toNumber(o.grandTotal), 0);
    const claimTotalAmount = claims.reduce((sum, c) => sum + this.toNumber(c.claimAmount), 0);

    return {
      filters: {
        from: query.from ?? null,
        to: query.to ?? null,
        dealerId: dealerId ?? null,
      },
      totalDealers,
      totalOrders: orders.length,
      totalJobCards,
      totalClaims: claims.length,
      totalParts,
      lowStockParts,
      orderTotalAmount,
      claimTotalAmount,
      ordersByStatus,
      claimsByStatus,
      lowStockList: lowStockList.map((part) => ({
        ...part,
        dealerPrice: this.toNumber(part.dealerPrice),
      })),
    };
  }

  async getOrderAnalysis(user: ReportUser, query: ReportQueryDto) {
    const orderWhere = this.buildOrderWhere(user, query);

    const [orders, items] = await Promise.all([
      this.prisma.order.findMany({
        where: orderWhere,
        include: {
          dealer: { select: { dealerCode: true, dealerName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.orderItem.findMany({
        where: { order: orderWhere },
        select: {
          partNumber: true,
          partName: true,
          quantity: true,
          totalAmount: true,
        },
      }),
    ]);

    const totalAmount = orders.reduce((sum, o) => sum + this.toNumber(o.grandTotal), 0);
    const totalCount = orders.length;
    const averageOrderValue = totalCount > 0 ? totalAmount / totalCount : 0;

    const byStatusMap = new Map<string, CountAmountRow>();
    for (const order of orders) {
      const row = byStatusMap.get(order.status) ?? {
        key: order.status,
        label: order.status,
        count: 0,
        amount: 0,
      };
      row.count += 1;
      row.amount += this.toNumber(order.grandTotal);
      byStatusMap.set(order.status, row);
    }

    const byDealerMap = new Map<string, CountAmountRow>();
    for (const order of orders) {
      const key = order.dealer.dealerCode;
      const row = byDealerMap.get(key) ?? {
        key,
        label: `${order.dealer.dealerName} (${order.dealer.dealerCode})`,
        count: 0,
        amount: 0,
      };
      row.count += 1;
      row.amount += this.toNumber(order.grandTotal);
      byDealerMap.set(key, row);
    }

    const byMonthMap = new Map<string, CountAmountRow>();
    for (const order of orders) {
      const key = this.monthKey(order.createdAt);
      const row = byMonthMap.get(key) ?? { key, label: key, count: 0, amount: 0 };
      row.count += 1;
      row.amount += this.toNumber(order.grandTotal);
      byMonthMap.set(key, row);
    }

    const topPartsMap = new Map<string, CountAmountRow & { quantity: number }>();
    for (const item of items) {
      const row = topPartsMap.get(item.partNumber) ?? {
        key: item.partNumber,
        label: item.partName,
        count: 0,
        amount: 0,
        quantity: 0,
      };
      row.count += 1;
      row.quantity += item.quantity;
      row.amount += this.toNumber(item.totalAmount);
      topPartsMap.set(item.partNumber, row);
    }

    const sortByCount = (a: CountAmountRow, b: CountAmountRow) => b.count - a.count;
    const sortByMonth = (a: CountAmountRow, b: CountAmountRow) => a.key.localeCompare(b.key);

    return {
      filters: {
        from: query.from ?? null,
        to: query.to ?? null,
        dealerId: this.resolveDealerId(user, query.dealerId) ?? null,
      },
      summary: {
        totalCount,
        totalAmount,
        averageOrderValue,
        approvedCount: orders.filter((o) => o.status === OrderStatus.APPROVED).length,
        pendingCount: orders.filter((o) =>
          ([OrderStatus.CREATED, OrderStatus.SUBMITTED] as OrderStatus[]).includes(o.status),
        ).length,
      },
      byStatus: [...byStatusMap.values()].sort(sortByCount),
      byDealer: [...byDealerMap.values()].sort((a, b) => b.amount - a.amount).slice(0, 20),
      byMonth: [...byMonthMap.values()].sort(sortByMonth),
      topParts: [...topPartsMap.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 15),
      recentOrders: orders.slice(0, 20).map((order) => ({
        orderNo: order.orderNo,
        dealerCode: order.dealer.dealerCode,
        dealerName: order.dealer.dealerName,
        status: order.status,
        grandTotal: this.toNumber(order.grandTotal),
        createdAt: order.createdAt,
      })),
    };
  }

  async getClaimAnalysis(user: ReportUser, query: ReportQueryDto) {
    const claimWhere = this.buildClaimWhere(user, query);

    const claims = await this.prisma.warrantyClaim.findMany({
      where: claimWhere,
      orderBy: { createdAt: 'desc' },
    });

    const totalAmount = claims.reduce((sum, c) => sum + this.toNumber(c.claimAmount), 0);
    const totalCount = claims.length;
    const approvedAmount = claims
      .filter((c) => c.status === WarrantyClaimStatus.APPROVED || c.status === WarrantyClaimStatus.PAID)
      .reduce((sum, c) => sum + this.toNumber(c.claimAmount), 0);
    const pendingCount = claims.filter((c) =>
      (
        [
          WarrantyClaimStatus.DRAFT,
          WarrantyClaimStatus.SUBMITTED,
          WarrantyClaimStatus.UNDER_REVIEW,
        ] as WarrantyClaimStatus[]
      ).includes(c.status),
    ).length;

    const byStatusMap = new Map<string, CountAmountRow>();
    for (const claim of claims) {
      const row = byStatusMap.get(claim.status) ?? {
        key: claim.status,
        label: claim.status,
        count: 0,
        amount: 0,
      };
      row.count += 1;
      row.amount += this.toNumber(claim.claimAmount);
      byStatusMap.set(claim.status, row);
    }

    const byDealerMap = new Map<string, CountAmountRow>();
    for (const claim of claims) {
      const row = byDealerMap.get(claim.dealerCode) ?? {
        key: claim.dealerCode,
        label: `${claim.dealerName} (${claim.dealerCode})`,
        count: 0,
        amount: 0,
      };
      row.count += 1;
      row.amount += this.toNumber(claim.claimAmount);
      byDealerMap.set(claim.dealerCode, row);
    }

    const byMonthMap = new Map<string, CountAmountRow>();
    for (const claim of claims) {
      const key = this.monthKey(claim.createdAt);
      const row = byMonthMap.get(key) ?? { key, label: key, count: 0, amount: 0 };
      row.count += 1;
      row.amount += this.toNumber(claim.claimAmount);
      byMonthMap.set(key, row);
    }

    const byReasonMap = new Map<string, CountAmountRow>();
    for (const claim of claims) {
      const reason = claim.reasonForClaim?.trim() || 'Unspecified';
      const row = byReasonMap.get(reason) ?? { key: reason, label: reason, count: 0, amount: 0 };
      row.count += 1;
      row.amount += this.toNumber(claim.claimAmount);
      byReasonMap.set(reason, row);
    }

    return {
      filters: {
        from: query.from ?? null,
        to: query.to ?? null,
        dealerId: this.resolveDealerId(user, query.dealerId) ?? null,
      },
      summary: {
        totalCount,
        totalAmount,
        approvedAmount,
        pendingCount,
        averageClaimAmount: totalCount > 0 ? totalAmount / totalCount : 0,
      },
      byStatus: [...byStatusMap.values()].sort((a, b) => b.count - a.count),
      byDealer: [...byDealerMap.values()].sort((a, b) => b.amount - a.amount).slice(0, 20),
      byMonth: [...byMonthMap.values()].sort((a, b) => a.key.localeCompare(b.key)),
      byReason: [...byReasonMap.values()].sort((a, b) => b.count - a.count).slice(0, 15),
      recentClaims: claims.slice(0, 20).map((claim) => ({
        warrantyClaimNo: claim.warrantyClaimNo,
        dealerCode: claim.dealerCode,
        dealerName: claim.dealerName,
        status: claim.status,
        claimAmount: this.toNumber(claim.claimAmount),
        reasonForClaim: claim.reasonForClaim,
        createdAt: claim.createdAt,
      })),
    };
  }

  async getClaimHandlerStats(user: ReportUser, query: ReportQueryDto) {
    const handledAt = this.buildDateRange(query.from, query.to);

    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        module: 'WARRANTY_CLAIMS',
        action: { in: [AuditAction.APPROVE, AuditAction.REJECT] },
        ...(handledAt ? { createdAt: handledAt } : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    type HandlerRow = {
      userId: string;
      name: string;
      email: string;
      role: string;
      approved: number;
      rejected: number;
      total: number;
    };

    const map = new Map<string, HandlerRow>();

    for (const log of auditLogs) {
      if (!log.userId || !log.user) continue;
      const row =
        map.get(log.userId) ??
        {
          userId: log.userId,
          name: log.user.name,
          email: log.user.email,
          role: log.user.role,
          approved: 0,
          rejected: 0,
          total: 0,
        };
      if (log.action === AuditAction.APPROVE) row.approved += 1;
      if (log.action === AuditAction.REJECT) row.rejected += 1;
      row.total += 1;
      map.set(log.userId, row);
    }

    const handlers = [...map.values()].sort((a, b) => b.total - a.total);

    return {
      filters: {
        from: query.from ?? null,
        to: query.to ?? null,
        dealerId: this.resolveDealerId(user, query.dealerId) ?? null,
      },
      summary: {
        handlerCount: handlers.length,
        totalHandled: handlers.reduce((sum, row) => sum + row.total, 0),
        totalApproved: handlers.reduce((sum, row) => sum + row.approved, 0),
        totalRejected: handlers.reduce((sum, row) => sum + row.rejected, 0),
      },
      handlers,
    };
  }

  async buildExcel(user: ReportUser, query: ReportExportQueryDto) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CEV Portal';
    workbook.created = new Date();

    const period =
      query.from || query.to
        ? `${query.from ?? 'start'} ~ ${query.to ?? 'today'}`
        : 'All time';

    if (query.type === 'summary' || query.type === 'orders') {
      const orderAnalysis = await this.getOrderAnalysis(user, query);
      const sheet = workbook.addWorksheet('Order Analysis');
      sheet.addRow(['CEV Order Analysis Report']);
      sheet.addRow(['Period', period]);
      sheet.addRow([]);
      sheet.addRow(['Metric', 'Value']);
      sheet.addRow(['Total Orders', orderAnalysis.summary.totalCount]);
      sheet.addRow(['Total Amount', orderAnalysis.summary.totalAmount]);
      sheet.addRow(['Average Order Value', orderAnalysis.summary.averageOrderValue]);
      sheet.addRow(['Pending Orders', orderAnalysis.summary.pendingCount]);
      sheet.addRow([]);
      sheet.addRow(['Status', 'Count', 'Amount']);
      orderAnalysis.byStatus.forEach((row) => sheet.addRow([row.label, row.count, row.amount]));
      sheet.addRow([]);
      sheet.addRow(['Dealer', 'Count', 'Amount']);
      orderAnalysis.byDealer.forEach((row) => sheet.addRow([row.label, row.count, row.amount]));
      sheet.addRow([]);
      sheet.addRow(['Month', 'Count', 'Amount']);
      orderAnalysis.byMonth.forEach((row) => sheet.addRow([row.label, row.count, row.amount]));
      sheet.addRow([]);
      sheet.addRow(['Part No', 'Part Name', 'Order Lines', 'Quantity', 'Amount']);
      orderAnalysis.topParts.forEach((row) =>
        sheet.addRow([row.key, row.label, row.count, (row as CountAmountRow & { quantity: number }).quantity, row.amount]),
      );
      sheet.addRow([]);
      sheet.addRow(['Order No', 'Dealer', 'Status', 'Amount', 'Created At']);
      orderAnalysis.recentOrders.forEach((row) =>
        sheet.addRow([row.orderNo, row.dealerName, row.status, row.grandTotal, row.createdAt.toISOString()]),
      );
    }

    if (query.type === 'summary' || query.type === 'claims') {
      const claimAnalysis = await this.getClaimAnalysis(user, query);
      const sheet = workbook.addWorksheet('Claim Analysis');
      sheet.addRow(['CEV Warranty Claim Analysis Report']);
      sheet.addRow(['Period', period]);
      sheet.addRow([]);
      sheet.addRow(['Metric', 'Value']);
      sheet.addRow(['Total Claims', claimAnalysis.summary.totalCount]);
      sheet.addRow(['Total Claim Amount', claimAnalysis.summary.totalAmount]);
      sheet.addRow(['Approved Amount', claimAnalysis.summary.approvedAmount]);
      sheet.addRow(['Pending Claims', claimAnalysis.summary.pendingCount]);
      sheet.addRow([]);
      sheet.addRow(['Status', 'Count', 'Amount']);
      claimAnalysis.byStatus.forEach((row) => sheet.addRow([row.label, row.count, row.amount]));
      sheet.addRow([]);
      sheet.addRow(['Dealer', 'Count', 'Amount']);
      claimAnalysis.byDealer.forEach((row) => sheet.addRow([row.label, row.count, row.amount]));
      sheet.addRow([]);
      sheet.addRow(['Month', 'Count', 'Amount']);
      claimAnalysis.byMonth.forEach((row) => sheet.addRow([row.label, row.count, row.amount]));
      sheet.addRow([]);
      sheet.addRow(['Reason', 'Count', 'Amount']);
      claimAnalysis.byReason.forEach((row) => sheet.addRow([row.label, row.count, row.amount]));
      sheet.addRow([]);
      sheet.addRow(['Claim No', 'Dealer', 'Status', 'Amount', 'Reason', 'Created At']);
      claimAnalysis.recentClaims.forEach((row) =>
        sheet.addRow([
          row.warrantyClaimNo,
          row.dealerName,
          row.status,
          row.claimAmount,
          row.reasonForClaim ?? '',
          row.createdAt.toISOString(),
        ]),
      );
    }

    if (query.type === 'summary') {
      const summary = await this.getSummary(user, query);
      const sheet = workbook.addWorksheet('Summary');
      sheet.addRow(['CEV Operations Summary']);
      sheet.addRow(['Period', period]);
      sheet.addRow([]);
      sheet.addRow(['Metric', 'Value']);
      sheet.addRow(['Total Dealers', summary.totalDealers]);
      sheet.addRow(['Total Orders', summary.totalOrders]);
      sheet.addRow(['Order Amount', summary.orderTotalAmount]);
      sheet.addRow(['Total Job Cards', summary.totalJobCards]);
      sheet.addRow(['Total Claims', summary.totalClaims]);
      sheet.addRow(['Claim Amount', summary.claimTotalAmount]);
      sheet.addRow(['Total Parts', summary.totalParts]);
      sheet.addRow(['Low Stock Parts', summary.lowStockParts]);
      sheet.addRow([]);
      sheet.addRow(['Part No', 'Part Name', 'Stock', 'Price']);
      summary.lowStockList.forEach((part) =>
        sheet.addRow([part.partNumber, part.partName, part.stockQuantity, part.dealerPrice]),
      );
    }

    workbook.worksheets.forEach((sheet) => {
      this.formatWorksheet(sheet);
    });

    return workbook.xlsx.writeBuffer();
  }

  private formatWorksheet(sheet: ExcelJS.Worksheet) {
    const defaultFont: Partial<ExcelJS.Font> = { name: 'Calibri', size: 9 };

    sheet.eachRow((row) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.font = { ...defaultFont, bold: cell.font?.bold };
      });
    });

    sheet.getRow(1).font = { ...defaultFont, bold: true };

    const columnWidths = new Map<number, number>();

    sheet.eachRow((row) => {
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const text = cell.text ?? String(cell.value ?? '');
        const nextWidth = Math.min(Math.max(text.length + 2, 8), 55);
        columnWidths.set(colNumber, Math.max(columnWidths.get(colNumber) ?? 8, nextWidth));
      });
    });

    columnWidths.forEach((width, colNumber) => {
      sheet.getColumn(colNumber).width = width;
    });
  }
}
