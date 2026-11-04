import { describe, expect, it } from '@jest/globals';
import { z } from 'zod';
import { ApiError, fromZodError, normalizeError } from '@/services/api/errors';

describe('ApiError', () => {
  it('creates error with default values', () => {
    const error = new ApiError({ message: 'Test error' });

    expect(error.message).toBe('Test error');
    expect(error.name).toBe('ApiError');
    expect(error.statusCode).toBeNull();
    expect(error.code).toBe('UNKNOWN_ERROR');
    expect(error.isNetworkError).toBe(false);
    expect(error.isTimeout).toBe(false);
    expect(error.isCancelled).toBe(false);
  });

  it('correctly identifies unauthorized errors', () => {
    const error = new ApiError({
      message: 'Unauthorized',
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });

    expect(error.isUnauthorized).toBe(true);
    expect(error.isForbidden).toBe(false);
    expect(error.isServerError).toBe(false);
  });

  it('correctly identifies server errors', () => {
    const error = new ApiError({
      message: 'Internal Server Error',
      statusCode: 500,
      code: 'INTERNAL_ERROR',
    });

    expect(error.isServerError).toBe(true);
    expect(error.isUnauthorized).toBe(false);
  });

  it('provides user-friendly messages', () => {
    expect(new ApiError({ message: 'x', isNetworkError: true }).userMessage).toContain(
      'Network error',
    );

    expect(new ApiError({ message: 'x', isTimeout: true }).userMessage).toContain('timed out');

    expect(new ApiError({ message: 'x', isCancelled: true }).userMessage).toContain('cancelled');

    expect(new ApiError({ message: 'x', statusCode: 401 }).userMessage).toContain('session');

    expect(new ApiError({ message: 'x', statusCode: 500 }).userMessage).toContain('our end');
  });

  it('serializes to log-safe format', () => {
    const error = new ApiError({
      message: 'Test',
      statusCode: 404,
      code: 'NOT_FOUND',
    });
    const safe = error.toLogSafe();

    expect(safe.statusCode).toBe(404);
    expect(safe.code).toBe('NOT_FOUND');
    expect(safe).not.toHaveProperty('stack');
  });
});

describe('normalizeError', () => {
  it('returns ApiError as-is', () => {
    const original = new ApiError({ message: 'test' });
    expect(normalizeError(original)).toBe(original);
  });

  it('normalizes regular errors', () => {
    const error = normalizeError(new Error('regular'));
    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('regular');
    expect(error.code).toBe('UNKNOWN_ERROR');
  });

  it('normalizes string errors', () => {
    const error = normalizeError('string error');
    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('string error');
  });
});

describe('fromZodError', () => {
  it('converts Zod errors to ApiError', () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const result = schema.safeParse({ name: 123, age: 'invalid' });

    if (!result.success) {
      const error = fromZodError(result.error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.validationErrors).toBeDefined();
      expect(error.validationErrors?.length).toBeGreaterThan(0);
    }
  });
});
