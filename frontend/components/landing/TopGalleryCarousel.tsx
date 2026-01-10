'use client';

import { useRef, useState, useEffect } from 'react';
import { MapCard } from '@/components/feed/MapCard';
import type { FeedMap } from '@/lib/actions/feed';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopGalleryCarouselProps {
    maps: FeedMap[];
}

export function TopGalleryCarousel({ maps }: TopGalleryCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [itemsPerSlide, setItemsPerSlide] = useState(3);
    const [maxIndex, setMaxIndex] = useState(0);

    // Update items per slide based on screen width
    useEffect(() => {
        const handleResize = () => {
            const perSlide = window.innerWidth < 768 ? 1 : 3;
            setItemsPerSlide(perSlide);
            // Recalculate max index when items per slide changes
            setMaxIndex(Math.ceil(maps.length / perSlide) - 1);
        };

        // Initial call
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [maps.length]);

    // Ensure currentIndex stays within bounds if resized
    useEffect(() => {
        if (currentIndex > maxIndex) {
            setCurrentIndex(maxIndex > 0 ? maxIndex : 0);
        }
    }, [maxIndex, currentIndex]);


    const nextSlide = () => {
        setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
    };

    if (!maps || maps.length === 0) return null;

    return (
        <div className="relative group w-full max-w-7xl mx-auto">
            {/* Scroll Controls */}
            <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 transition-all opacity-0 group-hover:opacity-100 -translate-x-1/2 md:-translate-x-12 translate-x-4 disabled:opacity-0 focus:opacity-100"
                aria-label="Previous slide"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>

            <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 transition-all opacity-0 group-hover:opacity-100 translate-x-1/2 md:translate-x-12 -translate-x-4 disabled:opacity-0 focus:opacity-100"
                aria-label="Next slide"
            >
                <ChevronRight className="w-6 h-6" />
            </button>

            {/* Carousel Container */}
            <div className="overflow-hidden px-1 py-4">
                <div
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{
                        transform: `translateX(-${currentIndex * 100}%)`,
                    }}
                >
                    {Array.from({ length: Math.ceil(maps.length / itemsPerSlide) }).map((_, pageIndex) => {
                        // Create a "slide" group
                        const startIndex = pageIndex * itemsPerSlide;
                        const slideMaps = maps.slice(startIndex, startIndex + itemsPerSlide);

                        return (
                            <div key={pageIndex} className="flex-none w-full grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 px-2 md:px-0">
                                {slideMaps.map((map, index) => (
                                    <div key={map.id} className="w-full">
                                        <MapCard map={map} index={index} />
                                    </div>
                                ))}
                                {/* Fill empty spots if last slide is incomplete (desktop only) */}
                                {itemsPerSlide === 3 && slideMaps.length < 3 && (
                                    Array.from({ length: 3 - slideMaps.length }).map((_, i) => (
                                        <div key={`empty-${i}`} className="hidden md:block w-full" />
                                    ))
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Pagination Dots */}
            <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={cn(
                            "w-2.5 h-2.5 rounded-full transition-all duration-300",
                            currentIndex === idx
                                ? "bg-[#c9a962] w-8"
                                : "bg-white/20 hover:bg-white/40"
                        )}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
