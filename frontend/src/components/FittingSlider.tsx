import React, { useState, useRef, useEffect } from 'react';
import { Divide } from 'lucide-react';

interface FittingSliderProps {
    originalImage: string;
    generatedImage: string;
}

const FittingSlider: React.FC<FittingSliderProps> = ({ originalImage, generatedImage }) => {
    const [sliderPosition, setSliderPosition] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const handleMove = (clientX: number) => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
            const percentage = (x / rect.width) * 100;
            setSliderPosition(percentage);
        }
    };

    const onMouseDown = () => { isDragging.current = true; };
    const onMouseUp = () => { isDragging.current = false; };
    const onMouseMove = (e: React.MouseEvent) => {
        if (isDragging.current) handleMove(e.clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        handleMove(e.touches[0].clientX);
    };

    useEffect(() => {
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('touchend', onMouseUp);
        return () => {
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('touchend', onMouseUp);
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full min-h-[500px] overflow-hidden rounded-2xl cursor-col-resize select-none border border-gray-200 shadow-inner bg-gray-100"
            onMouseMove={onMouseMove}
            onMouseDown={onMouseDown}
            onTouchMove={onTouchMove}
        >
            {/* Generated Image (After) - Background */}
            <img
                src={generatedImage}
                alt="After"
                className="absolute top-0 left-0 w-full h-full object-contain"
            />

            {/* Original Image (Before) - Foreground, clipped */}
            <div
                className="absolute top-0 left-0 h-full w-full overflow-hidden border-r-2 border-white"
                style={{ width: `${sliderPosition}%` }}
            >
                <img
                    src={originalImage}
                    alt="Before"
                    className="absolute top-0 left-0 w-full h-full object-contain max-w-none"
                    // Important: width must match parent container width to align perfectly
                    style={{ width: containerRef.current?.getBoundingClientRect().width || '100%' }}
                />
            </div>

            {/* Slider Handle */}
            <div
                className="absolute top-0 bottom-0 w-auto transform -translate-x-1/2 z-20 flex items-center justify-center pointer-events-none"
                style={{ left: `${sliderPosition}%` }}
            >
                <div className="w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center border-2 border-gray-100">
                    <Divide className="w-5 h-5 text-black rotate-90" />
                </div>
            </div>

            {/* Labels */}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold pointer-events-none z-10">
                Original
            </div>
            <div className="absolute top-4 right-4 bg-primary/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold pointer-events-none z-10">
                Virtual Fit
            </div>
        </div>
    );
};

export default FittingSlider;
