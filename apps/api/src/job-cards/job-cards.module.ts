import { Module } from '@nestjs/common';
import { JobCardsService } from './job-cards.service';
import { JobCardsController } from './job-cards.controller';
import { CommonModule } from '../common/common.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [CommonModule, SettingsModule],
  controllers: [JobCardsController],
  providers: [JobCardsService],
})
export class JobCardsModule {}
