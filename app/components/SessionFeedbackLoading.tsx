import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
} from 'motion/react';
import { useTranslation } from 'react-i18next';
import { LoadingSpinner } from '~/components/LoadingSpinner';

export function SessionFeedbackLoading() {
  const { t } = useTranslation();

  const LOADING_TEXTS = [
    t('loading.analyzingPerformance'),
    t('loading.generatingFeedback'),
    t('loading.creatingSummary'),
    t('loading.almostDone'),
  ];

  const [loadingText, setLoadingText] = useState(LOADING_TEXTS[0]);
  const count = useMotionValue(0);
  useMotionValueEvent(count, 'change', (value) => {
    setLoadingText(LOADING_TEXTS[Math.round(value)]);
  });

  useEffect(() => {
    const controls = animate(count, LOADING_TEXTS.length - 1, {
      duration: 10,
      ease: 'linear',
      repeat: Infinity,
    });

    return () => controls.stop();
  }, []);

  return createPortal(
    <div className="fixed inset-0 top-0 right-0 bottom-0 left-0 z-[9999] flex flex-col items-center justify-center gap-5 overflow-hidden bg-white/90">
      <LoadingSpinner className="size-7" />

      <div className="space-y-1 text-center">
        <h2 className="text-xl/7 font-bold tracking-tight">
          {t('loading.generatingFeedback')}
        </h2>
        <motion.p
          key={loadingText}
          className="text-base/6 tracking-tight text-black/60"
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 5 }}
        >
          {loadingText}...
        </motion.p>
      </div>
    </div>,
    document.body,
  );
}
