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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { memoryStorage } from 'multer';
import { UserRole } from '@prisma/client';
import { JobCardsService } from './job-cards.service';
import { CreateJobCardDto, UpdateJobCardDto } from './dto/job-card.dto';
import { AdminUpdateJobCardDto } from './dto/admin-update-job-card.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { getMaxUploadBytes } from '../common/utils/file-storage.util';

@Controller('job-cards')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JobCardsController {
  constructor(private jobCardsService: JobCardsService) {}

  @Get()
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER, UserRole.DEALER)
  findAll(
    @CurrentUser() user: { role: UserRole; dealerId?: string },
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
    @Query('progress') progress?: 'active' | 'completed',
  ) {
    return this.jobCardsService.findAll(user, +page, +limit, search, progress);
  }

  @Get('lookup/by-vin/:vin')
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER, UserRole.DEALER)
  lookupByVin(
    @Param('vin') vin: string,
    @CurrentUser() user: { role: UserRole; dealerId?: string },
  ) {
    return this.jobCardsService.lookupByVin(vin, user);
  }

  @Get(':id')
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER, UserRole.DEALER)
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { role: UserRole; dealerId?: string },
  ) {
    return this.jobCardsService.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.DEALER)
  create(
    @Body() dto: CreateJobCardDto,
    @CurrentUser() user: {
      sub: string;
      role: UserRole;
      dealerId?: string;
      dealer?: { dealerName: string; dealerCode: string };
    },
    @Req() req: Request,
  ) {
    return this.jobCardsService.create(dto, user, req.ip);
  }

  @Post(':id/files')
  @Roles(UserRole.DEALER, UserRole.ADMIN, UserRole.ROOT)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: getMaxUploadBytes() },
    }),
  )
  uploadFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { sub: string; role: UserRole; dealerId?: string },
    @Req() req: Request,
  ) {
    return this.jobCardsService.uploadFile(id, file, user, req.ip);
  }

  @Delete(':id/files/:fileId')
  @Roles(UserRole.DEALER, UserRole.ADMIN, UserRole.ROOT)
  removeFile(
    @Param('id') id: string,
    @Param('fileId') fileId: string,
    @CurrentUser() user: { sub: string; role: UserRole; dealerId?: string },
    @Req() req: Request,
  ) {
    return this.jobCardsService.removeFile(id, fileId, user, req.ip);
  }

  @Put(':id/receive')
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  markAsReceived(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string; role: UserRole; dealerId?: string },
    @Req() req: Request,
  ) {
    return this.jobCardsService.markAsReceived(id, user, req.ip);
  }

  @Put(':id/review')
  @Roles(UserRole.ROOT, UserRole.ADMIN, UserRole.USER)
  adminReview(
    @Param('id') id: string,
    @Body() dto: AdminUpdateJobCardDto,
    @CurrentUser() user: { sub: string; role: UserRole; dealerId?: string },
    @Req() req: Request,
  ) {
    return this.jobCardsService.adminReview(id, dto, user, req.ip);
  }

  @Put(':id')
  @Roles(UserRole.DEALER, UserRole.ADMIN, UserRole.ROOT)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateJobCardDto,
    @CurrentUser() user: { sub: string; role: UserRole; dealerId?: string },
    @Req() req: Request,
  ) {
    return this.jobCardsService.update(id, dto, user, req.ip);
  }

  @Delete(':id')
  @Roles(UserRole.DEALER, UserRole.ROOT)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string; role: UserRole; dealerId?: string },
    @Req() req: Request,
  ) {
    return this.jobCardsService.remove(id, user, req.ip);
  }
}

