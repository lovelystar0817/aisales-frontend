import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';
import Overview from '../regular/Overview';
import HSBCCommunicationAndPresence from './HSBCCommunicationAndPresence';
import HSBCProcessAdherence from './HSBCProcessAdherence';
import HSBCRelationshipManagement from './HSBCRelationshipManagement';
import HSBCRepresentation from './HSBCRepresentation';

const HSBCAssessmentMain = () => {
  const { isColdCall, setSections, session } = useAssessmentContext();
  const { t } = useTranslation();

  const isPortfolioReview =
    session?.product?.friendlyId === 'hsbc-portfolio-review';

  useEffect(() => {
    const sections = [
      { id: 'overview-section', title: t('assessment.overview') },
      {
        id: 'relationship-management-section',
        title: t('assessment.relationshipManagement'),
      },
      {
        id: 'process-adherence-section',
        title: t('assessment.processAdherence'),
      },
      {
        id: 'hsbc-representation-section',
        title: t('assessment.hsbcRepresentation'),
      },
      {
        id: 'communication-and-presence-section',
        title: t('assessment.communicationAndPresence'),
      },
    ];

    setSections(sections);
  }, [setSections, t]);

  return (
    <div className="flex flex-col space-y-6">
      <div id="overview-section">
        <Overview />
      </div>

      <div id="relationship-management-section">
        <HSBCRelationshipManagement />
      </div>

      <div id="process-adherence-section">
        <HSBCProcessAdherence />
      </div>

      <div id="hsbc-representation-section">
        <HSBCRepresentation />
      </div>

      <div id="communication-and-presence-section">
        <HSBCCommunicationAndPresence />
      </div>
    </div>
  );
};

export default HSBCAssessmentMain;
