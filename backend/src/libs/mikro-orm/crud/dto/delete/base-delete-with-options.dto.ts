import { BaseDeleteDto } from './base-delete.dto';
import { BaseDeleteOptionsDto } from './base-delete-options.dto';

export class BaseDeleteWithOptionsDto extends BaseDeleteDto {
  options?: BaseDeleteOptionsDto;
}
