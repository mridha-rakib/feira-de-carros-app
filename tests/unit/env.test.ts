import { describe, expect, it } from '@jest/globals';
import { envSchema } from '@/config/env';

describe('environment configuration', () => {
  it('rejects missing URLs and unsupported schemes', () => {
    expect(envSchema.safeParse({}).success).toBe(false);
    expect(envSchema.safeParse({ EXPO_PUBLIC_API_URL: 'ftp://example.test' }).success).toBe(false);
  });
  it('rejects credentials and queries in the base URL', () => {
    for (const url of [
      'https://user:pass@example.test',
      'https://example.test?token=secret',
      'https://example.test#fragment',
    ]) {
      expect(envSchema.safeParse({ EXPO_PUBLIC_API_URL: url }).success).toBe(false);
    }
  });
  it('accepts an API path prefix and validates environment names', () => {
    expect(
      envSchema.parse({ EXPO_PUBLIC_API_URL: 'https://example.test/api/v1' }).EXPO_PUBLIC_APP_ENV,
    ).toBe('development');
    expect(
      envSchema.safeParse({
        EXPO_PUBLIC_API_URL: 'https://example.test',
        EXPO_PUBLIC_APP_ENV: 'typo',
      }).success,
    ).toBe(false);
  });
});
