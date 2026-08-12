import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Popover,
  PopoverButton,
  PopoverPanel,
  TransitionChild,
} from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet } from 'react-router';
import logoutIcon from '~/assets/icons/logout.svg';
import { useLogout } from '~/hooks/useLogout';
import { useAuthStore } from '~/store/auth';
import LanguageSelector from '../components/LanguageSelector';
import { TrialStatus } from '../components/TrialStatus';
import { BackendIndicator } from '../components/BackendIndicator';
import { apiProtected } from '~/util/api';
import { ReportIssueButton } from '~/components/ReportIssueButton';
import { MSIG_COMPANY_ID } from '~/util/constants';
import { useQuery } from '@tanstack/react-query';
import type { CallAnalysisStatus } from '~/routes/call-analysis/types';

const getNavigation = (guestMode: boolean, companyId: string) => [
  { id: 'home', href: '/', i18nKey: 'home.home' },
  ...(!guestMode
    ? [
        {
          id: 'past-practices',
          href: '/practices/past',
          i18nKey: 'home.pastPractices',
        },
        ...(companyId === MSIG_COMPANY_ID
          ? [
              {
                id: 'call-analysis',
                href: '/call-analysis',
                i18nKey: 'home.callAnalysis',
              },
            ]
          : []),
      ]
    : []),
];

export default function SidebarLayout() {
  const logout = useLogout();
  const { name, company, picture, guestMode } = useAuthStore();

  const { t } = useTranslation();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = getNavigation(guestMode, company._id);

  // Fetch new call analyses count
  const { data: newAnalysesCount = 0 } = useQuery({
    queryKey: ['newCallAnalysesCount'],
    queryFn: async () => {
      if (guestMode || company._id !== MSIG_COMPANY_ID) {
        return 0;
      }
      try {
        const response = await apiProtected()
          .url('/call-analysis')
          .query({ limit: 100, offset: 0 })
          .get()
          .json<{ analyses: { id: string }[]; total: number }>();

        // Load full details for each analysis to check 'new' field
        const results = await Promise.allSettled(
          response.analyses.map((item) =>
            apiProtected()
              .url(`/call-analysis/${item.id}/status`)
              .get()
              .json<CallAnalysisStatus>(),
          ),
        );

        // Filter out failed requests and only keep successful ones
        const fullAnalyses = results
          .filter((result): result is PromiseFulfilledResult<CallAnalysisStatus> =>
            result.status === 'fulfilled'
          )
          .map((result) => result.value);

        // Count analyses with new: true
        return fullAnalyses.filter((analysis) => analysis.new).length;
      } catch (error) {
        console.error('Failed to fetch new analyses count:', error);
        return 0;
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: !guestMode && company._id === MSIG_COMPANY_ID,
  });

  // Calculate trial expiration date if it exists
  const trialExpiration = useMemo(() => {
    if (!company?.trialEndsAt) return null;
    return new Date(company?.trialEndsAt);
  }, [company?.trialEndsAt]);

  return (
    <>
      <div className="flex h-full flex-col">
        {/* Static sidebar for desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          {/* Sidebar component, swap this element with another sidebar if you like */}
          <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-gray-50 px-6">
            <Link to="/">
              <div className="flex h-16 shrink-0 items-center">
                <img
                  alt="Hupo"
                  src="/logos/Hupo_Logotype_Orange(noR).svg"
                  className="h-8 w-auto"
                />
                <BackendIndicator />
              </div>
            </Link>
            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="-mx-2 space-y-1">
                    {navigation.map((item) => (
                      <li key={item.id}>
                        <NavLink
                          to={item.href}
                          className={({ isActive }) =>
                            clsx(
                              isActive ? 'bg-[#D9DDE0]' : 'hover:bg-[#D9DDE0]',
                              'group flex gap-x-3 rounded-md p-3 text-sm/5 text-gray-900',
                            )
                          }
                        >
                          <span className="flex items-center gap-2">
                            {t(item.i18nKey)}
                            {item.id === 'call-analysis' && newAnalysesCount > 0 && (
                              <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
                                {newAnalysesCount} new
                              </span>
                            )}
                          </span>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </li>
                <li className="-mx-4 mt-auto mb-2">
                  <Popover>
                    {trialExpiration && <TrialStatus />}
                    <PopoverButton className="data-[focus]:ring-primary flex w-full items-center gap-3 gap-x-4 rounded-xl p-3 text-sm/6 font-semibold text-[#272B32] hover:bg-gray-200 focus:outline-none data-[focus]:ring-1">
                      <img
                        className="size-9 rounded-full bg-gray-50"
                        alt={name || '{NO_NAME}'}
                        src={picture}
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex flex-col items-start">
                        <span className="sr-only">
                          {t('mobile.yourProfile')}
                        </span>
                        <span aria-hidden="true">{name || '{NO_NAME}'}</span>
                        {!guestMode && (
                          <span
                            aria-hidden="true"
                            className="text-gray leading-5 font-normal"
                          >
                            {company.name || '{NO_COMPANY}'}
                          </span>
                        )}
                      </div>
                    </PopoverButton>
                    <PopoverPanel
                      transition
                      anchor={{ to: 'bottom start', gap: '8px' }}
                      className="z-50 w-[var(--button-width)] rounded-lg border border-[#E1E0DF] bg-white p-2 transition duration-200 ease-in-out data-[closed]:-translate-y-1 data-[closed]:opacity-0"
                    >
                      <div className="mb-2 px-2">
                        <LanguageSelector className="w-full" />
                      </div>
                      <div className="mb-2">
                        <ReportIssueButton 
                          mobilePopoverAnchor={{ to: 'bottom start', gap: '8px' }}
                          desktopPopoverAnchor={{ to: 'right end', gap: '8px' }}
                          onSubmit={(issueData) => apiProtected().url('/issues').post(issueData).json()}
                        />
                      </div>
                      <button
                        className="w-full rounded-lg p-2 text-left text-base/6 tracking-tight hover:bg-gray-100"
                        onClick={logout}
                      >
                        <img
                          className="mr-2 inline-block h-5 w-5"
                          src={logoutIcon}
                          alt="Logout icon"
                        />
                        {t('auth.logout')}
                      </button>
                    </PopoverPanel>
                  </Popover>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-xs sm:px-6 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
          >
            <span className="sr-only">{t('mobile.openSidebar')}</span>
            <Bars3Icon aria-hidden="true" className="size-6" />
          </button>
          <div className="flex-1 text-sm/6 font-semibold text-gray-900">
            {t('home.dashboard')}
          </div>
          <Popover>
            <PopoverButton className="flex items-center focus:outline-none">
              <span className="sr-only">{t('mobile.yourProfile')}</span>
              <img
                className="size-8 rounded-full bg-gray-50"
                alt={name || '{NO_NAME}'}
                src={picture}
                referrerPolicy="no-referrer"
              />
            </PopoverButton>
            <PopoverPanel
              transition
              anchor={{ to: 'bottom end', gap: '8px' }}
              className="z-50 w-48 rounded-lg border border-[#E1E0DF] bg-white p-2 transition duration-200 ease-in-out data-[closed]:-translate-y-1 data-[closed]:opacity-0"
            >
              <div className="mb-2 px-2 py-1">
                <div className="font-semibold">{name || '{NO_NAME}'}</div>
                {!guestMode && (
                  <div className="text-sm text-gray-600">
                    {company.name || '{NO_COMPANY}'}
                  </div>
                )}
              </div>
              <div className="mb-2 px-2">
                <LanguageSelector className="w-full" />
              </div>
              <div className="mb-2">
                <ReportIssueButton 
                  mobilePopoverAnchor={{ to: 'bottom start', gap: '8px' }}
                  desktopPopoverAnchor={{ to: 'right end', gap: '8px' }}
                  onSubmit={(issueData) => apiProtected().url('/issues').post(issueData).json()}
                />
              </div>
              <button
                className="w-full rounded-lg p-2 text-left text-base/6 tracking-tight hover:bg-gray-100"
                onClick={logout}
              >
                <img
                  className="mr-2 inline-block h-5 w-5"
                  src={logoutIcon}
                  alt="Logout icon"
                />
                {t('auth.logout')}
              </button>
            </PopoverPanel>
          </Popover>
        </div>

        <main className="flex-1 py-6 lg:py-10 lg:pl-72">
          <Outlet />
        </main>
      </div>

      <Dialog
        open={sidebarOpen}
        onClose={setSidebarOpen}
        className="relative z-50 lg:hidden"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
        />

        <div className="fixed inset-0 flex">
          <DialogPanel
            transition
            className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
          >
            <TransitionChild>
              <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="-m-2.5 p-2.5"
                >
                  <span className="sr-only">{t('mobile.closeSidebar')}</span>
                  <XMarkIcon aria-hidden="true" className="size-6 text-white" />
                </button>
              </div>
            </TransitionChild>
            {/* Sidebar component, swap this element with another sidebar if you like */}
            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-50 px-6 pb-2">
              <div className="flex h-16 shrink-0 items-center">
                <img
                  alt="Hupo"
                  src="/logos/Hupo_Logotype_Orange(noR).svg"
                  className="h-8 w-auto"
                />
                <BackendIndicator />
              </div>
              <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation.map((item) => (
                        <li key={item.id}>
                          <NavLink
                            to={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                              clsx(
                                isActive
                                  ? 'bg-[#D9DDE0]'
                                  : 'hover:bg-[#D9DDE0]',
                                'group flex gap-x-3 rounded-md p-3 text-sm/5 text-gray-900',
                              )
                            }
                          >
                            <span className="flex items-center gap-2">
                              {t(item.i18nKey)}
                              {item.id === 'call-analysis' && newAnalysesCount > 0 && (
                                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
                                  {newAnalysesCount} new
                                </span>
                              )}
                            </span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </li>
                </ul>
              </nav>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}