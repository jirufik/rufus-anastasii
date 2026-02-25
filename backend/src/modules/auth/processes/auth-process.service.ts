import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { BasicAdminUsersActionsService } from './basic-admin-users-actions/basic-admin-users-actions.service';
import { JwtTokenService } from '../../../libs/auth/jwt-token/jwt-token.service';
import { PinoLoggerService } from '../../../libs/logger/pino-logger.service';
import { LoginRequestDto } from '../dto/login-request.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { AdminUserDo } from '../dto/admin-user.do';
import {
  ENV_KEY_ADMIN_USERNAME,
  ENV_KEY_ADMIN_PASSWORD,
  DEFAULT_BCRYPT_SALT_ROUNDS,
} from '../../../constants/constants';

@Injectable()
export class AuthProcessService implements OnModuleInit {
  serviceName: string = this.constructor.name;

  constructor(
    private readonly basicAdminUsersActions: BasicAdminUsersActionsService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly configService: ConfigService,
    @Inject(PinoLoggerService)
    private readonly logger: PinoLoggerService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedAdminUser();
  }

  async login(params: LoginRequestDto): Promise<LoginResponseDto> {
    try {
      const adminUser: AdminUserDo | undefined = await this.basicAdminUsersActions.findByUsername({
        username: params.username,
      });

      if (!adminUser) {
        throw new Error('Invalid credentials');
      }

      const isPasswordValid: boolean = await bcrypt.compare(params.password, adminUser.passwordHash);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      const accessToken: string = await this.jwtTokenService.sign({
        sub: adminUser.id,
        username: adminUser.username,
      });

      const result: LoginResponseDto = new LoginResponseDto();
      result.accessToken = accessToken;
      return result;
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.login error`,
        data: { username: params.username },
      });
      throw error;
    }
  }

  async checkToken(): Promise<{ valid: boolean }> {
    return { valid: true };
  }

  private async seedAdminUser(): Promise<void> {
    try {
      const username: string = this.configService.get<string>(ENV_KEY_ADMIN_USERNAME);
      const password: string = this.configService.get<string>(ENV_KEY_ADMIN_PASSWORD);

      const existing: AdminUserDo | undefined = await this.basicAdminUsersActions.findByUsername({
        username,
      });

      if (existing) {
        this.logger.info({
          message: `Admin user '${username}' already exists`,
          context: `${this.serviceName}.seedAdminUser`,
        });
        return;
      }

      const passwordHash: string = await bcrypt.hash(password, DEFAULT_BCRYPT_SALT_ROUNDS);
      await this.basicAdminUsersActions.create({
        adminUser: { username, passwordHash },
      });

      this.logger.info({
        message: `Admin user '${username}' created successfully`,
        context: `${this.serviceName}.seedAdminUser`,
      });
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.seedAdminUser error`,
      });
    }
  }
}
