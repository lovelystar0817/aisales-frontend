// All Netlify-specific complexity isolated here
import { getFeatureName, isFeatureBranch } from './environment';

export interface BackendState {
  baseUrl: string;
  isLoading: boolean;
  featureName: string | null;
  isFeature: boolean;
}

const state: BackendState = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://trainapi.hupo.co', // Start with production
  isLoading: false,
  featureName: null,
  isFeature: false,
};

const listeners = new Set<(state: BackendState) => void>();

// A readiness gate so API requests can wait for mapping resolution when needed
let readyResolved = false;
let backendReadyResolve: ((value?: void) => void) | undefined;
const backendReadyPromise: Promise<void> = new Promise((resolve) => {
  backendReadyResolve = resolve;
});

function resolveBackendReadyOnce() {
  if (!readyResolved) {
    readyResolved = true;
    backendReadyResolve?.();
  }
}

// Check if we're on Netlify
function isNetlifyDeploy(): boolean {
  if (typeof window === 'undefined') return false;

  const hostname = window.location.hostname;

  // Don't use for local development
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
    return false;
  }

  // Don't use for staging branch
  if (hostname === 'staging--huposalesai.netlify.app') {
    return false;
  }

  return hostname.includes('.netlify.app');
}

// Get feature branch name from hostname
function getFeatureBranch(): string | null {
  const featureName = getFeatureName();
  console.log('Feature name:', featureName);
  if (!featureName) return null;

  return `feature/${featureName}`; // temp -> feature/temp
}

// Initialize mapping fetch (only on Netlify)
function initialize() {
  if (!isNetlifyDeploy()) {
    // Not a Netlify deploy → nothing to wait for
    resolveBackendReadyOnce();
    return;
  }

  const branchName = getFeatureBranch();
  console.log('Branch name:', branchName);
  if (!branchName) {
    // No feature branch mapping to resolve
    resolveBackendReadyOnce();
    return;
  }

  state.isLoading = true;
  notifyListeners();

  fetch('https://trainapi.hupo.co/api/feature-mapping.json')
    .then((r) => r.json())
    .then((mapping) => {
      if (mapping[branchName]) {
        state.baseUrl = mapping[branchName];
        state.isFeature = true;
        state.featureName = branchName.replace('feature/', '');
      }
      state.isLoading = false;
      notifyListeners();
      resolveBackendReadyOnce();
    })
    .catch(() => {
      state.isLoading = false;
      notifyListeners();
      resolveBackendReadyOnce();
    });
}

function notifyListeners() {
  listeners.forEach((cb) => cb(state));
}

// Public API
export function getBackendUrl(): string {
  return isNetlifyDeploy()
    ? state.baseUrl
    : import.meta.env.VITE_API_BASE_URL || 'https://trainapi.hupo.co';
}

export function subscribeToBackendState(
  callback: (state: BackendState) => void,
): () => void {
  listeners.add(callback);
  callback(state); // Call immediately with current state
  return () => listeners.delete(callback);
}

export function getBackendState(): BackendState {
  return { ...state };
}

// Allow callers to wait until the backend base URL is finalized
export function waitForBackendReady(): Promise<void> {
  return backendReadyPromise;
}

// Auto-initialize
if (typeof window !== 'undefined') {
  initialize();
} else {
  // SSR or non-browser: do not wait
  resolveBackendReadyOnce();
}
