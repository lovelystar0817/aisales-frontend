import chatBubbleIcon from '~/assets/icons/chat-bubble.svg';
import micIcon from '~/assets/icons/mic.svg';
import infoIcon from '~/assets/icons/info.svg';

export const AUTH0 = {
  DOMAIN: import.meta.env.VITE_AUTH0_DOMAIN,
  CLIENT_ID: import.meta.env.VITE_AUTH0_CLIENT_ID,
  AUDIENCE: import.meta.env.VITE_AUTH0_AUDIENCE,
} as const;

export const ICONS: Record<string, string> = {
  'chat-bubble': chatBubbleIcon,
  mic: micIcon,
  info: infoIcon,
};

// no-op function to bypass required function parameters
export const noop = () => void 0;

// Session phases
export enum SessionPhase {
  PRE_START = 'pre_start',
  CONNECTING = 'connecting',
  INTRO = 'intro',
  MAIN_CONVERSATION = 'main_conversation',
  ENDING = 'ending',
  DONE = 'done',
}

// Hupo-specific voice configuration
export const HUPO_11LABS_VOICE_ID = 'tpFVjZdYBvOaWaUIRHRz';
export const HUPO_11LABS_VOICE_NAME = 'victoria';

export const DEFAULT_PROVIDER = '11labs';

export const ELEVEN_LABS_AGENT_ID = 'agent_0601k2c0bcp1f2zbs4t739xpmt5g'; // bek@hupo.co (NEW ACCOUNT)
export const ELEVEN_LABS_KT_AXA_AGENT_ID = 'agent_9001khj3agrnfqgb4vyq68j8fn0e';
export const ELEVEN_LABS_AIA_KO_AGENT_ID = 'agent_6501khtzk88jfajsa7zrfpc9c532';
export const ELEVEN_LABS_AIA_KO_AGENT_ID_2 =
  'agent_1401kkc782yafvdtrbwpcmhq3055';
export const ELEVEN_LABS_LALAMOVE_AGENT_ID =
  'agent_9001khj3agrnfqgb4vyq68j8fn0e';
export const ELEVEN_LABS_GREAT_EASTERN_AGENT_ID = 'agent_9101kk1c71dtfn89dz6q5exrtf46';
export const ELEVEN_LABS_DEFAULT_CONNECTION_TYPE = 'webrtc';

// Voice mapping between providers to maintain consistency
export const VOICE_ID_MAPPING = {
  // Map OpenAI voices to 11labs equivalents for consistent voice experience
  shimmer: {
    '11labs': 'Rachel',
    openai: 'shimmer',
  },
  alloy: {
    '11labs': 'Adam',
    openai: 'alloy',
  },
  echo: {
    '11labs': 'Daniel',
    openai: 'echo',
  },
  fable: {
    '11labs': 'Sarah',
    openai: 'fable',
  },
  onyx: {
    '11labs': 'Josh',
    openai: 'onyx',
  },
  lilian: {
    '11labs': '6qpxBH5KUSDb40bij36w',
    openai: 'shimmer',
  },
  ginny: {
    '11labs': HUPO_11LABS_VOICE_ID,
    openai: 'shimmer',
  },
};

// language mapping to 11labs voice id
export const LANGUAGE_VOICE_ID_MAPPING = {
  en: HUPO_11LABS_VOICE_ID,
  fr: 'F1toM6PcP54s45kOOAyV',
  id: 'gmnazjXOFoOcWA59sd5m',
  ms: 'UcqZLa941Kkt8ZhEEybf',
  fil: 'uB4mdw2feSGsIhOhlVRR',
  vi: '2vT8WlUXV1qBtgiLZdSb',
  ko: 'fNmw8sukfGuvWVOp33Ge',
};

export const DEFAULT_LANGUAGE = 'en';

// Company IDs
export const MANULIFE_COMPANY_ID = '68accc7c35a46d74e550b719';
export const MSIG_COMPANY_ID = '68892d47e0b9992c9a75be7a';
export const BBL_COMPANY_ID = '68d63151e85c606be27c0fbd';
export const HSBC_COMPANY_ID = '68ece648b5a5c123e9b74671';
export const HSBC_YUE_COMPANY_ID = '696762234a0d0d66f4216da7'; // HSBC Cantonese
export const MTL_COMPANY_ID = '6909dcb88c9a6cc5820effc8';
