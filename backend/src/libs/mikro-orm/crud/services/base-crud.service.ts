import { AnyEntity, BaseEntity, Collection, EntityManager, EntityRepository, FilterQuery, FindOptions } from '@mikro-orm/core';
import { BaseService } from '../../services/base.service';
import { TransactionOptionsDto } from '../dto/transaction-options.dto';
import { BaseCreateWithOptionsDto } from '../dto/create/base-create-with-options.dto';
import {
  DEFAULT_CHECK_VERSION,
  DEFAULT_MAX_PAGE_LIMIT,
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PARTIAL_UPDATE,
  DEFAULT_SOFT_DELETE,
  DEFAULT_TRANSACTION_ISOLATION_LEVEL,
} from '../constants/constants';
import { BaseCreateOptionsDto } from '../dto/create/base-create-options.dto';
import { BaseFindDto } from '../dto/find/base-find.dto';
import { BaseFindGroupDto } from '../dto/find/base-find-group.dto';
import { BaseFindFilterDto } from '../dto/find/base-find-filter.dto';
import { FindOperator } from '../enums/find-operator';
import { SortOrder } from '../enums/sort-order';
import { BaseCrudServiceInterface } from '../interfaces/base-crud-service.interface';
import { BaseCrudServiceConstructorInterface } from '../interfaces/base-crud-service-constructor.interface';
import { BaseUpdateWithOptionsDto } from '../dto/update/base-update-with-options.dto';
import { BaseUpdateOptionsDto } from '../dto/update/base-update-options.dto';
import { BaseBulkUpdateWithOptionsDto } from '../dto/update/base-bulk-update-with-options.dto';
import { BaseDeleteWithOptionsDto } from '../dto/delete/base-delete-with-options.dto';
import { BaseDeleteOptionsDto } from '../dto/delete/base-delete-options.dto';
import { BaseFindByFiltersDto, BaseFindByIdDto } from '../dto/find/base-find-by-id.dto';
import { LoggerService } from '@nestjs/common';
import { ExecRawSqlDto } from '../dto/exec-raw-sql.dto';
import { BaseCountDto } from '../dto/find/base-count.dto';
import { BaseFindWithPaginationDto } from '../dto/find/base-find-with-pagination.dto';

export class BaseCrudService<T extends BaseEntity> extends BaseService implements BaseCrudServiceInterface<T> {
  private readonly repository: EntityRepository<any>;
  entity: AnyEntity;
  defaultPageLimit: number = DEFAULT_PAGE_LIMIT;
  maxPageLimit: number = DEFAULT_MAX_PAGE_LIMIT;
  readonly logger: LoggerService | undefined;

  constructor(params: BaseCrudServiceConstructorInterface) {
    super(params.orm);
    this.entity = params.entity;
    this.logger = params.logger;
    if (params.defaultPageLimit) {
      this.defaultPageLimit = params.defaultPageLimit;
    }
    if (params.maxPageLimit) {
      this.maxPageLimit = params.maxPageLimit;
    }
    // @ts-expect-error its okay
    this.repository = this.orm.em.getRepository(this.entity);
  }

  async create(params: BaseCreateWithOptionsDto<T>): Promise<T> {
    try {
      this.processCreateData(params);
      return this.runInTransaction(async () => {
        try {
          return await this.createEntity(params);
        } catch (error) {
          if (this.logger) {
            this.logger.error({ message: error, context: `${this.serviceName}.create error`, data: { params } });
          } else {
            console.error(error);
          }
          throw error;
        }
      }, params.options.transaction);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async createEntity(params: BaseCreateWithOptionsDto<T>): Promise<T> {
    try {
      this.processCreateData(params);
      return this.runInTransaction(async (em: EntityManager) => {
        try {
          const isArray: boolean = Array.isArray(params.data);
          if (isArray) {
            // @ts-expect-error its okay
            const entities = params?.data?.map((item) => em.create(this.entity, item));
            await em.persistAndFlush(entities);
            return entities;
          } else {
            // @ts-expect-error its okay
            const entity = em.create(this.entity, params.data);
            await em.persistAndFlush(entity);
            return entity;
          }
        } catch (error) {
          if (this.logger) {
            this.logger.error({ message: error, context: `${this.serviceName}.createEntity error`, data: { params } });
          } else {
            console.error(error);
          }
          throw error;
        }
      }, params.options.transaction);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  private processCreateData(params: BaseCreateWithOptionsDto<T>): void {
    if (!params?.options) {
      params.options = new BaseCreateOptionsDto();
    }
    if (!params?.options?.transaction) {
      params.options.transaction = new TransactionOptionsDto();
    }
    if (!params?.options?.transaction?.transactionIsolationLevel) {
      params.options.transaction.transactionIsolationLevel = DEFAULT_TRANSACTION_ISOLATION_LEVEL;
    }
  }

  async delete(params: BaseDeleteWithOptionsDto): Promise<T | undefined> {
    try {
      this.processDeleteData(params);
      return this.runInTransaction(async () => {
        try {
          return await this.deleteEntity(params);
        } catch (error) {
          if (this.logger) {
            this.logger.error({ message: error, context: `${this.serviceName}.delete error`, data: { params } });
          } else {
            console.error(error);
          }
          throw error;
        }
      }, params.options.transaction);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async deleteEntity(params: BaseDeleteWithOptionsDto): Promise<T | undefined> {
    try {
      this.processDeleteData(params);
      return this.runInTransaction(async (em: EntityManager) => {
        try {
          const entity: T | undefined = await this.findEntityById({ id: params.id, withDeleted: true });
          if (!entity) return;

          if (params.options.softDelete) {
            const updatedEntity: T = await this.updateEntity({
              // @ts-expect-error its okay
              data: { id: params.id, deletedAt: new Date() },
              options: { checkVersion: false, partialUpdate: true, withDeleted: true },
            });
            return updatedEntity;
          } else {
            await em.removeAndFlush(entity);
          }
        } catch (error) {
          if (this.logger) {
            this.logger.error({ message: error, context: `${this.serviceName}.deleteEntity error`, data: { params } });
          } else {
            console.error(error);
          }
          throw error;
        }
      }, params.options.transaction);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  private processDeleteData(params: BaseDeleteWithOptionsDto): void {
    if (!params?.options) {
      params.options = new BaseDeleteOptionsDto();
    }
    if (params.options.softDelete === undefined) {
      params.options.softDelete = DEFAULT_SOFT_DELETE;
    }
    if (!params?.options?.transaction) {
      params.options.transaction = new TransactionOptionsDto();
    }
    if (!params?.options?.transaction?.transactionIsolationLevel) {
      params.options.transaction.transactionIsolationLevel = DEFAULT_TRANSACTION_ISOLATION_LEVEL;
    }
  }

  async update(params: BaseUpdateWithOptionsDto<T>): Promise<T> {
    try {
      this.processUpdateData(params);
      return this.runInTransaction(async () => {
        try {
          return await this.updateEntity(params);
        } catch (error) {
          if (this.logger) {
            this.logger.error({ message: error, context: `${this.serviceName}.update error`, data: { params } });
          } else {
            console.error(error);
          }
          throw error;
        }
      }, params.options.transaction);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async updateEntity(params: BaseUpdateWithOptionsDto<T>): Promise<T> {
    try {
      this.processUpdateData(params);
      return this.runInTransaction(async (em: EntityManager) => {
        try {
          // @ts-expect-error its okay
          const version: number = Number(params?.data?.version);
          // @ts-expect-error its okay
          const id: string = params?.data?.id;
          const entity: T | undefined = await this.findEntityById({ id, withDeleted: params?.options?.withDeleted });
          if (!entity) {
            throw new Error(`Cannot find entity with id ${id}`);
          }
          // @ts-expect-error its okay
          const entityVersion: number = Number(entity?.version);

          if (params.options.checkVersion) {
            const badVersion: boolean = version !== entityVersion;
            if (badVersion) {
              throw new Error(`Entity version mismatch: expected ${entityVersion}, got ${version}`);
            }
          }

          const collectionProperties = new Set(
            Object.keys(entity).filter((key: string) => entity[key] instanceof Collection),
          );
          // @ts-expect-error its okay
          entity.assign(params.data);
          if (!params.options.partialUpdate) {
            for (const key of Object.keys(entity)) {
              if (!Object.prototype.hasOwnProperty.call(params.data, key) && !collectionProperties.has(key)) {
                delete entity[key];
              }
            }
            // @ts-expect-error its okay
            entity.createdAt = new Date();
          }

          if (entityVersion !== undefined) {
            // @ts-expect-error its okay
            entity.version = entityVersion;
          }

          await em.persistAndFlush(entity);
          return entity;
        } catch (error) {
          if (this.logger) {
            this.logger.error({ message: error, context: `${this.serviceName}.updateEntity error`, data: { params } });
          } else {
            console.error(error);
          }
          throw error;
        }
      }, params.options.transaction);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  private processUpdateData(params: BaseUpdateWithOptionsDto<T>): void {
    if (!params?.options) {
      params.options = new BaseUpdateOptionsDto();
    }
    if (params.options.partialUpdate === undefined) {
      params.options.partialUpdate = DEFAULT_PARTIAL_UPDATE;
    }
    if (params.options.checkVersion === undefined) {
      params.options.checkVersion = DEFAULT_CHECK_VERSION;
    }
    if (!params?.options?.transaction) {
      params.options.transaction = new TransactionOptionsDto();
    }
    if (!params?.options?.transaction?.transactionIsolationLevel) {
      params.options.transaction.transactionIsolationLevel = DEFAULT_TRANSACTION_ISOLATION_LEVEL;
    }
  }

  async findById(params: BaseFindByIdDto): Promise<T | undefined> {
    try {
      return this.runInTransaction(async () => {
        try {
          return await this.findEntityById(params);
        } catch (error) {
          if (this.logger) {
            this.logger.error({ message: error, context: `${this.serviceName}.findById error`, data: { params } });
          } else {
            console.error(error);
          }
          throw error;
        }
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async findEntityById(params: BaseFindByIdDto): Promise<T | undefined> {
    try {
      return this.runInTransaction(async () => {
        try {
          const items: T[] = await this.findEntities({
            withDeleted: params.withDeleted,
            filters: { and: [{ field: 'id', operator: FindOperator.EQ, value: params.id }] },
            populate: params.populate,
          });
          if (items?.length) {
            return items[0];
          }
        } catch (error) {
          if (this.logger) {
            this.logger.error({ message: error, context: `${this.serviceName}.findEntityById error`, data: { params } });
          } else {
            console.error(error);
          }
          throw error;
        }
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async findEntityByFilters(params: BaseFindByFiltersDto): Promise<T | undefined> {
    try {
      return this.runInTransaction(async () => {
        try {
          const items: T[] = await this.findEntities({
            withDeleted: params.withDeleted,
            filters: params.filters,
            populate: params.populate,
          });
          if (items?.length) {
            return items[0];
          }
        } catch (error) {
          if (this.logger) {
            this.logger.error({ message: error, context: `${this.serviceName}.findEntityByFilters error`, data: { params } });
          } else {
            console.error(error);
          }
          throw error;
        }
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async find(params: BaseFindDto): Promise<T[]> {
    try {
      return this.runInTransaction(async () => {
        try {
          return await this.findEntities(params);
        } catch (error) {
          if (this.logger) {
            this.logger.error({ message: error, context: `${this.serviceName}.find error`, data: { params } });
          } else {
            console.error(error);
          }
          throw error;
        }
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async findEntityWithPagination(params: BaseFindDto): Promise<BaseFindWithPaginationDto<T>> {
    try {
      return this.runInTransaction(async () => {
        try {
          const entities: T[] = await this.findEntities(params);
          const count: number = await this.count({
            filters: params.filters,
            populate: params.populate,
            withDeleted: params.withDeleted,
          });
          const page: number = params.pagination?.page || 1;
          const totalPages: number = Math.ceil(count / (params.pagination?.limit || this.defaultPageLimit));
          const result: BaseFindWithPaginationDto<T> = { items: entities, count, page, totalPages };
          return result;
        } catch (error) {
          if (this.logger) {
            this.logger.error({ message: error, context: `${this.serviceName}.findEntityWithPagination error`, data: { params } });
          } else {
            console.error(error);
          }
          throw error;
        }
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async findWithPagination(params: BaseFindDto): Promise<BaseFindWithPaginationDto<T>> {
    try {
      return this.runInTransaction(async () => {
        try {
          const result: BaseFindWithPaginationDto<T> = await this.findEntityWithPagination(params);
          return { items: result.items, count: result.count, page: result.page, totalPages: result.totalPages };
        } catch (error) {
          if (this.logger) {
            this.logger.error({ message: error, context: `${this.serviceName}.findWithPagination error`, data: { params } });
          } else {
            console.error(error);
          }
          throw error;
        }
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async count(params: BaseCountDto): Promise<number> {
    return this.runInTransaction(async () => {
      try {
        const { filters, populate, withDeleted = false } = params;
        const where: FilterQuery<T> = this.buildFilters(filters);
        if (!withDeleted) {
          where['deleted_at'] = { $eq: null };
        }
        const findOptions: FindOptions<T> = {
          // @ts-expect-error its okay
          populate,
        };
        const count: number = await this.repository.count(where, findOptions);
        return count;
      } catch (error) {
        if (this.logger) {
          this.logger.error({ message: error, context: `${this.serviceName}.count error`, data: { params } });
        } else {
          console.error(error);
        }
        throw error;
      }
    });
  }

  async findEntities(params: BaseFindDto): Promise<T[]> {
    try {
      return this.runInTransaction(async () => {
        try {
          const { filters, sort, pagination, populate, withDeleted = false, getAllRows = false, lock } = params;
          const where: FilterQuery<T> = this.buildFilters(filters);
          if (!withDeleted) {
            where['deleted_at'] = { $eq: null };
          }
          const limit: number = Math.min(pagination?.limit || this.defaultPageLimit, this.maxPageLimit);
          const offset: number = pagination?.page ? (pagination.page - 1) * limit : 0;
          const findOptions: FindOptions<T> = {
            // @ts-expect-error its okay
            orderBy: this.buildSort(sort),
            // @ts-expect-error its okay
            populate,
          };
          if (!getAllRows) {
            findOptions.limit = limit;
            findOptions.offset = offset;
          }
          if (lock) {
            findOptions.lockMode = lock;
          }
          const entities: T[] = await this.repository.find(where, findOptions);
          return entities;
        } catch (error) {
          if (this.logger) {
            this.logger.error({ message: error, context: `${this.serviceName}.findEntities error`, data: { params } });
          } else {
            console.error(error);
          }
          throw error;
        }
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  private buildFilters(filters?: BaseFindGroupDto): FilterQuery<T> {
    if (!filters) return {};
    const query: FilterQuery<T> = {};
    if (filters.and) {
      // @ts-expect-error its okay
      query.$and = filters.and.map((condition) => this.buildConditionOrGroup(condition));
    }
    if (filters.or) {
      // @ts-expect-error its okay
      query.$or = filters.or.map((condition) => this.buildConditionOrGroup(condition));
    }
    if (filters.not) {
      // @ts-expect-error its okay
      query.$not = filters.not.map((condition) => this.buildConditionOrGroup(condition));
    }
    return query;
  }

  private buildConditionOrGroup(condition: BaseFindFilterDto | BaseFindGroupDto): FilterQuery<T> {
    if ('field' in condition) {
      return this.buildCondition(condition);
    } else {
      return this.buildFilters(condition);
    }
  }

  private buildCondition(filter: BaseFindFilterDto): FilterQuery<T> {
    const { field, operator, value } = filter;
    const operatorMap: Record<FindOperator, any> = {
      [FindOperator.EQ]: value,
      [FindOperator.NE]: { $ne: value },
      [FindOperator.GT]: { $gt: value },
      [FindOperator.LT]: { $lt: value },
      [FindOperator.GTE]: { $gte: value },
      [FindOperator.LTE]: { $lte: value },
      [FindOperator.CONTAINS]: { $ilike: `%${value}%` },
      [FindOperator.LIKE]: { $like: value },
      [FindOperator.ILIKE]: { $ilike: value },
      [FindOperator.IN]: { $in: value },
      [FindOperator.NOT_IN]: { $nin: value },
      [FindOperator.IS_TRUE]: true,
      [FindOperator.IS_FALSE]: false,
      [FindOperator.IS_NULL]: null,
      [FindOperator.IS_NOT_NULL]: { $ne: null },
      [FindOperator.SOME]: { $some: this.buildFilters(value) },
      [FindOperator.EVERY]: { $every: this.buildFilters(value) },
      [FindOperator.NONE]: { $none: this.buildFilters(value) },
    };
    if (!(operator in operatorMap)) {
      throw new Error(`Unsupported operator: ${operator}`);
    }
    return <FilterQuery<T>>{ [field]: operatorMap[operator] };
  }

  private buildSort(sort?: { field: string; order: SortOrder }[]): Record<string, SortOrder> {
    const result: Record<string, SortOrder> = {};
    if (sort) {
      for (const { field, order } of sort) {
        result[field] = order;
      }
    }
    return result;
  }

  async execRawSql<R = any>(params: ExecRawSqlDto): Promise<R> {
    return this.runInTransaction(async (em: EntityManager) => {
      try {
        const { sql, parameters } = params;
        const { query, sqlParams } = this.convertNamedParameters(sql, parameters);
        const result: R = await em.getConnection().execute<R>(query, sqlParams);
        return result;
      } catch (error) {
        if (this.logger) {
          this.logger.error({ message: error, context: `${this.serviceName}.execRawSql error`, data: { params } });
        } else {
          console.error(error);
        }
        throw error;
      }
    });
  }

  private convertNamedParameters(query: string, parameters?: Record<string, any>): { query: string; sqlParams: any[] } {
    if (!parameters) {
      return { query, sqlParams: [] };
    }
    const sqlParams: any[] = [];
    const newQuery: string = query.replace(/(^|[^:]):([a-zA-Z0-9_]+)/g, (match, prefix, paramName) => {
      if (!(paramName in parameters)) {
        throw new Error(`Parameter ${paramName} not provided`);
      }
      sqlParams.push(parameters[paramName]);
      return `${prefix}?`;
    });
    return { query: newQuery, sqlParams };
  }
}
