import { useTranslation } from 'react-i18next';
import { redirect } from 'react-router';
import { useAuthStore } from '~/store/auth';

export function clientLoader() {
  // Reset the auth store
  useAuthStore.setState(useAuthStore.getInitialState());

  return redirect('/guest/auth');
}

export default function () {
  const { t } = useTranslation();
  return <>{t('logout.message')}</>;
}
