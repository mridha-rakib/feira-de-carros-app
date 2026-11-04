import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { createLogger, redactSensitiveFields } from '@/lib/logger';

afterEach(() => {
  jest.restoreAllMocks();
});
describe('development logger', () => {
  it('redacts nested secrets and personal fields case-insensitively', () => {
    const input = {
      ACCESS_TOKEN: 'secret',
      nested: [
        { Email: 'private@example.test', phone_number: '123', password: 'pw', durationMs: 20 },
      ],
    };
    const output = JSON.stringify(redactSensitiveFields(input));
    expect(output).not.toMatch(/secret|private@example|"123"|"pw"/);
    expect(output).toContain('20');
  });
  it('handles circular objects, errors and bigint without throwing', () => {
    const input: Record<string, unknown> = { count: 1n, error: new Error('private') };
    input.self = input;
    expect(() => JSON.stringify(redactSensitiveFields(input))).not.toThrow();
    expect(JSON.stringify(redactSensitiveFields(input))).not.toContain('private');
  });
  it('emits all four levels and sanitizes URLs and bearer values', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    const logger = createLogger('Test');
    logger.debug('Request', { url: 'https://private.test/path?token=secret' });
    logger.info('Ready');
    logger.warn('Retry');
    logger.error('Failed', { authorization: 'Bearer secret' });
    expect(log).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledTimes(1);
    expect(JSON.stringify([...log.mock.calls, ...error.mock.calls])).not.toContain('secret');
  });
});
