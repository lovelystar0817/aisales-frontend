import clsx from 'clsx';
import { useCallback, useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import starIcon from '~/assets/icons/star-icon.svg';
import warningIcon from '~/assets/icons/warning-triangle-red.svg';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { RedWarningIcon } from '../../public/icons/icons';
import type { TranscriptEntry } from '~/hooks/useConversation';

export type MessageFeedback = {
  type: 'praise' | 'suggestion' | 'insight';
  content: string;
};

export type TranscriptProps = {
  endOfMessagesRef: any;
  messages: TranscriptEntry[];
  isAIResponding: boolean;
  characterName?: string | null;
  className?: string;
};

// Typewriter component for AI messages
const TypewriterText = ({ 
  text, 
  characterName,
  shouldAnimate = true 
}: { 
  text: string; 
  characterName?: string | null;
  shouldAnimate?: boolean;
}) => {
  const [revealedChars, setRevealedChars] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const CHAR_DELAY_MS = 30;

  useEffect(() => {
    if (!shouldAnimate) {
      setRevealedChars(text.length);
      setIsComplete(true);
      return;
    }

    setRevealedChars(0);
    setIsComplete(false);

    let charIndex = 0;
    const revealNextChar = () => {
      if (charIndex <= text.length) {
        setRevealedChars(charIndex);
        charIndex++;
        
        if (charIndex <= text.length) {
          animationRef.current = setTimeout(revealNextChar, CHAR_DELAY_MS);
        } else {
          setIsComplete(true);
        }
      }
    };

    // Start animation after a small delay
    animationRef.current = setTimeout(revealNextChar, 100);

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [text, shouldAnimate]);

  const revealedText = text.slice(0, revealedChars);

  return (
    <div className="relative">
      <p className="leading-6 tracking-tight text-[#1A1817]">
        <span className="font-medium">{characterName}:</span>{' '}
        <span className="relative inline-block">
          {/* Revealed text */}
          <span>{revealedText}</span>
          
          {/* Glowing cursor at reveal point */}
          {shouldAnimate && !isComplete && (
            <span 
              className="absolute inline-block w-[2px] h-[1.2em] animate-pulse"
              style={{
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,0.6), rgba(255,255,255,0.9))',
                boxShadow: '0 0 8px rgba(255,255,255,0.8), 0 0 4px rgba(255,255,255,0.6)',
                filter: 'blur(0.5px)',
                transform: 'translateY(-0.1em)',
                left: '0px', // Position at the end of revealed text
              }}
            />
          )}
        </span>
      </p>
    </div>
  );
};

const Message = ({
  message,
  characterName,
  isLatestAIMessage = false,
}: {
  message: TranscriptEntry;
  characterName?: string | null;
  isLatestAIMessage?: boolean;
}) => {
  const isAssistant = useCallback(
    (message: TranscriptEntry) => message.source === 'ai',
    [],
  );

  return (
    <div
      className={clsx(
        'mb-4 flex flex-col',
        isAssistant(message) ? 'items-start' : 'items-end',
        !isAssistant(message) ? 'user-message' : 'assistant-message',
      )}
    >
      <div className="w-full max-w-[85%]">
        {!isAssistant(message) && (
          <div className="flex justify-end">
            <div
              className={clsx(
                'relative z-10 rounded-s-3xl rounded-br-3xl bg-[#E4E9EC] px-4 py-3',
                message.feedback?.content && 'w-full',
              )}
            >
              <p className="leading-6 tracking-tight text-[#1A1817]">
                {message.message}
              </p>
            </div>
          </div>
        )}

        {isAssistant(message) && (
          <div className="rounded-3xl bg-white px-4 py-3 max-w-max">
            <TypewriterText
              text={message.message}
              characterName={characterName}
              shouldAnimate={isLatestAIMessage && !message.isStreaming}
            />
          </div>
        )}
        {/* Feedback section */}
        {message.feedback?.content && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex items-start ml-${isAssistant(message) ? '0' : '24'} mr-${
              isAssistant(message) ? '64' : '0'
            } z-0 mt-[-20px] rounded-b-3xl px-4 py-3 pt-7`}
            style={{
              background:
                message.feedback.type === 'error'
                  ? 'linear-gradient(to right, rgba(255, 228, 230), rgba(255, 228, 230, 0.35))'
                  : 'linear-gradient(to right, rgba(225, 236, 255), rgba(225, 236, 255, 0.25))',
              marginRight: isAssistant(message) ? '64px' : '0',
            }}
          >
            <img
              src={
                message.feedback.type === 'error'
                  ? warningIcon
                  : starIcon
              }
              alt={message.feedback.type}
              height={16}
            />
            <div className="ml-2 text-sm leading-5 tracking-tight text-[#58595A]" style={{ lineHeight: '20px', letterSpacing: '-0.6%' }}>
              {message.feedback.type === 'error' || message.feedback.type === 'warning' ? (
                <div>
                  {/* Expect content to already contain header + bullets from backend */}
                  {message.feedback.content.split('\n').map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
              ) : (
                <p>{message.feedback.content}</p>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export function Transcript({
  messages,
  endOfMessagesRef,
  isAIResponding,
  characterName,
  className,
}: TranscriptProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const internalScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages change or AI is responding
  useEffect(() => {
    const scrollToBottom = () => {
      if (internalScrollRef.current) {
        internalScrollRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
        });
      }
    };

    // Small delay to ensure DOM has updated
    const timeoutId = setTimeout(scrollToBottom, 50);

    return () => clearTimeout(timeoutId);
  }, [messages, isAIResponding]);

  // Also forward the ref for external usage
  useEffect(() => {
    if (endOfMessagesRef && typeof endOfMessagesRef === 'object') {
      endOfMessagesRef.current = internalScrollRef.current;
    }
  }, [endOfMessagesRef]);

  // Find the latest AI message index
  const latestAIMessageIndex = messages.reduce((latestIndex, message, index) => {
    return message.source === 'ai' ? index : latestIndex;
  }, -1);

  return (
    <div
      ref={messagesContainerRef}
      className={clsx(
        'h-full overflow-x-hidden overflow-y-auto bg-[#F6F8F8]',
        'px-6 py-4',
        'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent',
        className,
        messages?.length < 3 && 'pt-16',
      )}
    >
      <div className="mx-auto min-h-full w-full max-w-4xl space-y-2">
        {messages.map((message, index) => (
          <Message
            key={`msg-${message.tempId || index}`}
            message={message}
            characterName={characterName}
            isLatestAIMessage={index === latestAIMessageIndex}
          />
        ))}

        {/* AI thinking indicator */}
        {isAIResponding && messages.length > 0 && (
          <div className="mb-4 flex justify-start">
            <div className="flex items-center gap-2 rounded-tr-3xl rounded-br-3xl rounded-bl-3xl bg-[#F8F9FA] px-4 py-2">
              <LoadingSpinner className="size-4" />
              <span className="text-sm text-gray-600">
                {characterName} is typing...
              </span>
            </div>
          </div>
        )}

        {/* Add flexible spacing to push content up and maintain background */}
        <div className="min-h-8 flex-1" />

        {/* Internal scroll anchor - this is inside the scrollable container */}
        <div ref={internalScrollRef} className="h-1 w-full" />
      </div>
    </div>
  );
}
