import { BaseDomainDto } from '../../../libs/dto/base-domain.dto';

export class LocationDo extends BaseDomainDto {
  latitude?: number;
  longitude?: number;
  titleRu?: string;
  titleEn?: string;
  titleFi?: string;
  descriptionRu?: string;
  descriptionEn?: string;
  descriptionFi?: string;
  coverPhotoId?: string;
  sortOrder?: number;
  visitDate?: Date;
  photos?: any[];
  photoCount?: number;
}
