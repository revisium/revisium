import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
export class EnvJsController {
  constructor(private readonly configService: ConfigService) {}

  @Get('env.js')
  envJs() {
    const envs = {
      REACT_APP_ENDPOINT_HOST: this.configService.get<string>(
        'REACT_APP_ENDPOINT_HOST',
      ),
      REACT_APP_ENDPOINT_PORT: this.configService.get<string>(
        'REACT_APP_ENDPOINT_PORT',
      ),
    };

    return `window.__env__ = ${JSON.stringify(envs)}`;
  }
}
