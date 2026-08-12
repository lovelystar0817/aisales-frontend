/**
 * Synchronous environment detection based on hostname
 * Can be used at initialization time without waiting for async operations
 */

export type Environment = 'development' | 'feature' | 'staging' | 'production';

/**
 * Determines the current environment based on hostname
 * - development: localhost or 127.0.0.1
 * - feature: feature-* branches on Netlify (e.g., feature-temp--huposalesai.netlify.app)
 * - staging: staging--huposalesai.netlify.app
 * - production: everything else (custom domains)
 */
export function getEnvironment(): Environment {
  // SSR fallback
  if (typeof window === 'undefined') return 'production';

  const hostname = window.location.hostname;

  // Local development
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return 'development';
  }

  // Staging branch on Netlify
  if (hostname === 'staging--huposalesai.netlify.app') {
    return 'staging';
  }

  // Feature branch on Netlify
  // Pattern: feature-{name}--huposalesai.netlify.app
  // Exclude deploy-preview-* branches
  if (
    hostname.includes('.netlify.app') &&
    hostname.match(/^feature-/) &&
    !hostname.startsWith('deploy-preview-')
  ) {
    return 'feature';
  }

  // Everything else is production (custom domains)
  return 'production';
}

/**
 * Check if currently running on a feature branch
 */
export function isFeatureBranch(): boolean {
  return getEnvironment() === 'feature';
}

/**
 * Check if currently running in staging
 */
export function isStaging(): boolean {
  return getEnvironment() === 'staging';
}

/**
 * Check if currently running in production
 */
export function isProduction(): boolean {
  return getEnvironment() === 'production';
}

/**
 * Check if currently running in local development
 */
export function isDevelopment(): boolean {
  return getEnvironment() === 'development';
}

/**
 * Get the feature branch name if on a feature branch
 * Returns null if not on a feature branch
 * Examples:
 *   "feature-temp--huposalesai.netlify.app" -> "temp"
 *   "feature-grab-mex--huposalesai.netlify.app" -> "grab-mex"
 */
export function getFeatureName(): string | null {
  if (typeof window === 'undefined') return null;

  const hostname = window.location.hostname;
  const match = /^feature-(.+?)--(.+?)\.netlify\.app$/.exec(hostname);

  // Exclude deploy-preview branches
  if (!match || hostname.startsWith('deploy-preview-')) {
    return null;
  }

  return match[1]; // Returns "temp" or "grab-mex" from hostname
}
