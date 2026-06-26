import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { LookupController } from './lookup.controller';
import { LookupService } from './lookup.service';

@Module({
  imports: [CommonModule],
  controllers: [LookupController],
  providers: [LookupService],
})
export class LookupModule {}
