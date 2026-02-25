import { BaseFindGroupDto } from './base-find-group.dto';

export class BaseFindByIdDto {
  id: string;
  populate?: string[];
  withDeleted?: boolean = false;
}

export class BaseFindByFiltersDto {
  filters?: BaseFindGroupDto;
  populate?: string[];
  withDeleted?: boolean = false;
}
