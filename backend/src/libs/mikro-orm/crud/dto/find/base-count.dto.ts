import { BaseFindGroupDto } from './base-find-group.dto';

export class BaseCountDto {
  filters?: BaseFindGroupDto;
  populate?: string[];
  withDeleted?: boolean = false;
}
