import { SortOrder } from '../../enums/sort-order';

export class BaseFindSortDto {
  field: string;
  order: SortOrder;
}
