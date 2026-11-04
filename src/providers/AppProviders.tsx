import { type ReactNode, useEffect } from 'react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { createLogger } from '@/lib/logger';
import { QueryProvider } from './QueryProvider';

const log = createLogger('AppProviders');

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Root provider tree for the application.
 * Wraps the app with all necessary context providers.
 *
 * Add new providers here in the appropriate order.
 * Providers higher in the tree are available to providers lower in the tree.
 */
export function AppProviders({ children }: AppProvidersProps) {
  useEffect(() => {
    log.info('Application providers initialized');
  }, []);

  return (
    <ErrorBoundary>
      <QueryProvider>{children}</QueryProvider>
    </ErrorBoundary>
  );
}
