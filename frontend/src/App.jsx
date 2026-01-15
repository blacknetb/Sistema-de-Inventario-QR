import React, { Suspense, useEffect, useState, useMemo, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { InventoryProvider } from './context/InventoryContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { ApiStatusIndicator } from './components/common/ApiStatusIndicator';
import logger from './utils/logger';
import PropTypes from "prop-types";
import "./assets/styles/main/main.css";

// ✅ CONFIGURACIÓN ÚNICA (evitar duplicación)
const APP_CONFIG = {
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Sistema de Inventario QR',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    description: import.meta.env.VITE_APP_DESCRIPTION || 'Sistema de gestión de inventario',
    author: import.meta.env.VITE_APP_AUTHOR || 'Inventario QR Team',
    environment: import.meta.env.MODE || 'development',
    debug: import.meta.env.VITE_DEBUG === 'true',
    logLevel: import.meta.env.VITE_LOG_LEVEL || 'info'
  },
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    timeout: Number.parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10),
    version: import.meta.env.VITE_API_VERSION || 'v1',
    maxRetries: Number.parseInt(import.meta.env.VITE_API_MAX_RETRIES || '3', 10),
    retryDelay: Number.parseInt(import.meta.env.VITE_API_RETRY_DELAY || '1000', 10)
  },
  features: {
    pwa: import.meta.env.VITE_FEATURE_PWA === 'true',
    offline: import.meta.env.VITE_FEATURE_OFFLINE === 'true',
    notifications: import.meta.env.VITE_FEATURE_NOTIFICATIONS === 'true',
    analytics: import.meta.env.VITE_FEATURE_ANALYTICS === 'true',
    darkMode: import.meta.env.VITE_FEATURE_DARK_MODE === 'true',
    qrScanner: import.meta.env.VITE_FEATURE_QR_SCANNER === 'true',
    qrGenerator: import.meta.env.VITE_FEATURE_QR_GENERATOR === 'true',
    reports: import.meta.env.VITE_FEATURE_REPORTS === 'true'
  }
};

// ✅ Lazy loading optimizado con reintento
const lazyWithRetry = (importFunc, componentName, maxRetries = 2) => {
  const Component = React.lazy(async () => {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await importFunc();
      } catch (error) {
        lastError = error;
        console.warn(`Intento ${attempt + 1} fallado para cargar ${componentName}:`, error);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
      }
    }
    
    throw new Error(`No se pudo cargar ${componentName} después de ${maxRetries + 1} intentos: ${lastError?.message}`);
  });

  Component.displayName = componentName;
  return Component;
};

// ✅ Layouts con lazy loading
const MainLayout = lazyWithRetry(() => import('./components/layout/MainLayout'), 'MainLayout');
const AuthLayout = lazyWithRetry(() => import('./components/layout/AuthLayout'), 'AuthLayout');

// ✅ Páginas principales con lazy loading
const LoginPage = lazyWithRetry(() => import('./pages/Login'), 'LoginPage');
const RegisterPage = lazyWithRetry(() => import('./pages/Register'), 'RegisterPage');
const DashboardPage = lazyWithRetry(() => import('./pages/Dashboard'), 'DashboardPage');
const ProductsPage = lazyWithRetry(() => import('./pages/Products'), 'ProductsPage');
const ProductDetailsPage = lazyWithRetry(() => import('./pages/ProductDetails'), 'ProductDetailsPage');
const InventoryPage = lazyWithRetry(() => import('./pages/Inventory'), 'InventoryPage');
const ScannerPage = lazyWithRetry(() => import('./pages/Scanner'), 'ScannerPage');
const ReportsPage = lazyWithRetry(() => import('./pages/Reports'), 'ReportsPage');
const SettingsPage = lazyWithRetry(() => import('./pages/Settings'), 'SettingsPage');
const ProfilePage = lazyWithRetry(() => import('./pages/Profile'), 'ProfilePage');
const CategoriesPage = lazyWithRetry(() => import('./pages/Categories'), 'CategoriesPage');
const QRManagementPage = lazyWithRetry(() => import('./pages/QRManagement'), 'QRManagementPage');
const NotFoundPage = lazyWithRetry(() => import('./pages/NotFound'), 'NotFoundPage');

// ✅ Componentes de páginas faltantes con fallback
const SuppliersPage = React.lazy(() => import('./pages/Suppliers').catch(() => ({
  default: () => <div>Proveedores - Página en construcción</div>
})));

const TransactionsPage = React.lazy(() => import('./pages/Transactions').catch(() => ({
  default: () => <div>Transacciones - Página en construcción</div>
})));

const AdminPage = React.lazy(() => import('./pages/Admin').catch(() => ({
  default: () => <div>Panel de Administración - Página en construcción</div>
})));

// ✅ Componente de carga optimizado
const AppLoader = () => (
  <div className="app-loader">
    <div className="app-loader-content">
      <div className="app-loader-spinner"></div>
      <div className="app-loader-text">
        <h1>{APP_CONFIG.app.name}</h1>
        <p>Inicializando sistema...</p>
        <div className="app-loader-meta">
          v{APP_CONFIG.app.version} • {APP_CONFIG.app.environment}
        </div>
      </div>
    </div>
    <style jsx>{`
      .app-loader {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: var(--color-bg-primary);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      }
      
      .app-loader-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
        padding: 2rem;
        background-color: var(--color-bg-secondary);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        max-width: 400px;
        width: 90%;
      }
      
      .app-loader-spinner {
        position: relative;
        width: 80px;
        height: 80px;
      }
      
      .app-loader-spinner::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: 4px solid var(--color-primary-light);
        border-radius: 50%;
        animation: spin 1.2s linear infinite;
      }
      
      .app-loader-spinner::after {
        content: 'QR';
        position: absolute;
        top: 10px;
        left: 10px;
        width: 60px;
        height: 60px;
        background-color: var(--color-primary);
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        color: white;
        font-size: 1.25rem;
        font-weight: bold;
      }
      
      .app-loader-text {
        text-align: center;
      }
      
      .app-loader-text h1 {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: var(--color-text-primary);
      }
      
      .app-loader-text p {
        color: var(--color-text-secondary);
        margin-bottom: 1rem;
      }
      
      .app-loader-meta {
        font-size: 0.875rem;
        color: var(--color-text-muted);
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// ✅ Componente de fallback de error
const ErrorFallback = ({ onReload, onGoHome }) => (
  <div className="error-fallback">
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <h1 className="error-title">Error en la aplicación</h1>
      <p className="error-message">
        Lo sentimos, ha ocurrido un error crítico. Por favor, recarga la página o contacta a soporte.
      </p>
      <div className="error-actions">
        <button className="btn btn-primary" onClick={onReload}>
          Recargar aplicación
        </button>
        <button className="btn btn-secondary" onClick={onGoHome}>
          Ir al inicio
        </button>
      </div>
    </div>
    <style jsx>{`
      .error-fallback {
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
        z-index: 9998;
      }
      
      .error-container {
        background-color: var(--color-bg-secondary);
        border-radius: var(--radius-lg);
        padding: 2rem;
        max-width: 500px;
        width: 100%;
        box-shadow: var(--shadow-xl);
        text-align: center;
      }
      
      .error-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
      }
      
      .error-title {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: var(--color-text-primary);
      }
      
      .error-message {
        color: var(--color-text-secondary);
        margin-bottom: 1.5rem;
        line-height: 1.5;
      }
      
      .error-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
      }
      
      .error-actions .btn {
        min-width: 160px;
      }
    `}</style>
  </div>
);

ErrorFallback.propTypes = {
  onReload: PropTypes.func.isRequired,
  onGoHome: PropTypes.func.isRequired
};

// ✅ Hook para configuración dinámica
const useAppConfig = () => {
  const location = useLocation();

  return useMemo(() => {
    const clonedConfig = JSON.parse(JSON.stringify(APP_CONFIG));

    const pathname = location.pathname.toLowerCase();

    if (pathname.includes("/scanner")) {
      clonedConfig.features.qrScanner = true;
    }

    if (pathname.includes("/reports")) {
      clonedConfig.features.reports = true;
    }

    return clonedConfig;
  }, [location.pathname]);
};

// ✅ Función para configurar tema
const setupTheme = () => {
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

    return savedTheme;
  } catch (error) {
    console.error('Error configurando tema:', error);
    return 'auto';
  }
};

// ✅ Función de inicialización
const initializeApp = async () => {
  try {
    if (APP_CONFIG.app.debug) {
      console.group(`🚀 Inicializando ${APP_CONFIG.app.name} v${APP_CONFIG.app.version}`);
    }

    setupTheme();

    if (!APP_CONFIG.api.baseUrl) {
      console.warn('⚠️ URL de API no configurada. Usando valor por defecto.');
    }

    if (APP_CONFIG.app.debug) {
      console.log('✅ Aplicación inicializada correctamente');
    }

    return true;

  } catch (error) {
    console.error('❌ Error en inicialización:', error);
    logger.error('Error en inicialización de la aplicación', error);
    return false;
  } finally {
    if (APP_CONFIG.app.debug) {
      console.groupEnd();
    }
  }
};

// ✅ Hook personalizado para inicialización
const useAppInitialization = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [apiStatus, setApiStatus] = useState('checking');

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    if (APP_CONFIG.app.debug) {
      console.log('🌐 Conectado a internet');
    }
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    console.warn('🌐 Sin conexión a internet');
    setApiStatus('offline');
  }, []);

  const initApp = useCallback(async () => {
    try {
      const initializationPromise = initializeApp();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Timeout en inicialización de la aplicación'));
        }, 10000);
      });

      const success = await Promise.race([initializationPromise, timeoutPromise]);
      return success;
    } catch (error) {
      console.error('Error en inicialización:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const success = await initApp();
      if (mounted) {
        setIsInitialized(success);
      }
    };

    init();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      mounted = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [initApp, handleOnline, handleOffline]);

  return { isInitialized, isOnline, apiStatus };
};

// ✅ COMPONENTE PRINCIPAL
const App = () => {
  const { isInitialized, isOnline, apiStatus } = useAppInitialization();

  const handleReload = useCallback(() => {
    window.location.reload();
  }, []);

  const handleGoHome = useCallback(() => {
    window.location.href = '/';
  }, []);

  const errorFallback = (
    <ErrorFallback 
      onReload={handleReload} 
      onGoHome={handleGoHome} 
    />
  );

  if (!isInitialized) {
    return <AppLoader />;
  }

  return (
    <ErrorBoundary fallback={errorFallback}>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <InventoryProvider>
              <Suspense fallback={<AppLoader />}>
                <div className="app-container">
                  {!isOnline && (
                    <div className="offline-indicator-container">
                      <OfflineIndicator />
                    </div>
                  )}

                  {APP_CONFIG.app.debug && apiStatus === 'checking' && (
                    <div className="api-status-container">
                      <ApiStatusIndicator />
                    </div>
                  )}

                  <Routes>
                    <Route element={<AuthLayout />}>
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/forgot-password" element={<div>Forgot Password</div>} />
                      <Route path="/reset-password" element={<div>Reset Password</div>} />
                    </Route>

                    <Route element={<MainLayout />}>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/settings" element={<SettingsPage />} />

                      <Route path="/products" element={<ProductsPage />} />
                      <Route path="/products/new" element={<ProductDetailsPage />} />
                      <Route path="/products/:id" element={<ProductDetailsPage />} />
                      <Route path="/products/:id/edit" element={<ProductDetailsPage />} />

                      <Route path="/inventory" element={<InventoryPage />} />
                      <Route path="/scanner" element={<ScannerPage />} />
                      <Route path="/reports" element={<ReportsPage />} />
                      <Route path="/categories" element={<CategoriesPage />} />
                      <Route path="/qr-management" element={<QRManagementPage />} />

                      <Route path="/suppliers" element={<SuppliersPage />} />
                      <Route path="/transactions" element={<TransactionsPage />} />
                      <Route path="/admin" element={<AdminPage />} />
                    </Route>

                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </div>
              </Suspense>
            </InventoryProvider>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

App.displayName = 'App';
export default React.memo(App);