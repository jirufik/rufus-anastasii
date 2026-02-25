import { Module } from '@nestjs/common';
import { PhotosProcessService } from './photos-process.service';
import { BasicPhotosActionsModule } from './basic-photos-actions/basic-photos-actions.module';
import { ExifExtractorModule } from './exif/exif-extractor.module';
import { MediaConverterModule } from './media-converter/media-converter.module';

@Module({
  imports: [BasicPhotosActionsModule, ExifExtractorModule, MediaConverterModule],
  providers: [PhotosProcessService],
  exports: [PhotosProcessService],
})
export class PhotosProcessModule {}
