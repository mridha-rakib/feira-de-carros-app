import { z } from 'zod';

/**
 * Environment variable schema using Zod.
 *
 * Only EXPO_PUBLIC_ prefixed variables are accessible in the client bundle.
 * Never expose private API keys or server-side secrets here.
 */
export const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z
    .string()
    .url('EXPO_PUBLIC_API_URL must be a valid URL')
    .refine((value) => {
      const url = new URL(value);
      return (
        ['http:', 'https:'].includes(url.protocol) &&
        !url.username &&
        !url.password &&
        !url.search &&
        !url.hash
      );
    }, 'Use an HTTP(S) base URL without credentials, query parameters, or fragments'),

  EXPO_PUBLIC_APP_ENV: z.enum(['development', 'preview', 'production']).default('development'),
});

type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const raw = {
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
    EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
  };

  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(
      `❌ Invalid environment configuration:\n${formatted}\n\n` +
        'Check your .env file and ensure all required EXPO_PUBLIC_ variables are set.',
    );
  }

  return result.data;
}

/**
 * Validated, typed environment configuration.
 * Throws on startup if variables are missing or invalid.
 */
export const env = loadEnv();

/**
 * Convenience helpers for environment checks.
 */
export const isDev = __DEV__ && env.EXPO_PUBLIC_APP_ENV === 'development';
export const isPreview = env.EXPO_PUBLIC_APP_ENV === 'preview';
export const isProd = env.EXPO_PUBLIC_APP_ENV === 'production';
