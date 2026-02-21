import React, { createContext, useState, useContext, useCallback } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';

const LoadingContext = createContext();

export const useLoading = () => {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error('useLoading debe usarse dentro de un LoadingProvider');
    }
    return context;
};

export const LoadingProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);
    const [loadingCount, setLoadingCount] = useState(0);
    const [loadingText, setLoadingText] = useState('');

    const showLoading = useCallback((text = 'Cargando...') => {
        setLoadingCount(prev => {
            const newCount = prev + 1;
            setLoading(true);
            setLoadingText(text);
            return newCount;
        });
    }, []);

    const hideLoading = useCallback(() => {
        setLoadingCount(prev => {
            const newCount = Math.max(0, prev - 1);
            if (newCount === 0) {
                setLoading(false);
                setLoadingText('');
            }
            return newCount;
        });
    }, []);

    const withLoading = useCallback(async (promise, text = 'Cargando...') => {
        try {
            showLoading(text);
            return await promise;
        } finally {
            hideLoading();
        }
    }, [showLoading, hideLoading]);

    const value = {
        loading,
        loadingText,
        showLoading,
        hideLoading,
        withLoading
    };

    return (
        <LoadingContext.Provider value={value}>
            {children}
            {loading && (
                <LoadingSpinner
                    fullPage
                    overlay
                    text={loadingText}
                    size="large"
                />
            )}
        </LoadingContext.Provider>
    );
};

LoadingProvider.propTypes = {
    children: PropTypes.node.isRequired
};