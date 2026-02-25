import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let reflector: Reflector;
  let jwtTokenService: any;

  beforeEach(() => {
    reflector = { getAllAndOverride: vi.fn() } as any;
    jwtTokenService = { verify: vi.fn() };
    guard = new AuthGuard(reflector, jwtTokenService);
  });

  function createContext(headers: Record<string, string> = {}): any {
    const request = { headers, user: undefined };
    return {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({ getRequest: () => request }),
      _request: request,
    };
  }

  it('should allow @Public() routes without token', async () => {
    (reflector.getAllAndOverride as any).mockReturnValue(true);
    const context = createContext();
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw UnauthorizedException when no token is provided', async () => {
    (reflector.getAllAndOverride as any).mockReturnValue(false);
    const context = createContext();
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when token is invalid', async () => {
    (reflector.getAllAndOverride as any).mockReturnValue(false);
    jwtTokenService.verify.mockRejectedValue(new Error('invalid'));
    const context = createContext({ authorization: 'Bearer invalid-token' });
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should allow access and set request.user with valid token', async () => {
    const payload = { sub: '1', username: 'admin' };
    (reflector.getAllAndOverride as any).mockReturnValue(false);
    jwtTokenService.verify.mockResolvedValue(payload);
    const context = createContext({ authorization: 'Bearer valid-token' });
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(context._request.user).toEqual(payload);
  });

  it('should return undefined token when authorization header has wrong type', async () => {
    (reflector.getAllAndOverride as any).mockReturnValue(false);
    const context = createContext({ authorization: 'Basic some-token' });
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });
});
