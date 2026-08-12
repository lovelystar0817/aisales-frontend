import { useState } from 'react';
import { Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { apiProtected } from '~/util/api';
import toast from 'react-hot-toast';
import { usePostHog } from '~/context/posthog';

interface FeedbackResponse {
  id: string;
  content: string;
  cretedAt: string;
}

export function CallAnalysisFeedbackModal({
  analysisId,
  onClose,
  dontShowFeedbackModalOnceSent,
}: {
  analysisId: string;
  onClose: () => void;
  dontShowFeedbackModalOnceSent: () => void;
}) {
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState('');
  const posthog = usePostHog();
  const { t } = useTranslation();

  const { mutate: submitFeedback, isPending } = useMutation<
    FeedbackResponse,
    Error
  >({
    mutationFn: async () => {
      const response = await apiProtected()
        .url('/call-analysis/feedback')
        .post({
          analysisId,
          responses: [
            {
              question:
                'Was the call assessment accurate in analysing the call?',
              answer: selectedAnswer ? 'Yes' : 'No',
            },
            {
              question: 'Reason',
              answer: feedback,
            },
          ],
        })
        .json<FeedbackResponse>();
      return response;
    },
    onSuccess: () => {
      setFeedback('');
      setSelectedAnswer(null);
      posthog.capture('call_analysis_feedback_submitted', { analysisId });
    },
    onError: (error) => {
      console.error('Error submitting feedback:', error);
    },
  });

  const handleSubmit = () => {
    console.log('handle send data: ', {
      answer: selectedAnswer,
      reason: feedback,
    });
    submitFeedback();
    onClose();
    dontShowFeedbackModalOnceSent();
    toast.custom(
      (toastObj: any) => (
        <div className="rounded-lg bg-[#28323B] px-4 py-2 text-white">
          {t('feedback.thankYou')}
        </div>
      ),
      {
        duration: 1500,
      },
    );
  };

  const canSubmit = selectedAnswer !== null && feedback.trim().length > 0;

  return (
    <Transition
      show={true}
      as={Fragment}
      enter="transition ease-out duration-450"
      enterFrom="opacity-0 translate-y-8"
      enterTo="opacity-100 translate-y-0"
      leave="transition ease-in duration-200"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 translate-y-8"
    >
      <div className="fixed right-6 bottom-24 left-6 z-40 w-full max-w-[calc(100vw-48px)] sm:right-10 sm:left-auto sm:max-w-[25.5rem]">
        <div className="w-full transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-[0px_2px_12px_0px_#1A18171A] transition-all">
          <h3 className="font-circularxx mb-6 text-[18px] leading-6 font-bold tracking-[-0.01em] text-gray-900">
            Was the call assessment accurate in analysing the call?
          </h3>

            {/* Yes/No Buttons */}
            <div className="mb-4 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedAnswer(true)}
                className={`flex-1 rounded-[12px] border px-6 py-3 text-sm font-medium transition-colors ${
                  selectedAnswer === true
                    ? 'border-blue-500 bg-blue-100 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {t('feedback.yes')}
              </button>
              <button
                type="button"
                onClick={() => setSelectedAnswer(false)}
                className={`flex-1 rounded-[12px] border px-6 py-3 text-sm font-medium transition-colors ${
                  selectedAnswer === false
                    ? 'border-blue-500 bg-blue-100 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {t('feedback.no')}
              </button>
            </div>

            {/* Reason Section */}
            <div className="mb-6">
              <label className="font-small mb-3 block text-sm text-[#58595A]">
                {t('feedback.reason')}
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Please share a reason for your answer to help us improve"
                className="min-h-[8rem] w-full resize-none rounded-[12px] border border-gray-300 p-3 text-sm placeholder-[#58595A] focus:border-transparent focus:ring-2 focus:ring-[#ff4b0a] focus:outline-none"
                rows={4}
              />
            </div>

            {/* Send Button */}
            <div className="flex justify-end">
              <button
                type="button"
                className={`w-full rounded-full py-3 text-sm font-medium transition-colors ${
                  canSubmit
                    ? 'bg-[#ff4b0a] text-white hover:bg-[#ff4b0a]/90'
                    : 'cursor-not-allowed bg-gray-200 text-gray-400'
                }`}
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                {t('feedback.send')}
              </button>
          </div>
        </div>
      </div>
    </Transition>
  );
}
