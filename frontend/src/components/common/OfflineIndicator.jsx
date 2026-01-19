import React, { useState, useEffect } from 'react';
import '../../assets/styles/Common/common.css';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Mostrar mensaje de reconexión por 3 segundos
      setShowIndicator(true);
      setTimeout(() => setShowIndicator(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Ocultar automáticamente después de 5 segundos si está online
    if (isOnline && showIndicator) {
      const timer = setTimeout(() => {
        setShowIndicator(false);
      }, 5000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline, showIndicator]);

  if (!showIndicator) return null;

  return (
    <div className={`offline-indicator ${isOnline ? 'online' : 'offline'}`}>
      <div className="offline-indicator-content">
        <div className="offline-indicator-icon">
          {isOnline ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M5 12L10 17L19 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18.364 5.63604C21.8787 9.15076 21.8787 14.8492 18.364 18.3639M6.343 6.34303C2.952 9.73403 2.952 15.266 6.343 18.657M8.49 8.49003C6.366 10.614 6.366 14.386 8.49 16.51M15.51 8.49003C17.634 10.614 17.634 14.386 15.51 16.51M12 12H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <div className="offline-indicator-text">
          {isOnline ? 'Conexión restablecida' : 'Sin conexión a internet'}
        </div>
        <button 
          className="offline-indicator-close"
          onClick={() => setShowIndicator(false)}
          aria-label="Cerrar notificación"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default OfflineIndicator;