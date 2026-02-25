import { BaseFindFilterDto } from './base-find-filter.dto';

export class BaseFindGroupDto {
  and?: (BaseFindFilterDto | BaseFindGroupDto)[];
  or?: (BaseFindFilterDto | BaseFindGroupDto)[];
  not?: (BaseFindFilterDto | BaseFindGroupDto)[];
}
