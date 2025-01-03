import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule, CoreModule, MetricsApiModule } from '@revisium/core';
import { EndpointMicroserviceModule } from '@revisium/endpoint';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', '.env.production', '.env.development'],
    }),
    CoreModule,
    EndpointMicroserviceModule,
    MetricsApiModule,
    AdminModule.forRoot({
      rootPath: join(__dirname, '../..', 'client'),
    }),
  ],
})
export class AppModule {}
