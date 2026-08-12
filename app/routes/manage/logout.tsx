import { redirect } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useManageAuthStore } from '~/store/manageAuth';

export function clientLoader() {
  return redirect('/manage/auth');
}

export default function () {
  const { t } = useTranslation();
  return <>{t('logout.message')}</>;
} 