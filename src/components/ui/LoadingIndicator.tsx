import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface LoadingIndicatorProps {
  /** Message to display below the spinner */
  message?: string;
  /** Whether to fill the parent container */
  fullScreen?: boolean;
}

/**
 * Reusable loading indicator with optional message.
 */
export function LoadingIndicator({ message, fullScreen = false }: LoadingIndicatorProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color="#6C63FF" />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fullScreen: {
    flex: 1,
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    color: '#a0a0b0',
  },
});
