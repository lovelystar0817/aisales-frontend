import { useEffect, useState } from 'react';

// Custom hook to handle URL search params
export const useURLSearchParams = () => {
  const [searchParams, setSearchParamsState] = useState(
    () => new URLSearchParams(window.location.search),
  );

  const setSearchParams = (
    params: URLSearchParams,
    options?: { replace?: boolean },
  ) => {
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    if (options?.replace) {
      window.history.replaceState({}, '', newUrl);
    } else {
      window.history.pushState({}, '', newUrl);
    }
    setSearchParamsState(new URLSearchParams(params));
  };

  useEffect(() => {
    const handlePopState = () => {
      setSearchParamsState(new URLSearchParams(window.location.search));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return [searchParams, setSearchParams] as const;
};
