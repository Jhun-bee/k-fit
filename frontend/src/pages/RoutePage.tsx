import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Play, Timer, Map } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import LoadingSpinner from '../components/LoadingSpinner';
import RouteTimeline from '../components/RouteTimeline';
import NavigationSheet from '../components/NavigationSheet';

interface RoutePlan {
    total_time_min: number;
    total_stores: number;
    schedule: any[];
    tips: string[];
}

interface RouteResponse {
    route: RoutePlan;
}

const RoutePage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [navLinks, setNavLinks] = useState<any>(null);
    const [isNavOpen, setIsNavOpen] = useState(false);

    // API Hook
    const { data: routeData, loading, execute } = useApi<RouteResponse>('/api/route/plan');

    useEffect(() => {
        const planRoute = async () => {
            const storeIds = JSON.parse(localStorage.getItem('hanmeot_route_stores') || '[]');

            // Mock start location (e.g., Myeongdong Station)
            const startLoc = { lat: 37.560997, lng: 126.986125 };

            if (storeIds.length === 0) {
                // If no stores specifically selected, try using "matching_stores" from recommend page as fallback
                const fallbackStores = JSON.parse(localStorage.getItem('hanmeot_target_stores') || '[]');
                if (fallbackStores.length > 0) {
                    await execute({
                        method: 'POST',
                        data: {
                            start_lat: startLoc.lat,
                            start_lng: startLoc.lng,
                            store_ids: fallbackStores.slice(0, 5), // Limit to 5 for demo
                            language: i18n.language
                        }
                    });
                }
                return;
            }

            await execute({
                method: 'POST',
                data: {
                    start_lat: startLoc.lat,
                    start_lng: startLoc.lng,
                    store_ids: storeIds,
                    language: i18n.language
                }
            });
        };
        planRoute();
    }, [i18n.language]);

    const handleOpenNav = (links: any) => {
        setNavLinks(links);
        setIsNavOpen(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <LoadingSpinner />
                <p className="mt-6 text-gray-500 text-sm animate-pulse">
                    {t('optimizing_route', 'Designing your perfect shopping route...')}
                </p>
            </div>
        );
    }

    if (!routeData?.route && !loading) {
        return (
            <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white p-8 rounded-3xl shadow-lg">
                    <Map className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">{t('route_empty', 'No Route Plan')}</h2>
                    <p className="text-gray-500 mb-6">{t('route_empty_desc', 'Add stores from the Map to create your itinerary.')}</p>
                    <button
                        onClick={() => navigate('/map')}
                        className="bg-black text-white px-6 py-3 rounded-xl font-bold"
                    >
                        Go to Map
                    </button>
                </div>
            </div>
        );
    }

    const { route } = routeData!;

    return (
        <div className="min-h-screen bg-surface flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-md z-20 px-4 py-3 border-b border-gray-100 flex items-center justify-between shadow-sm">
                <button onClick={() => navigate('/map')} className="p-2">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex flex-col items-center">
                    <div className="font-bold text-lg">{t('my_route', 'Shopping Itinerary')}</div>
                    <div className="flex items-center gap-1 text-xs text-primary font-bold">
                        <Timer className="w-3 h-3" />
                        <span>Total {Math.floor(route.total_time_min / 60)}h {route.total_time_min % 60}m</span>
                    </div>
                </div>
                <div className="w-10"></div>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto px-4 pb-20">
                <RouteTimeline
                    steps={route.schedule}
                    onNavigate={handleOpenNav}
                />

                {/* Tips */}
                {route.tips && (
                    <div className="mt-8 bg-black text-white p-6 rounded-3xl mb-10">
                        <h3 className="font-bold mb-3 flex items-center gap-2">
                            💡 Pro Tips
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-300">
                            {route.tips.map((tip, idx) => (
                                <li key={idx}>• {tip}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Bottom Action */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
                <button
                    onClick={() => handleOpenNav(route.schedule[0].transit_to_next?.navigation_links)}
                    className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
                >
                    <Play className="w-5 h-5 fill-current" />
                    {t('start_route', 'Start Route')}
                </button>
            </div>

            <NavigationSheet
                isOpen={isNavOpen}
                onClose={() => setIsNavOpen(false)}
                links={navLinks}
            />
        </div>
    );
};

export default RoutePage;
