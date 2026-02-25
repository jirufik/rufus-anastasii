import { Module } from '@nestjs/common';
import { ExifExtractorService } from './exif-extractor.service';

@Module({
  providers: [ExifExtractorService],
  exports: [ExifExtractorService],
})
export class ExifExtractorModule {}
