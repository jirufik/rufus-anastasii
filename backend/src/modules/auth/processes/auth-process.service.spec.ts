import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProcessService } from './auth-process.service';

vi.mock('bcrypt', () => ({
  compare: vi.fn(),
  hash: vi.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('AuthProcessService', () => {
  let service: AuthProcessService;
  let basicAdminUsersActions: any;
  let jwtTokenService: any;
  let configService: any;
  let logger: any;

  beforeEach(() => {
    basicAdminUsersActions = {
      findByUsername: vi.fn(),
      create: vi.fn(),
    };
    jwtTokenService = {
      sign: vi.fn().mockResolvedValue('jwt-token'),
    };
    configService = {
      get: vi.fn((key: string) => {
        const map: Record<string, string> = {
          ADMIN_USERNAME: 'admin',
          ADMIN_PASSWORD: 'password123',
        };
        return map[key];
      }),
    };
    logger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() };

    service = new AuthProcessService(
      basicAdminUsersActions,
      jwtTokenService,
      configService,
      logger,
    );
  });

  describe('login', () => {
    it('should return accessToken on successful login', async () => {
      const adminUser = { id: '1', username: 'admin', passwordHash: 'hashed' };
      basicAdminUsersActions.findByUsername.mockResolvedValue(adminUser);
      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await service.login({ username: 'admin', password: 'password123' });

      expect(result.accessToken).toBe('jwt-token');
      expect(jwtTokenService.sign).toHaveBeenCalledWith({ sub: '1', username: 'admin' });
    });

    it('should throw "Invalid credentials" when user not found', async () => {
      basicAdminUsersActions.findByUsername.mockResolvedValue(undefined);

      await expect(
        service.login({ username: 'unknown', password: 'pass' }),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw "Invalid credentials" when password is wrong', async () => {
      const adminUser = { id: '1', username: 'admin', passwordHash: 'hashed' };
      basicAdminUsersActions.findByUsername.mockResolvedValue(adminUser);
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(
        service.login({ username: 'admin', password: 'wrong' }),
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('checkToken', () => {
    it('should return { valid: true }', async () => {
      const result = await service.checkToken();
      expect(result).toEqual({ valid: true });
    });
  });

  describe('seedAdminUser', () => {
    it('should create admin user if not exists', async () => {
      basicAdminUsersActions.findByUsername.mockResolvedValue(undefined);
      (bcrypt.hash as any).mockResolvedValue('hashed-password');

      await (service as any).seedAdminUser();

      expect(basicAdminUsersActions.create).toHaveBeenCalledWith({
        adminUser: { username: 'admin', passwordHash: 'hashed-password' },
      });
    });

    it('should not create admin user if already exists', async () => {
      basicAdminUsersActions.findByUsername.mockResolvedValue({ id: '1', username: 'admin' });

      await (service as any).seedAdminUser();

      expect(basicAdminUsersActions.create).not.toHaveBeenCalled();
    });
  });
});
