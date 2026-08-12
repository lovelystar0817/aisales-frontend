import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { ReportType } from '../../ReportModal';

interface ReportsDropdownProps {
  onReportClick: (reportType: ReportType) => void;
}

export default function ReportsDropdown({ onReportClick }: ReportsDropdownProps) {
  const { t } = useTranslation();

  return (
    <Menu as="div" className="relative w-full sm:w-auto">
      <MenuButton className="rounded-full w-full justify-center bg-[#FFF0EB] px-6 py-3 text-sm/5 text-primary-500 focus:outline-none data-[hover]:bg-[#FFD8D0] data-[open]:bg-primary-700 data-[focus]:outline-1 data-[focus]:outline-primary disabled:bg-gray-200 disabled:text-gray-500 flex items-center gap-2 sm:w-auto">
        {t('manage.downloadReport')}
      </MenuButton>
      
      <MenuItems className="absolute right-0 mt-2 w-64 origin-top-right rounded-md bg-white shadow-lg focus:outline-none z-10">
        <div className="divide-y divide-gray-200">
          <MenuItem>
            {({ focus }) => (
              <button
                className={`${
                  focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                } group flex w-full items-center px-4 py-3 text-sm text-left`}
                onClick={() => onReportClick(ReportType.ACCOUNT_CREATION)}
              >
                {t('manage.dashboard.reports.accountCreation')}
              </button>
            )}
          </MenuItem>
          
          <MenuItem>
            {({ focus }) => (
              <button
                className={`${
                  focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                } group flex w-full items-center px-4 py-3 text-sm text-left`}
                onClick={() => onReportClick(ReportType.ACTIVE_USERS)}
              >
                {t('manage.dashboard.reports.activeUsers')}
              </button>
            )}
          </MenuItem>
          
          <MenuItem>
            {({ focus }) => (
              <button
                className={`${
                  focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                } group flex w-full items-center px-4 py-3 text-sm text-left`}
                onClick={() => onReportClick(ReportType.REPEAT_USERS)}
              >
                {t('manage.dashboard.reports.repeatUsers')}
              </button>
            )}
          </MenuItem>
          
          <MenuItem>
            {({ focus }) => (
              <button
                className={`${
                  focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                } group flex w-full items-center px-4 py-3 text-sm text-left`}
                onClick={() => onReportClick(ReportType.COMPLETED_PRACTICES)}
              >
                {t('manage.dashboard.reports.completedPractices')}
              </button>
            )}
          </MenuItem>
        </div>
      </MenuItems>
    </Menu>
  );
}
