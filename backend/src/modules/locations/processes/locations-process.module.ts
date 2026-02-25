import { Module } from '@nestjs/common';
import { LocationsProcessService } from './locations-process.service';
import { BasicLocationsActionsModule } from './basic-locations-actions/basic-locations-actions.module';
import { BasicPhotosActionsModule } from '../../photos/processes/basic-photos-actions/basic-photos-actions.module';

@Module({
  imports: [BasicLocationsActionsModule, BasicPhotosActionsModule],
  providers: [LocationsProcessService],
  exports: [LocationsProcessService],
})
export class LocationsProcessModule {}
