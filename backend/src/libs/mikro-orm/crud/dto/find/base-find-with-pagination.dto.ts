export class BaseFindWithPaginationDto<T> {
  items: T[];
  count: number;
  page: number;
  totalPages: number;
}
