import { CheckCircle2, AlertTriangle, ClockIcon, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ManulifeGoalReadySubsection, ManulifeGoalReadyStatement, ManulifeGoalReadyToImproveItem } from '~/assessment/types';
import { getScoreColor } from '~/util/manulife-goalready';

interface ManulifeGoalReadySectionProps {
  title: string;
  score?: number;
  maxScore?: number;
  subsections?: ManulifeGoalReadySubsection[];
  isGenerating?: boolean;
}

function SectionHeader({
  title,
  score,
  maxScore,
}: {
  title: string;
  score: number;
  maxScore: number;
}) {
  const percentage = (score / maxScore) * 100;
  const barColor = getScoreColor(score, maxScore);

  return (
    <div className="flex items-center justify-between">
      <h3 className="text-[16px] font-bold leading-[24px] tracking-[-0.16px] text-[#161618]">
        {title}
      </h3>
      <div className="flex items-center gap-[8px]">
        <span className="text-[16px] tracking-[-0.16px]">
          <span className="font-bold leading-[24px] text-[#161618]">{score} </span>
          <span className="font-normal leading-[24px] text-[#58595A]">/ {maxScore}</span>
        </span>
        <div className="flex w-[100px] items-center gap-[4px]">
          <div className="h-[8px] flex-1 rounded-[999px] bg-[#D9DDE0]" />
          <div
            className="absolute h-[8px] rounded-[999px]"
            style={{
              backgroundColor: barColor,
              width: `${Math.min((percentage / 100) * 100, 100)}px`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function SubsectionWithWhySuggestion({
  subsection,
}: {
  subsection: ManulifeGoalReadySubsection;
}) {
  return (
    <div className="flex flex-col gap-[16px] justify-center border border-[#D9DDE0] rounded-[12px] p-[16px]">
      {/* Header */}
      <div className="flex items-start gap-[8px]">
        <div className="flex flex-1 items-center">
          <span className="text-[14px] font-bold leading-[20px] tracking-[-0.084px] text-[#161618]">
            {subsection.title}
          </span>
        </div>
        <span className="text-[14px] tracking-[-0.084px]">
          <span className="font-bold leading-[20px] text-[#161618]">{subsection.score} </span>
          <span className="font-normal leading-[20px] text-[#7e7f81]">/ {subsection.maxScore}</span>
        </span>
      </div>

      {/* Separator */}
      <div className="h-px w-full bg-[#D9DDE0]" />

      {/* Content */}
      <ul className="flex flex-col gap-0 pl-5 text-[14px] tracking-[-0.084px]">
        {subsection.why && (
          <li className="mb-0 list-disc pl-1">
            <span className="font-bold leading-[20px] text-[#58595A]">Why: </span>
            <span className="font-normal leading-[20px] text-[#58595A]">{subsection.why}</span>
          </li>
        )}
        {subsection.suggestion && (
          <li className="list-disc pl-1">
            <span className="font-bold leading-[20px] text-[#58595A]">Suggestion: </span>
            <span className="font-normal leading-[20px] text-[#58595A]">{subsection.suggestion}</span>
          </li>
        )}
      </ul>
    </div>
  );
}

function SubsectionWithStrengthsImprovements({
  subsection,
}: {
  subsection: ManulifeGoalReadySubsection;
}) {
  // Check if we're using the new statements format
  const hasStatementsFormat = subsection.statements && subsection.statements.length > 0;

  // Process statements into strengths and improvements
  const { strengths, improvements } = hasStatementsFormat
    ? (() => {
        const correctStatements = subsection.statements!.filter(s => s.category === 'CORRECT');
        const warningStatements = subsection.statements!.filter(s => s.category === 'WARNING');
        const incorrectStatements = subsection.statements!.filter(s => s.category === 'INCORRECT');

        return {
          strengths: correctStatements,
          improvements: [...warningStatements, ...incorrectStatements],
        };
      })()
    : {
        strengths: subsection.strengths || [],
        improvements: subsection.toImprove || [],
      };

  return (
    <div className="flex flex-col gap-[16px] border border-[#D9DDE0] rounded-[8px] p-[16px]">
      {/* Header */}
      <div className="flex items-center gap-[16px]">
        <div className="flex flex-1 flex-row items-center self-stretch">
          <span className="text-[14px] font-bold leading-[20px] tracking-[-0.084px] text-[#161618]">
            {subsection.title}
          </span>
        </div>
        <span className="text-center text-[14px] tracking-[-0.084px]">
          <span className="font-bold leading-[20px] text-[#161618]">{subsection.score} </span>
          <span className="font-normal leading-[20px] text-[#7e7f81]">/ {subsection.maxScore}</span>
        </span>
      </div>

      {/* Separator */}
      <div className="h-px w-full bg-[#D9DDE0]" />

      {/* Content */}
      <div className="flex flex-col gap-[16px]">
        {/* Strengths Section */}
        {hasStatementsFormat ? (
          strengths.length > 0 && (
            <div className="flex flex-col gap-[8px]">
              <h4 className="text-[14px] font-bold leading-[20px] tracking-[-0.084px] text-[#161618]">
                Strengths
              </h4>
              {(strengths as ManulifeGoalReadyStatement[]).map((statement, idx) => (
                <div key={idx} className="flex items-start gap-[8px]">
                  <CheckCircle2 className="mt-[2px] size-[16px] shrink-0 text-[#38A383]" />
                  <p className="flex-1 text-[14px] font-normal leading-[20px] tracking-[-0.084px] text-[#58595A]">
                    {statement.text}
                  </p>
                </div>
              ))}
            </div>
          )
        ) : (
          subsection.strengths && subsection.strengths.length > 0 && (
            <div className="flex flex-col gap-[8px]">
              <h4 className="text-[14px] font-bold leading-[20px] tracking-[-0.084px] text-[#161618]">
                Strengths
              </h4>
              {subsection.strengths.map((strength, idx) => (
                <div key={idx} className="flex items-start gap-[8px]">
                  <CheckCircle2 className="mt-[2px] size-[16px] shrink-0 text-[#38A383]" />
                  <p className="flex-1 text-[14px] font-normal leading-[20px] tracking-[-0.084px] text-[#58595A]">
                    {strength}
                  </p>
                </div>
              ))}
            </div>
          )
        )}

        {/* To Improve Section */}
        {hasStatementsFormat ? (
          improvements.length > 0 && (
            <div className="flex flex-col gap-[8px]">
              <h4 className="text-[14px] font-bold leading-[20px] tracking-[-0.084px] text-[#161618]">
                To improve
              </h4>
              {(improvements as ManulifeGoalReadyStatement[]).map((statement, idx) => {
                const isWarning = statement.category === 'WARNING';
                const isIncorrect = statement.category === 'INCORRECT';

                return (
                  <div key={idx} className="flex items-start gap-[8px]">
                    {isWarning && (
                      <AlertTriangle className="mt-[2px] size-[16px] shrink-0 text-[#E56B00]" />
                    )}
                    {isIncorrect && (
                      <XCircle className="mt-[2px] size-[16px] shrink-0 text-[#E60D00]" />
                    )}
                    <div className="flex flex-1 flex-col gap-[2px]">
                      <p className="text-[14px] font-normal leading-[20px] tracking-[-0.084px] text-[#58595A]">
                        {statement.text}
                      </p>
                      {isIncorrect && statement.correction && (
                        <div className="flex items-start gap-[8px]">
                          <div className="w-[2px] shrink-0 self-stretch bg-[#C7CBCE]" />
                          <p className="flex-1 text-[14px] font-normal leading-[20px] tracking-[-0.084px] text-[#58595A]">
                            Say: '{statement.correction}'
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          subsection.toImprove && subsection.toImprove.length > 0 && (
            <div className="flex flex-col gap-[8px]">
              <h4 className="text-[14px] font-bold leading-[20px] tracking-[-0.084px] text-[#161618]">
                To improve
              </h4>
              {subsection.toImprove.map((improvement: ManulifeGoalReadyToImproveItem, idx) => {
                const isWarning = improvement.status === 'warning';
                const isError = improvement.status === 'error';

                return (
                  <div key={idx} className="flex items-start gap-[8px]">
                    {isWarning && (
                      <AlertTriangle className="mt-[2px] size-[16px] shrink-0 text-[#E56B00]" />
                    )}
                    {isError && (
                      <XCircle className="mt-[2px] size-[16px] shrink-0 text-[#E60D00]" />
                    )}
                    <div className="flex flex-1 flex-col gap-[2px]">
                      <p className="text-[14px] font-normal leading-[20px] tracking-[-0.084px] text-[#58595A]">
                        {improvement.text}
                      </p>
                      {isError && improvement.correction && (
                        <div className="flex items-start gap-[8px]">
                          <div className="w-[2px] shrink-0 self-stretch bg-[#C7CBCE]" />
                          <p className="flex-1 text-[14px] font-normal leading-[20px] tracking-[-0.084px] text-[#58595A]">
                            Say: '{improvement.correction}'
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export function ManulifeGoalReadySection({
  title,
  score,
  maxScore,
  subsections,
  isGenerating = false,
}: ManulifeGoalReadySectionProps) {
  const { t } = useTranslation();

  if (isGenerating) {
    return (
      <div className="flex flex-col gap-[24px] rounded-[12px] bg-white p-[16px]">
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-bold leading-[24px] tracking-[-0.16px] text-[#161618]">
            {title}
          </h3>
          <div className="flex items-center gap-[8px]">
            <ClockIcon className="size-4 animate-spin text-blue-500" />
            <span className="text-sm text-blue-600">
              {t('assessment.generating', 'Generating')}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[24px] rounded-[12px] bg-white p-[16px]">
      <SectionHeader title={title} score={score ?? 0} maxScore={maxScore ?? 0} />

      <div className="flex flex-col gap-[16px]">
        {subsections?.map((subsection, idx) => {
          // Check if this subsection uses strengths/toImprove format (Product pitch)
          const hasStrengthsFormat =
            (subsection.strengths && subsection.strengths.length > 0) ||
            (subsection.toImprove && subsection.toImprove.length > 0) ||
            (subsection.statements && subsection.statements.length > 0);

          if (hasStrengthsFormat) {
            return (
              <SubsectionWithStrengthsImprovements key={idx} subsection={subsection} />
            );
          }

          // Default to why/suggestion format
          return <SubsectionWithWhySuggestion key={idx} subsection={subsection} />;
        })}
      </div>
    </div>
  );
}
