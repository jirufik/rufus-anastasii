import { BaseDto } from './base.dto';

export class BaseDomainDto extends BaseDto {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  version?: number;

  getName(): string {
    return this.constructor.name;
  }
}
