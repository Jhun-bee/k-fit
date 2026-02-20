import React from 'react';
// import { useTranslation } from 'react-i18next';
import { Bus, Clock, Navigation, GripVertical } from 'lucide-react';

interface RouteStep {
    order: number;
    store_id: string;
    store_name: string;
    arrival_time: string;
    shopping_time_min: number;
    transit_to_next?: {
        method: string;
        duration_min: number;
        odsay_summary: string;
        navigation_links: { kakao: string; naver: string; google: string };
    };
}

interface RouteTimelineProps {
    steps: RouteStep[];
    onNavigate: (links: any) => void;
}

const RouteTimeline: React.FC<RouteTimelineProps> = ({ steps, onNavigate }) => {
    // const { t } = useTranslation();

    return (
        <div className="relative pl-8 border-l-2 border-gray-200 ml-6 space-y-10 py-6">
            {steps.map((step, idx) => (
                <div key={step.store_id} className="relative animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                    {/* Store Node */}
                    <div className="absolute -left-[41px] top-0 flex items-center justify-center w-10 h-10 bg-black text-white rounded-full font-bold shadow-lg z-10">
                        {step.order}
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-lg">{step.store_name}</h3>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Clock className="w-4 h-4" />
                                    <span>Arrive: {step.arrival_time}</span>
                                </div>
                            </div>
                            <GripVertical className="text-gray-300 w-5 h-5" />
                        </div>

                        <div className="flex items-center gap-2 text-xs bg-gray-50 px-3 py-2 rounded-lg text-gray-600 mb-3 w-fit">
                            <span>🛍 Shopping: {step.shopping_time_min} min</span>
                        </div>

                        {/* Transit to Next (if exists) */}
                        {step.transit_to_next && (
                            <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                            <Bus className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-400">Next Destination</p>
                                            <p className="text-sm font-medium">{step.transit_to_next.odsay_summary}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onNavigate(step.transit_to_next!.navigation_links)}
                                        className="bg-blue-600 text-white p-2 rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
                                    >
                                        <Navigation className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RouteTimeline;
