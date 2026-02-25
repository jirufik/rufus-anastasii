import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExifExtractorService } from './exif-extractor.service';

vi.mock('exifr', () => ({
  default: { parse: vi.fn() },
  parse: vi.fn(),
}));

import * as exifr from 'exifr';

describe('ExifExtractorService', () => {
  let service: ExifExtractorService;
  let logger: any;

  beforeEach(() => {
    logger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() };
    service = new ExifExtractorService(logger);
  });

  it('should extract GPS and date from EXIF', async () => {
    (exifr as any).parse.mockResolvedValue({
      latitude: 60.1699,
      longitude: 24.9384,
      DateTimeOriginal: new Date('2024-06-15T12:00:00'),
      ImageWidth: 4000,
      ImageHeight: 3000,
    });

    const result = await service.extract('/path/to/photo.jpg');

    expect(result.latitude).toBe(60.1699);
    expect(result.longitude).toBe(24.9384);
    expect(result.takenAt).toEqual(new Date('2024-06-15T12:00:00'));
    expect(result.width).toBe(4000);
    expect(result.height).toBe(3000);
  });

  it('should return empty result on parse error', async () => {
    (exifr as any).parse.mockRejectedValue(new Error('Parse error'));

    const result = await service.extract('/path/to/invalid.jpg');

    expect(result.latitude).toBeNull();
    expect(result.longitude).toBeNull();
    expect(result.takenAt).toBeNull();
    expect(result.width).toBeNull();
    expect(result.height).toBeNull();
    expect(result.rawExif).toEqual({});
  });
});
