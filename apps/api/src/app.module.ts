import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DealersModule } from './dealers/dealers.module';
import { PartsModule } from './parts/parts.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { JobCardsModule } from './job-cards/job-cards.module';
import { WarrantyClaimsModule } from './warranty-claims/warranty-claims.module';
import { LookupModule } from './lookup/lookup.module';
import { UsersModule } from './users/users.module';
import { ReportsModule } from './reports/reports.module';
import { CommonModule } from './common/common.module';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env', '.env'] }),
    PrismaModule,
    CommonModule,
    AuthModule,
    DealersModule,
    PartsModule,
    CartModule,
    OrdersModule,
    JobCardsModule,
    WarrantyClaimsModule,
    LookupModule,
    UsersModule,
    ReportsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityHeadersMiddleware).forRoutes('*');
  }
}
