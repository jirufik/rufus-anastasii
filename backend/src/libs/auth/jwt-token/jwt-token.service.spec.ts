import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JwtTokenService } from './jwt-token.service';

describe('JwtTokenService', () => {
  let service: JwtTokenService;
  let jwtService: any;

  beforeEach(() => {
    jwtService = {
      signAsync: vi.fn().mockResolvedValue('signed-token'),
      verifyAsync: vi.fn().mockResolvedValue({ sub: '1', username: 'admin' }),
      decode: vi.fn().mockReturnValue({ sub: '1', username: 'admin' }),
    };
    service = new JwtTokenService(jwtService);
  });

  it('sign() should call jwtService.signAsync()', async () => {
    const payload = { sub: '1' };
    const result = await service.sign(payload);
    expect(jwtService.signAsync).toHaveBeenCalledWith(payload, undefined);
    expect(result).toBe('signed-token');
  });

  it('sign() should pass options to jwtService.signAsync()', async () => {
    const payload = { sub: '1' };
    const options = { expiresIn: '1h' };
    await service.sign(payload, options);
    expect(jwtService.signAsync).toHaveBeenCalledWith(payload, options);
  });

  it('verify() should call jwtService.verifyAsync()', async () => {
    const result = await service.verify('some-token');
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('some-token');
    expect(result).toEqual({ sub: '1', username: 'admin' });
  });

  it('decode() should call jwtService.decode()', () => {
    const result = service.decode('some-token');
    expect(jwtService.decode).toHaveBeenCalledWith('some-token');
    expect(result).toEqual({ sub: '1', username: 'admin' });
  });
});
