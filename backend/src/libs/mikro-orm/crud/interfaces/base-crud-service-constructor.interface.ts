import { AnyEntity, MikroORM } from '@mikro-orm/core';
import { LoggerService } from '@nestjs/common';

export interface BaseCrudServiceConstructorInterface {
  orm: MikroORM;
  entity: AnyEntity;
  defaultPageLimit?: number;
  maxPageLimit?: number;
  logger?: LoggerService;
}
