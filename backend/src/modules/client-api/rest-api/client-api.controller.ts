import {
  Controller,
  Get,
  Param,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Public } from '../../../libs/auth/decorators/public.decorator';
import { LocationsProcessService } from '../../locations/processes/locations-process.service';
import { PhotosProcessService } from '../../photos/processes/photos-process.service';
import { LocationDo } from '../../locations/dto/location.do';
import { PhotoDo } from '../../photos/dto/photo.do';
import { processHttpError, DEFAULT_THROW_PATTERN_ERROR } from '../../../libs/utils/process-http-error';

@ApiTags('Client API')
@Public()
@Controller('api/v1/client')
export class ClientApiController {
  constructor(
    private readonly locationsProcessService: LocationsProcessService,
    private readonly photosProcessService: PhotosProcessService,
  ) {}

  @Get('locations')
  async getLocations(): Promise<LocationDo[]> {
    try {
      const allLocations: LocationDo[] = await this.locationsProcessService.findAllEnriched();
      const result: LocationDo[] = allLocations.filter((loc: LocationDo) => loc.photoCount > 0);
      return result;
    } catch (error) {
      processHttpError({
        error,
        errorPatterns: DEFAULT_THROW_PATTERN_ERROR,
      });
    }
  }

  @Get('locations/:id')
  async getLocation(@Param('id') id: string): Promise<{ location: LocationDo; photos: PhotoDo[] }> {
    try {
      const enriched: { location: LocationDo; photos: PhotoDo[] } | undefined =
        await this.locationsProcessService.findByIdEnriched({ id });

      if (!enriched) {
        processHttpError({
          error: new Error('Location not found'),
          errorPatterns: [
            { errorMessagePattern: 'not found', httpStatus: HttpStatus.NOT_FOUND },
            ...DEFAULT_THROW_PATTERN_ERROR,
          ],
        });
      }

      const result: { location: LocationDo; photos: PhotoDo[] } = enriched;
      return result;
    } catch (error) {
      processHttpError({
        error,
        errorPatterns: [
          { errorMessagePattern: 'not found', httpStatus: HttpStatus.NOT_FOUND },
          ...DEFAULT_THROW_PATTERN_ERROR,
        ],
      });
    }
  }

  @Get('photos/:id/file')
  async getPhotoFile(@Param('id') id: string, @Res() res: Response): Promise<void> {
    try {
      const photo: PhotoDo = await this.photosProcessService.findById({ id });
      if (!photo || !photo.filePath) {
        res.status(HttpStatus.NOT_FOUND).json({ message: 'Photo not found' });
        return;
      }
      const filePath: string = path.resolve(photo.filePath);
      if (!fs.existsSync(filePath)) {
        res.status(HttpStatus.NOT_FOUND).json({ message: 'File not found' });
        return;
      }
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      res.sendFile(filePath);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Get('photos/:id/thumbnail')
  async getPhotoThumbnail(@Param('id') id: string, @Res() res: Response): Promise<void> {
    try {
      const photo: PhotoDo = await this.photosProcessService.findById({ id });
      if (!photo || !photo.thumbnailPath) {
        res.status(HttpStatus.NOT_FOUND).json({ message: 'Thumbnail not found' });
        return;
      }
      const filePath: string = path.resolve(photo.thumbnailPath);
      if (!fs.existsSync(filePath)) {
        res.status(HttpStatus.NOT_FOUND).json({ message: 'File not found' });
        return;
      }
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      res.sendFile(filePath);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }
}
