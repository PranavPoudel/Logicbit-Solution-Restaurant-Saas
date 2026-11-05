import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });

  // --- Security headers ---
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // --- CORS (Frontend domain अनुसार .env बाट restrict गर्न सकिन्छ) ---
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
    credentials: true,
  });

  // --- Global validation (DTO मा class-validator decorator अनुसार) ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO मा नभएको extra field silently हटाइदिने
      forbidNonWhitelisted: true, // अनपेक्षित field आए error दिने
      transform: true, // query/param string लाई DTO को type (number, boolean) मा auto-convert
    }),
  );

  // --- Global consistent error response ---
  app.useGlobalFilters(new GlobalExceptionFilter());

  // --- Uploaded images serve गर्ने (local disk storage को हकमा) ---
  app.useStaticAssets(join(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads'), { prefix: '/uploads' });

  // --- Swagger API Docs ---
  const config = new DocumentBuilder()
    .setTitle(`${process.env.BRAND_NAME ?? 'LogicBit'} Restaurant SaaS API`)
    .setDescription('Multi-tenant Restaurant SaaS backend — Auth, Menu, Discovery, Orders, Payments, Coupons')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3005;
  await app.listen(port);

  console.log(`🚀 ${process.env.BRAND_NAME ?? 'LogicBit'} Backend running on: http://localhost:${port}`);
  console.log(`📚 API Docs (Swagger): http://localhost:${port}/api/docs`);
}
bootstrap();
