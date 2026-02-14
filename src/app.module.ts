import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  CoreModule,
  GracefulShutdownModule,
  MetricsApiModule,
} from '@revisium/core';
import { EndpointMicroserviceModule } from '@revisium/endpoint';
import { join } from 'node:path';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      ...(process.env.REVISIUM_STANDALONE
        ? { ignoreEnvFile: true }
        : { envFilePath: ['.env', '.env.production', '.env.development'] }),
    }),
    CoreModule.forRoot({ mode: 'monolith' }),
    EndpointMicroserviceModule.forRoot({ mode: 'monolith' }),
    MetricsApiModule,
    GracefulShutdownModule,
    AdminModule.forRoot(
      process.env.REVISIUM_CLIENT_DIR || join(__dirname, '../..', 'client'),
    ),
  ],
})
export class AppModule {}
