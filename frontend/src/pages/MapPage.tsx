import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, MapPin, Sparkles } from 'lucide-react';
import apiClient from '../api/apiClient';

declare global {
    interface Window {
        naver: any;
    }
}

interface StoreResult {
    name: string;
    brand: string;
    category: string;
    address: string;
    lat: number;
    lng: number;
    naverLink: string;
    kakaoLink: string;
    walk_minutes?: number;
}

const STORE_NAME_MAP: Record<string, string> = {
    "무신사 스탠다드": "MUSINSA Standard",
    "무신사 스토어": "MUSINSA Store",
    "디스이즈네버댓": "thisisneverthat",
    "아더에러": "ADER ERROR",
    "커버낫": "COVERNAT",
    "마르디 메크르디": "MARDI MERCREDI",
    "마뗑킴": "Matin Kim",
    "이미스": "EMIS",
    "스탠드오일": "Stand Oil",
    "스타일난다": "Stylenanda",
    "리슬": "LEESLE",
    "차이킴": "TCHAI KIM",
    "아워": "OUWR",
    "오우르": "OUWR",
    "북촌잘락": "Bukchonzalak",
    "수설화": "Soosulhwa",
    "앤더슨벨": "Andersson Bell",
    "엘엠씨": "LMC",
    "마하그리드": "MAHAGRID",
    "쿠어": "KOOR",
    "에잇세컨즈": "8SECONDS",
    "스파오": "SPAO",
    "키르시": "Kirsh",
};

const MapPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const mapElement = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);

    const passedBrands: string[] = location.state?.brands || ["MUSINSA Standard", "SPAO", "ALAND"];
    const items = location.state?.items || [];
    console.log("[map] items:", items);

    const [stores, setStores] = useState<StoreResult[]>([]);
    const [selectedStore, setSelectedStore] = useState<StoreResult | null>(null);
    const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
    const [showToast, setShowToast] = useState("");
    const [showTaxiModal, setShowTaxiModal] = useState(false);


    const getDisplayName = (koreanName: string) => {
        const lang = i18n.language.split('-')[0];
        if (lang === 'ko') return { primary: koreanName, secondary: "" };

        for (const [kr, en] of Object.entries(STORE_NAME_MAP)) {
            if (koreanName.includes(kr)) {
                return {
                    primary: en + " " + koreanName.replace(new RegExp(kr, 'g'), "").trim(),
                    secondary: koreanName
                };
            }
        }
        return { primary: koreanName, secondary: "" };
    };

    const handleItemClick = (item: any, index: number) => {
        setSelectedItemIndex(index);
        const iBrand = item.brand.toLowerCase();

        const matchedStore = stores.find(s => {
            const sName = s.name.toLowerCase();
            const sBrand = s.brand.toLowerCase();

            if (!iBrand) return false; // Prevent empty brand matching everything

            // 1. Direct match
            if (sName.includes(iBrand) || sBrand.includes(iBrand) || iBrand.includes(sBrand)) return true;

            // 2. Bilingual mapping check
            for (const [kr, en] of Object.entries(STORE_NAME_MAP)) {
                const krLow = kr.toLowerCase();
                const enLow = en.toLowerCase();
                if ((iBrand === enLow || iBrand === krLow) && (sName.includes(krLow) || sBrand.includes(krLow) || sName.includes(enLow))) {
                    return true;
                }
            }
            return false;
        });

        if (matchedStore && mapRef.current) {
            const pos = new window.naver.maps.LatLng(matchedStore.lat, matchedStore.lng);
            mapRef.current.panTo(pos);
            setSelectedStore(matchedStore);
        } else {
            setShowToast(t('error_item_no_store', 'No nearby store for this item'));
        }
    };

    const speakKorean = (text: string) => {
        if (!window.speechSynthesis) {
            alert(text);
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR';
        utterance.rate = 0.8;
        window.speechSynthesis.speak(utterance);
    };

    const handleKakaoTaxi = (s: StoreResult) => {
        const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
        const storeName = s.name.replace(/<b>|<\/b>/g, '');
        if (isMobile) {
            window.location.href = `kakaomap://search?q=${encodeURIComponent(storeName)}&p=${s.lat},${s.lng}`;
        } else {
            window.open(s.kakaoLink || `https://map.kakao.com/link/search/${encodeURIComponent(storeName)}`);
        }
    };

    useEffect(() => {
        if (!mapElement.current || !window.naver) return;

        const mapOptions = {
            center: new window.naver.maps.LatLng(37.5665, 126.9780),
            zoom: 13,
            scaleControl: false,
            logoControl: false,
            mapDataControl: false,
        };
        const map = new window.naver.maps.Map(mapElement.current, mapOptions);
        mapRef.current = map;

        const bounds = new window.naver.maps.LatLngBounds();

        const fetchStores = async () => {
            try {
                const brandsToSearch = passedBrands.length > 0 ? passedBrands : ["MUSINSA Standard", "SPAO", "ALAND"];
                const res = await apiClient.post('/api/stores/search', { brands: brandsToSearch });
                const fetchedStores: StoreResult[] = res.data.stores;
                setStores(fetchedStores);

                markersRef.current.forEach(m => m.setMap(null));
                markersRef.current = [];

                fetchedStores.forEach((store, idx) => {
                    const pos = new window.naver.maps.LatLng(store.lat, store.lng);
                    const marker = new window.naver.maps.Marker({
                        position: pos,
                        map: map,
                        icon: {
                            content: `<div style="background:#FF2D78; width:${idx === 0 ? '18px' : '14px'}; height:${idx === 0 ? '18px' : '14px'}; border-radius:50%; border:2px solid white; box-shadow:0 2px 5px rgba(0,0,0,0.3); position:relative;">
                                ${idx === 0 ? '<div style="position:absolute; top:-20px; left:50%; transform:translateX(-50%); background:#FF2D78; color:white; font-size:9px; font-weight:bold; padding:2px 5px; border-radius:4px; white-space:nowrap;">BEST</div>' : ''}
                            </div>`,
                            anchor: new window.naver.maps.Point(idx === 0 ? 9 : 7, idx === 0 ? 9 : 7)
                        }
                    });

                    window.naver.maps.Event.addListener(marker, 'click', () => {
                        setSelectedStore(store);
                        map.panTo(pos);
                    });

                    markersRef.current.push(marker);
                    bounds.extend(pos);
                });

                if (fetchedStores.length > 0) {
                    map.fitBounds(bounds, {
                        padding: { top: 100, right: 50, bottom: 250, left: 50 }
                    });
                }
            } catch (error) {
                console.error("Search failed", error);
            }
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                const userPos = new window.naver.maps.LatLng(latitude, longitude);
                new window.naver.maps.Marker({
                    position: userPos,
                    map: map,
                    zIndex: 100,
                    icon: {
                        content: `<div style="background:#4285F4; width:16px; height:16px; border-radius:50%; border:3px solid white; box-shadow:0 0 0 2px #4285F4, 0 4px 8px rgba(0,0,0,0.4);"></div>`,
                        anchor: new window.naver.maps.Point(8, 8)
                    }
                });
                map.setCenter(userPos);
            }, (error) => {
                console.warn("Geolocation failed", error);
            });
        }

        fetchStores();
    }, [passedBrands, i18n.language]);

    useEffect(() => {
        if (showToast) {
            const timer = setTimeout(() => setShowToast(""), 3000);
            return () => clearTimeout(timer);
        }
    }, [showToast]);

    return (
        <div className="flex-1 flex flex-col bg-gray-50 relative h-full">
            {/* Header */}
            <div className="bg-white px-4 py-3 flex items-center gap-3 border-b border-gray-100 z-10 shadow-sm">
                <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded-full">
                    <ChevronLeft className="w-6 h-6 text-gray-800" />
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-bold text-gray-900">{t('map.title')}</h1>
                </div>
            </div>

            {/* Item Switcher */}
            {items.length > 0 && (
                <div className="flex gap-2 overflow-x-auto p-3 bg-white border-b border-gray-100 z-10 scrollbar-hide">
                    {items.map((item: any, i: number) => (
                        <div
                            key={i}
                            onClick={() => handleItemClick(item, i)}
                            className={`relative flex-shrink-0 text-center cursor-pointer rounded-lg p-1 transition-all
                                ${selectedItemIndex === i
                                    ? "border-2 border-pink-500 bg-pink-50"
                                    : "border-2 border-transparent"}`}
                        >
                            <img src={item.image} className="w-16 h-16 rounded-lg object-cover mx-auto" alt={item.name} />
                            <p className="text-xs mt-1 text-gray-500">{item.brand}</p>
                            <p className="text-xs truncate w-16 mx-auto text-gray-800 font-medium">{item.name}</p>
                            {selectedItemIndex === i && (
                                <div className="absolute -top-1 -right-1 bg-pink-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-sm border border-white z-10">
                                    ✓
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Map */}
            <div ref={mapElement} className="flex-1 w-full bg-gray-200 z-0" />

            {/* Store Card */}
            {selectedStore && (
                <div className="absolute bottom-6 left-4 right-4 z-20 animate-in slide-in-from-bottom-5 duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl p-5 border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                                {stores.indexOf(selectedStore) === 0 && (
                                    <div className="mb-1">
                                        <span className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-sm">
                                            <Sparkles className="w-2.5 h-2.5" />
                                            {t('recommended')}
                                        </span>
                                    </div>
                                )}
                                {(() => {
                                    const names = getDisplayName(selectedStore.name.replace(/<b>|<\/b>/g, ''));
                                    return (
                                        <>
                                            <h3 className="text-xl font-black text-gray-900 leading-tight">{names.primary}</h3>
                                            {names.secondary && <p className="text-xs text-gray-400 font-medium">{names.secondary}</p>}
                                        </>
                                    );
                                })()}
                                <div className="flex items-center gap-1 text-gray-500 mt-2">
                                    <MapPin className="w-3.5 h-3.5 text-pink-500" />
                                    <span className="text-xs font-medium">{selectedStore.address}</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedStore(null)} className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-full text-gray-400 hover:text-gray-600">
                                &times;
                            </button>
                        </div>

                        <div className="grid grid-cols-4 gap-2 mt-4">
                            <button onClick={() => setShowTaxiModal(true)} className="bg-gray-900 text-white font-bold py-3.5 rounded-2xl flex flex-col items-center justify-center active:scale-95 transition-all">
                                <Sparkles className="w-4 h-4 text-yellow-400 mb-0.5" />
                                <span className="text-[9px] uppercase tracking-tighter">Taxi</span>
                            </button>
                            <button onClick={() => handleKakaoTaxi(selectedStore)} className="bg-[#FAE100] text-[#3C1E1E] font-bold py-3.5 rounded-2xl flex flex-col items-center justify-center active:scale-95 transition-all">
                                <span className="text-xs font-black">T</span>
                                <span className="text-[9px] uppercase tracking-tighter">Kakao</span>
                            </button>
                            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedStore.name.replace(/<b>|<\/b>/g, ''))}`} target="_blank" rel="noreferrer" className="bg-white border border-gray-100 text-gray-700 font-bold py-3.5 rounded-2xl flex flex-col items-center justify-center active:scale-95 transition-all shadow-sm">
                                <img src="https://www.google.com/favicon.ico" alt="G" className="w-4 h-4" />
                                <span className="text-[9px] uppercase tracking-tighter">Google</span>
                            </a>
                            <a href={selectedStore.naverLink || `https://map.naver.com/v5/search/${encodeURIComponent(selectedStore.name.replace(/<b>|<\/b>/g, ''))}`} target="_blank" rel="noreferrer" className="bg-[#03C75A] text-white font-bold py-3.5 rounded-2xl flex flex-col items-center justify-center active:scale-95 transition-all shadow-sm">
                                <span className="font-serif font-black">N</span>
                                <span className="text-[9px] uppercase tracking-tighter">Naver</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Taxi Modal */}
            {showTaxiModal && selectedStore && (
                <div className="fixed inset-0 bg-white z-[100] p-8 flex flex-col items-center justify-center text-center animate-fade-in overflow-y-auto">
                    <p className="text-pink-500 font-bold text-sm mb-2 uppercase tracking-widest">{t('shhow_to_driver', 'Foreigner-Friendly Guide')}</p>
                    <h2 className="text-3xl font-black text-black leading-tight mb-8">택시 기사님,<br />여기로 가주세요!</h2>
                    <div className="w-full bg-gray-50 p-8 rounded-[40px] border-2 border-dashed border-gray-200 mb-8 shadow-inner">
                        <h3 className="text-3xl font-black text-black mb-4 break-keep">{selectedStore.name.replace(/<b>|<\/b>/g, '')}</h3>
                        <p className="text-xl font-bold text-gray-700 leading-relaxed break-keep">{selectedStore.address}</p>
                    </div>
                    <button onClick={() => speakKorean(`택시 기사님, 여기로 가주세요. ${selectedStore.name.replace(/<b>|<\/b>/g, '')}, ${selectedStore.address}`)} className="bg-black text-white font-black px-10 py-5 rounded-full mb-10 flex items-center gap-3 shadow-xl active:scale-95 transition-all">
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                        {t('show_to_driver', '🔊 Korean Audio Guide')}
                    </button>
                    <button onClick={() => setShowTaxiModal(false)} className="text-gray-400 font-bold hover:text-gray-600 transition-colors uppercase tracking-widest text-sm">
                        {t('cancel', 'Close')}
                    </button>
                </div>
            )}

            {showToast && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[60] bg-gray-900/90 text-white px-6 py-3 rounded-full text-sm font-bold shadow-2xl backdrop-blur-md animate-in fade-in zoom-in duration-300">
                    {showToast}
                </div>
            )}
        </div>
    );
};

export default MapPage;
