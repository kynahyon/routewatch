import { createRedactor, redactHeaders, isSensitiveField } from './redactor';

describe('createRedactor', () => {
  it('redacts default sensitive fields', () => {
    const redact = createRedactor();
    const result = redact({
      authorization: 'Bearer abc123',
      'x-api-key': 'key-secret',
      'content-type': 'application/json',
    });
    expect(result['authorization']).toBe('[REDACTED]');
    expect(result['x-api-key']).toBe('[REDACTED]');
    expect(result['content-type']).toBe('application/json');
  });

  it('is case-insensitive for field matching', () => {
    const redact = createRedactor();
    const result = redact({ Authorization: 'Bearer xyz', Cookie: 'session=1' });
    expect(result['Authorization']).toBe('[REDACTED]');
    expect(result['Cookie']).toBe('[REDACTED]');
  });

  it('uses custom fields when provided', () => {
    const redact = createRedactor({ fields: ['x-custom-secret'] });
    const result = redact({
      'x-custom-secret': 'mysecret',
      authorization: 'Bearer token',
    });
    expect(result['x-custom-secret']).toBe('[REDACTED]');
    // authorization is NOT in custom list
    expect(result['authorization']).toBe('Bearer token');
  });

  it('uses custom placeholder', () => {
    const redact = createRedactor({ placeholder: '***' });
    const result = redact({ password: 'hunter2' });
    expect(result['password']).toBe('***');
  });

  it('returns non-object values unchanged', () => {
    const redact = createRedactor();
    expect(redact(null as any)).toBeNull();
    expect(redact(undefined as any)).toBeUndefined();
  });

  it('does not mutate the original object', () => {
    const redact = createRedactor();
    const original = { authorization: 'secret', host: 'localhost' };
    const copy = { ...original };
    redact(original);
    expect(original).toEqual(copy);
  });
});

describe('redactHeaders', () => {
  it('redacts sensitive headers using defaults', () => {
    const result = redactHeaders({
      cookie: 'session=abc',
      accept: 'application/json',
    });
    expect(result['cookie']).toBe('[REDACTED]');
    expect(result['accept']).toBe('application/json');
  });

  it('accepts custom options', () => {
    const result = redactHeaders(
      { 'x-trace-id': '123', token: 'abc' },
      { fields: ['x-trace-id'], placeholder: '<hidden>' }
    );
    expect(result['x-trace-id']).toBe('<hidden>');
    expect(result['token']).toBe('abc');
  });
});

describe('isSensitiveField', () => {
  it('returns true for known sensitive fields', () => {
    expect(isSensitiveField('authorization')).toBe(true);
    expect(isSensitiveField('Authorization')).toBe(true);
    expect(isSensitiveField('cookie')).toBe(true);
    expect(isSensitiveField('password')).toBe(true);
  });

  it('returns false for non-sensitive fields', () => {
    expect(isSensitiveField('content-type')).toBe(false);
    expect(isSensitiveField('host')).toBe(false);
  });
});
