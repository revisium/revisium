import {
  DynamicModule,
  Inject,
  MiddlewareConsumer,
  Module,
  NestModule,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpAdapterHost } from '@nestjs/core';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as express from 'express';
import { Request, Response, NextFunction } from 'express';
import { EnvJsController } from './envjs.controller';

const ADMIN_ROOT_PATH = 'ADMIN_ROOT_PATH';

@Module({
  controllers: [EnvJsController],
})
export class AdminModule implements NestModule, OnModuleInit {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    @Inject(ADMIN_ROOT_PATH) private readonly rootPath: string,
  ) {}

  static forRoot(rootPath: string): DynamicModule {
    return {
      module: AdminModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: ADMIN_ROOT_PATH,
          useValue: rootPath,
        },
      ],
    };
  }

  onModuleInit() {
    const app = this.httpAdapterHost.httpAdapter.getInstance();
    const indexHtml = readFileSync(join(this.rootPath, 'index.html'), 'utf-8');

    app.use(
      express.static(this.rootPath, {
        cacheControl: true,
        maxAge: '1y',
        immutable: true,
        dotfiles: 'allow',
      }),
    );

    app.get('{*any}', (req: Request, res: Response, next: NextFunction) => {
      const skipPrefixes = [
        '/api',
        '/graphql',
        '/mcp',
        '/metrics',
        '/endpoint',
      ];
      if (skipPrefixes.some((prefix) => req.path.startsWith(prefix))) {
        return next();
      }
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Cache-Control', 'no-store');
      res.send(indexHtml);
    });
  }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req: Request, res: Response, next: NextFunction) => {
        const staticAssets =
          /\.(js|css|woff|woff2|ttf|eot|ico|svg|png|jpg|jpeg|gif|webp|avif|wasm)$/;

        if (staticAssets.test(req.path)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
          res.setHeader('Cache-Control', 'no-store');
        }

        next();
      })
      .forRoutes('*');
  }
}
