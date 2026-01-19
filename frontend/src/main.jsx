import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import App from './App';
import logger from './utils/logger';
import "./assets/styles/main/index.css";

// ✅ Configuración global unificada
const GLOBAL_CONFIG = {
  // Información de la aplicación
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Sistema de Inventario QR',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    description: import.meta.env.VITE_APP_DESCRIPTION || 'Sistema de gestión de inventario',
    author: import.meta.env.VITE_APP_AUTHOR || 'Inventario QR Team',
    environment: import.meta.env.MODE || 'development',
    debug: import.meta.env.VITE_DEBUG === 'true',
    logLevel: import.meta.env.VITE_LOG_LEVEL || 'info'
  },

  // Configuración de API
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    timeout: Number.parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10),
    version: import.meta.env.VITE_API_VERSION || 'v1',
    maxRetries: Number.parseInt(import.meta.env.VITE_API_MAX_RETRIES || '3', 10),
    retryDelay: Number.parseInt(import.meta.env.VITE_API_RETRY_DELAY || '1000', 10)
  },

  // Características
  features: {
    pwa: import.meta.env.VITE_FEATURE_PWA === 'true',
    offline: import.meta.env.VITE_FEATURE_OFFLINE === 'true',
    notifications: import.meta.env.VITE_FEATURE_NOTIFICATIONS === 'true',
    analytics: import.meta.env.VITE_FEATURE_ANALYTICS === 'true',
    darkMode: import.meta.env.VITE_FEATURE_DARK_MODE === 'true',
    qrScanner: import.meta.env.VITE_FEATURE_QR_SCANNER === 'true',
    qrGenerator: import.meta.env.VITE_FEATURE_QR_GENERATOR === 'true',
    reports: import.meta.env.VITE_FEATURE_REPORTS === 'true'
  },

  // Autenticación
  auth: {
    tokenKey: 'inventario_qr_token',
    refreshTokenKey: 'inventario_qr_refresh_token',
    userKey: 'inventario_qr_user',
    tokenHeader: 'Authorization',
    tokenPrefix: 'Bearer'
  },

  // Endpoints de API
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

// ✅ ToastContainer optimizado
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
          }
        },
        error: {
          duration: Number.parseInt(import.meta.env.VITE_NOTIFICATION_DURATION_ERROR || '5000', 10),
          iconTheme: {
            primary: 'var(--color-danger)',
            secondary: 'var(--color-text-inverse)'
          }
        }
      }}
    />
  );
};

// ✅ GlobalErrorBoundary simplificado
class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('Error global capturado:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="global-error-screen">
          <div className="global-error-content">
            <h1>⚠️ Error Crítico</h1>
            <p>Ha ocurrido un error inesperado en la aplicación.</p>
            <p className="error-message">{this.state.error?.message}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="global-error-btn"
            >
              Recargar Aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ✅ Setup de tema inicial
const setupInitialTheme = () => {
  try {
    const savedTheme = localStorage.getItem('inventario_qr_theme') || 'auto';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (savedTheme === 'auto' && prefersDark);

    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  } catch (error) {
    logger.warn('Error configurando tema inicial:', error);
  }
};

// ✅ Setup de Service Worker
const setupServiceWorker = async () => {
  if (!GLOBAL_CONFIG.features.pwa || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none'
    });
    
    logger.info('Service Worker registrado correctamente');
    
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      logger.info('Nueva versión del Service Worker encontrada');
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          logger.info('Nueva versión lista para instalar');
          // Aquí podrías mostrar una notificación al usuario
        }
      });
    });
  } catch (error) {
    logger.warn('Service Worker no registrado:', error);
  }
};

// ✅ Monitoreo de red
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
};

// ✅ Inicialización principal
const initializeApp = async () => {
  try {
    logger.info(`🚀 Iniciando ${GLOBAL_CONFIG.app.name} v${GLOBAL_CONFIG.app.version}`);
    
    // Configuración inicial
    setupInitialTheme();
    setupNetworkMonitoring();
    
    // Service Worker (si está habilitado)
    await setupServiceWorker();
    
    // Configuración global
    window.GLOBAL_CONFIG = GLOBAL_CONFIG;
    
    // Verificar conexión
    if (!navigator.onLine) {
      logger.warn('Aplicación iniciada sin conexión a internet');
    }
    
    return true;
  } catch (error) {
    logger.error('Error en inicialización de la aplicación:', error);
    return false;
  }
};

// ✅ Pantalla de error de bootstrap
const showBootstrapError = (error) => {
  document.body.innerHTML = `
    <style>
      .bootstrap-error {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .bootstrap-error-content {
        text-align: center;
        padding: 3rem;
        background: white;
        border-radius: 1rem;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        max-width: 500px;
        width: 90%;
      }
      .bootstrap-error h1 {
        font-size: 4rem;
        margin-bottom: 1rem;
      }
      .bootstrap-error h2 {
        color: #374151;
        margin-bottom: 1rem;
      }
      .bootstrap-error p {
        color: #6b7280;
        margin-bottom: 2rem;
      }
      .retry-btn {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 0.75rem 2rem;
        border-radius: 0.5rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      }
      .retry-btn:hover {
        background: #2563eb;
      }
    </style>
    <div class="bootstrap-error">
      <div class="bootstrap-error-content">
        <h1>⚠️</h1>
        <h2>Error al iniciar la aplicación</h2>
        <p>${error.message || 'Error desconocido al cargar la aplicación'}</p>
        <button onclick="window.location.reload()" class="retry-btn">
          Reintentar
        </button>
      </div>
    </div>
  `;
};

// ✅ Bootstrap principal
const bootstrapApp = async () => {
  try {
    // 1. Inicializar configuración
    const initialized = await initializeApp();
    
    if (!initialized) {
      throw new Error('Falló la inicialización de la aplicación');
    }
    
    // 2. Marcar como inicializada
    window.APP_INITIALIZED = true;
    
    // 3. Renderizar aplicación
    const rootElement = document.getElementById('root');
    
    if (!rootElement) {
      throw new Error('No se encontró el elemento #root');
    }

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
    
    logger.info('Aplicación renderizada correctamente');
    
    // Remover loader de carga inicial
    setTimeout(() => {
      const appLoading = document.getElementById('app-loading');
      if (appLoading?.parentNode) {
        appLoading.style.opacity = '0';
        setTimeout(() => appLoading.remove(), 300);
      }
      document.documentElement.classList.add('app-loaded');
    }, 500);
    
  } catch (error) {
    logger.error('Error crítico en bootstrap:', error);
    showBootstrapError(error);
  }
};

// ✅ Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapApp);
} else {
  bootstrapApp();
}

// ✅ Exportar para testing en desarrollo
if (import.meta.env.DEV) {
  window.bootstrapApp = bootstrapApp;
  window.GLOBAL_CONFIG = GLOBAL_CONFIG;
}