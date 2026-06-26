import { IsEmail, IsNumber, IsOptional, IsString } from 'class-validator';
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

export class RejectOrderDto {
  @IsString()
  reason: string;
}
