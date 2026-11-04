import type { ZodType } from 'zod';
import { env } from '@/config/env';
import { createLogger } from '@/lib/logger';
import { ApiErrorResponseSchema } from '@/types/dto';
import { ApiError, fromZodError, normalizeError } from './errors';

const log = createLogger('ApiClient');
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
interface RequestConfig<TResponse> {
  method: HttpMethod;
  path: string;
  body?: unknown;
  requestSchema?: ZodType;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  schema: ZodType<TResponse>;
  timeout?: number;
  signal?: AbortSignal;
}
type Options<T> = Omit<RequestConfig<T>, 'method' | 'path' | 'body'>;
let tokenProvider: (() => Promise<string | null>) | null = null;

export function setTokenProvider(provider: (() => Promise<string | null>) | null): void {
  tokenProvider = provider;
}

/** Validates every response, including no-content responses with z.void(). */
async function request<T>(config: RequestConfig<T>): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = config.timeout ?? 30_000;
  const started = Date.now();
  let timedOut = false;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => controller.abort();
  // Race the whole operation so credential loading and body parsing also have a deadline.
  let onAbort = () => {};
  const aborted = new Promise<never>((_, reject) => {
    onAbort = () =>
      reject(
        new ApiError({
          message: timedOut ? 'Request timed out' : 'Request was cancelled',
          code: timedOut ? 'TIMEOUT' : 'CANCELLED',
          isTimeout: timedOut,
          isCancelled: !timedOut,
        }),
      );
    controller.signal.addEventListener('abort', onAbort, { once: true });
  });
  try {
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      throw new ApiError({ message: 'Timeout must be a positive number', code: 'INVALID_REQUEST' });
    }
    if (
      !config.path.startsWith('/') ||
      config.path.startsWith('//') ||
      /[?#\\]/.test(config.path)
    ) {
      throw new ApiError({
        message: 'Use a relative API path and the params option',
        code: 'INVALID_REQUEST',
      });
    }
    const url = new URL(`${env.EXPO_PUBLIC_API_URL.replace(/\/$/, '')}${config.path}`);
    for (const [key, value] of Object.entries(config.params ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    config.signal?.addEventListener('abort', cancel, { once: true });
    if (config.signal?.aborted) controller.abort();
    timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    async function execute(): Promise<T> {
      if (controller.signal.aborted) return aborted;
      let body = config.body;
      if (config.requestSchema) {
        const parsed = config.requestSchema.safeParse(body);
        if (!parsed.success) throw fromZodError(parsed.error);
        body = parsed.data;
      }
      const headers = new Headers({ Accept: 'application/json', ...config.headers });
      if (body !== undefined) headers.set('Content-Type', 'application/json');
      const token = await tokenProvider?.();
      if (token) headers.set('Authorization', `Bearer ${token}`);
      if (controller.signal.aborted) return aborted;
      // Never log URLs, paths containing user identifiers, query values, headers, or bodies.
      log.debug('Network request started', { method: config.method, hasBody: body !== undefined });
      const response = await fetch(url.toString(), {
        method: config.method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
      if (!response.ok) {
        let payload: unknown;
        try {
          payload = await response.json();
        } catch {
          payload = undefined;
        }
        const parsed = ApiErrorResponseSchema.safeParse(payload);
        throw new ApiError({
          message: parsed.success ? parsed.data.message : `HTTP ${response.status}`,
          statusCode: response.status,
          code: `HTTP_${response.status}`,
        });
      }
      let data: unknown;
      try {
        data = response.status === 204 ? undefined : await response.json();
      } catch (cause) {
        throw new ApiError({ message: 'Invalid JSON response', code: 'INVALID_RESPONSE', cause });
      }
      const result = config.schema.safeParse(data);
      if (!result.success) throw fromZodError(result.error);
      log.debug('Network request completed', {
        method: config.method,
        statusCode: response.status,
        durationMs: Date.now() - started,
      });
      return result.data;
    }
    return await Promise.race([aborted, execute()]);
  } catch (error) {
    const normalized = controller.signal.aborted
      ? new ApiError({
          message: timedOut ? 'Request timed out' : 'Request was cancelled',
          code: timedOut ? 'TIMEOUT' : 'CANCELLED',
          isTimeout: timedOut,
          isCancelled: !timedOut,
        })
      : normalizeError(error);
    if (!normalized.isCancelled) {
      log.error(
        normalized.code === 'VALIDATION_ERROR' ? 'API validation failed' : 'API request failed',
        {
          ...normalized.toLogSafe(),
          method: config.method,
          durationMs: Date.now() - started,
        },
      );
    }
    throw normalized;
  } finally {
    clearTimeout(timeoutId);
    config.signal?.removeEventListener('abort', cancel);
    controller.signal.removeEventListener('abort', onAbort);
  }
}

export const apiClient = {
  get<T>(path: string, options: Options<T>): Promise<T> {
    return request({ method: 'GET', path, ...options });
  },
  post<T>(path: string, body: unknown, options: Options<T>): Promise<T> {
    return request({ method: 'POST', path, body, ...options });
  },
  put<T>(path: string, body: unknown, options: Options<T>): Promise<T> {
    return request({ method: 'PUT', path, body, ...options });
  },
  patch<T>(path: string, body: unknown, options: Options<T>): Promise<T> {
    return request({ method: 'PATCH', path, body, ...options });
  },
  delete<T>(path: string, options: Options<T>): Promise<T> {
    return request({ method: 'DELETE', path, ...options });
  },
};
