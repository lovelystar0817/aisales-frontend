import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { clsx } from 'clsx';
import { Button } from '~/components/button';
import toast from 'react-hot-toast';

type PopoverAnchorPosition = 'top start' | 'top end' | 'bottom start' | 'bottom end' | 'left start' | 'left end' | 'right start' | 'right end';

interface ReportIssueButtonProps {
  readonly buttonClassName?: string;
  readonly popoverAnchor?: { 
    readonly to: PopoverAnchorPosition; 
    readonly gap: string; 
  };
  readonly mobilePopoverAnchor?: { 
    readonly to: PopoverAnchorPosition; 
    readonly gap: string; 
  };
  readonly desktopPopoverAnchor?: { 
    readonly to: PopoverAnchorPosition; 
    readonly gap: string; 
  };
  readonly iconOnly?: boolean;
  readonly onSubmit: (issueData: {
    readonly description: string;
    readonly userAgent: string;
    readonly url: string;
    readonly metadata: {
      readonly timestamp: string;
      readonly viewport: {
        readonly width: number;
        readonly height: number;
      };
    };
  }) => Promise<any>;
}

export function ReportIssueButton({
  buttonClassName = "flex items-center gap-2 w-full rounded-lg p-2 text-left text-base/6 tracking-tight hover:bg-gray-100",
  popoverAnchor = { to: 'right end' as const, gap: '8px' },
  mobilePopoverAnchor,
  desktopPopoverAnchor,
  iconOnly = false,
  onSubmit,
}: Readonly<ReportIssueButtonProps>) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [issueText, setIssueText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Determine responsive anchor
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Choose the appropriate anchor based on screen size
  const currentAnchor = (() => {
    if (mobilePopoverAnchor && desktopPopoverAnchor) {
      return isMobile ? mobilePopoverAnchor : desktopPopoverAnchor;
    }
    return popoverAnchor;
  })();

  const handleSend = async () => {
    if (issueText.trim() && !isSubmitting) {
      setIsSubmitting(true);
      
      try {
        await onSubmit({
          description: issueText.trim(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          metadata: {
            timestamp: new Date().toISOString(),
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight,
            },
          },
        });

        setIssueText('');
        setIsOpen(false);
        toast.success(t('sidebar.reportIssueSuccess', "Thanks! We've received your report."));
      } catch (error) {
        console.error('Failed to report issue:', error);
        toast.error(t('sidebar.reportIssueError', 'Failed to report issue. Please try again.'));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleCancel = () => {
    setIssueText('');
    setIsOpen(false);
  };

  return (
    <Popover>
      <PopoverButton
        className={buttonClassName}
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <g clipPath="url(#clip0_3042_11414)">
            <path
              d="M2.49328 13.6194C2.61581 13.9285 2.64309 14.2672 2.57161 14.5919L1.68411 17.3335C1.65552 17.4726 1.66291 17.6166 1.70559 17.752C1.74827 17.8874 1.82483 18.0096 1.928 18.1071C2.03117 18.2046 2.15754 18.2741 2.29511 18.3091C2.43269 18.3441 2.57691 18.3433 2.71411 18.3069L5.55828 17.4752C5.86471 17.4144 6.18205 17.441 6.47411 17.5519C8.2536 18.3829 10.2694 18.5587 12.1659 18.0483C14.0624 17.5379 15.7177 16.3741 16.8397 14.7622C17.9617 13.1503 18.4784 11.1939 18.2985 9.23817C18.1187 7.28246 17.2539 5.4531 15.8567 4.07288C14.4595 2.69265 12.6197 1.85025 10.6619 1.69429C8.70416 1.53834 6.75423 2.07887 5.15615 3.2205C3.55807 4.36213 2.41456 6.0315 1.92736 7.93408C1.44016 9.83666 1.64059 11.8502 2.49328 13.6194Z"
              stroke="currentColor"
              strokeWidth="1.67"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10 6.66797V10.0013"
              stroke="currentColor"
              strokeWidth="1.67"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10 13.332H10.0083"
              stroke="currentColor"
              strokeWidth="1.67"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <defs>
            <clipPath id="clip0_3042_11414">
              <rect width="20" height="20" fill="white" />
            </clipPath>
          </defs>
        </svg>
        {!iconOnly && (
          <span className="md:inline">{t('sidebar.reportIssue', 'Report an issue')}</span>
        )}
      </PopoverButton>
      {isOpen && (
        <PopoverPanel
          static
          anchor={currentAnchor}
          className="z-50 w-94 rounded-lg border border-[#E1E0DF] bg-white p-4 shadow-lg"
        >
          <div className="space-y-2">
            <textarea
              value={issueText}
              onChange={(e) => setIssueText(e.target.value)}
              placeholder={t(
                'sidebar.reportIssuePlaceholder',
                'Describe the issue or share your feedback here',
              )}
              className="w-full min-h-20 text-sm p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={4}
            />
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={handleCancel}
                className="flex-1 border border-gray-300 justify-center"
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                variant="primary"
                onClick={handleSend}
                className={clsx(
                  'flex-1 transition-opacity',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none justify-center disabled:bg-gray-200 disabled:text-gray-600',
                )}
                disabled={!issueText.trim() || isSubmitting}
              >
                {isSubmitting ? t('common.sending', 'Sending...') : t('common.send', 'Send')}
              </Button>
            </div>
          </div>
        </PopoverPanel>
      )}
    </Popover>
  );
}
