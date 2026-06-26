import { Module } from '@nestjs/common';
import { AuditService } from './services/audit.service';
import { SecurityHeadersMiddleware } from './middleware/security-headers.middleware';

@Module({
  providers: [AuditService, SecurityHeadersMiddleware],
  exports: [AuditService, SecurityHeadersMiddleware],
})
export class CommonModule {}