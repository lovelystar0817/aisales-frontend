import type { AuthorizationParams } from '@auth0/auth0-react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type State = {
  id: string;
  token: string;
  name: string;
  company: {
    _id: string;
    name: string;
    trialEndsAt: string | null;
    languages?: string[];
  };
  email: string;
  emailVerified: boolean;
  picture: string;
  auth0Data: {
    connection: AuthorizationParams['connection'];
    organization: AuthorizationParams['organization'];
  };
  guestMode: boolean;
  scorm: boolean;
  modulesWhitelist: string;
  scormPassingScore: number;
};

type Actions = {
  getToken: () => string;
  getAuth0Data: () => State['auth0Data'];
  setToken: (token: string) => void;
  setData: (data: Omit<State, 'token' | 'auth0Data' | 'modulesWhitelist' | 'scormPassingScore'>) => void;
  setModulesWhitelist: (modules: string) => void;
  setScormPassingScore: (score: number) => void;
  setAuth0Data: (auth0Data: State['auth0Data']) => void;
  clearToken: () => void;
  clearProfile: () => void;
  logout: () => void;
};

const DEFAULT_PICTURE = 'https://cdn.auth0.com/avatars/default.png';

const DEFAULT_STATE: State = {
  id: '',
  token: '',
  company: { _id: '', name: '', trialEndsAt: null },
  name: '',
  email: '',
  emailVerified: true,
  picture: DEFAULT_PICTURE,
  auth0Data: { connection: '', organization: '' },
  guestMode: false,
  scorm: false,
  modulesWhitelist: '',
  scormPassingScore: 80,
};

export const useAuthStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,
      picture: DEFAULT_PICTURE,
      getToken: () => get().token,
      getAuth0Data: () => get().auth0Data,
      setToken: (token) => set({ token }),
      setData: (data) => {
        set({ ...data, token: get().token });
      },
      setModulesWhitelist: (modules) => set({ modulesWhitelist: modules }),
      setScormPassingScore: (score) => set({ scormPassingScore: score }),
      setAuth0Data: (auth0Data) => set({ ...get(), auth0Data }),
      clearToken: () => set({ ...get(), token: '' }),
      clearProfile: () =>
        set({ ...get(), name: '', email: '', picture: DEFAULT_PICTURE }),
      logout: () => set({ ...get(), ...DEFAULT_STATE }),
    }),
    {
      name: 'auth',
    },
  ),
);
