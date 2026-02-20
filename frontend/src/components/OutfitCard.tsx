import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Sparkles, Shirt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface StyleItem {
    type: string;
    name: string;
    price_range: string;
    image_keyword: string;
    image_url?: string;
}

export interface Outfit {
    id: string;
    name: string;
    description: string;
    items: StyleItem[];
    matching_stores: string[]; // Store IDs
    trend_source: string;
    weather_note: string;
}

interface OutfitCardProps {
    outfit: Outfit;
    storesContext?: any[];
    userLocation?: { lat: number; lng: number };
}

const OutfitCard: React.FC<OutfitCardProps> = ({ outfit, storesContext, userLocation }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const getDistance = (store: any) => {
        if (!userLocation || !store.location) return null;
        const R = 6371;
        const dLat = (store.location.lat - userLocation.lat) * Math.PI / 180;
        const dLng = (store.location.lng - userLocation.lng) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(store.location.lat * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (R * c).toFixed(1);
    };

    const nearbyStores = storesContext
        ? storesContext
            .filter(s => outfit.matching_stores.includes(s.id))
            .map(s => ({
                ...s,
                distance: getDistance(s),
                // Use existing fields if backend provided, or calc frontend as fallback
                walk_min: s.walk_minutes || (getDistance(s) ? Math.round(parseFloat(getDistance(s)!) * 1000 / 80) : null),
                transit_min: s.transit_minutes || (getDistance(s) ? Math.round(parseFloat(getDistance(s)!) * 1000 / 500) : null)
            }))
            .sort((a, b) => parseFloat(a.distance || '999') - parseFloat(b.distance || '999'))
            .slice(0, 1)
        : [];

    const handleTryOn = () => {
        navigate('/fitting', { state: { outfit, mode: 'full' } });
    };

    const handleFindStores = () => {
        navigate('/map', { state: { stores: outfit.matching_stores } });
    };

    const handleItemClick = (item: StyleItem) => {
        navigate('/fitting', {
            state: {
                outfit,
                selectedItem: item,
                mode: 'single'
            }
        });
    };

    return (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-full relative group text-center w-full">

            {/* 1. Header Area with Gradient */}
            <div className="bg-gradient-to-br from-pink-50 to-white pt-6 pb-2 px-6">
                <div className="flex justify-between items-start mb-2">
                    <span className="bg-black/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-primary" />
                        Trending
                    </span>
                    <span className="bg-blue-50 text-blue-800 text-[10px] px-2 py-1 rounded-lg font-bold">
                        🌤 {outfit.weather_note}
                    </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 leading-tight mb-1 text-left">
                    {outfit.name}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2 text-left">
                    {outfit.description}
                </p>
            </div>

            {/* 2. Items Grid */}
            <div className="p-4 flex-1 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                    {outfit.items.slice(0, 4).map((item, idx) => (
                        <div
                            key={idx}
                            onClick={() => handleItemClick(item)}
                            className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all rounded-xl overflow-hidden border border-gray-100 bg-white shadow-sm flex flex-col"
                        >
                            {/* Image */}
                            <div className="w-full aspect-square bg-gray-50 relative overflow-hidden">
                                <img
                                    src={
                                        (item.image_url && item.image_url.startsWith('http'))
                                            ? item.image_url
                                            : `https://placehold.co/400x400/FFF0F5/FF2D78?text=${encodeURIComponent(item.name.substring(0, 15))}`
                                    }
                                    onError={(e) => {
                                        e.currentTarget.src = `https://placehold.co/400x400/FFF0F5/FF2D78?text=${encodeURIComponent(item.name.substring(0, 15))}`;
                                        e.currentTarget.onerror = null;
                                    }}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            </div>

                            {/* Info */}
                            <div className="p-2 text-left">
                                <p className="font-bold text-xs text-gray-800 line-clamp-1">{item.name}</p>
                                <p className="text-[10px] text-gray-500 font-medium">{item.price_range}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 3. Stores Info */}
                <div className="text-xs text-gray-500 font-medium py-2 border-t border-gray-50 mt-1 flex flex-col items-center gap-1">
                    {nearbyStores.length > 0 ? (
                        <>
                            <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-primary" />
                                Available at <b>{nearbyStores[0].name.en}</b>
                            </div>
                            {(nearbyStores[0].walk_min || nearbyStores[0].transit_min) && (
                                <div className="text-[10px] text-gray-400">
                                    {nearbyStores[0].walk_min && `🚶 ${nearbyStores[0].walk_min} min  `}
                                    {nearbyStores[0].transit_min && `🚇 ${nearbyStores[0].transit_min} min`}
                                </div>
                            )}
                        </>
                    ) : (
                        <span>Available at {outfit.matching_stores.length} stores nearby</span>
                    )}
                </div>

                {/* 4. Action Buttons */}
                <div className="flex gap-3 mt-auto">
                    <button
                        onClick={handleTryOn}
                        className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-md hover:bg-pink-600 flex items-center justify-center gap-2"
                    >
                        <Shirt className="w-4 h-4" />
                        {t('recommend.try_on', 'Try On')}
                    </button>
                    <button
                        onClick={handleFindStores}
                        className="flex-1 border-2 border-primary text-primary py-3 rounded-xl font-bold text-sm hover:bg-primary/5 flex items-center justify-center gap-2"
                    >
                        <MapPin className="w-4 h-4" />
                        {t('recommend.find_stores', 'Find Stores')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OutfitCard;
