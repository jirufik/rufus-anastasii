import { Module } from '@nestjs/common';
import { BasicPhotosActionsService } from './basic-photos-actions.service';
import { PhotosRepositoryModule } from '../../repository/photos.repository.module';

@Module({
  imports: [PhotosRepositoryModule],
  providers: [BasicPhotosActionsService],
  exports: [BasicPhotosActionsService],
})
export class BasicPhotosActionsModule {}
