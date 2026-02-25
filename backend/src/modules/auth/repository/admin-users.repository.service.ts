import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { BaseRepositoryService } from '../../../libs/mikro-orm/crud/services/base-repository.service';
import { AdminUserEntity } from './entities/admin-user.entity';
import { AdminUserDo } from '../dto/admin-user.do';
import { PinoLoggerService } from '../../../libs/logger/pino-logger.service';

@Injectable()
export class AdminUsersRepositoryService extends BaseRepositoryService<AdminUserEntity, AdminUserDo> {
  protected readonly DtoClass = AdminUserDo;

  constructor(
    protected readonly orm: MikroORM,
    readonly logger: PinoLoggerService,
  ) {
    super({ orm, entity: AdminUserEntity, logger });
  }
}
