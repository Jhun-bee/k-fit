import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const tips = [
    { key: 'tip1', en: "🔥 K-Fashion Tip: Oversized fits are a must in Seoul!", ko: "🔥 K-패션 팁: 서울에서는 오버사이즈 핏이 필수!" },
    { key: 'tip2', en: "📍 Myeongdong & Hongdae are Seoul's top fashion districts", ko: "📍 명동과 홍대는 서울 최고의 패션 거리!" },
    { key: 'tip3', en: "🎨 This season's color: Olive Green & Cream", ko: "🎨 이번 시즌 컬러: 올리브 그린 & 크림" },
    { key: 'tip4', en: "👟 Korean street style = layering + chunky sneakers", ko: "👟 한국 스트릿 스타일 = 레이어링 + 청키 스니커즈" },
    { key: 'tip5', en: "🛍️ TOPTEN, SPAO, 8seconds — Korea's best budget brands", ko: "🛍️ 탑텐, 스파오, 에잇세컨즈 — 한국 가성비 브랜드 TOP3" },
    { key: 'tip6', en: "✨ K-pop idols love ALAND & MUSINSA picks", ko: "✨ K-pop 아이돌이 사랑하는 ALAND & 무신사 아이템" },
    { key: 'tip7', en: "🧥 Seoul spring = light layers + windbreakers", ko: "🧥 서울의 봄 = 가벼운 레이어링 + 바람막이" },
];

const LoadingSpinner: React.FC = () => {
    const { i18n } = useTranslation();
    const [tipIndex, setTipIndex] = useState(0);
    const [fade, setFade] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setFade(false);
            setTimeout(() => {
                setTipIndex((prev) => (prev + 1) % tips.length);
                setFade(true);
            }, 300);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const currentTip = i18n.language === 'ko' ? tips[tipIndex].ko : tips[tipIndex].en;

    return (
        <div className="flex flex-col items-center justify-center p-8 h-full min-h-[400px]">
            {/* Spinner */}
            <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 border-4 border-pink-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-[#FF2D78] rounded-full animate-spin"></div>
            </div>

            {/* Status */}
            <p className="text-[#FF2D78] font-bold text-lg mb-6 animate-pulse">
                한멋 AI Processing...
            </p>

            {/* Progress dots */}
            <div className="flex gap-1 mb-8">
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className="w-2 h-2 bg-[#FF2D78] rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.2}s` }}
                    />
                ))}
            </div>

            {/* Tips */}
            <div className="bg-pink-50 rounded-2xl p-4 max-w-[320px] w-full text-center min-h-[80px] flex items-center justify-center">
                <p
                    className={`text-sm text-gray-700 leading-relaxed transition-opacity duration-300 ${fade ? 'opacity-100' : 'opacity-0'}`}
                >
                    {currentTip}
                </p>
            </div>

            {/* Step indicator */}
            <div className="flex gap-1 mt-4">
                {tips.map((_, i) => (
                    <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${i === tipIndex ? 'bg-[#FF2D78]' : 'bg-gray-200'}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default LoadingSpinner;
