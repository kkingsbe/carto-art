"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CarouselProps {
    images: string[];
    aspectRatio?: "video" | "square" | "wide";
    fit?: "cover" | "contain";
    className?: string;
}

export function Carousel({
    images,
    aspectRatio = "video",
    fit = "cover",
    className = "",
}: CarouselProps) {
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [direction, setDirection] = React.useState(0);

    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0,
        }),
    };

    const swipeConfidenceThreshold = 10000;
    const swipePower = (offset: number, velocity: number) => {
        return Math.abs(offset) * velocity;
    };

    const paginate = (newDirection: number) => {
        setDirection(newDirection);
        setCurrentIndex((prevIndex) => {
            let nextIndex = prevIndex + newDirection;
            if (nextIndex < 0) nextIndex = images.length - 1;
            if (nextIndex >= images.length) nextIndex = 0;
            return nextIndex;
        });
    };

    const aspectRatioClass = {
        video: "aspect-video",
        square: "aspect-square",
        wide: "aspect-[21/9]",
    }[aspectRatio];

    return (
        <div className={`relative group w-full overflow-hidden rounded-xl bg-muted ${aspectRatioClass} ${className}`}>
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div
                    key={currentIndex}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 },
                    }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={1}
                    onDragEnd={(e, { offset, velocity }) => {
                        const swipe = swipePower(offset.x, velocity.x);

                        if (swipe < -swipeConfidenceThreshold) {
                            paginate(1);
                        } else if (swipe > swipeConfidenceThreshold) {
                            paginate(-1);
                        }
                    }}
                    className="absolute inset-0 w-full h-full"
                >
                    <Image
                        src={images[currentIndex]}
                        alt={`Slide ${currentIndex + 1}`}
                        fill
                        className={`object-${fit}`}
                        priority={currentIndex === 0}
                    />
                </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none">
                <button
                    onClick={() => paginate(-1)}
                    className="p-2 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-colors pointer-events-auto z-10"
                    aria-label="Previous slide"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                    onClick={() => paginate(1)}
                    className="p-2 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-colors pointer-events-auto z-10"
                    aria-label="Next slide"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>

            {/* Indicators */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                {images.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => {
                            setDirection(idx > currentIndex ? 1 : -1);
                            setCurrentIndex(idx);
                        }}
                        className={`w-2.5 h-2.5 rounded-full transition-colors ${idx === currentIndex ? "bg-white" : "bg-white/50 hover:bg-white/80"
                            }`}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
