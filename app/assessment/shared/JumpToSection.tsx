import { useTranslation } from 'react-i18next';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';

export default function JumpToSection() {
  const { t } = useTranslation();
  const { sections } = useAssessmentContext();
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <div className="rounded-2xl bg-white p-4">
      <h2 className="mb-4 text-[16px] font-bold">
        {t('assessment.jumpToSection')}
      </h2>
      <ul className="divide-y divide-[#E3E4E6]">
        {sections.map((section) => (
          <li key={section.id}>
            <button
              type="button"
              onClick={() => scrollToSection(section.id)}
              className="w-full cursor-pointer px-2 py-2 text-left text-[14px] font-medium text-[#58595A] transition-colors hover:bg-gray-50"
            >
              {section.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
