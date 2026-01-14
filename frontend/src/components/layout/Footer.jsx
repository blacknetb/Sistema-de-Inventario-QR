import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { useTheme } from '../../hooks/useTheme';
import PropTypes from 'prop-types';
import '../../assets/styles/layout.css';

// ✅ COMPONENTES DE ICONOS CON VALIDACIÓN
const HeartIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
      clipRule="evenodd"
    />
  </svg>
);

HeartIcon.propTypes = {
  className: PropTypes.string,
};

HeartIcon.defaultProps = {
  className: '',
};

const ArrowUpIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 10l7-7m0 0l7 7m-7-7v18"
    />
  </svg>
);

ArrowUpIcon.propTypes = {
  className: PropTypes.string,
};

ArrowUpIcon.defaultProps = {
  className: '',
};

const Footer = () => {
  const [currentYear] = useState(new Date().getFullYear());
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [isVisible, setIsVisible] = useState(false);
  const { theme } = useTheme();

  /**
   * ✅ MEJORA: Configuración dinámica de la app
   */
  useEffect(() => {
    setAppVersion(process.env.REACT_APP_VERSION || '1.0.0');

    // Mostrar animación después de carga
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  /**
   * ✅ MEJORA: Información de contacto y enlaces optimizada
   */
  const quickLinks = React.useMemo(() => [
    { name: 'Productos', href: '/products' },
    { name: 'Inventario', href: '/inventory' },
    { name: 'Códigos QR', href: '/qr' },
    { name: 'Reportes', href: '/reports' }
  ], []);

  const supportLinks = React.useMemo(() => [
    { name: 'Documentación', href: '/docs' },
    { name: 'Guías de uso', href: '/guides' },
    { name: 'Preguntas frecuentes', href: '/faq' },
    { name: 'Soporte técnico', href: '/support' }
  ], []);

  const legalLinks = React.useMemo(() => [
    { name: 'Privacidad', href: '/privacy' },
    { name: 'Términos', href: '/terms' },
    { name: 'Cookies', href: '/cookies' },
    { name: 'Licencia', href: '/license' }
  ], []);

  const socialLinks = React.useMemo(() => [
    {
      name: 'GitHub',
      href: 'https://github.com',
      color: 'hover:text-gray-900 dark:hover:text-white'
    },
    {
      name: 'Twitter',
      href: 'https://twitter.com',
      color: 'hover:text-blue-400'
    },
    {
      name: 'Correo',
      href: 'mailto:soporte@inventarioqr.com',
      color: 'hover:text-red-400'
    },
    {
      name: 'Sitio web',
      href: 'https://inventarioqr.com',
      color: 'hover:text-green-400'
    }
  ], []);

  /**
   * ✅ MEJORA: Scroll to top optimizado
   */
  const scrollToTop = React.useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  return (
    <footer className={clsx(
      'bg-gray-800 dark:bg-gray-900 text-gray-300 transition-colors duration-300',
      'border-t border-gray-700 dark:border-gray-800',
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
      'transition-all duration-700'
    )}>
      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Branding y descripción */}
          <div className="col-span-1 lg:col-span-2">
            <div className="flex items-start">
              <div className="h-12 w-12 bg-linear-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">IQ</span>
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-white">
                  Sistema de Inventario QR
                </h3>
                <p className="mt-2 text-sm text-gray-400 max-w-md">
                  Plataforma profesional para la gestión eficiente de inventarios mediante
                  códigos QR. Controla stock, genera reportes y optimiza tus operaciones.
                </p>
                <div className="mt-6 flex space-x-4">
                  {socialLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={clsx(
                        'text-gray-400 transition-all duration-300 transform hover:scale-110',
                        link.color
                      )}
                      aria-label={link.name}
                      title={link.name}
                    >
                      {link.name.charAt(0)}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Navegación rápida
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className={clsx(
                      "text-sm hover:text-white transition-colors duration-200",
                      "flex items-center group"
                    )}
                  >
                    <span className="h-1 w-1 rounded-full bg-gray-600 mr-2 group-hover:bg-primary-500 transition-colors" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Soporte y legal */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Soporte & Legal
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <ul className="space-y-3">
                {supportLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className={clsx(
                        "text-sm hover:text-white transition-colors duration-200",
                        "flex items-center"
                      )}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>

              <ul className="space-y-3">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className={clsx(
                        "text-sm hover:text-white transition-colors duration-200",
                        "flex items-center"
                      )}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Divider y información inferior */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="flex flex-col lg:flex-row justify-between items-center">
            {/* Copyright y versión */}
            <div className="text-center lg:text-left mb-6 lg:mb-0">
              <p className="text-base text-gray-400">
                &copy; {currentYear} Sistema de Inventario QR. Todos los derechos reservados.
              </p>
              <div className="mt-2 flex items-center justify-center lg:justify-start space-x-4 text-sm">
                <span className="text-gray-500">v{appVersion}</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-500">
                  Desarrollado con <HeartIcon className="inline h-4 w-4 text-red-400 mx-1" />
                  por el equipo de desarrollo
                </span>
              </div>
            </div>

            {/* Botón scroll to top */}
            <button
              onClick={scrollToTop}
              className={clsx(
                "flex items-center px-4 py-2 rounded-lg",
                "bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white",
                "transition-all duration-300 transform hover:-translate-y-1",
                "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
              )}
              aria-label="Volver arriba"
            >
              <ArrowUpIcon className="h-4 w-4 mr-2" />
              Volver arriba
            </button>
          </div>
        </div>

        {/* Información técnica */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p>
                Sistema optimizado para Chrome 90+, Firefox 88+, Safari 14+
              </p>
              <p className="mt-1">
                Resolución recomendada: 1280×720 o superior
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-2" />
                <span>Sistema operativo</span>
              </div>
              <span className="hidden md:inline">•</span>
              <span>
                Última actualización: {new Date().toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Nota importante */}
      <div className="bg-gray-900 dark:bg-gray-950 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-xs text-gray-500">
            <p>
              Este es un sistema profesional de gestión de inventario. Para asistencia técnica
              contacta a{' '}
              <a
                href="mailto:soporte@inventarioqr.com"
                className="text-primary-400 hover:text-primary-300 transition-colors"
              >
                soporte@inventarioqr.com
              </a>
            </p>
            <p className="mt-1">
              El uso no autorizado o la distribución de este software está estrictamente prohibido.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

Footer.propTypes = {
  // Propiedades del componente si las hubiera
};

export default Footer;