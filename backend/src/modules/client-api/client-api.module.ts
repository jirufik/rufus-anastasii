import { Module } from '@nestjs/common';
import { ClientApiController } from './rest-api/client-api.controller';
import { LocationsProcessModule } from '../locations/processes/locations-process.module';
import { PhotosProcessModule } from '../photos/processes/photos-process.module';

@Module({
  imports: [LocationsProcessModule, PhotosProcessModule],
  controllers: [ClientApiController],
})
export class ClientApiModule {}
