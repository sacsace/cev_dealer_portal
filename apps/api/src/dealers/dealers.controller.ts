import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { UserRole, PermissionModule, PermissionAction } from '@prisma/client';
import { DealersService } from './dealers.service';
import { CreateDealerDto, UpdateDealerDto } from './dto/dealer.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermission } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('dealers')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class DealersController {
  constructor(private dealersService: DealersService) {}

  @Get()
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.DEALER, PermissionAction.VIEW)
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    return this.dealersService.findAll(+page, +limit, search);
  }

  @Get('next-code')
  @Roles(UserRole.ROOT, UserRole.ADMIN)
  @RequirePermission(PermissionModule.DEALER, PermissionAction.CREATE)
  getNextCode() {
    return this.dealersService.getNextDealerCode();
  }

  @Get(':id')
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER, UserRole.DEALER)
  findOne(@Param('id') id: string, @CurrentUser() user: { role: UserRole; dealerId?: string }) {
    return this.dealersService.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.ROOT, UserRole.ADMIN)
  @RequirePermission(PermissionModule.DEALER, PermissionAction.CREATE)
  create(
    @Body() dto: CreateDealerDto,
    @CurrentUser() user: { sub: string; role: UserRole },
    @Req() req: Request,
  ) {
    return this.dealersService.create(dto, user, req.ip);
  }

  @Put(':id')
  @Roles(UserRole.ROOT, UserRole.ADMIN)
  @RequirePermission(PermissionModule.DEALER, PermissionAction.EDIT)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDealerDto,
    @CurrentUser() user: { sub: string; role: UserRole },
    @Req() req: Request,
  ) {
    return this.dealersService.update(id, dto, user, req.ip);
  }

  @Delete(':id')
  @Roles(UserRole.ROOT, UserRole.ADMIN)
  @RequirePermission(PermissionModule.DEALER, PermissionAction.DELETE)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string; role: UserRole },
    @Req() req: Request,
  ) {
    return this.dealersService.remove(id, user, req.ip);
  }
}
