import { Module } from '@nestjs/common';
import { AdminUsersRepositoryService } from './admin-users.repository.service';

@Module({
  providers: [AdminUsersRepositoryService],
  exports: [AdminUsersRepositoryService],
})
export class AdminUsersRepositoryModule {}
