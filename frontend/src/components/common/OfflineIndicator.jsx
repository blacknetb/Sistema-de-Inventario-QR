import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { clsx } from 'clsx';
import PropTypes from 'prop-types';
import "../../assets/styles/global.css";

/**
 * ✅ COMPONENTE OFFLINE INDICATOR CORREGIDO
 */

// ✅ COMPONENTE INLINE
const OfflineIndicatorInline = React.memo(({ showIcon = true, showText = true }) => {
  const [isOnline, setIsOnline] = useState(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    let mounted = true;

    const handleOnline = () => {
      if (mounted) setIsOnline(true);
    };

    const handleOffline = () => {
      if (mounted) setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      mounted = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      className="offline-inline"
      title="Sin conexión a internet"
      aria-label="Estado offline"
      data-testid="offline-inline-indicator"
    >
      {showIcon && <span className="offline-inline-icon" aria-hidden="true">⚠️</span>}
      {showText && <span className="offline-inline-text">Offline</span>}
    </div>
  );
});

OfflineIndicatorInline.displayName = 'OfflineIndicatorInline';
OfflineIndicatorInline.propTypes = {
  showIcon: PropTypes.bool,
  showText: PropTypes.bool,
};

// ✅ HOOK PARA ESTADO DE CONEXIÓN
export const useNetworkStatus = () => {
  const [networkState, setNetworkState] = useState(() => {
    if (typeof navigator === 'undefined') {
      return {
        isOnline: true,
        connectionType: null,
        effectiveType: null,
        downlink: null,
        rtt: null
      };
    }

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    return {
      isOnline: navigator.onLine,
      connectionType: connection ? connection.type : null,
      effectiveType: connection ? connection.effectiveType : null,
      downlink: connection ? connection.downlink : null,
      rtt: connection ? connection.rtt : null
    };
  });

  useEffect(() => {
    let mounted = true;

    const updateNetworkState = () => {
      if (!mounted) return;

      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      setNetworkState({
        isOnline: navigator.onLine,
        connectionType: connection ? connection.type : null,
        effectiveType: connection ? connection.effectiveType : null,
        downlink: connection ? connection.downlink : null,
        rtt: connection ? connection.rtt : null
      });
    };

    const handleConnectionChange = () => {
      updateNetworkState();
    };

    window.addEventListener('online', updateNetworkState);
    window.addEventListener('offline', updateNetworkState);
    
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      mounted = false;
      window.removeEventListener('online', updateNetworkState);
      window.removeEventListener('offline', updateNetworkState);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return useMemo(() => ({
    ...networkState,
    isSlowConnection: networkState.effectiveType === 'slow-2g' || networkState.effectiveType === '2g',
    isFastConnection: networkState.effectiveType === '4g',
    hasNetworkInfo: !!navigator.connection
  }), [networkState]);
};

// ✅ COMPONENTE DE CALIDAD DE CONEXIÓN
const ConnectionQualityIndicator = React.memo(() => {
  const networkStatus = useNetworkStatus();
  
  const connectionInfo = useMemo(() => {
    if (!networkStatus.isOnline) {
      return {
        className: 'connection-quality connection-quality-offline',
        dotClass: 'connection-quality-dot-offline',
        text: 'Offline'
      };
    }

    if (networkStatus.isSlowConnection) {
      return {
        className: 'connection-quality connection-quality-slow',
        dotClass: 'connection-quality-dot-slow',
        text: `Conexión lenta${networkStatus.connectionType ? ` (${networkStatus.connectionType})` : ''}`
      };
    }

    return {
      className: 'connection-quality connection-quality-good',
      dotClass: 'connection-quality-dot-good',
      text: networkStatus.effectiveType ? 
        `${networkStatus.effectiveType.toUpperCase()}${networkStatus.connectionType ? ` (${networkStatus.connectionType})` : ''}` : 
        'Online'
    };
  }, [networkStatus]);

  return (
    <div 
      className={connectionInfo.className}
      title={`Estado de conexión: ${connectionInfo.text}`}
      aria-label={`Calidad de conexión: ${connectionInfo.text}`}
      data-testid="connection-quality-indicator"
    >
      <span className={connectionInfo.dotClass} aria-hidden="true"></span>
      {connectionInfo.text}
    </div>
  );
});

ConnectionQualityIndicator.displayName = 'ConnectionQualityIndicator';

// ✅ COMPONENTE PRINCIPAL
const OfflineIndicator = ({
  showReconnectButton = true,
  autoCheckInterval = 5000,
  position = 'top',
  showRetryCount = true,
  className = ''
}) => {
  // ✅ REFERENCIAS
  const checkIntervalRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const mountedRef = useRef(true);

  // ✅ ESTADOS
  const [isOnline, setIsOnline] = useState(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  
  const [showNotification, setShowNotification] = useState(() => {
    return typeof navigator !== 'undefined' ? !navigator.onLine : false;
  });
  
  const [retryCount, setRetryCount] = useState(0);
  const [lastOnlineTime, setLastOnlineTime] = useState(null);
  const [offlineDuration, setOfflineDuration] = useState(0);

  // ✅ VERIFICAR CONEXIÓN
  const checkConnection = useCallback(async () => {
    if (!mountedRef.current) return false;
    
    try {
      const endpoints = [
        'https://www.google.com/favicon.ico',
        'https://www.cloudflare.com/favicon.ico',
        '/api/health'
      ];

      let successfulCheck = false;
      
      for (const endpoint of endpoints) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          await fetch(endpoint, {
            mode: 'no-cors',
            signal: controller.signal,
            cache: 'no-cache'
          });
          
          clearTimeout(timeoutId);
          successfulCheck = true;
          break;
        } catch (error) {
          continue;
        }
      }
      
      if (successfulCheck && mountedRef.current) {
        setIsOnline(true);
        setShowNotification(false);
        setLastOnlineTime(new Date());
        setOfflineDuration(0);
        return true;
      } else {
        throw new Error('Todos los endpoints fallaron');
      }
    } catch (error) {
      if (mountedRef.current) {
        setIsOnline(false);
        setShowNotification(true);
      }
      return false;
    }
  }, []);

  // ✅ EFECTOS
  useEffect(() => {
    mountedRef.current = true;
    
    const handleOnline = () => {
      if (mountedRef.current) {
        setIsOnline(true);
        setShowNotification(false);
        setLastOnlineTime(new Date());
        setOfflineDuration(0);
        
        setTimeout(() => {
          if (mountedRef.current) {
            setShowNotification(true);
            setTimeout(() => {
              if (mountedRef.current) {
                setShowNotification(false);
              }
            }, 3000);
          }
        }, 100);
      }
    };

    const handleOffline = () => {
      if (mountedRef.current) {
        setIsOnline(false);
        setShowNotification(true);
        setRetryCount(0);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkConnection();

    return () => {
      mountedRef.current = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [checkConnection]);

  // ✅ DURACIÓN OFFLINE
  useEffect(() => {
    if (isOnline || !mountedRef.current) {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      return;
    }

    durationIntervalRef.current = setInterval(() => {
      if (mountedRef.current) {
        setOfflineDuration(prev => prev + 1);
      }
    }, 1000);

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    };
  }, [isOnline]);

  // ✅ RECONEXIÓN AUTOMÁTICA
  useEffect(() => {
    if (isOnline || autoCheckInterval <= 0 || !mountedRef.current) {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      return;
    }

    checkIntervalRef.current = setInterval(() => {
      if (mountedRef.current) {
        checkConnection();
        setRetryCount(prev => prev + 1);
      }
    }, autoCheckInterval);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [isOnline, autoCheckInterval, checkConnection]);

  // ✅ FUNCIONES AUXILIARES
  const formatDuration = useCallback((seconds) => {
    if (seconds < 60) {
      return `${seconds} segundos`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 60) {
      return `${minutes} minuto${minutes !== 1 ? 's' : ''}${remainingSeconds > 0 ? ` ${remainingSeconds} segundos` : ''}`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return `${hours} hora${hours !== 1 ? 's' : ''}${remainingMinutes > 0 ? ` ${remainingMinutes} minutos` : ''}`;
  }, []);

  const handleManualReconnect = useCallback(async () => {
    if (retryCount > 0 && retryCount % 3 === 0) {
      return;
    }
    
    setRetryCount(prev => prev + 1);
    await checkConnection();
  }, [retryCount, checkConnection]);

  const handleCloseNotification = useCallback(() => {
    setShowNotification(false);
  }, []);

  // ✅ NOTIFICACIÓN DE RECONEXIÓN
  if (isOnline && showNotification) {
    return (
      <div 
        className={clsx(
          'offline-indicator',
          'offline-reconnected',
          `offline-position-top-right`,
          className
        )}
        role="status"
        aria-live="polite"
        aria-label="Conexión a internet restablecida"
        data-testid="offline-reconnected-notification"
      >
        <div className="offline-reconnected-content">
          <span className="offline-reconnected-icon" aria-hidden="true">✅</span>
          <div className="offline-reconnected-text">
            <p className="offline-reconnected-title">¡Conexión restablecida!</p>
            {lastOnlineTime && (
              <p className="offline-reconnected-time">
                Reconectado a las {lastOnlineTime.toLocaleTimeString()}
              </p>
            )}
          </div>
          <button
            onClick={handleCloseNotification}
            className="offline-close-button"
            aria-label="Cerrar notificación de reconexión"
            type="button"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  // ✅ ESTADO OFFLINE
  if (!isOnline) {
    const isBanner = position === 'top' || position === 'bottom';
    
    return (
      <div 
        className={clsx(
          'offline-indicator',
          `offline-position-${position}`,
          isBanner && 'offline-banner',
          className
        )}
        role="alert"
        aria-live="assertive"
        aria-label="Sin conexión a internet"
        data-testid="offline-indicator"
      >
        <div className={clsx('offline-content', isBanner && 'offline-banner-content')}>
          <div className="offline-icon-container">
            <div className="offline-icon" aria-hidden="true">
              <span>⚠️</span>
            </div>
          </div>
          
          <div className="offline-text">
            <p className="offline-title">Sin conexión a internet</p>
            <div className="offline-description">
              <p>La aplicación funciona en modo limitado.</p>
              <div className="offline-details">
                {showRetryCount && retryCount > 0 && (
                  <p className="offline-detail">
                    Intentando reconectar... ({retryCount} intento{retryCount !== 1 ? 's' : ''})
                  </p>
                )}
                {offlineDuration > 0 && (
                  <p className="offline-detail">
                    Tiempo offline: {formatDuration(offlineDuration)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {showReconnectButton && (
            <div className="offline-actions">
              <button
                onClick={handleManualReconnect}
                className="offline-reconnect-button"
                disabled={retryCount > 0 && retryCount % 3 === 0}
                aria-label="Intentar reconectar manualmente"
                type="button"
              >
                {retryCount > 0 && retryCount % 3 === 0 ? 'Esperando...' : 'Reconectar'}
              </button>
              <button
                onClick={handleCloseNotification}
                className="offline-close-button"
                aria-label="Ocultar notificación de offline"
                type="button"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {showReconnectButton && (
          <div className="offline-progress">
            <div 
              className="offline-progress-bar"
              style={{ 
                width: `${Math.min(100, (retryCount % 3) * 33.3)}%`,
                opacity: retryCount > 0 && retryCount % 3 === 0 ? 0.3 : 1
              }}
              aria-hidden="true"
            ></div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

// ✅ PROPTYPES
OfflineIndicator.propTypes = {
  showReconnectButton: PropTypes.bool,
  autoCheckInterval: PropTypes.number,
  position: PropTypes.oneOf(['top', 'bottom', 'top-right', 'top-left', 'bottom-right', 'bottom-left']),
  showRetryCount: PropTypes.bool,
  className: PropTypes.string
};

// ✅ ASIGNACIÓN DE COMPONENTES
OfflineIndicator.Inline = OfflineIndicatorInline;
OfflineIndicator.ConnectionQuality = ConnectionQualityIndicator;
OfflineIndicator.useNetworkStatus = useNetworkStatus;

OfflineIndicator.displayName = 'OfflineIndicator';

export default OfflineIndicator;