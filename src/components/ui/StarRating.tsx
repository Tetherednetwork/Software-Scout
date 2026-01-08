import React from 'react';
import { StarIcon } from './Icons';

interface StarRatingProps {
    rating: number;
    setRating?: (rating: number) => void;
    size?: 'sm' | 'md' | 'lg';
}

const StarRating: React.FC<StarRatingProps> = ({ rating, setRating, size = 'md' }) => {
    const isInteractive = !!setRating;
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
    };

    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => isInteractive && setRating(star)}
                    onMouseOver={() => isInteractive && setRating(star)}
                    className={`transition-colors ${
                        isInteractive ? 'cursor-pointer' : 'cursor-default'
                    } ${
                        star <= rating
                            ? 'text-yellow-400'
                            : 'text-gray-300 dark:text-gray-600'
                    } ${isInteractive ? 'hover:text-yellow-400' : ''}`}
                    aria-label={`Rate ${star} out of 5 stars`}
                    disabled={!isInteractive}
                >
                    <StarIcon className={sizeClasses[size]} filled={star <= rating} />
                </button>
            ))}
        </div>
    );
};

export default StarRating;