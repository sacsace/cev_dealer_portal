import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, OrderStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CartService } from '../cart/cart.service';
import { CreateOrderDto, RejectOrderDto, ShipOrderDto } from './dto/order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private cartService: CartService,
  ) {}

  async findAll(
    user: { sub: string; role: UserRole; dealerId?: string },
    page = 1,
    limit = 20,
    status?: OrderStatus,
    search?: string,
  ) {
    const where: Record<string, unknown> = {};

    if (user.role === UserRole.DEALER) {
      if (!user.dealerId) throw new ForbiddenException();
      where.dealerId = user.dealerId;
    }

    if (status) where.status = status;

    if (search) {
      where.OR = [
        { orderNo: { contains: search, mode: 'insensitive' } },
        { shipment: { trackingNo: { contains: search, mode: 'insensitive' } } },
        { items: { some: { partNumber: { contains: search, mode: 'insensitive' } } } },
        { items: { some: { partName: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          dealer: true,
          items: true,
          shipment: true,
          invoice: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, user: { role: UserRole; dealerId?: string }) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        dealer: true,
        items: { include: { part: true } },
        shipment: true,
        invoice: true,
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (user.role === UserRole.DEALER && order.dealerId !== user.dealerId) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  async createFromCart(
    user: { sub: string; role: UserRole; dealerId?: string },
    dto: CreateOrderDto,
    ip?: string,
  ) {
    if (!user.dealerId) throw new ForbiddenException('Dealer account required');

    const cart = await this.cartService.getCart(user);
    if (!cart.items.length) throw new BadRequestException('Cart is empty');

    const orderNo = `ORD-${Date.now()}`;
    const freightCharge = dto.freightCharge ?? 0;

    const order = await this.prisma.order.create({
      data: {
        orderNo,
        dealerId: user.dealerId,
        createdById: user.sub,
        status: OrderStatus.SUBMITTED,
        billingAddress: dto.billingAddress,
        shippingAddress: dto.shippingAddress,
        contactPerson: dto.contactPerson,
        mobile: dto.mobile,
        email: dto.email,
        subtotal: cart.subtotal,
        gstAmount: cart.gstAmount,
        freightCharge,
        grandTotal: cart.grandTotal + freightCharge,
        items: {
          create: cart.items.map((item) => ({
            partId: item.part.id,
            partNumber: item.part.partNumber,
            partName: item.part.partName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            gstRate: item.gstRate,
            gstAmount: item.gstAmount,
            totalAmount: item.totalAmount,
          })),
        },
      },
      include: { items: true, dealer: true },
    });

    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    await this.audit.log({
      userId: user.sub,
      userRole: user.role,
      action: AuditAction.CREATE,
      module: 'ORDERS',
      targetId: order.id,
      afterData: order,
      ipAddress: ip,
    });

    return order;
  }

  async approve(id: string, actor: { sub: string; role: UserRole }, ip?: string) {
    const before = await this.findOne(id, actor);
    const order = await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.APPROVED },
    });

    await this.audit.log({
      userId: actor.sub,
      userRole: actor.role,
      action: AuditAction.APPROVE,
      module: 'ORDERS',
      targetId: id,
      beforeData: before,
      afterData: order,
      ipAddress: ip,
    });

    return order;
  }

  async reject(id: string, dto: RejectOrderDto, actor: { sub: string; role: UserRole }, ip?: string) {
    const before = await this.findOne(id, actor);
    const order = await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.REJECTED },
    });

    await this.audit.log({
      userId: actor.sub,
      userRole: actor.role,
      action: AuditAction.REJECT,
      module: 'ORDERS',
      targetId: id,
      beforeData: before,
      afterData: { ...order, reason: dto.reason },
      ipAddress: ip,
    });

    return order;
  }

  async ship(id: string, dto: ShipOrderDto, actor: { sub: string; role: UserRole }, ip?: string) {
    const before = await this.findOne(id, actor);

    const order = await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.ORDER_SHIPPED },
    });

    await this.prisma.shipment.upsert({
      where: { orderId: id },
      create: {
        orderId: id,
        courierName: dto.courierName,
        trackingNo: dto.trackingNo,
        dispatchDate: dto.dispatchDate ? new Date(dto.dispatchDate) : new Date(),
        deliveryStatus: 'In Transit',
      },
      update: {
        courierName: dto.courierName,
        trackingNo: dto.trackingNo,
        dispatchDate: dto.dispatchDate ? new Date(dto.dispatchDate) : new Date(),
        deliveryStatus: 'In Transit',
      },
    });

    await this.audit.log({
      userId: actor.sub,
      userRole: actor.role,
      action: AuditAction.UPDATE,
      module: 'ORDERS',
      targetId: id,
      beforeData: before,
      afterData: order,
      ipAddress: ip,
    });

    return this.findOne(id, actor);
  }
}
