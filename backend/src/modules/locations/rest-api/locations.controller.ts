import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LocationsProcessService } from '../processes/locations-process.service';
import { LocationDo } from '../dto/location.do';
import { processHttpError, DEFAULT_THROW_PATTERN_ERROR } from '../../../libs/utils/process-http-error';

@ApiTags('Admin Locations')
@ApiBearerAuth()
@Controller('api/v1/admin/locations')
export class LocationsController {
  constructor(private readonly locationsProcessService: LocationsProcessService) {}

  @Get()
  async findAll(): Promise<LocationDo[]> {
    try {
      const result: LocationDo[] = await this.locationsProcessService.findAllEnriched();
      return result;
    } catch (error) {
      processHttpError({
        error,
        errorPatterns: DEFAULT_THROW_PATTERN_ERROR,
      });
    }
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<LocationDo> {
    try {
      const result: LocationDo = await this.locationsProcessService.findById({ id });
      if (!result) {
        processHttpError({
          error: new Error('Location not found'),
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

  @Post()
  async create(@Body() data: Partial<LocationDo>): Promise<LocationDo> {
    try {
      const result: LocationDo = await this.locationsProcessService.createLocation({ data });
      return result;
    } catch (error) {
      processHttpError({
        error,
        errorPatterns: DEFAULT_THROW_PATTERN_ERROR,
      });
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Partial<LocationDo>): Promise<LocationDo> {
    try {
      const result: LocationDo = await this.locationsProcessService.updateLocation({ id, data });
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
      await this.locationsProcessService.deleteLocation({ id });
    } catch (error) {
      processHttpError({
        error,
        errorPatterns: DEFAULT_THROW_PATTERN_ERROR,
      });
    }
  }

  @Post('auto-group')
  async autoGroup(): Promise<{ locationsCreated: number; photosGrouped: number }> {
    try {
      const result: { locationsCreated: number; photosGrouped: number } =
        await this.locationsProcessService.autoGroupPhotos();
      return result;
    } catch (error) {
      processHttpError({
        error,
        errorPatterns: DEFAULT_THROW_PATTERN_ERROR,
      });
    }
  }

  @Post('fill-titles')
  async fillTitles(@Body() body?: { force?: boolean }): Promise<{ filled: number }> {
    try {
      const filled: number = await this.locationsProcessService.fillMissingTitles({ force: body?.force || false });
      const result: { filled: number } = { filled };
      return result;
    } catch (error) {
      processHttpError({
        error,
        errorPatterns: DEFAULT_THROW_PATTERN_ERROR,
      });
    }
  }
}
