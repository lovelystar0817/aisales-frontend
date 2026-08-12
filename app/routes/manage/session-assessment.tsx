import { withAuthenticationRequired } from '@auth0/auth0-react';
import { withManageAuthenticationRequiredOptions } from '~/util/auth0';
import BaseAssessment from '~/assessment/BaseAssessment';
import { apiManage } from '~/util/api';
import { useParams } from 'react-router';

export function meta() {
  return [{ title: 'Hupo Sales AI | Session Assessment' }];
}

export default withAuthenticationRequired(function ManageSessionAssessmentRoute() {
  const { sessionId } = useParams();
  return (
    <BaseAssessment
      sessionId={sessionId}
      apiClient={apiManage}
      sessionQueryKey="manage-session"
      collectionQueryKey="manage-sessions"
      isAdminView={true}
      showFeedbackButton={false}
      homeLink="/manage"
    />
  );
}, withManageAuthenticationRequiredOptions); 
