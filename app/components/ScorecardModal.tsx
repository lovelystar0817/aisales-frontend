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

export interface ScorecardSectionContent {
  title: string;
  description?: string;
  items?: string[];
}

export interface ScorecardSection {
  id: string;
  title: string;
  content: ScorecardSectionContent[];
}

interface ScorecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  sections: ScorecardSection[];
}

export function ScorecardModal({
  isOpen,
  onClose,
  title,
  description,
  sections,
}: ScorecardModalProps) {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState(sections[0]?.id || '');
  const rightContentRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  try {
    console.log('--Sections:', JSON.stringify(sections));
  } catch (e) {
    console.error('Error logging sections:', e);
  }

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const container = rightContentRef.current;
    const target = sectionRefs.current[id];
    if (!container || !target) return;
    const top = id === sections[0]?.id ? 0 : target.offsetTop - 120;
    container.scrollTo({ top, behavior: 'smooth' });
  };

  // Reset to first section when modal opens
  useEffect(() => {
    if (isOpen && sections.length > 0) {
      setActiveSection(sections[0].id);
    }
  }, [isOpen, sections]);

  // Track scroll position and update active section
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => {
      const container = rightContentRef.current;
      if (!container) return;

      const scrollPosition = container.scrollTop + 150;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
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
  }, [isOpen, sections]);

  if (sections.length === 0) return null;

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
                {title || t('roleplay.scorecard')}
              </DialogTitle>

              <CloseButton className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100">
                <img src={xIcon} alt={t('common.close')} className="h-4 w-4" />
              </CloseButton>
            </div>

            {/* Description */}
            {description && (
              <div className="px-4 pb-4">
                <p className="text-sm text-gray-700">{description}</p>
              </div>
            )}

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
                    {sections.map((section) => (
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
                  {sections.map((section, sectionIdx) => (
                    <section
                      key={section.id}
                      id={section.id}
                      ref={(el: HTMLDivElement | null) => {
                        sectionRefs.current[section.id] = el;
                      }}
                      className={cn(
                        'scroll-mt-4',
                        sectionIdx > 0 &&
                          sectionIdx < sections.length - 1 &&
                          'py-4',
                        sectionIdx === 0 && 'pb-4',
                        sectionIdx === sections.length - 1 && 'pt-4',
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
                              <p className="text-sm whitespace-pre-line text-gray-700">
                                {content.description}
                              </p>
                            )}
                            {Array.isArray(content.items) &&
                              content.items.length > 0 && (
                                <ul className="ml-4 space-y-1">
                                  {content.items.map((item, itemIndex) => (
                                    <li
                                      key={itemIndex}
                                      className="text-sm text-gray-700"
                                    >
                                      {item.startsWith('a. ') ||
                                      item.startsWith('b. ') ||
                                      item.startsWith('c. ') ? (
                                        <span className="ml-4 block">
                                          {item}
                                        </span>
                                      ) : (
                                        <span className="flex items-start">
                                          <span className="mr-2 text-gray-400">
                                            •
                                          </span>
                                          <span>{item}</span>
                                        </span>
                                      )}
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
