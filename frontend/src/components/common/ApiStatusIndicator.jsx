import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import "../../assets/styles/global.css";

const DEFAULT_CONFIG = {
  apiUrl: '/api/health',
  timeout: 5000,
  pollingInterval: 30000,
  maxPollingAttempts: 3
};

const ApiStatusInline = ({
  apiUrl = DEFAULT_CONFIG.apiUrl,
  size = 'default',
  showText = true,
  customCheckFunction,
  pollingInterval = DEFAULT_CONFIG.pollingInterval,
  timeout = DEFAULT_CONFIG.timeout,
  onStatusChange,
  ...props
}) => {
  const abortControllerRef = useRef(null);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);
  const pollingAttemptsRef = useRef(0);

  const [state, setState] = useState({
    isOnline: null,
    isChecking: false,
    error: null,
    lastCheck: null,
    responseTime: null
  });

  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const checkStatus = useCallback(async () => {
    if (state.isChecking || !mountedRef.current) return;

    setState(prev => ({ ...prev, isChecking: true }));

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const startTime = Date.now();
      let isOnline = false;
      let responseTime = null;
      let error = null;

      if (customCheckFunction) {
        isOnline = await customCheckFunction();
        responseTime = Date.now() - startTime;
      } else {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'Accept': 'application/json',
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          responseTime = Date.now() - startTime;
          isOnline = response.ok;

          if (!response.ok) {
            error = `HTTP ${response.status}`;
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          throw fetchError;
        }
      }

      if (mountedRef.current) {
        const newState = {
          isOnline,
          isChecking: false,
          error,
          lastCheck: new Date().toISOString(),
          responseTime
        };

        setState(newState);
        pollingAttemptsRef.current = 0;

        if (onStatusChange) {
          onStatusChange(newState);
        }
      }
    } catch (error) {
      if (mountedRef.current) {
        pollingAttemptsRef.current += 1;
        
        const newState = {
          isOnline: false,
          isChecking: false,
          error: error.name === 'AbortError' ? 'Timeout' : error.message,
          lastCheck: new Date().toISOString(),
          responseTime: null
        };

        setState(newState);

        if (onStatusChange) {
          onStatusChange(newState);
        }
      }
    } finally {
      abortControllerRef.current = null;
    }
  }, [apiUrl, customCheckFunction, timeout, state.isChecking, onStatusChange]);

  useEffect(() => {
    mountedRef.current = true;

    checkStatus();

    if (pollingInterval > 0) {
      intervalRef.current = setInterval(() => {
        if (mountedRef.current) {
          checkStatus();
        }
      }, pollingInterval);
    }

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [checkStatus, pollingInterval, cleanup]);

  const statusClasses = useMemo(() => {
    const baseClass = `api-status-inline api-status-inline-${size}`;
    
    if (state.isChecking) return `${baseClass} api-status-inline-checking`;
    if (state.isOnline === true) return `${baseClass} api-status-inline-online`;
    if (state.isOnline === false) return `${baseClass} api-status-inline-offline`;
    return `${baseClass} api-status-inline-unknown`;
  }, [size, state.isOnline, state.isChecking]);

  const statusInfo = useMemo(() => {
    if (state.isChecking) {
      return { text: 'Verificando...', label: 'Verificando' };
    }
    if (state.isOnline === true) {
      return { text: 'Online', label: 'Online' };
    }
    if (state.isOnline === false) {
      return { text: 'Offline', label: 'Offline' };
    }
    return { text: 'Desconocido', label: 'Estado desconocido' };
  }, [state.isOnline, state.isChecking]);

  const titleText = useMemo(() => {
    let title = `Estado API: ${statusInfo.label}`;
    if (state.error) title += ` - Error: ${state.error}`;
    if (state.responseTime) title += ` - Tiempo: ${state.responseTime}ms`;
    if (state.lastCheck) {
      const time = new Date(state.lastCheck).toLocaleTimeString();
      title += ` - Última verificación: ${time}`;
    }
    return title;
  }, [statusInfo.label, state.error, state.responseTime, state.lastCheck]);

  return (
    <span
      className={statusClasses}
      title={titleText}
      aria-live="polite"
      aria-label={`Estado API: ${statusInfo.label}`}
      {...props}
    >
      <span className="api-status-inline-dot" aria-hidden="true" />
      {showText && (
        <span className="api-status-inline-text">
          {statusInfo.text}
        </span>
      )}
    </span>
  );
};

ApiStatusInline.displayName = 'ApiStatusInline';

ApiStatusInline.propTypes = {
  apiUrl: PropTypes.string,
  size: PropTypes.oneOf(['small', 'default', 'large']),
  showText: PropTypes.bool,
  customCheckFunction: PropTypes.func,
  pollingInterval: PropTypes.number,
  timeout: PropTypes.number,
  onStatusChange: PropTypes.func,
};

ApiStatusInline.defaultProps = {
  apiUrl: DEFAULT_CONFIG.apiUrl,
  size: 'default',
  showText: true,
  pollingInterval: DEFAULT_CONFIG.pollingInterval,
  timeout: DEFAULT_CONFIG.timeout,
};

const ApiStatusIndicator = ({
  apiUrl = DEFAULT_CONFIG.apiUrl,
  showDetails = false,
  autoRefresh = true,
  refreshInterval = DEFAULT_CONFIG.pollingInterval,
  position = 'top-right',
  customCheckFunction,
  className = '',
  onStatusChange,
  timeout = DEFAULT_CONFIG.timeout,
  ...props
}) => {
  const [status, setStatus] = useState({
    isOnline: null,
    lastCheck: null,
    responseTime: null,
    backendVersion: null,
    apiStatus: 'checking',
    error: null,
  });

  const [checkCount, setCheckCount] = useState(0);
  const mountedRef = useRef(true);

  const checkApiStatus = useCallback(async () => {
    if (!mountedRef.current) return;

    const startTime = Date.now();
    
    try {
      let isOnline = false;
      let version = null;
      let responseTime = null;
      let error = null;

      if (customCheckFunction) {
        isOnline = await customCheckFunction();
        responseTime = Date.now() - startTime;
      } else {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'Accept': 'application/json',
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          responseTime = Date.now() - startTime;
          
          if (response.ok) {
            try {
              const data = await response.json();
              isOnline = true;
              version = data.version || data.appVersion || null;
            } catch {
              isOnline = true;
            }
          } else {
            isOnline = false;
            error = `HTTP ${response.status}`;
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          throw fetchError;
        }
      }

      if (mountedRef.current) {
        const newStatus = {
          isOnline,
          lastCheck: new Date().toISOString(),
          responseTime,
          backendVersion: version,
          apiStatus: isOnline ? 'online' : 'offline',
          error,
        };

        setStatus(newStatus);
        setCheckCount(prev => prev + 1);
        
        if (onStatusChange) {
          onStatusChange(newStatus);
        }
      }
    } catch (error) {
      if (mountedRef.current) {
        const newStatus = {
          isOnline: false,
          lastCheck: new Date().toISOString(),
          responseTime: null,
          backendVersion: null,
          apiStatus: 'error',
          error: error.name === 'AbortError' ? 'Timeout' : error.message,
        };

        setStatus(newStatus);
        setCheckCount(prev => prev + 1);
        
        if (onStatusChange) {
          onStatusChange(newStatus);
        }
      }
    }
  }, [apiUrl, customCheckFunction, onStatusChange, timeout]);

  useEffect(() => {
    mountedRef.current = true;

    if (autoRefresh) {
      checkApiStatus();
      
      if (refreshInterval > 0) {
        const intervalId = setInterval(checkApiStatus, refreshInterval);
        return () => {
          clearInterval(intervalId);
          mountedRef.current = false;
        };
      }
    }

    return () => {
      mountedRef.current = false;
    };
  }, [autoRefresh, refreshInterval, checkApiStatus]);

  const containerClasses = `api-status-indicator api-status-indicator-${position} ${className}`;

  return (
    <div className={containerClasses} {...props}>
      <ApiStatusInline
        apiUrl={apiUrl}
        showText
        customCheckFunction={customCheckFunction}
        onStatusChange={onStatusChange}
        timeout={timeout}
      />
      
      {showDetails && (
        <div className="api-status-details">
          <div className="api-status-detail-item">
            <strong>Estado:</strong> 
            <span className={`api-status-value api-status-${status.apiStatus}`}>
              {status.apiStatus}
            </span>
          </div>
          
          {status.responseTime !== null && (
            <div className="api-status-detail-item">
              <strong>Tiempo de respuesta:</strong> 
              <span>{status.responseTime} ms</span>
            </div>
          )}
          
          {status.backendVersion && (
            <div className="api-status-detail-item">
              <strong>Versión backend:</strong> 
              <span>{status.backendVersion}</span>
            </div>
          )}
          
          {status.error && (
            <div className="api-status-detail-item api-status-error">
              <strong>Error:</strong> 
              <span>{status.error}</span>
            </div>
          )}
          
          <div className="api-status-detail-item">
            <strong>Última verificación:</strong> 
            <span>
              {status.lastCheck ? new Date(status.lastCheck).toLocaleString() : '—'}
            </span>
          </div>
          
          <div className="api-status-detail-item">
            <strong>Checks realizados:</strong> 
            <span>{checkCount}</span>
          </div>
        </div>
      )}
    </div>
  );
};

ApiStatusIndicator.Inline = ApiStatusInline;

ApiStatusIndicator.propTypes = {
  apiUrl: PropTypes.string,
  showDetails: PropTypes.bool,
  autoRefresh: PropTypes.bool,
  refreshInterval: PropTypes.number,
  position: PropTypes.oneOf(['top-right', 'top-left', 'bottom-right', 'bottom-left', 'center']),
  customCheckFunction: PropTypes.func,
  className: PropTypes.string,
  onStatusChange: PropTypes.func,
  timeout: PropTypes.number,
};

ApiStatusIndicator.defaultProps = {
  apiUrl: DEFAULT_CONFIG.apiUrl,
  showDetails: false,
  autoRefresh: true,
  refreshInterval: DEFAULT_CONFIG.pollingInterval,
  position: 'top-right',
  className: '',
  timeout: DEFAULT_CONFIG.timeout,
};

ApiStatusIndicator.displayName = 'ApiStatusIndicator';

export default ApiStatusIndicator;