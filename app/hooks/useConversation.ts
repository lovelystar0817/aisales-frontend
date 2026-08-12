import { use11Labs } from './use11Labs';
import { useLivekit } from './useLivekit';

export type ProviderType = '11labs' | 'openai' | 'livekit';

export interface Session {
  _id: string;
  voice?: {
    prompt: {
      intro: string;
      main: string;
    };
    firstMessage: {
      intro: string;
      main: string;
    };
    language?: string;
  };
  persona?: {
    name: string;
    personality: string;
    voiceId: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface ConversationParams {
  session: Session;
  language?: string; // User's current language
  startTimeRef: React.MutableRefObject<number>;
  isIntroCompletedRef?: React.MutableRefObject<boolean>;
  setIsAISpeaking: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export type TranscriptEntry = {
  source: 'ai' | 'user';
  message: string;
  timestamp: Date;
  feedback?: { type: string; content: string };
  tempId?: string;
  isStreaming?: boolean; // For real-time AI messages that are still being transcribed
};

export interface ConversationInterface {
  connectConversation: () => Promise<void>;
  disconnectConversation: () => void;
  transcript: TranscriptEntry[];
  safelySendResponse?: (responseData: any) => boolean; // Optional for backward compatibility
  prepareForConnection?: () => Promise<void>; // Optional method to pre-initialize resources
  conversation?: string | null; // ElevenLabs conversation ID for debugging/logging
}

export function useConversation(
  provider: ProviderType,
  params: ConversationParams,
): ConversationInterface {
  // Always call both hooks to satisfy Rules of Hooks
  // (hooks must be called in the same order on every render)
  const livekitHook = useLivekit(params);
  const elevenLabsHook = use11Labs(params);

  // Return the appropriate hook based on provider
  return provider === 'livekit' ? livekitHook : elevenLabsHook;
}
