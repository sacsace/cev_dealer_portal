import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export const VIN_PATTERN = /^[A-Za-z0-9]{17}$/;

export class CreateJobCardDto {
  @IsString()
  @Matches(VIN_PATTERN, { message: 'VIN must be exactly 17 alphanumeric characters' })
  vin: string;

  @IsOptional()
  @IsString()
  carModelId?: string;

  @IsOptional()
  @IsString()
  carModelName?: string;

  @IsOptional()
  @IsString()
  fitment?: string;

  @IsOptional()
  @IsString()
  gdmsNo?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  kilometers?: number;

  @IsString()
  customerName: string;

  @IsString()
  @Matches(/^\d{10}$/, { message: 'Mobile must be 10 digits' })
  mobile: string;

  @IsOptional()
  @IsString()
  place?: string;

  @IsOptional()
  @IsString()
  checkedBy?: string;

  @IsOptional()
  @IsString()
  typeOfProblem?: string;

  @IsOptional()
  @IsString()
  jobType?: string;

  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @IsDateString()
  dateOfFitment?: string;

  @IsOptional()
  @IsString()
  customerAddress?: string;

  @IsOptional()
  @IsString()
  customerComplaint?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  observation?: string;

  @IsOptional()
  @IsString()
  rectification?: string;
}

export class UpdateJobCardDto extends CreateJobCardDto {}
