import type { ZodError } from 'zod';

/**
 * Normalized API error that all API failures are mapped to.
 * Provides consistent error handling throughout the application.
 */
export class ApiError extends Error {
  public readonly statusCode: number | null;
  public readonly code: string;
  public readonly isNetworkError: boolean;
  public readonly isTimeout: boolean;
  public readonly isCancelled: boolean;
  public readonly validationErrors: string[] | null;

  constructor(params: {
    message: string;
    statusCode?: number | null;
    code?: string;
    isNetworkError?: boolean;
    isTimeout?: boolean;
    isCancelled?: boolean;
    validationErrors?: string[] | null;
    cause?: unknown;
  }) {
    super(params.message, { cause: params.cause });
    this.name = 'ApiError';
    this.statusCode = params.statusCode ?? null;
    this.code = params.code ?? 'UNKNOWN_ERROR';
    this.isNetworkError = params.isNetworkError ?? false;
    this.isTimeout = params.isTimeout ?? false;
    this.isCancelled = params.isCancelled ?? false;
    this.validationErrors = params.validationErrors ?? null;
  }

  /**
   * Whether the error indicates the user is not authenticated.
   */
  get isUnauthorized(): boolean {
    return this.statusCode === 401;
  }

  /**
   * Whether the error indicates the user lacks permissions.
   */
  get isForbidden(): boolean {
    return this.statusCode === 403;
  }

  /**
   * Whether the error indicates the resource was not found.
   */
  get isNotFound(): boolean {
    return this.statusCode === 404;
  }

  /**
   * Whether the error is a server-side error (5xx).
   */
  get isServerError(): boolean {
    return this.statusCode !== null && this.statusCode >= 500;
  }

  /**
   * User-friendly error message for display in UI.
   */
  get userMessage(): string {
    if (this.isCancelled) return 'Request was cancelled.';
    if (this.isTimeout) return 'Request timed out. Please try again.';
    if (this.isNetworkError) return 'Network error. Please check your connection and try again.';
    if (this.isServerError) return 'Something went wrong on our end. Please try again later.';
    if (this.isUnauthorized) return 'Your session has expired. Please sign in again.';
    if (this.isForbidden) return 'You do not have permission to perform this action.';
    if (this.isNotFound) return 'The requested resource was not found.';
    return this.message || 'An unexpected error occurred.';
  }

  /**
   * Serialize for logging (sensitive data is not included).
   */
  toLogSafe(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      statusCode: this.statusCode,
      isNetworkError: this.isNetworkError,
      isTimeout: this.isTimeout,
      isCancelled: this.isCancelled,
      validationIssueCount: this.validationErrors?.length ?? 0,
    };
  }
}

/**
 * Create an ApiError from a Zod validation error.
 */
export function fromZodError(error: ZodError): ApiError {
  const messages = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.code}`);
  return new ApiError({
    message: `Response validation failed: ${messages.join('; ')}`,
    code: 'VALIDATION_ERROR',
    validationErrors: messages,
    cause: error,
  });
}

/**
 * Normalize any thrown value into an ApiError.
 */
export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (
    error instanceof TypeError &&
    /failed to fetch|network request failed|networkerror|fetch failed/i.test(error.message)
  ) {
    return new ApiError({
      message: 'Network request failed',
      code: 'NETWORK_ERROR',
      isNetworkError: true,
      cause: error,
    });
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return new ApiError({
      message: 'Request was aborted',
      code: 'CANCELLED',
      isCancelled: true,
      cause: error,
    });
  }

  if (error instanceof Error) {
    return new ApiError({
      message: error.message,
      code: 'UNKNOWN_ERROR',
      cause: error,
    });
  }

  return new ApiError({
    message: String(error),
    code: 'UNKNOWN_ERROR',
  });
}
