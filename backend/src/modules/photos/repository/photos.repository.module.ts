import { Module } from '@nestjs/common';
import { PhotosRepositoryService } from './photos.repository.service';

@Module({
  providers: [PhotosRepositoryService],
  exports: [PhotosRepositoryService],
})
export class PhotosRepositoryModule {}
