import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CreateFitmentDto, UpdateFitmentDto } from './dto/fitment.dto';
import { CreateJobCardTypeDto, UpdateJobCardTypeDto } from './dto/job-card-type.dto';
import { CreateProblemTypeDto, UpdateProblemTypeDto } from './dto/problem-type.dto';
import { CreateVehicleModelDto, UpdateVehicleModelDto } from './dto/vehicle-model.dto';

@Injectable()
export class LookupService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  getCategories() {
    return this.prisma.category.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
    });
  }

  findAllCategories(page = 1, limit = 20, search?: string) {
    const where: Prisma.CategoryWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    return this.paginate(
      this.prisma.category.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.category.count({ where }),
      page,
      limit,
    );
  }

  async findOneCategory(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  getModels() {
    return this.prisma.vehicleModel.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { modelName: 'asc' },
    });
  }

  findAllModels(page = 1, limit = 20, search?: string) {
    const where: Prisma.VehicleModelWhereInput = search
      ? {
          OR: [
            { modelName: { contains: search, mode: 'insensitive' } },
            { modelCode: { contains: search, mode: 'insensitive' } },
            { year: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    return this.paginate(
      this.prisma.vehicleModel.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { modelName: 'asc' },
      }),
      this.prisma.vehicleModel.count({ where }),
      page,
      limit,
    );
  }

  async findOneModel(id: string) {
    const model = await this.prisma.vehicleModel.findUnique({ where: { id } });
    if (!model) throw new NotFoundException('Vehicle model not found');
    return model;
  }

  async createModel(
    dto: CreateVehicleModelDto,
    actor: { sub: string; role: UserRole },
    ip?: string,
  ) {
    const existing = await this.prisma.vehicleModel.findUnique({
      where: { modelCode: dto.modelCode },
    });
    if (existing) throw new ConflictException('Model code already exists');

    const model = await this.prisma.vehicleModel.create({
      data: {
        modelName: dto.modelName,
        modelCode: dto.modelCode,
        year: dto.year,
        status: dto.status ?? 'ACTIVE',
      },
    });

    await this.audit.log({
      userId: actor.sub,
      userRole: actor.role,
      action: AuditAction.CREATE,
      module: 'PARTS',
      targetId: model.id,
      afterData: model,
      ipAddress: ip,
    });

    return model;
  }

  async updateModel(
    id: string,
    dto: UpdateVehicleModelDto,
    actor: { sub: string; role: UserRole },
    ip?: string,
  ) {
    const before = await this.findOneModel(id);

    if (dto.modelCode && dto.modelCode !== before.modelCode) {
      const existing = await this.prisma.vehicleModel.findUnique({
        where: { modelCode: dto.modelCode },
      });
      if (existing) throw new ConflictException('Model code already exists');
    }

    const model = await this.prisma.vehicleModel.update({ where: { id }, data: dto });

    await this.audit.log({
      userId: actor.sub,
      userRole: actor.role,
      action: AuditAction.UPDATE,
      module: 'PARTS',
      targetId: model.id,
      beforeData: before,
      afterData: model,
      ipAddress: ip,
    });

    return model;
  }

  async removeModel(id: string, actor: { sub: string; role: UserRole }, ip?: string) {
    const before = await this.findOneModel(id);

    const [partMappings, jobCards] = await Promise.all([
      this.prisma.partModelMapping.count({ where: { modelId: id } }),
      this.prisma.jobCard.count({ where: { carModelId: id } }),
    ]);

    if (partMappings + jobCards > 0) {
      throw new BadRequestException(
        'Cannot delete model linked to parts or job cards',
      );
    }

    await this.prisma.vehicleModel.delete({ where: { id } });

    await this.audit.log({
      userId: actor.sub,
      userRole: actor.role,
      action: AuditAction.DELETE,
      module: 'PARTS',
      targetId: id,
      beforeData: before,
      ipAddress: ip,
    });

    return { message: 'Vehicle model deleted' };
  }

  getProblemTypes() {
    return this.prisma.problemType.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  findAllProblemTypes(page = 1, limit = 20, search?: string) {
    const where: Prisma.ProblemTypeWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { nameEn: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    return this.paginate(
      this.prisma.problemType.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.problemType.count({ where }),
      page,
      limit,
    );
  }

  async findOneProblemType(id: string) {
    const item = await this.prisma.problemType.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Problem type not found');
    return item;
  }

  async createProblemType(
    dto: CreateProblemTypeDto,
    actor: { sub: string; role: UserRole },
    ip?: string,
  ) {
    const existing = await this.prisma.problemType.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException('Problem type name already exists');

    const item = await this.prisma.problemType.create({
      data: {
        name: dto.name,
        nameEn: dto.nameEn,
        sortOrder: dto.sortOrder ?? 0,
        status: dto.status ?? 'ACTIVE',
      },
    });

    await this.audit.log({
      userId: actor.sub,
      userRole: actor.role,
      action: AuditAction.CREATE,
      module: 'JOB_CARDS',
      targetId: item.id,
      afterData: item,
      ipAddress: ip,
    });

    return item;
  }

  async updateProblemType(
    id: string,
    dto: UpdateProblemTypeDto,
    actor: { sub: string; role: UserRole },
    ip?: string,
  ) {
    const before = await this.findOneProblemType(id);

    if (dto.name && dto.name !== before.name) {
      const existing = await this.prisma.problemType.findUnique({ where: { name: dto.name } });
      if (existing) throw new ConflictException('Problem type name already exists');
    }

    const item = await this.prisma.problemType.update({ where: { id }, data: dto });

    await this.audit.log({
      userId: actor.sub,
      userRole: actor.role,
      action: AuditAction.UPDATE,
      module: 'JOB_CARDS',
      targetId: item.id,
      beforeData: before,
      afterData: item,
      ipAddress: ip,
    });

    return item;
  }

  async removeProblemType(id: string, actor: { sub: string; role: UserRole }, ip?: string) {
    const before = await this.findOneProblemType(id);

    const jobCardCount = await this.prisma.jobCard.count({
      where: { typeOfProblem: before.name },
    });

    if (jobCardCount > 0) {
      throw new BadRequestException('Cannot delete problem type used in job cards');
    }

    await this.prisma.problemType.delete({ where: { id } });

    await this.audit.log({
      userId: actor.sub,
      userRole: actor.role,
      action: AuditAction.DELETE,
      module: 'JOB_CARDS',
      targetId: id,
      beforeData: before,
      ipAddress: ip,
    });

    return { message: 'Problem type deleted' };
  }

  getJobCardTypes() {
    return this.prisma.jobCardType.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  findAllJobCardTypes(page = 1, limit = 20, search?: string) {
    const where: Prisma.JobCardTypeWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { nameEn: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    return this.paginate(
      this.prisma.jobCardType.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.jobCardType.count({ where }),
      page,
      limit,
    );
  }

  async findOneJobCardType(id: string) {
    const item = await this.prisma.jobCardType.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Job card type not found');
    return item;
  }

  async createJobCardType(
    dto: CreateJobCardTypeDto,
    actor: { sub: string; role: UserRole },
    ip?: string,
  ) {
    const existing = await this.prisma.jobCardType.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException('Type name already exists');

    const item = await this.prisma.jobCardType.create({
      data: {
        name: dto.name,
        nameEn: dto.nameEn,
        sortOrder: dto.sortOrder ?? 0,
        status: dto.status ?? 'ACTIVE',
      },
    });

    await this.audit.log({
      userId: actor.sub,
      userRole: actor.role,
      action: AuditAction.CREATE,
      module: 'JOB_CARDS',
      targetId: item.id,
      afterData: item,
      ipAddress: ip,
    });

    return item;
  }

  async updateJobCardType(
    id: string,
    dto: UpdateJobCardTypeDto,
    actor: { sub: string; role: UserRole },
    ip?: string,
  ) {
    const before = await this.findOneJobCardType(id);

    if (dto.name && dto.name !== before.name) {
      const existing = await this.prisma.jobCardType.findUnique({ where: { name: dto.name } });
      if (existing) throw new ConflictException('Type name already exists');
    }

    const item = await this.prisma.jobCardType.update({ where: { id }, data: dto });

    await this.audit.log({
      userId: actor.sub,
      userRole: actor.role,
      action: AuditAction.UPDATE,
      module: 'JOB_CARDS',
      targetId: item.id,
      beforeData: before,
      afterData: item,
      ipAddress: ip,
    });

    return item;
  }

  async removeJobCardType(id: string, actor: { sub: string; role: UserRole }, ip?: string) {
    const before = await this.findOneJobCardType(id);

    const jobCardCount = await this.prisma.jobCard.count({
      where: { type: before.name },
    });

    if (jobCardCount > 0) {
      throw new BadRequestException('Cannot delete type used in job cards');
    }

    await this.prisma.jobCardType.delete({ where: { id } });

    await this.audit.log({
      userId: actor.sub,
      userRole: actor.role,
      action: AuditAction.DELETE,
      module: 'JOB_CARDS',
      targetId: id,
      beforeData: before,
      ipAddress: ip,
    });

    return { message: 'Job card type deleted' };
  }

  getFitments() {
    return this.prisma.fitment.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  findAllFitments(page = 1, limit = 20, search?: string) {
    const where: Prisma.FitmentWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { nameEn: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    return this.paginate(
      this.prisma.fitment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.fitment.count({ where }),
      page,
      limit,
    );
  }

  async findOneFitment(id: string) {
    const item = await this.prisma.fitment.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Fitment not found');
    return item;
  }

  async createFitment(
    dto: CreateFitmentDto,
    actor: { sub: string; role: UserRole },
    ip?: string,
  ) {
    const existing = await this.prisma.fitment.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException('Fitment name already exists');

    const item = await this.prisma.fitment.create({
      data: {
        name: dto.name,
        nameEn: dto.nameEn,
        sortOrder: dto.sortOrder ?? 0,
        status: dto.status ?? 'ACTIVE',
      },
    });

    await this.audit.log({
      userId: actor.sub,
      userRole: actor.role,
      action: AuditAction.CREATE,
      module: 'PARTS',
      targetId: item.id,
      afterData: item,
      ipAddress: ip,
    });

    return item;
  }

  async updateFitment(
    id: string,
    dto: UpdateFitmentDto,
    actor: { sub: string; role: UserRole },
    ip?: string,
  ) {
    const before = await this.findOneFitment(id);

    if (dto.name && dto.name !== before.name) {
      const existing = await this.prisma.fitment.findUnique({ where: { name: dto.name } });
      if (existing) throw new ConflictException('Fitment name already exists');
    }

    const item = await this.prisma.fitment.update({ where: { id }, data: dto });

    await this.audit.log({
      userId: actor.sub,
      userRole: actor.role,
      action: AuditAction.UPDATE,
      module: 'PARTS',
      targetId: item.id,
      beforeData: before,
      afterData: item,
      ipAddress: ip,
    });

    return item;
  }

  async removeFitment(id: string, actor: { sub: string; role: UserRole }, ip?: string) {
    const before = await this.findOneFitment(id);

    const jobCardCount = await this.prisma.jobCard.count({
      where: { fitment: before.name },
    });

    if (jobCardCount > 0) {
      throw new BadRequestException('Cannot delete fitment used in job cards');
    }

    await this.prisma.fitment.delete({ where: { id } });

    await this.audit.log({
      userId: actor.sub,
      userRole: actor.role,
      action: AuditAction.DELETE,
      module: 'PARTS',
      targetId: id,
      beforeData: before,
      ipAddress: ip,
    });

    return { message: 'Fitment deleted' };
  }

  private async paginate<T>(
    dataPromise: Promise<T[]>,
    countPromise: Promise<number>,
    page: number,
    limit: number,
  ) {
    const [data, total] = await Promise.all([dataPromise, countPromise]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async createCategory(
    dto: CreateCategoryDto,
    actor: { sub: string; role: UserRole },
    ip?: string,
  ) {
    const existing = await this.prisma.category.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException('Category name already exists');

    const category = await this.prisma.category.create({ data: dto });

    await this.audit.log({
      userId: actor.sub,
      userRole: actor.role,
      action: AuditAction.CREATE,
      module: 'PARTS',
      targetId: category.id,
      afterData: category,
      ipAddress: ip,
    });

    return category;
  }

  async updateCategory(
    id: string,
    dto: UpdateCategoryDto,
    actor: { sub: string; role: UserRole },
    ip?: string,
  ) {
    const before = await this.prisma.category.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Category not found');

    if (dto.name && dto.name !== before.name) {
      const existing = await this.prisma.category.findUnique({ where: { name: dto.name } });
      if (existing) throw new ConflictException('Category name already exists');
    }

    const category = await this.prisma.category.update({ where: { id }, data: dto });

    await this.audit.log({
      userId: actor.sub,
      userRole: actor.role,
      action: AuditAction.UPDATE,
      module: 'PARTS',
      targetId: category.id,
      beforeData: before,
      afterData: category,
      ipAddress: ip,
    });

    return category;
  }

  async removeCategory(id: string, actor: { sub: string; role: UserRole }, ip?: string) {
    const before = await this.findOneCategory(id);

    const partCount = await this.prisma.part.count({ where: { categoryId: id } });
    if (partCount > 0) {
      throw new BadRequestException('Cannot delete category linked to parts');
    }

    await this.prisma.category.delete({ where: { id } });

    await this.audit.log({
      userId: actor.sub,
      userRole: actor.role,
      action: AuditAction.DELETE,
      module: 'PARTS',
      targetId: id,
      beforeData: before,
      ipAddress: ip,
    });

    return { message: 'Category deleted' };
  }
}
