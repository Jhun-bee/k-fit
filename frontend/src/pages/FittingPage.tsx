import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Camera, Share2, MapPin, Loader2, Sparkles, Link, Heart } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { API_BASE_URL } from '../api/apiClient';
import FittingMiniGame from '../components/FittingMiniGame';

const FittingPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    // Props passed from navigation
    const { outfit, items, mode = 'full', selectedItem } = location.state || {}; // mode: 'single' | 'full'

    useEffect(() => {
        if (!location.state) {
            console.log("[fitting] No state found, redirecting...");
            navigate('/recommend');
        }
    }, [location.state, navigate]);

    // Use selectedItem if mode is single, otherwise outfit's items
    const targetItems = items || (mode === 'single' && selectedItem ? [selectedItem] : (outfit?.items || []));

    console.log("[fitting] Received items:", targetItems);

    const [userImage, setUserImage] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [sliderValue, setSliderValue] = useState(50);
    const [loading, setLoading] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isWishlisted, setIsWishlisted] = useState(false);

    // API
    const fittingApi = useApi<any>('/api/fitting/try-on');

    useEffect(() => {
        // Check if current outfit is already wishlisted
        const wishlistStr = localStorage.getItem('hanmeot_wishlist');
        if (wishlistStr && outfit) {
            const wishlist = JSON.parse(wishlistStr);
            const exists = wishlist.some((item: any) => item.id === outfit.id);
            setIsWishlisted(exists);
        }
    }, [outfit]);

    const getItemImage = (item: any) => {
        if (item.displayImage) return item.displayImage;
        if (item.image_url) {
            if (item.image_url.startsWith('/api/')) {
                return `${API_BASE_URL}${item.image_url}`;
            }
            return item.image_url;
        }
        const brand = item.store_name || item.brand || '';
        const gender = localStorage.getItem('hanmeot_gender') || '';
        return `${API_BASE_URL}/api/placeholder/image?text=${encodeURIComponent(item.name)}&brand=${encodeURIComponent(brand)}&w=400&h=400&gender=${gender}`;
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setUserImage(ev.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const [retryMessage, setRetryMessage] = useState<string | null>(null);
    const [errorState, setErrorState] = useState<boolean>(false);

    const generateFit = async (retryCount = 0) => {
        if (!userImage) return;

        setLoading(true);
        if (retryCount === 0) {
            setResultImage(null);
            setElapsedTime(0);
            setRetryMessage(null);
        }

        try {
            const result = await fittingApi.execute({
                method: 'POST',
                data: {
                    user_image: userImage,
                    outfit_items: targetItems.map((item: any) => ({
                        type: item.type || 'top', // Default fallback
                        name: item.name,
                        image_url: item.image_url,
                        store_name: item.store_name || item.brand // Ensure brand is passed for image search
                    })),
                    language: i18n.language
                }
            });

            if (result && result.generated_image) {
                // Determine prefix if missing
                const prefix = result.generated_image.startsWith('data:image') ? '' : 'data:image/png;base64,';
                setResultImage(`${prefix}${result.generated_image}`);
                setLoading(false); // Success
            }
        } catch (error: any) {
            console.error("Fitting failed", error);

            // Check for rate limit or service unavailable
            if (error.response?.status === 429 || error.response?.status === 503) {
                if (retryCount < 3) {
                    setRetryMessage(t('fitting.retry_wait', 'High traffic. Retrying in 5s...'));

                    // Countdown/Wait logic
                    await new Promise(resolve => setTimeout(resolve, 5000));

                    // Recursive retry
                    await generateFit(retryCount + 1);
                    return;
                } else {
                    alert(t('fitting.error_busy', 'Server is busy. Please try again later.'));
                }
            } else {
                // Other errors
                // alert(t('fitting.error_generic', 'Fitting failed. Please try again.'));
                setErrorState(true);
            }
            setLoading(false);
        }
    };

    useEffect(() => {
        let interval: any;
        if (loading) {
            setElapsedTime(0);
            interval = setInterval(() => setElapsedTime(p => p + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [loading]);

    const handleSave = () => {
        if (resultImage) {
            const link = document.createElement('a');
            link.href = resultImage;
            link.download = `han-meot-style-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleShare = async () => {
        if (resultImage) {
            try {
                // Convert base64 to blob for sharing
                const res = await fetch(resultImage);
                const blob = await res.blob();
                const file = new File([blob], "han-meot-style.png", { type: "image/png" });

                if (navigator.share) {
                    await navigator.share({
                        title: 'My Han-Meot Style',
                        text: 'Check out my new Korean style!',
                        files: [file]
                    });
                } else {
                    // Fallback to clipboard
                    await navigator.clipboard.write([
                        new ClipboardItem({ [blob.type]: blob })
                    ]);
                    alert(t('copied_to_clipboard', 'Image copied to clipboard!'));
                }
            } catch (err) {
                console.error("Share failed", err);
            }
        }
    };

    const handleWishlist = () => {
        if (!outfit) return;

        const wishlistStr = localStorage.getItem('hanmeot_wishlist');
        let wishlist = wishlistStr ? JSON.parse(wishlistStr) : [];

        if (isWishlisted) {
            // Remove
            wishlist = wishlist.filter((item: any) => item.id !== outfit.id);
            setIsWishlisted(false);
        } else {
            // Add
            wishlist.push(outfit);
            setIsWishlisted(true);
            // Simple toast/alert as requested
            alert(t('wishlist_added', 'Added to Wishlist!'));
        }
        localStorage.setItem('hanmeot_wishlist', JSON.stringify(wishlist));
    };

    const handleBack = () => {
        if (resultImage) {
            setResultImage(null);
            // Keep userImage so they can try again without re-uploading
        } else {
            navigate(-1);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-white relative">
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between shadow-sm z-10 sticky top-0 bg-white">
                <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-full">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="font-bold text-lg">
                    {mode === 'single' ? t('fitting.single_item', 'Item Fit') : t('fitting_room', 'Fitting Room')}
                </div>
                <div className="w-10"></div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center">
                {/* Context: What are we fitting? */}
                <div className="w-full mb-4">
                    <p className="text-center text-sm text-gray-500 mb-2">
                        {mode === 'single'
                            ? `Trying on: ${targetItems[0]?.name}`
                            : `Trying on full outfit (${targetItems.length} items)`}
                    </p>

                    {/* Preview Items */}
                    <div className="flex justify-center gap-2">
                        {targetItems.slice(0, 3).map((item: any, idx: number) => (
                            <div key={idx} className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                <img
                                    src={item.displayImage || item.image_url || getItemImage(item)}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ))}
                        {targetItems.length > 3 && (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-500">
                                +{targetItems.length - 3}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Visual */}
                <div className="w-full relative border-2 border-dashed border-gray-300 bg-gray-100 rounded-2xl overflow-hidden mb-6 flex items-center justify-center"
                    style={{ minHeight: '500px' }}>

                    {loading ? (
                        <div className="flex flex-col items-center gap-3 py-10 w-full h-full justify-center bg-white/80">
                            <FittingMiniGame />
                            <div className="mt-4 flex flex-col items-center">
                                <Loader2 className="w-6 h-6 animate-spin text-primary mb-1" />
                                <p className="text-xs text-gray-400">{elapsedTime}s elapsed</p>
                                {retryMessage ? (
                                    <p className="text-xs text-orange-500 font-bold mt-1 animate-pulse">{retryMessage}</p>
                                ) : (
                                    elapsedTime > 15 && <p className="text-xs text-orange-400 animate-pulse">Almost there...</p>
                                )}
                            </div>
                        </div>
                    ) : resultImage && userImage ? (
                        /* Before/After Slider */
                        <div className="relative w-full h-[500px]">
                            {/* After (Result) - Full Width */}
                            <img
                                src={resultImage}
                                className="absolute inset-0 w-full h-full object-contain bg-gray-50"
                                alt="Result"
                            />

                            {/* Before (Original) - Clipped by Slider */}
                            <div className="absolute inset-0 overflow-hidden border-r-2 border-white/50 shadow-xl" style={{ width: `${sliderValue}%` }}>
                                <img
                                    src={userImage}
                                    className="w-full h-full object-contain bg-gray-50"
                                    style={{ width: '100vw', maxWidth: '100%' }} // Hack to keep image aspect ratio correct within clipped div
                                    alt="Original"
                                />
                            </div>

                            {/* Slider Handle */}
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={sliderValue}
                                onChange={(e) => setSliderValue(Number(e.target.value))}
                                className="absolute bottom-4 left-4 right-4 z-20 accent-[#FF2D78] cursor-pointer"
                            />

                            <div className="absolute top-4 left-4 bg-black/50 text-white px-2 py-1 rounded text-xs font-bold pointer-events-none">Original</div>
                            <div className="absolute top-4 right-4 bg-[#FF2D78] text-white px-2 py-1 rounded text-xs font-bold shadow-lg flex items-center gap-1 pointer-events-none">
                                <Sparkles className="w-3 h-3" /> AI Fit
                            </div>
                        </div>
                    ) : userImage ? (
                        <div className="relative w-full h-[500px]">
                            <img src={userImage} className="w-full h-full object-contain" alt="User Upload" />
                            <button
                                onClick={() => setUserImage(null)}
                                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="text-center p-10 cursor-pointer w-full h-full flex flex-col items-center justify-center" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-3 hover:bg-gray-300 transition-colors">
                                <Camera className="w-8 h-8 text-gray-500" />
                            </div>
                            <p className="text-sm font-bold text-gray-700">{t('upload_photo', 'Upload Your Photo')}</p>
                            <p className="text-xs text-gray-400 mt-1">Full body shot works best</p>
                        </div>
                    )}

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleUpload}
                        accept="image/*"
                        className="hidden"
                    />
                </div>

                {/* Actions */}
                {resultImage ? (
                    <div className="w-full flex flex-col gap-3">
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={handleShare}
                                className="bg-white border-2 border-gray-200 py-3 rounded-xl font-bold flex flex-col items-center justify-center gap-1 hover:bg-gray-50 transition-colors text-xs"
                            >
                                <Share2 className="w-5 h-5 text-gray-700" />
                                {t('actions.share', 'Share')}
                            </button>
                            <button
                                onClick={handleWishlist}
                                className="bg-white border-2 border-gray-200 py-3 rounded-xl font-bold flex flex-col items-center justify-center gap-1 hover:bg-gray-50 transition-colors text-xs"
                            >
                                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-[#FF2D78] text-[#FF2D78]' : 'text-gray-700'}`} />
                                {isWishlisted ? t('actions.saved', 'Saved') : t('actions.wishlist', 'WishList')}
                            </button>
                            <button
                                onClick={handleSave}
                                className="bg-white border-2 border-gray-200 py-3 rounded-xl font-bold flex flex-col items-center justify-center gap-1 hover:bg-gray-50 transition-colors text-xs"
                            >
                                <Link className="w-5 h-5 text-gray-700" />
                                {t('actions.save', 'Save')}
                            </button>
                        </div>
                    </div>
                ) : (
                    userImage && !loading && (
                        <div className="w-full">
                            {errorState && (
                                <p className="text-center text-red-500 mb-2 text-sm font-bold">
                                    {t('fitting.error_failed', 'Fitting generation failed. Please try again.')}
                                </p>
                            )}
                            <button
                                onClick={() => generateFit(0)}
                                className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-colors flex items-center justify-center gap-2 ${errorState ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-pink-600'
                                    }`}
                            >
                                <Sparkles className="w-5 h-5" />
                                {errorState ? t('fitting.retry', 'Try Again') : t('magic_fit', 'Magic Fit')}
                            </button>
                        </div>
                    )
                )}
            </div>

            {/* Bottom Button Fixed in Container - ONLY SHOW WHEN RESULT EXISTS */}
            {resultImage && (
                <div className="p-4 bg-white border-t border-gray-100">
                    <button
                        onClick={() => {
                            const brands = [...new Set(targetItems.map((item: any) => item.store_name || item.brand || item.name))].filter(Boolean);
                            navigate('/map', { state: { brands } });
                        }}
                        className="w-full bg-[#FF2D78] text-white py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-md hover:bg-pink-600 transition-colors"
                    >
                        <MapPin className="w-5 h-5" />
                        {t('find_stores_nearby', 'Find Nearby Stores')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default FittingPage;
