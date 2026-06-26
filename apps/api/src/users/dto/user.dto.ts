import { IsEmail, IsEnum, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole, UserStatus } from '@prisma/client';

const STAFF_ROLES = [UserRole.ROOT, UserRole.ADMIN, UserRole.USER] as const;

export class CreateStaffUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  loginId?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsIn(STAFF_ROLES)
  role: (typeof STAFF_ROLES)[number];

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

export class UpdateStaffUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  loginId?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsIn(STAFF_ROLES)
  role?: (typeof STAFF_ROLES)[number];

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
