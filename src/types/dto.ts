import { z } from 'zod';

// ─── Paginated Response DTO ──────────────────────────────────────────────────

/**
 * Generic paginated response wrapper.
 * Wraps any Zod schema into a paginated response format.
 *
 * @example
 * ```ts
 * const PaginatedUsersSchema = createPaginatedSchema(UserResponseSchema);
 * type PaginatedUsers = z.infer<typeof PaginatedUsersSchema>;
 * ```
 */
export function createPaginatedSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    pagination: z.object({
      page: z.number().int().nonnegative(),
      pageSize: z.number().int().positive(),
      totalItems: z.number().int().nonnegative(),
      totalPages: z.number().int().nonnegative(),
      hasNextPage: z.boolean(),
      hasPreviousPage: z.boolean(),
    }),
  });
}

/**
 * Infer the TypeScript type from a paginated schema.
 */
export type PaginatedResponse<T> = z.infer<ReturnType<typeof createPaginatedSchema<z.ZodType<T>>>>;

// ─── API Error Response DTO ──────────────────────────────────────────────────

/**
 * Schema for standard API error responses.
 * Used to validate error payloads from the backend.
 */
export const ApiErrorResponseSchema = z.object({
  message: z.string(),
  code: z.string(),
  statusCode: z.number().int(),
  details: z
    .array(
      z.object({
        field: z.string().optional(),
        message: z.string(),
      }),
    )
    .optional(),
  timestamp: z.string().datetime().optional(),
  requestId: z.string().optional(),
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

// ─── Common Query Params ─────────────────────────────────────────────────────

/**
 * Schema for common pagination query parameters.
 */
export const PaginationParamsSchema = z.object({
  page: z.number().int().nonnegative().default(0),
  pageSize: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type PaginationParams = z.infer<typeof PaginationParamsSchema>;
