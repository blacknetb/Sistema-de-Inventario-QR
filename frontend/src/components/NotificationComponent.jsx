// Componente para mostrar notificaciones
import React, { useEffect, useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import '../assets/styles/context/context.css';

const NotificationComponent = () => {
    const { notifications, removeNotification } = useNotification();
    const [progressBars, setProgressBars] = useState({});

    useEffect(() => {
        const newProgressBars = {};
        notifications.forEach(notification => {
            if (!progressBars[notification.id]) {
                newProgressBars[notification.id] = 100;
            }
        });
        setProgressBars(prev => ({ ...prev, ...newProgressBars }));
    }, [notifications]);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgressBars(prev => {
                const newProgress = {};
                Object.keys(prev).forEach(id => {
                    newProgress[id] = Math.max(0, prev[id] - 0.2);
                });
                return newProgress;
            });
        }, 10);

        return () => clearInterval(interval);
    }, []);

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'success':
                return '✓';
            case 'error':
                return '✕';
            case 'warning':
                return '⚠';
            case 'info':
                return 'ⓘ';
            default:
                return 'ⓘ';
        }
    };

    if (notifications.length === 0) {
        return null;
    }

    return (
        <div className="notification-container">
            {notifications.map(notification => (
                <div
                    key={notification.id}
                    className={`notification ${notification.type}`}
                >
                    <div className="notification-header">
                        <div className="notification-title">
                            <span className="icon">
                                {getNotificationIcon(notification.type)}
                            </span>
                            {notification.title}
                        </div>
                        <button
                            className="notification-close"
                            onClick={() => removeNotification(notification.id)}
                        >
                            ×
                        </button>
                    </div>
                    <div className="notification-body">
                        {notification.message}
                    </div>
                    <div className="notification-progress">
                        <div 
                            className="notification-progress-bar"
                            style={{ width: `${progressBars[notification.id] || 0}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default NotificationComponent;