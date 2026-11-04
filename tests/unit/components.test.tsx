import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { ApiError } from '@/services/api/errors';

describe('shared status components', () => {
  it('displays the loading message', async () => {
    await render(<LoadingIndicator message="Loading profile" />);
    expect(screen.getByText('Loading profile')).toBeOnTheScreen();
  });
  it('shows a safe error message and retries on press', async () => {
    const retry = jest.fn();
    await render(
      <ErrorDisplay
        error={new ApiError({ message: 'Internal detail', statusCode: 500 })}
        onRetry={retry}
      />,
    );
    expect(screen.getByText(/Something went wrong on our end/)).toBeOnTheScreen();
    expect(screen.queryByText('Internal detail')).toBeNull();
    await fireEvent.press(screen.getByText('Try again'));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
