/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const apiPrefix = config.get('API_PREFIX', 'api');
  const apiVersion = config.get('API_VERSION', 'v1');
  const webOrigin = config.get('WEB_ORIGIN', 'http://localhost:4200');
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableCors({
    origin: webOrigin,
  });
  const globalPrefix = `${apiPrefix}/${apiVersion}`;
  app.setGlobalPrefix(globalPrefix);
  const port = Number(config.get('PORT', 3000));
  await app.listen(port);
  Logger.log(`dYs? Application is running on: http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
