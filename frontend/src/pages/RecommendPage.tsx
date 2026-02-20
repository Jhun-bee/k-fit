import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, RefreshCw, Shirt, MapPin } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { API_BASE_URL } from '../api/apiClient';
import LoadingSpinner from '../components/LoadingSpinner';

interface StyleItem {
    type: string;
    name: string;
    price?: number;
    price_range?: string;
    image_keyword: string;
    image_url?: string;
    store_name?: string;
    store_area?: string;
    hotel_delivery?: boolean;
}

interface Outfit {
    id: string;
    name: string;
    description: string;
    items: StyleItem[];
    matching_stores: any[]; // Can be IDs or objects
    trend_source: string;
    weather_note: string;
    culture_tip?: string;
    total_price?: number;
}

interface TrendAnalysis {
    current_trends: string[];
    trend_source: string;
    season_note: string;
}

interface WeatherInfo {
    temp: number;
    condition: string;
    humidity: number;
}

interface RecommendResponse {
    trend_analysis?: TrendAnalysis;
    outfits: Outfit[];
    weather: WeatherInfo;
    language: string;
}

const HANBOK_BRANDS = ["LEESLE", "리슬", "TCHAI KIM", "차이킴", "OUWR", "오우르", "Bukchonzalak", "북촌잘락"];
const HOTEL_BRANDS = ["OUWR", "오우르", "TCHAI KIM", "차이킴"];

const RecommendPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    // API Hooks
    const recommendApi = useApi<RecommendResponse>('/api/style/recommend');
    const storesApi = useApi<any[]>('/api/stores');

    // State
    const [displayData, setDisplayData] = useState<RecommendResponse | null>(null);

    // Drag Scroll Logic
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeftState, setScrollLeftState] = useState(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
        setScrollLeftState(scrollRef.current?.scrollLeft || 0);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - (scrollRef.current.offsetLeft || 0);
        const walk = (x - startX) * 1.5; // Scroll speed multiplier
        scrollRef.current.scrollLeft = scrollLeftState - walk;
    };

    const handleMouseUp = () => setIsDragging(false);
    const handleMouseLeave = () => setIsDragging(false);

    useEffect(() => {
        storesApi.execute();
    }, [storesApi.execute]);

    useEffect(() => {
        const loadRecommendations = async () => {
            const cachedDataStr = sessionStorage.getItem('hanmeot_recommendation_cache');
            const prefsStr = localStorage.getItem('hanmeot_preferences');

            if (cachedDataStr) {
                setDisplayData(JSON.parse(cachedDataStr));
                return;
            }

            const prefs = prefsStr ? JSON.parse(prefsStr) : {};

            const result = await recommendApi.execute({
                method: 'POST',
                data: {
                    style_prefs: prefs.keywords || ['casual'],
                    budget: String(prefs.budget || '100000'),
                    occasion: prefs.occasion || 'daily',
                    colors: prefs.colors || [],
                    gender: (() => {
                        const savedGender = localStorage.getItem('hanmeot_gender');
                        console.log("[recommend] Sending gender:", savedGender || 'Unisex');
                        return savedGender || 'Unisex';
                    })(),
                    styles: (() => {
                        const savedStyles = localStorage.getItem('hanmeot_styles');
                        const parsed = savedStyles ? JSON.parse(savedStyles) : [];
                        return parsed.length > 0 ? parsed : ['street', 'casual'];
                    })(),
                    language: i18n.language
                }
            });

            if (result) {
                sessionStorage.setItem('hanmeot_recommendation_cache', JSON.stringify(result));
                setDisplayData(result);
            }
        };

        if (!displayData) {
            loadRecommendations();
        }
    }, [i18n.language]);

    const handleRefresh = async () => {
        sessionStorage.removeItem('hanmeot_recommendation_cache');
        setDisplayData(null);

        const prefsStr = localStorage.getItem('hanmeot_preferences');
        const prefs = prefsStr ? JSON.parse(prefsStr) : {};

        const result = await recommendApi.execute({
            method: 'POST',
            data: {
                style_prefs: prefs.keywords || ['casual'],
                budget: String(prefs.budget || '100000'),
                occasion: prefs.occasion || 'daily',
                colors: prefs.colors || [],
                gender: localStorage.getItem('hanmeot_gender') || 'Unisex',
                styles: (() => {
                    const savedStyles = localStorage.getItem('hanmeot_styles');
                    const parsed = savedStyles ? JSON.parse(savedStyles) : [];
                    return parsed.length > 0 ? parsed : ['street', 'casual'];
                })(),
                language: i18n.language
            }
        });

        if (result) {
            sessionStorage.setItem('hanmeot_recommendation_cache', JSON.stringify(result));
            setDisplayData(result);
        }
    };

    const [currentIndex, setCurrentIndex] = useState(0);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        const cardWidth = el.scrollWidth / (displayData?.outfits?.length || 1);
        const index = Math.round(el.scrollLeft / cardWidth);
        setCurrentIndex(index);
    };

    const handleItemClick = (outfit: Outfit, item: StyleItem) => {
        if (isDragging) return;
        const itemsToPass = [{
            ...item,
            displayImage: getItemImage(item)
        }];
        console.log("[recommend] Sending items to fitting:", itemsToPass);
        navigate('/fitting', {
            state: {
                outfit: {
                    ...outfit,
                    items: itemsToPass
                },
                items: itemsToPass,
                mode: 'single'
            }
        });
    };

    const handleFullTryOn = (outfit: Outfit) => {
        if (isDragging) return;
        const itemsToPass = outfit.items.map(it => ({
            ...it,
            displayImage: getItemImage(it)
        }));
        console.log("[recommend] Sending items to fitting:", itemsToPass);
        navigate('/fitting', {
            state: {
                outfit: outfit,
                items: itemsToPass,
                mode: 'full'
            }
        });
    };

    const handleFindStores = (outfit: Outfit) => {
        if (isDragging) return;
        const brands = [...new Set(outfit.items.map(item => item.store_name || item.image_keyword || item.name))].filter(Boolean);
        const itemsToPass = outfit.items.map(it => ({
            name: it.name,
            brand: it.store_name || (it as any).brand,
            image: getItemImage(it)
        }));
        console.log("[recommend] Navigating to map with items:", itemsToPass);
        navigate('/map', {
            state: {
                brands,
                items: itemsToPass
            }
        });
    };

    const getItemImage = (item: StyleItem) => {
        if (item.image_url && item.image_url.startsWith('/api/')) {
            const gender = localStorage.getItem('hanmeot_gender') || '';
            const finalUrl = item.image_url.includes('?') && !item.image_url.includes('gender=')
                ? `${item.image_url}&gender=${gender}`
                : item.image_url;
            return `${API_BASE_URL}${finalUrl}`;
        }
        const brand = (item as any).brand || item.store_name || '';
        const gender = localStorage.getItem('hanmeot_gender') || '';
        return `${API_BASE_URL}/api/placeholder/image?text=${encodeURIComponent(item.name)}&brand=${encodeURIComponent(brand)}&w=400&h=400&gender=${gender}`;
    };

    if (!displayData) {
        return <LoadingSpinner />;
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-white relative">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 z-10 bg-white shadow-sm">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
                    <ChevronLeft className="w-6 h-6 text-gray-800" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">{t('recommend.todays_style', "Today's Style")}</h1>
                <button onClick={handleRefresh} className="p-2 -mr-2 hover:bg-gray-100 rounded-full">
                    <RefreshCw className="w-5 h-5 text-gray-800" />
                </button>
            </div>

            <div className="relative flex-1 overflow-hidden flex flex-col">
                <button
                    onClick={() => {
                        if (!scrollRef.current) return;
                        const cardWidth = scrollRef.current.scrollWidth / (displayData?.outfits?.length || 1);
                        scrollRef.current.scrollBy({ left: -cardWidth, behavior: 'smooth' });
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg border border-gray-100 backdrop-blur-sm transition-all"
                >
                    <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>

                <button
                    onClick={() => {
                        if (!scrollRef.current) return;
                        const cardWidth = scrollRef.current.scrollWidth / (displayData?.outfits?.length || 1);
                        scrollRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg border border-gray-100 backdrop-blur-sm transition-all rotate-180"
                >
                    <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>

                <div
                    ref={scrollRef}
                    className="flex-1 overflow-x-auto snap-x snap-mandatory flex gap-4 p-4 items-center scrollbar-hide cursor-grab active:cursor-grabbing"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onScroll={handleScroll}
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {displayData?.outfits?.map((outfit) => (
                        <div
                            key={outfit.id}
                            className="snap-center w-full flex-shrink-0 bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col border border-gray-100 relative max-h-full"
                            style={{ width: 'calc(100% - 48px)', height: '100%' }}
                        >
                            <div className="bg-gradient-to-br from-pink-50 to-white pt-6 pb-2 px-6 flex-shrink-0">
                                <h3 className="text-xl font-bold text-gray-900 leading-tight mb-1">{outfit.name}</h3>
                                <p className="text-sm text-gray-600 line-clamp-2">{outfit.description}</p>
                                <div className="mt-2 text-xs text-blue-600 bg-blue-50 inline-block px-2 py-1 rounded font-medium">
                                    {outfit.weather_note}
                                </div>
                            </div>

                            <div className="p-4 flex-1 flex flex-col gap-3 overflow-y-auto">
                                <div className="grid grid-cols-1 gap-3">
                                    {outfit.items.slice(0, 4).map((item, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => handleItemClick(outfit, item)}
                                            className="cursor-pointer hover:bg-gray-50 transition-colors rounded-xl overflow-hidden border border-gray-100 bg-white shadow-sm flex group flex-shrink-0"
                                        >
                                            <div className="w-24 h-24 bg-pink-50 flex-shrink-0 relative">
                                                <img
                                                    src={getItemImage(item)}
                                                    onError={(e) => {
                                                        const brand = item.store_name || '';
                                                        e.currentTarget.src = `/api/placeholder/image?text=${encodeURIComponent(item.name)}&brand=${encodeURIComponent(brand)}&w=400&h=400`;
                                                        e.currentTarget.onerror = null;
                                                    }}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            </div>
                                            <div className="p-3 flex-1 flex flex-col justify-center">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-semibold text-sm text-gray-900 line-clamp-1 flex-1">{item.name}</p>
                                                    {HANBOK_BRANDS.some(b => item.store_name?.toUpperCase().includes(b.toUpperCase()) || item.name.toUpperCase().includes(b.toUpperCase())) && (
                                                        <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap">🇰🇷 Korean Hanbok</span>
                                                    )}
                                                </div>
                                                <p className="text-[#FF2D78] font-bold text-sm">
                                                    {item.price ? `₩${item.price.toLocaleString()}` : item.price_range}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    <span className="truncate">{item.store_name || "Style Recommend"}</span>
                                                    {item.store_area && ` (${item.store_area})`}
                                                </p>
                                                {(item.hotel_delivery || HOTEL_BRANDS.some(b => item.store_name?.toUpperCase().includes(b.toUpperCase()))) && (
                                                    <p className="text-[10px] text-blue-600 font-medium mt-1">{t('hotel_delivery', '🏨 Hotel Delivery Available')}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {outfit.culture_tip && (
                                    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 animate-fade-in flex-shrink-0">
                                        <p className="font-bold text-amber-900 text-xs mb-1">{t('culture_tip_title', '💡 K-Culture Tip')}</p>
                                        <p className="text-sm text-amber-800">{outfit.culture_tip}</p>
                                    </div>
                                )}

                                {outfit.total_price && (
                                    <div className="flex justify-between items-center mt-2 pt-3 border-t border-gray-100 flex-shrink-0">
                                        <span className="text-sm text-gray-500 font-medium">{t('recommend.total_price', 'Total Price')}</span>
                                        <span className="text-lg font-bold text-[#FF2D78]">
                                            ₩{outfit.total_price.toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 pt-0 mt-auto grid grid-cols-2 gap-3 flex-shrink-0 bg-white pb-6">
                                <button
                                    onClick={() => handleFullTryOn(outfit)}
                                    className="bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-md hover:bg-pink-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Shirt className="w-4 h-4" />
                                    {t('recommend.try_on', 'Try On')}
                                </button>
                                <button
                                    onClick={() => handleFindStores(outfit)}
                                    className="border-2 border-primary text-primary py-3 rounded-xl font-bold text-sm hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                                >
                                    <MapPin className="w-4 h-4" />
                                    {t('recommend.find_stores', 'Find Stores')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {displayData?.outfits && (
                    <div className="flex justify-center gap-2 mb-4">
                        {displayData.outfits.map((_, index) => (
                            <div
                                key={index}
                                className={`h-2 rounded-full transition-all duration-300 ${currentIndex === index ? 'bg-[#FF2D78] w-4' : 'bg-gray-300 w-2'}`}
                            />
                        ))}
                    </div>
                )}

                <div className="text-center py-2 text-gray-400 text-xs animate-pulse">
                    {t('recommend.swipe', 'Swipe to explore')}
                </div>
            </div>
        </div>
    );
};

export default RecommendPage;