import { describe, expect, it } from '@jest/globals';
import { z } from 'zod';

import { LoginRequestSchema, UserResponseSchema } from '@/features/auth/dto/auth.dto';
import { ApiErrorResponseSchema, createPaginatedSchema } from '@/types/dto';

describe('Auth DTOs', () => {
  describe('UserResponseSchema', () => {
    it('validates a correct user response', () => {
      const validUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        displayName: 'Jane Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
        bio: 'Software engineer',
        emailVerified: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-06-01T12:00:00.000Z',
      };

      const result = UserResponseSchema.safeParse(validUser);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('user@example.com');
        expect(result.data.displayName).toBe('Jane Doe');
      }
    });

    it('validates user with null avatar', () => {
      const user = {
        id: 'abc',
        email: 'user@example.com',
        displayName: 'John',
        avatarUrl: null,
        emailVerified: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      const result = UserResponseSchema.safeParse(user);
      expect(result.success).toBe(true);
    });

    it('rejects user with invalid email', () => {
      const invalid = {
        id: 'abc',
        email: 'not-an-email',
        displayName: 'John',
        avatarUrl: null,
        emailVerified: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      const result = UserResponseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects user missing required fields', () => {
      const result = UserResponseSchema.safeParse({
        id: 'abc',
        email: 'user@example.com',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('LoginRequestSchema', () => {
    it('validates a correct login request', () => {
      const result = LoginRequestSchema.safeParse({
        email: 'user@example.com',
        password: 'securePassword123',
      });

      expect(result.success).toBe(true);
    });

    it('rejects short password', () => {
      const result = LoginRequestSchema.safeParse({
        email: 'user@example.com',
        password: 'short',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 8');
      }
    });

    it('rejects invalid email format', () => {
      const result = LoginRequestSchema.safeParse({
        email: 'invalid',
        password: 'validPassword123',
      });

      expect(result.success).toBe(false);
    });
  });
});

describe('Shared DTOs', () => {
  describe('createPaginatedSchema', () => {
    it('validates a paginated response', () => {
      const ItemSchema = z.object({ id: z.string(), name: z.string() });
      const PaginatedItemSchema = createPaginatedSchema(ItemSchema);

      const result = PaginatedItemSchema.safeParse({
        data: [
          { id: '1', name: 'Item 1' },
          { id: '2', name: 'Item 2' },
        ],
        pagination: {
          page: 0,
          pageSize: 20,
          totalItems: 2,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data).toHaveLength(2);
        expect(result.data.pagination.totalItems).toBe(2);
      }
    });

    it('validates empty paginated response', () => {
      const ItemSchema = z.object({ id: z.string() });
      const PaginatedItemSchema = createPaginatedSchema(ItemSchema);

      const result = PaginatedItemSchema.safeParse({
        data: [],
        pagination: {
          page: 0,
          pageSize: 20,
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      expect(result.success).toBe(true);
    });
  });

  describe('ApiErrorResponseSchema', () => {
    it('validates an API error response', () => {
      const result = ApiErrorResponseSchema.safeParse({
        message: 'Resource not found',
        code: 'NOT_FOUND',
        statusCode: 404,
      });

      expect(result.success).toBe(true);
    });

    it('validates error with details', () => {
      const result = ApiErrorResponseSchema.safeParse({
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        statusCode: 422,
        details: [
          { field: 'email', message: 'Invalid email format' },
          { message: 'Request body is malformed' },
        ],
        timestamp: '2024-01-01T00:00:00.000Z',
        requestId: 'req-123',
      });

      expect(result.success).toBe(true);
    });
  });
});
