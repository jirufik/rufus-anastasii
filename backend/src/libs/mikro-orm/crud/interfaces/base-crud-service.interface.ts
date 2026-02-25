import { BaseCreateWithOptionsDto } from '../dto/create/base-create-with-options.dto';
import { BaseFindDto } from '../dto/find/base-find.dto';
import { BaseServiceInterface } from './base-service.interface';
import { BaseUpdateWithOptionsDto } from '../dto/update/base-update-with-options.dto';
import { BaseDeleteWithOptionsDto } from '../dto/delete/base-delete-with-options.dto';
import { BaseFindByIdDto } from '../dto/find/base-find-by-id.dto';

export interface BaseCrudServiceInterface<T> extends BaseServiceInterface {
  create(params: BaseCreateWithOptionsDto<T>): Promise<T>;
  delete(params: BaseDeleteWithOptionsDto): Promise<T | undefined>;
  update(params: BaseUpdateWithOptionsDto<T>): Promise<T>;
  findById(params: BaseFindByIdDto): Promise<T | undefined>;
  find(options: BaseFindDto): Promise<T[]>;
}
