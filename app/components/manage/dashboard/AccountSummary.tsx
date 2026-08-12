import { Info, ArrowUp, ArrowDown } from 'lucide-react';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import { useTranslation } from 'react-i18next';
import type { DashboardSummary } from '~/util/api';

interface AccountSummaryProps {
  accountSummary: DashboardSummary['accountSummary'];
}

export default function AccountSummary({ accountSummary }: AccountSummaryProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        {t('manage.dashboard.accountSummary.title')}
      </h2>
      <div className="grid grid-cols-1 gap-4 divide-x divide-gray-200 md:grid-cols-3">
        <div>
          <p className="mb-1 text-sm text-gray-600">{t('manage.dashboard.accountSummary.accountsCreated')}</p>
          <p className="text-2xl font-bold text-gray-900">
            {accountSummary.accountsCreated}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm text-gray-600">{t('manage.dashboard.accountSummary.activeUsers30d')}</p>
            <RadixTooltip.Provider delayDuration={300}>
              <RadixTooltip.Root>
                <RadixTooltip.Trigger asChild>
                  <div className="cursor-help">
                    <Info className="h-4 w-4 text-gray-400" />
                  </div>
                </RadixTooltip.Trigger>
                <RadixTooltip.Portal>
                  <RadixTooltip.Content
                    className="rounded-md p-3 bg-white shadow-md text-xs max-w-[300px] border border-gray-200"
                    sideOffset={5}
                    side="bottom"
                    align="start"
                  >
                    <p className="text-sm text-gray-600 leading-normal">
                      {t('manage.dashboard.accountSummary.activeUsersTooltip')}
                    </p>
                    <RadixTooltip.Arrow className="fill-white" />
                  </RadixTooltip.Content>
                </RadixTooltip.Portal>
              </RadixTooltip.Root>
            </RadixTooltip.Provider>
          </div>
          <div className="flex items-end space-x-2">
            <p className="text-2xl font-bold text-gray-900">
              {accountSummary.monthlyActiveUsers}
            </p>
            {accountSummary.monthlyActiveUsersGrowth !== 0 && (
              <div className={"text-sm ml-auto mr-4 flex items-end gap-2"}>
                {accountSummary.monthlyActiveUsersGrowth > 0
                  ? (
                    <div className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                      <ArrowUp className="size-3 stroke-2" />{accountSummary.monthlyActiveUsersGrowth}%
                    </div>
                  )
                  : (
                    <div className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full flex items-center gap-1">
                      <ArrowDown className="size-3 stroke-2" />{accountSummary.monthlyActiveUsersGrowth}%
                    </div>
                  )}{' '}
                <span className="text-gray-400">{t('manage.dashboard.accountSummary.vsPrev30d')}</span>
              </div>
            )}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm text-gray-600">{t('manage.dashboard.accountSummary.repeatUsers')}</p>
            <RadixTooltip.Provider delayDuration={300}>
              <RadixTooltip.Root>
                <RadixTooltip.Trigger asChild>
                  <div className="cursor-help">
                    <Info className="h-4 w-4 text-gray-400" />
                  </div>
                </RadixTooltip.Trigger>
                <RadixTooltip.Portal>
                  <RadixTooltip.Content
                    className="rounded-md p-3 bg-white shadow-md text-xs max-w-[300px] border border-gray-200"
                    sideOffset={5}
                    side="bottom"
                    align="start"
                  >
                    <p className="text-sm text-gray-600 leading-normal">
                      {t('manage.dashboard.accountSummary.repeatUsersTooltip')}
                    </p>
                    <RadixTooltip.Arrow className="fill-white" />
                  </RadixTooltip.Content>
                </RadixTooltip.Portal>
              </RadixTooltip.Root>
            </RadixTooltip.Provider>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {accountSummary.repeatUsers}
          </p>
        </div>
      </div>
    </div>
  );
}
