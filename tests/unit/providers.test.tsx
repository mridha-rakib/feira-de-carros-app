import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { focusManager, onlineManager } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react-native';
import * as Network from 'expo-network';
import { AppState, Text } from 'react-native';
import { AppProviders } from '@/providers/AppProviders';

jest.mock('expo-network', () => ({
  addNetworkStateListener: jest.fn(() => ({ remove: jest.fn() })),
  getNetworkStateAsync: jest.fn(async () => ({ isConnected: true, isInternetReachable: true })),
}));

afterEach(() => {
  jest.restoreAllMocks();
  onlineManager.setOnline(true);
  focusManager.setFocused(undefined);
});

describe('root providers', () => {
  it('mounts children, responds to native focus/connectivity, and removes subscriptions', async () => {
    const remove = jest.fn();
    const listener = jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove });
    jest.spyOn(console, 'log').mockImplementation(() => {});
    const view = await render(
      <AppProviders>
        <Text>Application ready</Text>
      </AppProviders>,
    );
    expect(screen.getByText('Application ready')).toBeOnTheScreen();
    const appState = listener.mock.calls[0]?.[1];
    const network = jest.mocked(Network.addNetworkStateListener).mock.calls[0]?.[0];
    expect(appState).toBeDefined();
    expect(network).toBeDefined();
    await act(async () => {
      appState?.('background');
      network?.({ isConnected: false });
    });
    expect(focusManager.isFocused()).toBe(false);
    expect(onlineManager.isOnline()).toBe(false);
    await act(async () => {
      appState?.('active');
      network?.({ isConnected: true, isInternetReachable: true });
    });
    expect(focusManager.isFocused()).toBe(true);
    expect(onlineManager.isOnline()).toBe(true);
    await view.unmount();
    expect(remove).toHaveBeenCalledTimes(1);
    const subscription = jest.mocked(Network.addNetworkStateListener).mock.results[0];
    if (subscription?.type !== 'return') throw new Error('Missing network subscription');
    expect(subscription.value.remove).toHaveBeenCalledTimes(1);
  });
});
