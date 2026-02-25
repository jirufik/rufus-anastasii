import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { APP_GUARD } from '@nestjs/core';
import { ClsModule } from 'nestjs-cls';
import { PinoLoggerModule } from './libs/logger/pino-logger.module';
import { HealthModule } from './libs/health/health.module';
import { JwtTokenModule } from './libs/auth/jwt-token/jwt-token.module';
import { AuthGuard } from './libs/auth/guards/auth.guard';
import { getMergedSchemas } from './libs/config/schema-loader';
import { getEnvFile } from './libs/config/get-env-file';
import { envSchema } from './config/env.schema';
import { join } from 'node:path';
import * as process from 'node:process';
import mikroOrmConfig from './mikro-orm.config';
import { PATH_TO_ENV_DIR } from './constants/constants';
import { AuthModule } from './modules/auth/auth.module';
import { PhotosModule } from './modules/photos/photos.module';
import { LocationsModule } from './modules/locations/locations.module';
import { ClientApiModule } from './modules/client-api/client-api.module';

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: getMergedSchemas(envSchema),
      envFilePath: [
        ...getEnvFile({
          pathToDir: join(process.cwd(), PATH_TO_ENV_DIR),
        }),
        ...getEnvFile({
          pathToDir: join(process.cwd()),
        }),
      ],
      cache: true,
    }),
    PinoLoggerModule,
    HealthModule,
    MikroOrmModule.forRoot(mikroOrmConfig),
    JwtTokenModule,
    AuthModule,
    PhotosModule,
    LocationsModule,
    ClientApiModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
