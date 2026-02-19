import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const RoutePage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">{t('route')}</h1>
            <p>Route Plan (Placeholder)</p>
            <button
                onClick={() => navigate('/')}
                className="mt-4 px-4 py-2 bg-secondary text-white rounded"
            >
                {t('home')}
            </button>
        </div>
    );
};

export default RoutePage;
