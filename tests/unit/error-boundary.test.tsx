import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

afterEach(() => {
  jest.restoreAllMocks();
});
describe('error boundary', () => {
  it('catches rendering failures and allows recovery', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    let shouldThrow = true;
    function Child() {
      if (shouldThrow) throw new Error('Render failure');
      return <Text>Recovered</Text>;
    }
    await render(
      <ErrorBoundary>
        <Child />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeOnTheScreen();
    shouldThrow = false;
    await fireEvent.press(screen.getByRole('button', { name: 'Tap to retry' }));
    expect(screen.getByText('Recovered')).toBeOnTheScreen();
  });
});
