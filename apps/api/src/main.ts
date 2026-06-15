import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import type { AppConfig } from './config/configuration';

// Recording file sizes are stored as BigInt (files can exceed 2GB). Express'
// JSON serializer can't stringify BigInt, so teach it to emit a string.
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  // rawBody is required to verify Zoom webhook HMAC signatures over the exact
  // bytes Zoom sent.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  const config = app.get(ConfigService) as ConfigService<AppConfig, true>;

  // Behind Railway's proxy, trust the first hop so request.ip is the real
  // client address for access logs.
  app.set('trust proxy', 1);

  app.enableCors({
    origin: config.get('corsOrigins', { infer: true }),
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-access-code'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = config.get('port', { infer: true });
  await app.listen(port);
}
void bootstrap();
