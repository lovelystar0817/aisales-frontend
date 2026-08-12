import {
  CloseButton,
  Dialog as HeadlessDialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '~/components/button';
import xIcon from '~/assets/icons/x.svg';
import type { Session } from '~/routes/app/roleplay/types';

interface TranscriptMessage {
  role: 'ai' | 'user';
  content: string;
}

interface TranscriptImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (transcript: { role: string; content: string; sent: string }[]) => void;
  session: Session | null | undefined;
  isLoading?: boolean;
}

function validateTranscript(
  data: unknown,
): { valid: true; messages: TranscriptMessage[] } | { valid: false; error: string } {
  if (!Array.isArray(data)) {
    return { valid: false, error: 'Transcript must be a JSON array' };
  }

  if (data.length < 2) {
    return { valid: false, error: 'Transcript must have at least 2 messages' };
  }

  for (let i = 0; i < data.length; i++) {
    const msg = data[i];
    if (typeof msg !== 'object' || msg === null) {
      return { valid: false, error: `Message at index ${i} must be an object` };
    }

    if (!('role' in msg) || !('content' in msg)) {
      return {
        valid: false,
        error: `Message at index ${i} must have "role" and "content" fields`,
      };
    }

    if (msg.role !== 'ai' && msg.role !== 'user') {
      return {
        valid: false,
        error: `Message at index ${i} has invalid role "${msg.role}". Must be "ai" or "user"`,
      };
    }

    if (typeof msg.content !== 'string' || msg.content.trim() === '') {
      return {
        valid: false,
        error: `Message at index ${i} must have non-empty content`,
      };
    }
  }

  const hasAi = data.some((msg) => msg.role === 'ai');
  const hasUser = data.some((msg) => msg.role === 'user');

  if (!hasAi || !hasUser) {
    return {
      valid: false,
      error: 'Transcript must contain at least one AI message and one user message',
    };
  }

  return { valid: true, messages: data as TranscriptMessage[] };
}

function generatePrompt(session: Session | null | undefined): string {
  if (!session) {
    return 'No session data available';
  }

  const persona = session.persona;
  const product = session.product;
  const module = session.module;
  const scenario = session.scenario;

  let prompt = `Generate a realistic sales roleplay transcript between a salesperson (user) and a prospect (ai).

## Scenario Details
`;

  if (module?.title) {
    prompt += `- Call Type: ${module.title}\n`;
  }

  if (scenario?.scenarioDetails?.salesGoal) {
    prompt += `- Sales Goal: ${scenario.scenarioDetails.salesGoal}\n`;
  }

  if (scenario?.scenarioDetails?.mainObjection || persona?.details?.mainObjection) {
    prompt += `- Main Objection: ${scenario?.scenarioDetails?.mainObjection || persona?.details?.mainObjection}\n`;
  }

  prompt += `
## Prospect (AI) Character
- Name: ${persona?.name || 'Unknown'}
- Age: ${persona?.age || 'Unknown'}
- Occupation: ${persona?.occupation || 'Unknown'}
- Personality: ${persona?.personality || 'Unknown'}
- Difficulty: ${persona?.difficulty || 'medium'}
`;

  if (persona?.description) {
    prompt += `- Background: ${persona.description}\n`;
  }

  if (persona?.details) {
    const details = persona.details;
    if (details.financialSituation) {
      prompt += `- Financial Situation: ${details.financialSituation}\n`;
    }
    if (details.keyPriorities?.length) {
      prompt += `- Key Priorities: ${details.keyPriorities.join(', ')}\n`;
    }
    if (details.productKnowledge) {
      prompt += `- Product Knowledge: ${details.productKnowledge}\n`;
    }
  }

  if (persona?.personalityDetails) {
    const pd = persona.personalityDetails;
    if (pd.communicationStyle?.length) {
      prompt += `- Communication Style: ${pd.communicationStyle.join(', ')}\n`;
    }
    if (pd.decisionMaking?.length) {
      prompt += `- Decision Making: ${pd.decisionMaking.join(', ')}\n`;
    }
  }

  if (product && product.name) {
    prompt += `
## Product Being Sold
- Name: ${product.name}
`;
    if (product.keyFeatures?.length) {
      prompt += `- Key Features:\n`;
      product.keyFeatures.forEach((feature) => {
        if (typeof feature === 'string') {
          prompt += `  - ${feature}\n`;
        } else if (feature.title) {
          prompt += `  - ${feature.title}\n`;
        }
      });
    }
  }

  prompt += `
## Output Format
Generate a JSON array of messages. Each message must have:
- "role": either "ai" (prospect) or "user" (salesperson)
- "content": the message text

The conversation should:
1. Start with the AI (prospect) greeting or responding to an initial contact
2. Include realistic back-and-forth dialogue
3. Include the prospect raising their main objection
4. Show the salesperson attempting to handle objections
5. Have 10-20 messages total
6. Feel natural and conversational

Example format:
\`\`\`json
[
  { "role": "ai", "content": "Hello, who is this?" },
  { "role": "user", "content": "Hi! This is [Name] from [Company]. I'm reaching out because..." },
  { "role": "ai", "content": "Oh, I see. What is this about?" }
]
\`\`\`

Generate the transcript now:`;

  return prompt;
}

export function TranscriptImportModal({
  isOpen,
  onClose,
  onImport,
  session,
  isLoading = false,
}: TranscriptImportModalProps) {
  const [transcriptText, setTranscriptText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCopyPrompt = async () => {
    const prompt = generatePrompt(session);
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success('Prompt copied to clipboard');
    } catch {
      toast.error('Failed to copy prompt');
    }
  };

  const handleImport = () => {
    setError(null);

    if (!transcriptText.trim()) {
      setError('Please paste a transcript');
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(transcriptText);
    } catch {
      setError('Invalid JSON format. Please check your transcript.');
      return;
    }

    const validation = validateTranscript(parsed);
    if (validation.valid === false) {
      setError(validation.error);
      return;
    }

    const now = new Date();
    const formattedTranscript = validation.messages.map((msg, index) => ({
      role: msg.role,
      content: msg.content,
      sent: new Date(now.getTime() + index * 5000).toISOString(),
    }));

    onImport(formattedTranscript);
  };

  const handleClose = () => {
    setTranscriptText('');
    setError(null);
    onClose();
  };

  return (
    <HeadlessDialog
      open={isOpen}
      as="div"
      className="relative z-[999] focus:outline-none"
      onClose={handleClose}
    >
      <DialogBackdrop className="fixed inset-0 bg-black/30" />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            transition
            className="w-full max-w-2xl rounded-xl bg-white backdrop-blur-2xl duration-300 ease-out data-[closed]:transform-[scale(95%)] data-[closed]:opacity-0"
          >
            <div className="flex justify-between gap-4 border-b border-gray-200 p-4">
              <DialogTitle
                as="h3"
                className="flex-1 text-xl/7 font-bold tracking-tight text-black"
              >
                Import Transcript
              </DialogTitle>

              <CloseButton>
                <img src={xIcon} alt="Close" />
              </CloseButton>
            </div>

            <div className="p-4">
              <p className="mb-4 text-sm text-gray-600">
                Paste a JSON transcript to test the assessment flow. Use the "Copy Prompt"
                button to generate a sample transcript using an AI assistant.
              </p>

              <div className="mb-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyPrompt}
                  className="mb-2"
                >
                  Copy Prompt for AI
                </Button>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="transcript"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Transcript JSON
                </label>
                <textarea
                  id="transcript"
                  value={transcriptText}
                  onChange={(e) => {
                    setTranscriptText(e.target.value);
                    setError(null);
                  }}
                  placeholder={`[
  { "role": "ai", "content": "Hello, how can I help you today?" },
  { "role": "user", "content": "Hi! I'm calling about your insurance products." }
]`}
                  className="h-64 w-full rounded-lg border border-gray-300 p-3 font-mono text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              {error && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleImport} disabled={isLoading}>
                  {isLoading ? 'Importing...' : 'Import & Generate Assessment'}
                </Button>
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </HeadlessDialog>
  );
}
