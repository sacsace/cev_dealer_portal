import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { ChangePasswordDto, LoginDto, UpdateDealerProfileDto, UpdateProfileDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req.ip);
  }

  @Post('refresh')
  refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: { sub: string }) {
    return this.authService.getProfile(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(
    @CurrentUser() user: { sub: string },
    @Body() dto: UpdateProfileDto,
    @Req() req: Request,
  ) {
    return this.authService.updateProfile(user.sub, dto, req.ip);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('dealer')
  updateDealerProfile(
    @CurrentUser() user: { sub: string },
    @Body() dto: UpdateDealerProfileDto,
    @Req() req: Request,
  ) {
    return this.authService.updateDealerProfile(user.sub, dto, req.ip);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(
    @CurrentUser() user: { sub: string },
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ) {
    return this.authService.changePassword(user.sub, dto, req.ip);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(
    @CurrentUser() user: { sub: string; role: string },
    @Req() req: Request,
  ) {
    return this.authService.logout(user.sub, user.role as never, req.ip);
  }
}
