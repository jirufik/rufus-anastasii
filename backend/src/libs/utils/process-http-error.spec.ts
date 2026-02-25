import { describe, it, expect } from 'vitest';
import { HttpException, HttpStatus } from '@nestjs/common';
import { processHttpError, DEFAULT_THROW_PATTERN_ERROR } from './process-http-error';

describe('processHttpError', () => {
  it('should rethrow HttpException as is', () => {
    const original = new HttpException('Already handled', HttpStatus.BAD_REQUEST);
    expect(() => processHttpError({ error: original })).toThrow(original);
  });

  it('should match "not found" pattern → 404', () => {
    try {
      processHttpError({ error: new Error('Entity not found') });
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.NOT_FOUND);
    }
  });

  it('should match "already exists" pattern → 409', () => {
    try {
      processHttpError({ error: new Error('User already exists') });
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.CONFLICT);
    }
  });

  it('should match "unauthorized" pattern → 401', () => {
    try {
      processHttpError({ error: new Error('unauthorized access') });
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    }
  });

  it('should match "forbidden" pattern → 403', () => {
    try {
      processHttpError({ error: new Error('Access forbidden') });
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.FORBIDDEN);
    }
  });

  it('should throw 500 if no pattern matches', () => {
    try {
      processHttpError({ error: new Error('Something went wrong') });
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    }
  });

  it('should be case-insensitive', () => {
    try {
      processHttpError({ error: new Error('NOT FOUND') });
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.NOT_FOUND);
    }
  });

  it('should accept custom error patterns', () => {
    const customPatterns = [
      { errorMessagePattern: 'custom error', httpStatus: HttpStatus.I_AM_A_TEAPOT },
    ];
    try {
      processHttpError({ error: new Error('This is a custom error'), errorPatterns: customPatterns });
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.I_AM_A_TEAPOT);
    }
  });
});
