import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Upload, X, Sparkles, Image as ImageIcon, Loader2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const ProfilePage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [images, setImages] = useState<string[]>([]); // base64 strings
    const [analyzing, setAnalyzing] = useState(false);
    const [styleProfile, setStyleProfile] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach(file => {
            if (images.length >= 10) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const result = ev.target?.result as string;
                setImages(prev => {
                    if (prev.length >= 10) return prev;
                    return [...prev, result];
                });
            };
            reader.readAsDataURL(file);
        });
        // Reset input so the same file can be re-selected
        e.target.value = '';
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setStyleProfile(null);
    };

    const analyzeImages = async () => {
        if (images.length === 0) return;
        setAnalyzing(true);
        setError(null);
        setStyleProfile(null);

        try {
            const res = await fetch(`${API_BASE}/api/ootd/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ images, language: 'ko' })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Analysis failed');
            }

            const data = await res.json();
            setStyleProfile(data.style_profile);

            // Save to localStorage for the recommendation engine
            localStorage.setItem('hanmeot_ootd_profile', JSON.stringify(data.style_profile));
        } catch (e: any) {
            setError(e.message || 'Failed to analyze images');
        } finally {
            setAnalyzing(false);
        }
    };

    const goToRecommendations = () => {
        if (!styleProfile) return;

        // Set preferences from the AI-analyzed profile
        const prefs = {
            keywords: styleProfile.style_keywords || [],
            budget: 200000,
            occasion: 'Daily',
            colors: styleProfile.key_colors || []
        };
        localStorage.setItem('hanmeot_preferences', JSON.stringify(prefs));
        navigate('/recommend');
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-white overflow-hidden relative">
            {/* Header */}
            <div className="px-6 py-4 flex items-center gap-4 border-b border-gray-50">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
                    <ChevronLeft className="w-6 h-6 text-gray-800" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold mb-0.5">✨ My OOTD Style</h2>
                    <p className="text-gray-500 text-xs">Upload your favorite outfits for AI analysis</p>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 pt-4 pb-28 scrollbar-hide">
                <div className="space-y-6">

                    {/* Upload Section */}
                    <section>
                        <label className="font-bold block mb-3 text-sm text-gray-800">
                            OOTD Photos ({images.length}/10)
                        </label>

                        <div className="grid grid-cols-3 gap-3">
                            {images.map((img, i) => (
                                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                                    <img src={img} alt={`OOTD ${i + 1}`} className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => removeImage(i)}
                                        className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3 h-3 text-white" />
                                    </button>
                                </div>
                            ))}

                            {images.length < 10 && (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all"
                                >
                                    <Upload className="w-6 h-6 text-gray-400" />
                                    <span className="text-xs text-gray-400">Add</span>
                                </button>
                            )}
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </section>

                    {/* Analysis Result */}
                    {styleProfile && (
                        <section className="bg-gradient-to-br from-pink-50 to-purple-50 p-5 rounded-2xl border border-pink-100 animate-fade-in">
                            <h3 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                AI Style Profile
                            </h3>

                            <div className="space-y-3">
                                <div>
                                    <span className="text-xs text-gray-500">Core Aesthetic</span>
                                    <p className="font-bold text-gray-900">{styleProfile.core_aesthetic}</p>
                                </div>

                                <div>
                                    <span className="text-xs text-gray-500">Preferred Fit</span>
                                    <p className="text-sm text-gray-700">{styleProfile.preferred_fit}</p>
                                </div>

                                {styleProfile.key_colors?.length > 0 && (
                                    <div>
                                        <span className="text-xs text-gray-500">Key Colors</span>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {styleProfile.key_colors.map((color: string, i: number) => (
                                                <span key={i} className="px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-700 shadow-sm">
                                                    {color}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {styleProfile.signature_items?.length > 0 && (
                                    <div>
                                        <span className="text-xs text-gray-500">Signature Items</span>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {styleProfile.signature_items.map((item: string, i: number) => (
                                                <span key={i} className="px-3 py-1 bg-primary/10 rounded-full text-xs font-medium text-primary">
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100">
                            {error}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Buttons */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 z-10 space-y-2">
                {!styleProfile ? (
                    <button
                        onClick={analyzeImages}
                        disabled={images.length === 0 || analyzing}
                        className="w-full bg-gradient-to-r from-purple-500 to-primary text-white py-4 rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:shadow-none hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                        {analyzing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Analyzing your style...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                Analyze My Style ({images.length} photos)
                            </>
                        )}
                    </button>
                ) : (
                    <button
                        onClick={goToRecommendations}
                        className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg hover:bg-pink-600 transition-all flex items-center justify-center gap-2"
                    >
                        <ImageIcon className="w-5 h-5" />
                        Get Personalized Recommendations →
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
