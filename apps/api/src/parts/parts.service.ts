import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { AuditAction, PartStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreatePartDto, PartSearchQuery, UpdatePartDto } from './dto/part.dto';

const BULK_TEMPLATE_COLUMNS = [
  { header: 'Part Number', key: 'partNumber', width: 14 },
  { header: 'Part Name', key: 'partName', width: 28 },
  { header: 'Category', key: 'category', width: 18 },
  { header: 'Description', key: 'description', width: 32 },
  { header: 'MRP', key: 'mrp', width: 12 },
  { header: 'Dealer Price', key: 'dealerPrice', width: 14 },
  { header: 'GST Rate', key: 'gstRate', width: 10 },
  { header: 'Stock Quantity', key: 'stockQuantity', width: 14 },
  { header: 'Min Order Qty', key: 'minimumOrderQty', width: 14 },
  { header: 'Warranty', key: 'warranty', width: 10 },
  { header: 'Status', key: 'status', width: 14 },
  { header: 'Vehicle Models', key: 'vehicleModels', width: 24 },
] as const;

const BULK_HEADER_MAP: Record<string, keyof BulkPartRow> = {
  partnumber: 'partNumber',
  'part number': 'partNumber',
  'part no': 'partNumber',
  'part no.': 'partNumber',
  부품번호: 'partNumber',
  partname: 'partName',
  'part name': 'partName',
  부품명: 'partName',
  category: 'category',
  카테고리: 'category',
  description: 'description',
  설명: 'description',
  mrp: 'mrp',
  dealerprice: 'dealerPrice',
  'dealer price': 'dealerPrice',
  딜러가격: 'dealerPrice',
  gstrate: 'gstRate',
  'gst rate': 'gstRate',
  gst: 'gstRate',
  stockquantity: 'stockQuantity',
  'stock quantity': 'stockQuantity',
  stock: 'stockQuantity',
  재고: 'stockQuantity',
  minorderqty: 'minimumOrderQty',
  'min order qty': 'minimumOrderQty',
  'minimum order qty': 'minimumOrderQty',
  warranty: 'warranty',
  보증: 'warranty',
  status: 'status',
  상태: 'status',
  vehiclemodels: 'vehicleModels',
  'vehicle models': 'vehicleModels',
  models: 'vehicleModels',
  모델: 'vehicleModels',
};

type BulkPartRow = {
  partNumber: string;
  partName: string;
  category: string;
  description?: string;
  mrp: string;
  dealerPrice: string;
  gstRate?: string;
  stockQuantity?: string;
  minimumOrderQty?: string;
  warranty?: string;
  status?: string;
  vehicleModels?: string;
};

type BulkImportFailure = { row: number; partNumber?: string; error: string };

@Injectable()
export class PartsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findAll(query: PartSearchQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Record<string, unknown> = {};

    if (query.search) {
      where.OR = [
        { partNumber: { contains: query.search, mode: 'insensitive' } },
        { partName: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.partNumber) where.partNumber = { contains: query.partNumber, mode: 'insensitive' };
    if (query.partName) where.partName = { contains: query.partName, mode: 'insensitive' };
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.keyword) {
      where.OR = [
        { partNumber: { contains: query.keyword, mode: 'insensitive' } },
        { partName: { contains: query.keyword, mode: 'insensitive' } },
        { description: { contains: query.keyword, mode: 'insensitive' } },
      ];
    }

    if (query.modelId) {
      where.modelMappings = { some: { modelId: query.modelId } };
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.dealerPrice = {
        ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
      };
    }

    if (query.stockStatus === 'available') {
      where.stockQuantity = { gt: 0 };
      where.status = PartStatus.AVAILABLE;
    } else if (query.stockStatus === 'out_of_stock') {
      where.OR = [{ stockQuantity: 0 }, { status: PartStatus.OUT_OF_STOCK }];
    }

    const [data, total] = await Promise.all([
      this.prisma.part.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: true,
          modelMappings: { include: { model: true } },
          images: true,
        },
        orderBy: { partName: 'asc' },
      }),
      this.prisma.part.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const part = await this.prisma.part.findUnique({
      where: { id },
      include: {
        category: true,
        modelMappings: { include: { model: true } },
        images: true,
      },
    });
    if (!part) throw new NotFoundException('Part not found');
    return part;
  }

  async create(dto: CreatePartDto, actor: { sub: string; role: UserRole }, ip?: string) {
    const { modelIds, ...partData } = dto;
    const part = await this.prisma.part.create({
      data: {
        ...partData,
        modelMappings: modelIds?.length
          ? { create: modelIds.map((modelId) => ({ modelId })) }
          : undefined,
      },
      include: { category: true, modelMappings: { include: { model: true } } },
    });

    await this.audit.log({
      userId: actor.sub,
      userRole: actor.role,
      action: AuditAction.CREATE,
      module: 'PARTS',
      targetId: part.id,
      afterData: part,
      ipAddress: ip,
    });

    return part;
  }

  async update(
    id: string,
    dto: UpdatePartDto,
    actor: { sub: string; role: UserRole },
    ip?: string,
  ) {
    const before = await this.findOne(id);
    const { modelIds, ...partData } = dto;

    if (modelIds !== undefined) {
      await this.prisma.partModelMapping.deleteMany({ where: { partId: id } });
      if (modelIds.length > 0) {
        await this.prisma.partModelMapping.createMany({
          data: modelIds.map((modelId) => ({ partId: id, modelId })),
        });
      }
    }

    const part = await this.prisma.part.update({
      where: { id },
      data: partData,
      include: {
        category: true,
        modelMappings: { include: { model: true } },
        images: true,
      },
    });

    await this.audit.log({
      userId: actor.sub,
      userRole: actor.role,
      action: AuditAction.UPDATE,
      module: 'PARTS',
      targetId: id,
      beforeData: before,
      afterData: part,
      ipAddress: ip,
    });

    return part;
  }

  async remove(id: string, actor: { sub: string; role: UserRole }, ip?: string) {
    const before = await this.findOne(id);

    const [orderItemCount, cartItemCount] = await Promise.all([
      this.prisma.orderItem.count({ where: { partId: id } }),
      this.prisma.cartItem.count({ where: { partId: id } }),
    ]);

    if (orderItemCount > 0 || cartItemCount > 0) {
      throw new BadRequestException('Cannot delete part used in orders or carts');
    }

    await this.prisma.part.delete({ where: { id } });

    await this.audit.log({
      userId: actor.sub,
      userRole: actor.role,
      action: AuditAction.DELETE,
      module: 'PARTS',
      targetId: id,
      beforeData: before,
      ipAddress: ip,
    });

    return { message: 'Part deleted' };
  }

  async buildBulkTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CEV Dealer Portal';
    const sheet = workbook.addWorksheet('Parts');
    sheet.columns = BULK_TEMPLATE_COLUMNS.map((col) => ({ ...col }));

    sheet.addRow({
      partNumber: 'BP-001',
      partName: 'Brake Pad Set Front',
      category: 'Assembled Part',
      description: 'Front brake pad set',
      mrp: 3000,
      dealerPrice: 2500,
      gstRate: 18,
      stockQuantity: 50,
      minimumOrderQty: 1,
      warranty: 'Yes',
      status: 'AVAILABLE',
      vehicleModels: '',
    });

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: 'middle' };

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async bulkImport(
    fileBuffer: Buffer,
    actor: { sub: string; role: UserRole },
    ip?: string,
  ) {
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(Buffer.from(fileBuffer) as unknown as ExcelJS.Buffer);
    } catch {
      throw new BadRequestException('Invalid Excel file');
    }

    const sheet = workbook.worksheets[0];
    if (!sheet) throw new BadRequestException('Excel file has no worksheets');

    const fieldIndexes = this.mapBulkHeaderIndexes(sheet);
    if (
      !fieldIndexes.partNumber ||
      !fieldIndexes.partName ||
      !fieldIndexes.category ||
      !fieldIndexes.mrp ||
      !fieldIndexes.dealerPrice
    ) {
      throw new BadRequestException(
        'Excel must include Part Number, Part Name, Category, MRP, and Dealer Price columns',
      );
    }

    const [categories, models] = await Promise.all([
      this.prisma.category.findMany(),
      this.prisma.vehicleModel.findMany(),
    ]);

    const categoryByName = new Map(
      categories.map((c) => [c.name.trim().toLowerCase(), c.id]),
    );
    const modelByName = new Map(
      models.map((m) => [m.modelName.trim().toLowerCase(), m.id]),
    );

    const failures: BulkImportFailure[] = [];
    let created = 0;

    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
      const row = sheet.getRow(rowNumber);
      const parsed = this.parseBulkPartRow(row, fieldIndexes, rowNumber, categoryByName, modelByName);
      if (!parsed) continue;

      if ('error' in parsed) {
        failures.push(parsed.error);
        continue;
      }

      try {
        await this.create(parsed.data, actor, ip);
        created += 1;
      } catch (err) {
        failures.push({
          row: rowNumber,
          partNumber: parsed.data.partNumber,
          error: err instanceof Error ? err.message : 'Failed to create part',
        });
      }
    }

    if (created === 0 && failures.length === 0) {
      throw new BadRequestException('No part rows found in the Excel file');
    }

    return { created, failed: failures };
  }

  private mapBulkHeaderIndexes(sheet: ExcelJS.Worksheet) {
    const headerRow = sheet.getRow(1);
    const indexes: Partial<Record<keyof BulkPartRow, number>> = {};

    headerRow.eachCell((cell, colNumber) => {
      const normalized = this.normalizeBulkHeader(String(cell.value ?? ''));
      const field = BULK_HEADER_MAP[normalized];
      if (field) indexes[field] = colNumber;
    });

    return indexes;
  }

  private normalizeBulkHeader(raw: string) {
    return raw.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private parseBulkPartRow(
    row: ExcelJS.Row,
    indexes: Partial<Record<keyof BulkPartRow, number>>,
    rowNumber: number,
    categoryByName: Map<string, string>,
    modelByName: Map<string, string>,
  ):
    | { data: CreatePartDto }
    | { error: BulkImportFailure }
    | null {
    const partNumber = this.readBulkCell(row, indexes.partNumber);
    const partName = this.readBulkCell(row, indexes.partName);
    const categoryName = this.readBulkCell(row, indexes.category);
    const description = this.readBulkCell(row, indexes.description);
    const mrpRaw = this.readBulkCell(row, indexes.mrp);
    const dealerPriceRaw = this.readBulkCell(row, indexes.dealerPrice);
    const gstRateRaw = this.readBulkCell(row, indexes.gstRate);
    const stockRaw = this.readBulkCell(row, indexes.stockQuantity);
    const minOrderRaw = this.readBulkCell(row, indexes.minimumOrderQty);
    const warrantyRaw = this.readBulkCell(row, indexes.warranty);
    const statusRaw = this.readBulkCell(row, indexes.status);
    const modelsRaw = this.readBulkCell(row, indexes.vehicleModels);

    if (!partNumber && !partName && !categoryName) return null;

    if (!partNumber || !partName || !categoryName) {
      return {
        error: {
          row: rowNumber,
          partNumber: partNumber || undefined,
          error: 'Part number, part name, and category are required',
        },
      };
    }

    const categoryId = categoryByName.get(categoryName.toLowerCase());
    if (!categoryId) {
      return {
        error: {
          row: rowNumber,
          partNumber,
          error: `Category not found: ${categoryName}`,
        },
      };
    }

    const mrp = Number(mrpRaw);
    if (!Number.isFinite(mrp) || mrp < 0) {
      return {
        error: {
          row: rowNumber,
          partNumber,
          error: 'Invalid MRP',
        },
      };
    }

    const dealerPrice = Number(dealerPriceRaw);
    if (!Number.isFinite(dealerPrice) || dealerPrice < 0) {
      return {
        error: {
          row: rowNumber,
          partNumber,
          error: 'Invalid dealer price',
        },
      };
    }

    let gstRate = 18;
    if (gstRateRaw) {
      const parsedGst = Number(gstRateRaw);
      if (!Number.isFinite(parsedGst) || parsedGst < 0) {
        return {
          error: {
            row: rowNumber,
            partNumber,
            error: 'Invalid GST rate',
          },
        };
      }
      gstRate = parsedGst;
    }

    let stockQuantity = 0;
    if (stockRaw) {
      const parsedStock = Number(stockRaw);
      if (!Number.isInteger(parsedStock) || parsedStock < 0) {
        return {
          error: {
            row: rowNumber,
            partNumber,
            error: 'Invalid stock quantity',
          },
        };
      }
      stockQuantity = parsedStock;
    }

    let minimumOrderQty = 1;
    if (minOrderRaw) {
      const parsedMin = Number(minOrderRaw);
      if (!Number.isInteger(parsedMin) || parsedMin < 1) {
        return {
          error: {
            row: rowNumber,
            partNumber,
            error: 'Invalid minimum order quantity',
          },
        };
      }
      minimumOrderQty = parsedMin;
    }

    let status: PartStatus = PartStatus.AVAILABLE;
    if (statusRaw) {
      const normalized = statusRaw.toUpperCase().replace(/\s+/g, '_');
      if (!Object.values(PartStatus).includes(normalized as PartStatus)) {
        return {
          error: {
            row: rowNumber,
            partNumber,
            error: 'Invalid status (use AVAILABLE, OUT_OF_STOCK, DISCONTINUED, or COMING_SOON)',
          },
        };
      }
      status = normalized as PartStatus;
    } else if (stockQuantity === 0) {
      status = PartStatus.OUT_OF_STOCK;
    }

    const warrantyAvailable = this.parseBulkWarranty(warrantyRaw);

    const modelIds: string[] = [];
    if (modelsRaw) {
      const names = modelsRaw.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
      for (const name of names) {
        const modelId = modelByName.get(name.toLowerCase());
        if (!modelId) {
          return {
            error: {
              row: rowNumber,
              partNumber,
              error: `Vehicle model not found: ${name}`,
            },
          };
        }
        if (!modelIds.includes(modelId)) modelIds.push(modelId);
      }
    }

    const data: CreatePartDto = {
      partNumber,
      partName,
      categoryId,
      mrp,
      dealerPrice,
      gstRate,
      stockQuantity,
      minimumOrderQty,
      warrantyAvailable,
      status,
      ...(description ? { description } : {}),
      ...(modelIds.length > 0 ? { modelIds } : {}),
    };

    return { data };
  }

  private parseBulkWarranty(raw: string) {
    if (!raw) return false;
    const normalized = raw.trim().toLowerCase();
    return ['yes', 'y', 'true', '1', '예', '있음'].includes(normalized);
  }

  private readBulkCell(row: ExcelJS.Row, colIndex?: number) {
    if (!colIndex) return '';
    return this.cellText(row.getCell(colIndex));
  }

  private cellText(cell: ExcelJS.Cell) {
    const value = cell.value;
    if (value == null) return '';
    if (typeof value === 'object' && 'text' in value) {
      return String(value.text).trim();
    }
    if (typeof value === 'object' && 'result' in value) {
      return String(value.result ?? '').trim();
    }
    return String(value).trim();
  }
}
