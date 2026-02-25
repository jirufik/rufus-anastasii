import { Module } from '@nestjs/common';
import { PhotosController } from './rest-api/photos.controller';
import { PhotosProcessModule } from './processes/photos-process.module';
import { BasicPhotosActionsModule } from './processes/basic-photos-actions/basic-photos-actions.module';

@Module({
  imports: [PhotosProcessModule, BasicPhotosActionsModule],
  controllers: [PhotosController],
  exports: [PhotosProcessModule, BasicPhotosActionsModule],
})
export class PhotosModule {}
