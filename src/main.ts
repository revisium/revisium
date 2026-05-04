import { ConsoleLogger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { initSwagger } from '@revisium/core';
import { AppModule } from 'src/app.module';
import { configureHttpApp } from 'src/configure-http-app';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new ConsoleLogger({
      json: true,
      colors: true,
    }),
  });

  const config = configureHttpApp(app);
  const port = config.get('PORT') ?? 8080;

  initSwagger(app);

  await app.startAllMicroservices();

  await app.listen(port);
}

bootstrap();
