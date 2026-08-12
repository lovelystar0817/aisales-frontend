import { Outlet, NavLink } from 'react-router';
import { useState } from 'react';
import clsx from 'clsx';
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Popover,
  PopoverButton,
  PopoverPanel,
} from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import logoutIcon from '~/assets/icons/logout.svg';
import { useAdminLogout } from '~/hooks/useAdminLogout';
import { useManageAuthStore } from '~/store/manageAuth';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';
import { UserRound } from 'lucide-react';
import { UserInfoModal } from '~/routes/manage/settings/components/UserInfoModal';
import { useQuery } from '@tanstack/react-query';
import { manageUsersApi } from '~/util/api';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { ReportIssueButton } from '~/components/ReportIssueButton';
import { MSIG_COMPANY_ID } from '~/util/constants';

export default function ManageSidebarLayout() {
  const userName = useManageAuthStore((state) => state.name);
  const userRole = useManageAuthStore((state) => state.role);
  const userEmail = useManageAuthStore((state) => state.email);
  const userTeams = useManageAuthStore((state) => state.teams);
  const companyId = useManageAuthStore((state) => state.company?._id);
  const companyName = useManageAuthStore(
    (state) => state.company?.name ?? 'Admin',
  );
  const logout = useAdminLogout();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openProfileModal, setOpenProfileModal] = useState(false);
  const { t } = useTranslation();

  const { data: filterTeams } = useQuery({
    queryKey: ['settings-filter-teams'],
    queryFn: () => manageUsersApi.getFilterTeams(),
  });

  const adminSettingsEnabled = useFeatureFlagEnabled('admin-settings');
  const selfserveEnabled = useFeatureFlagEnabled('self-serve');

  const navigation = [
    {
      name: 'Dashboard',
      href: '/manage/dashboard',
      key: 'manage.menuDashboard',
    },
    { name: 'Users', href: '/manage/users', key: 'manage.menuUsers' },
    ...(companyId === MSIG_COMPANY_ID
      ? [{ name: 'Call Analysis', href: '/manage/call-analysis', key: 'manage.menuCallAnalysis' }]
      : []),

    ...(selfserveEnabled && userRole === 'superadmin'
      ? [
          {
            name: 'Roleplay',
            href: '/manage/scenario',
            key: 'manage.menuRoleplay',
          },
        ]
      : []),
    ...(selfserveEnabled && userRole === 'superadmin'
      ? [
          {
            name: 'Persona',
            href: '/manage/persona',
            key: 'manage.menuPersona',
          },
        ]
      : []),
    ...(selfserveEnabled && userRole === 'superadmin'
      ? [
          {
            name: 'Product',
            href: '/manage/products',
            key: 'manage.menuProduct',
          },
        ]
      : []),
    ...(selfserveEnabled && userRole === 'superadmin'
      ? [
          {
            name: 'Scorecard',
            href: '/manage/scorecard',
            key: 'manage.menuScorecard',
          },
        ]
      : []),
    ...(adminSettingsEnabled && (userRole === 'superadmin' || userRole === 'admin')
      ? [
          {
            name: 'Settings',
            href: '/manage/settings',
            key: 'manage.menuSettings',
          },
        ]
      : []),
  ];

  return (
    <>
      <div className="flex h-full flex-col">
        {/* Static sidebar for desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-gray-50 px-6">
            <div className="flex h-16 shrink-0 items-center">
              <div className="flex items-center space-x-2">
                <img
                  alt="Hupo"
                  src="/logos/Hupo_Logotype_Orange(noR).svg"
                  className="h-8 w-auto"
                />
                <span className="text-sm font-medium text-gray-500">
                  {t('manage.admin')}
                </span>
              </div>
            </div>

            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="-mx-2 space-y-1">
                    {navigation.map((item) => (
                      <li key={item.name}>
                        <div
                          className={clsx(
                            (item.name === 'Roleplay' ||
                              item.name === 'Settings') &&
                              'mt-2 border-t border-gray-200 pt-2',
                          )}
                        >
                          <NavLink
                            to={item.href}
                            className={({ isActive }) =>
                              clsx(
                                isActive
                                  ? 'bg-[#D9DDE0]'
                                  : 'hover:bg-[#D9DDE0]',
                                'group flex gap-x-3 rounded-md p-3 text-sm/5 text-gray-900',
                              )
                            }
                          >
                            {t(item.key)}
                          </NavLink>
                        </div>
                      </li>
                    ))}
                  </ul>
                </li>
                <li className="-mx-4 mt-auto mb-2">
                  <Popover>
                    <PopoverButton className="data-[focus]:ring-primary flex w-full items-center gap-3 gap-x-4 rounded-xl p-3 text-sm/6 font-semibold text-[#272B32] hover:bg-gray-200 focus:outline-none data-[focus]:ring-1">
                      <div className="flex size-9 items-center justify-center rounded-full bg-orange-500 text-sm font-medium text-white">
                        {userName?.charAt(0) || 'A'}
                      </div>
                      <div className="flex flex-col items-start">
                        <span aria-hidden="true">{userName}</span>
                        <span
                          aria-hidden="true"
                          className="text-gray leading-5 font-normal"
                        >
                          {companyName}
                        </span>
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
                      {adminSettingsEnabled && (
                        <div>
                          <button
                            className="w-full cursor-pointer rounded-lg p-2 text-left text-base/6 tracking-tight hover:bg-gray-100"
                            onClick={() => setOpenProfileModal(true)}
                          >
                            <UserRound
                              className="mr-2 mb-1 inline-block h-5 w-5"
                              style={{ color: '#58595A' }}
                            />
                            {t('auth.profile', 'Profile')}
                          </button>
                          <div className="my-1 border-b border-gray-200" />
                        </div>
                      )}
                      <ReportIssueButton
                        mobilePopoverAnchor={{ to: 'bottom start', gap: '8px' }}
                        desktopPopoverAnchor={{ to: 'right end', gap: '8px' }}
                        onSubmit={(issueData) =>
                          manageUsersApi.reportIssue(issueData)
                        }
                      />
                      <button
                        className="w-full cursor-pointer rounded-lg p-2 text-left text-base/6 tracking-tight hover:bg-gray-100"
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

        {/* Mobile header */}
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
            {t('manage.adminDashboard')}
          </div>
          <Popover>
            <PopoverButton className="flex items-center focus:outline-none">
              <span className="sr-only">{t('mobile.yourProfile')}</span>
              <div className="flex size-8 items-center justify-center rounded-full bg-orange-500 text-sm font-medium text-white">
                {userName?.charAt(0) || 'A'}
              </div>
            </PopoverButton>
            <PopoverPanel
              transition
              anchor={{ to: 'bottom end', gap: '8px' }}
              className="z-50 w-48 rounded-lg border border-[#E1E0DF] bg-white p-2 transition duration-200 ease-in-out data-[closed]:-translate-y-1 data-[closed]:opacity-0"
            >
              <div className="mb-2 px-2 py-1">
                <div className="font-semibold">{userName}</div>
                <div className="text-sm text-gray-600">{companyName}</div>
              </div>
              <div className="mb-2 px-2">
                <LanguageSelector className="w-full" />
              </div>
              {adminSettingsEnabled && (
                <div>
                  <button
                    className="w-full cursor-pointer rounded-lg p-2 text-left text-base/6 tracking-tight hover:bg-gray-100"
                    onClick={() => setOpenProfileModal(true)}
                  >
                    <UserRound
                      className="mr-2 mb-1 inline-block h-5 w-5"
                      style={{ color: '#58595A' }}
                    />
                    {t('auth.profile', 'Profile')}
                  </button>
                  <div className="my-1 border-b border-gray-200" />
                </div>
              )}
              <ReportIssueButton
                mobilePopoverAnchor={{ to: 'bottom start', gap: '8px' }}
                desktopPopoverAnchor={{ to: 'right end', gap: '8px' }}
                onSubmit={(issueData) => manageUsersApi.reportIssue(issueData)}
              />
              <button
                className="w-full cursor-pointer rounded-lg p-2 text-left text-base/6 tracking-tight hover:bg-gray-100"
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

        <main className="flex-1 lg:pl-72">
          <Outlet />
        </main>
      </div>
      {/* Mobile sidebar */}
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

            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-50 px-6 pb-2">
              <div className="flex h-16 shrink-0 items-center">
                <div className="flex items-center space-x-2">
                  <img
                    alt="Hupo"
                    src="/logos/Hupo_Logotype_Orange(noR).svg"
                    className="h-8 w-auto"
                  />
                  <span className="text-sm font-medium text-gray-500">
                    {t('manage.admin')}
                  </span>
                </div>
              </div>
              <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation.map((item) => (
                        <li key={item.name}>
                          <NavLink
                            to={item.href}
                            className={({ isActive }) =>
                              clsx(
                                isActive
                                  ? 'bg-[#D9DDE0]'
                                  : 'hover:bg-[#D9DDE0]',
                                'group flex gap-x-3 rounded-md p-3 text-sm/5 text-gray-900',
                              )
                            }
                          >
                            {t(item.key)}
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
      <UserInfoModal
        isOpen={openProfileModal}
        onClose={() => setOpenProfileModal(false)}
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        userTeams={userTeams}
        teams={filterTeams?.teams}
      />
    </>
  );
}
