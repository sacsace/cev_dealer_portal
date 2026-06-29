import { IsEmail, IsIn, IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  billingAddress?: string;

  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @IsOptional()
  @IsString()
  contactPerson?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  freightCharge?: number;
}

export class ShipOrderDto {
  @IsString()
  courierName: string;

  @IsString()
  trackingNo: string;

  @IsOptional()
  dispatchDate?: string;
}

export class UpdateShipmentDto {
  @ValidateIf((dto: UpdateShipmentDto) => dto.deliveryStatus !== 'PREPARING')
  @IsString()
  courierName?: string;

  @ValidateIf((dto: UpdateShipmentDto) => dto.deliveryStatus !== 'PREPARING')
  @IsString()
  trackingNo?: string;

  @ValidateIf((dto: UpdateShipmentDto) => dto.deliveryStatus === 'PREPARING')
  @IsString()
  note?: string;

  @IsString()
  @IsIn(['PREPARING', 'IN_TRANSIT', 'DELIVERED'])
  deliveryStatus: 'PREPARING' | 'IN_TRANSIT' | 'DELIVERED';
}

export class RejectOrderDto {
  @IsString()
  reason: string;
}
