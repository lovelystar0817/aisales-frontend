import { useState, useEffect } from 'react';
import {
  subscribeToBackendState,
  type BackendState,
} from '~/util/netlify-backend';

export function BackendIndicator() {
  const [state, setState] = useState<BackendState>({
    baseUrl: '',
    isLoading: false,
    featureName: null,
    isFeature: false,
  });

  useEffect(() => {
    const unsubscribe = subscribeToBackendState(setState);
    return unsubscribe;
  }, []);

  const hostname = window.location.hostname;

  // Only show on Netlify deployments
  if (!hostname.includes('.netlify.app')) {
    return null;
  }

  // Special case: Don't show for staging branch
  if (hostname === 'staging--huposalesai.netlify.app') {
    return null;
  }

  return (
    <div
      className={`ml-2 rounded-lg px-3 py-2 font-mono text-xs shadow-lg ${state.isFeature ? 'bg-orange-100 text-orange-900' : 'bg-blue-100 text-blue-900'} ${state.isLoading ? 'animate-pulse' : ''} `}
    >
      {state.isLoading ? (
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
          <span>Loading...</span>
        </div>
      ) : (
        <div>
          {state.isFeature ? (
            <span>🚧 {state.featureName}</span>
          ) : (
            <span>🚀 Production</span>
          )}
        </div>
      )}
    </div>
  );
}
