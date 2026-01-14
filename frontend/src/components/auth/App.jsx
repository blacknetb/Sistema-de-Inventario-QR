import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './PrivateRoute';
import { authService } from './authService';
import '../../assets/styles/Auth.css';


// Lazy loading para componentes de autenticación
const LoginPage = lazy(() => import('./LoginForm').then(module => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('./RegisterForm').then(module => ({ default: module.RegisterPage })));
const PrivateRoute = lazy(() => import('./PrivateRoute'));

// Lazy loading para componentes protegidos
const Dashboard = lazy(() => import('./Dashboard'));
const AdminDashboard = lazy(() => import('./AdminDashboard'));

// Componentes estáticos
const LoadingSpinner = () => (
  <div className="auth-loading">
    <div className="loading-container">
      <div className="spinner" aria-label="Cargando"></div>
      <p>Cargando aplicación...</p>
    </div>
  </div>
);

const UnauthorizedPage = () => (
  <div className="login-page">
    <div className="login-container">
      <div className="login-card">
        <div className="alert alert-error">
          <h2>Acceso No Autorizado</h2>
          <p>No tienes permisos para acceder a esta página.</p>
          <button 
            onClick={() => window.history.back()} 
            className="submit-btn"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Componente de error boundaries
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error en componente:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="login-page">
          <div className="login-container">
            <div className="login-card">
              <div className="alert alert-error">
                <h2>Algo salió mal</h2>
                <p>Error: {this.state.error?.message}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="submit-btn"
                >
                  Recargar página
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => {
  useEffect(() => {
    // Inicializar configuración global
    if (!window.APP_CONFIG) {
      window.APP_CONFIG = {
        api: {
          baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
          timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000
        },
        app: {
          name: 'Sistema de Inventario QR',
          version: '1.0.0',
          environment: process.env.NODE_ENV
        }
      };
    }

    // Verificar autenticación al cargar
    const checkAuth = async () => {
      try {
        const isAuthenticated = await authService.isAuthenticated();
        console.log('🔐 Estado de autenticación inicial:', isAuthenticated);
      } catch (error) {
        console.error('❌ Error verificando autenticación:', error);
      }
    };

    checkAuth();

    // Limpiar intervalos al desmontar
    return () => {
      // Limpiar cualquier listener si es necesario
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Rutas públicas */}
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/register" element={<RegisterPage />} />
              <Route path="/auth/forgot-password" element={<div>Página de recuperación (pendiente)</div>} />
              
              {/* Ruta de error 404 */}
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              
              {/* Rutas protegidas */}
              <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<div>Perfil de usuario</div>} />
                <Route path="/settings" element={<div>Configuración</div>} />
              </Route>
              
              {/* Rutas de administrador */}
              <Route element={<PrivateRoute.Admin redirectTo="/unauthorized" />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<div>Gestión de usuarios</div>} />
                <Route path="/admin/settings" element={<div>Configuración del sistema</div>} />
              </Route>
              
              {/* Ruta raíz */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Ruta comodín para 404 */}
              <Route path="*" element={
                <div className="login-page">
                  <div className="login-container">
                    <div className="login-card">
                      <h2>404 - Página no encontrada</h2>
                      <p>La página que buscas no existe.</p>
                      <button 
                        onClick={() => window.location.href = '/'} 
                        className="submit-btn"
                      >
                        Ir al inicio
                      </button>
                    </div>
                  </div>
                </div>
              } />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;