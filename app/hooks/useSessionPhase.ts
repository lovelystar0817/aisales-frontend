import { useRef, useState } from 'react';
import { SessionPhase } from '~/util/constants';

export const useSessionPhase = () => {
  const sessionPhaseRef = useRef<SessionPhase>(SessionPhase.PRE_START);
  const [sessionPhase, setSessionPhase] = useState(sessionPhaseRef.current);

  const setPhase = (newPhase: SessionPhase) => {
    sessionPhaseRef.current = newPhase;
    setSessionPhase(newPhase);
  };

  return { sessionPhaseRef, sessionPhase, setPhase };
};
