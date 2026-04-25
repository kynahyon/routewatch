/**
 * redactor.ts
 * Utilities for redacting sensitive fields from logged route metadata
 * (e.g. headers, query params, body keys).
 */

export interface RedactorOptions {
  /** Field names (case-insensitive) to redact from objects */
  fields?: string[];
  /** Replacement string for redacted values */
  placeholder?: string;
}

const DEFAULT_SENSITIVE_FIELDS = [
  'authorization',
  'x-api-key',
  'cookie',
  'set-cookie',
  'password',
  'token',
  'secret',
  'x-auth-token',
];

const DEFAULT_PLACEHOLDER = '[REDACTED]';

/**
 * Creates a redactor function that removes sensitive fields from a plain object.
 */
export function createRedactor(options: RedactorOptions = {}) {
  const fields = (options.fields ?? DEFAULT_SENSITIVE_FIELDS).map((f) =>
    f.toLowerCase()
  );
  const placeholder = options.placeholder ?? DEFAULT_PLACEHOLDER;

  return function redact<T extends Record<string, unknown>>(obj: T): T {
    if (!obj || typeof obj !== 'object') return obj;
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = fields.includes(key.toLowerCase()) ? placeholder : value;
    }
    return result as T;
  };
}

/**
 * Redacts sensitive fields from a headers-like object using default settings.
 */
export function redactHeaders(
  headers: Record<string, unknown>,
  options?: RedactorOptions
): Record<string, unknown> {
  return createRedactor(options)(headers);
}

/**
 * Returns true if the given field name is considered sensitive by default.
 */
export function isSensitiveField(field: string): boolean {
  return DEFAULT_SENSITIVE_FIELDS.includes(field.toLowerCase());
}
