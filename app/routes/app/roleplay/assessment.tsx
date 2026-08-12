import { useParams } from 'react-router';
import BaseAssessment from '~/assessment/BaseAssessment';
import { apiProtected } from '~/util/api';
import {
  withAuthenticationRequiredOptions,
  withGuestAwareAuth,
} from '~/util/auth0';

export function meta() {
  return [{ title: 'Hupo Sales AI | Assessment' }];
}

export default withGuestAwareAuth(function AssessmentRoute() {
  const { sessionId } = useParams();
  return (
    <BaseAssessment
      sessionId={sessionId}
      apiClient={apiProtected}
      sessionQueryKey="session"
      collectionQueryKey="sessions"
      isAdminView={false}
      showFeedbackButton={true}
      homeLink="/"
    />
  );
}, withAuthenticationRequiredOptions);
