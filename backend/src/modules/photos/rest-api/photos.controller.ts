import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UploadedFiles,
  UseInterceptors,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { PhotosProcessService } from '../processes/photos-process.service';
import { PhotoDo } from '../dto/photo.do';
import { processHttpError, DEFAULT_THROW_PATTERN_ERROR } from '../../../libs/utils/process-http-error';

@ApiTags('Admin Photos')
@ApiBearerAuth()
@Controller('api/v1/admin/photos')
export class PhotosController {
  constructor(private readonly photosProcessService: PhotosProcessService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 50))
  async upload(@UploadedFiles() files: Express.Multer.File[]): Promise<PhotoDo[]> {
    try {
      const result: PhotoDo[] = await this.photosProcessService.uploadPhotos({ files });
      return result;
    } catch (error) {
      processHttpError({
        error,
        errorPatterns: DEFAULT_THROW_PATTERN_ERROR,
      });
    }
  }

  @Get()
  async findAll(@Query('locationId') locationId?: string): Promise<PhotoDo[]> {
    try {
      const result: PhotoDo[] = await this.photosProcessService.findAll({ locationId });
      return result;
    } catch (error) {
      processHttpError({
        error,
        errorPatterns: DEFAULT_THROW_PATTERN_ERROR,
      });
    }
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<PhotoDo> {
    try {
      const result: PhotoDo = await this.photosProcessService.findById({ id });
      if (!result) {
        processHttpError({
          error: new Error('Photo not found'),
          errorPatterns: [
            { errorMessagePattern: 'not found', httpStatus: HttpStatus.NOT_FOUND },
            ...DEFAULT_THROW_PATTERN_ERROR,
          ],
        });
      }
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

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Partial<PhotoDo>): Promise<PhotoDo> {
    try {
      const result: PhotoDo = await this.photosProcessService.updatePhoto({ id, data });
      return result;
    } catch (error) {
      processHttpError({
        error,
        errorPatterns: DEFAULT_THROW_PATTERN_ERROR,
      });
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    try {
      await this.photosProcessService.deletePhoto({ id });
    } catch (error) {
      processHttpError({
        error,
        errorPatterns: DEFAULT_THROW_PATTERN_ERROR,
      });
    }
  }

  @Put(':id/rotate')
  async rotate(
    @Param('id') id: string,
    @Body('degrees') degrees: number,
  ): Promise<PhotoDo> {
    try {
      const result: PhotoDo = await this.photosProcessService.rotatePhoto({ id, degrees });
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

  @Put(':id/move')
  async moveToLocation(
    @Param('id') id: string,
    @Body('locationId') locationId: string | null,
  ): Promise<PhotoDo> {
    try {
      const result: PhotoDo = await this.photosProcessService.moveToLocation({ photoId: id, locationId });
      return result;
    } catch (error) {
      processHttpError({
        error,
        errorPatterns: DEFAULT_THROW_PATTERN_ERROR,
      });
    }
  }
}
