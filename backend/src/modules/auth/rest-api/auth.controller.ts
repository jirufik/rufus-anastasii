import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../libs/auth/decorators/public.decorator';
import { AuthProcessService } from '../processes/auth-process.service';
import { LoginRequestDto } from '../dto/login-request.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { processHttpError, DEFAULT_THROW_PATTERN_ERROR } from '../../../libs/utils/process-http-error';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authProcessService: AuthProcessService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginRequestDto): Promise<LoginResponseDto> {
    try {
      const result: LoginResponseDto = await this.authProcessService.login(body);
      return result;
    } catch (error) {
      processHttpError({
        error,
        errorPatterns: [
          { errorMessagePattern: 'Invalid credentials', httpStatus: HttpStatus.UNAUTHORIZED },
          ...DEFAULT_THROW_PATTERN_ERROR,
        ],
      });
    }
  }

  @Post('check')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async check(): Promise<{ valid: boolean }> {
    const result: { valid: boolean } = await this.authProcessService.checkToken();
    return result;
  }
}
