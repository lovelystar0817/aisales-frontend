import type { ReactNode } from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

interface ProductLinkProps {
  label: string;
  onClick?: () => void;
  children?: ReactNode;
}

export default function ProductLink({
  label,
  onClick,
  children,
}: ProductLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer items-center justify-between p-2.5 text-left transition hover:bg-gray-50"
    >
      <span className="text-sm/relaxed text-gray-500">{label}</span>
      {children ?? <ChevronRightIcon className="size-5 text-[#1C7AEB]" />}
    </button>
  );
}
