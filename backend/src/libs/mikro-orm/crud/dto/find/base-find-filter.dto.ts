import { FindOperator } from '../../enums/find-operator';

export class BaseFindFilterDto {
  field: string;
  operator: FindOperator;
  value?: any;
}
