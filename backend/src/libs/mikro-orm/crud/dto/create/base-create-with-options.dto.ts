import { BaseCreateDto } from './base-create.dto';
import { BaseCreateOptionsDto } from './base-create-options.dto';

export class BaseCreateWithOptionsDto<T> extends BaseCreateDto<T> {
  options?: BaseCreateOptionsDto;
}
