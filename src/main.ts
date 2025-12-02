import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger();
  const port = process.env.APP_PORT ?? 3006;
  const appVersion = process.env.APP_VERSION ?? 'v1';

  app.enableCors();
  app.setGlobalPrefix(`/api/${appVersion}`);

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('File Management API')
    .setVersion(appVersion)
    .addTag('Files')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  logger.log(`The application starting... on port: ${port}`);
  logger.log(`Swagger documentation available at: http://localhost:${port}/api/docs`);
  await app.listen(port);
}
bootstrap();
