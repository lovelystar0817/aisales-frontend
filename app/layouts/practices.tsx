import { type PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';

export default function PracticesLayout({ children }: PropsWithChildren) {
  const { t } = useTranslation();
  return (
    <div className="min-w-full">
      <header className="mb-6 border-b border-[#E0E0E0]">
        <div className="container mx-auto flex h-[24px] items-center px-4">
          <h1 className="mb-8 text-[16px] font-bold text-[#000000]">
            {t('home.pastPractices')}
          </h1>
        </div>
      </header>
      <main className="container mx-auto">
        <div className="flex flex-col items-center justify-center gap-2 px-4">
          {children}
        </div>
      </main>
    </div>
  );
}
