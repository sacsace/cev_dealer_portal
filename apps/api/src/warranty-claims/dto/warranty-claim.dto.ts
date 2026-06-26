import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWarrantyClaimDto {
  @IsDateString()
  warrantyClaimDate: string;

  @IsString()
  invoiceNo: string;

  @IsOptional()
  @IsString()
  jobCardId?: string;

  @IsOptional()
  @IsString()
  jobCardNo?: string;

  @IsOptional()
  @IsString()
  vin?: string;

  @IsOptional()
  @IsString()
  carModelName?: string;

  @IsOptional()
  @IsString()
  partNumber?: string;

  @IsOptional()
  @IsString()
  partName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  claimAmount?: number;

  @IsOptional()
  @IsString()
  reasonForClaim?: string;

  @IsOptional()
  @IsString()
  problemDescription?: string;

  @IsOptional()
  @IsString()
  place?: string;
}

export class RejectWarrantyClaimDto {
  @IsString()
  rejectReason: string;
}

export class ApproveWarrantyClaimDto {
  @IsOptional()
  @IsString()
  remark?: string;
}
