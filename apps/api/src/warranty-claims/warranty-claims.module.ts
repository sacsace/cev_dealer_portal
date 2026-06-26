import { Module } from '@nestjs/common';
import { WarrantyClaimsService } from './warranty-claims.service';
import { WarrantyClaimsController } from './warranty-claims.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [WarrantyClaimsController],
  providers: [WarrantyClaimsService],
})
export class WarrantyClaimsModule {}
