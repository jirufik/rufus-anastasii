import { Module } from '@nestjs/common';
import { BasicAdminUsersActionsService } from './basic-admin-users-actions.service';
import { AdminUsersRepositoryModule } from '../../repository/admin-users.repository.module';

@Module({
  imports: [AdminUsersRepositoryModule],
  providers: [BasicAdminUsersActionsService],
  exports: [BasicAdminUsersActionsService],
})
export class BasicAdminUsersActionsModule {}
