export class BaseBulkUpdateDto<T> {
  items: Partial<T>[];
}
