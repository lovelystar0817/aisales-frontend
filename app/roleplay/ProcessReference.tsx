import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import type { ProcessReference as ProcessReferenceData } from '~/routes/app/roleplay/types';

interface ProcessReferenceProps {
  readonly className?: string;
  readonly processReference?: ProcessReferenceData;
}

export function ProcessReference({
  className,
  processReference,
}: ProcessReferenceProps) {
  const { t } = useTranslation();

  if (!processReference) {
    return (
      <div className={className}>
        <div className="px-4 pb-4 text-sm text-gray-500">
          <p>{t('roleplay.noProcessReference')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="px-4 pb-4 text-sm text-gray-900">
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {processReference.title}
          </h3>

          <div className="space-y-6">
            {processReference.steps.map((step, stepIndex) => (
              <div key={stepIndex}>
                <h4 className="font-semibold text-gray-900 mb-2">
                  {step.title}
                </h4>
                {step.markdown ? (
                  <div className="text-gray-700 prose prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <p className="mb-2 last:mb-0">{children}</p>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-gray-900">
                            {children}
                          </strong>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc ml-6 mb-2 last:mb-0">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal ml-6 mb-2 last:mb-0">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="mb-1">{children}</li>
                        ),
                      }}
                    >
                      {step.markdown}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {step.items.map((item, itemIndex) => (
                      <div key={itemIndex}>
                        <ul className="list-disc ml-6">
                          <li>
                            <span className="text-gray-700">{item.title}</span>
                          </li>
                          {item.description && (
                            <li>
                              <span className="text-gray-600">
                                {item.description}
                              </span>
                            </li>
                          )}
                          {item.subItems &&
                            item.subItems.length > 0 && (
                              <ul className="list-disc ml-3">
                                {item.subItems.map((subItem, subIndex) => (
                                  <li key={subIndex}>
                                    <span className="text-gray-600">
                                      {subItem}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
