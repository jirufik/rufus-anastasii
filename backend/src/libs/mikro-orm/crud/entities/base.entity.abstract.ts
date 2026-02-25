import { PrimaryKey, Property, Index, BaseEntity, Entity, DateType, Collection } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';
import { ToDoOptionsDto } from '../dto/to-do-options.dto';
import { DEFAULT_CURRENT_DEPTH, DEFAULT_MAX_DEPTH } from '../constants/constants';
import { plainToInstance } from 'class-transformer';

@Entity({ abstract: true })
export class BaseEntityAbstract extends BaseEntity {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id: string;

  @ApiProperty({ required: false })
  @Property({
    type: DateType,
    columnType: 'timestamptz(3)',
    defaultRaw: 'now()',
  })
  @Index()
  createdAt: Date;

  @ApiProperty({ required: false })
  @Property({
    type: DateType,
    columnType: 'timestamptz(3)',
    defaultRaw: 'now()',
    onUpdate: () => new Date(),
  })
  @Index()
  updatedAt: Date;

  @ApiProperty({ required: false })
  @Property({ type: DateType, columnType: 'timestamptz(3)', nullable: true })
  @Index()
  deletedAt: Date;

  @ApiProperty({ required: false })
  @Property({
    type: 'integer',
    default: 0,
    onUpdate: (value: BaseEntityAbstract) => {
      return Number((value.version += 1));
    },
  })
  version: number;

  constructor() {
    super();
  }

  public getName(): string {
    return this.constructor.name;
  }

  toDomainObject<T>(DomainObjectClass: new (...args: any[]) => T, params: ToDoOptionsDto = new ToDoOptionsDto()): T {
    const maxDepth: number = params.maxDepth ?? DEFAULT_MAX_DEPTH;
    let currentDepth: number = params.currentDepth ?? DEFAULT_CURRENT_DEPTH;

    if (currentDepth > maxDepth) {
      return plainToInstance(DomainObjectClass, this.toObject());
    }

    currentDepth += 1;
    const plainObject: any = this.toObject();

    for (const key of Object.keys(plainObject)) {
      const value: any = (this as any)[key];

      if (value instanceof Collection && value.isInitialized()) {
        plainObject[key] = value.getItems().map((item: any) => item.toDomainObject(DomainObjectClass, { ...params, currentDepth }));
      }

      if (value?.toDomainObject && typeof value?.toDomainObject === 'function' && value.isInitialized?.()) {
        plainObject[key] = value.toDomainObject(DomainObjectClass, {
          ...params,
          currentDepth,
        });
      }
    }

    return plainToInstance(DomainObjectClass, plainObject);
  }
}
