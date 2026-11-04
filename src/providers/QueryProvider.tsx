import { focusManager, onlineManager, QueryClientProvider } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { type ReactNode, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { createLogger } from '@/lib/logger';
import { createQueryClient } from '@/lib/query-client';

const log = createLogger('QueryProvider');

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(createQueryClient);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    focusManager.setFocused(AppState.currentState === 'active');
    const appState = AppState.addEventListener('change', (state) => {
      focusManager.setFocused(state === 'active');
    });
    let active = true;
    let receivedUpdate = false;
    const updateOnline = (state: Network.NetworkState) => {
      // Unknown reachability does not imply offline.
      onlineManager.setOnline(state.isConnected !== false && state.isInternetReachable !== false);
    };
    const network = Network.addNetworkStateListener((state) => {
      receivedUpdate = true;
      if (active) updateOnline(state);
    });
    void Network.getNetworkStateAsync()
      .then((state) => {
        if (active && !receivedUpdate) updateOnline(state);
      })
      .catch(() => log.warn('Could not read initial network state'));
    return () => {
      active = false;
      appState.remove();
      network.remove();
      focusManager.setFocused(undefined);
    };
  }, []);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
