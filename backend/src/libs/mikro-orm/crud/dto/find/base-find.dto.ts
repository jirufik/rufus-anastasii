import { BaseFindGroupDto } from './base-find-group.dto';
import { LockMode } from '@mikro-orm/core';
import { BaseFindSortDto } from './base-find-sort.dto';
import { BaseFindSortPaginationDto } from './base-find-sort-pagination.dto';

export class BaseFindDto {
  filters?: BaseFindGroupDto;
  sort?: BaseFindSortDto[];
  pagination?: BaseFindSortPaginationDto;
  getAllRows?: boolean;
  populate?: string[];
  withDeleted?: boolean = false;
  lock?: Exclude<LockMode, LockMode.OPTIMISTIC>;
}
