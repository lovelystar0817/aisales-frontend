import { Button, Field, Input, Label } from '@headlessui/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { redirect, useNavigate, useSearchParams } from 'react-router';
import { useAuth0 } from '@auth0/auth0-react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import clsx from 'clsx';
import { WretchError } from 'wretch/resolver';
import { api } from '~/util/api';
import { useAuthStore } from '~/store/auth';

export function meta() {
  return [{ title: 'Hupo Sales AI | Login' }];
}

export function clientLoader() {
  const token = useAuthStore.getState().getToken();

  if (token.length > 0) {
    return redirect('/');
  }
}

type IFormInput = { companyName: string };

type Response = {
  _id: string;
  name: string;
  friendlyId: string;
  auth0OrgId: string;
  auth0ConnectionName: string;
};

export default function Auth() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCompanyNamePrefilled, setIsCompanyNamePrefilled] = useState(false);
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();

  const [carouselIndex, setCarouselIndex] = useState(0);
  const CAROUSEL = useMemo(
    () => [
      {
        img: '/cimg1.png',
        video:
          'https://dopmo1eihgbgm.cloudfront.net/6825bc2531940cb638124f54/sales_figure_1.mp4',
        title: t('auth.carousel.item1.title'),
        desc: t('auth.carousel.item1.desc'),
      },
      {
        img: '/cimg2.png',
        video:
          'https://dopmo1eihgbgm.cloudfront.net/6825bc3431940cb63812544e/sales_figure_2.mp4',
        title: t('auth.carousel.item2.title'),
        desc: t('auth.carousel.item2.desc'),
      },
      {
        img: '/cimg3.png',
        video:
          'https://dopmo1eihgbgm.cloudfront.net/6825bc4031940cb638125826/sales_figure_3.mp4',
        title: t('auth.carousel.item3.title'),
        desc: t('auth.carousel.item3.desc'),
      },
    ],
    [t],
  );
  const carouselItem = useMemo(
    () => CAROUSEL[carouselIndex],
    [CAROUSEL, carouselIndex],
  );
  const [progress, setProgress] = useState(0);
  const [cachedData, setCachedData] = useState<Response | null>(null);
  const { setAuth0Data } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    setError,
  } = useForm<IFormInput>();

  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % CAROUSEL.length);
    }, 6100);

    return () => clearInterval(interval);
  }, [carouselIndex]);

  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 1, 100));
    }, 50);

    return () => clearInterval(interval);
  }, [carouselIndex]);

  const { mutate: verifyCompany, mutateAsync: verifyAsync } = useMutation({
    async mutationFn(data: { name?: string; slug?: string }) {
      return api().url('/auth/company').query(data).get().json<Response>();
    },
    onSuccess(data) {
      setCachedData(data);
      if (isCompanyNamePrefilled) {
        setValue('companyName', data.name);
      }
    },
    onError(err: any) {
      setCachedData(null);
      console.log('verify error ::: err', err);
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % CAROUSEL.length);
    }, 6100);

    return () => clearInterval(interval);
  }, [carouselIndex, CAROUSEL.length]);

  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 1, 100));
    }, 50);

    return () => clearInterval(interval);
  }, [carouselIndex]);

  // Handle slug parameter only once on initial render
  useEffect(() => {
    // Only run this effect once on component mount
    const hasSlug = searchParams.has('slug');
    if (hasSlug) {
      const slug = searchParams.get('slug');
      verifyCompany({ slug: slug! });
      setIsCompanyNamePrefilled(true);

      // Remove the slug parameter from URL without triggering a re-render
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('slug');
      window.history.replaceState({}, '', newUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array means this only runs once

  const login: SubmitHandler<IFormInput> = async (data) => {
    let connection: string = cachedData?.auth0ConnectionName ?? '';
    let orgId: string = cachedData?.auth0OrgId ?? '';

    try {
      if (!isCompanyNamePrefilled && data.companyName) {
        const result = await verifyAsync({ name: data.companyName });

        setCachedData(result);
        connection = result.auth0ConnectionName;
        orgId = result.auth0OrgId;
      }

      // Get current language from i18next
      let currentLanguage = i18n.language;

      if (currentLanguage === 'fr') {
        currentLanguage = 'fr-FR';
      }

      let extraParams = {};
      if (currentLanguage) {
        extraParams = {
          ui_locales: [currentLanguage],
        };
      }

      const authParams = {
        // connection,
        // organization: orgId,
        ...extraParams,
      };

      // Store auth0Data in the store so we can access it after redirect
      setAuth0Data({ connection, organization: orgId });

      // Use loginWithRedirect instead of loginWithPopup
      await loginWithRedirect({
        authorizationParams: authParams,
        appState: { returnTo: '/' }, // Redirect to home after successful auth
      });
    } catch (error) {
      if (error instanceof WretchError && error.status === 404) {
        setError('companyName', { message: t('auth.errors.companyNotFound') });
      } else {
        setError('companyName', {
          message: t('auth.errors.unknown'),
        });
        console.log(error);
      }
    }
  };

  // Show loading state while Auth0 is processing
  if (isLoading) {
    return (
      <main className="flex min-h-full w-full items-center justify-center">
        <div className="text-center">
          <img
            className="mx-auto mb-4 h-10"
            src="/logos/Hupo_Logotype_Orange(noR).svg"
            alt={t('auth.hupoLogoAlt')}
          />
          <p>{t('auth.loading', 'Loading...')}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-full w-full flex-col gap-5 pt-8 md:flex-row-reverse md:pt-0">
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full min-w-80 px-4 md:w-auto">
          <img
            className="mx-auto mb-10 h-10"
            src="/logos/Hupo_Logotype_Orange(noR).svg"
            alt={t('auth.hupoLogoAlt')}
          />

          <h2 className="mb-8 text-center text-3xl font-bold tracking-tighter">
            {t('auth.enterCompanyName')}
          </h2>

          <form className="space-y-6" onSubmit={handleSubmit(login)}>
            <Field className="space-y-1">
              <Label className="text-sm/5 font-bold tracking-tight text-black">
                {t('auth.companyName')}
              </Label>
              <Input
                type="text"
                placeholder={t('auth.companyNamePlaceholder')}
                className="data-[focus]:border-primary data-[focus]:ring-primary w-full rounded-full border border-[#C7C7C7] px-4 py-2 disabled:bg-[#F6F8F8] data-[focus]:ring-1"
                {...register('companyName', {
                  required: true,
                  shouldUnregister: isCompanyNamePrefilled && !!cachedData,
                })}
                defaultValue={cachedData?.name}
                disabled={isCompanyNamePrefilled && !!cachedData?.friendlyId}
              />

              {errors.companyName?.message && (
                <p className="pl-2 text-left text-sm text-red-500">
                  {errors.companyName.message}
                </p>
              )}
            </Field>

            <Button
              id="auth-get-started"
              type="submit"
              className="bg-primary data-[active]:bg-primary-600 data-[hover]:bg-primary-600 w-full rounded-full px-4 py-2 text-white"
            >
              {t('auth.getStarted')}
            </Button>
          </form>
        </div>
      </div>

      <div className="bg-[#F6F8F8] md:flex-1">
        <div className="mx-4 flex flex-col items-center justify-center gap-6 py-6 text-center md:mx-20 md:min-h-screen md:gap-10 md:py-0">
          <motion.video
            className="w-full rounded-2xl"
            key={carouselIndex}
            src={carouselItem.video}
            poster={carouselItem.img}
            initial={{ opacity: 0, translateX: 10 }}
            animate={{ opacity: 1, translateX: 0 }}
            exit={{ opacity: 0, translateX: -10 }}
            transition={{ ease: 'easeOut', duration: 0.3 }}
            muted
            autoPlay
            playsInline
          />

          <div className="space-y-2 md:max-w-[530px]">
            <h2 className="text-xl/7 font-bold tracking-tight">
              {carouselItem.title}
            </h2>
            <p className="text-gray text-base/6 tracking-tight">
              {carouselItem.desc}
            </p>
          </div>

          {/* Stepper */}
          <div className="flex w-full gap-x-[10px] px-14 md:px-40">
            {new Array(CAROUSEL.length).fill(0).map((_, index) => (
              <button
                key={index}
                className={clsx(
                  'relative h-[6px] w-full max-w-full rounded-lg bg-[#D9D9D9] transition-all duration-100 ease-linear',
                )}
                onClick={() => setCarouselIndex(index)}
              >
                <div
                  className="bg-primary absolute top-0 left-0 h-full rounded-lg"
                  style={{
                    width:
                      index === carouselIndex
                        ? `${progress}%`
                        : index < carouselIndex
                          ? '100%'
                          : '0%',
                  }}
                ></div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
