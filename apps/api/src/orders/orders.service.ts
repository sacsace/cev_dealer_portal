import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, OrderStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CartService } from '../cart/cart.service';
import { getUploadRoot, deleteStoredFile } from '../common/utils/file-storage.util';
import { CreateOrderDto, RejectOrderDto, ShipOrderDto, UpdateShipmentDto } from './dto/order.dto';
import {
  buildProformaInvoiceNo,
  generateProformaInvoicePdf,
  resolveProformaInvoiceNo,
  saveProformaInvoicePdf,
} from './proforma-invoice.util';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private cartService: CartService,
  ) {}

  private readonly orderDetailInclude = {
    dealer: true,
    items: { include: { part: true } },
    shipment: true,
    invoice: true,
    reviewEntries: {
      orderBy: { createdAt: 'desc' as const },
    },
  };

  private async getActorName(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    return user?.name ?? 'Admin';
  }

  private async createOrderReviewEntry(
    orderId: string,
    actor: { sub: string; role: UserRole },
    data: {
      action: 'APPROVED' | 'REJECTED' | 'SHIPMENT_UPDATED';
      status?: OrderStatus;
      deliveryStatus?: string;
      courierName?: string;
      trackingNo?: string;
      note?: string;
    },
  ) {
    const authorName = await this.getActorName(actor.sub);
    await this.prisma.orderReviewEntry.create({
      data: {
        orderId,
        action: data.action,
        status: data.status,
        deliveryStatus: data.deliveryStatus,
        courierName: data.courierName,
        trackingNo: data.trackingNo,
        note: data.note,
        authorId: actor.sub,
        authorName,
        authorRole: actor.role,
      },
    });
  }

  async findAll(
    user: { sub: string; role: UserRole; dealerId?: string },
    page = 1,
    limit = 20,
    status?: OrderStatus,
    search?: string,
    pendingDelivery?: boolean,
  ) {
    const where: Record<string, unknown> = {};

    if (user.role === UserRole.DEALER) {
      if (!user.dealerId) throw new ForbiddenException();
      where.dealerId = user.dealerId;
    }

    if (pendingDelivery) {
      where.status = {
        notIn: [OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.REJECTED],
      };
    } else if (status) {
      where.status = status;
    }

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

    const normalizedData = data.map((order) => {
      if (!order.invoice) return order;
      const invoiceNo = resolveProformaInvoiceNo(order.orderNo, order.createdAt, order.invoice.invoiceNo);
      if (invoiceNo === order.invoice.invoiceNo) return order;
      return { ...order, invoice: { ...order.invoice, invoiceNo } };
    });

    return { data: normalizedData, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, user: { role: UserRole; dealerId?: string }) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: this.orderDetailInclude,
    });

    if (!order) throw new NotFoundException('Order not found');
    if (user.role === UserRole.DEALER && order.dealerId !== user.dealerId) {
      throw new ForbiddenException('Access denied');
    }

    if (order.invoice) {
      const invoiceNo = resolveProformaInvoiceNo(order.orderNo, order.createdAt, order.invoice.invoiceNo);
      if (invoiceNo !== order.invoice.invoiceNo) {
        order.invoice = await this.prisma.invoice.update({
          where: { orderId: order.id },
          data: { invoiceNo },
        });
      }
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

    await this.createProformaInvoice(order.id);

    await this.audit.log({
      userId: user.sub,
      userRole: user.role,
      action: AuditAction.CREATE,
      module: 'ORDERS',
      targetId: order.id,
      afterData: order,
      ipAddress: ip,
    });

    return this.findOne(order.id, user);
  }

  async createProformaInvoice(orderId: string) {
    const existing = await this.prisma.invoice.findUnique({ where: { orderId } });
    if (existing) return existing;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { dealer: true, items: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const invoiceNo = buildProformaInvoiceNo(order.orderNo, order.createdAt);
    const pdfBuffer = await generateProformaInvoicePdf(order, invoiceNo);
    const { fileUrl } = await saveProformaInvoicePdf(orderId, pdfBuffer);

    return this.prisma.invoice.create({
      data: {
        orderId,
        invoiceNo,
        invoiceUrl: fileUrl,
        invoiceAmount: order.grandTotal,
      },
    });
  }

  async getProformaInvoiceFile(
    id: string,
    user: { role: UserRole; dealerId?: string },
  ): Promise<{ buffer: Buffer; invoiceNo: string }> {
    await this.findOne(id, user);

    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { dealer: true, items: true, invoice: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const invoiceNo = resolveProformaInvoiceNo(order.orderNo, order.createdAt, order.invoice?.invoiceNo);
    const pdfBuffer = await generateProformaInvoicePdf(order, invoiceNo);
    const { fileUrl } = await saveProformaInvoicePdf(id, pdfBuffer);

    if (order.invoice) {
      await this.prisma.invoice.update({
        where: { orderId: id },
        data: { invoiceUrl: fileUrl, invoiceAmount: order.grandTotal, invoiceNo },
      });
    } else {
      await this.prisma.invoice.create({
        data: {
          orderId: id,
          invoiceNo,
          invoiceUrl: fileUrl,
          invoiceAmount: order.grandTotal,
        },
      });
    }

    return { buffer: pdfBuffer, invoiceNo };
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

    await this.createOrderReviewEntry(id, actor, {
      action: 'APPROVED',
      status: OrderStatus.APPROVED,
    });

    return this.findOne(id, actor);
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

    await this.createOrderReviewEntry(id, actor, {
      action: 'REJECTED',
      status: OrderStatus.REJECTED,
      note: dto.reason,
    });

    return this.findOne(id, actor);
  }

  async ship(id: string, dto: ShipOrderDto, actor: { sub: string; role: UserRole }, ip?: string) {
    return this.updateShipment(
      id,
      {
        courierName: dto.courierName,
        trackingNo: dto.trackingNo,
        deliveryStatus: 'IN_TRANSIT',
      },
      actor,
      ip,
    );
  }

  async updateShipment(
    id: string,
    dto: UpdateShipmentDto,
    actor: { sub: string; role: UserRole },
    ip?: string,
  ) {
    const before = await this.findOne(id, actor);

    const editableStatuses: OrderStatus[] = [
      OrderStatus.APPROVED,
      OrderStatus.PACKED,
      OrderStatus.ORDER_SHIPPED,
      OrderStatus.DELIVERED,
    ];

    if (!editableStatuses.includes(before.status)) {
      throw new BadRequestException('Shipment can only be updated for approved orders');
    }

    if (dto.deliveryStatus === 'PREPARING') {
      if (!dto.note?.trim()) {
        throw new BadRequestException('Comment is required when delivery status is Preparing');
      }
    } else if (!dto.courierName?.trim() || !dto.trackingNo?.trim()) {
      throw new BadRequestException('Courier and tracking number are required');
    }

    const statusMap: Record<UpdateShipmentDto['deliveryStatus'], OrderStatus> = {
      PREPARING: OrderStatus.PACKED,
      IN_TRANSIT: OrderStatus.ORDER_SHIPPED,
      DELIVERED: OrderStatus.DELIVERED,
    };

    const order = await this.prisma.order.update({
      where: { id },
      data: { status: statusMap[dto.deliveryStatus] },
    });

    const now = new Date();
    const isPreparing = dto.deliveryStatus === 'PREPARING';
    const shipmentData = {
      courierName: isPreparing ? null : dto.courierName!.trim(),
      trackingNo: isPreparing ? null : dto.trackingNo!.trim(),
      deliveryStatus: dto.deliveryStatus,
      dispatchDate:
        isPreparing ? null : before.shipment?.dispatchDate ?? now,
      deliveryDate: dto.deliveryStatus === 'DELIVERED' ? now : null,
    };

    await this.prisma.shipment.upsert({
      where: { orderId: id },
      create: {
        orderId: id,
        ...shipmentData,
        dispatchDate: shipmentData.dispatchDate ?? undefined,
      },
      update: shipmentData,
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

    await this.createOrderReviewEntry(id, actor, {
      action: 'SHIPMENT_UPDATED',
      status: statusMap[dto.deliveryStatus],
      deliveryStatus: dto.deliveryStatus,
      courierName: isPreparing ? undefined : dto.courierName!.trim(),
      trackingNo: isPreparing ? undefined : dto.trackingNo!.trim(),
      note: isPreparing ? dto.note!.trim() : undefined,
    });

    return this.findOne(id, actor);
  }

  async remove(id: string, actor: { sub: string; role: UserRole }, ip?: string) {
    if (actor.role !== UserRole.ROOT) {
      throw new ForbiddenException('Only ROOT can delete orders');
    }

    const before = await this.findOne(id, actor);

    if (before.invoice?.invoiceUrl) {
      await deleteStoredFile(before.invoice.invoiceUrl);
    }

    await this.prisma.order.delete({ where: { id } });

    await this.audit.log({
      userId: actor.sub,
      userRole: actor.role,
      action: AuditAction.DELETE,
      module: 'ORDERS',
      targetId: id,
      beforeData: before,
      ipAddress: ip,
    });

    return { message: 'Order deleted' };
  }
}
