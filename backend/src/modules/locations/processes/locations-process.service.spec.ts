import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocationsProcessService } from './locations-process.service';

describe('LocationsProcessService', () => {
  let service: LocationsProcessService;
  let basicLocationsActions: any;
  let basicPhotosActions: any;
  let configService: any;
  let logger: any;

  beforeEach(() => {
    basicLocationsActions = {
      findAll: vi.fn().mockResolvedValue([]),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    basicPhotosActions = {
      findAll: vi.fn().mockResolvedValue([]),
      findUngroupedWithGps: vi.fn().mockResolvedValue([]),
      moveToLocation: vi.fn(),
    };
    configService = {
      get: vi.fn().mockReturnValue(200),
    };
    logger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() };

    const mockOrm = {} as any;
    service = new LocationsProcessService(
      mockOrm,
      basicLocationsActions,
      basicPhotosActions,
      configService,
      logger,
    );

    vi.spyOn(service as any, 'runInTransaction').mockImplementation(async (cb: any) => cb({} as any));
  });

  describe('findAll', () => {
    it('should delegate to basicLocationsActions.findAll', async () => {
      const locations = [{ id: '1' }];
      basicLocationsActions.findAll.mockResolvedValue(locations);

      const result = await service.findAll();

      expect(basicLocationsActions.findAll).toHaveBeenCalled();
      expect(result).toEqual(locations);
    });
  });

  describe('findById', () => {
    it('should delegate to basicLocationsActions.findById', async () => {
      const location = { id: '1', latitude: 60.1 };
      basicLocationsActions.findById.mockResolvedValue(location);

      const result = await service.findById({ id: '1' });

      expect(basicLocationsActions.findById).toHaveBeenCalledWith({ id: '1' });
      expect(result).toEqual(location);
    });
  });

  describe('createLocation', () => {
    it('should delegate to basicLocationsActions.create', async () => {
      const created = { id: '1', latitude: 60.1 };
      basicLocationsActions.create.mockResolvedValue(created);

      const result = await service.createLocation({ data: { latitude: 60.1 } });

      expect(basicLocationsActions.create).toHaveBeenCalledWith({ location: { latitude: 60.1 } });
      expect(result).toEqual(created);
    });
  });

  describe('updateLocation', () => {
    it('should delegate to basicLocationsActions.update', async () => {
      const updated = { id: '1', titleEn: 'Updated' };
      basicLocationsActions.update.mockResolvedValue(updated);

      const result = await service.updateLocation({ id: '1', data: { titleEn: 'Updated' } });

      expect(basicLocationsActions.update).toHaveBeenCalledWith({ id: '1', data: { titleEn: 'Updated' } });
      expect(result).toEqual(updated);
    });
  });

  describe('deleteLocation', () => {
    it('should delegate to basicLocationsActions.delete', async () => {
      basicLocationsActions.delete.mockResolvedValue(undefined);

      await service.deleteLocation({ id: '1' });

      expect(basicLocationsActions.delete).toHaveBeenCalledWith({ id: '1' });
    });
  });

  describe('findAllEnriched', () => {
    it('should compute photoCount and fallback visitDate', async () => {
      const locations = [
        { id: 'loc-1', visitDate: null, photoCount: 0 },
        { id: 'loc-2', visitDate: null, photoCount: 0 },
      ];
      const photos = [
        { id: 'p1', location: 'loc-1', takenAt: new Date('2024-06-15') },
        { id: 'p2', location: 'loc-1', takenAt: new Date('2024-01-10') },
        { id: 'p3', location: 'loc-2', takenAt: null },
      ];
      basicLocationsActions.findAll.mockResolvedValue(locations);
      basicPhotosActions.findAll.mockResolvedValue(photos);

      const result = await service.findAllEnriched();

      expect(result[0].photoCount).toBe(2);
      expect(result[0].visitDate).toEqual(new Date('2024-01-10'));
      expect(result[1].photoCount).toBe(1);
      expect(result[1].visitDate).toBeNull();
    });
  });

  describe('findByIdEnriched', () => {
    it('should return location with photos and enriched data', async () => {
      const location = { id: 'loc-1', visitDate: null, photoCount: 0 };
      const photos = [
        { id: 'p1', takenAt: new Date('2024-03-15') },
      ];
      basicLocationsActions.findById.mockResolvedValue(location);
      basicPhotosActions.findAll.mockResolvedValue(photos);

      const result = await service.findByIdEnriched({ id: 'loc-1' });

      expect(result.location.photoCount).toBe(1);
      expect(result.location.visitDate).toEqual(new Date('2024-03-15'));
      expect(result.photos).toEqual(photos);
    });

    it('should return undefined if location not found', async () => {
      basicLocationsActions.findById.mockResolvedValue(undefined);

      const result = await service.findByIdEnriched({ id: 'nonexistent' });

      expect(result).toBeUndefined();
    });
  });

  describe('haversineDistance', () => {
    it('should calculate distance between two points', () => {
      // Helsinki (60.1699, 24.9384) to Espoo (60.2055, 24.6559) ≈ ~15km
      const distance = service.haversineDistance({
        lat1: 60.1699,
        lon1: 24.9384,
        lat2: 60.2055,
        lon2: 24.6559,
      });
      expect(distance).toBeGreaterThan(14000);
      expect(distance).toBeLessThan(17000);
    });

    it('should return 0 for same point', () => {
      const distance = service.haversineDistance({
        lat1: 60.1699,
        lon1: 24.9384,
        lat2: 60.1699,
        lon2: 24.9384,
      });
      expect(distance).toBe(0);
    });
  });

  describe('autoGroupPhotos', () => {
    it('should return zeros when no ungrouped photos', async () => {
      basicPhotosActions.findUngroupedWithGps.mockResolvedValue([]);

      const result = await service.autoGroupPhotos();

      expect(result).toEqual({ locationsCreated: 0, photosGrouped: 0 });
    });

    it('should assign photo to existing location if within proximity', async () => {
      const ungrouped = [{ id: 'p1', latitude: 60.170, longitude: 24.938 }];
      const existingLocations = [{ id: 'loc-1', latitude: 60.1701, longitude: 24.9381 }];

      basicPhotosActions.findUngroupedWithGps.mockResolvedValue(ungrouped);
      basicLocationsActions.findAll.mockResolvedValue(existingLocations);
      basicPhotosActions.moveToLocation.mockResolvedValue({});
      vi.spyOn(service as any, 'recalculateLocationCenters').mockResolvedValue(undefined);
      vi.spyOn(service as any, 'fillMissingTitles').mockResolvedValue(0);

      const result = await service.autoGroupPhotos();

      expect(result.photosGrouped).toBe(1);
      expect(result.locationsCreated).toBe(0);
      expect(basicPhotosActions.moveToLocation).toHaveBeenCalledWith({
        photoId: 'p1',
        locationId: 'loc-1',
      });
    });

    it('should create new location if far from all existing', async () => {
      const ungrouped = [{ id: 'p1', latitude: 65.0, longitude: 25.0 }];
      const existingLocations = [{ id: 'loc-1', latitude: 60.0, longitude: 24.0 }];
      const newLocation = { id: 'loc-new', latitude: 65.0, longitude: 25.0 };

      basicPhotosActions.findUngroupedWithGps.mockResolvedValue(ungrouped);
      basicLocationsActions.findAll.mockResolvedValue(existingLocations);
      basicLocationsActions.create.mockResolvedValue(newLocation);
      basicPhotosActions.moveToLocation.mockResolvedValue({});
      vi.spyOn(service as any, 'recalculateLocationCenters').mockResolvedValue(undefined);
      vi.spyOn(service as any, 'fillMissingTitles').mockResolvedValue(0);

      const result = await service.autoGroupPhotos();

      expect(result.locationsCreated).toBe(1);
      expect(result.photosGrouped).toBe(1);
    });
  });

  describe('fillMissingTitles', () => {
    it('should fill titles from reverse geocoding', async () => {
      const locations = [
        { id: 'loc-1', latitude: 60.17, longitude: 24.93, titleRu: null, titleEn: null, titleFi: null },
      ];
      basicLocationsActions.findAll.mockResolvedValue(locations);
      basicLocationsActions.update.mockResolvedValue({});

      vi.spyOn(service as any, 'reverseGeocode').mockResolvedValue('Helsinki');
      vi.spyOn(service as any, 'sleep').mockResolvedValue(undefined);

      const result = await service.fillMissingTitles({ force: false });

      expect(result).toBe(1);
      expect(basicLocationsActions.update).toHaveBeenCalled();
    });

    it('should overwrite existing titles with force=true', async () => {
      const locations = [
        { id: 'loc-1', latitude: 60.17, longitude: 24.93, titleRu: 'Old', titleEn: 'Old', titleFi: 'Old' },
      ];
      basicLocationsActions.findAll.mockResolvedValue(locations);
      basicLocationsActions.update.mockResolvedValue({});

      vi.spyOn(service as any, 'reverseGeocode').mockResolvedValue('New');
      vi.spyOn(service as any, 'sleep').mockResolvedValue(undefined);

      const result = await service.fillMissingTitles({ force: true });

      expect(result).toBe(1);
    });
  });
});
