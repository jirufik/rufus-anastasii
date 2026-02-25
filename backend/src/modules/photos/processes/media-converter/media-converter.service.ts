import { Injectable, Inject } from '@nestjs/common';
import sharp from 'sharp';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { PinoLoggerService } from '../../../../libs/logger/pino-logger.service';

@Injectable()
export class MediaConverterService {
  serviceName: string = this.constructor.name;

  constructor(
    @Inject(PinoLoggerService)
    private readonly logger: PinoLoggerService,
  ) {}

  async normalizeOrientation(inputPath: string): Promise<void> {
    try {
      const tempPath: string = inputPath + '.tmp';
      await sharp(inputPath)
        .rotate()
        .jpeg({ quality: 100, mozjpeg: true })
        .toFile(tempPath);
      await fs.promises.rename(tempPath, inputPath);
    } catch (error) {
      this.logger.warn({
        message: `normalizeOrientation failed: ${error.message}`,
        context: `${this.serviceName}.normalizeOrientation`,
        data: { inputPath },
      });
    }
  }

  async rotateImage(inputPath: string, degrees: number): Promise<void> {
    try {
      const tempPath: string = inputPath + '.tmp';
      await sharp(inputPath)
        .rotate(degrees)
        .jpeg({ quality: 100, mozjpeg: true })
        .toFile(tempPath);
      await fs.promises.rename(tempPath, inputPath);
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.rotateImage error`,
        data: { inputPath, degrees },
      });
      throw error;
    }
  }

  async convertHeicToJpeg(inputPath: string, outputPath: string): Promise<void> {
    try {
      await sharp(inputPath)
        .rotate()
        .jpeg({ quality: 100, mozjpeg: true })
        .toFile(outputPath);
    } catch (error) {
      this.logger.warn({
        message: `sharp HEIC conversion failed, trying heic-convert: ${error.message}`,
        context: `${this.serviceName}.convertHeicToJpeg`,
      });
      try {
        const convert = require('heic-convert');
        const inputBuffer: Buffer = await fs.promises.readFile(inputPath);
        const outputBuffer: Buffer = await convert({
          buffer: inputBuffer,
          format: 'JPEG',
          quality: 1,
        });
        await fs.promises.writeFile(outputPath, outputBuffer);
      } catch (fallbackError) {
        this.logger.error({
          message: fallbackError,
          context: `${this.serviceName}.convertHeicToJpeg fallback error`,
          data: { inputPath },
        });
        throw fallbackError;
      }
    }
  }

  async generateThumbnail(inputPath: string, outputPath: string): Promise<void> {
    try {
      await sharp(inputPath)
        .rotate()
        .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90, mozjpeg: true })
        .toFile(outputPath);
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.generateThumbnail error`,
        data: { inputPath },
      });
      throw error;
    }
  }

  async extractVideoThumbnail(inputPath: string, outputPath: string): Promise<void> {
    try {
      const ffmpeg = require('fluent-ffmpeg');
      return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .screenshots({
            count: 1,
            folder: path.dirname(outputPath),
            filename: path.basename(outputPath),
            size: '600x?',
            timestamps: ['00:00:01'],
          })
          .on('end', () => resolve())
          .on('error', (err: any) => reject(err));
      });
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.extractVideoThumbnail error`,
        data: { inputPath },
      });
      throw error;
    }
  }
}
