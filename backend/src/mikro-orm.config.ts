import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { UnderscoreNamingStrategy, defineConfig } from '@mikro-orm/core';
import { Logger } from '@nestjs/common';
import { config } from 'dotenv';
import * as process from 'node:process';
import { getEnvFile } from './libs/config/get-env-file';
import { join } from 'node:path';
import { globalEntityRegistry } from './libs/mikro-orm/global-entity-registry/global-entity-registry';
import {
  PATH_TO_ENV_DIR,
  ENV_KEY_DB_HOST,
  ENV_KEY_DB_PORT,
  ENV_KEY_DB_USER,
  ENV_KEY_DB_PASSWORD,
  ENV_KEY_DB_NAME,
  ENV_KEY_MIKROORM_DEBUG,
} from './constants/constants';
import { AdminUserEntity } from './modules/auth/repository/entities/admin-user.entity';
import { LocationEntity } from './modules/locations/repository/entities/location.entity';
import { PhotoEntity } from './modules/photos/repository/entities/photo.entity';

globalEntityRegistry.add(AdminUserEntity);
globalEntityRegistry.add(LocationEntity);
globalEntityRegistry.add(PhotoEntity);

config({
  path: [
    ...getEnvFile({
      pathToDir: join(process.cwd(), PATH_TO_ENV_DIR),
    }),
    ...getEnvFile({
      pathToDir: join(process.cwd()),
    }),
  ],
});

const logger = new Logger('MikroORM');

export default defineConfig({
  driver: PostgreSqlDriver,
  host: process.env[ENV_KEY_DB_HOST],
  port: Number(process.env[ENV_KEY_DB_PORT]),
  user: process.env[ENV_KEY_DB_USER],
  password: process.env[ENV_KEY_DB_PASSWORD],
  dbName: process.env[ENV_KEY_DB_NAME],
  namingStrategy: UnderscoreNamingStrategy,
  entities: [...globalEntityRegistry],
  entitiesTs: [...globalEntityRegistry],
  migrations: {
    tableName: 'mikro_orm_migrations',
    path: `${PATH_TO_ENV_DIR}/src/migrations`,
    transactional: true,
    disableForeignKeys: false,
    allOrNothing: true,
    dropTables: false,
    emit: 'ts',
    snapshot: false,
  },
  validate: true,
  strict: true,
  // @ts-expect-error it is okay
  registerRequestContext: false,
  autoLoadEntities: false,
  multipleStatements: false,
  logger: logger.log.bind(logger),
  debug: process.env[ENV_KEY_MIKROORM_DEBUG] === 'true',
});
