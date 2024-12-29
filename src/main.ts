import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from 'src/app.module';
import { InMemoryServer } from 'src/in-memory-server';
import { notificationEventEmitter } from '@revisium/core';
import * as packageJson from '../package.json';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  const config = app.get(ConfigService);
  const port = config.get('PORT') || 8080;

  initSwagger(app);

  app.connectMicroservice<MicroserviceOptions>({
    strategy: new InMemoryServer(notificationEventEmitter),
  });
  await app.startAllMicroservices();

  await app.listen(port);
}

function initSwagger(app: INestApplication<any>) {
  const documentBuilder = new DocumentBuilder()
    .setTitle('Revisium API')
    .setVersion(packageJson.version)
    .build();

  const document = SwaggerModule.createDocument(app, documentBuilder);
  SwaggerModule.setup('/-/api', app, document, {
    swaggerOptions: {
      tryItOutEnabled: true,
      filter: true,
      ignoreGlobalPrefix: true,
      docExpansion: 'none',
    },
  });
}

bootstrap();
