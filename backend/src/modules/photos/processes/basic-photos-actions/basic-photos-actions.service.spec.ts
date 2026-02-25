import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BasicPhotosActionsService } from './basic-photos-actions.service';

describe('BasicPhotosActionsService', () => {
  let service: BasicPhotosActionsService;
  let photosRepository: any;
  let logger: any;

  beforeEach(() => {
    photosRepository = {
      createPhoto: vi.fn(),
      findPhotoById: vi.fn(),
      findPhotos: vi.fn(),
      findAllPhotos: vi.fn(),
      updatePhoto: vi.fn(),
      deletePhoto: vi.fn(),
    };
    logger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() };

    const mockOrm = {} as any;
    service = new BasicPhotosActionsService(mockOrm, logger, photosRepository);

    vi.spyOn(service as any, 'runInTransaction').mockImplementation(async (cb: any) => cb({} as any));
  });

  describe('create', () => {
    it('should create photo via repository', async () => {
      const photo = { originalFilename: 'test.jpg' };
      const created = { id: '1', ...photo };
      photosRepository.createPhoto.mockResolvedValue(created);

      const result = await service.create({ photo });

      expect(photosRepository.createPhoto).toHaveBeenCalledWith({ photo });
      expect(result).toEqual(created);
    });

    it('should throw error if photo is not provided', async () => {
      await expect(service.create({ photo: undefined as any })).rejects.toThrow('Photo not filled.');
    });
  });

  describe('findById', () => {
    it('should return photo by id', async () => {
      const photo = { id: '1', originalFilename: 'test.jpg' };
      photosRepository.findPhotoById.mockResolvedValue(photo);

      const result = await service.findById({ id: '1' });

      expect(photosRepository.findPhotoById).toHaveBeenCalledWith({ id: '1' });
      expect(result).toEqual(photo);
    });

    it('should throw error if id is not provided', async () => {
      await expect(service.findById({ id: '' })).rejects.toThrow('Id not filled.');
    });
  });

  describe('findAll', () => {
    it('should return all photos', async () => {
      const photos = [{ id: '1' }, { id: '2' }];
      photosRepository.findPhotos.mockResolvedValue(photos);

      const result = await service.findAll();

      expect(photosRepository.findPhotos).toHaveBeenCalledWith({ locationId: undefined });
      expect(result).toEqual(photos);
    });

    it('should filter by locationId', async () => {
      photosRepository.findPhotos.mockResolvedValue([{ id: '1' }]);

      await service.findAll({ locationId: 'loc-1' });

      expect(photosRepository.findPhotos).toHaveBeenCalledWith({ locationId: 'loc-1' });
    });
  });

  describe('findAllWithGps', () => {
    it('should return only photos with GPS data', async () => {
      photosRepository.findAllPhotos.mockResolvedValue([
        { id: '1', latitude: 60.1, longitude: 24.9 },
        { id: '2', latitude: null, longitude: null },
        { id: '3', latitude: 61.0, longitude: 25.0 },
      ]);

      const result = await service.findAllWithGps();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('3');
    });
  });

  describe('findUngroupedWithGps', () => {
    it('should return only ungrouped photos with GPS', async () => {
      photosRepository.findAllPhotos.mockResolvedValue([
        { id: '1', latitude: 60.1, longitude: 24.9, location: null },
        { id: '2', latitude: 60.2, longitude: 24.8, location: 'loc-1' },
        { id: '3', latitude: null, longitude: null, location: null },
      ]);

      const result = await service.findUngroupedWithGps();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('update', () => {
    it('should update photo via repository', async () => {
      const updated = { id: '1', originalFilename: 'updated.jpg' };
      photosRepository.updatePhoto.mockResolvedValue(updated);

      const result = await service.update({ id: '1', data: { originalFilename: 'updated.jpg' } });

      expect(photosRepository.updatePhoto).toHaveBeenCalledWith({
        photo: { originalFilename: 'updated.jpg', id: '1' },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('should delete photo via repository', async () => {
      photosRepository.deletePhoto.mockResolvedValue(undefined);

      await service.delete({ id: '1' });

      expect(photosRepository.deletePhoto).toHaveBeenCalledWith({ id: '1' });
    });
  });

  describe('moveToLocation', () => {
    it('should move photo to another location', async () => {
      const updated = { id: 'p1', location: 'loc-1' };
      photosRepository.updatePhoto.mockResolvedValue(updated);

      const result = await service.moveToLocation({ photoId: 'p1', locationId: 'loc-1' });

      expect(photosRepository.updatePhoto).toHaveBeenCalledWith({
        photo: { id: 'p1', location: 'loc-1' },
      });
      expect(result).toEqual(updated);
    });
  });
});
