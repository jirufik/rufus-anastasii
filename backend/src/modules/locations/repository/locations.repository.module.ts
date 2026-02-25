import { Module } from '@nestjs/common';
import { LocationsRepositoryService } from './locations.repository.service';

@Module({
  providers: [LocationsRepositoryService],
  exports: [LocationsRepositoryService],
})
export class LocationsRepositoryModule {}
