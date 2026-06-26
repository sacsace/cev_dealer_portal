import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartStatus } from '@prisma/client';

export class CreatePartDto {
  @IsString()
  partNumber: string;

  @IsString()
  partName: string;

  @IsString()
  categoryId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  mrp: number;

  @Type(() => Number)
  @IsNumber()
  dealerPrice: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  gstRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  minimumOrderQty?: number;

  @IsOptional()
  @IsBoolean()
  warrantyAvailable?: boolean;

  @IsOptional()
  @IsEnum(PartStatus)
  status?: PartStatus;

  @IsOptional()
  modelIds?: string[];
}

export class UpdatePartDto {
  @IsOptional()
  @IsString()
  partName?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  mrp?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  dealerPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  gstRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  stockQuantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  minimumOrderQty?: number;

  @IsOptional()
  @IsBoolean()
  warrantyAvailable?: boolean;

  @IsOptional()
  @IsEnum(PartStatus)
  status?: PartStatus;

  @IsOptional()
  modelIds?: string[];
}

export class PartSearchQuery {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  partNumber?: string;

  @IsOptional()
  @IsString()
  partName?: string;

  @IsOptional()
  @IsString()
  modelId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  stockStatus?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
