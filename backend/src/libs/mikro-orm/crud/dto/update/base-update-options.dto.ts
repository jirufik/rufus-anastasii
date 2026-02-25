import { TransactionOptionsDto } from '../transaction-options.dto';
import { DEFAULT_CHECK_VERSION, DEFAULT_PARTIAL_UPDATE } from '../../constants/constants';

export class BaseUpdateOptionsDto {
  transaction?: TransactionOptionsDto;
  partialUpdate?: boolean = DEFAULT_PARTIAL_UPDATE;
  checkVersion?: boolean = DEFAULT_CHECK_VERSION;
  withDeleted?: boolean = false;
}
