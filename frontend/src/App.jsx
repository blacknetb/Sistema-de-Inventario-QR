import React, { Suspense, useMemo, useCallback, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { InventoryProvider } from './context/InventoryProvider';
import { ConfigProvider } from './context/ConfigContext';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { ApiStatusIndicator } from './components/common/ApiStatusIndicator';
import logger from './utils/logger';
import "./assets/styles/main/index.css";

// ✅ Lazy loading optimizado con reintento
const lazyWithRetry = (importFunc, componentName, maxRetries = 2) => {
  const Component = React.lazy(async () => {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await importFunc();
      } catch (error) {
        lastError = error;
        logger.warn(`Intento ${attempt + 1} fallado para cargar ${componentName}:`, error);
        
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
const LoginPage = lazyWithRetry(() => import('./pages/LoginPage'), 'LoginPage');
const RegisterPage = lazyWithRetry(() => import('./pages/RegisterPage'), 'RegisterPage');
const DashboardPage = lazyWithRetry(() => import('./pages/DashboardPage'), 'DashboardPage');
const ProductsPage = lazyWithRetry(() => import('./pages/ProductsPage'), 'ProductsPage');
const ProductDetailsPage = lazyWithRetry(() => import('./pages/ProductDetails'), 'ProductDetailsPage');
const InventoryPage = lazyWithRetry(() => import('./pages/InventoryPage'), 'InventoryPage');
const ScannerPage = lazyWithRetry(() => import('./pages/Scanner'), 'ScannerPage');
const ReportsPage = lazyWithRetry(() => import('./pages/ReportsPage'), 'ReportsPage');
const SettingsPage = lazyWithRetry(() => import('./pages/SettingsPage'), 'SettingsPage');
const ProfilePage = lazyWithRetry(() => import('./pages/ProfilePage'), 'ProfilePage');
const CategoriesPage = lazyWithRetry(() => import('./pages/CategoriesPage'), 'CategoriesPage');
const QRManagementPage = lazyWithRetry(() => import('./pages/QRManagement'), 'QRManagementPage');
const NotFoundPage = lazyWithRetry(() => import('./pages/NotFoundPage'), 'NotFoundPage');

// ✅ Componentes de páginas faltantes con fallback mejorado
const createFallbackComponent = (pageName) => () => (
  <div className="fallback-page">
    <div className="fallback-content">
      <h2>{pageName}</h2>
      <p>Página en construcción. Disponible próximamente.</p>
    </div>
  </div>
);

const SuppliersPage = React.lazy(() => import('./pages/SuppliersPage').catch(() => ({
  default: createFallbackComponent('Proveedores')
})));

const TransactionsPage = React.lazy(() => import('./pages/TransactionsPage').catch(() => ({
  default: createFallbackComponent('Transacciones')
})));

const AdminPage = React.lazy(() => import('./pages/AdminPage').catch(() => ({
  default: createFallbackComponent('Panel de Administración')
})));

// ✅ Componente de carga optimizado
const AppLoader = () => {
  const appName = window.GLOBAL_CONFIG?.app?.name || 'Sistema de Inventario QR';
  const appVersion = window.GLOBAL_CONFIG?.app?.version || '1.0.0';
  const environment = window.GLOBAL_CONFIG?.app?.environment || 'development';

  return (
    <div className="app-loader">
      <div className="app-loader-content">
        <div className="app-loader-spinner">
          <div className="app-loader-qr">QR</div>
        </div>
        <div className="app-loader-text">
          <h1>{appName}</h1>
          <p>Inicializando sistema...</p>
          <div className="app-loader-meta">
            v{appVersion} • {environment}
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ Hook para configuración dinámica de rutas
const useRouteConfig = () => {
  const location = useLocation();

  return useMemo(() => {
    const config = {
      showScanner: false,
      showReports: false,
      requireAuth: true,
      layout: 'main'
    };

    const pathname = location.pathname.toLowerCase();

    // Configuración por ruta
    if (pathname.includes('/login') || pathname.includes('/register')) {
      config.requireAuth = false;
      config.layout = 'auth';
    }

    if (pathname.includes('/scanner')) {
      config.showScanner = true;
    }

    if (pathname.includes('/reports')) {
      config.showReports = true;
    }

    return config;
  }, [location.pathname]);
};

// ✅ Hook para estado de red
const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      logger.info('🌐 Conectado a internet');
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.warn('🌐 Sin conexión a internet');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
};

// ✅ Hook para estado de la aplicación
const useAppStatus = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Simular inicialización
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return { isInitialized };
};

// ✅ COMPONENTE PRINCIPAL OPTIMIZADO
const App = () => {
  const routeConfig = useRouteConfig();
  const { isOnline } = useNetworkStatus();
  const { isInitialized } = useAppStatus();

  const handleReload = useCallback(() => {
    window.location.reload();
  }, []);

  const handleGoHome = useCallback(() => {
    window.location.href = '/';
  }, []);

  // Si la app no está inicializada, mostrar loader
  if (!isInitialized) {
    return <AppLoader />;
  }

  return (
    <ConfigProvider>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <InventoryProvider>
              <Suspense fallback={<AppLoader />}>
                <div className="app-container" data-layout={routeConfig.layout}>
                  {/* Indicadores de estado */}
                  {!isOnline && (
                    <div className="offline-indicator-container">
                      <OfflineIndicator />
                    </div>
                  )}

                  {window.GLOBAL_CONFIG?.app?.debug && (
                    <div className="api-status-container">
                      <ApiStatusIndicator />
                    </div>
                  )}

                  {/* Sistema de rutas */}
                  <Routes>
                    {/* Rutas de autenticación */}
                    <Route element={<AuthLayout />}>
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/forgot-password" element={<div>Forgot Password</div>} />
                      <Route path="/reset-password" element={<div>Reset Password</div>} />
                    </Route>

                    {/* Rutas principales */}
                    <Route element={<MainLayout />}>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/settings" element={<SettingsPage />} />

                      {/* Gestión de productos */}
                      <Route path="/products" element={<ProductsPage />} />
                      <Route path="/products/new" element={<ProductDetailsPage />} />
                      <Route path="/products/:id" element={<ProductDetailsPage />} />
                      <Route path="/products/:id/edit" element={<ProductDetailsPage />} />

                      {/* Inventario y escaneo */}
                      <Route path="/inventory" element={<InventoryPage />} />
                      <Route path="/scanner" element={<ScannerPage />} />
                      <Route path="/reports" element={<ReportsPage />} />
                      <Route path="/categories" element={<CategoriesPage />} />
                      <Route path="/qr-management" element={<QRManagementPage />} />

                      {/* Módulos adicionales */}
                      <Route path="/suppliers" element={<SuppliersPage />} />
                      <Route path="/transactions" element={<TransactionsPage />} />
                      <Route path="/admin" element={<AdminPage />} />
                    </Route>

                    {/* Ruta 404 */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </div>
              </Suspense>
            </InventoryProvider>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ConfigProvider>
  );
};

App.displayName = 'App';
export default React.memo(App);