import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';
import Overview from '../regular/Overview';
import ScorecardSections from './ScorecardSections';

const ScorecardAssessmentMain = () => {
  const {
    isColdCall,
    setSections,
    scorecardsData: scorecardSections,
  } = useAssessmentContext();
  const { t } = useTranslation();

  useEffect(() => {
    const sections = [
      { id: 'overview-section', title: t('assessment.overview') },
      ...(scorecardSections?.map((scorecard: any, index: number) => ({
        id: 'scorecard-section-' + index,
        title: scorecard.name,
      })) ?? []),
    ];

    setSections(sections);
  }, [isColdCall, setSections, scorecardSections, t]);

  return (
    <div className="flex flex-col">
      <div id="overview-section" className="mb-6">
        <Overview />
      </div>

      {scorecardSections?.length > 0 && (
        <ScorecardSections sections={scorecardSections} />
      )}
    </div>
  );
};

export default ScorecardAssessmentMain;
