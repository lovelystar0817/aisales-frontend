import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';
import PrudentialPHAppointmentSettingClientVerification from './PrudentialPHAppointmentSettingClientVerification';
import PrudentialPHAppointmentSettingObjectionHandling from './PrudentialPHAppointmentSettingObjectionHandling';
import PrudentialPHAppointmentSettingOverview from './PrudentialPHAppointmentSettingOverview';

const PrudentialPHAppointmentSettingAssessmentMain = () => {
  const { setSections } = useAssessmentContext();
  const { t } = useTranslation();

  useEffect(() => {
    const sections = [
      { id: 'overview-section', title: t('assessment.overview') },
      {
        id: 'client-verification-section',
        title: t('assessment.clientVerification'),
      },
      // {
      //   id: 'value-proposition-section',
      //   title: t('assessment.valueProposition'),
      // },
      {
        id: 'objection-handling-section',
        title: t('assessment.objectionHandling'),
      },
    ];

    setSections(sections);
  }, [setSections, t]);

  return (
    <div className="flex flex-col space-y-6">
      <div id="overview-section">
        <PrudentialPHAppointmentSettingOverview />
      </div>

      <div id="client-verification-section">
        <PrudentialPHAppointmentSettingClientVerification />
      </div>

      {/* <div id="value-proposition-section">
        <PrudentialPHAppointmentSettingValueProposition />
      </div> */}

      <div id="objection-handling-section">
        <PrudentialPHAppointmentSettingObjectionHandling />
      </div>
    </div>
  );
};

export default PrudentialPHAppointmentSettingAssessmentMain;
