/**
 * Route filter utility for excluding specific paths from RouteWatch monitoring.
 * Supports exact matches, prefix matches, and regex patterns.
 */

export type FilterPattern = string | RegExp;

export interface FilterConfig {
  exclude?: FilterPattern[];
  include?: FilterPattern[];
}

export interface RouteFilter {
  shouldMonitor: (path: string, method?: string) => boolean;
}

const DEFAULT_EXCLUDED_PATHS: FilterPattern[] = [
  /^\/_health$/,
  /^\/health$/,
  /^\/ping$/,
  /^\/favicon\.ico$/,
  /^\/metrics$/,
];

function matchesPattern(path: string, pattern: FilterPattern): boolean {
  if (typeof pattern === 'string') {
    if (pattern.endsWith('*')) {
      return path.startsWith(pattern.slice(0, -1));
    }
    return path === pattern;
  }
  return pattern.test(path);
}

function matchesAny(path: string, patterns: FilterPattern[]): boolean {
  return patterns.some((p) => matchesPattern(path, p));
}

export function createRouteFilter(config: FilterConfig = {}): RouteFilter {
  const excludePatterns: FilterPattern[] = [
    ...DEFAULT_EXCLUDED_PATHS,
    ...(config.exclude ?? []),
  ];
  const includePatterns: FilterPattern[] = config.include ?? [];

  return {
    shouldMonitor(path: string): boolean {
      if (includePatterns.length > 0) {
        return matchesAny(path, includePatterns);
      }
      return !matchesAny(path, excludePatterns);
    },
  };
}

export function normalizeRoutePath(path: string): string {
  return path.replace(/\/+$/, '') || '/';
}
