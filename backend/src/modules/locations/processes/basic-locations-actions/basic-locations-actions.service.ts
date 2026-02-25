import { Injectable, Inject } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { BaseService } from '../../../../libs/mikro-orm/services/base.service';
import { LocationsRepositoryService } from '../../repository/locations.repository.service';
import { PinoLoggerService } from '../../../../libs/logger/pino-logger.service';
import { LocationDo } from '../../dto/location.do';
import { Transactional } from '../../../../libs/mikro-orm/decorators/transactional.decorator';

@Injectable()
export class BasicLocationsActionsService extends BaseService {
  constructor(
    orm: MikroORM,
    @Inject(PinoLoggerService)
    private readonly logger: PinoLoggerService,
    private readonly locationsRepository: LocationsRepositoryService,
  ) {
    super(orm);
  }

  @Transactional()
  async create(params: { location: Partial<LocationDo> }): Promise<LocationDo> {
    try {
      const { location } = params;

      if (!location) {
        throw new Error('Location not filled.');
      }

      const createdLocation: LocationDo = await this.locationsRepository.createLocation({ location });
      return createdLocation;
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.create error`,
        data: { params },
      });
      throw error;
    }
  }

  @Transactional()
  async findById(params: { id: string }): Promise<LocationDo | undefined> {
    try {
      const { id } = params;

      if (!id) {
        throw new Error('Id not filled.');
      }

      const location: LocationDo = await this.locationsRepository.findLocationById({ id });
      return location;
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.findById error`,
        data: { params },
      });
      throw error;
    }
  }

  @Transactional()
  async findAll(): Promise<LocationDo[]> {
    try {
      const locations: LocationDo[] = await this.locationsRepository.findLocations();
      return locations;
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.findAll error`,
      });
      throw error;
    }
  }

  @Transactional()
  async update(params: { id: string; data: Partial<LocationDo> }): Promise<LocationDo> {
    try {
      const { id, data } = params;

      if (!id) {
        throw new Error('Id not filled.');
      }

      const updatedLocation: LocationDo = await this.locationsRepository.updateLocation({
        location: { ...data, id },
      });
      return updatedLocation;
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.update error`,
        data: { params },
      });
      throw error;
    }
  }

  @Transactional()
  async delete(params: { id: string }): Promise<void> {
    try {
      const { id } = params;

      if (!id) {
        throw new Error('Id not filled.');
      }

      await this.locationsRepository.deleteLocation({ id });
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.delete error`,
        data: { params },
      });
      throw error;
    }
  }
}
