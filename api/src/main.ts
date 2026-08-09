import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const origins = config
    .getOrThrow<string>('CORS_ORIGINS')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  app.use(helmet());
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  app.enableCors({ origin: origins, credentials: origins.length > 0 });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  const port = config.getOrThrow<number>('PORT');
  await app.listen(port);
  Logger.log(`API listening on port ${port}`, 'Bootstrap');
}
void bootstrap();
