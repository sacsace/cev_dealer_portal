import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { OrderStatus, UserRole, PermissionModule, PermissionAction } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateOrderDto, RejectOrderDto, ShipOrderDto, UpdateShipmentDto } from './dto/order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermission } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER, UserRole.DEALER)
  findAll(
    @CurrentUser() user: { sub: string; role: UserRole; dealerId?: string },
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: OrderStatus,
    @Query('search') search?: string,
  ) {
    return this.ordersService.findAll(user, +page, +limit, status, search);
  }

  @Get(':id')
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER, UserRole.DEALER)
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { role: UserRole; dealerId?: string },
  ) {
    return this.ordersService.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.DEALER)
  create(
    @CurrentUser() user: { sub: string; role: UserRole; dealerId?: string },
    @Body() dto: CreateOrderDto,
    @Req() req: Request,
  ) {
    return this.ordersService.createFromCart(user, dto, req.ip);
  }

  @Put(':id/approve')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.ORDERS, PermissionAction.APPROVE)
  approve(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string; role: UserRole },
    @Req() req: Request,
  ) {
    return this.ordersService.approve(id, user, req.ip);
  }

  @Put(':id/reject')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.ORDERS, PermissionAction.REJECT)
  reject(
    @Param('id') id: string,
    @Body() dto: RejectOrderDto,
    @CurrentUser() user: { sub: string; role: UserRole },
    @Req() req: Request,
  ) {
    return this.ordersService.reject(id, dto, user, req.ip);
  }

  @Put(':id/ship')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.ORDERS, PermissionAction.EDIT)
  ship(
    @Param('id') id: string,
    @Body() dto: ShipOrderDto,
    @CurrentUser() user: { sub: string; role: UserRole },
    @Req() req: Request,
  ) {
    return this.ordersService.ship(id, dto, user, req.ip);
  }

  @Put(':id/shipment')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.ORDERS, PermissionAction.EDIT)
  updateShipment(
    @Param('id') id: string,
    @Body() dto: UpdateShipmentDto,
    @CurrentUser() user: { sub: string; role: UserRole },
    @Req() req: Request,
  ) {
    return this.ordersService.updateShipment(id, dto, user, req.ip);
  }
}
