import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtTokenService } from './jwt-token.service';
import { registerSchema } from '../../config/global-schema';
import {
  ENV_KEY_JWT_SECRET,
  ENV_KEY_JWT_EXPIRES_IN,
  DEFAULT_JWT_EXPIRES_IN,
} from '../../../constants/constants';

registerSchema({
  [ENV_KEY_JWT_SECRET]: require('joi').string().required(),
  [ENV_KEY_JWT_EXPIRES_IN]: require('joi').string().default(DEFAULT_JWT_EXPIRES_IN),
});

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>(ENV_KEY_JWT_SECRET),
        signOptions: {
          expiresIn: configService.get<string>(ENV_KEY_JWT_EXPIRES_IN, DEFAULT_JWT_EXPIRES_IN),
        },
      }),
    }),
  ],
  providers: [JwtTokenService],
  exports: [JwtTokenService],
})
export class JwtTokenModule {}
