import { z } from 'zod';

// ─── User Response DTO ───────────────────────────────────────────────────────

/**
 * Schema for a user object returned by the API.
 * Demonstrates required, optional, and nullable fields.
 */
export const UserResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  avatarUrl: z.string().url().nullable(),
  bio: z.string().optional(),
  emailVerified: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;

// ─── Login Request DTO ───────────────────────────────────────────────────────

/**
 * Schema for login request payload validation.
 * Validates client-side before sending to API.
 */
export const LoginRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters'),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

// ─── Auth Tokens DTO ─────────────────────────────────────────────────────────

/**
 * Schema for authentication token response.
 */
export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().int().positive(),
  tokenType: z.literal('Bearer'),
});

export type AuthTokens = z.infer<typeof AuthTokensSchema>;

// ─── Login Response DTO ──────────────────────────────────────────────────────

/**
 * Combined login response with user data and tokens.
 */
export const LoginResponseSchema = z.object({
  user: UserResponseSchema,
  tokens: AuthTokensSchema,
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;
