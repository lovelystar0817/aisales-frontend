import { useRef, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { cn } from '~/util/utils';

interface CardContentProps {
  readonly children?: ReactNode;
  readonly icon: ReactNode;
  readonly iconBgColor?: string;
  readonly title: string;
  readonly description: string;
  readonly locked?: boolean;
  readonly childrenContainerRef: React.RefObject<HTMLDivElement | null>;
  readonly isOverflowing: boolean;
  readonly isScrolledToBottom: boolean;
  readonly t: (key: string) => string;
}

const CardContent = ({ 
  children, 
  icon, 
  iconBgColor, 
  title, 
  description, 
  locked, 
  childrenContainerRef, 
  isOverflowing, 
  isScrolledToBottom, 
  t 
}: CardContentProps) => (
  <>
    <div className={cn(locked && 'blur-[2px]')}>
      <span
        className="flex size-9 items-center justify-center rounded-sm"
        style={{ backgroundColor: iconBgColor }}
      >
        {icon}
      </span>
      <h2 className="mt-4 text-lg/loose font-bold text-gray-900">{title}</h2>
      <p className="mt-1 text-sm leading-5 text-gray-500">{description}</p>
    </div>

    {children && <div className={cn('relative flex-1', locked && 'blur-[2px]')}>
      <div
        ref={childrenContainerRef}
        className="h-full max-h-48 w-full divide-y divide-[#D9DDE0] overflow-y-auto"
      >
        {children}
      </div>

      {isOverflowing && !isScrolledToBottom && (
        <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-white to-transparent pt-3 pb-1">
          <p className="bg-white text-center text-sm/relaxed text-gray-500">
            {t('practice.scrollToViewMore')}
          </p>
        </div>
      )}
    </div>}

    {locked && (
      <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[2px]">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 shadow-md">
            <LockClosedIcon className="h-6 w-6 text-gray-500" />
          </div>
          <p className="font-medium text-gray-700">Locked</p>
        </div>
      </div>
    )}
  </>
);

interface PracticeCardProps {
  readonly icon: ReactNode;
  readonly iconBgColor?: string;
  readonly title: string;
  readonly description: string;
  readonly locked?: boolean;
  readonly children?: ReactNode;
  readonly className?: string;
  readonly singleScenario?: boolean;
  readonly onClick?: () => void;
}

export default function PracticeCard({
  icon,
  iconBgColor,
  title,
  description,
  locked,
  children,
  className,
  singleScenario = false,
  onClick,
}: PracticeCardProps) {
  const { t } = useTranslation();
  const childrenContainerRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (childrenContainerRef.current) {
        const { scrollHeight, clientHeight } = childrenContainerRef.current;
        setIsOverflowing(scrollHeight > clientHeight);

        // If not overflowing, we're technically at the bottom
        if (scrollHeight <= clientHeight) {
          setIsScrolledToBottom(true);
        }
      }
    };

    const handleScroll = () => {
      if (childrenContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } =
          childrenContainerRef.current;
        // Consider "at bottom" when within 1px of the bottom
        const atBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 1;
        setIsScrolledToBottom(atBottom);
      }
    };

    // Check initially
    checkOverflow();
    handleScroll();

    // Add scroll event listener
    const currentRef = childrenContainerRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll);
    }

    // Also check after images or other content might have loaded
    window.addEventListener('load', checkOverflow);
    window.addEventListener('resize', checkOverflow);

    return () => {
      if (currentRef) {
        currentRef.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('load', checkOverflow);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [children]);

  if (onClick && !locked) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'relative flex flex-col gap-6 rounded-xl border border-[#D9DDE0] bg-white p-5 text-left transition hover:bg-gray-50 cursor-pointer',
          singleScenario ? 'min-h-[180px]' : 'min-h-[220px]',
          className,
        )}
      >
        <CardContent 
          icon={icon}
          iconBgColor={iconBgColor}
          title={title}
          description={description}
          locked={locked}
          childrenContainerRef={childrenContainerRef}
          isOverflowing={isOverflowing}
          isScrolledToBottom={isScrolledToBottom}
          t={t}
        />
      </button>
    );
  }

  return (
    <div
      className={cn(
        'relative flex flex-col gap-6 rounded-xl border border-[#D9DDE0] bg-white p-5',
        singleScenario ? 'min-h-[180px]' : 'min-h-[220px]',
        className,
      )}
    >
      <CardContent 
        icon={icon}
        iconBgColor={iconBgColor}
        title={title}
        description={description}
        locked={locked}
        childrenContainerRef={childrenContainerRef}
        isOverflowing={isOverflowing}
        isScrolledToBottom={isScrolledToBottom}
        t={t}
      >
        {children}
      </CardContent>
    </div>
  );
}
