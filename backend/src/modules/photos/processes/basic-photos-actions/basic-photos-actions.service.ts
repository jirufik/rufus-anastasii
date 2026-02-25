import { Injectable, Inject } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { BaseService } from '../../../../libs/mikro-orm/services/base.service';
import { PhotosRepositoryService } from '../../repository/photos.repository.service';
import { PinoLoggerService } from '../../../../libs/logger/pino-logger.service';
import { PhotoDo } from '../../dto/photo.do';
import { Transactional } from '../../../../libs/mikro-orm/decorators/transactional.decorator';

@Injectable()
export class BasicPhotosActionsService extends BaseService {
  constructor(
    orm: MikroORM,
    @Inject(PinoLoggerService)
    private readonly logger: PinoLoggerService,
    private readonly photosRepository: PhotosRepositoryService,
  ) {
    super(orm);
  }

  @Transactional()
  async create(params: { photo: Partial<PhotoDo> }): Promise<PhotoDo> {
    try {
      const { photo } = params;

      if (!photo) {
        throw new Error('Photo not filled.');
      }

      const createdPhoto: PhotoDo = await this.photosRepository.createPhoto({ photo });
      return createdPhoto;
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
  async findById(params: { id: string }): Promise<PhotoDo | undefined> {
    try {
      const { id } = params;

      if (!id) {
        throw new Error('Id not filled.');
      }

      const photo: PhotoDo = await this.photosRepository.findPhotoById({ id });
      return photo;
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
  async findAll(params?: { locationId?: string }): Promise<PhotoDo[]> {
    try {
      const photos: PhotoDo[] = await this.photosRepository.findPhotos({ locationId: params?.locationId });
      return photos;
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.findAll error`,
        data: { params },
      });
      throw error;
    }
  }

  @Transactional()
  async findAllWithGps(): Promise<PhotoDo[]> {
    try {
      const photos: PhotoDo[] = await this.photosRepository.findAllPhotos();

      const gpsPhotos: PhotoDo[] = photos.filter(
        (p: PhotoDo) => p.latitude != null && p.longitude != null,
      );

      return gpsPhotos;
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.findAllWithGps error`,
      });
      throw error;
    }
  }

  @Transactional()
  async findUngroupedWithGps(): Promise<PhotoDo[]> {
    try {
      const photos: PhotoDo[] = await this.photosRepository.findAllPhotos();

      const ungroupedPhotos: PhotoDo[] = photos.filter(
        (p: PhotoDo) => !p.location && p.latitude != null && p.longitude != null,
      );

      return ungroupedPhotos;
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.findUngroupedWithGps error`,
      });
      throw error;
    }
  }

  @Transactional()
  async update(params: { id: string; data: Partial<PhotoDo> }): Promise<PhotoDo> {
    try {
      const { id, data } = params;

      if (!id) {
        throw new Error('Id not filled.');
      }

      const updatedPhoto: PhotoDo = await this.photosRepository.updatePhoto({
        photo: { ...data, id },
      });
      return updatedPhoto;
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

      await this.photosRepository.deletePhoto({ id });
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.delete error`,
        data: { params },
      });
      throw error;
    }
  }

  @Transactional()
  async moveToLocation(params: { photoId: string; locationId: string | null }): Promise<PhotoDo> {
    try {
      const { photoId, locationId } = params;

      if (!photoId) {
        throw new Error('PhotoId not filled.');
      }

      const updatedPhoto: PhotoDo = await this.photosRepository.updatePhoto({
        photo: { id: photoId, location: locationId },
      });
      return updatedPhoto;
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.moveToLocation error`,
        data: { params },
      });
      throw error;
    }
  }
}
