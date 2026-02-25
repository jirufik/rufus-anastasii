import { Module } from '@nestjs/common';
import { BasicLocationsActionsService } from './basic-locations-actions.service';
import { LocationsRepositoryModule } from '../../repository/locations.repository.module';

@Module({
  imports: [LocationsRepositoryModule],
  providers: [BasicLocationsActionsService],
  exports: [BasicLocationsActionsService],
})
export class BasicLocationsActionsModule {}
