import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import request from 'supertest';
import { ClientApiController } from './client-api.controller';
import { LocationsProcessService } from '../../locations/processes/locations-process.service';
import { PhotosProcessService } from '../../photos/processes/photos-process.service';
import { AuthGuard } from '../../../libs/auth/guards/auth.guard';
import { JwtTokenService } from '../../../libs/auth/jwt-token/jwt-token.service';

describe('ClientApiController (integration)', () => {
  let app: INestApplication;
  let locationsProcessService: any;
  let photosProcessService: any;
  let jwtTokenService: any;

  beforeAll(async () => {
    locationsProcessService = {
      findAllEnriched: vi.fn().mockResolvedValue([
        { id: '1', photoCount: 3 },
        { id: '2', photoCount: 0 },
      ]),
      findByIdEnriched: vi.fn(),
    };
    photosProcessService = {
      findById: vi.fn(),
    };
    jwtTokenService = {
      verify: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientApiController],
      providers: [
        { provide: LocationsProcessService, useValue: locationsProcessService },
        { provide: PhotosProcessService, useValue: photosProcessService },
        { provide: JwtTokenService, useValue: jwtTokenService },
        Reflector,
        {
          provide: APP_GUARD,
          useFactory: (reflector: Reflector, jwt: JwtTokenService) => new AuthGuard(reflector, jwt),
          inject: [Reflector, JwtTokenService],
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /api/v1/client/locations — public, no token → 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/client/locations');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('1');
  });

  it('GET /api/v1/client/locations/:id — public, no token → 200', async () => {
    locationsProcessService.findByIdEnriched.mockResolvedValue({
      location: { id: '1', titleEn: 'Helsinki' },
      photos: [{ id: 'p1' }],
    });

    const res = await request(app.getHttpServer())
      .get('/api/v1/client/locations/1');
    expect(res.status).toBe(200);
    expect(res.body.location.id).toBe('1');
  });

  it('GET /api/v1/client/locations/:id — not found → 404', async () => {
    locationsProcessService.findByIdEnriched.mockResolvedValue(undefined);

    const res = await request(app.getHttpServer())
      .get('/api/v1/client/locations/nonexistent');
    expect(res.status).toBe(404);
  });

  it('GET /api/v1/client/photos/:id/file — public, not 401', async () => {
    photosProcessService.findById.mockResolvedValue({
      id: 'p1',
      filePath: '/tmp/nonexistent-test.jpg',
    });

    const res = await request(app.getHttpServer())
      .get('/api/v1/client/photos/p1/file');
    // Route is public — should NOT be 401
    expect(res.status).not.toBe(401);
  });

  it('GET /api/v1/client/photos/:id/thumbnail — public, not 401', async () => {
    photosProcessService.findById.mockResolvedValue({
      id: 'p1',
      thumbnailPath: '/tmp/nonexistent-thumb.jpg',
    });

    const res = await request(app.getHttpServer())
      .get('/api/v1/client/photos/p1/thumbnail');
    // Route is public — should NOT be 401
    expect(res.status).not.toBe(401);
  });
});
