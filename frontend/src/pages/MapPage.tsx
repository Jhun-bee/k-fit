import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const MapPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">{t('map')}</h1>
            <p>Store Map (Placeholder)</p>
            <button
                onClick={() => navigate('/route')}
                className="mt-4 px-4 py-2 bg-secondary text-white rounded"
            >
                {t('next')}
            </button>
        </div>
    );
};

export default MapPage;
