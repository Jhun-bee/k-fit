import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';

const OnboardingPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleGenderSelect = (selected: 'female' | 'male') => {
        localStorage.setItem('hanmeot_gender', selected);
        // Step 1 (Style Selection) is removed per request.
        // Navigate directly to /style page.
        setTimeout(() => navigate('/style'), 300);
    };

    return (
        <div className="h-screen bg-[#FFF5F7] text-gray-900 flex flex-col items-center justify-between p-6 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-3xl rounded-b-none"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>

            {/* Top Bar */}
            <div className="w-full flex justify-end z-10">
                <LanguageSelector />
            </div>

            {/* Main Content */}
            <div className="flex flex-col items-center flex-1 justify-center w-full max-w-sm z-10">
                {/* Logo Area */}
                <div className="mb-4 -mt-4 text-center transition-all duration-500 origin-center relative">
                    {/* Aurora Effect - White/Heavenly Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-tr from-white via-white/80 to-transparent rounded-full blur-3xl opacity-90 animate-aurora -z-10"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-bl from-white via-white/60 to-transparent rounded-full blur-2xl opacity-80 animate-aurora -z-10" style={{ animationDelay: '2s' }}></div>

                    <img
                        src="/hanmeot_logo.png"
                        alt="Han-Meot"
                        className="h-80 mx-auto mb-2 object-contain animate-fade-in relative z-10"
                    />
                    <div className="space-y-1">
                        <p className="text-gray-500 text-sm tracking-wide font-medium">{t('tagline')}</p>
                        <p className="text-gray-400 text-xs italic">{t('slogan_main')}</p>
                    </div>
                </div>

                <div className="mb-4 text-center space-y-2 animate-slide-up">
                    <h2 className="text-2xl font-bold text-gray-800">{t('welcome_title')}</h2>
                    <p className="text-gray-500">{t('welcome_subtitle')}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <button
                        onClick={() => handleGenderSelect('female')}
                        className="relative aspect-[4/5] rounded-3xl overflow-hidden group transition-all duration-300 border-2 border-transparent hover:border-primary shadow-md hover:shadow-xl hover:scale-[1.02]"
                    >
                        <img
                            src="/onboarding_female.png"
                            alt="Female Style"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                            <span className="text-white font-bold text-xl">{t('gender_female')}</span>
                        </div>
                    </button>

                    <button
                        onClick={() => handleGenderSelect('male')}
                        className="relative aspect-[4/5] rounded-3xl overflow-hidden group transition-all duration-300 border-2 border-transparent hover:border-primary shadow-md hover:shadow-xl hover:scale-[1.02]"
                    >
                        <img
                            src="/onboarding_male.png"
                            alt="Male Style"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                            <span className="text-white font-bold text-xl">{t('gender_male')}</span>
                        </div>
                    </button>
                </div>
            </div>

            <div className="text-xs text-gray-400 mt-8 mb-4 font-medium">
                Discover Seoul's Best Fashion
            </div>
        </div>
    );
};

export default OnboardingPage;
