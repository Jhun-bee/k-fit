import React from 'react';
import { useTranslation } from 'react-i18next';

interface NavigationSheetProps {
    isOpen: boolean;
    onClose: () => void;
    links: {
        kakao: string;
        naver: string;
        google: string;
    };
}

const NavigationSheet: React.FC<NavigationSheetProps> = ({ isOpen, onClose, links }) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-md bg-white rounded-t-2xl p-6 animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>
                <h3 className="text-lg font-bold mb-4 text-center">{t('select_map_app', 'Select Map App')}</h3>

                <div className="space-y-3">
                    <a
                        href={links.kakao}
                        className="flex items-center justify-center w-full py-4 bg-[#FAE100] text-[#3C1E1E] font-bold rounded-xl hover:opacity-90 transition-opacity"
                        target="_blank" rel="noreferrer"
                    >
                        Kakao Map
                    </a>
                    <a
                        href={links.naver}
                        className="flex items-center justify-center w-full py-4 bg-[#03C75A] text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
                        target="_blank" rel="noreferrer"
                    >
                        Naver Map
                    </a>
                    <a
                        href={links.google}
                        className="flex items-center justify-center w-full py-4 bg-white border border-gray-200 text-gray-800 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                        target="_blank" rel="noreferrer"
                    >
                        Google Maps
                    </a>
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-4 py-3 text-gray-500 font-medium"
                >
                    {t('cancel', 'Cancel')}
                </button>
            </div>
        </div>
    );
};

export default NavigationSheet;
