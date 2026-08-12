import React, { createContext, useState, useContext, useEffect } from 'react';
import i18n from '../i18n/i18n';
import { languages } from '../i18n/languages';

type LanguageContextType = {
  language: string;
  changeLanguage: (lng: string) => void;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  changeLanguage: () => {},
});

const SUPPORTED_LANGUAGE_CODES = languages.map((l) => l.code);

/**
 * Normalizes language codes like "en-US", "en-GB" to their base language code (e.g., "en")
 * and validates against supported languages. Falls back to 'en' if unsupported.
 * This ensures the AI voice speaks the same language as the UI.
 */
const normalizeLanguageCode = (code: string): string => {
  const base = code.split('-')[0].toLowerCase();
  return SUPPORTED_LANGUAGE_CODES.includes(base) ? base : 'en';
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState(
    normalizeLanguageCode(i18n.language || 'en'),
  );

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setLanguage(normalizeLanguageCode(lng));
    localStorage.setItem('i18nextLng', lng);
  };

  useEffect(() => {
    const storedLanguage = localStorage.getItem('i18nextLng');
    if (storedLanguage) {
      changeLanguage(storedLanguage);
    }
  }, []);

  useEffect(() => {
    const handleLanguageChanged = () => {
      setLanguage(normalizeLanguageCode(i18n.language));
    };

    i18n.on('languageChanged', handleLanguageChanged);

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, []);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
