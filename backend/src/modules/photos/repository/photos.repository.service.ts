import { Inject, Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { BaseCrudService } from '../../../libs/mikro-orm/crud/services/base-crud.service';
import { PhotoEntity } from './entities/photo.entity';
import { PinoLoggerService } from '../../../libs/logger/pino-logger.service';
import { Transactional } from '../../../libs/mikro-orm/decorators/transactional.decorator';
import { PhotoDo } from '../dto/photo.do';
import { SortOrder } from '../../../libs/mikro-orm/crud/enums/sort-order';
import { FindOperator } from '../../../libs/mikro-orm/crud/enums/find-operator';

@Injectable()
export class PhotosRepositoryService extends BaseCrudService<PhotoEntity> {
  constructor(
    orm: MikroORM,
    @Inject(PinoLoggerService)
    logger: PinoLoggerService,
  ) {
    super({ orm, logger, entity: PhotoEntity });
  }

  @Transactional()
  async createPhoto(params: { photo: Partial<PhotoDo> }): Promise<PhotoDo> {
    try {
      const { photo } = params;
      const entity: PhotoEntity | undefined = await this.createEntity({ data: photo as any });
      if (!entity) return;
      const createdPhoto: PhotoDo = entity.toDomainObject(PhotoDo);
      return createdPhoto;
    } catch (error) {
      this.logger.error({ message: error, context: `${this.serviceName}.createPhoto error`, data: { params } });
      throw error;
    }
  }

  @Transactional()
  async findPhotoById(params: { id: string }): Promise<PhotoDo | undefined> {
    try {
      const entity: PhotoEntity | undefined = await this.findEntityById(params);
      if (!entity) return;
      const photo: PhotoDo = entity.toDomainObject(PhotoDo);
      return photo;
    } catch (error) {
      this.logger.error({ message: error, context: `${this.serviceName}.findPhotoById error`, data: { params } });
      throw error;
    }
  }

  @Transactional()
  async findPhotos(params: { locationId?: string }): Promise<PhotoDo[]> {
    try {
      const filters: any = {};
      if (params?.locationId) {
        filters.and = [{ field: 'location', operator: FindOperator.EQ, value: params.locationId }];
      }
      const entities: PhotoEntity[] = await this.findEntities({
        filters: filters.and ? filters : undefined,
        sort: [{ field: 'sortOrder', order: SortOrder.ASC }],
        getAllRows: true,
      });
      const photos: PhotoDo[] = entities.map((e: PhotoEntity) => e.toDomainObject(PhotoDo));
      return photos;
    } catch (error) {
      this.logger.error({ message: error, context: `${this.serviceName}.findPhotos error`, data: { params } });
      throw error;
    }
  }

  @Transactional()
  async findAllPhotos(): Promise<PhotoDo[]> {
    try {
      const entities: PhotoEntity[] = await this.findEntities({
        getAllRows: true,
      });
      const photos: PhotoDo[] = entities.map((e: PhotoEntity) => e.toDomainObject(PhotoDo));
      return photos;
    } catch (error) {
      this.logger.error({ message: error, context: `${this.serviceName}.findAllPhotos error` });
      throw error;
    }
  }

  @Transactional()
  async updatePhoto(params: { photo: Partial<PhotoDo> }): Promise<PhotoDo> {
    try {
      const { photo } = params;
      const entity: PhotoEntity = await this.updateEntity({ data: photo as any, options: { partialUpdate: true, checkVersion: false } });
      const updatedPhoto: PhotoDo = entity.toDomainObject(PhotoDo);
      return updatedPhoto;
    } catch (error) {
      this.logger.error({ message: error, context: `${this.serviceName}.updatePhoto error`, data: { params } });
      throw error;
    }
  }

  @Transactional()
  async deletePhoto(params: { id: string }): Promise<void> {
    try {
      await this.deleteEntity({ id: params.id, options: { softDelete: true } });
    } catch (error) {
      this.logger.error({ message: error, context: `${this.serviceName}.deletePhoto error`, data: { params } });
      throw error;
    }
  }
}
