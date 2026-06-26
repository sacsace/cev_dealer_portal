import { IsOptional, IsString } from 'class-validator';

export class CreateVehicleModelDto {
  @IsString()
  modelName: string;

  @IsString()
  modelCode: string;

  @IsOptional()
  @IsString()
  year?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateVehicleModelDto {
  @IsOptional()
  @IsString()
  modelName?: string;

  @IsOptional()
  @IsString()
  modelCode?: string;

  @IsOptional()
  @IsString()
  year?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
