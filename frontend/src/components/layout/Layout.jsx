import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { Toaster } from 'react-hot-toast';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import '../../assets/styles/layout.css';

// ✅ Función debounce optimizada
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// ✅ Componente Loader inline
const Loader = ({ size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  return (
    <div className={`inline-block ${className}`}>
      <div className={`animate-spin rounded-full border-2 border-solid border-primary-500 border-t-transparent ${sizeClasses[size] || sizeClasses.medium}`} />
    </div>
  );
};

const Layout = () => {
  const { user, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  /**
   * ✅ MEJORA: Detección responsive optimizada
   * Usa debounce para mejorar rendimiento en resize
   */
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    // Versión debounced para mejorar rendimiento
    const debouncedCheckMobile = debounce(checkMobile, 150);

    checkMobile(); // Llamada inicial
    window.addEventListener('resize', debouncedCheckMobile);

    return () => {
      window.removeEventListener('resize', debouncedCheckMobile);
    };
  }, []);

  /**
   * ✅ MEJORA: Detectar scroll para efectos visuales
   */
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    const debouncedHandleScroll = debounce(handleScroll, 50);
    window.addEventListener('scroll', debouncedHandleScroll);

    return () => {
      window.removeEventListener('scroll', debouncedHandleScroll);
    };
  }, []);

  /**
   * ✅ MEJORA: Cerrar sidebar al cambiar de ruta en móvil
   */
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile, sidebarOpen]);

  /**
   * ✅ MEJORA: Bloquear scroll optimizado para móvil
   */
  useEffect(() => {
    if (sidebarOpen && isMobile) {
      document.body.classList.add('overflow-hidden', 'lg:overflow-auto');
    } else {
      document.body.classList.remove('overflow-hidden');
    }

    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [sidebarOpen, isMobile]);

  /**
   * ✅ MEJORA: Breadcrumb dinámico mejorado
   */
  const breadcrumbItems = useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const items = [
      { name: 'Inicio', path: '/', current: location.pathname === '/' }
    ];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      // Traducción amigable de segmentos
      const nameMap = {
        'products': 'Productos',
        'inventory': 'Inventario',
        'categories': 'Categorías',
        'qr': 'Códigos QR',
        'reports': 'Reportes',
        'profile': 'Perfil',
        'settings': 'Configuración',
        'users': 'Usuarios',
        'new': 'Nuevo',
        'edit': 'Editar',
        'view': 'Ver'
      };

      items.push({
        name: nameMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
        path: currentPath,
        current: isLast
      });
    });

    return items;
  }, [location.pathname]);

  /**
   * ✅ MEJORA: Loading state mejorado
   */
  if (authLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 bg-linear-to-br from-primary-500 to-primary-700 rounded-2xl shadow-lg mb-6">
            <span className="text-white font-bold text-2xl">IQ</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Cargando Sistema de Inventario
          </h1>
          <Loader size="large" className="mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400 animate-pulse">
            Inicializando módulos...
          </p>
        </div>
      </div>
    );
  }

  /**
   * ✅ MEJORA: Si no hay usuario, redirigir a login
   */
  if (!user) {
    useEffect(() => {
      navigate('/login');
    }, [navigate]);
    return null;
  }

  return (
    <div className={clsx(
      'min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300',
      theme === 'dark' ? 'dark' : ''
    )}>
      {/* ✅ MEJORA: Toaster configurado según tema */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: theme === 'dark' ? '#1f2937' : '#ffffff',
            color: theme === 'dark' ? '#f9fafb' : '#374151',
            boxShadow: theme === 'dark'
              ? '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
              : '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            borderRadius: '0.5rem',
            padding: '1rem',
            maxWidth: '420px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: theme === 'dark' ? '#1f2937' : '#ffffff',
            },
            style: {
              borderLeft: '4px solid #10b981',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: theme === 'dark' ? '#1f2937' : '#ffffff',
            },
            style: {
              borderLeft: '4px solid #ef4444',
            },
          },
          loading: {
            style: {
              borderLeft: '4px solid #3b82f6',
            },
          },
        }}
      />

      {/* ✅ MEJORA: Overlay optimizado para sidebar móvil */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 z-40 bg-gray-900 bg-opacity-75 transition-opacity lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ✅ MEJORA: Sidebar móvil con transiciones mejoradas */}
      <div className={clsx(
        'fixed inset-y-0 left-0 z-50 w-64 transform transition-all duration-300 ease-in-out lg:hidden',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-900'
      )}>
        <div className="relative flex-1 flex flex-col h-full">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 bg-white bg-opacity-10 hover:bg-opacity-20 transition-all"
              onClick={() => setSidebarOpen(false)}
              aria-label="Cerrar menú"
            >
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* ✅ MEJORA: Sidebar desktop con tema */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* ✅ MEJORA: Contenido principal optimizado */}
      <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
        {/* Botón flotante para móvil */}
        {isMobile && !sidebarOpen && (
          <button
            type="button"
            className="fixed bottom-6 left-6 z-50 inline-flex items-center justify-center p-3 rounded-full text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-500 focus:ring-opacity-50 shadow-2xl transition-all animate-bounce"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* Header con efecto de scroll */}
        <Header
          isScrolled={isScrolled}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onToggleTheme={toggleTheme}
          currentTheme={theme}
        />

        {/* Contenido principal */}
        <main
          className="flex-1 relative overflow-y-auto focus:outline-none transition-all duration-200 scrollbar-thin"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* ✅ MEJORA: Breadcrumb mejorado */}
            <nav className="mb-8" aria-label="Navegación">
              <ol className="flex items-center flex-wrap space-x-2">
                {breadcrumbItems.map((item, index) => (
                  <li key={item.path} className="flex items-center">
                    {index > 0 && (
                      <svg
                        className="shrink-0 h-5 w-5 text-gray-400 dark:text-gray-500 mx-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {item.current ? (
                      <span className={clsx(
                        "text-sm font-medium",
                        item.current
                          ? "text-primary-600 dark:text-primary-400"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      )}>
                        {item.name}
                      </span>
                    ) : (
                      <Link
                        to={item.path}
                        className={clsx(
                          "text-sm font-medium transition-colors duration-200",
                          "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        )}
                      >
                        {item.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </nav>

            {/* ✅ MEJORA: Título de página dinámico */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {breadcrumbItems.at(-1)?.name || 'Dashboard'}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {(() => {
                  const page = breadcrumbItems.at(-1)?.name;
                  const descriptions = {
                    'Dashboard': 'Visión general de tu inventario y estadísticas',
                    'Productos': 'Gestiona todos los productos de tu inventario',
                    'Inventario': 'Control de stock y movimientos',
                    'Categorías': 'Organiza productos por categorías',
                    'Códigos QR': 'Genera y gestiona códigos QR',
                    'Reportes': 'Informes y análisis de inventario',
                    'Perfil': 'Configura tu cuenta personal',
                    'Configuración': 'Ajustes del sistema',
                    'Usuarios': 'Gestión de usuarios y permisos'
                  };
                  return descriptions[page] || 'Sistema de Gestión de Inventario QR';
                })()}
              </p>
            </div>

            {/* Contenido de la página */}
            <div className="animate-fade-in">
              <Outlet />
            </div>
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* ✅ MEJORA: Botón de scroll to top */}
      {isScrolled && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-primary-600 text-white shadow-2xl hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-500 focus:ring-opacity-50 transition-all transform hover:-translate-y-1"
          aria-label="Volver arriba"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Layout;