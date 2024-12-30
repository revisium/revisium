import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Response } from 'express';
import * as client from 'prom-client';
import { MetricsEnabledGuard } from 'src/metrics-api/metrics-enabled.guard';

@ApiExcludeController()
@Controller('metrics')
@UseGuards(MetricsEnabledGuard)
export class MetricsController {
  constructor() {}

  @Get()
  async getMetrics(@Res() response: Response) {
    const metrics = await Promise.all([
      client.register.metrics(),
      // this.prismaService.$metrics.prometheus(),
    ]);

    const combinedMetrics = metrics.join('\n');

    response.set('Content-Type', client.register.contentType);

    response.end(combinedMetrics);
  }
}
