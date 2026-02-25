import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import request from 'supertest';
import { LocationsController } from './locations.controller';
import { LocationsProcessService } from '../processes/locations-process.service';
import { AuthGuard } from '../../../libs/auth/guards/auth.guard';
import { JwtTokenService } from '../../../libs/auth/jwt-token/jwt-token.service';

describe('LocationsController (integration)', () => {
  let app: INestApplication;
  let locationsProcessService: any;
  let jwtTokenService: any;

  beforeAll(async () => {
    locationsProcessService = {
      findAllEnriched: vi.fn().mockResolvedValue([{ id: '1' }]),
      findById: vi.fn(),
      createLocation: vi.fn().mockResolvedValue({ id: '1' }),
      updateLocation: vi.fn().mockResolvedValue({ id: '1' }),
      deleteLocation: vi.fn().mockResolvedValue(undefined),
      autoGroupPhotos: vi.fn().mockResolvedValue({ locationsCreated: 1, photosGrouped: 3 }),
      fillMissingTitles: vi.fn().mockResolvedValue(2),
    };
    jwtTokenService = {
      verify: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationsController],
      providers: [
        { provide: LocationsProcessService, useValue: locationsProcessService },
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

  const withAuth = () => {
    jwtTokenService.verify.mockResolvedValue({ sub: '1', username: 'admin' });
    return { key: 'Authorization', value: 'Bearer valid-token' };
  };

  it('GET /api/v1/admin/locations — without token → 401', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/locations');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/admin/locations — with token → 200', async () => {
    const { key, value } = withAuth();
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/locations')
      .set(key, value);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/v1/admin/locations/:id — not found → 404', async () => {
    const { key, value } = withAuth();
    locationsProcessService.findById.mockResolvedValue(undefined);
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/locations/nonexistent')
      .set(key, value);
    expect(res.status).toBe(404);
  });

  it('POST /api/v1/admin/locations — with token → 201', async () => {
    const { key, value } = withAuth();
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/locations')
      .set(key, value)
      .send({ latitude: 60.17, longitude: 24.93 });
    expect(res.status).toBe(201);
  });

  it('PUT /api/v1/admin/locations/:id — with token → 200', async () => {
    const { key, value } = withAuth();
    const res = await request(app.getHttpServer())
      .put('/api/v1/admin/locations/1')
      .set(key, value)
      .send({ titleEn: 'Helsinki' });
    expect(res.status).toBe(200);
  });

  it('DELETE /api/v1/admin/locations/:id — with token → 200', async () => {
    const { key, value } = withAuth();
    const res = await request(app.getHttpServer())
      .delete('/api/v1/admin/locations/1')
      .set(key, value);
    expect(res.status).toBe(200);
  });

  it('POST /api/v1/admin/locations/auto-group — with token → 201', async () => {
    const { key, value } = withAuth();
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/locations/auto-group')
      .set(key, value);
    expect(res.status).toBe(201);
    expect(res.body.locationsCreated).toBe(1);
  });

  it('POST /api/v1/admin/locations/fill-titles — with token → 201', async () => {
    const { key, value } = withAuth();
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/locations/fill-titles')
      .set(key, value)
      .send({ force: false });
    expect(res.status).toBe(201);
    expect(res.body.filled).toBe(2);
  });
});
