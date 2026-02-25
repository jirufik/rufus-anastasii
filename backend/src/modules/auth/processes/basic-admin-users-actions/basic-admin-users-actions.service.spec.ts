import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BasicAdminUsersActionsService } from './basic-admin-users-actions.service';

describe('BasicAdminUsersActionsService', () => {
  let service: BasicAdminUsersActionsService;
  let adminUsersRepository: any;
  let logger: any;

  beforeEach(() => {
    adminUsersRepository = {
      create: vi.fn(),
      find: vi.fn(),
    };
    logger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() };

    const mockOrm = {} as any;
    service = new BasicAdminUsersActionsService(mockOrm, logger, adminUsersRepository);

    vi.spyOn(service as any, 'runInTransaction').mockImplementation(async (cb: any) => cb({} as any));
  });

  describe('create', () => {
    it('should create admin user via repository', async () => {
      const adminUser = { username: 'admin', passwordHash: 'hashed' };
      const created = { id: '1', ...adminUser };
      adminUsersRepository.create.mockResolvedValue(created);

      const result = await service.create({ adminUser });

      expect(adminUsersRepository.create).toHaveBeenCalledWith({
        data: adminUser,
        options: {},
      });
      expect(result).toEqual(created);
    });

    it('should throw error if adminUser is not provided', async () => {
      await expect(service.create({ adminUser: undefined as any })).rejects.toThrow(
        'Admin user not filled.',
      );
    });
  });

  describe('findByUsername', () => {
    it('should return admin user by username', async () => {
      const adminUser = { id: '1', username: 'admin' };
      adminUsersRepository.find.mockResolvedValue([adminUser]);

      const result = await service.findByUsername({ username: 'admin' });

      expect(result).toEqual(adminUser);
    });

    it('should return undefined if user not found', async () => {
      adminUsersRepository.find.mockResolvedValue([]);

      const result = await service.findByUsername({ username: 'unknown' });

      expect(result).toBeUndefined();
    });

    it('should throw error if username is not provided', async () => {
      await expect(service.findByUsername({ username: '' })).rejects.toThrow(
        'Username not filled.',
      );
    });
  });
});
