export interface Language {
  code: string;
  name: string;
  nativeName: string;
  direction?: 'ltr' | 'rtl'; // Default is 'ltr'
}

export const languages: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
  },
  {
    code: 'id',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
  },
  // {
  //   code: 'ms',
  //   name: 'Malay',
  //   nativeName: 'Bahasa Melayu',
  // },
  {
    code: 'tl',
    name: 'Tagalog',
    nativeName: 'Tagalog',
  },
  {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
  },
  {
    code: 'th',
    name: 'Thai',
    nativeName: 'ไทย',
  },
  {
    code: 'ceb',
    name: 'Cebuano',
    nativeName: 'Cebuano',
  },
  {
    code: 'cmn',
    name: 'Traditional Chinese',
    nativeName: '繁體中文',
  },
  {
    code: 'yue',
    name: 'Cantonese',
    nativeName: '廣東話',
  },
  {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
  },
];

export function getLanguage(code: string): Language | undefined {
  return languages.find((lang) => lang.code === code);
}

export function getLanguageName(code: string): string {
  const language = getLanguage(code);
  return language?.nativeName || code;
}
