import { BaseBulkUpdateDto } from './base-bulk-update.dto';
import { BaseUpdateOptionsDto } from './base-update-options.dto';

export class BaseBulkUpdateWithOptionsDto<T> extends BaseBulkUpdateDto<T> {
  options?: BaseUpdateOptionsDto;
}
