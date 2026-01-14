import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Search, AlertCircle, RefreshCw,
  Mail, HelpCircle, ArrowRight, ExternalLink,
  Shield, WifiOff, Server, Clock,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import PropTypes from 'prop-types';

// ✅ Componente de animación de error con PropTypes
const ErrorAnimation = ({ errorType }) => {
  const getAnimationConfig = () => {
    const configs = {
      unauthorized: { icon: Shield, color: 'text-red-500', bgColor: 'bg-red-50' },
      api_error: { icon: Server, color: 'text-orange-500', bgColor: 'bg-orange-50' },
      authentication: { icon: Shield, color: 'text-purple-500', bgColor: 'bg-purple-50' },
      default: { icon: AlertCircle, color: 'text-blue-500', bgColor: 'bg-blue-50' }
    };

    return configs[errorType] || configs.default;
  };

  const { icon: Icon, color, bgColor } = getAnimationConfig();

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        duration: 0.5
      }}
      className="relative mb-8"
    >
      <div className={`${bgColor} rounded-full p-8 inline-block`}>
        <Icon className={`w-24 h-24 ${color}`} />
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="absolute -top-2 -right-2"
      >
        <div className="bg-white rounded-full p-3 shadow-lg">
          <div className="text-4xl font-bold text-gray-900">404</div>
        </div>
      </motion.div>
    </motion.div>
  );
};

ErrorAnimation.propTypes = {
  errorType: PropTypes.oneOf(['unauthorized', 'api_error', 'authentication', 'not_found']).isRequired
};

// ✅ Componente de sugerencias dinámicas con PropTypes
const DynamicSuggestions = ({ errorType, suggestions }) => {
  const getErrorTitle = () => {
    const titles = {
      unauthorized: 'Acceso Restringido',
      api_error: 'Error del Servidor',
      authentication: 'Error de Autenticación',
      default: 'Página No Encontrada'
    };

    return titles[errorType] || titles.default;
  };

  const getErrorDescription = () => {
    const descriptions = {
      unauthorized: 'No tienes permisos para acceder a esta sección.',
      api_error: 'Hubo un problema al conectar con el servidor.',
      authentication: 'Tu sesión ha expirado o no tienes permisos.',
      default: 'La página que estás buscando no existe o ha sido movida.'
    };

    return descriptions[errorType] || descriptions.default;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {getErrorTitle()}
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {getErrorDescription()}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <HelpCircle className="w-5 h-5 mr-2 text-blue-600" />
          ¿Qué puedes hacer?
        </h3>
        <ul className="space-y-3">
          {suggestions.map((suggestion) => (
            <motion.li
              key={`suggestion-${suggestion}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-start p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              <div className="bg-blue-100 text-blue-600 rounded-full p-2 mr-3 flex items-center justify-center h-8 w-8 shrink-0">
                <span className="text-sm font-bold">{suggestions.indexOf(suggestion) + 1}</span>
              </div>
              <span className="text-gray-700">{suggestion}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
};

DynamicSuggestions.propTypes = {
  errorType: PropTypes.oneOf(['unauthorized', 'api_error', 'authentication', 'not_found']).isRequired,
  suggestions: PropTypes.arrayOf(PropTypes.string).isRequired
};

// ✅ Hook para análisis del error
const useErrorAnalysis = () => {
  const location = useLocation();
  const [errorType, setErrorType] = useState('not_found');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const analyzeError = () => {
      const path = location.pathname;
      const searchParams = new URLSearchParams(location.search);

      // Detectar tipo de error basado en la URL
      if (path.includes('/admin') || path.includes('/dashboard')) {
        setErrorType('unauthorized');
        setSuggestions([
          'Verifica que tengas permisos de administrador',
          'Contacta al administrador del sistema',
          'Regresa a la página principal'
        ]);
      } else if (path.includes('/api/') || path.includes('/graphql')) {
        setErrorType('api_error');
        setSuggestions([
          'Verifica tu conexión a internet',
          'Intenta recargar la página',
          'Contacta al equipo técnico'
        ]);
      } else if (searchParams.get('error') === 'auth') {
        setErrorType('authentication');
        setSuggestions([
          'Inicia sesión nuevamente',
          'Verifica tus credenciales',
          'Contacta al administrador'
        ]);
      } else {
        setErrorType('not_found');
        setSuggestions([
          'Verifica que la URL sea correcta',
          'Regresa a la página anterior',
          'Explora otras secciones del sitio'
        ]);
      }
    };

    analyzeError();

    // Log del error para analytics
    if (process.env.NODE_ENV === 'production') {
      console.error('404 Error:', {
        path: location.pathname,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        errorType
      });
    }
  }, [location]);

  return { errorType, suggestions };
};

// ✅ Componente de acciones de error con manejo de globalThis
const ErrorActions = ({ errorType }) => {
  const navigate = useNavigate();

  const handleRefresh = useCallback(() => {
    globalThis.location.reload();
  }, []);

  const handleGoBack = useCallback(() => {
    if (globalThis.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  }, [navigate]);

  const getActions = () => {
    const baseActions = [
      {
        id: 'home',
        label: 'Volver al Inicio',
        icon: Home,
        action: () => navigate('/'),
        variant: 'primary'
      },
      {
        id: 'refresh',
        label: 'Recargar Página',
        icon: RefreshCw,
        action: handleRefresh,
        variant: 'secondary'
      }
    ];

    if (errorType === 'authentication') {
      baseActions.unshift({
        id: 'login',
        label: 'Iniciar Sesión',
        icon: Shield,
        action: () => navigate('/login'),
        variant: 'primary'
      });
    }

    if (globalThis.history.length > 1) {
      baseActions.push({
        id: 'back',
        label: 'Volver Atrás',
        icon: ArrowRight,
        action: handleGoBack,
        variant: 'outline'
      });
    }

    return baseActions;
  };

  // ✅ Función extraída para determinar la clase del botón
  const getButtonClass = (variant) => {
    const baseClass = "px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center min-w-[140px]";
    
    if (variant === 'primary') {
      return `${baseClass} bg-blue-600 text-white hover:bg-blue-700`;
    }
    
    if (variant === 'secondary') {
      return `${baseClass} bg-gray-600 text-white hover:bg-gray-700`;
    }
    
    return `${baseClass} border border-gray-300 text-gray-700 hover:bg-gray-50`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {getActions().map((action, idx) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 + 0.5 }}
              onClick={action.action}
              className={getButtonClass(action.variant)}
            >
              <Icon className="w-5 h-5 mr-2" />
              {action.label}
            </motion.button>
          );
        })}
      </div>

      <div className="text-center">
        <p className="text-gray-500 text-sm">
          ¿Necesitas ayuda adicional?{' '}
          <a
            href="mailto:soporte@inventarioqr.com"
            className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contacta a soporte
            <ExternalLink className="w-4 h-4 ml-1" />
          </a>
        </p>
      </div>
    </div>
  );
};

ErrorActions.propTypes = {
  errorType: PropTypes.oneOf(['unauthorized', 'api_error', 'authentication', 'not_found']).isRequired
};

// ✅ Componente de diagnóstico
const ErrorDiagnostics = () => {
  const [diagnostics, setDiagnostics] = useState({
    online: true,
    apiAvailable: true,
    timestamp: new Date().toISOString(),
    userAgent: globalThis.navigator?.userAgent || ''
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkConnectivity = useCallback(async () => {
    try {
      setIsChecking(true);
      // Verificar conectividad a internet
      const online = globalThis.navigator?.onLine || false;

      // Verificar API (opcional)
      let apiAvailable = false;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch('/api/health', {
          method: 'HEAD',
          cache: 'no-cache',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        apiAvailable = response.ok;
      } catch {
        apiAvailable = false;
      }

      setDiagnostics({
        online,
        apiAvailable,
        timestamp: new Date().toISOString(),
        userAgent: globalThis.navigator?.userAgent || ''
      });
    } catch (error) {
      console.error('Error en diagnóstico:', error);
      setDiagnostics(prev => ({
        ...prev,
        online: globalThis.navigator?.onLine || false,
        timestamp: new Date().toISOString()
      }));
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkConnectivity();
  }, [checkConnectivity]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="mt-8 pt-6 border-t border-gray-200"
    >
      <details className="group">
        <summary className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer flex items-center justify-center transition-colors">
          <WifiOff className="w-4 h-4 mr-2" />
          Ver información de diagnóstico
        </summary>
        <div className="mt-3 p-4 bg-gray-50 rounded-lg text-left">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-600">Estado conexión:</span>
              <span className={`ml-2 font-medium ${diagnostics.online ? 'text-green-600' : 'text-red-600'}`}>
                {diagnostics.online ? 'En línea' : 'Sin conexión'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">API disponible:</span>
              <span className={`ml-2 font-medium ${diagnostics.apiAvailable ? 'text-green-600' : 'text-red-600'}`}>
                {diagnostics.apiAvailable ? 'Sí' : 'No'}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">Hora del error:</span>
              <span className="ml-2 font-medium">
                {new Date(diagnostics.timestamp).toLocaleTimeString('es-ES')}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <button
              onClick={checkConnectivity}
              disabled={isChecking}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center transition-colors disabled:opacity-50"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Verificar nuevamente
                </>
              )}
            </button>
          </div>
        </div>
      </details>
    </motion.div>
  );
};

// ✅ Componente principal NotFound
const NotFound = () => {
  const { errorType, suggestions } = useErrorAnalysis();
  const [showHelp, setShowHelp] = useState(false);
  const navigate = useNavigate();

  // Efecto para mostrar toast en ciertos tipos de error
  useEffect(() => {
    if (errorType === 'api_error' || errorType === 'authentication') {
      let toastMessage, toastIcon;
      
      if (errorType === 'api_error') {
        toastMessage = 'Error de conexión con el servidor';
        toastIcon = <Server className="w-5 h-5" />;
      } else {
        toastMessage = 'Tu sesión ha expirado';
        toastIcon = <Shield className="w-5 h-5" />;
      }

      toast.error(toastMessage, {
        duration: 5000,
        icon: toastIcon
      });
    }
  }, [errorType]);

  // ✅ Función para manejar búsqueda
  const handleSearch = useCallback((e) => {
    if (e.key === 'Enter') {
      const query = e.target.value.trim();
      if (query) {
        // Redirigir a búsqueda
        navigate(`/search?q=${encodeURIComponent(query)}`);
      } else {
        toast.error('Por favor, ingresa un término de búsqueda');
      }
    }
  }, [navigate]);

  // ✅ CORRECCIÓN: Función para manejar volver atrás
  const handleGoBack = useCallback(() => {
    if (globalThis.history?.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full text-center"
      >
        <ErrorAnimation errorType={errorType} />

        <DynamicSuggestions
          errorType={errorType}
          suggestions={suggestions}
        />

        <div className="my-8">
          <ErrorActions errorType={errorType} />
        </div>

        <ErrorDiagnostics />

        {/* Sección de búsqueda */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-8"
        >
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar en el sitio..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              onKeyPress={handleSearch}
            />
          </div>
        </motion.div>

        {/* Enlaces rápidos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {[
            { to: '/products', label: 'Productos' },
            { to: '/dashboard', label: 'Dashboard' },
            { to: '/scanner', label: 'Escáner QR' },
            { to: '/settings', label: 'Configuración' }
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm text-gray-700 hover:text-gray-900"
            >
              {link.label}
            </Link>
          ))}
        </motion.div>

        {/* Botón para volver a la página anterior */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="mt-6"
        >
          <button
            onClick={handleGoBack}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a la página anterior
          </button>
        </motion.div>

        {/* Footer informativo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-12 pt-6 border-t border-gray-200"
        >
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Sistema de Inventario QR •
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="ml-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              {showHelp ? 'Ocultar ayuda' : 'Mostrar ayuda'}
            </button>
          </p>

          <AnimatePresence>
            {showHelp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 bg-blue-50 rounded-lg text-left overflow-hidden"
              >
                <h4 className="font-semibold text-blue-800 mb-2">Soporte técnico</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li className="flex items-start">
                    <Mail className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                    Correo: soporte@inventarioqr.com
                  </li>
                  <li className="flex items-start">
                    <Clock className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                    Horario: Lunes a Viernes de 7:00 AM a 5:00 PM
                  </li>
                  <li className="flex items-start">
                    <AlertCircle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                    Urgencias: +506 xxxx-xxxx
                  </li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
};

// ✅ Configuración del componente
NotFound.displayName = 'NotFound';

export default NotFound;
