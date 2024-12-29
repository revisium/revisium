import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { CoreModule } from '@revisium/core'
import { EndpointMicroserviceModule } from 'src/endpoint-microservice/endpoint-microservice.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { EnvjsController } from 'src/envjs.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', '.env.production', '.env.development'],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../..', 'client'),
      serveStaticOptions: {
        cacheControl: true,
      },
    }),
    CoreModule,
    EndpointMicroserviceModule,
  ],
  controllers: [EnvjsController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req: Request, res: Response, next: NextFunction) => {
        const excludedExtensions = /\.(js|css|svg|png|jpg|jpeg)$/;

        if (!excludedExtensions.test(req.baseUrl)) {
          res.setHeader('Cache-Control', 'no-store');
        }

        next();
      })
      .forRoutes('*');
  }
}
