import { Outlet } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Badge } from '~/components/badge';
import { useTitleBarStore } from '~/store/title-bar';
import { apiProtected } from '~/util/api';
import { ReportIssueButton } from '~/components/ReportIssueButton';

export default function RoleplayLayout() {
  const titleBarStore = useTitleBarStore();
  const { t } = useTranslation();

  return (
    <div className="flex h-screen flex-col bg-gray-200">
      <header className="w-full shrink-0 border-b border-[#EAEDEF] bg-white px-4 py-2.5 lg:px-8">
        {/* Mobile layout: vertical stacking */}
        <div className="md:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="hidden md:flex">
                <img
                  src="/logos/Hupo_Icon_Orange.svg"
                  alt="Logo"
                  className="size-6"
                />
              </div>
              <span className="text-lg font-bold text-gray-900">
                {titleBarStore.title ?? t('sessions.roleplayPractice')}
              </span>
            </div>
            <ReportIssueButton 
              buttonClassName="flex items-center justify-center rounded-full p-2 text-sm/6 text-gray-600 tracking-tight hover:bg-gray-100"
              popoverAnchor={{ to: 'bottom start', gap: '8px' }}
              iconOnly={true}
              onSubmit={(issueData) => apiProtected().url('/issues').post(issueData).json()}
            />
            {titleBarStore.action}
          </div>
        </div>

        {/* Desktop layout: horizontal */}
        <div className="hidden items-center justify-between md:flex">
          <div className="flex items-center gap-4">
            <img
              src="/logos/Hupo_Icon_Orange.svg"
              alt="Logo"
              className="size-7"
            />

            <div>
              <span className="text-sm font-bold text-gray-900 lg:text-xl">
                {titleBarStore.title ?? t('sessions.roleplayPractice')}
              </span>
            </div>

            <Badge color="blue">{titleBarStore.callType ?? 'Discovery'}</Badge>
            {titleBarStore.product && (
              <Badge color="gray">{titleBarStore.product}</Badge>
            )}
          </div>
          <div className="ml-auto mr-0.5">
            <ReportIssueButton 
              buttonClassName="flex items-center gap-2 rounded-full py-2 px-4 text-left text-sm/6 text-gray-600 tracking-tight hover:bg-gray-100"
              popoverAnchor={{ to: 'bottom end', gap: '8px' }}
              onSubmit={(issueData) => apiProtected().url('/issues').post(issueData).json()}
            />
          </div>
          {titleBarStore.action}
        </div>
      </header>

      <div className="flex min-h-0 w-full flex-1">
        <Outlet />
      </div>
    </div>
  );
}