import { Injectable, Inject } from '@nestjs/common';
import * as exifr from 'exifr';
import { PinoLoggerService } from '../../../../libs/logger/pino-logger.service';

export interface ExifResult {
  latitude: number | null;
  longitude: number | null;
  takenAt: Date | null;
  width: number | null;
  height: number | null;
  rawExif: Record<string, any>;
}

@Injectable()
export class ExifExtractorService {
  serviceName: string = this.constructor.name;

  constructor(
    @Inject(PinoLoggerService)
    private readonly logger: PinoLoggerService,
  ) {}

  async extract(filePath: string): Promise<ExifResult> {
    try {
      const exif = await exifr.parse(filePath, {
        gps: true,
        pick: ['DateTimeOriginal', 'GPSLatitude', 'GPSLongitude', 'ImageWidth', 'ImageHeight', 'Make', 'Model', 'Orientation'],
      });

      const result: ExifResult = {
        latitude: exif?.latitude ?? null,
        longitude: exif?.longitude ?? null,
        takenAt: exif?.DateTimeOriginal ?? null,
        width: exif?.ImageWidth ?? null,
        height: exif?.ImageHeight ?? null,
        rawExif: exif ?? {},
      };
      return result;
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.extract error`,
        data: { filePath },
      });
      const emptyResult: ExifResult = {
        latitude: null,
        longitude: null,
        takenAt: null,
        width: null,
        height: null,
        rawExif: {},
      };
      return emptyResult;
    }
  }
}
