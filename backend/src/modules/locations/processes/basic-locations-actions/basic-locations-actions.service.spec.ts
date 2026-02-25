import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BasicLocationsActionsService } from './basic-locations-actions.service';

describe('BasicLocationsActionsService', () => {
  let service: BasicLocationsActionsService;
  let locationsRepository: any;
  let logger: any;

  beforeEach(() => {
    locationsRepository = {
      createLocation: vi.fn(),
      findLocationById: vi.fn(),
      findLocations: vi.fn(),
      updateLocation: vi.fn(),
      deleteLocation: vi.fn(),
    };
    logger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() };

    const mockOrm = {} as any;
    service = new BasicLocationsActionsService(mockOrm, logger, locationsRepository);

    vi.spyOn(service as any, 'runInTransaction').mockImplementation(async (cb: any) => cb({} as any));
  });

  describe('create', () => {
    it('should create location via repository', async () => {
      const location = { latitude: 60.1, longitude: 24.9 };
      const created = { id: '1', ...location };
      locationsRepository.createLocation.mockResolvedValue(created);

      const result = await service.create({ location });

      expect(locationsRepository.createLocation).toHaveBeenCalledWith({ location });
      expect(result).toEqual(created);
    });

    it('should throw error if location is not provided', async () => {
      await expect(service.create({ location: undefined as any })).rejects.toThrow(
        'Location not filled.',
      );
    });
  });

  describe('findById', () => {
    it('should return location by id', async () => {
      const location = { id: '1', latitude: 60.1, longitude: 24.9 };
      locationsRepository.findLocationById.mockResolvedValue(location);

      const result = await service.findById({ id: '1' });

      expect(locationsRepository.findLocationById).toHaveBeenCalledWith({ id: '1' });
      expect(result).toEqual(location);
    });
  });

  describe('findAll', () => {
    it('should return all locations', async () => {
      const locations = [{ id: '1' }, { id: '2' }];
      locationsRepository.findLocations.mockResolvedValue(locations);

      const result = await service.findAll();

      expect(locationsRepository.findLocations).toHaveBeenCalled();
      expect(result).toEqual(locations);
    });
  });

  describe('update', () => {
    it('should update location via repository', async () => {
      const updated = { id: '1', titleEn: 'Updated' };
      locationsRepository.updateLocation.mockResolvedValue(updated);

      const result = await service.update({ id: '1', data: { titleEn: 'Updated' } });

      expect(locationsRepository.updateLocation).toHaveBeenCalledWith({
        location: { titleEn: 'Updated', id: '1' },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('should delete location via repository', async () => {
      locationsRepository.deleteLocation.mockResolvedValue(undefined);

      await service.delete({ id: '1' });

      expect(locationsRepository.deleteLocation).toHaveBeenCalledWith({ id: '1' });
    });
  });
});
