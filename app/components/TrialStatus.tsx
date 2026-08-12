import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '../util/utils';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '~/store/auth';
import { apiProtected } from '~/util/api';
import { useEffect, useMemo } from 'react';

export function TrialStatus() {
  const { t } = useTranslation();
  const { company: storedCompany } = useAuthStore.getState();

  const { data: freshCompanyData, refetch } = useQuery({
    queryKey: ['company'],
    initialData: storedCompany,
    queryFn: async () => {
      try {
        const response = await apiProtected()
          .url('/auth/company')
          .query({ name: storedCompany.name })
          .get()
          .json<typeof storedCompany>();

        return response;
      } catch (error) {
        console.error('Failed to fetch company data:', error);
        return storedCompany;
      }
    },
  });

  useEffect(() => {
    refetch();
  });

  const daysLeft = useMemo(() => {
    if (!freshCompanyData?.trialEndsAt) return 0;
    const trialDate = new Date(freshCompanyData.trialEndsAt);
    const diffTime = trialDate.getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [freshCompanyData]);

  const isExpired = useMemo(() => {
    if (!freshCompanyData?.trialEndsAt) return true;
    return new Date() > new Date(freshCompanyData.trialEndsAt);
  }, [freshCompanyData]);

  return (
    <div
      className={cn(
        'max-w-md rounded-2xl border border-[#D7DBDE] p-4',
        isExpired ? 'bg-[#fff4eb]' : 'bg-white',
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          {isExpired ? (
            <AlertTriangle className="h-4 w-4 text-[#e56b00]" />
          ) : (
            <Clock className="h-4 w-4 text-[#e56b00]" />
          )}
          <h2 className="text-[15px] font-bold text-[#1a1817]">
            {isExpired
              ? t('trialStatus.ended')
              : t('trialStatus.daysLeft', '{{days}} days left in the trial', {
                  days: daysLeft,
                })}
          </h2>
        </div>
        <p className="text-[15px] text-[#707173]">
          {isExpired
            ? t(
                'trialStatus.upgradeEnded',
                'To access coaching sessions, please contact us to upgrade.',
              )
            : t(
                'trialStatus.exploreFeatures',
                'Explore all features before your trial ends.',
              )}
        </p>
        <a
          href="mailto:justin@hupo.co?subject=Hupo AI Trial Upgrade&body=Hi Justin,%0D%0A%0D%0AI would like to learn more about upgrading our Hupo AI account."
          className="mt-1 text-[15px] text-[#1c7aeb] hover:underline"
        >
          {t('trialStatus.contactToUpgrade')}
        </a>
      </div>
    </div>
  );
}
