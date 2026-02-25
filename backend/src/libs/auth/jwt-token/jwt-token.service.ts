import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';

@Injectable()
export class JwtTokenService {
  constructor(private readonly jwtService: JwtService) {}

  async sign(payload: any, options?: JwtSignOptions): Promise<string> {
    const token: string = await this.jwtService.signAsync(payload, options);
    return token;
  }

  async verify<T extends object = any>(token: string): Promise<T> {
    const decodedToken: T = await this.jwtService.verifyAsync(token);
    return decodedToken;
  }

  decode<T = any>(token: string): T {
    const decodedToken: T = this.jwtService.decode(token);
    return decodedToken;
  }
}
