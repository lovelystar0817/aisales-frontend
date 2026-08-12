import { useEffect, useRef, useState } from 'react';
import {
  Dialog as HeadlessDialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  CloseButton,
} from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import xIcon from '~/assets/icons/x.svg';
import { cn } from '~/util/utils';

interface PrudentialObjectionHandlingScorecardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ScorecardSection {
  id: string;
  title: string;
  content: {
    title: string;
    description?: string;
    items: string[];
  }[];
}

const scorecardSections: ScorecardSection[] = [
  {
    id: 'sales-technique',
    title: 'Sales Technique (3F Model)',
    content: [
      {
        title: 'Feel',
        description:
          "Acknowledge the customer's concern with genuine empathy and understanding",
        items: [
          "Actively listen and acknowledge the customer's emotions and concerns",
          "Use empathetic language that shows understanding of their perspective",
          "Validate their feelings without being dismissive",
          "Demonstrate genuine care for their situation and challenges",
        ],
      },
      {
        title: 'Felt',
        description:
          'Share a relatable story of someone who had the same concern',
        items: [
          'Share relevant stories or examples of others in similar situations',
          "Use examples that are credible and relatable to the customer's circumstances",
          "Build trust by showing you've helped others with comparable challenges",
          "Use appropriate social proof to normalize the customer's concerns",
        ],
      },
      {
        title: 'Found',
        description: 'Connect the story to demonstrate value and resolution',
        items: [
          'Present clear solutions that directly address the concerns identified',
          'Explain the positive outcomes and benefits others achieved',
          'Build confidence in your proposed approach with specific results',
          "Make the solution feel achievable and relevant to their situation",
        ],
      },
    ],
  },
  {
    id: 'objection-handling',
    title: 'Objection Handling (LAPR Framework)',
    content: [
      {
        title: 'Listen',
        description:
          'Give your full attention and let the customer express their concern completely',
        items: [
          'Allow the customer to finish speaking before responding',
          'Pay attention to both verbal and non-verbal cues',
          'Take mental notes of the key concerns being raised',
          'Show patience and avoid interrupting',
        ],
      },
      {
        title: 'Acknowledge',
        description:
          "Validate the customer's feelings and show genuine understanding",
        items: [
          'Use empathetic language: "I understand how you feel..."',
          'Avoid dismissing or minimizing their concerns',
          'Show that you take their objection seriously',
          'Build rapport through genuine acknowledgment',
        ],
      },
      {
        title: 'Probe',
        description:
          'Ask thoughtful questions to understand the root cause of the objection',
        items: [
          'Use open-ended questions to explore deeper concerns',
          'Clarify any ambiguous points in their objection',
          'Understand their priorities and what matters most to them',
          'Uncover the real reason behind the stated objection',
        ],
      },
      {
        title: 'Reframe',
        description:
          'Present a different perspective that addresses their concern while highlighting value',
        items: [
          'Connect your response to their specific situation',
          'Offer relevant examples or success stories',
          'Show how the solution addresses their underlying need',
          'Guide them toward seeing the value without being pushy',
        ],
      },
    ],
  },
];

export function PrudentialObjectionHandlingScorecardModal({
  isOpen,
  onClose,
}: PrudentialObjectionHandlingScorecardModalProps) {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('sales-technique');
  const rightContentRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const container = rightContentRef.current;
    const target = sectionRefs.current[id];
    if (!container || !target) return;
    const top = id === 'sales-technique' ? 0 : target.offsetTop - 120;
    container.scrollTo({ top, behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setActiveSection('sales-technique');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => {
      const container = rightContentRef.current;
      if (!container) return;

      const scrollPosition = container.scrollTop + 150;

      for (let i = scorecardSections.length - 1; i >= 0; i--) {
        const section = scorecardSections[i];
        const element = sectionRefs.current[section.id];
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(section.id);
          break;
        }
      }
    };

    const timeoutId = setTimeout(() => {
      const container = rightContentRef.current;
      if (container) {
        container.addEventListener('scroll', handleScroll);
      }
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      const container = rightContentRef.current;
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [isOpen]);

  return (
    <HeadlessDialog
      open={isOpen}
      as="div"
      className="relative z-[999]"
      onClose={onClose}
    >
      <DialogBackdrop className="fixed inset-0 bg-black/50" />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex h-full items-center justify-center p-0 md:min-h-0 md:p-4">
          <DialogPanel
            transition
            className="flex h-full w-full max-w-4xl flex-col bg-white backdrop-blur-2xl duration-300 ease-out data-[closed]:transform-[scale(95%)] data-[closed]:opacity-0 md:h-auto md:max-h-[70vh] md:rounded-xl md:shadow-lg"
          >
            {/* Header */}
            <div className="flex flex-shrink-0 items-center justify-between gap-4 rounded-2xl bg-white p-4">
              <DialogTitle
                as="h3"
                className="flex-1 text-xl/7 font-bold tracking-tight text-black"
              >
                {t('roleplay.scorecard')}
              </DialogTitle>

              <CloseButton className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100">
                <img src={xIcon} alt={t('common.close')} className="h-4 w-4" />
              </CloseButton>
            </div>

            {/* Description */}
            <div className="px-4 pb-4">
              <p className="text-sm text-gray-700">
                {t('roleplay.prudentialObjectionHandlingScorecardDescription')}
              </p>
            </div>

            <div className="border-t border-gray-200"></div>

            {/* Content */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left Navigation Panel */}
              <div className="w-64 flex-shrink-0 border-r border-gray-200">
                <div className="p-4">
                  <h4 className="mb-4 font-semibold text-gray-900">
                    {t('roleplay.jumpToSection')}
                  </h4>
                  <nav className="divide-y border-gray-200">
                    {scorecardSections.map((section) => (
                      <div key={section.id} className="py-1">
                        <button
                          onClick={() => scrollToSection(section.id)}
                          className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                            activeSection === section.id
                              ? 'bg-gray-100'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {section.title}
                        </button>
                      </div>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Right Content Panel */}
              <div className="flex-1 overflow-y-auto" ref={rightContentRef}>
                <div className="divide-y border-gray-200 p-4">
                  {scorecardSections.map((section, sectionIdx) => (
                    <section
                      key={section.id}
                      id={section.id}
                      ref={(el: HTMLDivElement | null) => {
                        sectionRefs.current[section.id] = el;
                      }}
                      className={cn(
                        'scroll-mt-4',
                        sectionIdx > 0 &&
                          sectionIdx < scorecardSections.length - 1 &&
                          'py-4',
                        sectionIdx === 0 && 'pb-4',
                        sectionIdx === scorecardSections.length - 1 && 'pt-4',
                      )}
                    >
                      <h3 className="text-base font-semibold text-gray-900">
                        {section.title}
                      </h3>
                      <div className="mt-4 space-y-4">
                        {section.content.map((content, index) => (
                          <div key={index} className="space-y-2">
                            <h3 className="text-sm font-semibold text-gray-700">
                              {content.title}
                            </h3>
                            {content.description && (
                              <p className="text-sm text-gray-700">
                                {content.description}
                              </p>
                            )}
                            {content.items.length > 0 && (
                              <ul className="ml-4 space-y-1">
                                {content.items.map((item, itemIndex) => (
                                  <li
                                    key={itemIndex}
                                    className="text-sm text-gray-700"
                                  >
                                    <span className="flex items-start">
                                      <span className="mr-2 text-gray-400">
                                        •
                                      </span>
                                      <span>{item}</span>
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </HeadlessDialog>
  );
}
