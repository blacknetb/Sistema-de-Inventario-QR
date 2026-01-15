// Contexto principal de la aplicación
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authContext } from './AuthContext';
import { inventoryContext } from './InventoryContext';
import { notificationContext } from './NotificationContext';

// Crear el contexto principal
export const AppContext = createContext();

// Proveedor del contexto principal
export const AppProvider = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [appError, setAppError] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [currentView, setCurrentView] = useState('dashboard');
    const [theme, setTheme] = useState('light');

    // Obtener valores de los sub-contextos
    const auth = useContext(authContext);
    const inventory = useContext(inventoryContext);
    const notification = useContext(notificationContext);

    // Efecto para inicialización
    useEffect(() => {
        const initializeApp = async () => {
            try {
                // Verificar autenticación
                await auth.checkAuth();
                
                // Cargar datos iniciales si está autenticado
                if (auth.isAuthenticated) {
                    await inventory.loadInitialData();
                }
                
                setLoading(false);
            } catch (error) {
                setAppError('Error al inicializar la aplicación');
                setLoading(false);
                notification.showError('Error al cargar la aplicación');
            }
        };

        initializeApp();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Cambiar tema
    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('inventory-theme', newTheme);
        notification.showSuccess(`Tema cambiado a ${newTheme}`);
    };

    // Cambiar vista
    const changeView = (view) => {
        setCurrentView(view);
    };

    // Limpiar errores
    const clearError = () => {
        setAppError(null);
    };

    // Reiniciar aplicación
    const resetApp = () => {
        setLoading(true);
        setAppError(null);
        auth.logout();
        notification.clearAll();
    };

    // Valor del contexto
    const value = {
        loading,
        appError,
        sidebarCollapsed,
        currentView,
        theme,
        setSidebarCollapsed,
        changeView,
        toggleTheme,
        clearError,
        resetApp,
        // Sub-contextos
        auth,
        inventory,
        notification
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

// Hook personalizado para usar el contexto
export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp debe ser usado dentro de AppProvider');
    }
    return context;
};