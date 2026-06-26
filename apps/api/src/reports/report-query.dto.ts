import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export class ReportQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  dealerId?: string;
}

export class ReportExportQueryDto extends ReportQueryDto {
  @IsIn(['summary', 'orders', 'claims'])
  type: 'summary' | 'orders' | 'claims';
}
