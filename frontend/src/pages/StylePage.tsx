import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, ChevronLeft } from 'lucide-react';

const STYLES = ['Minimal', 'Street', 'Casual', 'Y2K', 'Romantic', 'Grunge', 'Athleisure', 'Business', 'Modern Hanbok', 'K-Culture', 'Tradition-core'];
const COLORS = ['Black', 'White', 'Beige', 'Blue', 'Pink', 'Green', 'Red', 'Purple'];
const OCCASIONS = [
    { id: 'Daily', label: 'Daily' },
    { id: 'Date', label: 'Date' },
    { id: 'Travel', label: 'Travel' },
    { id: 'Office', label: 'Office' },
    { id: 'Party', label: 'Party' }
];

const StylePage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
    const [budget, setBudget] = useState(150000);
    const [occasion, setOccasion] = useState('Daily');
    const [selectedColors, setSelectedColors] = useState<string[]>([]);

    const toggleStyle = (style: string) => {
        if (selectedStyles.includes(style)) {
            setSelectedStyles(selectedStyles.filter(s => s !== style));
        } else {
            if (selectedStyles.length < 3) {
                setSelectedStyles([...selectedStyles, style]);
            }
        }
    };

    const toggleColor = (color: string) => {
        if (selectedColors.includes(color)) {
            setSelectedColors(selectedColors.filter(c => c !== color));
        } else {
            if (selectedColors.length < 3) {
                setSelectedColors([...selectedColors, color]);
            }
        }
    };

    const handleNext = () => {
        const prefs = {
            keywords: selectedStyles,
            budget: budget,
            occasion: occasion,
            colors: selectedColors
        };
        localStorage.setItem('hanmeot_preferences', JSON.stringify(prefs));

        // Ensure state is clean before navigating
        navigate('/recommend');
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-white overflow-hidden relative">
            {/* Header with Back Button */}
            <div className="px-6 py-4 flex items-center gap-4 border-b border-gray-50">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
                    <ChevronLeft className="w-6 h-6 text-gray-800" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold mb-0.5">{t('style.title', 'Style Preferences')}</h2>
                    <p className="text-gray-500 text-xs">{t('style.what_styles', 'What styles do you like?')}</p>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 pt-4 pb-28 scrollbar-hide">

                <div className="space-y-8">
                    {/* 1. Keywords */}
                    <section>
                        <label className="font-bold block mb-3 text-sm text-gray-800">Keywords (Max 3)</label>
                        <div className="flex flex-wrap gap-2">
                            {STYLES.map(style => (
                                <button
                                    key={style}
                                    onClick={() => toggleStyle(style)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedStyles.includes(style)
                                        ? 'bg-black text-white shadow-lg'
                                        : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
                                        }`}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* 2. Budget */}
                    <section className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                        <div className="flex justify-between mb-4">
                            <label className="font-bold flex items-center gap-2 text-sm text-gray-800">
                                {t('style.budget', 'Total Budget')}
                            </label>
                            <span className="text-primary font-bold">₩{budget.toLocaleString()}</span>
                        </div>
                        <input
                            type="range"
                            min="50000"
                            max="1000000"
                            step="10000"
                            value={budget}
                            onChange={(e) => setBudget(Number(e.target.value))}
                            className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-2">
                            <span>₩50k</span>
                            <span>₩1m+</span>
                        </div>
                    </section>

                    {/* 3. Occasion - Flex Wrap */}
                    <section>
                        <label className="font-bold block mb-3 text-sm text-gray-800">{t('style.occasion', 'Occasion')}</label>
                        <div className="flex flex-wrap gap-3">
                            {OCCASIONS.map(occ => (
                                <button
                                    key={occ.id}
                                    onClick={() => setOccasion(occ.id)}
                                    className={`px-5 py-3 rounded-xl font-medium transition-all flex items-center gap-2 flex-grow justify-center sm:flex-grow-0 ${occasion === occ.id
                                        ? 'bg-primary/10 text-primary border-2 border-primary'
                                        : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {occasion === occ.id && <Check className="w-4 h-4" />}
                                    {t(`occasion.${occ.id.toLowerCase()}`, occ.label)}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* 4. Colors - Grid */}
                    <section>
                        <label className="font-bold block mb-3 text-sm text-gray-800">{t('style.colors', 'Preferred Colors')}</label>
                        <div className="grid grid-cols-6 gap-3">
                            {COLORS.map(color => (
                                <button
                                    key={color}
                                    onClick={() => toggleColor(color)}
                                    className={`aspect-square rounded-full border-2 flex items-center justify-center transition-all ${selectedColors.includes(color)
                                        ? 'border-primary scale-110 shadow-md ring-2 ring-primary/20'
                                        : 'border-transparent hover:scale-105'
                                        }`}
                                    style={{ backgroundColor: color.toLowerCase() === 'white' ? '#fff' : color.toLowerCase() }}
                                >
                                    {selectedColors.includes(color) && (
                                        <Check className={`w-5 h-5 ${color === 'White' || color === 'Beige' ? 'text-black' : 'text-white'}`} />
                                    )}
                                    {/* Border for light colors */}
                                    {(color === 'White' || color === 'Beige') && !selectedColors.includes(color) && (
                                        <div className="w-full h-full rounded-full border border-gray-200 inset-0" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* Bottom Button Fixed */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 z-10">
                <button
                    onClick={handleNext}
                    disabled={selectedStyles.length === 0}
                    className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:shadow-none hover:bg-pink-600 transition-all flex items-center justify-center gap-2"
                >
                    {t('style.get_recommendations', 'Get Recommendations')}
                </button>
            </div>
        </div>
    );
};

export default StylePage;
