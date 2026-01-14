import React from 'react';
import logger from './utils/logger';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './assets/styles/index.css';

// ✅ Componente GlobalErrorBoundary optimizado
const GlobalErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);
  const [errorInfo, setErrorInfo] = React.useState(null);

  React.useEffect(() => {
    const handleError = (event) => {
      setHasError(true);
      setErrorInfo({
        message: event.error?.message || 'Error desconocido',
        stack: event.error?.stack
      });
      logger.error('Error global capturado:', event.error);
      
      event.preventDefault();
    };

    const handleUnhandledRejection = (event) => {
      setHasError(true);
      setErrorInfo({
        message: event.reason?.message || 'Promise rejection no manejada',
        stack: event.reason?.stack
      });
      logger.error('Promesa rechazada no manejada:', event.reason);
      
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (hasError) {
    return (
      <div className="global-error-screen">
        <div className="global-error-container">
          <div className="global-error-icon">🚨</div>
          <h1 className="global-error-title">Error Crítico</h1>
          <p className="global-error-message">
            Ha ocurrido un error inesperado en la aplicación.
            {errorInfo && (
              <div className="global-error-details">
                {errorInfo.message}
              </div>
            )}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="global-error-btn-primary"
          >
            Recargar Aplicación
          </button>
        </div>
        <style jsx>{`
          .global-error-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: var(--color-bg-primary);
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 1rem;
            z-index: 9999;
          }
          
          .global-error-container {
            background-color: var(--color-bg-secondary);
            border-radius: var(--radius-lg);
            padding: 2rem;
            max-width: 500px;
            width: 100%;
            box-shadow: var(--shadow-xl);
            text-align: center;
          }
          
          .global-error-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
          }
          
          .global-error-title {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: var(--color-text-primary);
          }
          
          .global-error-message {
            color: var(--color-text-secondary);
            margin-bottom: 1.5rem;
            line-height: 1.5;
          }
          
          .global-error-details {
            margin-top: 0.5rem;
            font-size: 0.875rem;
            color: var(--color-danger);
            background-color: var(--color-danger-light);
            padding: 0.5rem;
            border-radius: var(--radius-sm);
            overflow: auto;
            max-height: 100px;
          }
          
          .global-error-btn-primary {
            background-color: var(--color-primary);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: var(--radius-md);
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
            min-width: 200px;
          }
          
          .global-error-btn-primary:hover {
            background-color: var(--color-primary-dark);
          }
        `}</style>
      </div>
    );
  }

  return children;
};

// ✅ Configuración global
if (!window.GLOBAL_CONFIG) {
  window.GLOBAL_CONFIG = {
    appName: import.meta.env.VITE_APP_NAME || 'Sistema de Inventario QR',
    appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
    appDescription: import.meta.env.VITE_APP_DESCRIPTION || 'Sistema de gestión de inventario',
    environment: import.meta.env.MODE || 'development',
    debug: import.meta.env.VITE_DEBUG === 'true',

    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    apiTimeout: Number.parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10),
    apiVersion: import.meta.env.VITE_API_VERSION || 'v1',

    features: {
      pwa: import.meta.env.VITE_FEATURE_PWA === 'true',
      offline: import.meta.env.VITE_FEATURE_OFFLINE === 'true',
      notifications: import.meta.env.VITE_FEATURE_NOTIFICATIONS === 'true',
      analytics: import.meta.env.VITE_FEATURE_ANALYTICS === 'true',
      darkMode: import.meta.env.VITE_FEATURE_DARK_MODE === 'true'
    },

    auth: {
      tokenKey: 'inventario_qr_token',
      refreshTokenKey: 'inventario_qr_refresh_token',
      userKey: 'inventario_qr_user',
      tokenHeader: 'Authorization',
      tokenPrefix: 'Bearer'
    },

    storage: {
      prefix: 'inventario_qr_',
      sessionPrefix: 'inventario_qr_session_',
      localStorage: true,
      sessionStorage: true
    },

    endpoints: {
      auth: {
        login: '/auth/login',
        register: '/auth/register',
        refresh: '/auth/refresh',
        logout: '/auth/logout',
        me: '/auth/me'
      },
      products: '/products',
      inventory: '/inventory',
      categories: '/categories',
      suppliers: '/suppliers',
      transactions: '/transactions',
      reports: '/reports',
      users: '/users'
    }
  };
}

// ✅ ToastContainer simplificado
const ToastContainer = () => {
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const position = isMobile ? 'top-center' : (import.meta.env.VITE_NOTIFICATION_POSITION || 'top-right');
  
  return (
    <Toaster
      position={position}
      gutter={isMobile ? 8 : 12}
      containerStyle={{
        top: isMobile ? '1rem' : '1.5rem',
        right: isMobile ? '1rem' : '1.5rem',
        left: isMobile ? '1rem' : 'auto',
        zIndex: 9999
      }}
      toastOptions={{
        duration: Number.parseInt(import.meta.env.VITE_NOTIFICATION_DURATION_SUCCESS || '3000', 10),
        style: {
          background: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.875rem',
          maxWidth: isMobile ? 'calc(100vw - 2rem)' : '350px',
          boxShadow: 'var(--shadow-lg)',
          padding: isMobile ? '0.75rem 1rem' : '1rem 1.25rem',
          border: '1px solid var(--color-border-light)'
        },
        success: {
          duration: Number.parseInt(import.meta.env.VITE_NOTIFICATION_DURATION_SUCCESS || '3000', 10),
          iconTheme: {
            primary: 'var(--color-success)',
            secondary: 'var(--color-text-inverse)'
          },
          style: {
            background: 'var(--color-success)',
            color: 'white'
          }
        },
        error: {
          duration: Number.parseInt(import.meta.env.VITE_NOTIFICATION_DURATION_ERROR || '5000', 10),
          iconTheme: {
            primary: 'var(--color-danger)',
            secondary: 'var(--color-text-inverse)'
          },
          style: {
            background: 'var(--color-danger)',
            color: 'white'
          }
        },
        loading: {
          duration: Infinity,
          style: {
            background: 'var(--color-primary)',
            color: 'white'
          }
        }
      }}
    />
  );
};

// ✅ Función de inicialización
const initializeApp = async () => {
  console.group(`🚀 Iniciando ${window.GLOBAL_CONFIG.appName} v${window.GLOBAL_CONFIG.appVersion}`);

  try {
    if (!navigator.onLine) {
      console.warn('⚠️ Aplicación iniciada sin conexión a internet');
    }

    if (window.GLOBAL_CONFIG.features.pwa && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });
        
        console.log('✅ Service Worker registrado correctamente');
        
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('🔄 Nueva versión del Service Worker encontrada');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('✅ Nueva versión lista para instalar');
            }
          });
        });
      } catch (error) {
        console.warn('⚠️ Service Worker no registrado:', error);
      }
    }

    console.log('✅ Aplicación inicializada correctamente');
    return true;

  } catch (error) {
    console.error('❌ Error en inicialización:', error);
    logger.error('Error en inicialización de la aplicación', error);
    return false;
  } finally {
    console.groupEnd();
  }
};

// ✅ Renderizado principal
const renderApp = () => {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    console.error('❌ No se encontró el elemento #root');
    
    const newRoot = document.createElement('div');
    newRoot.id = 'root';
    document.body.appendChild(newRoot);
    
    setTimeout(renderApp, 100);
    return;
  }

  try {
    const root = ReactDOM.createRoot(rootElement);

    root.render(
      <React.StrictMode>
        <GlobalErrorBoundary>
          <HelmetProvider>
            <BrowserRouter>
              <App />
              <ToastContainer />
            </BrowserRouter>
          </HelmetProvider>
        </GlobalErrorBoundary>
      </React.StrictMode>
    );

    console.log('✅ Aplicación renderizada correctamente');

    setTimeout(() => {
      const appLoading = document.getElementById('app-loading');
      if (appLoading) {
        appLoading.style.opacity = '0';
        appLoading.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
          if (appLoading.parentNode) {
            appLoading.remove();
          }
        }, 300);
      }
      
      document.documentElement.classList.add('app-loaded');
    }, 500);
  } catch (error) {
    console.error('❌ Error al renderizar la aplicación:', error);
    
    rootElement.innerHTML = `
      <div class="app-render-error">
        <div class="app-error-container">
          <h2>Error al cargar la aplicación</h2>
          <p>${error.message}</p>
          <button onclick="window.location.reload()" class="app-error-reload-btn">
            Recargar página
          </button>
        </div>
      </div>
      <style>
        .app-render-error {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #f8f9fa;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          text-align: center;
        }
        
        .app-error-container {
          max-width: 500px;
          padding: 30px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        
        .app-error-container h2 {
          color: #dc2626;
          margin-bottom: 15px;
        }
        
        .app-error-container p {
          color: #6b7280;
          margin-bottom: 20px;
        }
        
        .app-error-reload-btn {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
        }
      </style>
    `;
  }
};

// ✅ Setup de error handlers
const setupGlobalErrorHandlers = () => {
  if (window.__ERROR_HANDLERS_SETUP__) {
    return;
  }
  
  const originalOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    logger.error('🚨 Error global no capturado:', {
      message,
      source,
      lineno,
      colno,
      error
    });
    
    if (originalOnError) {
      return originalOnError(message, source, lineno, colno, error);
    }
    
    return true;
  };

  const originalOnUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = (event) => {
    logger.error('🚨 Promesa rechazada no manejada:', event.reason);
    
    if (originalOnUnhandledRejection) {
      return originalOnUnhandledRejection(event);
    }
    
    event.preventDefault();
  };
  
  window.__ERROR_HANDLERS_SETUP__ = true;
};

// ✅ Inicialización de fuentes
const initializeFonts = async () => {
  try {
    if (document.fonts?.ready) {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout cargando fuentes')), 5000);
      });
      
      await Promise.race([document.fonts.ready, timeoutPromise]);
      document.documentElement.classList.add('fonts-loaded');
      console.log('✅ Fuentes cargadas correctamente');
    }
  } catch (error) {
    logger.info('Fuentes cargadas, usando fallback:', error.message);
    document.documentElement.classList.add('fonts-loaded');
  }
};

// ✅ Setup de monitoreo de red
const setupNetworkMonitoring = () => {
  const updateNetworkStatus = () => {
    const isOnline = navigator.onLine;
    document.documentElement.classList.toggle('online', isOnline);
    document.documentElement.classList.toggle('offline', !isOnline);
    
    window.dispatchEvent(new CustomEvent('network-status-change', {
      detail: { isOnline }
    }));
  };

  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  
  updateNetworkStatus();
  
  console.log('✅ Monitoreo de red configurado');
};

// ✅ Setup de tema inicial
const setupInitialTheme = () => {
  try {
    const savedTheme = localStorage.getItem('inventario_qr_theme') || 'auto';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (savedTheme === 'auto' && prefersDark);

    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch (error) {
    console.warn('Error configurando tema inicial:', error);
  }
};

// ✅ Bootstrap de la aplicación
const bootstrapApp = async () => {
  try {
    console.group('🔄 Iniciando bootstrap de la aplicación');
    
    setupInitialTheme();
    setupGlobalErrorHandlers();
    setupNetworkMonitoring();
    
    initializeFonts().catch(error => {
      console.warn('Error cargando fuentes:', error);
    });
    
    const initialized = await initializeApp();
    
    if (initialized) {
      renderApp();
    } else {
      throw new Error('Falló la inicialización de la aplicación');
    }
    
    console.groupEnd();
  } catch (error) {
    console.error('❌ Error crítico en bootstrap:', error);
    logger.error('Error crítico en bootstrap de la aplicación', error);
    
    const rootElement = document.getElementById('root') || document.body;
    rootElement.innerHTML = `
      <div class="bootstrap-error">
        <div>
          <h1>⚠️</h1>
          <h2>Error al iniciar la aplicación</h2>
          <p>${error.message || 'Error desconocido'}</p>
          <button onclick="window.location.reload()" class="retry-btn">
            Reintentar
          </button>
        </div>
      </div>
      <style>
        .bootstrap-error {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          text-align: center;
          padding: 20px;
        }
        
        .bootstrap-error h1 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }
        
        .bootstrap-error h2 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
        }
        
        .bootstrap-error p {
          margin-bottom: 2rem;
          opacity: 0.9;
        }
        
        .retry-btn {
          background: white;
          color: #667eea;
          border: none;
          padding: 12px 30px;
          border-radius: 50px;
          font-weight: bold;
          cursor: pointer;
          font-size: 1rem;
          transition: transform 0.2s;
        }
        
        .retry-btn:hover {
          transform: scale(1.05);
        }
      </style>
    `;
  }
};

// ✅ Verificar que el DOM esté listo
const checkDOMReady = () => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapApp);
  } else {
    bootstrapApp();
  }
};

// Iniciar la aplicación
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(checkDOMReady, 100);
  });
} else {
  setTimeout(checkDOMReady, 100);
}

// Exportar para testing si es necesario
if (import.meta.env.DEV) {
  globalThis.bootstrapApp = bootstrapApp;
}