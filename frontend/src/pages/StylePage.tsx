import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const StylePage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">{t('style')}</h1>
            <p>Style Preference Selection (Placeholder)</p>
            <button
                onClick={() => navigate('/recommend')}
                className="mt-4 px-4 py-2 bg-secondary text-white rounded"
            >
                {t('next')}
            </button>
        </div>
    );
};

export default StylePage;
