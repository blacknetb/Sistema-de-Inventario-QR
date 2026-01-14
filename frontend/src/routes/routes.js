import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import PropTypes from "prop-types";

// ✅ Importar el hook de autenticación (ajustar según tu estructura)
const useAuth = () => ({
  isAuthenticated: false,
  isLoading: false,
  user: null,
  hasPermission: () => Promise.resolve(false)
});

// ✅ Componente Layout básico
const Layout = ({ children }) => <div className="layout">{children}</div>;
Layout.propTypes = {
  children: PropTypes.node
};

// ✅ Componente Loader básico
const Loader = ({ message }) => (
  <div className="loader-container">
    <div className="loader-spinner"></div>
    {message && <p className="loader-message">{message}</p>}
  </div>
);
Loader.propTypes = {
  message: PropTypes.string
};

// ✅ Componente RouteErrorBoundary básico
const RouteErrorBoundary = ({ children }) => children;
RouteErrorBoundary.propTypes = {
  children: PropTypes.node
};

// ✅ Componente AccessDenied básico
const AccessDenied = () => (
  <div className="access-denied">
    <h1>Acceso Denegado</h1>
  </div>
);

// ✅ Componente NotFound básico
const NotFound = () => (
  <div className="not-found">
    <h1>404 - Página No Encontrada</h1>
  </div>
);

/**
 * ✅ MEJORA: LoadingFallback mejorado
 */
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Cargando...</p>
    </div>
  </div>
);

// ✅ MEJORA: Componentes lazy con estructura básica
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Products = lazy(() => import('../pages/products/Products'));
const ProductDetails = lazy(() => import('../pages/products/ProductDetails'));
const ProductCreate = lazy(() => import('../pages/products/ProductCreate'));
const Inventory = lazy(() => import('../pages/inventory/Inventory'));
const InventoryHistory = lazy(() => import('../pages/inventory/InventoryHistory'));
const Categories = lazy(() => import('../pages/categories/Categories'));
const QRManagement = lazy(() => import('../pages/qr/QRManagement'));
const QRScanner = lazy(() => import('../pages/qr/QRScanner'));
const Reports = lazy(() => import('../pages/reports/Reports'));
const Profile = lazy(() => import('../pages/profile/Profile'));
const Settings = lazy(() => import('../pages/settings/Settings'));
const Users = lazy(() => import('../pages/admin/Users'));
const SystemLogs = lazy(() => import('../pages/admin/SystemLogs'));
const Backup = lazy(() => import('../pages/admin/Backup'));

/**
 * ✅ MEJORA: Componente PrivateRoute robusto
 */
const PrivateRoute = ({ children, roles = [], permissions = [] }) => {
  const { 
    isAuthenticated, 
    isLoading, 
    user,
    hasPermission 
  } = useAuth();
  
  const location = useLocation();

  // ✅ MEJORA: Mostrar loader mientras se verifica autenticación
  if (isLoading) {
    return <LoadingFallback />;
  }

  // ✅ MEJORA: Redirección si no está autenticado
  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${returnUrl}`} state={{ from: location }} replace />;
  }

  // ✅ MEJORA: Verificación de roles
  if (roles.length > 0 && user?.role) {
    const userRoles = Array.isArray(user.roles) ? user.roles : [user.role];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return <Navigate to="/access-denied" state={{ missingRoles: roles }} replace />;
    }
  }

  // ✅ MEJORA: Verificación de permisos
  if (permissions.length > 0) {
    const hasAllPermissions = permissions.every(permission => {
      return user?.permissions?.includes(permission) || hasPermission?.(permission);
    });
    
    if (!hasAllPermissions) {
      return <Navigate to="/access-denied" state={{ missingPermissions: permissions }} replace />;
    }
  }

  return children;
};

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
  roles: PropTypes.array,
  permissions: PropTypes.array
};

/**
 * ✅ MEJORA: Componente PublicRoute optimizado
 */
const PublicRoute = ({ children, restricted = false }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingFallback />;
  }

  // ✅ MEJORA: Redirección si ya está autenticado y la ruta es restringida
  if (isAuthenticated && restricted) {
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return children;
};

PublicRoute.propTypes = {
  children: PropTypes.node.isRequired,
  restricted: PropTypes.bool
};

/**
 * ✅ MEJORA: Layout wrappers mejorados
 */
const MainLayoutWrapper = () => {
  return (
    <PrivateRoute>
      <Layout>
        <Outlet />
      </Layout>
    </PrivateRoute>
  );
};

const AdminLayoutWrapper = () => {
  return (
    <PrivateRoute roles={['admin', 'superadmin']} permissions={['admin.access']}>
      <Layout>
        <Outlet />
      </Layout>
    </PrivateRoute>
  );
};

/**
 * ✅ MEJORA: Hook para preloading estratégico
 */
const useRoutePreloader = () => {
  const location = useLocation();

  useEffect(() => {
    const preloadComponents = async () => {
      const path = location.pathname;
      
      // Preload basado en ruta actual
      if (path.startsWith('/products')) {
        try {
          // Carga asíncrona de componentes relacionados
          const promises = [];
          
          if (path === '/products' || path.startsWith('/products/')) {
            promises.push(import('../pages/products/Products'));
            promises.push(import('../pages/products/ProductDetails'));
          }
          
          if (path.includes('/create') || path.includes('/edit')) {
            promises.push(import('../pages/products/ProductCreate'));
          }
          
          await Promise.allSettled(promises);
        } catch (error) {
          console.warn('Error preloading product components:', error);
        }
      } else if (path.startsWith('/inventory')) {
        try {
          await import('../pages/inventory/Inventory');
          if (path.includes('/history')) {
            await import('../pages/inventory/InventoryHistory');
          }
        } catch (error) {
          console.warn('Error preloading inventory components:', error);
        }
      } else if (path.startsWith('/admin')) {
        try {
          await import('../pages/admin/Users');
          
          if (path.includes('/system-logs')) {
            await import('../pages/admin/SystemLogs');
          }
          
          if (path.includes('/backup')) {
            await import('../pages/admin/Backup');
          }
        } catch (error) {
          console.warn('Error preloading admin components:', error);
        }
      } else if (path.startsWith('/qr')) {
        try {
          await import('../pages/qr/QRManagement');
          if (path.includes('/scanner')) {
            await import('../pages/qr/QRScanner');
          }
        } catch (error) {
          console.warn('Error preloading QR components:', error);
        }
      }
    };

    // Delay para no bloquear render inicial
    const timeoutId = setTimeout(preloadComponents, 300);
    
    return () => clearTimeout(timeoutId);
  }, [location.pathname]);
};

/**
 * ✅ MEJORA: Componente principal de rutas optimizado
 */
const AppRoutes = () => {
  useRoutePreloader();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* ✅ MEJORA: Rutas públicas */}
        <Route 
          path="/login" 
          element={
            <PublicRoute restricted>
              <RouteErrorBoundary>
                <Login />
              </RouteErrorBoundary>
            </PublicRoute>
          } 
        />
        
        <Route 
          path="/register" 
          element={
            <PublicRoute restricted>
              <RouteErrorBoundary>
                <Register />
              </RouteErrorBoundary>
            </PublicRoute>
          } 
        />
        
        <Route 
          path="/forgot-password" 
          element={
            <PublicRoute restricted>
              <RouteErrorBoundary>
                <ForgotPassword />
              </RouteErrorBoundary>
            </PublicRoute>
          } 
        />
        
        <Route 
          path="/reset-password/:token" 
          element={
            <PublicRoute restricted>
              <RouteErrorBoundary>
                <ResetPassword />
              </RouteErrorBoundary>
            </PublicRoute>
          } 
        />
        
        <Route 
          path="/access-denied" 
          element={
            <PublicRoute>
              <RouteErrorBoundary>
                <AccessDenied />
              </RouteErrorBoundary>
            </PublicRoute>
          } 
        />
        
        {/* ✅ MEJORA: Rutas principales con layout */}
        <Route element={<MainLayoutWrapper />}>
          <Route index element={<Dashboard />} />
          
          {/* Productos */}
          <Route path="products">
            <Route index element={
              <PrivateRoute permissions={['products.view']}>
                <RouteErrorBoundary>
                  <Products />
                </RouteErrorBoundary>
              </PrivateRoute>
            } />
            <Route path="create" element={
              <PrivateRoute permissions={['products.create']}>
                <RouteErrorBoundary>
                  <ProductCreate />
                </RouteErrorBoundary>
              </PrivateRoute>
            } />
            <Route path=":id" element={
              <PrivateRoute permissions={['products.view']}>
                <RouteErrorBoundary>
                  <ProductDetails />
                </RouteErrorBoundary>
              </PrivateRoute>
            } />
            <Route path=":id/edit" element={
              <PrivateRoute permissions={['products.edit']}>
                <RouteErrorBoundary>
                  <ProductCreate />
                </RouteErrorBoundary>
              </PrivateRoute>
            } />
          </Route>
          
          {/* Inventario */}
          <Route path="inventory">
            <Route index element={
              <PrivateRoute permissions={['inventory.view']}>
                <RouteErrorBoundary>
                  <Inventory />
                </RouteErrorBoundary>
              </PrivateRoute>
            } />
            <Route path="history" element={
              <PrivateRoute permissions={['inventory.history']}>
                <RouteErrorBoundary>
                  <InventoryHistory />
                </RouteErrorBoundary>
              </PrivateRoute>
            } />
          </Route>
          
          {/* Categorías */}
          <Route path="categories" element={
            <PrivateRoute permissions={['categories.view']}>
              <RouteErrorBoundary>
                <Categories />
              </RouteErrorBoundary>
            </PrivateRoute>
          } />
          
          {/* QR */}
          <Route path="qr">
            <Route index element={
              <PrivateRoute permissions={['qr.view']}>
                <RouteErrorBoundary>
                  <QRManagement />
                </RouteErrorBoundary>
              </PrivateRoute>
            } />
            <Route path="scanner" element={
              <PrivateRoute permissions={['qr.scan']}>
                <RouteErrorBoundary>
                  <QRScanner />
                </RouteErrorBoundary>
              </PrivateRoute>
            } />
          </Route>
          
          {/* Reportes */}
          <Route path="reports" element={
            <PrivateRoute permissions={['reports.view']}>
              <RouteErrorBoundary>
                <Reports />
              </RouteErrorBoundary>
            </PrivateRoute>
          } />
          
          {/* Perfil */}
          <Route path="profile" element={
            <PrivateRoute>
              <RouteErrorBoundary>
                <Profile />
              </RouteErrorBoundary>
            </PrivateRoute>
          } />
          
          {/* Configuración */}
          <Route path="settings" element={
            <PrivateRoute permissions={['settings.view']}>
              <RouteErrorBoundary>
                <Settings />
              </RouteErrorBoundary>
            </PrivateRoute>
          } />
        </Route>
        
        {/* ✅ MEJORA: Rutas de administración */}
        <Route element={<AdminLayoutWrapper />}>
          <Route path="admin">
            <Route path="users" element={
              <RouteErrorBoundary>
                <Users />
              </RouteErrorBoundary>
            } />
            <Route path="system-logs" element={
              <RouteErrorBoundary>
                <SystemLogs />
              </RouteErrorBoundary>
            } />
            <Route path="backup" element={
              <RouteErrorBoundary>
                <Backup />
              </RouteErrorBoundary>
            } />
          </Route>
        </Route>
        
        {/* ✅ MEJORA: Ruta 404 mejorada */}
        <Route path="*" element={
          <RouteErrorBoundary>
            <NotFound />
          </RouteErrorBoundary>
        } />
      </Routes>
    </Suspense>
  );
};

// ✅ Exportar componentes útiles
export { PrivateRoute, PublicRoute };
export default AppRoutes;