import React, { Suspense, lazy, useEffect, useState, useCallback } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  Outlet
} from 'react-router-dom';
import PropTypes from "prop-types";

// ✅ Importar hooks y componentes necesarios
// NOTA: Estos importes deben ajustarse a tu estructura real de archivos
const useAuth = () => ({
  isAuthenticated: false,
  isLoading: false,
  user: null,
  hasPermission: () => Promise.resolve(false),
  hasRole: () => false
});

const Layout = ({ children }) => <div>{children}</div>;
const Loader = ({ message, fullScreen, showProgress }) => (
  <div className="loader-container">
    <div className="loader-spinner"></div>
    {message && <p>{message}</p>}
  </div>
);
const RouteErrorBoundary = ({ children }) => children;
const AccessDenied = ({ missingRoles = [], missingPermissions = [] }) => (
  <div className="access-denied">
    <h1>Acceso Denegado</h1>
  </div>
);

/**
 * ✅ MEJORA: Función para lazy loading con preloading
 */
const lazyWithPreload = (importFunction) => {
  const Component = lazy(importFunction);
  Component.preload = importFunction;
  return Component;
};

/**
 * ✅ MEJORA: Preloading estratégico de rutas comunes
 */
const preloadComponent = (component) => {
  if (component?.preload) {
    component.preload().catch(error => {
      console.warn('Error al precargar componente:', error);
    });
  }
};

// ✅ MEJORA: Componentes de autenticación
const Login = lazyWithPreload(() => import('../pages/Login'));
const Register = lazyWithPreload(() => import('../pages/Register'));

// ✅ MEJORA: Componentes principales
const Dashboard = lazyWithPreload(() => import('../pages/Dashboard'));
const Products = lazyWithPreload(() => import('../pages/Products'));
const ProductDetails = lazyWithPreload(() => import('../pages/ProductDetails'));
const NewProduct = lazyWithPreload(() => import('../pages/NewProduct'));
const EditProduct = lazyWithPreload(() => import('../pages/EditProduct'));
const Inventory = lazyWithPreload(() => import('../pages/Inventory'));
const Categories = lazyWithPreload(() => import('../pages/Categories'));
const QRManagement = lazyWithPreload(() => import('../pages/QRManagement'));
const QRScanner = lazyWithPreload(() => import('../pages/QRScanner'));
const Reports = lazyWithPreload(() => import('../pages/Reports'));
const Settings = lazyWithPreload(() => import('../pages/Settings'));
const Profile = lazyWithPreload(() => import('../pages/Profile'));
const Users = lazyWithPreload(() => import('../pages/Users'));
const NotFound = lazyWithPreload(() => import('../pages/NotFound'));

/**
 * ✅ MEJORA: Componente PrivateRoute mejorado
 */
const PrivateRoute = ({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  redirectTo = '/login'
}) => {
  const {
    isAuthenticated,
    isLoading,
    user,
    hasPermission,
    hasRole
  } = useAuth();

  const location = useLocation();
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      // Si no está autenticado, denegar acceso
      if (!isAuthenticated) {
        setAccessGranted(false);
        setIsCheckingAccess(false);
        return;
      }

      try {
        // ✅ MEJORA: Verificación de roles
        let hasRequiredRole = true;
        if (requiredRoles.length > 0 && user?.roles) {
          hasRequiredRole = requiredRoles.some(role =>
            Array.isArray(user.roles) ? user.roles.includes(role) : hasRole(role)
          );
        }

        // ✅ MEJORA: Verificación de permisos
        let hasRequiredPermissions = true;
        if (requiredPermissions.length > 0) {
          const permissionChecks = await Promise.all(
            requiredPermissions.map(permission => hasPermission(permission))
          );
          hasRequiredPermissions = permissionChecks.every(result => result);
        }

        setAccessGranted(hasRequiredRole && hasRequiredPermissions);
      } catch (error) {
        console.error('Error verificando acceso:', error);
        setAccessGranted(false);
      } finally {
        setIsCheckingAccess(false);
      }
    };

    if (!isLoading) {
      checkAccess();
    }
  }, [isAuthenticated, isLoading, user, requiredRoles, requiredPermissions, hasPermission, hasRole]);

  // ✅ MEJORA: Mostrar loader mientras se verifica
  if (isLoading || isCheckingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader message="Verificando acceso..." />
      </div>
    );
  }

  // ✅ MEJORA: Redirección si no está autenticado
  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${redirectTo}?returnUrl=${returnUrl}`} state={{ from: location }} replace />;
  }

  // ✅ MEJORA: Mostrar AccessDenied si no tiene permisos
  if (!accessGranted) {
    return (
      <AccessDenied
        missingRoles={requiredRoles}
        missingPermissions={requiredPermissions}
      />
    );
  }

  return children;
};

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRoles: PropTypes.array,
  requiredPermissions: PropTypes.array,
  redirectTo: PropTypes.string
};

/**
 * ✅ MEJORA: Componente PublicRoute mejorado
 */
const PublicRoute = ({
  children,
  restricted = false,
  redirectTo = '/'
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated && restricted) {
      const from = location.state?.from?.pathname || redirectTo;
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, restricted, navigate, location, redirectTo]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader message="Cargando..." />
      </div>
    );
  }

  if (isAuthenticated && restricted) {
    // Redirección manejada por useEffect
    return null;
  }

  return children;
};

PublicRoute.propTypes = {
  children: PropTypes.node.isRequired,
  restricted: PropTypes.bool,
  redirectTo: PropTypes.string
};

/**
 * ✅ MEJORA: Layout wrapper con rutas anidadas
 */
const LayoutWrapper = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

/**
 * ✅ MEJORA: Componente AppRoutes optimizado
 */
const AppRoutes = () => {
  const location = useLocation();

  // ✅ MEJORA: Preloading estratégico basado en ruta actual
  useEffect(() => {
    const preloadBasedOnRoute = () => {
      const path = location.pathname;

      // Preload de componentes basado en patrones de acceso
      if (path === '/') {
        preloadComponent(Dashboard);
      } else if (path.startsWith('/products')) {
        preloadComponent(Products);
        preloadComponent(ProductDetails);
      } else if (path.startsWith('/inventory')) {
        preloadComponent(Inventory);
      } else if (path.startsWith('/qr')) {
        preloadComponent(QRManagement);
        preloadComponent(QRScanner);
      } else if (path.startsWith('/reports')) {
        preloadComponent(Reports);
      } else if (path.startsWith('/settings')) {
        preloadComponent(Settings);
        preloadComponent(Profile);
      } else if (path.startsWith('/admin')) {
        preloadComponent(Users);
      }
    };

    // Delay pequeño para no bloquear render inicial
    const timeoutId = setTimeout(preloadBasedOnRoute, 100);

    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader
            message="Cargando aplicación..."
            showProgress={true}
          />
        </div>
      }
    >
      <Routes>
        {/* ✅ MEJORA: Rutas públicas con PublicRoute */}
        <Route
          path="/login"
          element={
            <PublicRoute restricted={true}>
              <RouteErrorBoundary>
                <Login />
              </RouteErrorBoundary>
            </PublicRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoute restricted={true}>
              <RouteErrorBoundary>
                <Register />
              </RouteErrorBoundary>
            </PublicRoute>
          }
        />

        {/* ✅ MEJORA: Ruta de acceso denegado */}
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

        {/* ✅ MEJORA: Rutas protegidas con Layout */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <LayoutWrapper />
            </PrivateRoute>
          }
        >
          {/* Dashboard - Accesible para todos los usuarios autenticados */}
          <Route
            index
            element={
              <RouteErrorBoundary>
                <Dashboard />
              </RouteErrorBoundary>
            }
          />

          {/* Productos - Permisos específicos */}
          <Route
            path="products"
            element={
              <PrivateRoute requiredPermissions={['products.view']}>
                <RouteErrorBoundary>
                  <Products />
                </RouteErrorBoundary>
              </PrivateRoute>
            }
          />

          <Route
            path="products/new"
            element={
              <PrivateRoute requiredPermissions={['products.create']}>
                <RouteErrorBoundary>
                  <NewProduct />
                </RouteErrorBoundary>
              </PrivateRoute>
            }
          />

          <Route
            path="products/:id"
            element={
              <PrivateRoute requiredPermissions={['products.view']}>
                <RouteErrorBoundary>
                  <ProductDetails />
                </RouteErrorBoundary>
              </PrivateRoute>
            }
          />

          <Route
            path="products/:id/edit"
            element={
              <PrivateRoute requiredPermissions={['products.edit']}>
                <RouteErrorBoundary>
                  <EditProduct />
                </RouteErrorBoundary>
              </PrivateRoute>
            }
          />

          {/* Inventario - Permisos de gestión */}
          <Route
            path="inventory"
            element={
              <PrivateRoute requiredPermissions={['inventory.manage']}>
                <RouteErrorBoundary>
                  <Inventory />
                </RouteErrorBoundary>
              </PrivateRoute>
            }
          />

          {/* Categorías - Permisos de administración */}
          <Route
            path="categories"
            element={
              <PrivateRoute requiredPermissions={['categories.manage']}>
                <RouteErrorBoundary>
                  <Categories />
                </RouteErrorBoundary>
              </PrivateRoute>
            }
          />

          {/* Gestión QR - Permisos específicos */}
          <Route
            path="qr"
            element={
              <PrivateRoute requiredPermissions={['qr.manage']}>
                <RouteErrorBoundary>
                  <QRManagement />
                </RouteErrorBoundary>
              </PrivateRoute>
            }
          />

          <Route
            path="qr/scanner"
            element={
              <PrivateRoute requiredPermissions={['qr.scan']}>
                <RouteErrorBoundary>
                  <QRScanner />
                </RouteErrorBoundary>
              </PrivateRoute>
            }
          />

          {/* Reportes - Permisos de visualización */}
          <Route
            path="reports"
            element={
              <PrivateRoute requiredPermissions={['reports.view']}>
                <RouteErrorBoundary>
                  <Reports />
                </RouteErrorBoundary>
              </PrivateRoute>
            }
          />

          {/* Perfil - Acceso personal */}
          <Route
            path="profile"
            element={
              <PrivateRoute>
                <RouteErrorBoundary>
                  <Profile />
                </RouteErrorBoundary>
              </PrivateRoute>
            }
          />

          {/* Configuración - Solo administradores */}
          <Route
            path="settings"
            element={
              <PrivateRoute requiredRoles={['admin']}>
                <RouteErrorBoundary>
                  <Settings />
                </RouteErrorBoundary>
              </PrivateRoute>
            }
          />

          {/* Gestión de usuarios - Solo administradores */}
          <Route
            path="users"
            element={
              <PrivateRoute requiredRoles={['admin']}>
                <RouteErrorBoundary>
                  <Users />
                </RouteErrorBoundary>
              </PrivateRoute>
            }
          />
        </Route>

        {/* ✅ MEJORA: Ruta 404 mejorada */}
        <Route
          path="*"
          element={
            <RouteErrorBoundary>
              <NotFound />
            </RouteErrorBoundary>
          }
        />
      </Routes>
    </Suspense>
  );
};

// ✅ MEJORA: HOCs para protección de rutas

/**
 * HOC para protección de rutas con roles
 */
export const withRole = (Component, requiredRoles = []) => {
  const WithRoleWrapper = (props) => {
    const { hasRole, isLoading } = useAuth();

    if (isLoading) {
      return <Loader fullScreen />;
    }

    const hasRequiredRole = requiredRoles.length === 0 ||
      requiredRoles.some(role => hasRole(role));

    if (!hasRequiredRole) {
      return <Navigate to="/access-denied" replace />;
    }

    return <Component {...props} />;
  };

  WithRoleWrapper.displayName = `withRole(${Component.displayName || Component.name})`;
  return WithRoleWrapper;
};

/**
 * HOC para protección de rutas con permisos
 */
export const withPermission = (Component, requiredPermissions = []) => {
  const WithPermissionWrapper = (props) => {
    const { hasPermission, isLoading } = useAuth();
    const [checkingPermissions, setCheckingPermissions] = useState(true);
    const [hasRequiredPermissions, setHasRequiredPermissions] = useState(false);

    useEffect(() => {
      const checkPermissions = async () => {
        if (requiredPermissions.length === 0) {
          setHasRequiredPermissions(true);
          setCheckingPermissions(false);
          return;
        }

        const results = await Promise.all(
          requiredPermissions.map((permission) => hasPermission(permission))
        );

        setHasRequiredPermissions(results.every((result) => result));
        setCheckingPermissions(false);
      };

      checkPermissions();
    }, [hasPermission, requiredPermissions]);

    if (isLoading || checkingPermissions) {
      return <Loader fullScreen />;
    }

    if (!hasRequiredPermissions) {
      return <Navigate to="/access-denied" replace />;
    }

    return <Component {...props} />;
  };

  WithPermissionWrapper.displayName = `withPermission(${Component.displayName || Component.name
    })`;

  WithPermissionWrapper.propTypes = {
    props: PropTypes.object,
  };

  return WithPermissionWrapper;
};

// ✅ MEJORA: Exportación de componentes útiles
export { PrivateRoute, PublicRoute };

export default React.memo(AppRoutes);