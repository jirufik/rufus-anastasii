import { HttpException, HttpStatus } from '@nestjs/common';

export interface ErrorPattern {
  errorMessagePattern: string;
  httpStatus: number;
}

export const DEFAULT_THROW_PATTERN_ERROR: ErrorPattern[] = [
  { errorMessagePattern: 'not found', httpStatus: HttpStatus.NOT_FOUND },
  { errorMessagePattern: 'already exists', httpStatus: HttpStatus.CONFLICT },
  { errorMessagePattern: 'forbidden', httpStatus: HttpStatus.FORBIDDEN },
  { errorMessagePattern: 'unauthorized', httpStatus: HttpStatus.UNAUTHORIZED },
];

export function processHttpError(params: { error: any; errorPatterns?: ErrorPattern[] }): never {
  const { error, errorPatterns = DEFAULT_THROW_PATTERN_ERROR } = params;

  if (error instanceof HttpException) {
    throw error;
  }

  const errorMessage: string = error?.message || String(error);

  for (const pattern of errorPatterns) {
    if (errorMessage.toLowerCase().includes(pattern.errorMessagePattern.toLowerCase())) {
      throw new HttpException(errorMessage, pattern.httpStatus);
    }
  }

  throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
}
