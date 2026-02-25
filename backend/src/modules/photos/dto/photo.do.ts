import { BaseDomainDto } from '../../../libs/dto/base-domain.dto';

export class PhotoDo extends BaseDomainDto {
  originalFilename?: string;
  filePath?: string;
  thumbnailPath?: string;
  mediaType?: string;
  mimeType?: string;
  fileSize?: string;
  width?: number;
  height?: number;
  latitude?: number;
  longitude?: number;
  takenAt?: Date;
  exifData?: Record<string, any>;
  location?: any;
  sortOrder?: number;
}
