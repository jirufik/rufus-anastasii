import { DEFAULT_SOFT_DELETE } from '../../constants/constants';
import { TransactionOptionsDto } from '../transaction-options.dto';

export class BaseDeleteOptionsDto {
  transaction?: TransactionOptionsDto;
  softDelete?: boolean = DEFAULT_SOFT_DELETE;
}
