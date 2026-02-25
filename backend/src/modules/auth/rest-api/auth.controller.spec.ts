import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthProcessService } from '../processes/auth-process.service';
import { AuthGuard } from '../../../libs/auth/guards/auth.guard';
import { JwtTokenService } from '../../../libs/auth/jwt-token/jwt-token.service';

describe('AuthController (integration)', () => {
  let app: INestApplication;
  let authProcessService: any;
  let jwtTokenService: any;

  beforeAll(async () => {
    authProcessService = {
      login: vi.fn(),
      checkToken: vi.fn().mockResolvedValue({ valid: true }),
    };
    jwtTokenService = {
      verify: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthProcessService, useValue: authProcessService },
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

  it('POST /api/v1/auth/login — public, returns 200 + accessToken', async () => {
    authProcessService.login.mockResolvedValue({ accessToken: 'test-token' });

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'pass' });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBe('test-token');
  });

  it('POST /api/v1/auth/login — invalid credentials → 401', async () => {
    authProcessService.login.mockRejectedValue(new Error('Invalid credentials'));

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'wrong' });

    expect(res.status).toBe(401);
  });

  it('POST /api/v1/auth/check — without token → 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/check');

    expect(res.status).toBe(401);
  });

  it('POST /api/v1/auth/check — with valid token → 200', async () => {
    jwtTokenService.verify.mockResolvedValue({ sub: '1', username: 'admin' });

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/check')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });
});
