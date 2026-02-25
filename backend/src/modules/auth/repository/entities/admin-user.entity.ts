import { Entity, Property, Unique } from '@mikro-orm/core';
import { BaseEntityAbstract } from '../../../../libs/mikro-orm/crud/entities/base.entity.abstract';

@Entity({ tableName: 'admin_users' })
export class AdminUserEntity extends BaseEntityAbstract {
  @Property({ type: 'varchar', length: 100 })
  @Unique()
  username: string;

  @Property({ type: 'varchar', length: 255 })
  passwordHash: string;
}
