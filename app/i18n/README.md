# Internationalization (i18n) Guide

This project uses `react-i18next` for internationalization. This guide will help you understand how to use the i18n system.

## Available Languages

Currently, the following languages are supported:

- English (en)
- French (fr)
- Russian (ru)
- Chinese (zh)

## Structure

The i18n system is set up with the following files:

- `i18n/i18n.ts` - Main configuration file for i18next
- `i18n/types.ts` - TypeScript types for translations
- `i18n/locales/*.json` - Translation files for each language
- `context/language.tsx` - React context for language selection
- `components/LanguageSelector.tsx` - Component for switching languages

## How to Use

### Basic Translation

Use the `useTranslation` hook from `react-i18next` to access the translation function:

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return <p>{t('common.loading', 'Loading...')}</p>;
}
```

### Type-safe Translation (Recommended)

For type safety, use the custom `useAppTranslation` hook:

```tsx
import { useAppTranslation } from '~/hooks/useAppTranslation';

function MyComponent() {
  const { t } = useAppTranslation();

  return <p>{t('common.loading', 'Loading...')}</p>;
}
```

### Language Switching

The `LanguageSelector` component is provided to allow users to switch languages. It's already integrated in the user menu in the sidebar.

If you need to access or change the language programmatically, use the `useLanguage` hook:

```tsx
import { useLanguage } from '~/context/language';

function MyComponent() {
  const { language, changeLanguage } = useLanguage();

  return (
    <button onClick={() => changeLanguage('fr')}>
      Current language: {language}
    </button>
  );
}
```

## Adding New Translations

1. Add new keys and translations to `app/i18n/locales/en.json`
2. Add translations for other languages in their respective files
3. Use the new keys in your components

## Adding a New Language

1. Create a new translation file in `app/i18n/locales/[lang-code].json`
2. Add the language to the resources object in `app/i18n/i18n.ts`
3. Add the language to the `languages` array in `LanguageSelector.tsx`

## Best Practices

1. Organize translations by feature or component with nested objects
2. Always provide a fallback string in case the translation is missing
3. Use variables for dynamic content: `t('greeting', 'Hello {{name}}', { name })`
4. For complex formatting or HTML in translations, use the `Trans` component
