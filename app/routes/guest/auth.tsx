import { Button, Field, Input, Label } from '@headlessui/react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { useAuthStore } from '~/store/auth';
import { api } from '~/util/api';

export function meta() {
  return [{ title: 'Hupo Sales AI | Guest Access' }];
}

export function clientLoader() {
  // For guest auth, we don't need to check existing tokens
  // since this page is specifically for creating guest sessions
  return null;
}

type IFormInput = { name: string };

export default function GuestAuth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { companyFriendlyId } = useParams();
  const [searchParams] = useSearchParams();
  const { setToken, setData, setModulesWhitelist, setScormPassingScore } = useAuthStore();

  const email = searchParams.get('email');
  const studentId = searchParams.get('student_id');
  const scormParam = searchParams.get('scorm');
  const isScormMode = scormParam === 'true' || scormParam === '1';
  const modulesParam = searchParams.get('modules');
  const passingScoreParam = searchParams.get('passingScore');

  console.log('[Guest Auth] URL params:', {
    email,
    scormParam,
    isScormMode,
    companyFriendlyId,
    modulesParam,
  });

  const [isCheckingUser, setIsCheckingUser] = useState(
    !!(isScormMode && email && companyFriendlyId)
  );
  const [carouselIndex, setCarouselIndex] = useState(0);
  const CAROUSEL = [
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
  ];

  const carouselItem = CAROUSEL[carouselIndex];
  const [progress, setProgress] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IFormInput>();

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

  const { mutate: createGuestUser, isPending } = useMutation({
    mutationFn: async (variables: { name: string; email?: string; lmsUserId?: string }) => {
      const { name, email: emailParam, lmsUserId } = variables;

      // Use new route if companyFriendlyId is provided
      if (companyFriendlyId) {
        const url = `/auth/guest/${companyFriendlyId}`;
        const body: { name: string; email?: string; lmsUserId?: string } = { name };
        if (emailParam) {
          body.email = emailParam;
        }
        if (lmsUserId) {
          body.lmsUserId = lmsUserId;
        }
        console.log('[Guest Auth] Sending request to backend:', { url, body });
        return api().url(url).post(body).json<{
          token: string;
          user: {
            id: string;
            name: string;
            email: string;
            picture: string;
            company: {
              _id: string;
              name: string;
              trialEndsAt: string | null;
            };
          };
        }>();
      }

      // Fallback to old route for backward compatibility
      return api().url('/auth/guest').post({ name }).json<{
        token: string;
        user: {
          id: string;
          name: string;
          email: string;
          picture: string;
          company: {
            _id: string;
            name: string;
            trialEndsAt: string | null;
          };
        };
      }>();
    },
    onSuccess: (response) => {
      console.log('/auth/guest response', response);
      // Set token first
      setToken(response.token);

      // Set user data with guest mode enabled and SCORM mode if present
      setData({
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        picture: response.user.picture,
        company: response.user.company,
        guestMode: true,
        scorm: isScormMode,
        emailVerified: true, // Guests are considered verified
      });

      // Store modules whitelist in auth store so it persists across navigations
      // Always set (even to empty) to clear stale values from previous sessions
      setModulesWhitelist(modulesParam || '');

      // Store SCORM passing score threshold
      if (passingScoreParam) {
        const score = parseInt(passingScoreParam, 10);
        if (!isNaN(score) && score >= 0 && score <= 100) {
          setScormPassingScore(score);
        }
      }

      console.log('Guest user created/found successfully. navigate to /');
      navigate('/');
    },
    onError: (error: any) => {
      console.error('Failed to create guest user:', error);
      toast.error(
        t('auth.errors.guestCreationFailed', 'Failed to create guest session'),
      );
    },
  });

  const startGuestSession: SubmitHandler<IFormInput> = async (data) => {
    console.log('[Guest Auth] Form submitted with:', {
      name: data.name,
      email,
    });
    createGuestUser({ name: data.name, email: email || undefined, lmsUserId: studentId || undefined });
  };

  // Check if user exists and auto-login for SCORM mode
  useEffect(() => {
    const checkAndAutoLogin = async () => {
      if (isScormMode && email && companyFriendlyId) {
        console.log(
          '[Guest Auth] SCORM mode with email detected, checking if user exists',
        );

        try {
          // Check if user exists
          const response = await api()
            .url(
              `/auth/guest/${companyFriendlyId}/check?email=${encodeURIComponent(email)}`,
            )
            .get()
            .json<{ exists: boolean; email: string }>();

          if (response.exists) {
            console.log('[Guest Auth] User exists, auto-logging in');
            // User exists, auto-login
            const guestName = email.split('@')[0];
            createGuestUser({ name: guestName, email, lmsUserId: studentId || undefined });
          } else {
            console.log('[Guest Auth] User does not exist, showing name form');
            // User doesn't exist, show form
            setIsCheckingUser(false);
          }
        } catch (error) {
          console.error('[Guest Auth] Error checking user existence:', error);
          // On error, show form to be safe
          setIsCheckingUser(false);
        }
      }
    };

    checkAndAutoLogin();
  }, [isScormMode, email, companyFriendlyId, createGuestUser]);

  // Show loading state while checking user exists
  if (isCheckingUser) {
    return (
      <main className="flex min-h-full w-full items-center justify-center">
        <div className="text-center">
          <img
            className="mx-auto mb-4 h-10"
            src="/logos/Hupo_Logotype_Orange(noR).svg"
            alt={t('auth.hupoLogoAlt')}
          />
          <p>{t('auth.checkingAccess', 'Checking guest access...')}</p>
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
            {t('auth.guestAccess', 'Try Hupo Sales AI')}
          </h2>

          <form
            className="space-y-6"
            onSubmit={handleSubmit(startGuestSession)}
          >
            <Field className="space-y-1">
              <Label className="text-sm/5 font-bold tracking-tight text-black">
                {t('auth.yourName', 'Your Name')}
              </Label>
              <Input
                type="text"
                placeholder={t('auth.yourNamePlaceholder', 'Enter your name')}
                className="data-[focus]:border-primary data-[focus]:ring-primary w-full rounded-full border border-[#C7C7C7] px-4 py-2 disabled:bg-[#F6F8F8] data-[focus]:ring-1"
                {...register('name', {
                  required: t('auth.nameRequired', 'Name is required'),
                  minLength: {
                    value: 2,
                    message: t(
                      'auth.nameMinLength',
                      'Name must be at least 2 characters',
                    ),
                  },
                })}
              />

              {errors.name && (
                <p className="pl-2 text-left text-sm text-red-500">
                  {errors.name.message}
                </p>
              )}
            </Field>

            <Button
              type="submit"
              disabled={isPending}
              className="bg-primary data-[active]:bg-primary-600 data-[hover]:bg-primary-600 w-full rounded-full px-4 py-2 text-white disabled:opacity-50"
            >
              {isPending
                ? t('auth.creating', 'Creating..')
                : t('auth.startDemo', 'Start Demo')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {t(
                'auth.guestNote',
                'This is a guest session. Your progress will not be saved.',
              )}
            </p>
          </div>
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

          <div className="flex w-full gap-x-[10px] px-14 md:px-40">
            {new Array(CAROUSEL.length).fill(0).map((_, index) => (
              <button
                key={index}
                className="relative h-[6px] w-full max-w-full rounded-lg bg-[#D9D9D9] transition-all duration-100 ease-linear"
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
