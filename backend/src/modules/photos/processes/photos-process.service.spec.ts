import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PhotosProcessService } from './photos-process.service';

vi.mock('node:fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn(),
  promises: {
    writeFile: vi.fn().mockResolvedValue(undefined),
    rename: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('test-uuid'),
}));

describe('PhotosProcessService', () => {
  let service: PhotosProcessService;
  let basicPhotosActions: any;
  let exifExtractor: any;
  let mediaConverter: any;
  let configService: any;
  let logger: any;

  beforeEach(() => {
    basicPhotosActions = {
      create: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      moveToLocation: vi.fn(),
    };
    exifExtractor = {
      extract: vi.fn().mockResolvedValue({
        latitude: 60.17,
        longitude: 24.93,
        takenAt: new Date('2024-06-15'),
        width: 4000,
        height: 3000,
        rawExif: {},
      }),
    };
    mediaConverter = {
      normalizeOrientation: vi.fn().mockResolvedValue(undefined),
      rotateImage: vi.fn().mockResolvedValue(undefined),
      convertHeicToJpeg: vi.fn().mockResolvedValue(undefined),
      generateThumbnail: vi.fn().mockResolvedValue(undefined),
      extractVideoThumbnail: vi.fn().mockResolvedValue(undefined),
    };
    configService = {
      get: vi.fn().mockReturnValue('./test-uploads'),
    };
    logger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() };

    const mockOrm = {} as any;
    service = new PhotosProcessService(
      mockOrm,
      basicPhotosActions,
      exifExtractor,
      mediaConverter,
      configService,
      logger,
    );

    vi.spyOn(service as any, 'runInTransaction').mockImplementation(async (cb: any) => cb({} as any));
  });

  describe('uploadPhotos', () => {
    it('should process array of files', async () => {
      const file = {
        originalname: 'test.jpg',
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg',
        size: 1024,
      } as Express.Multer.File;

      const createdPhoto = { id: '1', originalFilename: 'test.jpg' };
      basicPhotosActions.create.mockResolvedValue(createdPhoto);

      const result = await service.uploadPhotos({ files: [file] });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(createdPhoto);
    });
  });

  describe('processFile', () => {
    it('should save original, extract EXIF, and generate thumbnail for JPG', async () => {
      const file = {
        originalname: 'photo.jpg',
        buffer: Buffer.from('data'),
        mimetype: 'image/jpeg',
        size: 2048,
      } as Express.Multer.File;

      const createdPhoto = { id: '1', originalFilename: 'photo.jpg' };
      basicPhotosActions.create.mockResolvedValue(createdPhoto);

      const result = await service.processFile({ file });

      expect(exifExtractor.extract).toHaveBeenCalled();
      expect(mediaConverter.normalizeOrientation).toHaveBeenCalled();
      expect(mediaConverter.generateThumbnail).toHaveBeenCalled();
      expect(basicPhotosActions.create).toHaveBeenCalled();
      expect(result).toEqual(createdPhoto);
    });

    it('should convert HEIC to JPEG', async () => {
      const file = {
        originalname: 'photo.heic',
        buffer: Buffer.from('data'),
        mimetype: 'image/heic',
        size: 4096,
      } as Express.Multer.File;

      basicPhotosActions.create.mockResolvedValue({ id: '1' });

      await service.processFile({ file });

      expect(mediaConverter.convertHeicToJpeg).toHaveBeenCalled();
      expect(mediaConverter.generateThumbnail).toHaveBeenCalled();
    });

    it('should extract video thumbnail for MOV files', async () => {
      const file = {
        originalname: 'video.mov',
        buffer: Buffer.from('data'),
        mimetype: 'video/quicktime',
        size: 8192,
      } as Express.Multer.File;

      basicPhotosActions.create.mockResolvedValue({ id: '1' });

      await service.processFile({ file });

      expect(mediaConverter.extractVideoThumbnail).toHaveBeenCalled();
    });
  });

  describe('rotatePhoto', () => {
    it('should rotate file and regenerate thumbnail', async () => {
      const photo = { id: '1', filePath: '/path/to/file.jpg', thumbnailPath: '/path/to/thumb.jpg' };
      basicPhotosActions.findById.mockResolvedValue(photo);

      const result = await service.rotatePhoto({ id: '1', degrees: 90 });

      expect(mediaConverter.rotateImage).toHaveBeenCalledWith('/path/to/file.jpg', 90);
      expect(mediaConverter.generateThumbnail).toHaveBeenCalledWith('/path/to/file.jpg', '/path/to/thumb.jpg');
      expect(result).toEqual(photo);
    });

    it('should throw "Photo not found" if not found', async () => {
      basicPhotosActions.findById.mockResolvedValue(undefined);

      await expect(service.rotatePhoto({ id: 'x', degrees: 90 })).rejects.toThrow('Photo not found');
    });
  });

  describe('findAll', () => {
    it('should delegate to basicPhotosActions.findAll', async () => {
      basicPhotosActions.findAll.mockResolvedValue([{ id: '1' }]);

      const result = await service.findAll({ locationId: 'loc-1' });

      expect(basicPhotosActions.findAll).toHaveBeenCalledWith({ locationId: 'loc-1' });
      expect(result).toEqual([{ id: '1' }]);
    });
  });

  describe('findById', () => {
    it('should delegate to basicPhotosActions.findById', async () => {
      basicPhotosActions.findById.mockResolvedValue({ id: '1' });

      const result = await service.findById({ id: '1' });

      expect(basicPhotosActions.findById).toHaveBeenCalledWith({ id: '1' });
      expect(result).toEqual({ id: '1' });
    });
  });

  describe('updatePhoto', () => {
    it('should delegate to basicPhotosActions.update', async () => {
      basicPhotosActions.update.mockResolvedValue({ id: '1', sortOrder: 5 });

      const result = await service.updatePhoto({ id: '1', data: { sortOrder: 5 } });

      expect(basicPhotosActions.update).toHaveBeenCalledWith({ id: '1', data: { sortOrder: 5 } });
      expect(result).toEqual({ id: '1', sortOrder: 5 });
    });
  });

  describe('deletePhoto', () => {
    it('should delegate to basicPhotosActions.delete', async () => {
      basicPhotosActions.delete.mockResolvedValue(undefined);

      await service.deletePhoto({ id: '1' });

      expect(basicPhotosActions.delete).toHaveBeenCalledWith({ id: '1' });
    });
  });

  describe('moveToLocation', () => {
    it('should delegate to basicPhotosActions.moveToLocation', async () => {
      basicPhotosActions.moveToLocation.mockResolvedValue({ id: 'p1', location: 'loc-1' });

      const result = await service.moveToLocation({ photoId: 'p1', locationId: 'loc-1' });

      expect(basicPhotosActions.moveToLocation).toHaveBeenCalledWith({
        photoId: 'p1',
        locationId: 'loc-1',
      });
      expect(result).toEqual({ id: 'p1', location: 'loc-1' });
    });
  });

  describe('getMediaType', () => {
    it('should map file extensions correctly', () => {
      const getMediaType = (service as any).getMediaType.bind(service);
      expect(getMediaType({ ext: '.jpg' })).toBe('jpg');
      expect(getMediaType({ ext: '.jpeg' })).toBe('jpg');
      expect(getMediaType({ ext: '.heic' })).toBe('heic');
      expect(getMediaType({ ext: '.heif' })).toBe('heic');
      expect(getMediaType({ ext: '.mov' })).toBe('mov');
      expect(getMediaType({ ext: '.mp4' })).toBe('mp4');
      expect(getMediaType({ ext: '.png' })).toBe('png');
      expect(getMediaType({ ext: '.gif' })).toBe('other');
    });
  });
});
