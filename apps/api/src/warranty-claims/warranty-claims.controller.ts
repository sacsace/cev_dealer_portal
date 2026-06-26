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
import { WarrantyClaimsService } from './warranty-claims.service';
import {
  ApproveWarrantyClaimDto,
  CreateWarrantyClaimDto,
  RejectWarrantyClaimDto,
} from './dto/warranty-claim.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermission } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('warranty-claims')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WarrantyClaimsController {
  constructor(private warrantyClaimsService: WarrantyClaimsService) {}

  @Get()
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER, UserRole.DEALER)
  findAll(
    @CurrentUser() user: { role: UserRole; dealerId?: string },
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    return this.warrantyClaimsService.findAll(user, +page, +limit, search);
  }

  @Get(':id')
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER, UserRole.DEALER)
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { role: UserRole; dealerId?: string },
  ) {
    return this.warrantyClaimsService.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.DEALER)
  create(
    @Body() dto: CreateWarrantyClaimDto,
    @CurrentUser() user: {
      sub: string;
      role: UserRole;
      dealerId?: string;
      dealer?: { dealerName: string; dealerCode: string };
    },
    @Req() req: Request,
  ) {
    return this.warrantyClaimsService.create(dto, user, req.ip);
  }

  @Put(':id')
  @Roles(UserRole.DEALER, UserRole.ADMIN, UserRole.ROOT)
  update(
    @Param('id') id: string,
    @Body() dto: CreateWarrantyClaimDto,
    @CurrentUser() user: { sub: string; role: UserRole; dealerId?: string },
    @Req() req: Request,
  ) {
    return this.warrantyClaimsService.update(id, dto, user, req.ip);
  }

  @Put(':id/submit')
  @Roles(UserRole.DEALER)
  submit(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string; role: UserRole; dealerId?: string },
    @Req() req: Request,
  ) {
    return this.warrantyClaimsService.submit(id, user, req.ip);
  }

  @Put(':id/approve')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.WARRANTY_CLAIMS, PermissionAction.APPROVE)
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveWarrantyClaimDto,
    @CurrentUser() user: { sub: string; role: UserRole },
    @Req() req: Request,
  ) {
    return this.warrantyClaimsService.approve(id, dto, user, req.ip);
  }

  @Put(':id/reject')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.WARRANTY_CLAIMS, PermissionAction.REJECT)
  reject(
    @Param('id') id: string,
    @Body() dto: RejectWarrantyClaimDto,
    @CurrentUser() user: { sub: string; role: UserRole },
    @Req() req: Request,
  ) {
    return this.warrantyClaimsService.reject(id, dto, user, req.ip);
  }

  @Delete(':id')
  @Roles(UserRole.DEALER, UserRole.ADMIN, UserRole.ROOT)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string; role: UserRole; dealerId?: string },
    @Req() req: Request,
  ) {
    return this.warrantyClaimsService.remove(id, user, req.ip);
  }
}
