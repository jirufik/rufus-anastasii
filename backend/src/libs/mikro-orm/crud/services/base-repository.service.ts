import { BaseCrudService } from './base-crud.service';
import { BaseFindWithPaginationDto } from '../dto/find/base-find-with-pagination.dto';
import { BaseCreateWithOptionsDto } from '../dto/create/base-create-with-options.dto';
import { BaseFindByIdDto } from '../dto/find/base-find-by-id.dto';
import { BaseFindDto } from '../dto/find/base-find.dto';
import { BaseUpdateWithOptionsDto } from '../dto/update/base-update-with-options.dto';
import { BaseDeleteWithOptionsDto } from '../dto/delete/base-delete-with-options.dto';
import { BaseEntityAbstract } from '../entities/base.entity.abstract';

export abstract class BaseRepositoryService<TEntity extends BaseEntityAbstract, TDto> extends BaseCrudService<TEntity> {
  protected abstract readonly DtoClass: new () => TDto;

  // @ts-expect-error - Override with different signature
  override async create(params: BaseCreateWithOptionsDto<TDto>): Promise<TDto> {
    try {
      return await this.createWithRelatedEntities(params);
    } catch (error) {
      this.handleError(error, 'create', params);
    }
  }

  // @ts-expect-error - Override with different signature
  override async findById(params: BaseFindByIdDto): Promise<TDto> {
    try {
      const entity = await this.findEntityById(params);
      this.validateEntity(entity, `${this.getDtoClassName()} not found`);
      return this.toDto(entity);
    } catch (error) {
      this.handleError(error, 'findById', params);
    }
  }

  // @ts-expect-error - Override with different signature
  override async find(params: BaseFindDto): Promise<TDto[]> {
    try {
      const entities = await this.findEntities(params);
      this.validateEntities(entities, `${this.getDtoClassName()}s not found`);
      return this.toDtoArray(entities);
    } catch (error) {
      this.handleError(error, 'find', params);
    }
  }

  // @ts-expect-error - Override with different signature
  override async findWithPagination(params: BaseFindDto): Promise<BaseFindWithPaginationDto<TDto>> {
    try {
      const result = await this.findEntityWithPagination(params);
      return {
        items: this.toDtoArray(result.items),
        count: result.count,
        page: result.page,
        totalPages: result.totalPages,
      };
    } catch (error) {
      this.handleError(error, 'findWithPagination', params);
    }
  }

  // @ts-expect-error - Override with different signature
  override async update(params: BaseUpdateWithOptionsDto<TDto>): Promise<TDto> {
    try {
      return await this.updateWithRelatedEntities(params);
    } catch (error) {
      this.handleError(error, 'update', params);
    }
  }

  // @ts-expect-error - Override with different signature
  override async delete(params: BaseDeleteWithOptionsDto): Promise<TDto | undefined> {
    try {
      return await this.deleteWithRelatedEntities(params);
    } catch (error) {
      this.handleError(error, 'delete', params);
    }
  }

  async createWithRelatedEntities(params: BaseCreateWithOptionsDto<TDto>): Promise<TDto> {
    try {
      const entity = await this.createEntity({
        data: params.data as unknown as Partial<TEntity> | Partial<TEntity>[],
        options: params.options,
      });
      this.validateEntity(entity, `${this.getDtoClassName()} not created`);
      return this.toDto(entity);
    } catch (error) {
      this.handleError(error, 'createWithRelatedEntities', params);
    }
  }

  async updateWithRelatedEntities(params: BaseUpdateWithOptionsDto<TDto>): Promise<TDto> {
    try {
      if (params.options?.partialUpdate) {
        params.options.checkVersion = false;
      }
      const entity = await this.updateEntity({
        data: params.data as unknown as Partial<TEntity>,
        options: params.options,
      });
      return this.toDto(entity);
    } catch (error) {
      this.handleError(error, 'updateWithRelatedEntities', params);
    }
  }

  async deleteWithRelatedEntities(params: BaseDeleteWithOptionsDto): Promise<TDto | undefined> {
    try {
      const entity = await this.deleteEntity({
        id: params.id,
        options: params.options,
      });
      return entity ? this.toDto(entity) : undefined;
    } catch (error) {
      this.handleError(error, 'deleteWithRelatedEntities', params);
    }
  }

  private handleError(error: any, context: string, params?: any): never {
    if (this.logger) {
      this.logger.error({ message: error, context: `${this.serviceName}.${context} error`, data: { params } });
    } else {
      console.error(error);
    }
    throw error;
  }

  private validateEntity<T>(entity: T | undefined, context: string): asserts entity is T {
    if (!entity) {
      throw new Error(context);
    }
  }

  private validateEntities<T>(entities: T[] | undefined, context: string): asserts entities is T[] {
    if (!entities) {
      throw new Error(`${context} not found`);
    }
  }

  private getDtoClassName(): string {
    try {
      return this.DtoClass?.name || 'Entity';
    } catch {
      return 'Entity';
    }
  }

  private toDto(entity: TEntity): TDto {
    return entity.toDomainObject(this.DtoClass);
  }

  private toDtoArray(entities: TEntity[]): TDto[] {
    return entities.map((entity: TEntity) => this.toDto(entity));
  }
}
