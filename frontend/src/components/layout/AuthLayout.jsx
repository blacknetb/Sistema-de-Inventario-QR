import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingScreen';
import '../../assets/styles/layout.css';

const AuthLayout = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ EFECTO PARA REDIRIGIR SI YA ESTÁ AUTENTICADO
  useEffect(() => {
    if (!loading && user) {
      console.log('✅ Usuario ya autenticado, redirigiendo a dashboard');

      // Redirigir al dashboard o a la ruta previa
      const from = location.state?.from || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, location]);

  // ✅ CARGANDO
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
        <LoadingSpinner size="lg" text="Verificando autenticación..." />
      </div>
    );
  }

  // ✅ DETERMINAR ENLACE DE AUTENTICACIÓN BASADO EN LA RUTA ACTUAL
  const getAuthLink = () => {
    if (location.pathname === '/login') {
      return (
        <p>
          ¿No tienes una cuenta?{' '}
          <a
            href="/register"
            className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Regístrate aquí
          </a>
        </p>
      );
    } else if (location.pathname === '/register') {
      return (
        <p>
          ¿Ya tienes una cuenta?{' '}
          <a
            href="/login"
            className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Inicia sesión aquí
          </a>
        </p>
      );
    }
    return null;
  };

  // ✅ RENDERIZADO DEL LAYOUT DE AUTENTICACIÓN
  return (
    <div className="min-h-screen bg-linear-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
      {/* ✅ FONDO DECORATIVO */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* ✅ CONTENIDO PRINCIPAL */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        {/* ✅ HEADER DEL LAYOUT DE AUTENTICACIÓN */}
        <header className="w-full max-w-md mb-8 text-center">
          <div className="flex flex-col items-center">
            {/* LOGO */}
            <div className="mb-4">
              <div className="w-16 h-16 bg-linear-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
              </div>
            </div>

            {/* TÍTULO */}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Sistema de Inventario QR
            </h1>

            {/* DESCRIPCIÓN */}
            <p className="text-gray-600 dark:text-gray-300">
              Gestión profesional de inventario con códigos QR
            </p>
          </div>
        </header>

        {/* ✅ CONTENIDO DE AUTENTICACIÓN */}
        <main className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            {/* DECORACIÓN SUPERIOR */}
            <div className="h-2 bg-linear-to-br from-primary-500 via-primary-600 to-primary-700"></div>

            {/* CONTENIDO DINÁMICO */}
            <div className="p-6 md:p-8">
              <div className="animate-fade-in">
                <Outlet />
              </div>
            </div>
          </div>

          {/* ✅ ENLACES ADICIONALES */}
          <div className="mt-6 text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {getAuthLink()}
            </div>

            {/* ✅ ENLACE DE RECUPERACIÓN */}
            {location.pathname === '/login' && (
              <div className="mt-4">
                <a
                  href="/forgot-password"
                  className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            )}
          </div>
        </main>

        {/* ✅ FOOTER DEL LAYOUT DE AUTENTICACIÓN */}
        <footer className="mt-8 text-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p className="mb-2">
              © {new Date().getFullYear()} Sistema de Inventario QR. Todos los derechos reservados.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { href: '/privacy', text: 'Política de privacidad' },
                { href: '/terms', text: 'Términos de servicio' },
                { href: '/help', text: 'Ayuda' },
                { href: '/contact', text: 'Contacto' }
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {link.text}
                </a>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AuthLayout;