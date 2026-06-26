import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CartService } from './cart.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('cart')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DEALER)
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: { sub: string; dealerId?: string }) {
    return this.cartService.getCart(user);
  }

  @Post('items')
  addItem(
    @CurrentUser() user: { sub: string; dealerId?: string },
    @Body() body: AddCartItemDto & { partId: string },
  ) {
    return this.cartService.addItem(user, body.partId, body.quantity);
  }

  @Put('items/:id')
  updateItem(
    @CurrentUser() user: { sub: string; dealerId?: string },
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(user, id, dto.quantity);
  }

  @Delete('items/:id')
  removeItem(
    @CurrentUser() user: { sub: string; dealerId?: string },
    @Param('id') id: string,
  ) {
    return this.cartService.removeItem(user, id);
  }
}
