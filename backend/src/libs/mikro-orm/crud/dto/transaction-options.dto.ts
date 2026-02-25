import { DEFAULT_TRANSACTION_ISOLATION_LEVEL } from '../constants/constants';
import { IsolationLevel } from '../enums/isolation-level';

export class TransactionOptionsDto {
  transactionIsolationLevel?: IsolationLevel = DEFAULT_TRANSACTION_ISOLATION_LEVEL;
}
