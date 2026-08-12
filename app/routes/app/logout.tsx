import type { Route } from './+types/slug';
import { redirect } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '~/store/auth';

export function clientLoader() {
  const { guestMode } = useAuthStore.getState();

  // Reset the auth store
  useAuthStore.setState(useAuthStore.getInitialState());

  return redirect(guestMode ? '/guest/auth' : '/auth');
}

export default function () {
  const { t } = useTranslation();
  return <>{t('logout.message')}</>;
}
