import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as ExcelJS from 'exceljs';
import { AuditAction, DealerStatus, Prisma, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateDealerDto, UpdateDealerDto } from './dto/dealer.dto';

const STAFF_ROLES: UserRole[] = [UserRole.ROOT, UserRole.ADMIN, UserRole.USER];

const BULK_TEMPLATE_COLUMNS = [
  { header: 'Dealer Name', key: 'dealerName', width: 24 },
  { header: 'Dealer Code', key: 'dealerCode', width: 14 },
  { header: 'Email', key: 'email', width: 26 },
  { header: 'Password', key: 'password', width: 16 },
  { header: 'Mobile', key: 'mobile', width: 14 },
  { header: 'Address', key: 'address', width: 28 },
  { header: 'City', key: 'city', width: 16 },
  { header: 'State', key: 'state', width: 16 },
  { header: 'GST Number', key: 'gstNumber', width: 18 },
  { header: 'Contact Person', key: 'contactPerson', width: 18 },
  { header: 'Login ID', key: 'loginId', width: 14 },
  { header: 'Status', key: 'status', width: 12 },
] as const;

const BULK_HEADER_MAP: Record<string, keyof CreateDealerDto | 'status'> = {
  dealername: 'dealerName',
  'dealer name': 'dealerName',
  딜러명: 'dealerName',
  dealercode: 'dealerCode',
  'dealer code': 'dealerCode',
  '딜러 코드': 'dealerCode',
  email: 'email',
  이메일: 'email',
  password: 'password',
  비밀번호: 'password',
  'portal password': 'password',
  '포털 비밀번호': 'password',
  mobile: 'mobile',
  휴대폰: 'mobile',
  address: 'address',
  주소: 'address',
  city: 'city',
  도시: 'city',
  state: 'state',
  '주/도': 'state',
  gstnumber: 'gstNumber',
  'gst number': 'gstNumber',
  gst: 'gstNumber',
  contactperson: 'contactPerson',
  'contact person': 'contactPerson',
  담당자: 'contactPerson',
  loginid: 'loginId',
  'login id': 'loginId',
  '로그인 id': 'loginId',
  status: 'status',
  상태: 'status',
};

type BulkDealerRow = {
  dealerName: string;
  dealerCode?: string;
  email: string;
  password: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  gstNumber?: string;
  contactPerson?: string;
  loginId?: string;
  status?: DealerStatus;
};

type BulkImportFailure = { row: number; dealerName?: string; error: string };

const dealerInclude = {
  contactUser: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
} satisfies Prisma.DealerInclude;

@Injectable()
export class DealersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  findAll(page = 1, limit = 20, search?: string) {
    const where = search
      ? {
          OR: [
            { dealerName: { contains: search, mode: 'insensitive' as const } },
            { dealerCode: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    return this.paginate(
      this.prisma.dealer.findMany({
        where,
        include: dealerInclude,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.dealer.count({ where }),
      page,
      limit,
    );
  }

  async findOne(id: string, user: { role: UserRole; dealerId?: string }) {
    const dealer = await this.prisma.dealer.findUnique({
      where: { id },
      include: dealerInclude,
    });
    if (!dealer) throw new NotFoundException('Dealer not found');

    if (user.role === UserRole.DEALER && user.dealerId !== id) {
      throw new ForbiddenException('Access denied');
    }

    return dealer;
  }

  private async resolveContactUser(contactUserId?: string | null) {
    if (!contactUserId) return null;

    const contactUser = await this.prisma.user.findFirst({
      where: {
        id: contactUserId,
        role: { in: STAFF_ROLES },
        dealerId: null,
        status: UserStatus.ACTIVE,
      },
    });

    if (!contactUser) {
      throw new BadRequestException('Invalid contact user');
    }

    return contactUser;
  }

  async getNextDealerCode() {
    const dealerCode = await this.generateNextDealerCode();
    return { dealerCode };
  }

  private async generateNextDealerCode(): Promise<string> {
    const dealers = await this.prisma.dealer.findMany({
      where: {
        dealerCode: {
          startsWith: 'FH',
          mode: 'insensitive',
        },
      },
      select: { dealerCode: true },
    });

    let maxNum = 0;
    for (const { dealerCode } of dealers) {
      const match = /^FH(\d+)$/i.exec(dealerCode.trim());
      if (match) {
        maxNum = Math.max(maxNum, Number.parseInt(match[1], 10));
      }
    }

    return `FH${String(maxNum + 1).padStart(3, '0')}`;
  }

  async create(dto: CreateDealerDto, actor: { sub: string; role: UserRole }, ip?: string) {
    const contactUser = await this.resolveContactUser(dto.contactUserId);
    const dealerCode = dto.dealerCode?.trim() || (await this.generateNextDealerCode());
    const loginId = dto.loginId?.trim() || dealerCode;
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const dealer = await this.prisma.dealer.create({
      data: {
        dealerName: dto.dealerName,
        dealerCode,
        email: dto.email,
        mobile: dto.mobile,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        gstNumber: dto.gstNumber,
        contactPerson: contactUser?.name ?? dto.contactPerson,
        ...(contactUser ? { contactUser: { connect: { id: contactUser.id } } } : {}),
        loginId,
        status: dto.status,
      },
      include: dealerInclude,
    });

    await this.prisma.user.create({
      data: {
        name: dto.dealerName,
        email: dto.email,
        loginId,
        mobile: dto.mobile,
        passwordHash,
        role: UserRole.DEALER,
        dealerId: dealer.id,
      },
    });

    await this.audit.log({
      userId: actor.sub,
      userRole: actor.role,
      action: AuditAction.CREATE,
      module: 'DEALER',
      targetId: dealer.id,
      afterData: dealer,
      ipAddress: ip,
    });

    return dealer;
  }

  async update(
    id: string,
    dto: UpdateDealerDto,
    actor: { sub: string; role: UserRole },
    ip?: string,
  ) {
    const before = await this.prisma.dealer.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Dealer not found');

    const contactUser =
      dto.contactUserId !== undefined
        ? await this.resolveContactUser(dto.contactUserId || null)
        : undefined;

    const dealerData: Prisma.DealerUpdateInput = {
      ...(dto.dealerName !== undefined ? { dealerName: dto.dealerName } : {}),
      ...(dto.email !== undefined ? { email: dto.email } : {}),
      ...(dto.mobile !== undefined ? { mobile: dto.mobile } : {}),
      ...(dto.address !== undefined ? { address: dto.address } : {}),
      ...(dto.city !== undefined ? { city: dto.city } : {}),
      ...(dto.state !== undefined ? { state: dto.state } : {}),
      ...(dto.gstNumber !== undefined ? { gstNumber: dto.gstNumber } : {}),
      ...(dto.loginId !== undefined ? { loginId: dto.loginId || before.dealerCode } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
    };

    if (dto.contactUserId !== undefined) {
      dealerData.contactUser = contactUser
        ? { connect: { id: contactUser.id } }
        : { disconnect: true };
      dealerData.contactPerson = contactUser?.name ?? null;
    } else if (dto.contactPerson !== undefined) {
      dealerData.contactPerson = dto.contactPerson;
    }

    const dealer = await this.prisma.dealer.update({
      where: { id },
      data: dealerData,
      include: dealerInclude,
    });

    const userData: {
      name?: string;
      email?: string;
      mobile?: string | null;
      loginId?: string | null;
      status?: UserStatus;
      passwordHash?: string;
    } = {};

    if (dto.dealerName !== undefined) userData.name = dto.dealerName;
    if (dto.email !== undefined) userData.email = dto.email;
    if (dto.mobile !== undefined) userData.mobile = dto.mobile;
    if (dto.loginId !== undefined) userData.loginId = dto.loginId || before.dealerCode;
    if (dto.status !== undefined) userData.status = dto.status as UserStatus;
    if (dto.password) userData.passwordHash = await bcrypt.hash(dto.password, 10);

    if (Object.keys(userData).length > 0) {
      await this.prisma.user.updateMany({
        where: { dealerId: id, role: UserRole.DEALER },
        data: userData,
      });
    }

    await this.audit.log({
      userId: actor.sub,
      userRole: actor.role,
      action: AuditAction.UPDATE,
      module: 'DEALER',
      targetId: id,
      beforeData: before,
      afterData: dealer,
      ipAddress: ip,
    });

    return dealer;
  }

  async remove(id: string, actor: { sub: string; role: UserRole }, ip?: string) {
    const before = await this.prisma.dealer.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Dealer not found');

    const [orders, jobCards, claims] = await Promise.all([
      this.prisma.order.count({ where: { dealerId: id } }),
      this.prisma.jobCard.count({ where: { dealerId: id } }),
      this.prisma.warrantyClaim.count({ where: { dealerId: id } }),
    ]);

    if (orders + jobCards + claims > 0) {
      throw new BadRequestException(
        'Cannot delete dealer with existing orders, job cards, or warranty claims',
      );
    }

    await this.prisma.$transaction([
      this.prisma.user.deleteMany({ where: { dealerId: id } }),
      this.prisma.cart.deleteMany({ where: { dealerId: id } }),
      this.prisma.dealer.delete({ where: { id } }),
    ]);

    await this.audit.log({
      userId: actor.sub,
      userRole: actor.role,
      action: AuditAction.DELETE,
      module: 'DEALER',
      targetId: id,
      beforeData: before,
      ipAddress: ip,
    });

    return { message: 'Dealer deleted' };
  }

  async buildBulkTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CEV Dealer Portal';
    const sheet = workbook.addWorksheet('Dealers');
    sheet.columns = BULK_TEMPLATE_COLUMNS.map((col) => ({ ...col }));

    sheet.addRow({
      dealerName: 'Example Hyundai',
      dealerCode: '',
      email: 'dealer@example.com',
      password: 'Dealer@123',
      mobile: '9876543210',
      address: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      gstNumber: '',
      contactPerson: '',
      loginId: '',
      status: 'ACTIVE',
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
    if (!fieldIndexes.dealerName || !fieldIndexes.email || !fieldIndexes.password) {
      throw new BadRequestException(
        'Excel must include Dealer Name, Email, and Password columns',
      );
    }

    const failures: BulkImportFailure[] = [];
    let created = 0;

    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
      const row = sheet.getRow(rowNumber);
      const parsed = this.parseBulkDealerRow(row, fieldIndexes, rowNumber);
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
          dealerName: parsed.data.dealerName,
          error: err instanceof Error ? err.message : 'Failed to create dealer',
        });
      }
    }

    if (created === 0 && failures.length === 0) {
      throw new BadRequestException('No dealer rows found in the Excel file');
    }

    return { created, failed: failures };
  }

  private mapBulkHeaderIndexes(sheet: ExcelJS.Worksheet) {
    const headerRow = sheet.getRow(1);
    const indexes: Partial<Record<keyof BulkDealerRow, number>> = {};

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

  private parseBulkDealerRow(
    row: ExcelJS.Row,
    indexes: Partial<Record<keyof BulkDealerRow, number>>,
    rowNumber: number,
  ):
    | { data: CreateDealerDto }
    | { error: BulkImportFailure }
    | null {
    const dealerName = this.readBulkCell(row, indexes.dealerName);
    const email = this.readBulkCell(row, indexes.email);
    const password = this.readBulkCell(row, indexes.password);
    const dealerCode = this.readBulkCell(row, indexes.dealerCode);
    const mobile = this.readBulkCell(row, indexes.mobile);
    const address = this.readBulkCell(row, indexes.address);
    const city = this.readBulkCell(row, indexes.city);
    const state = this.readBulkCell(row, indexes.state);
    const gstNumber = this.readBulkCell(row, indexes.gstNumber);
    const contactPerson = this.readBulkCell(row, indexes.contactPerson);
    const loginId = this.readBulkCell(row, indexes.loginId);
    const statusRaw = this.readBulkCell(row, indexes.status);

    if (!dealerName && !email && !password) return null;

    if (!dealerName || !email || !password) {
      return {
        error: {
          row: rowNumber,
          dealerName: dealerName || undefined,
          error: 'Dealer name, email, and password are required',
        },
      };
    }

    if (password.length < 6) {
      return {
        error: {
          row: rowNumber,
          dealerName,
          error: 'Password must be at least 6 characters',
        },
      };
    }

    let status: DealerStatus = DealerStatus.ACTIVE;
    if (statusRaw) {
      const normalized = statusRaw.toUpperCase();
      if (!Object.values(DealerStatus).includes(normalized as DealerStatus)) {
        return {
          error: {
            row: rowNumber,
            dealerName,
            error: 'Invalid status (use ACTIVE, INACTIVE, or SUSPENDED)',
          },
        };
      }
      status = normalized as DealerStatus;
    }

    const data: CreateDealerDto = {
      dealerName,
      email,
      password,
      status,
      ...(dealerCode ? { dealerCode } : {}),
      ...(mobile ? { mobile } : {}),
      ...(address ? { address } : {}),
      ...(city ? { city } : {}),
      ...(state ? { state } : {}),
      ...(gstNumber ? { gstNumber } : {}),
      ...(contactPerson ? { contactPerson } : {}),
      ...(loginId ? { loginId } : {}),
    };

    return { data };
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

  private async paginate<T>(dataPromise: Promise<T[]>, countPromise: Promise<number>, page: number, limit: number) {
    const [data, total] = await Promise.all([dataPromise, countPromise]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
