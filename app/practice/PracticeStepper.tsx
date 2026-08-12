import { Fragment } from 'react';
import clsx from 'clsx';
import { CheckIcon } from '@heroicons/react/24/outline';

interface PracticeStepperProps {
  currentStep: number;
  className?: string;
  steps: string[];
}

export default function PracticeStepper({
  currentStep,
  className,
  steps,
}: PracticeStepperProps) {
  return (
    <div
      className={clsx('mt-2 mb-2 flex items-center justify-start', className)}
    >
      {steps.map((label, idx) => (
        <Fragment key={label}>
          <div className="flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center">
              {/* Outer ring */}
              {currentStep === idx + 1 && (
                <span className="absolute inset-0 z-0 scale-[1.2] rounded-full bg-[#FFE1D6] opacity-80" />
              )}
              {/* Main circle */}
              <span
                className={clsx(
                  'relative z-10 flex size-9 items-center justify-center rounded-full border-1',
                  currentStep === idx + 1
                    ? 'border-[#E66B00] bg-white'
                    : idx + 1 < currentStep
                      ? 'border-none bg-[#FFE1D6]'
                      : 'border-gray-200 bg-white',
                )}
              >
                <span
                  className={clsx(
                    'text-sm/relaxed font-bold',
                    currentStep === idx + 1
                      ? 'text-[#E66B00]'
                      : 'text-gray-400',
                  )}
                >
                  {idx + 1 < currentStep ? (
                    <CheckIcon className="text-primary size-5" />
                  ) : (
                    idx + 1
                  )}
                </span>
              </span>
            </div>
            <span
              className={clsx(
                'mt-2 text-sm/relaxed font-medium',
                currentStep === idx + 1 ? 'text-gray-700' : 'text-gray-400',
              )}
            >
              {label}
            </span>
          </div>
          {/* Divider except after last step */}
          {idx < steps.length - 1 && (
            <div
              className="mb-7 h-px w-full flex-1 bg-gray-200"
              style={{ minWidth: 120 }}
            />
          )}
        </Fragment>
      ))}
    </div>
  );
}
