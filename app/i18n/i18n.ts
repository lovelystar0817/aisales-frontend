import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import enTranslation from './locales/en.json';
import idTranslation from './locales/id.json';
import msTranslation from './locales/ms.json';
import tlTranslation from './locales/tl.json';
import viTranslation from './locales/vi.json';
import thTranslation from './locales/th.json';
import cebTranslation from './locales/ceb.json';
import cmnTranslation from './locales/cmn.json';
import yueTranslation from './locales/yue.json';
import koTranslation from './locales/ko.json';
import type { FlexibleTranslationResources } from './types';

// Define resources with more flexible typing
// This allows translations to have different structures while still providing some type safety
const resources = {
  en: {
    translation: enTranslation,
  },
  id: {
    translation: idTranslation as FlexibleTranslationResources,
  },
  ms: {
    translation: msTranslation as FlexibleTranslationResources,
  },
  tl: {
    translation: tlTranslation as FlexibleTranslationResources,
  },
  vi: {
    translation: viTranslation as FlexibleTranslationResources,
  },
  th: {
    translation: thTranslation as FlexibleTranslationResources,
  },
  ceb: {
    translation: cebTranslation as FlexibleTranslationResources,
  },
  cmn: {
    translation: cmnTranslation as FlexibleTranslationResources,
  },
  yue: {
    translation: yueTranslation as FlexibleTranslationResources,
  },
  ko: {
    translation: koTranslation as FlexibleTranslationResources,
  },
};

i18n
  // detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next
  .use(initReactI18next)
  // init i18next
  .init({
    resources,
    fallbackLng: 'en',
    debug: import.meta.env.DEV,

    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
  });

// Make i18n available globally
if (typeof window !== 'undefined') {
  (window as any).i18next = i18n;
}

export default i18n;
