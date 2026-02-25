import { BaseUpdateDto } from './base-update.dto';
import { BaseUpdateOptionsDto } from './base-update-options.dto';

export class BaseUpdateWithOptionsDto<T> extends BaseUpdateDto<T> {
  options?: BaseUpdateOptionsDto;
}
