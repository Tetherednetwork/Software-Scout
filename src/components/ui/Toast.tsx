import React, { useEffect } from 'react';
import { SuccessIcon } from './Icons';

interface ToastProps {
    message: string;
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000); // Auto-close after 3 seconds

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed bottom-5 right-5 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in-up z-[100]">
            <SuccessIcon className="h-6 w-6" />
            <span>{message}</span>
             <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default Toast;
