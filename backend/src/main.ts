import { NestApplication, NestFactory, HttpAdapterHost } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import * as process from 'node:process';
import { HttpExceptionFilter } from './libs/utils/http-exception-filter';
import { PinoLoggerService } from './libs/logger/pino-logger.service';
import { initSwagger, SWAGGER_PATH } from './libs/swagger/init-swagger';
import { BODY_PARSER_LIMIT, ENV_KEY_SERVICE_HTTP_PORT, ENV_KEY_SRV_NODE } from './constants/constants';

async function bootstrap() {
  const app: NestApplication = await NestFactory.create(AppModule);
  app.useLogger(app.get(PinoLoggerService));

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.use(bodyParser.json({ limit: BODY_PARSER_LIMIT }));
  app.use(bodyParser.urlencoded({ limit: BODY_PARSER_LIMIT, extended: true }));
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  initSwagger(app, {
    title: 'Rufus & Anastasii API',
    description: 'Love Locks Photo Map API',
  });

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new HttpExceptionFilter(httpAdapter));

  const port: number = getServerPort(app);
  app.enableShutdownHooks();

  await app.listen(port);
  logStart(app, port);
}

function getServerPort(app: NestApplication): number {
  const configService: ConfigService = app.get(ConfigService);
  return configService.get<number>(ENV_KEY_SERVICE_HTTP_PORT);
}

function logStart(app: NestApplication, port: number): void {
  const logger: PinoLoggerService = app.get(PinoLoggerService);
  const messages: string[] = [
    `Start ${process.env[ENV_KEY_SRV_NODE]}, port ${port}`,
    `${process.env[ENV_KEY_SRV_NODE]} is running on: http://localhost:${port}`,
    `Swagger: http://localhost:${port}/${SWAGGER_PATH}`,
  ];
  messages.forEach((message: string) => {
    logger.info({ message, showInConsole: true });
  });
}

bootstrap();
