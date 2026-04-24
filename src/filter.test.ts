import { createRouteFilter, normalizeRoutePath } from './filter';

describe('createRouteFilter', () => {
  describe('default exclusions', () => {
    const filter = createRouteFilter();

    it('should exclude /health by default', () => {
      expect(filter.shouldMonitor('/health')).toBe(false);
    });

    it('should exclude /_health by default', () => {
      expect(filter.shouldMonitor('/_health')).toBe(false);
    });

    it('should exclude /ping by default', () => {
      expect(filter.shouldMonitor('/ping')).toBe(false);
    });

    it('should exclude /favicon.ico by default', () => {
      expect(filter.shouldMonitor('/favicon.ico')).toBe(false);
    });

    it('should exclude /metrics by default', () => {
      expect(filter.shouldMonitor('/metrics')).toBe(false);
    });

    it('should monitor regular API routes', () => {
      expect(filter.shouldMonitor('/api/users')).toBe(true);
    });

    it('should monitor root path', () => {
      expect(filter.shouldMonitor('/')).toBe(true);
    });
  });

  describe('custom exclude patterns', () => {
    const filter = createRouteFilter({
      exclude: ['/internal/*', /^\/admin/],
    });

    it('should exclude paths matching string prefix', () => {
      expect(filter.shouldMonitor('/internal/status')).toBe(false);
    });

    it('should exclude paths matching regex', () => {
      expect(filter.shouldMonitor('/admin/dashboard')).toBe(false);
    });

    it('should still monitor other routes', () => {
      expect(filter.shouldMonitor('/api/orders')).toBe(true);
    });
  });

  describe('include patterns (allowlist mode)', () => {
    const filter = createRouteFilter({
      include: ['/api/*'],
    });

    it('should only monitor paths matching include pattern', () => {
      expect(filter.shouldMonitor('/api/users')).toBe(true);
    });

    it('should not monitor paths outside include list', () => {
      expect(filter.shouldMonitor('/webhooks/stripe')).toBe(false);
    });

    it('should not monitor health even if not excluded explicitly', () => {
      expect(filter.shouldMonitor('/health')).toBe(false);
    });
  });
});

describe('normalizeRoutePath', () => {
  it('should remove trailing slashes', () => {
    expect(normalizeRoutePath('/api/users/')).toBe('/api/users');
  });

  it('should preserve root path', () => {
    expect(normalizeRoutePath('/')).toBe('/');
  });

  it('should not modify clean paths', () => {
    expect(normalizeRoutePath('/api/users')).toBe('/api/users');
  });

  it('should collapse multiple trailing slashes', () => {
    expect(normalizeRoutePath('/api/users///')).toBe('/api/users');
  });
});
