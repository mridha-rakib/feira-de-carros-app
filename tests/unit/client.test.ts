import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { z } from 'zod';
import { apiClient, setTokenProvider } from '@/services/api/client';

const schema = z.object({ id: z.number() });
const fetchMock = jest.fn<typeof fetch>();
function response(data: unknown, status = 200) {
  return { ok: status < 400, status, json: async () => data } as Response;
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(globalThis, 'fetch').mockImplementation(fetchMock);
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  setTokenProvider(null);
  jest.restoreAllMocks();
  fetchMock.mockReset();
  expect(jest.getTimerCount()).toBe(0);
  jest.useRealTimers();
});

describe('API boundary', () => {
  it('validates responses, builds params, and injects credentials without logging values', async () => {
    setTokenProvider(async () => 'private-token');
    fetchMock.mockResolvedValue(response({ id: 1 }));
    await expect(
      apiClient.get('/users', { schema, params: { email: 'private@example.test' } }),
    ).resolves.toEqual({ id: 1 });
    const [url, config] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toContain('email=private%40example.test');
    expect(new Headers(config?.headers).get('Authorization')).toBe('Bearer private-token');
    expect(JSON.stringify(jest.mocked(console.log).mock.calls)).not.toMatch(
      /private-token|private@example/,
    );
  });
  it('rejects malformed success payloads', async () => {
    fetchMock.mockResolvedValue(response({ id: 'wrong' }));
    await expect(apiClient.get('/users', { schema })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
  });
  it('validates outgoing bodies before fetching', async () => {
    await expect(
      apiClient.post('/users', { id: 'wrong' }, { schema, requestSchema: schema }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('normalizes untrusted HTTP error bodies', async () => {
    fetchMock.mockResolvedValue(response({ message: { invalid: true } }, 503));
    await expect(apiClient.get('/users', { schema })).rejects.toMatchObject({
      code: 'HTTP_503',
      statusCode: 503,
      message: 'HTTP 503',
    });
  });
  it('handles no-content through the supplied schema', async () => {
    fetchMock.mockResolvedValue(response(undefined, 204));
    await expect(apiClient.delete('/users/1', { schema: z.void() })).resolves.toBeUndefined();
    await expect(apiClient.delete('/users/1', { schema })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
  });
  it('normalizes native network failures', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));
    await expect(apiClient.get('/users', { schema })).rejects.toMatchObject({
      isNetworkError: true,
    });
  });
  it('enforces timeouts even when fetch never settles', async () => {
    fetchMock.mockImplementation(() => new Promise(() => {}));
    const assertion = expect(
      apiClient.get('/users', { schema, timeout: 10 }),
    ).rejects.toMatchObject({ isTimeout: true, isCancelled: false });
    await jest.advanceTimersByTimeAsync(10);
    await assertion;
  });
  it('keeps the deadline active through body parsing', async () => {
    fetchMock.mockResolvedValue({ ...response({}), json: () => new Promise(() => {}) });
    const assertion = expect(
      apiClient.get('/users', { schema, timeout: 10 }),
    ).rejects.toMatchObject({ isTimeout: true });
    await jest.advanceTimersByTimeAsync(10);
    await assertion;
  });
  it('times out credential loading', async () => {
    setTokenProvider(() => new Promise(() => {}));
    const assertion = expect(
      apiClient.get('/users', { schema, timeout: 10 }),
    ).rejects.toMatchObject({ isTimeout: true });
    await jest.advanceTimersByTimeAsync(10);
    await assertion;
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('does not send a request if credential loading fails', async () => {
    setTokenProvider(async () => {
      throw new Error('Credential loading failed');
    });
    await expect(apiClient.get('/users', { schema })).rejects.toMatchObject({
      code: 'UNKNOWN_ERROR',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('honors cancellation before and during a request', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      apiClient.get('/users', { schema, signal: controller.signal }),
    ).rejects.toMatchObject({ isCancelled: true });
    expect(fetchMock).not.toHaveBeenCalled();
    const second = new AbortController();
    fetchMock.mockImplementation(() => new Promise(() => {}));
    const assertion = expect(
      apiClient.get('/users', { schema, signal: second.signal }),
    ).rejects.toMatchObject({ isCancelled: true, isTimeout: false });
    second.abort();
    await assertion;
  });
  it('preserves falsy JSON request bodies', async () => {
    fetchMock.mockResolvedValue(response({ id: 1 }));
    await apiClient.post('/flag', false, { schema });
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe('false');
  });
});
