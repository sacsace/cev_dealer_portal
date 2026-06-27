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
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateStaffUserDto, UpdateStaffUserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ROOT)
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    return this.usersService.findAllStaff(+page, +limit, search);
  }

  @Get(':id')
  @Roles(UserRole.ROOT)
  findOne(@Param('id') id: string) {
    return this.usersService.findOneStaff(id);
  }

  @Post()
  @Roles(UserRole.ROOT)
  create(
    @Body() dto: CreateStaffUserDto,
    @CurrentUser() user: { sub: string; role: UserRole },
    @Req() req: Request,
  ) {
    return this.usersService.createStaff(dto, user, req.ip);
  }

  @Put(':id')
  @Roles(UserRole.ROOT)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStaffUserDto,
    @CurrentUser() user: { sub: string; role: UserRole },
    @Req() req: Request,
  ) {
    return this.usersService.updateStaff(id, dto, user, req.ip);
  }

  @Delete(':id')
  @Roles(UserRole.ROOT)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string; role: UserRole },
    @Req() req: Request,
  ) {
    return this.usersService.removeStaff(id, user, req.ip);
  }
}
