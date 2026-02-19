import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelector: React.FC = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div className="flex gap-2">
            <button
                onClick={() => changeLanguage('en')}
                className={`px-2 py-1 rounded ${i18n.language === 'en' ? 'bg-primary text-white' : 'bg-gray-200'}`}
            >
                EN
            </button>
            <button
                onClick={() => changeLanguage('ja')}
                className={`px-2 py-1 rounded ${i18n.language === 'ja' ? 'bg-primary text-white' : 'bg-gray-200'}`}
            >
                JA
            </button>
            <button
                onClick={() => changeLanguage('zh')}
                className={`px-2 py-1 rounded ${i18n.language === 'zh' ? 'bg-primary text-white' : 'bg-gray-200'}`}
            >
                ZH
            </button>
        </div>
    );
};

export default LanguageSelector;
