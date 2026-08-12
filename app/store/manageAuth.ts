import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthorizationParams } from '@auth0/auth0-react';
import type { ManageUserRole } from '~/util/api';

type ManageAuthState = {
  id: string;
  token: string;
  name: string;
  company: {
    _id: string;
    name: string;
    trialEndsAt: string | null;
  };
  email: string;
  picture: string;
  auth0Data: {
    connection: AuthorizationParams['connection'];
    organization: AuthorizationParams['organization'];
  };
  role: ManageUserRole | null;
  teams: string[] | null;
};

type ManageAuthActions = {
  getToken: () => string;
  getAuth0Data: () => ManageAuthState['auth0Data'];
  setToken: (token: string) => void;
  setData: (data: Omit<ManageAuthState, 'token' | 'auth0Data'>) => void;
  setAuth0Data: (auth0Data: ManageAuthState['auth0Data']) => void;
  clearToken: () => void;
  clearProfile: () => void;
  logout: () => void;
};

const DEFAULT_PICTURE = 'https://cdn.auth0.com/avatars/default.png';

const DEFAULT_MANAGE_AUTH_STATE: ManageAuthState = {
  id: '',
  token: '',
  company: { _id: '', name: '', trialEndsAt: null },
  name: '',
  email: '',
  picture: DEFAULT_PICTURE,
  auth0Data: { connection: '', organization: '' },
  role: null,
  teams: null,
};

export const useManageAuthStore = create<ManageAuthState & ManageAuthActions>()(
  persist(
    (set, get) => ({
      ...DEFAULT_MANAGE_AUTH_STATE,
      picture: DEFAULT_PICTURE,
      getToken: () => get().token,
      getAuth0Data: () => get().auth0Data,
      setToken: (token) => set({ token }),
      setData: (data) => {
        set({ ...data, token: get().token });
      },
      setAuth0Data: (auth0Data) => set({ ...get(), auth0Data }),
      clearToken: () => set({ ...get(), token: '' }),
      clearProfile: () =>
        set({ ...get(), name: '', email: '', picture: DEFAULT_PICTURE }),
      logout: () => set({ ...get(), ...DEFAULT_MANAGE_AUTH_STATE }),
    }),
    {
      name: 'manage-auth', // Different storage key to prevent conflicts
    },
  ),
);
