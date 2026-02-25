import { Module } from '@nestjs/common';
import { AuthController } from './rest-api/auth.controller';
import { AuthProcessModule } from './processes/auth-process.module';

@Module({
  imports: [AuthProcessModule],
  controllers: [AuthController],
})
export class AuthModule {}
