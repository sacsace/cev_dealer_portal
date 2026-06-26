import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  private async getOrCreateCart(userId: string, dealerId: string) {
    return this.prisma.cart.upsert({
      where: { userId_dealerId: { userId, dealerId } },
      create: { userId, dealerId },
      update: {},
      include: {
        items: {
          include: {
            part: { include: { category: true } },
          },
        },
      },
    });
  }

  async getCart(user: { sub: string; dealerId?: string }) {
    if (!user.dealerId) throw new ForbiddenException('Dealer account required');
    const cart = await this.getOrCreateCart(user.sub, user.dealerId);
    return this.withTotals(cart);
  }

  async addItem(
    user: { sub: string; dealerId?: string },
    partId: string,
    quantity: number,
  ) {
    if (!user.dealerId) throw new ForbiddenException('Dealer account required');

    const part = await this.prisma.part.findUnique({ where: { id: partId } });
    if (!part) throw new NotFoundException('Part not found');
    if (part.stockQuantity < quantity) {
      throw new BadRequestException('Insufficient stock');
    }
    if (quantity < part.minimumOrderQty) {
      throw new BadRequestException(`Minimum order quantity is ${part.minimumOrderQty}`);
    }

    const cart = await this.getOrCreateCart(user.sub, user.dealerId);

    await this.prisma.cartItem.upsert({
      where: { cartId_partId: { cartId: cart.id, partId } },
      create: { cartId: cart.id, partId, quantity },
      update: { quantity: { increment: quantity } },
    });

    return this.getCart(user);
  }

  async updateItem(
    user: { sub: string; dealerId?: string },
    itemId: string,
    quantity: number,
  ) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true, part: true },
    });

    if (!item) throw new NotFoundException('Cart item not found');
    if (item.cart.userId !== user.sub) throw new ForbiddenException();

    if (quantity < item.part.minimumOrderQty) {
      throw new BadRequestException(`Minimum order quantity is ${item.part.minimumOrderQty}`);
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return this.getCart(user);
  }

  async removeItem(user: { sub: string; dealerId?: string }, itemId: string) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!item) throw new NotFoundException('Cart item not found');
    if (item.cart.userId !== user.sub) throw new ForbiddenException();

    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.getCart(user);
  }

  private withTotals(cart: {
    id: string;
    items: Array<{
      id: string;
      quantity: number;
      part: {
        id: string;
        partNumber: string;
        partName: string;
        dealerPrice: { toNumber?: () => number } | number;
        gstRate: { toNumber?: () => number } | number;
      };
    }>;
  }) {
    let subtotal = 0;
    let gstAmount = 0;

    const items = cart.items.map((item) => {
      const unitPrice = Number(item.part.dealerPrice);
      const gstRate = Number(item.part.gstRate);
      const lineSubtotal = unitPrice * item.quantity;
      const lineGst = (lineSubtotal * gstRate) / 100;
      subtotal += lineSubtotal;
      gstAmount += lineGst;

      return {
        ...item,
        unitPrice,
        gstRate,
        gstAmount: lineGst,
        totalAmount: lineSubtotal + lineGst,
      };
    });

    return {
      ...cart,
      items,
      subtotal,
      gstAmount,
      grandTotal: subtotal + gstAmount,
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    };
  }
}
