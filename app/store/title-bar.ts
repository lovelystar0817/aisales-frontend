import { create } from 'zustand';

type State = {
  title: string;
  mobileTitle: string;
  callType: string;
  product: string;
  backUrl: string;
  action: string | React.ReactNode;
  actionCallback: () => void;
  showBackButton: boolean;
};

type Actions = {
  setTitle: (title: State['title']) => void;
  setMobileTitle: (mobileTitle: State['mobileTitle']) => void;
  setCallType: (status: State['callType']) => void;
  setProduct: (status: State['product']) => void;
  setAction: (action: State['action'], actionCallback?: () => void) => void;
  setShowBackButton: (
    showBackButton: State['showBackButton'],
    backUrl?: State['backUrl'],
  ) => void;
  reset: () => void;
};

const DEFAULT_STATE: State = {
  mobileTitle: '',
  title: '',
  callType: '',
  product: '',
  action: '',
  backUrl: '',
  actionCallback: () => {},
  showBackButton: false,
};

export const useTitleBarStore = create<State & Actions>()((set, get) => ({
  ...DEFAULT_STATE,
  setTitle: (title) => set({ title }),
  setMobileTitle: (mobileTitle) => set({ mobileTitle }),
  setCallType: (callType) => set({ callType }),
  setProduct: (product) => set({ product }),
  setAction: (action, actionCallback) => set({ action, actionCallback }),
  setShowBackButton: (showBackButton, backUrl) =>
    set({ showBackButton, backUrl: backUrl || '..' }),
  reset: () => set(DEFAULT_STATE),
}));
