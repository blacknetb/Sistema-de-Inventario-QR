import React, { useEffect } from 'react';
import { useNotification } from '../NotificationContainer';
import styles from './NotificationContainer.module.css';

const NotificationContainer = () => {
    const { notifications, removeNotification } = useNotification();

    useEffect(() => {
        notifications.forEach(notification => {
            if (notification.duration) {
                const timer = setTimeout(() => {
                    removeNotification(notification.id);
                }, notification.duration);
                
                return () => clearTimeout(timer);
            }
        });
    }, [notifications, removeNotification]);

    const getIcon = (type) => {
        switch (type) {
            case 'success':
                return '✅';
            case 'error':
                return '❌';
            case 'warning':
                return '⚠️';
            case 'info':
                return 'ℹ️';
            default:
                return '📢';
        }
    };

    return (
        <div className={styles.container}>
            {notifications.map(notification => (
                <div
                    key={notification.id}
                    className={`${styles.notification} ${styles[notification.type]}`}
                    role="alert"
                >
                    <div className={styles.icon}>
                        {getIcon(notification.type)}
                    </div>
                    <div className={styles.content}>
                        <p className={styles.message}>{notification.message}</p>
                        {notification.description && (
                            <p className={styles.description}>{notification.description}</p>
                        )}
                    </div>
                    <button
                        className={styles.closeButton}
                        onClick={() => removeNotification(notification.id)}
                        aria-label="Cerrar notificación"
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
};

export default NotificationContainer;