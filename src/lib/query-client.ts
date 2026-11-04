import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/services/api/errors';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        retry: (failureCount, error) => {
          if (
            error instanceof ApiError &&
            (error.isCancelled ||
              error.code === 'VALIDATION_ERROR' ||
              (error.statusCode !== null &&
                error.statusCode >= 400 &&
                error.statusCode < 500 &&
                error.statusCode !== 429))
          )
            return false;
          return failureCount < 2;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: { retry: false },
    },
  });
}
