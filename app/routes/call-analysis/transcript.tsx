import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

export default function CallAnalysisTranscript() {
  const { id } = useParams();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">
          {t('callAnalysis.transcript.title')}
        </h1>
        <p className="text-gray-500">
          {t('callAnalysis.transcript.placeholder')}
        </p>
      </div>
    </div>
  );
}
