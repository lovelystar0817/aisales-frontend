import { redirect } from 'react-router';
import i18n from '~/i18n/i18n';
import { languages } from '~/i18n/languages';
import { useAuthStore } from '~/store/auth';

// Get array of supported language codes
const supportedLanguages = languages.map(lang => lang.code);

export function clientLoader({ params }: { params: { lang: string; slug: string } }) {
  const { lang, slug } = params;
  const token = useAuthStore.getState().getToken();

  // Only change language if it's supported
  if (lang && supportedLanguages.includes(lang)) {
    // Set the language
    i18n.changeLanguage(lang);

    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('i18nextLng', lang);
    }
  }

  // Check if user is authenticated
  if (token.length === 0) {
    // Redirect to auth page with slug parameter for company name prefilling
    return redirect(`/auth?slug=${slug}`);
  }

  // If user is already authenticated, redirect to home
  return redirect('/');
}

export default function LanguageSlug() {
  return null;
}
