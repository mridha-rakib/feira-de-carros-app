import { StyleSheet, Text, View } from 'react-native';

import type { ApiError } from '@/services/api/errors';

interface ErrorDisplayProps {
  /** The error to display */
  error: Error | ApiError | null;
  /** Optional retry handler */
  onRetry?: () => void;
  /** Optional custom title */
  title?: string;
}

/**
 * Reusable error display component.
 * Shows user-friendly messages and optional retry button.
 */
export function ErrorDisplay({ error, onRetry, title }: ErrorDisplayProps) {
  if (!error) return null;

  const message =
    'userMessage' in error
      ? (error as ApiError).userMessage
      : error.message || 'An unexpected error occurred.';

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>😕</Text>
      <Text style={styles.title}>{title ?? 'Something went wrong'}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Text accessibilityRole="button" style={styles.retryButton} onPress={onRetry}>
          Try again
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e0e0e0',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#a0a0b0',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  retryButton: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: '600',
    color: '#6C63FF',
    padding: 8,
  },
});
