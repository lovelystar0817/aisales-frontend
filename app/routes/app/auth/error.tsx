import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';

interface Auth0ErrorParams {
  client_id?: string;
  connection?: string;
  lang?: string;
  error: string;
  error_description: string;
  tracking?: string;
  log_url?: string;
}

interface FriendlyErrorMessage {
  title: string;
  description: string;
}

function getFriendlyErrorMessage(
  error: string,
  error_description: string,
): FriendlyErrorMessage {
  // Convert technical errors to user-friendly messages
  const lowerError = error.toLowerCase();
  const lowerDescription = error_description.toLowerCase();

  // Rate limiting / too many requests
  if (
    lowerError.includes('rate') ||
    lowerDescription.includes('rate') ||
    lowerDescription.includes('too many') ||
    lowerDescription.includes('limit')
  ) {
    return {
      title: 'Too Many Requests',
      description:
        "We're experiencing high login activity right now. Please wait a moment and try again.",
    };
  }

  // Invalid request / session issues
  if (
    lowerError.includes('invalid_request') ||
    lowerDescription.includes('back button') ||
    lowerDescription.includes('session') ||
    lowerDescription.includes('cookie')
  ) {
    return {
      title: 'Session Expired',
      description:
        'Your login session has expired or there was an issue with your request. Please try logging in again.',
    };
  }

  // Access denied / unauthorized
  if (
    lowerError.includes('access_denied') ||
    lowerError.includes('unauthorized')
  ) {
    return {
      title: 'Access Not Authorized',
      description:
        "You don't have permission to access this application. Please contact your administrator if you believe this is an error.",
    };
  }

  // Invalid credentials / login failed
  if (
    lowerError.includes('invalid_grant') ||
    lowerError.includes('invalid_credentials') ||
    lowerDescription.includes('password') ||
    lowerDescription.includes('credential')
  ) {
    return {
      title: 'Login Failed',
      description:
        'The username or password you entered is incorrect. Please check your credentials and try again.',
    };
  }

  // Server/service errors
  if (
    lowerError.includes('server_error') ||
    lowerError.includes('temporarily_unavailable') ||
    lowerDescription.includes('server') ||
    lowerDescription.includes('unavailable')
  ) {
    return {
      title: 'Service Temporarily Unavailable',
      description:
        "We're experiencing technical difficulties. Please try again in a few minutes.",
    };
  }

  // Unsupported response type / configuration issues
  if (
    lowerError.includes('unsupported') ||
    lowerError.includes('invalid_client')
  ) {
    return {
      title: 'Configuration Issue',
      description:
        "There's a technical issue with the login configuration. Please contact support.",
    };
  }

  // Default fallback for any other errors
  return {
    title: 'Authentication Issue',
    description:
      'We encountered an issue while trying to log you in. Please try again or contact support if the problem persists.',
  };
}

export default function Auth0Error() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const error = searchParams.get('error');
  const error_description = searchParams.get('error_description');

  if (!error || !error_description) {
    return (
      <main className="flex min-h-full w-full items-center justify-center">
        <div className="max-w-md text-center">
          <img
            className="mx-auto mb-4 h-10"
            src="/logos/Hupo_Logotype_Orange(noR).svg"
            alt={t('auth.hupoLogoAlt')}
          />
          <p className="mb-6 text-red-600">
            {t(
              'auth.errors.unknown_auth0',
              'Authentication failed. Please try again.',
            )}
          </p>
          <button
            onClick={() => (window.location.href = '/auth')}
            className="bg-primary hover:bg-primary-600 w-full rounded-md px-4 py-2 text-white transition-colors"
          >
            {t('auth.errors.tryAgain', 'Try Again')}
          </button>
        </div>
      </main>
    );
  }

  const errorData: Auth0ErrorParams = {
    client_id: searchParams.get('client_id') || undefined,
    connection: searchParams.get('connection') || undefined,
    lang: searchParams.get('lang') || undefined,
    error,
    error_description,
    tracking: searchParams.get('tracking') || undefined,
    log_url: searchParams.get('log_url') || undefined,
  };

  const friendlyMessage = getFriendlyErrorMessage(error, error_description);

  return (
    <main className="flex min-h-full w-full items-center justify-center">
      <div className="max-w-md text-center">
        <img
          className="mx-auto mb-4 h-10"
          src="/logos/Hupo_Logotype_Orange(noR).svg"
          alt={t('auth.hupoLogoAlt')}
        />

        <h1 className="mb-4 text-2xl font-semibold text-gray-900">
          {friendlyMessage.title}
        </h1>

        <div className="mb-6">
          <p className="mb-4 text-sm text-gray-600">
            {friendlyMessage.description}
          </p>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => (window.location.href = '/auth')}
            className="bg-primary hover:bg-primary-600 w-full rounded-md px-4 py-2 text-white transition-colors"
          >
            {t('auth.errors.tryAgain', 'Try Again')}
          </button>

          <button
            onClick={() => (window.location.href = '/')}
            className="w-full rounded-md bg-gray-200 px-4 py-2 text-gray-800 transition-colors hover:bg-gray-300"
          >
            {t('auth.errors.backHome', 'Back to Home')}
          </button>
        </div>
      </div>
    </main>
  );
}
