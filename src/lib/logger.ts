import { isDev } from '@/config/env';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const sensitiveKey =
  /password|passwd|token|authorization|secret|apikey|credential|cookie|session|email|phone|address|name|userid|ssn|creditcard|body|payload|message|stack/i;

function sanitizeText(value: string): string {
  return value
    .replace(/https?:\/\/\S+/gi, '[URL REDACTED]')
    .replace(/\bBearer\s+\S+/gi, 'Bearer [REDACTED]')
    .replace(/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/gi, '[EMAIL REDACTED]')
    .replace(/\b(password|token|secret|api[_-]?key)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]');
}

/** Diagnostic metadata only. Never pass user content, credentials, or raw errors. */
export function redactSensitiveFields(
  data: unknown,
  seen = new WeakSet<object>(),
  depth = 0,
): unknown {
  if (typeof data === 'string') return sanitizeText(data);
  if (typeof data === 'bigint') return data.toString();
  if (data === null || typeof data !== 'object') return data;
  if (depth > 8) return '[MAX DEPTH]';
  if (seen.has(data)) return '[CIRCULAR]';
  seen.add(data);
  if (data instanceof Error) return { errorType: data.name };
  if (Array.isArray(data))
    return data.map((value) => redactSensitiveFields(value, seen, depth + 1));
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    safe[key] = sensitiveKey.test(key.replace(/[_-]/g, ''))
      ? '[REDACTED]'
      : redactSensitiveFields(value, seen, depth + 1);
  }
  return safe;
}

export function createLogger(tag: string) {
  function write(level: LogLevel, message: string, data?: unknown): void {
    if (!isDev) return;
    let metadata = '';
    if (data !== undefined) {
      try {
        metadata = ` ${JSON.stringify(redactSensitiveFields(data))}`;
      } catch {
        metadata = ' [UNSERIALIZABLE]';
      }
    }
    const output = `[${new Date().toISOString()}] [${level.toUpperCase()}] [${sanitizeText(tag)}] ${sanitizeText(message)}${metadata}`;
    if (level === 'debug' || level === 'info') console.log(output);
    else if (level === 'warn') console.warn(output);
    else console.error(output);
  }
  return {
    debug: (message: string, data?: unknown) => write('debug', message, data),
    info: (message: string, data?: unknown) => write('info', message, data),
    warn: (message: string, data?: unknown) => write('warn', message, data),
    error: (message: string, data?: unknown) => write('error', message, data),
  };
}

export const logger = createLogger('App');
