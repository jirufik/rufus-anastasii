import { Inject, Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { BaseCrudService } from '../../../libs/mikro-orm/crud/services/base-crud.service';
import { LocationEntity } from './entities/location.entity';
import { PinoLoggerService } from '../../../libs/logger/pino-logger.service';
import { Transactional } from '../../../libs/mikro-orm/decorators/transactional.decorator';
import { LocationDo } from '../dto/location.do';
import { SortOrder } from '../../../libs/mikro-orm/crud/enums/sort-order';

@Injectable()
export class LocationsRepositoryService extends BaseCrudService<LocationEntity> {
  constructor(
    orm: MikroORM,
    @Inject(PinoLoggerService)
    logger: PinoLoggerService,
  ) {
    super({ orm, logger, entity: LocationEntity });
  }

  @Transactional()
  async createLocation(params: { location: Partial<LocationDo> }): Promise<LocationDo> {
    try {
      const { location } = params;
      const entity: LocationEntity | undefined = await this.createEntity({ data: location as any });
      if (!entity) return;
      const createdLocation: LocationDo = entity.toDomainObject(LocationDo);
      return createdLocation;
    } catch (error) {
      this.logger.error({ message: error, context: `${this.serviceName}.createLocation error`, data: { params } });
      throw error;
    }
  }

  @Transactional()
  async findLocationById(params: { id: string }): Promise<LocationDo | undefined> {
    try {
      const entity: LocationEntity | undefined = await this.findEntityById(params);
      if (!entity) return;
      const location: LocationDo = entity.toDomainObject(LocationDo);
      return location;
    } catch (error) {
      this.logger.error({ message: error, context: `${this.serviceName}.findLocationById error`, data: { params } });
      throw error;
    }
  }

  @Transactional()
  async findLocations(): Promise<LocationDo[]> {
    try {
      const entities: LocationEntity[] = await this.findEntities({
        sort: [{ field: 'sortOrder', order: SortOrder.ASC }],
        getAllRows: true,
      });
      const locations: LocationDo[] = entities.map((e: LocationEntity) => e.toDomainObject(LocationDo));
      return locations;
    } catch (error) {
      this.logger.error({ message: error, context: `${this.serviceName}.findLocations error` });
      throw error;
    }
  }

  @Transactional()
  async updateLocation(params: { location: Partial<LocationDo> }): Promise<LocationDo> {
    try {
      const { location } = params;
      const entity: LocationEntity = await this.updateEntity({ data: location as any, options: { partialUpdate: true, checkVersion: false } });
      const updatedLocation: LocationDo = entity.toDomainObject(LocationDo);
      return updatedLocation;
    } catch (error) {
      this.logger.error({ message: error, context: `${this.serviceName}.updateLocation error`, data: { params } });
      throw error;
    }
  }

  @Transactional()
  async deleteLocation(params: { id: string }): Promise<void> {
    try {
      await this.deleteEntity({ id: params.id, options: { softDelete: true } });
    } catch (error) {
      this.logger.error({ message: error, context: `${this.serviceName}.deleteLocation error`, data: { params } });
      throw error;
    }
  }
}
