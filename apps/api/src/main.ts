import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { validateEnv } from './common/utils/validate-env';
import { getUploadRoot } from './common/utils/file-storage.util';

function collectCorsOrigins(): string[] {
  const origins = new Set<string>();
  const frontend = process.env.FRONTEND_URL?.trim();
  if (frontend) {
    origins.add(frontend);
    try {
      const url = new URL(frontend);
      const host = url.hostname;
      const port = url.port ? `:${url.port}` : '';
      if (host.startsWith('www.')) {
        origins.add(`${url.protocol}//${host.slice(4)}${port}`);
      } else {
        origins.add(`${url.protocol}//www.${host}${port}`);
      }
    } catch {
      // ignore invalid FRONTEND_URL
    }
  }
  const extra = process.env.CORS_ORIGINS?.split(',').map((v) => v.trim()).filter(Boolean);
  for (const origin of extra ?? []) origins.add(origin);
  return [...origins];
}

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');
  app.useStaticAssets(getUploadRoot(), {
    prefix: '/api/uploads/',
  });
  const allowedOrigins = collectCorsOrigins();
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    }),
  );

  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3001);
  const host = process.env.HOST ?? '0.0.0.0';
  app.enableShutdownHooks();
  await app.listen(port, host);
  console.log(`API running on http://${host}:${port}/api`);
}
bootstrap();
