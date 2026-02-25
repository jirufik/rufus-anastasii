export class BaseCreateDto<T> {
  data: Partial<T> | Partial<T>[];
}
