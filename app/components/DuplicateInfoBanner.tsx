import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface DuplicateInfoBannerProps {
  translationKey: string;
  defaultMessage: string;
  show?: boolean;
  t: (key: string, defaultValue: string) => string;
}

export function DuplicateInfoBanner({
  translationKey,
  defaultMessage,
  show = true,
  t,
}: DuplicateInfoBannerProps) {
  if (!show) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg bg-[#EBF5FF] px-4 py-3">
      <InformationCircleIcon className="h-5 w-5 flex-shrink-0 text-[#0066CC]" />
      <p className="text-sm text-[#161618]">
        {t(translationKey, defaultMessage)}
      </p>
    </div>
  );
}
