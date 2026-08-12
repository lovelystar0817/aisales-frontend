import { Link } from 'react-router';
import Lottie from 'lottie-react';
import { useTranslation } from 'react-i18next';
import notFoundAnimation from '../assets/lottie/404.json';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-12 sm:py-16 lg:px-8 bg-pattern">
      <div className="text-center max-w-md mx-auto">
        <div className="w-full max-w-[300px] mx-auto mb-4">
          <Lottie 
            animationData={notFoundAnimation} 
            loop={true} 
            autoplay={true}
          />
        </div>
        
        <p className="text-lg font-semibold text-primary-500">404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl font-everett">
          {t('notFound.title')}
        </h1>
        <p className="mt-4 text-base leading-7 text-gray">
          {t('notFound.description')}
        </p>
        <div className="mt-8 flex items-center justify-center gap-x-6">
          <Link
            to="/"
            className="rounded-full bg-primary px-6 py-3 leading-5 tracking-tight text-white hover:bg-primary-600 transition-colors duration-200"
          >
            {t('notFound.goBackHome')}
          </Link>
          <Link to="/sessions/active" className="text-sm font-semibold text-primary-700 hover:text-primary-800 transition-colors duration-200">
            {t('notFound.viewActiveSessions')} <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
