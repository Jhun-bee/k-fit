import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import LanguageSelector from '../components/LanguageSelector';

const OnboardingPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="p-4 flex flex-col items-center justify-center min-h-screen bg-pink-50">
            <h1 className="text-4xl font-bold mb-8 text-primary">{t('app_name')}</h1>
            <p className="text-xl mb-8">{t('welcome')}</p>

            <LanguageSelector />

            <button
                onClick={() => navigate('/style')}
                className="mt-8 px-6 py-3 bg-primary text-white rounded-full font-bold shadow-lg hover:bg-pink-600 transition"
            >
                {t('start_styling')}
            </button>
        </div>
    );
};

export default OnboardingPage;
