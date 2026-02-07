import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';

const NotificationPopup = ({ notification, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (notification) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(onClose, 300); // Wait for exit animation
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [notification, onClose]);

    if (!notification && !isVisible) return null;

    const isSuccess = notification?.type === 'success';

    return (
        <div className={`fixed top-24 right-4 z-[9999] transition-all duration-300 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
            <div className={`
                flex items-start p-4 bg-white border-l-4 shadow-lg w-80 relative overflow-hidden
                ${isSuccess ? 'border-vin-blue' : 'border-vin-red'}
            `}>
                <div className={`
                    absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none
                    ${isSuccess ? 'bg-vin-blue' : 'bg-vin-red'}
                `}></div>

                <div className="mr-3 flex-shrink-0">
                    {isSuccess ? (
                        <CheckCircle className="w-5 h-5 text-vin-blue" />
                    ) : (
                        <AlertTriangle className="w-5 h-5 text-vin-red" />
                    )}
                </div>

                <div className="flex-1 mr-2">
                    <h3 className={`text-sm font-bold uppercase tracking-wider mb-1 ${isSuccess ? 'text-vin-blue' : 'text-vin-red'}`}>
                        {isSuccess ? 'THÀNH CÔNG' : 'LỖI'}
                    </h3>
                    <p className="text-xs font-medium text-vin-dark leading-relaxed">
                        {notification?.message}
                    </p>
                </div>

                <button
                    onClick={() => setIsVisible(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default NotificationPopup;
