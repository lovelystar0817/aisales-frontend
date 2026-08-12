import { redirect } from 'react-router';
import i18n from '~/i18n/i18n';
import { languages } from '~/i18n/languages';

// Get array of supported language codes
const supportedLanguages = languages.map(lang => lang.code);

export function clientLoader({ params }: { params: { lang: string } }) {
  const { lang } = params;

  // Only change language if it's supported
  if (lang && supportedLanguages.includes(lang)) {
    // Set the language
    i18n.changeLanguage(lang);

    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('i18nextLng', lang);
    }
  }

  // Redirect to the main auth page
  return redirect('/auth');
}

export default function LanguageAuth() {
  return null;
}
