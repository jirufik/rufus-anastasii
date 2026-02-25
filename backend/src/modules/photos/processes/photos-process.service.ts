import { Injectable, Inject } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { BaseService } from '../../../libs/mikro-orm/services/base.service';
import { BasicPhotosActionsService } from './basic-photos-actions/basic-photos-actions.service';
import { ExifExtractorService, ExifResult } from './exif/exif-extractor.service';
import { MediaConverterService } from './media-converter/media-converter.service';
import { PinoLoggerService } from '../../../libs/logger/pino-logger.service';
import { PhotoDo } from '../dto/photo.do';
import { Transactional } from '../../../libs/mikro-orm/decorators/transactional.decorator';
import { ENV_KEY_UPLOAD_DIR, DEFAULT_UPLOAD_DIR } from '../../../constants/constants';

@Injectable()
export class PhotosProcessService extends BaseService {
  private readonly uploadDir: string;

  constructor(
    orm: MikroORM,
    private readonly basicPhotosActions: BasicPhotosActionsService,
    private readonly exifExtractor: ExifExtractorService,
    private readonly mediaConverter: MediaConverterService,
    private readonly configService: ConfigService,
    @Inject(PinoLoggerService)
    private readonly logger: PinoLoggerService,
  ) {
    super(orm);
    this.uploadDir = this.configService.get<string>(ENV_KEY_UPLOAD_DIR, DEFAULT_UPLOAD_DIR);
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    const dirs: string[] = [
      path.join(this.uploadDir, 'originals'),
      path.join(this.uploadDir, 'converted'),
      path.join(this.uploadDir, 'thumbnails'),
    ];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  @Transactional()
  async uploadPhotos(params: { files: Express.Multer.File[] }): Promise<PhotoDo[]> {
    try {
      const { files } = params;
      const results: PhotoDo[] = [];

      for (const file of files) {
        const photo: PhotoDo = await this.processFile({ file });
        results.push(photo);
      }

      return results;
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.uploadPhotos error`,
      });
      throw error;
    }
  }

  @Transactional()
  async processFile(params: { file: Express.Multer.File }): Promise<PhotoDo> {
    try {
      const { file } = params;
      const fileId: string = uuidv4();
      const ext: string = path.extname(file.originalname).toLowerCase();
      const mediaType: string = this.getMediaType({ ext });

      const originalPath: string = path.join(this.uploadDir, 'originals', `${fileId}${ext}`);
      await fs.promises.writeFile(originalPath, file.buffer);

      // Extract EXIF before any conversion (works on all formats)
      const exif: ExifResult = await this.exifExtractor.extract(originalPath);

      let imagePathForThumbnail: string = originalPath;

      if (mediaType === 'heic') {
        // HEIC -> JPG with auto-orientation and max quality
        const convertedPath: string = path.join(this.uploadDir, 'converted', `${fileId}.jpg`);
        await this.mediaConverter.convertHeicToJpeg(originalPath, convertedPath);
        imagePathForThumbnail = convertedPath;
      } else if (mediaType === 'jpg' || mediaType === 'png') {
        // Normalize orientation based on EXIF (auto-rotate)
        await this.mediaConverter.normalizeOrientation(originalPath);
      }

      let thumbnailPath: string | null = null;
      if (mediaType === 'mov' || mediaType === 'mp4') {
        thumbnailPath = path.join(this.uploadDir, 'thumbnails', `${fileId}.jpg`);
        try {
          await this.mediaConverter.extractVideoThumbnail(originalPath, thumbnailPath);
        } catch {
          thumbnailPath = null;
        }
      } else {
        thumbnailPath = path.join(this.uploadDir, 'thumbnails', `${fileId}.jpg`);
        await this.mediaConverter.generateThumbnail(imagePathForThumbnail, thumbnailPath);
      }

      const photoData: Partial<PhotoDo> = {
        originalFilename: file.originalname,
        filePath: mediaType === 'heic' ? imagePathForThumbnail : originalPath,
        thumbnailPath,
        mediaType,
        mimeType: file.mimetype,
        fileSize: String(file.size),
        width: exif.width,
        height: exif.height,
        latitude: exif.latitude,
        longitude: exif.longitude,
        takenAt: exif.takenAt,
        exifData: exif.rawExif,
        sortOrder: 0,
      };

      const createdPhoto: PhotoDo = await this.basicPhotosActions.create({ photo: photoData });
      return createdPhoto;
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.processFile error`,
        data: { filename: params.file.originalname },
      });
      throw error;
    }
  }

  @Transactional()
  async rotatePhoto(params: { id: string; degrees: number }): Promise<PhotoDo> {
    try {
      const { id, degrees } = params;
      const photo: PhotoDo = await this.basicPhotosActions.findById({ id });
      if (!photo) {
        throw new Error('Photo not found');
      }

      // Rotate the main file
      if (photo.filePath && fs.existsSync(photo.filePath)) {
        await this.mediaConverter.rotateImage(photo.filePath, degrees);
      }

      // Regenerate thumbnail from rotated file
      if (photo.filePath && photo.thumbnailPath) {
        await this.mediaConverter.generateThumbnail(photo.filePath, photo.thumbnailPath);
      }

      return photo;
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.rotatePhoto error`,
        data: { params },
      });
      throw error;
    }
  }

  private getMediaType(params: { ext: string }): string {
    const { ext } = params;
    const extMap: Record<string, string> = {
      '.jpg': 'jpg',
      '.jpeg': 'jpg',
      '.heic': 'heic',
      '.heif': 'heic',
      '.mov': 'mov',
      '.mp4': 'mp4',
      '.png': 'png',
    };
    const mediaType: string = extMap[ext] || 'other';
    return mediaType;
  }

  @Transactional()
  async findAll(params?: { locationId?: string }): Promise<PhotoDo[]> {
    try {
      const photos: PhotoDo[] = await this.basicPhotosActions.findAll(params);
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
  async findById(params: { id: string }): Promise<PhotoDo | undefined> {
    try {
      const { id } = params;
      const photo: PhotoDo = await this.basicPhotosActions.findById({ id });
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
  async updatePhoto(params: { id: string; data: Partial<PhotoDo> }): Promise<PhotoDo> {
    try {
      const { id, data } = params;
      const updatedPhoto: PhotoDo = await this.basicPhotosActions.update({ id, data });
      return updatedPhoto;
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.updatePhoto error`,
        data: { params },
      });
      throw error;
    }
  }

  @Transactional()
  async deletePhoto(params: { id: string }): Promise<void> {
    try {
      const { id } = params;
      await this.basicPhotosActions.delete({ id });
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.deletePhoto error`,
        data: { params },
      });
      throw error;
    }
  }

  @Transactional()
  async moveToLocation(params: { photoId: string; locationId: string | null }): Promise<PhotoDo> {
    try {
      const { photoId, locationId } = params;
      const movedPhoto: PhotoDo = await this.basicPhotosActions.moveToLocation({ photoId, locationId });
      return movedPhoto;
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
