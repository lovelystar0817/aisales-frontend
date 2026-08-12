import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Message } from '~/types/message';
import starIcon from '~/assets/icons/star-icon.svg';
import warningIcon from '~/assets/icons/warning-triangle-red.svg';

interface RoleplayTranscriptProps {
  messages: Message[];
  onReturnToAssessment: () => void;
  personaName: string;
}

export const RoleplayTranscript: React.FC<RoleplayTranscriptProps> = ({
  messages,
  onReturnToAssessment,
  personaName,
}) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen w-full bg-[#F6F8F8]">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div
          onClick={onReturnToAssessment}
          className="flex max-w-max cursor-pointer items-center space-x-2 py-2 text-gray-500"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="#58595A"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-8-8m0 0l8-8m-8 8h20"
            />
          </svg>
          <span className="text-sm font-medium">
            {t('assessment.returnToAssessment', 'Return to assessment')}
          </span>
        </div>

        {/* Content */}
        <div className="mt-4 min-h-[calc(100vh-120px)] rounded-2xl bg-white p-6">
          <div>
            {messages?.map((message, index) => (
              <div
                key={`msg-${index}`}
                className="mb-4 border-b border-gray-100 pb-4 last:border-b-0"
              >
                <div className="mb-2">
                  <span className="text-base font-medium text-gray-900">
                    {message.role === 'user'
                      ? t('common.you', 'You')
                      : message.author || personaName}
                    :
                  </span>
                </div>
                <p className="text-base leading-relaxed whitespace-pre-wrap text-gray-500">
                  {message.content}
                </p>

                {/* Show feedback if available */}
                {message.feedback?.content && (
                  <div 
                    className="mt-4 max-w-150 rounded-xl px-4 py-3"
                    style={{
                      background:
                        message.feedback.type === 'error'
                          ? 'linear-gradient(to right, rgba(255, 228, 230), rgba(255, 228, 230, 0.35))'
                          : 'linear-gradient(to right, rgba(225, 236, 255), rgba(225, 236, 255, 0.25))',
                    }}
                  >
                    <div className="flex items-start">
                      <img
                        className="mt-1"
                        src={message.feedback.type === 'error' ? warningIcon : starIcon} 
                        alt={message.feedback.type} 
                        height={16} 
                      />
                      <div className="ml-2 text-sm tracking-tight text-[#1A1817]">
                        {message.feedback.type === 'error' || message.feedback.type === 'warning' ? (
                          <div>
                            {/* Expect content to already contain header + bullets from backend */}
                            {message.feedback.content.split('\n').map((line, idx) => (
                              <div key={idx}>{line}</div>
                            ))}
                          </div>
                        ) : (
                          <p>{message.feedback.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {!messages || messages.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-500">
                  {t(
                    'transcript.noMessages',
                    'No transcript available for this session.',
                  )}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
