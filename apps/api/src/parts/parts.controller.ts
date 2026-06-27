import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { memoryStorage } from 'multer';
import { UserRole, PermissionModule, PermissionAction } from '@prisma/client';
import { PartsService } from './parts.service';
import { CreatePartDto, PartSearchQuery, UpdatePartDto } from './dto/part.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermission } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('parts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PartsController {
  constructor(private partsService: PartsService) {}

  @Get()
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER, UserRole.DEALER)
  findAll(@Query() query: PartSearchQuery) {
    return this.partsService.findAll(query);
  }

  @Get('bulk-template')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.PARTS, PermissionAction.CREATE)
  async bulkTemplate(@Res() res: Response) {
    const buffer = await this.partsService.buildBulkTemplate();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename="cev-part-bulk-template.xlsx"');
    res.send(buffer);
  }

  @Post('bulk')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.PARTS, PermissionAction.CREATE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  bulkImport(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { sub: string; role: UserRole },
    @Req() req: Request,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Excel file is required');
    }
    return this.partsService.bulkImport(file.buffer, user, req.ip);
  }

  @Get(':id')
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER, UserRole.DEALER)
  findOne(@Param('id') id: string) {
    return this.partsService.findOne(id);
  }

  @Post()
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.PARTS, PermissionAction.CREATE)
  create(
    @Body() dto: CreatePartDto,
    @CurrentUser() user: { sub: string; role: UserRole },
    @Req() req: Request,
  ) {
    return this.partsService.create(dto, user, req.ip);
  }

  @Put(':id')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  @RequirePermission(PermissionModule.PARTS, PermissionAction.EDIT)
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePartDto,
    @CurrentUser() user: { sub: string; role: UserRole },
    @Req() req: Request,
  ) {
    return this.partsService.update(id, dto, user, req.ip);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN)
  @RequirePermission(PermissionModule.PARTS, PermissionAction.DELETE)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string; role: UserRole },
    @Req() req: Request,
  ) {
    return this.partsService.remove(id, user, req.ip);
  }
}
