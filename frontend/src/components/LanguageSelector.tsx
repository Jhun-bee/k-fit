import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelector: React.FC = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    const currentLang = i18n.language;

    return (
        <div className="flex gap-2 bg-white/50 backdrop-blur-md p-1 rounded-full border border-gray-200 shadow-sm">
            <button
                onClick={() => changeLanguage('en')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${currentLang === 'en' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-black'}`}
            >
                EN
            </button>
            <button
                onClick={() => changeLanguage('ko')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${currentLang === 'ko' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-black'}`}
            >
                KO
            </button>
            <button
                onClick={() => changeLanguage('ja')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${currentLang === 'ja' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-black'}`}
            >
                JA
            </button>
            <button
                onClick={() => changeLanguage('zh')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${currentLang === 'zh' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-black'}`}
            >
                ZH
            </button>
        </div>
    );
};

export default LanguageSelector;
