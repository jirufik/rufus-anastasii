import { Injectable, Inject } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { BaseService } from '../../../../libs/mikro-orm/services/base.service';
import { AdminUsersRepositoryService } from '../../repository/admin-users.repository.service';
import { PinoLoggerService } from '../../../../libs/logger/pino-logger.service';
import { AdminUserDo } from '../../dto/admin-user.do';
import { FindOperator } from '../../../../libs/mikro-orm/crud/enums/find-operator';

@Injectable()
export class BasicAdminUsersActionsService extends BaseService {
  constructor(
    orm: MikroORM,
    @Inject(PinoLoggerService)
    private readonly logger: PinoLoggerService,
    private readonly adminUsersRepository: AdminUsersRepositoryService,
  ) {
    super(orm);
  }

  async create(params: { adminUser: Partial<AdminUserDo> }): Promise<AdminUserDo> {
    try {
      const { adminUser } = params;

      if (!adminUser) {
        throw new Error('Admin user not filled.');
      }

      const createdAdminUser: AdminUserDo = await this.adminUsersRepository.create({
        data: adminUser,
        options: {},
      });

      return createdAdminUser;
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.create error`,
        data: { params },
      });
      throw error;
    }
  }

  async findByUsername(params: { username: string }): Promise<AdminUserDo | undefined> {
    try {
      const { username } = params;

      if (!username) {
        throw new Error('Username not filled.');
      }

      const adminUsers: AdminUserDo[] = await this.adminUsersRepository.find({
        filters: {
          and: [{ field: 'username', operator: FindOperator.EQ, value: username }],
        },
        getAllRows: true,
      });

      const adminUser: AdminUserDo | undefined = adminUsers?.[0];
      return adminUser;
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.findByUsername error`,
        data: { params },
      });
      throw error;
    }
  }
}
