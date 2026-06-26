import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, PartStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreatePartDto, PartSearchQuery, UpdatePartDto } from './dto/part.dto';

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
}
