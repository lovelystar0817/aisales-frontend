import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Circle } from './Circle';
import { getScoreRating } from '~/util/scoreRating';

interface ScormCompletionDialogProps {
  isOpen: boolean;
  passed: boolean;
  score: number;
  threshold: number;
  onClose: () => void;
  onPracticeAgain: () => void;
}

export const ScormCompletionDialog: React.FC<ScormCompletionDialogProps> = ({
  isOpen,
  passed,
  score,
  threshold,
  onClose,
  onPracticeAgain,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const { color } = getScoreRating(score);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">
            {passed ? (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {passed
              ? t('scorm.dialog.passed.title', 'Congratulations!')
              : t('scorm.dialog.failed.title', 'Keep Practicing!')}
          </h2>
          <p className="mt-2 text-gray-600">
            {passed
              ? t(
                  'scorm.dialog.passed.subtitle',
                  'You successfully completed the lesson',
                )
              : t(
                  'scorm.dialog.failed.subtitle',
                  'Try another practice to pass',
                )}
          </p>
        </div>

        {/* Score Display */}
        <div className="mb-6">
          <div className="flex justify-center">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="relative">
                  <Circle
                    size={100}
                    value={score}
                    color={passed ? '#10B981' : '#F59E0B'}
                    bgColor={passed ? '#DCFCE7' : '#FEF3C7'}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {score}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {passed
                  ? t('scorm.dialog.passed.scoreLabel', 'Passed!')
                  : t(
                      'scorm.dialog.failed.scoreLabel',
                      'Need {{threshold}} to pass',
                      { threshold },
                    )}
              </p>
            </div>
          </div>
        </div>

        {/* Status Message */}
        <div
          className={`mb-6 rounded-lg p-4 ${
            passed
              ? 'border border-green-200 bg-green-50'
              : 'border border-red-200 bg-red-50'
          }`}
        >
          <div className="flex items-center">
            <div
              className={`mr-3 h-2 w-2 rounded-full ${
                passed ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <p
              className={`text-sm font-medium ${
                passed ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {passed
                ? t(
                    'scorm.dialog.passed.message',
                    'You scored {{score}} when passing score required is {{threshold}}',
                    {
                      score,
                      threshold,
                    },
                  )
                : t(
                    'scorm.dialog.failed.message',
                    'You scored {{score}} when passing score required is {{threshold}}',
                    {
                      score,
                      threshold,
                    },
                  )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {!passed && (
            <button
              onClick={onPracticeAgain}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700"
            >
              {t('scorm.dialog.practiceAgain', 'Practice Again')}
            </button>
          )}
          <button
            onClick={onClose}
            className={`${
              passed ? 'flex-1' : 'flex-1'
            } rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50`}
          >
            {passed
              ? t('scorm.dialog.continue', 'Continue')
              : t('scorm.dialog.close', 'Close')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
