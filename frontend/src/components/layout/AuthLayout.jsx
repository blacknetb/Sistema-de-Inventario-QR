import React from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../assets/styles/layout/layout.css';

const AuthLayout = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Si el usuario ya está autenticado, redirigir al dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Obtener página actual para mostrar título apropiado
  const getPageTitle = () => {
    if (location.pathname.includes('/login')) return 'Iniciar Sesión';
    if (location.pathname.includes('/register')) return 'Crear Cuenta';
    if (location.pathname.includes('/forgot-password')) return 'Recuperar Contraseña';
    if (location.pathname.includes('/reset-password')) return 'Restablecer Contraseña';
    return 'Autenticación';
  };

  const getPageDescription = () => {
    if (location.pathname.includes('/login')) return 'Ingresa a tu cuenta para gestionar tu inventario';
    if (location.pathname.includes('/register')) return 'Crea una nueva cuenta para comenzar';
    if (location.pathname.includes('/forgot-password')) return 'Recupera el acceso a tu cuenta';
    if (location.pathname.includes('/reset-password')) return 'Establece una nueva contraseña';
    return 'Sistema de Gestión de Inventario QR';
  };

  return (
    <div className="auth-layout">
      <div className="auth-layout-container">
        {/* Header */}
        <header className="auth-header">
          <Link to="/" className="auth-logo">
            <div className="auth-logo-icon">QR</div>
            <div className="auth-logo-text">
              <span className="auth-logo-title">Inventario QR</span>
              <span className="auth-logo-subtitle">Sistema de Gestión</span>
            </div>
          </Link>
          
          <nav className="auth-nav">
            <Link 
              to="/login" 
              className={`auth-nav-link ${location.pathname.includes('/login') ? 'active' : ''}`}
            >
              Iniciar Sesión
            </Link>
            <Link 
              to="/register" 
              className={`auth-nav-link ${location.pathname.includes('/register') ? 'active' : ''}`}
            >
              Registrarse
            </Link>
          </nav>
        </header>

        {/* Contenido principal */}
        <main className="auth-main">
          <div className="auth-content-wrapper">
            {/* Panel izquierdo (información) */}
            <div className="auth-info-panel">
              <div className="auth-info-content">
                <h1 className="auth-info-title">
                  Sistema de Gestión de Inventario QR
                </h1>
                <p className="auth-info-description">
                  Controla tu inventario de manera eficiente con códigos QR. 
                  Escanea, gestiona y realiza seguimiento de todos tus productos 
                  desde cualquier dispositivo.
                </p>
                
                <div className="auth-features">
                  <div className="auth-feature">
                    <div className="auth-feature-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 9 12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M19.4 15C20.2 13.8 21 12.4 21 11C21 7.1 16.9 4 12 4C7.1 4 3 7.1 3 11C3 12.4 3.8 13.8 4.6 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="auth-feature-text">
                      <h3>Escaneo QR Rápido</h3>
                      <p>Escanea códigos QR en segundos</p>
                    </div>
                  </div>
                  
                  <div className="auth-feature">
                    <div className="auth-feature-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6L9 12L3 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M15 6L21 12L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="auth-feature-text">
                      <h3>Reportes en Tiempo Real</h3>
                      <p>Información actualizada al instante</p>
                    </div>
                  </div>
                  
                  <div className="auth-feature">
                    <div className="auth-feature-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="auth-feature-text">
                      <h3>Gestión Completa</h3>
                      <p>Control total de tu inventario</p>
                    </div>
                  </div>
                </div>
                
                <div className="auth-testimonials">
                  <div className="auth-testimonial">
                    <p className="auth-testimonial-text">
                      "Esta aplicación ha transformado completamente la forma 
                      en que gestionamos nuestro inventario."
                    </p>
                    <p className="auth-testimonial-author">
                      — María González, Gerente de Operaciones
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel derecho (formulario) */}
            <div className="auth-form-panel">
              <div className="auth-form-container">
                <div className="auth-form-header">
                  <h2 className="auth-form-title">{getPageTitle()}</h2>
                  <p className="auth-form-subtitle">{getPageDescription()}</p>
                </div>
                
                <div className="auth-form-content">
                  <Outlet />
                </div>
                
                <div className="auth-form-footer">
                  {location.pathname.includes('/login') ? (
                    <>
                      <p>
                        ¿No tienes cuenta?{' '}
                        <Link to="/register" className="auth-form-link">
                          Regístrate aquí
                        </Link>
                      </p>
                      <Link to="/forgot-password" className="auth-form-link">
                        ¿Olvidaste tu contraseña?
                      </Link>
                    </>
                  ) : location.pathname.includes('/register') ? (
                    <>
                      <p>
                        ¿Ya tienes cuenta?{' '}
                        <Link to="/login" className="auth-form-link">
                          Inicia sesión aquí
                        </Link>
                      </p>
                      <p className="auth-form-terms">
                        Al registrarte, aceptas nuestros{' '}
                        <Link to="/terms" className="auth-form-link">
                          Términos de Servicio
                        </Link>{' '}
                        y{' '}
                        <Link to="/privacy" className="auth-form-link">
                          Política de Privacidad
                        </Link>
                      </p>
                    </>
                  ) : location.pathname.includes('/forgot-password') ? (
                    <Link to="/login" className="auth-form-link">
                      ← Volver a iniciar sesión
                    </Link>
                  ) : location.pathname.includes('/reset-password') ? (
                    <Link to="/login" className="auth-form-link">
                      ← Volver a iniciar sesión
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="auth-footer">
          <div className="auth-footer-content">
            <p className="auth-footer-copyright">
              © {new Date().getFullYear()} Sistema de Inventario QR. Todos los derechos reservados.
            </p>
            <div className="auth-footer-links">
              <Link to="/terms" className="auth-footer-link">
                Términos de Servicio
              </Link>
              <Link to="/privacy" className="auth-footer-link">
                Política de Privacidad
              </Link>
              <Link to="/help" className="auth-footer-link">
                Ayuda
              </Link>
              <Link to="/contact" className="auth-footer-link">
                Contacto
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AuthLayout;