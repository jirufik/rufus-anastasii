import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('sharp', () => {
  const toFile = vi.fn().mockResolvedValue(undefined);
  const jpeg = vi.fn().mockReturnValue({ toFile });
  const resize = vi.fn().mockReturnValue({ jpeg });
  const rotate = vi.fn().mockReturnValue({ resize, jpeg, toFile });
  const sharp = vi.fn(() => ({ rotate, resize, jpeg, toFile }));
  (sharp as any).__mocks = { rotate, resize, jpeg, toFile };
  return { default: sharp };
});

vi.mock('node:fs', () => ({
  promises: {
    rename: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue(Buffer.from('test')),
    writeFile: vi.fn().mockResolvedValue(undefined),
  },
}));

import sharp from 'sharp';
import { MediaConverterService } from './media-converter.service';

function getMocks() {
  return (sharp as any).__mocks as {
    rotate: ReturnType<typeof vi.fn>;
    resize: ReturnType<typeof vi.fn>;
    jpeg: ReturnType<typeof vi.fn>;
    toFile: ReturnType<typeof vi.fn>;
  };
}

describe('MediaConverterService', () => {
  let service: MediaConverterService;
  let logger: any;

  beforeEach(() => {
    logger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() };
    service = new MediaConverterService(logger);

    const { rotate, resize, jpeg, toFile } = getMocks();
    vi.clearAllMocks();

    toFile.mockResolvedValue(undefined);
    jpeg.mockReturnValue({ toFile });
    resize.mockReturnValue({ jpeg });
    rotate.mockReturnValue({ resize, jpeg, toFile });
    (sharp as any).mockImplementation(() => ({ rotate, resize, jpeg, toFile }));
  });

  describe('generateThumbnail', () => {
    it('should call sharp with correct resize parameters', async () => {
      const { rotate, resize, jpeg, toFile } = getMocks();

      await service.generateThumbnail('/input.jpg', '/output.jpg');

      expect(sharp).toHaveBeenCalledWith('/input.jpg');
      expect(rotate).toHaveBeenCalled();
      expect(resize).toHaveBeenCalledWith(600, 600, {
        fit: 'inside',
        withoutEnlargement: true,
      });
      expect(jpeg).toHaveBeenCalledWith({ quality: 90, mozjpeg: true });
      expect(toFile).toHaveBeenCalledWith('/output.jpg');
    });
  });

  describe('normalizeOrientation', () => {
    it('should call sharp.rotate() for auto-rotation', async () => {
      const { rotate, jpeg } = getMocks();

      await service.normalizeOrientation('/input.jpg');

      expect(sharp).toHaveBeenCalledWith('/input.jpg');
      expect(rotate).toHaveBeenCalled();
      expect(jpeg).toHaveBeenCalledWith({ quality: 100, mozjpeg: true });
    });
  });

  describe('rotateImage', () => {
    it('should call sharp.rotate(degrees)', async () => {
      const { rotate, jpeg } = getMocks();

      await service.rotateImage('/input.jpg', 90);

      expect(sharp).toHaveBeenCalledWith('/input.jpg');
      expect(rotate).toHaveBeenCalledWith(90);
      expect(jpeg).toHaveBeenCalledWith({ quality: 100, mozjpeg: true });
    });
  });

  describe('convertHeicToJpeg', () => {
    it('should convert via sharp', async () => {
      const { rotate, jpeg, toFile } = getMocks();

      await service.convertHeicToJpeg('/input.heic', '/output.jpg');

      expect(sharp).toHaveBeenCalledWith('/input.heic');
      expect(rotate).toHaveBeenCalled();
      expect(jpeg).toHaveBeenCalledWith({ quality: 100, mozjpeg: true });
      expect(toFile).toHaveBeenCalledWith('/output.jpg');
    });
  });
});
