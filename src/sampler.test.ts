import { createSampler } from './sampler';

describe('createSampler', () => {
  describe('getRate', () => {
    it('returns default rate of 1.0 when no config provided', () => {
      const sampler = createSampler();
      expect(sampler.getRate('/api/users')).toBe(1.0);
    });

    it('returns configured global rate', () => {
      const sampler = createSampler({ rate: 0.5 });
      expect(sampler.getRate('/api/users')).toBe(0.5);
    });

    it('returns route-specific override when present', () => {
      const sampler = createSampler({
        rate: 0.5,
        routeOverrides: { '/api/health': 0.0 },
      });
      expect(sampler.getRate('/api/health')).toBe(0.0);
      expect(sampler.getRate('/api/users')).toBe(0.5);
    });

    it('clamps rate above 1 to 1', () => {
      const sampler = createSampler({ rate: 2.5 });
      expect(sampler.getRate('/any')).toBe(1.0);
    });

    it('clamps rate below 0 to 0', () => {
      const sampler = createSampler({ rate: -0.5 });
      expect(sampler.getRate('/any')).toBe(0.0);
    });
  });

  describe('shouldSample', () => {
    it('always samples when rate is 1.0', () => {
      const sampler = createSampler({ rate: 1.0 });
      for (let i = 0; i < 20; i++) {
        expect(sampler.shouldSample('/api/test')).toBe(true);
      }
    });

    it('never samples when rate is 0.0', () => {
      const sampler = createSampler({ rate: 0.0 });
      for (let i = 0; i < 20; i++) {
        expect(sampler.shouldSample('/api/test')).toBe(false);
      }
    });

    it('uses route override rate for matching route', () => {
      const sampler = createSampler({
        rate: 1.0,
        routeOverrides: { '/api/health': 0.0 },
      });
      expect(sampler.shouldSample('/api/health')).toBe(false);
      expect(sampler.shouldSample('/api/users')).toBe(true);
    });

    it('samples approximately at the given rate', () => {
      const sampler = createSampler({ rate: 0.5 });
      const trials = 2000;
      let hits = 0;
      for (let i = 0; i < trials; i++) {
        if (sampler.shouldSample('/api/data')) hits++;
      }
      const ratio = hits / trials;
      expect(ratio).toBeGreaterThan(0.4);
      expect(ratio).toBeLessThan(0.6);
    });
  });
});
