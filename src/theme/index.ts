/**
 * Application theme configuration.
 * Re-exports the existing theme constants and extends with additional tokens.
 */

export type { ThemeColor } from '@/constants/theme';
export {
  BottomTabInset,
  Colors,
  Fonts,
  MaxContentWidth,
  Spacing,
} from '@/constants/theme';

/**
 * Semantic color tokens for common UI patterns.
 */
export const SemanticColors = {
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#007AFF',
  accent: '#6C63FF',
} as const;

/**
 * Typography scale for consistent text sizing.
 */
export const Typography = {
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

/**
 * Border radius tokens.
 */
export const Radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;
