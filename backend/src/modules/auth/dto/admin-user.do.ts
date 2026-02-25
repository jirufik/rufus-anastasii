import { BaseDomainDto } from '../../../libs/dto/base-domain.dto';

export class AdminUserDo extends BaseDomainDto {
  username?: string;
  passwordHash?: string;
}
