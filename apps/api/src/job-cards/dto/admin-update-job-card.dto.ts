import { IsEnum, IsOptional, IsString } from 'class-validator';
import { JobCardStatus } from '@prisma/client';

export class AdminUpdateJobCardDto {
  @IsOptional()
  @IsEnum(JobCardStatus)
  status?: JobCardStatus;

  @IsOptional()
  @IsString()
  observation?: string;

  @IsOptional()
  @IsString()
  rectification?: string;
}
