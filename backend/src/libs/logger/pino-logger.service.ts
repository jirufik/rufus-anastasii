import { Injectable, LoggerService } from '@nestjs/common';
import pino, { Logger } from 'pino';

export interface LogParams {
  message: any;
  context?: string;
  data?: any;
  showInConsole?: boolean;
}

@Injectable()
export class PinoLoggerService implements LoggerService {
  serviceName: string = this.constructor.name;
  private readonly logger: Logger;

  constructor() {
    this.logger = pino({
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
      },
    });
  }

  info(params: LogParams): void {
    this.logger.info({ context: params.context, data: params.data }, String(params.message));
  }

  error(params: LogParams): void {
    const message: string = params.message instanceof Error ? params.message.message : String(params.message);
    const stack: string | undefined = params.message instanceof Error ? params.message.stack : undefined;
    this.logger.error({ context: params.context, data: params.data, stack }, message);
  }

  warn(params: LogParams): void {
    this.logger.warn({ context: params.context, data: params.data }, String(params.message));
  }

  debug(params: LogParams): void {
    this.logger.debug({ context: params.context, data: params.data }, String(params.message));
  }

  log(message: any, ...optionalParams: any[]): void {
    this.logger.info({}, String(message));
  }

  verbose(message: any, ...optionalParams: any[]): void {
    this.logger.trace({}, String(message));
  }
}
