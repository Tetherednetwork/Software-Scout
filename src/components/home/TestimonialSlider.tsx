import React, { useState, useEffect, useCallback } from 'react';
import { getApprovedTestimonials } from '../../services/testimonialService';
import type { Testimonial } from '../../types';
import StarRating from '../ui/StarRating';
import { ChevronLeftIcon, ChevronRightIcon } from '../ui/Icons';

const TestimonialSlider: React.FC = () => {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchTestimonials = async () => {
            try {
                const data = await getApprovedTestimonials();
                setTestimonials(data);
            } catch (error) {
                console.error("Failed to fetch testimonials:", error);
            }
        };
        fetchTestimonials();
    }, []);

    const nextSlide = useCallback(() => {
        setCurrentIndex(prev => (prev === testimonials.length - 1 ? 0 : prev + 1));
    }, [testimonials.length]);

    const prevSlide = () => {
        setCurrentIndex(prev => (prev === 0 ? testimonials.length - 1 : prev - 1));
    };

    useEffect(() => {
        if (testimonials.length > 1) {
            const slideInterval = setInterval(nextSlide, 7000); // Auto-scroll every 7 seconds
            return () => clearInterval(slideInterval);
        }
    }, [testimonials.length, nextSlide]);

    if (testimonials.length === 0) {
        return null; // Don't render anything if there are no testimonials
    }

    return (
        <div className="w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 relative overflow-hidden min-h-[150px]">
            <div className="flex testimonial-slider-inner" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                {testimonials.map((testimonial) => (
                    <div key={testimonial.id} className="flex-shrink-0 w-full p-2">
                        <div className="flex items-center gap-3 mb-2">
                            <img src={testimonial.author?.avatar_url} alt="user avatar" className="w-10 h-10 rounded-full object-cover" />
                            <div>
                                <p className="font-semibold text-gray-800 dark:text-white">{testimonial.author?.username}</p>
                                <StarRating rating={testimonial.rating} size="sm" />
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-white leading-relaxed line-clamp-3">
                            "{testimonial.content}"
                        </p>
                    </div>
                ))}
            </div>
            
            {testimonials.length > 1 && (
                 <>
                    <button onClick={prevSlide} className="absolute left-1 top-1/2 -translate-y-1/2 p-1 bg-white/50 dark:bg-gray-700/50 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-colors">
                        <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    <button onClick={nextSlide} className="absolute right-1 top-1/2 -translate-y-1/2 p-1 bg-white/50 dark:bg-gray-700/50 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-colors">
                        <ChevronRightIcon className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`testimonial-dot h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600 transition-all duration-300 ${currentIndex === index ? 'active' : ''}`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default TestimonialSlider;
