import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { Conversation } from '@elevenlabs/client';
import {
  ELEVEN_LABS_AGENT_ID,
  ELEVEN_LABS_DEFAULT_CONNECTION_TYPE,
  HUPO_11LABS_VOICE_ID,
} from '~/util/constants';

/**
 * ElevenLabs Health Check Component
 *
 * This page provides a diagnostic tool to test the health and performance of the ElevenLabs
 * voice AI service. It performs an automated ping/pong test by:
 * 1. Starting a conversation session with the configured agent
 * 2. Sending a "ping" message and waiting for a "pong" response
 * 3. Measuring the round-trip latency
 * 4. Reporting success/failure status with performance metrics
 *
 * The results are displayed in the UI and also stored globally in window.__elevenHealth
 * for programmatic access by monitoring systems.
 */

interface HealthStatus {
  ok: boolean;
  latencyMs?: number;
  error?: string | Error;
}

declare global {
  interface Window {
    __elevenHealth?: HealthStatus;
  }
}

const WELCOME_MESSAGE = "hey, what's up?";
const PING_MESSAGE = 'ping';
const PONG_MESSAGE = 'pong';
const TIMEOUT_MS = 10_000;
const AUDIO_LATENCY_MS = 1000;

export function meta() {
  return [
    { title: 'ElevenLabs Health Check | Hupo Sales AI' },
    { name: 'description', content: 'ElevenLabs service health monitoring' },
  ];
}

export default function HealthCheck() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<HealthStatus | null>(null);
  const [searchParams] = useSearchParams();

  const runHealthCheck = async () => {
    setIsRunning(true);
    setResult(null);
    window.__elevenHealth = undefined;

    const t0 = performance.now();
    try {
      const isTextOnly = searchParams.get('textOnly') === 'true';

      const sessionOptions: Parameters<typeof Conversation.startSession>[0] = {
        agentId: ELEVEN_LABS_AGENT_ID,
        connectionType: ELEVEN_LABS_DEFAULT_CONNECTION_TYPE,
        overrides: {
          tts: { voiceId: HUPO_11LABS_VOICE_ID },
          agent: {
            firstMessage: WELCOME_MESSAGE,
            prompt: {
              prompt: `When the user says "${PING_MESSAGE}", respond with "${PONG_MESSAGE}"`,
            },
          },
        },
        onMessage: (m) => {
          if (m.message?.toLowerCase().includes(WELCOME_MESSAGE)) {
            convo.sendUserMessage(PING_MESSAGE);
          } else if (m.message?.toLowerCase().includes(PONG_MESSAGE)) {
            const audioLatency = isTextOnly ? 0 : AUDIO_LATENCY_MS;
            setTimeout(() => {
              const dirtyLatency = performance.now() - t0;
              const cleanLatency = dirtyLatency - audioLatency;
              const healthStatus = { ok: true, latencyMs: cleanLatency };

              window.__elevenHealth = healthStatus;
              setResult(healthStatus);
              setIsRunning(false);
              convo.endSession();
            }, audioLatency);
          }
        },
        onError: (e) => {
          const healthStatus = { ok: false, error: e };
          window.__elevenHealth = healthStatus;
          setResult(healthStatus);
          setIsRunning(false);
        },
      };

      if (isTextOnly) {
        sessionOptions.overrides ??= {};
        // @ts-ignore
        sessionOptions.overrides.conversation = { textOnly: true };
      }

      const convo = await Conversation.startSession(sessionOptions);

      // safety net
      setTimeout(() => {
        if (isRunning) {
          const healthStatus = { ok: false, error: 'timeout' };
          window.__elevenHealth ||= healthStatus;
          setResult(healthStatus);
          setIsRunning(false);
        }
      }, TIMEOUT_MS);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      const healthStatus = { ok: false, error: errorMessage };
      window.__elevenHealth = healthStatus;
      setResult(healthStatus);
      setIsRunning(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-8 text-center text-2xl font-bold text-gray-900">
          ElevenLabs Health Check
        </h1>

        <button
          onClick={runHealthCheck}
          disabled={isRunning}
          className={`w-full rounded-lg px-4 py-3 font-medium text-white transition-colors ${
            isRunning
              ? 'cursor-not-allowed bg-gray-400'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
          }`}
        >
          {isRunning ? 'Running Health Check...' : 'Run Health Check'}
        </button>

        {result && (
          <div
            className={`mt-6 rounded-lg border p-4 ${
              result.ok
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {result.ok ? (
              <div className="text-center">
                <div className="mb-2 flex items-center justify-center">
                  <span className="mr-2 text-2xl">✅</span>
                  <strong>Health Check Passed</strong>
                </div>
                <div className="text-sm">
                  Latency: {result.latencyMs?.toFixed(0)}ms
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="mb-2 flex items-center justify-center">
                  <span className="mr-2 text-2xl">❌</span>
                  <strong>Health Check Failed</strong>
                </div>
                <div className="text-sm break-words">
                  Error: {String(result.error)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
