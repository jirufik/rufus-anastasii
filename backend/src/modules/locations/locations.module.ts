import { Module } from '@nestjs/common';
import { LocationsController } from './rest-api/locations.controller';
import { LocationsProcessModule } from './processes/locations-process.module';
import { BasicLocationsActionsModule } from './processes/basic-locations-actions/basic-locations-actions.module';

@Module({
  imports: [LocationsProcessModule, BasicLocationsActionsModule],
  controllers: [LocationsController],
  exports: [LocationsProcessModule, BasicLocationsActionsModule],
})
export class LocationsModule {}
