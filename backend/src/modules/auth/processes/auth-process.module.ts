import { Module } from '@nestjs/common';
import { AuthProcessService } from './auth-process.service';
import { BasicAdminUsersActionsModule } from './basic-admin-users-actions/basic-admin-users-actions.module';
import { JwtTokenModule } from '../../../libs/auth/jwt-token/jwt-token.module';

@Module({
  imports: [BasicAdminUsersActionsModule, JwtTokenModule],
  providers: [AuthProcessService],
  exports: [AuthProcessService],
})
export class AuthProcessModule {}
