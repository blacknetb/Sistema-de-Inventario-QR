// Contexto de notificaciones
import React, { createContext, useState, useContext, useCallback } from 'react';

// Crear el contexto de notificaciones
export const notificationContext = createContext();

// Tipos de notificaciones
const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

// Tiempo de vida de las notificaciones (ms)
const NOTIFICATION_LIFETIME = 5000;

// Proveedor del contexto de notificaciones
export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [notificationCount, setNotificationCount] = useState(0);

    // Agregar notificación
    const addNotification = useCallback((message, type = NOTIFICATION_TYPES.INFO, title = '') => {
        const id = Date.now();
        const newNotification = {
            id,
            title,
            message,
            type,
            timestamp: new Date().toISOString()
        };

        setNotifications(prev => [newNotification, ...prev]);
        setNotificationCount(prev => prev + 1);

        // Auto-remover notificación después del tiempo definido
        setTimeout(() => {
            removeNotification(id);
        }, NOTIFICATION_LIFETIME);

        return id;
    }, []);

    // Métodos específicos para cada tipo de notificación
    const showSuccess = useCallback((message, title = 'Éxito') => {
        return addNotification(message, NOTIFICATION_TYPES.SUCCESS, title);
    }, [addNotification]);

    const showError = useCallback((message, title = 'Error') => {
        return addNotification(message, NOTIFICATION_TYPES.ERROR, title);
    }, [addNotification]);

    const showWarning = useCallback((message, title = 'Advertencia') => {
        return addNotification(message, NOTIFICATION_TYPES.WARNING, title);
    }, [addNotification]);

    const showInfo = useCallback((message, title = 'Información') => {
        return addNotification(message, NOTIFICATION_TYPES.INFO, title);
    }, [addNotification]);

    // Remover notificación específica
    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
        setNotificationCount(prev => prev - 1);
    }, []);

    // Remover todas las notificaciones
    const clearAll = useCallback(() => {
        setNotifications([]);
        setNotificationCount(0);
    }, []);

    // Marcar todas como leídas
    const markAllAsRead = useCallback(() => {
        setNotificationCount(0);
    }, []);

    // Obtener notificaciones no leídas
    const getUnreadCount = useCallback(() => {
        return notificationCount;
    }, [notificationCount]);

    // Obtener notificaciones recientes
    const getRecentNotifications = useCallback((limit = 5) => {
        return notifications.slice(0, limit);
    }, [notifications]);

    // Valor del contexto
    const value = {
        notifications,
        notificationCount,
        NOTIFICATION_TYPES,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        removeNotification,
        clearAll,
        markAllAsRead,
        getUnreadCount,
        getRecentNotifications
    };

    return (
        <notificationContext.Provider value={value}>
            {children}
        </notificationContext.Provider>
    );
};

// Hook personalizado para usar el contexto de notificaciones
export const useNotification = () => {
    const context = useContext(notificationContext);
    if (!context) {
        throw new Error('useNotification debe ser usado dentro de NotificationProvider');
    }
    return context;
};