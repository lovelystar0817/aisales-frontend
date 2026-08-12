import React, { useMemo } from 'react';
import { useLanguage } from '~/context/language';
import { languages } from '~/i18n/languages';
import clsx from 'clsx';
import { useAuthStore } from '~/store/auth';

interface LanguageSelectorProps {
  className?: string;
}

export default function LanguageSelector({ className }: LanguageSelectorProps) {
  const { language, changeLanguage } = useLanguage();
  const company = useAuthStore((state) => state.company);

  const onLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    changeLanguage(newLanguage);

    // Perform full page reload to ensure all translations are properly applied
    window.location.reload();
  };

  const languageOptions = useMemo(() => {
    // Use company languages if available, otherwise show all languages
    if (company?.languages?.length) {
      return languages.filter((lang) => company.languages!.includes(lang.code));
    }
    return languages;
  }, [company?.languages]);

  return (
    <div className={clsx('relative inline-block', className)}>
      <select
        value={language}
        onChange={onLanguageChange}
        className="block w-full appearance-none rounded-md border border-gray-300 bg-white py-2 pr-10 pl-3 text-sm leading-5 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
      >
        {languageOptions.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
}
