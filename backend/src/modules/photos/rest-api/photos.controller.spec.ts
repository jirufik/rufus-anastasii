import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import request from 'supertest';
import { PhotosController } from './photos.controller';
import { PhotosProcessService } from '../processes/photos-process.service';
import { AuthGuard } from '../../../libs/auth/guards/auth.guard';
import { JwtTokenService } from '../../../libs/auth/jwt-token/jwt-token.service';

describe('PhotosController (integration)', () => {
  let app: INestApplication;
  let photosProcessService: any;
  let jwtTokenService: any;

  beforeAll(async () => {
    photosProcessService = {
      uploadPhotos: vi.fn().mockResolvedValue([{ id: '1' }]),
      findAll: vi.fn().mockResolvedValue([{ id: '1' }]),
      findById: vi.fn(),
      updatePhoto: vi.fn().mockResolvedValue({ id: '1' }),
      deletePhoto: vi.fn().mockResolvedValue(undefined),
      deletePhotos: vi.fn().mockResolvedValue(undefined),
      rotatePhoto: vi.fn().mockResolvedValue({ id: '1' }),
      moveToLocation: vi.fn().mockResolvedValue({ id: '1' }),
    };
    jwtTokenService = {
      verify: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PhotosController],
      providers: [
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

  const withAuth = () => {
    jwtTokenService.verify.mockResolvedValue({ sub: '1', username: 'admin' });
    return { key: 'Authorization', value: 'Bearer valid-token' };
  };

  it('POST /api/v1/admin/photos/upload — without token → 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/photos/upload');
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/admin/photos/upload — with token → 201', async () => {
    const { key, value } = withAuth();
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/photos/upload')
      .set(key, value)
      .attach('files', Buffer.from('test'), 'test.jpg');
    expect(res.status).toBe(201);
  });

  it('GET /api/v1/admin/photos — without token → 401', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/photos');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/admin/photos — with token → 200', async () => {
    const { key, value } = withAuth();
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/photos')
      .set(key, value);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/v1/admin/photos/:id — not found → 404', async () => {
    const { key, value } = withAuth();
    photosProcessService.findById.mockResolvedValue(undefined);
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/photos/nonexistent')
      .set(key, value);
    expect(res.status).toBe(404);
  });

  it('PUT /api/v1/admin/photos/:id — with token → 200', async () => {
    const { key, value } = withAuth();
    const res = await request(app.getHttpServer())
      .put('/api/v1/admin/photos/1')
      .set(key, value)
      .send({ sortOrder: 5 });
    expect(res.status).toBe(200);
  });

  it('POST /api/v1/admin/photos/delete-batch — without token → 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/photos/delete-batch')
      .send({ ids: ['1', '2'] });
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/admin/photos/delete-batch — with token → 201', async () => {
    const { key, value } = withAuth();
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/photos/delete-batch')
      .set(key, value)
      .send({ ids: ['1', '2'] });
    expect(res.status).toBe(201);
    expect(photosProcessService.deletePhotos).toHaveBeenCalledWith({ ids: ['1', '2'] });
  });

  it('DELETE /api/v1/admin/photos/:id — with token → 200', async () => {
    const { key, value } = withAuth();
    const res = await request(app.getHttpServer())
      .delete('/api/v1/admin/photos/1')
      .set(key, value);
    expect(res.status).toBe(200);
  });

  it('PUT /api/v1/admin/photos/:id/rotate — with token → 200', async () => {
    const { key, value } = withAuth();
    const res = await request(app.getHttpServer())
      .put('/api/v1/admin/photos/1/rotate')
      .set(key, value)
      .send({ degrees: 90 });
    expect(res.status).toBe(200);
  });

  it('PUT /api/v1/admin/photos/:id/move — with token → 200', async () => {
    const { key, value } = withAuth();
    const res = await request(app.getHttpServer())
      .put('/api/v1/admin/photos/1/move')
      .set(key, value)
      .send({ locationId: 'loc-1' });
    expect(res.status).toBe(200);
  });
});
