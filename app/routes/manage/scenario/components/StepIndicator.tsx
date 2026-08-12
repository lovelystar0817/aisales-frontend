import { Check } from 'lucide-react';
import { cn } from '~/util/utils';

interface StepIndicatorProps {
  currentStep: number;
  steps: Array<{
    number: number;
    label: string;
  }>;
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          {/* Step Circle */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex min-h-9 min-w-9 items-center justify-center rounded-full',
                currentStep === step.number && 'border-3 border-[#FFE1D6]',
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold',
                  currentStep === step.number
                    ? 'border-primary-500 text-primary-500 border-1'
                    : currentStep > step.number
                      ? 'bg-[#FFE1D6] text-gray-500'
                      : 'border-1 border-gray-200 text-gray-400',
                )}
              >
                {currentStep > step.number ? (
                  <Check size={18} color="#FF4B0A" />
                ) : (
                  step.number
                )}
              </div>
            </div>
            <span
              className={cn(
                'text-xs',
                currentStep === step.number
                  ? 'text-gray-900'
                  : currentStep > step.number
                    ? 'text-gray-500'
                    : 'text-gray-400',
              )}
            >
              {step.label}
            </span>
          </div>

          {/* Divider (if not last step) */}
          {index < steps.length - 1 && (
            <div className="mx-3 w-6 border-t border-gray-200" />
          )}
        </div>
      ))}
    </div>
  );
}
