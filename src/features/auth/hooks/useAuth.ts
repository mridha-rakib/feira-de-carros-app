import { useQuery } from '@tanstack/react-query';
import type { UserResponse } from '@/features/auth/dto/auth.dto';
import { UserResponseSchema } from '@/features/auth/dto/auth.dto';
import { apiClient } from '@/services/api/client';

/**
 * Query key factory for user-related queries.
 */
export const userKeys = {
  all: ['users'] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  me: () => [...userKeys.all, 'me'] as const,
};

/**
 * Fetch the current authenticated user profile.
 *
 * Uses Zod validation to ensure the response matches the expected schema.
 *
 * @example
 * ```tsx
 * function ProfileScreen() {
 *   const { data: user, isLoading, error } = useCurrentUser();
 *   if (isLoading) return <LoadingIndicator />;
 *   if (error) return <ErrorDisplay error={error} />;
 *   return <Text>{user.displayName}</Text>;
 * }
 * ```
 */
export function useCurrentUser() {
  return useQuery<UserResponse>({
    queryKey: userKeys.me(),
    queryFn: ({ signal }) =>
      apiClient.get<UserResponse>('/auth/me', {
        schema: UserResponseSchema,
        signal,
      }),
    enabled: false, // Enable when auth is implemented
  });
}

/**
 * Fetch a user by ID.
 */
export function useUser(userId: string) {
  return useQuery<UserResponse>({
    queryKey: userKeys.detail(userId),
    queryFn: ({ signal }) =>
      apiClient.get<UserResponse>(`/users/${encodeURIComponent(userId)}`, {
        schema: UserResponseSchema,
        signal,
      }),
    enabled: !!userId,
  });
}
