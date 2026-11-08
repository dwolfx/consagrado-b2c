import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Carousel.css';

const Carousel = ({
    items = [],
    renderItem,
    autoPlay = false,
    interval = 4000,
    showDots = true,
    showArrows = true,
    className = ''
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const trackRef = useRef(null);

    const scrollToSlide = useCallback((index) => {
        if (!trackRef.current || items.length === 0) return;
        const normalizedIndex = Math.max(0, Math.min(index, items.length - 1));
        const slideWidth = trackRef.current.clientWidth;
        if (typeof trackRef.current.scrollTo === 'function') {
            trackRef.current.scrollTo({
                left: normalizedIndex * slideWidth,
                behavior: 'smooth'
            });
        } else {
            trackRef.current.scrollLeft = normalizedIndex * slideWidth;
        }
        setCurrentIndex(normalizedIndex);
    }, [items.length]);

    const handleNext = useCallback(() => {
        const next = (currentIndex + 1) % items.length;
        scrollToSlide(next);
    }, [currentIndex, items.length, scrollToSlide]);

    const handlePrev = useCallback(() => {
        const prev = (currentIndex - 1 + items.length) % items.length;
        scrollToSlide(prev);
    }, [currentIndex, items.length, scrollToSlide]);

    useEffect(() => {
        if (!autoPlay || items.length <= 1) return;
        const timer = setInterval(handleNext, interval);
        return () => clearInterval(timer);
    }, [autoPlay, interval, items.length, handleNext]);

    if (!items || items.length === 0) return null;

    return (
        <div className={`ui-carousel-container ${className}`} role="region" aria-roledescription="carrossel">
            {showArrows && items.length > 1 && (
                <button
                    type="button"
                    className="ui-carousel-nav-btn ui-carousel-prev"
                    onClick={handlePrev}
                    aria-label="Slide anterior"
                >
                    <ChevronLeft size={18} />
                </button>
            )}

            <div
                ref={trackRef}
                className="ui-carousel-track-wrapper"
            >
                {items.map((item, index) => (
                    <div
                        key={item.id || index}
                        className="ui-carousel-slide"
                        role="group"
                        aria-roledescription="slide"
                        aria-label={`${index + 1} de ${items.length}`}
                    >
                        {renderItem ? renderItem(item, index) : item}
                    </div>
                ))}
            </div>

            {showArrows && items.length > 1 && (
                <button
                    type="button"
                    className="ui-carousel-nav-btn ui-carousel-next"
                    onClick={handleNext}
                    aria-label="Próximo slide"
                >
                    <ChevronRight size={18} />
                </button>
            )}

            {showDots && items.length > 1 && (
                <div className="ui-carousel-dots" role="tablist" aria-label="Indicadores do carrossel">
                    {items.map((item, index) => (
                        <button
                            key={item.id || index}
                            type="button"
                            role="tab"
                            aria-selected={index === currentIndex}
                            aria-label={`Ir para slide ${index + 1}`}
                            className={`ui-carousel-dot ${index === currentIndex ? 'ui-active' : ''}`}
                            onClick={() => scrollToSlide(index)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Carousel;
