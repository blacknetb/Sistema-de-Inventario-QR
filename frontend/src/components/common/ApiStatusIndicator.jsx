import React, { useState, useEffect } from 'react';
import '../../assets/styles/Common/common.css';

const ApiStatusIndicator = () => {
  const [apiStatus, setApiStatus] = useState('checking');
  const [responseTime, setResponseTime] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);

  const checkApiStatus = async () => {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${window.GLOBAL_CONFIG?.api?.baseUrl || 'http://localhost:3000/api'}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });

      const endTime = Date.now();
      const responseTimeMs = endTime - startTime;
      
      if (response.ok) {
        setApiStatus('online');
        setResponseTime(responseTimeMs);
      } else {
        setApiStatus('error');
        setResponseTime(responseTimeMs);
      }
    } catch (error) {
      setApiStatus('offline');
      setResponseTime(null);
    } finally {
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    // Verificar estado al montar
    checkApiStatus();
    
    // Verificar cada 30 segundos
    const interval = setInterval(checkApiStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusText = () => {
    switch (apiStatus) {
      case 'online': return 'API Online';
      case 'offline': return 'API Offline';
      case 'error': return 'API Error';
      default: return 'Verificando...';
    }
  };

  const getStatusColor = () => {
    switch (apiStatus) {
      case 'online': return '#10B981';
      case 'offline': return '#EF4444';
      case 'error': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const formatTime = (date) => {
    if (!date) return 'Nunca';
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="api-status-indicator">
      <div className="api-status-content">
        <div className="api-status-header">
          <div className="api-status-title">
            Estado del API
          </div>
          <button 
            className="api-status-refresh"
            onClick={checkApiStatus}
            aria-label="Actualizar estado"
            disabled={apiStatus === 'checking'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M23 4V10H17M1 20V14H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.51 9C4.01717 7.56678 4.87913 6.2854 6.01547 5.27542C7.1518 4.26543 8.52547 3.55976 10.0083 3.22426C11.4911 2.88875 13.0348 2.93434 14.4952 3.35677C15.9556 3.77921 17.2853 4.56471 18.36 5.64L23 10M1 14L5.64 18.36C6.71475 19.4353 8.04437 20.2208 9.50481 20.6432C10.9652 21.0657 12.5089 21.1113 13.9917 20.7757C15.4745 20.4402 16.8482 19.7346 17.9845 18.7246C19.1209 17.7146 19.9828 16.4332 20.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div className="api-status-body">
          <div className="api-status-row">
            <span className="api-status-label">Estado:</span>
            <div className="api-status-value">
              <div 
                className="api-status-dot"
                style={{ backgroundColor: getStatusColor() }}
              />
              <span>{getStatusText()}</span>
            </div>
          </div>
          
          {responseTime && (
            <div className="api-status-row">
              <span className="api-status-label">Tiempo respuesta:</span>
              <span className="api-status-value">
                {responseTime}ms
                <span className={`api-status-speed ${responseTime < 200 ? 'fast' : responseTime < 500 ? 'medium' : 'slow'}`}>
                  ({responseTime < 200 ? 'Rápido' : responseTime < 500 ? 'Normal' : 'Lento'})
                </span>
              </span>
            </div>
          )}
          
          <div className="api-status-row">
            <span className="api-status-label">Última verificación:</span>
            <span className="api-status-value">{formatTime(lastCheck)}</span>
          </div>
          
          <div className="api-status-row">
            <span className="api-status-label">Base URL:</span>
            <span className="api-status-value api-status-url">
              {window.GLOBAL_CONFIG?.api?.baseUrl || 'No configurada'}
            </span>
          </div>
        </div>
        
        {apiStatus !== 'online' && (
          <div className="api-status-footer">
            <button 
              className="api-status-action"
              onClick={() => window.location.reload()}
            >
              Reintentar conexión
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiStatusIndicator;