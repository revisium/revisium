import { Server, CustomTransportStrategy } from '@nestjs/microservices';
import { EventEmitter } from 'node:events';

export class InMemoryServer extends Server implements CustomTransportStrategy {
  constructor(private server: EventEmitter) {
    super();
  }

  close(): any {}

  listen(callback: (...optionalParams: unknown[]) => any): any {
    for (const [pattern, handler] of this.messageHandlers) {
      this.server.on(pattern, handler);
    }

    callback();
  }
}
