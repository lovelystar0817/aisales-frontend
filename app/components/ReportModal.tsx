import { useState } from 'react';
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  CloseButton,
  RadioGroup,
  Radio,
  Popover,
  PopoverButton,
  PopoverPanel,
} from '@headlessui/react';
import { Calendar } from '~/components/Calendar';
import { type DateRange } from 'react-day-picker';
import { cn } from '~/util/utils';
import { CalendarIcon } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { reportsApi } from '~/util/api';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useFeatureFlagEnabled } from 'posthog-js/react';

export enum ReportType {
  USERS = 'users',
  ACCOUNT_CREATION = 'account-creation',
  ACTIVE_USERS = 'active-users',
  REPEAT_USERS = 'repeat-users',
  COMPLETED_PRACTICES = 'completed-practices',
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: ReportType;
  teams?: string[];
  module?: string;
}

export default function ReportModal({
  isOpen,
  onClose,
  reportType,
  teams,
  module,
}: ReportModalProps) {
  const { t } = useTranslation();
  const showTeamColumn = useFeatureFlagEnabled(
    'manage__report-excel__show-team-column',
  );

  // Internal state management
  const [reportPeriod, setReportPeriod] = useState('all-time');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(
    {
      from: dayjs().subtract(30, 'days').toDate(),
      to: dayjs().toDate(),
    },
  );

  // Get report configuration based on type
  const getReportConfig = () => {
    switch (reportType) {
      case ReportType.USERS:
        return {
          title: t('manage.dashboard.reports.users'),
          filename: 'users-report',
          downloadFunction: reportsApi.downloadUsersReport,
        };
      case ReportType.ACCOUNT_CREATION:
        return {
          title: t(
            'manage.dashboard.reports.accountCreation',
            'Account creation report',
          ),
          filename: 'account-creation-report',
          downloadFunction: reportsApi.downloadAccountCreationReport,
        };
      case ReportType.ACTIVE_USERS:
        return {
          title: t(
            'manage.dashboard.reports.activeUsers',
            'Active user report',
          ),
          filename: 'active-users-report',
          downloadFunction: reportsApi.downloadActiveUsersReport,
        };
      case ReportType.REPEAT_USERS:
        return {
          title: t(
            'manage.dashboard.reports.repeatUsers',
            'Repeat user report',
          ),
          filename: 'repeat-users-report',
          downloadFunction: reportsApi.downloadRepeatUsersReport,
        };
      case ReportType.COMPLETED_PRACTICES:
        return {
          title: t(
            'manage.dashboard.reports.completedPractices',
            'Completed practice report',
          ),
          filename: 'completed-practices-report',
          downloadFunction: reportsApi.downloadCompletedPracticesReport,
        };
      default:
        return {
          title: t('manage.dashboard.reportModal.defaultTitle', 'Report'),
          filename: 'report',
          downloadFunction: reportsApi.downloadUsersReport,
        };
    }
  };

  const reportConfig = getReportConfig();

  // Download mutation
  const downloadReportMutation = useMutation({
    mutationFn: async () => {
      // Prepare date parameters
      let dateParams: { dateFrom?: string; dateTo?: string; teams?: string[]; module?: string; tc?: number } = {};

      if (reportPeriod === 'last-30-days') {
        dateParams = {
          dateFrom: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
          dateTo: dayjs().format('YYYY-MM-DD'),
        };
      } else if (
        reportPeriod === 'custom-date' &&
        customDateRange?.from &&
        customDateRange?.to
      ) {
        dateParams = {
          dateFrom: dayjs(customDateRange.from).format('YYYY-MM-DD'),
          dateTo: dayjs(customDateRange.to).format('YYYY-MM-DD'),
        };
      }

      // Add teams filter if provided
      if (teams !== undefined) {
        dateParams.teams = teams;
      }

      // Add module filter if provided (only for users report)
      if (module && reportType === ReportType.USERS) {
        dateParams.module = module;
      }

      // Add tc parameter if feature flag is enabled
      if (showTeamColumn) {
        dateParams.tc = 1;
      }

      return await reportConfig.downloadFunction(dateParams);
    },
    onSuccess: (blob) => {
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = getReportFilename();
      link.click();
      URL.revokeObjectURL(url);

      // Show success toast
      toast.success(t('manage.dashboard.reportModal.successToast'));

      onClose();
    },
    onError: (error) => {
      console.error('Error downloading report:', error);
    },
  });

  const timestamp = dayjs().format('YYYYMMDDHHmmss');
  const getReportFilename = () => {
    return `${reportConfig.filename}-${timestamp}.xlsx`;
  };

  const handleDownloadReport = () => {
    downloadReportMutation.mutate();
  };
  return (
    <Dialog
      open={isOpen}
      as="div"
      className="relative z-[999] focus:outline-none"
      onClose={onClose}
    >
      <DialogBackdrop className="fixed inset-0 bg-black/30" />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            transition
            className="w-full max-w-md rounded-xl bg-white backdrop-blur-2xl duration-300 ease-out data-[closed]:transform-[scale(95%)] data-[closed]:opacity-0"
          >
            <div className="flex justify-between gap-4 p-4">
              <DialogTitle
                as="h3"
                className="flex-1 text-xl font-medium tracking-tight text-black"
              >
                {reportConfig.title}
              </DialogTitle>

              <CloseButton>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </CloseButton>
            </div>

            <div className="px-4 pb-4">
              <div className="mb-4">
                <div className="mb-4 block text-sm font-medium text-gray-900">
                  {t('manage.dashboard.reportModal.reportPeriod')}
                </div>

                <RadioGroup
                  value={reportPeriod}
                  onChange={setReportPeriod}
                  className="space-y-4"
                >
                  <Radio
                    value="all-time"
                    className="group flex cursor-pointer items-center gap-x-3"
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-300 bg-white transition-colors group-data-[checked]:border-blue-500 group-data-[checked]:bg-blue-500">
                      <div className="h-2 w-2 rounded-full bg-white opacity-0 transition-opacity group-data-[checked]:opacity-100" />
                    </div>
                    <span className="text-sm text-gray-700 group-data-[checked]:text-gray-900">
                      {t('manage.dashboard.reportModal.allTime')}
                    </span>
                  </Radio>

                  <Radio
                    value="last-30-days"
                    className="group flex cursor-pointer items-center gap-x-3"
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-300 bg-white transition-colors group-data-[checked]:border-blue-500 group-data-[checked]:bg-blue-500">
                      <div className="h-2 w-2 rounded-full bg-white opacity-0 transition-opacity group-data-[checked]:opacity-100" />
                    </div>
                    <span className="text-sm text-gray-700 group-data-[checked]:text-gray-900">
                      {t('manage.dashboard.reportModal.last30Days')}
                    </span>
                  </Radio>

                  <Radio
                    value="custom-date"
                    className="group flex cursor-pointer items-center gap-x-3"
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-300 bg-white transition-colors group-data-[checked]:border-blue-500 group-data-[checked]:bg-blue-500">
                      <div className="h-2 w-2 rounded-full bg-white opacity-0 transition-opacity group-data-[checked]:opacity-100" />
                    </div>
                    <span className="text-sm text-gray-700 group-data-[checked]:text-gray-900">
                      {t('manage.dashboard.reportModal.customDate')}
                    </span>
                  </Radio>
                </RadioGroup>
              </div>

              {reportPeriod === 'custom-date' && (
                <div className="mb-4">
                  <Popover className="relative">
                    <PopoverButton
                      className={cn(
                        'focus:border-primary-500 focus:ring-primary-500 flex w-full items-center justify-between rounded-md border border-gray-300 px-3 py-2 text-left text-sm font-normal hover:bg-gray-50 focus:ring-1 focus:outline-none',
                        !customDateRange?.from &&
                          !customDateRange?.to &&
                          'text-gray-500',
                      )}
                    >
                      {customDateRange?.from && customDateRange?.to
                        ? `${dayjs(customDateRange.from).format('DD/MM/YYYY')} - ${dayjs(customDateRange.to).format('DD/MM/YYYY')}`
                        : t('manage.dashboard.reportModal.selectDateRange')}
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                    </PopoverButton>
                    <PopoverPanel className="absolute top-full left-0 z-10 mt-2 rounded-md border border-gray-200 bg-white shadow-md focus:outline-none">
                      <Calendar
                        mode="range"
                        selected={customDateRange}
                        captionLayout="dropdown"
                        onSelect={setCustomDateRange}
                        disabled={{ after: new Date() }}
                      />
                    </PopoverPanel>
                  </Popover>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleDownloadReport}
                  disabled={downloadReportMutation.isPending}
                  className="bg-primary-500 hover:bg-primary-600 focus:ring-primary-500 rounded-full px-6 py-3 text-sm font-medium text-white focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {downloadReportMutation.isPending
                    ? t('manage.dashboard.reportModal.downloading')
                    : t('manage.dashboard.reportModal.download')}
                </button>
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
