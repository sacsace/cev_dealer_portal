import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { PermissionAction, PermissionModule, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermission } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LookupService } from './lookup.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CreateFitmentDto, UpdateFitmentDto } from './dto/fitment.dto';
import { CreateJobCardTypeDto, UpdateJobCardTypeDto } from './dto/job-card-type.dto';
import { CreateProblemTypeDto, UpdateProblemTypeDto } from './dto/problem-type.dto';
import { CreateVehicleModelDto, UpdateVehicleModelDto } from './dto/vehicle-model.dto';

@Controller('lookup')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LookupController {
  constructor(private lookupService: LookupService) {}

  @Get('categories')
  getCategories() {
    return this.lookupService.getCategories();
  }

  @Get('categories/manage')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.PARTS, PermissionAction.VIEW)
  findAllCategories(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    return this.lookupService.findAllCategories(+page, +limit, search);
  }

  @Get('categories/:id')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.PARTS, PermissionAction.VIEW)
  findOneCategory(@Param('id') id: string) {
    return this.lookupService.findOneCategory(id);
  }

  @Get('models')
  getModels() {
    return this.lookupService.getModels();
  }

  @Get('models/manage')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.PARTS, PermissionAction.VIEW)
  findAllModels(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    return this.lookupService.findAllModels(+page, +limit, search);
  }

  @Get('models/:id')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.PARTS, PermissionAction.VIEW)
  findOneModel(@Param('id') id: string) {
    return this.lookupService.findOneModel(id);
  }

  @Post('models')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.PARTS, PermissionAction.CREATE)
  createModel(
    @Body() dto: CreateVehicleModelDto,
    @CurrentUser() user: { sub: string; role: UserRole },
    @Req() req: Request,
  ) {
    return this.lookupService.createModel(dto, user, req.ip);
  }

  @Put('models/:id')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.PARTS, PermissionAction.EDIT)
  updateModel(
    @Param('id') id: string,
    @Body() dto: UpdateVehicleModelDto,
    @CurrentUser() user: { sub: string; role: UserRole },
    @Req() req: Request,
  ) {
    return this.lookupService.updateModel(id, dto, user, req.ip);
  }

  @Delete('models/:id')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN)
  @RequirePermission(PermissionModule.PARTS, PermissionAction.DELETE)
  removeModel(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string; role: UserRole },
    @Req() req: Request,
  ) {
    return this.lookupService.removeModel(id, user, req.ip);
  }

  @Get('problem-types')
  getProblemTypes() {
    return this.lookupService.getProblemTypes();
  }

  @Get('problem-types/manage')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.JOB_CARDS, PermissionAction.VIEW)
  findAllProblemTypes(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    return this.lookupService.findAllProblemTypes(+page, +limit, search);
  }

  @Get('problem-types/:id')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.JOB_CARDS, PermissionAction.VIEW)
  findOneProblemType(@Param('id') id: string) {
    return this.lookupService.findOneProblemType(id);
  }

  @Post('problem-types')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.JOB_CARDS, PermissionAction.CREATE)
  createProblemType(
    @Body() dto: CreateProblemTypeDto,
    @CurrentUser() user: { sub: string; role: UserRole },
    @Req() req: Request,
  ) {
    return this.lookupService.createProblemType(dto, user, req.ip);
  }

  @Put('problem-types/:id')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.JOB_CARDS, PermissionAction.EDIT)
  updateProblemType(
    @Param('id') id: string,
    @Body() dto: UpdateProblemTypeDto,
    @CurrentUser() user: { sub: string; role: UserRole },
    @Req() req: Request,
  ) {
    return this.lookupService.updateProblemType(id, dto, user, req.ip);
  }

  @Delete('problem-types/:id')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN)
  @RequirePermission(PermissionModule.JOB_CARDS, PermissionAction.DELETE)
  removeProblemType(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string; role: UserRole },
    @Req() req: Request,
  ) {
    return this.lookupService.removeProblemType(id, user, req.ip);
  }

  @Get('job-card-types')
  getJobCardTypes() {
    return this.lookupService.getJobCardTypes();
  }

  @Get('job-card-types/manage')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.JOB_CARDS, PermissionAction.VIEW)
  findAllJobCardTypes(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    return this.lookupService.findAllJobCardTypes(+page, +limit, search);
  }

  @Get('job-card-types/:id')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.JOB_CARDS, PermissionAction.VIEW)
  findOneJobCardType(@Param('id') id: string) {
    return this.lookupService.findOneJobCardType(id);
  }

  @Post('job-card-types')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.JOB_CARDS, PermissionAction.CREATE)
  createJobCardType(
    @Body() dto: CreateJobCardTypeDto,
    @CurrentUser() user: { sub: string; role: UserRole },
    @Req() req: Request,
  ) {
    return this.lookupService.createJobCardType(dto, user, req.ip);
  }

  @Put('job-card-types/:id')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.JOB_CARDS, PermissionAction.EDIT)
  updateJobCardType(
    @Param('id') id: string,
    @Body() dto: UpdateJobCardTypeDto,
    @CurrentUser() user: { sub: string; role: UserRole },
    @Req() req: Request,
  ) {
    return this.lookupService.updateJobCardType(id, dto, user, req.ip);
  }

  @Delete('job-card-types/:id')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN)
  @RequirePermission(PermissionModule.JOB_CARDS, PermissionAction.DELETE)
  removeJobCardType(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string; role: UserRole },
    @Req() req: Request,
  ) {
    return this.lookupService.removeJobCardType(id, user, req.ip);
  }

  @Get('fitments')
  getFitments() {
    return this.lookupService.getFitments();
  }

  @Get('fitments/manage')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.PARTS, PermissionAction.VIEW)
  findAllFitments(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    return this.lookupService.findAllFitments(+page, +limit, search);
  }

  @Get('fitments/:id')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.PARTS, PermissionAction.VIEW)
  findOneFitment(@Param('id') id: string) {
    return this.lookupService.findOneFitment(id);
  }

  @Post('fitments')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.PARTS, PermissionAction.CREATE)
  createFitment(
    @Body() dto: CreateFitmentDto,
    @CurrentUser() user: { sub: string; role: UserRole },
    @Req() req: Request,
  ) {
    return this.lookupService.createFitment(dto, user, req.ip);
  }

  @Put('fitments/:id')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.PARTS, PermissionAction.EDIT)
  updateFitment(
    @Param('id') id: string,
    @Body() dto: UpdateFitmentDto,
    @CurrentUser() user: { sub: string; role: UserRole },
    @Req() req: Request,
  ) {
    return this.lookupService.updateFitment(id, dto, user, req.ip);
  }

  @Delete('fitments/:id')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN)
  @RequirePermission(PermissionModule.PARTS, PermissionAction.DELETE)
  removeFitment(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string; role: UserRole },
    @Req() req: Request,
  ) {
    return this.lookupService.removeFitment(id, user, req.ip);
  }

  @Post('categories')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.PARTS, PermissionAction.CREATE)
  createCategory(
    @Body() dto: CreateCategoryDto,
    @CurrentUser() user: { sub: string; role: UserRole },
    @Req() req: Request,
  ) {
    return this.lookupService.createCategory(dto, user, req.ip);
  }

  @Put('categories/:id')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.PARTS, PermissionAction.EDIT)
  updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() user: { sub: string; role: UserRole },
    @Req() req: Request,
  ) {
    return this.lookupService.updateCategory(id, dto, user, req.ip);
  }

  @Delete('categories/:id')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN)
  @RequirePermission(PermissionModule.PARTS, PermissionAction.DELETE)
  removeCategory(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string; role: UserRole },
    @Req() req: Request,
  ) {
    return this.lookupService.removeCategory(id, user, req.ip);
  }
}
