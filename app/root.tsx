import type { Route } from './+types/root';
import { useEffect } from 'react';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';
import { useTranslation } from 'react-i18next';

import './app.css';
import './i18n/i18n';
import { SharedLayout } from './layouts/shared';

export const links: Route.LinksFunction = () => [];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html className="h-full scroll-smooth bg-white antialiased">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="relative h-full">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  useEffect(() => {
    let language = 'en'; // Default language
    if (typeof window !== 'undefined' && (window as any).i18next) {
      language = (window as any).i18next.language;
    }
    // Check localStorage directly as a fallback (client-side only)
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedLang = localStorage.getItem('i18nextLng');
      if (storedLang) {
        language = storedLang;
      }
    }

    document.documentElement.setAttribute('lang', language);
    return () => {
      document.documentElement.removeAttribute('lang');
    };
  }, []);

  return (
    <SharedLayout>
      <Outlet />
    </SharedLayout>
  );
}

export function HydrateFallback() {
  // Using hardcoded text here since i18n might not be initialized yet
  return <p>Loading...</p>;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  // For 404 errors, use our dedicated NotFound component
  if (isRouteErrorResponse(error) && error.status === 404) {
    // Dynamically import the NotFound component
    const NotFound = require('./routes/not-found').default;
    return <NotFound />;
  }

  // Import t function from i18next for translations
  const { t } = useTranslation();

  // For other errors, use the default error display
  let message = t('errorBoundary.oops');
  let details = t('errorBoundary.unexpectedError');
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = t('errorBoundary.error');
    details = error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
