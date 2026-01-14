import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, Eye, EyeOff, LogIn,
  Smartphone, Shield, AlertCircle, CheckCircle,
  Loader2, QrCode, ExternalLink, RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../redux/slices/authSlice';
import { useAuth } from '../hooks/useAuth';
import { useForm, validators } from '../hooks/useForm';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';
import ReCAPTCHA from 'react-google-recaptcha';
import PropTypes from 'prop-types';
// ✅ CORRECCIÓN: Tipos de métodos de login mejorados
const LOGIN_METHODS = {
  EMAIL: 'email',
  QR: 'qr',
  SSO: 'sso'
};

// ✅ CORRECCIÓN: Estados de QR
const QR_STATUS = {
  WAITING: 'waiting',
  SCANNING: 'scanning',
  SUCCESS: 'success',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled'
};

const FeatureItem = ({ icon, color, title, description, index }) => {
  const getColorClasses = (colorType) => {
    switch (colorType) {
      case "green":
        return { bg: "bg-green-100", text: "text-green-600" };
      case "blue":
        return { bg: "bg-blue-100", text: "text-blue-600" };
      case "purple":
        return { bg: "bg-purple-100", text: "text-purple-600" };
      default:
        return { bg: "bg-blue-100", text: "text-blue-600" };
    }
  };

  const colorClasses = getColorClasses(color);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="flex items-start"
    >
      <div
        className={`shrink-0 mt-1 w-8 h-8 ${colorClasses.bg} rounded-full flex items-center justify-center`}
      >
        <span className={`${colorClasses.text} font-bold text-lg`}>
          {icon}
        </span>
      </div>
      <div className="ml-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </motion.div>
  );
};

// ✅ Validación de props
FeatureItem.propTypes = {
  icon: PropTypes.node.isRequired,        // puede ser un componente o string
  color: PropTypes.oneOf(["green", "blue", "purple"]).isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
};


// ✅ CORRECCIÓN: Configuración de estado QR reutilizable
const getQrStatusConfig = (qrStatus) => {
  const statusConfig = {
    [QR_STATUS.WAITING]: {
      icon: <Loader2 className="w-8 h-8 animate-spin text-blue-600" />,
      text: 'Esperando escaneo...',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    [QR_STATUS.SCANNING]: {
      icon: <QrCode className="w-8 h-8 text-yellow-600" />,
      text: 'Escaneando...',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    [QR_STATUS.SUCCESS]: {
      icon: <CheckCircle className="w-8 h-8 text-green-600" />,
      text: '¡Login exitoso!',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    [QR_STATUS.EXPIRED]: {
      icon: <AlertCircle className="w-8 h-8 text-red-600" />,
      text: 'QR expirado',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    [QR_STATUS.CANCELLED]: {
      icon: <AlertCircle className="w-8 h-8 text-gray-600" />,
      text: 'Cancelado',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    }
  };

  return statusConfig[qrStatus] || statusConfig[QR_STATUS.WAITING];
};

// ✅ CORRECCIÓN: Opciones de método de login
const loginMethodOptions = [
  { method: LOGIN_METHODS.EMAIL, icon: Mail, label: 'Correo' },
  { method: LOGIN_METHODS.QR, icon: QrCode, label: 'QR' },
  { method: LOGIN_METHODS.SSO, icon: Smartphone, label: 'SSO' }
];

// ✅ CORRECCIÓN: Características de la plataforma
const platformFeatures = [
  {
    icon: '✓',
    color: 'green',
    title: 'Control en tiempo real',
    description: 'Monitorea tu inventario al instante desde cualquier dispositivo.'
  },
  {
    icon: '📊',
    color: 'blue',
    title: 'Reportes avanzados',
    description: 'Análisis detallados y reportes personalizados para mejores decisiones.'
  },
  {
    icon: '⚡',
    color: 'purple',
    title: 'Escaneo QR rápido',
    description: 'Actualiza inventario en segundos con escaneo de códigos QR.'
  }
];

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { login, loading: authLoading } = useAuth(); // ✅ CORRECCIÓN: authError eliminado

  // Estado del componente
  const [loginMethod, setLoginMethod] = useState(LOGIN_METHODS.EMAIL);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrStatus, setQrStatus] = useState(QR_STATUS.WAITING);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  // Referencias
  const recaptchaRef = useRef(null);
  const qrPollingInterval = useRef(null);
  const isMounted = useRef(true);

  // ✅ CORRECCIÓN: Obtener URL de retorno desde la query string mejorado
  const getReturnUrl = () => {
    try {
      const from = location.state?.from?.pathname || '/dashboard';
      const searchParams = new URLSearchParams(location.search);
      const returnUrl = searchParams.get('returnUrl');

      if (returnUrl?.startsWith?.('/')) {
        return returnUrl;
      }

      return from;
    } catch (error) {
      console.error('Error parsing return URL:', error);
      return '/dashboard';
    }
  };

  const returnUrl = getReturnUrl();

  // ✅ CORRECCIÓN: Validadores del formulario mejorados
  const validatorsConfig = {
    email: [
      validators.required('El correo electrónico es requerido'),
      validators.email('Correo electrónico inválido')
    ],
    password: [
      validators.required('La contraseña es requerida'),
      validators.minLength(6, 'La contraseña debe tener al menos 6 caracteres')
    ]
  };

  // ✅ CORRECCIÓN: Hook de formulario con manejo de errores
  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit: formSubmit,
    setErrors,
    resetForm
  } = useForm(
    {
      email: '',
      password: ''
    },
    validatorsConfig,
    {
      validateOnChange: true,
      validateOnBlur: true
    }
  );

  // ✅ CORRECCIÓN: Cleanup effect para polling
  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
      stopQrPolling();
    };
  }, []);

  // ✅ CORRECCIÓN: Función para detener polling QR
  const stopQrPolling = useCallback(() => {
    if (qrPollingInterval.current) {
      clearInterval(qrPollingInterval.current);
      qrPollingInterval.current = null;
    }
  }, []);

  // ✅ CORRECCIÓN: Función para generar QR code de login mejorada
  const generateQrCode = useCallback(async () => {
    if (isGeneratingQr) return;

    try {
      setIsGeneratingQr(true);
      setQrStatus(QR_STATUS.WAITING);
      stopQrPolling();

      const response = await api.post('/api/auth/qr/generate');
      const { qrCodeUrl, sessionId } = response.data?.data || response.data || {};

      if (!qrCodeUrl || !sessionId) {
        throw new Error('No se pudo generar el código QR');
      }

      setQrCodeUrl(qrCodeUrl);
      setQrStatus(QR_STATUS.WAITING);

      // Iniciar polling para verificar estado
      startQrPolling(sessionId);
    } catch (error) {
      console.error('QR generation error:', error);
      if (isMounted.current) {
        setQrStatus(QR_STATUS.EXPIRED);
        toast.error(error.response?.data?.message || 'Error al generar código QR');
      }
    } finally {
      if (isMounted.current) {
        setIsGeneratingQr(false);
      }
    }
  }, [isGeneratingQr, stopQrPolling]);

  // ✅ CORRECCIÓN: Polling para verificar estado del QR mejorado
  const startQrPolling = useCallback((sessionId) => {
    stopQrPolling();

    qrPollingInterval.current = setInterval(async () => {
      if (!isMounted.current) {
        stopQrPolling();
        return;
      }

      try {
        const response = await api.get(`/api/auth/qr/status/${sessionId}`);
        const { status, token, user } = response.data?.data || response.data || {};

        if (isMounted.current) {
          setQrStatus(status || QR_STATUS.WAITING);

          if (status === QR_STATUS.SUCCESS && token && user) {
            // Login exitoso
            stopQrPolling();

            dispatch(setCredentials({ user, token }));
            handleLoginSuccess(user);
          } else if (status === QR_STATUS.EXPIRED || status === QR_STATUS.CANCELLED) {
            // QR expirado o cancelado
            stopQrPolling();
          }
        }
      } catch (error) {
        console.error('QR polling error:', error);
        if (isMounted.current && error.response?.status === 404) {
          // Sesión no encontrada, probablemente expirada
          stopQrPolling();
          setQrStatus(QR_STATUS.EXPIRED);
        }
      }
    }, 2000); // Poll cada 2 segundos
  }, [dispatch, stopQrPolling]);

  // ✅ CORRECCIÓN: Manejo de login exitoso mejorado
  const handleLoginSuccess = useCallback((user) => {
    toast.success(`¡Bienvenido, ${user.name || 'Usuario'}!`);
    navigate(returnUrl, { replace: true });
  }, [navigate, returnUrl]);

  // ✅ CORRECCIÓN: Función para submit del formulario mejorada
  const handleFormSubmit = useCallback(async (formValues) => {
    try {
      // ✅ CORRECCIÓN: Validar reCAPTCHA si está configurado
      const recaptchaKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;
      if (recaptchaKey && !recaptchaToken) {
        toast.error('Por favor, completa el reCAPTCHA');
        return;
      }

      const loginData = {
        email: formValues.email.trim(),
        password: formValues.password,
        rememberMe
      };

      // Agregar reCAPTCHA token si existe
      if (recaptchaToken) {
        loginData.recaptchaToken = recaptchaToken;
      }

      const result = await login(loginData);

      if (result.success) {
        handleLoginSuccess(result.user);
      } else {
        toast.error(result.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('Login error:', error);

      // ✅ CORRECCIÓN: Manejar errores específicos mejorado
      let errorMessage = 'Error del servidor. Por favor, intenta más tarde.';

      if (error.response) {
        switch (error.response.status) {
          case 401:
            errorMessage = 'Credenciales inválidas. Verifica tu email y contraseña.';
            break;
          case 403:
            errorMessage = 'Cuenta deshabilitada o sin permisos. Contacta al administrador.';
            break;
          case 429:
            errorMessage = 'Demasiados intentos. Por favor, espera unos minutos.';
            break;
          case 422:
            errorMessage = error.response.data?.message || 'Datos de formulario inválidos.';
            break;
          case 500:
            errorMessage = 'Error interno del servidor. Intenta más tarde.';
            break;
          default:
            errorMessage = error.response.data?.message || errorMessage;
        }
      } else if (error.request) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
      }

      setErrors({ submit: errorMessage });

      // Resetear reCAPTCHA
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
        setRecaptchaToken('');
      }
    }
  }, [login, rememberMe, recaptchaToken, handleLoginSuccess, setErrors]);

  // ✅ CORRECCIÓN: Manejar cambio de método de login mejorado
  const handleMethodChange = useCallback((method) => {
    setLoginMethod(method);
    resetForm();
    setRecaptchaToken('');

    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }

    // Limpiar estado QR si se cambia de método
    if (method !== LOGIN_METHODS.QR) {
      stopQrPolling();
      setQrCodeUrl('');
      setQrStatus(QR_STATUS.WAITING);
      setIsGeneratingQr(false);
    } else if (!qrCodeUrl) {
      // Generar QR si se selecciona y no hay uno
      generateQrCode();
    }
  }, [resetForm, stopQrPolling, qrCodeUrl, generateQrCode]);

  // ✅ CORRECCIÓN: Manejar reCAPTCHA mejorado
  const handleRecaptchaChange = useCallback((token) => {
    setRecaptchaToken(token || '');
  }, []);

  // ✅ CORRECCIÓN: Inicializar QR cuando se selecciona el método
  useEffect(() => {
    if (loginMethod === LOGIN_METHODS.QR && !qrCodeUrl && !isGeneratingQr) {
      generateQrCode();
    }
  }, [loginMethod, generateQrCode, qrCodeUrl, isGeneratingQr]);

  // ✅ CORRECCIÓN: Renderizar estado del QR mejorado
  const renderQrStatus = useCallback(() => {
    const config = getQrStatusConfig(qrStatus);

    return (
      <div className={`p-4 rounded-lg ${config.bgColor} mb-4`}>
        <div className="flex items-center">
          {config.icon}
          <span className={`ml-3 font-medium ${config.color}`}>
            {config.text}
          </span>
        </div>
      </div>
    );
  }, [qrStatus]);

  // ✅ CORRECCIÓN: Renderizar loading state
  const isLoading = authLoading || isSubmitting;

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Panel izquierdo - Información */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden lg:flex flex-col justify-center p-8"
        >
          <div className="max-w-md">
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-linear-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 ml-4">
                  Sistema de Inventario QR
                </h1>
              </div>
              <p className="text-lg text-gray-600">
                Gestión inteligente de inventarios con tecnología QR para optimizar tus operaciones.
              </p>
            </div>

            {/* Características */}
            <div className="space-y-6">
              {platformFeatures.map((feature, index) => (
                <FeatureItem
                  key={`feature-${feature.title}`}
                  icon={feature.icon}
                  color={feature.color}
                  title={feature.title}
                  description={feature.description}
                  index={index}
                />
              ))}
            </div>

            {/* Llamada a la acción */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-12 p-6 bg-linear-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg text-white"
            >
              <h3 className="text-xl font-bold mb-2">¿Primera vez aquí?</h3>
              <p className="mb-4 opacity-90">
                Regístrate ahora y optimiza la gestión de tu inventario.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 shadow-md"
              >
                Crear una cuenta
                <ExternalLink className="w-4 h-4 ml-2" />
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Panel derecho - Formulario de login */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center justify-center"
        >
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-10">
              {/* Logo y título */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-r from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg"
                >
                  <LogIn className="w-8 h-8 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-900">Iniciar Sesión</h2>
                <p className="text-gray-600 mt-2">Ingresa tus credenciales para acceder</p>
              </div>

              {/* Selector de método de login */}
              <div className="mb-6">
                <div className="grid grid-cols-3 gap-2">
                  {loginMethodOptions.map((option) => (
                    <button
                      key={option.method}
                      type="button"
                      onClick={() => handleMethodChange(option.method)}
                      className={`py-3 px-4 rounded-lg border transition-all duration-200 flex flex-col items-center ${loginMethod === option.method
                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      disabled={option.method === LOGIN_METHODS.SSO}
                    >
                      <option.icon className="w-5 h-5 mb-1" />
                      <span className="text-sm font-medium">{option.label}</span>
                      {option.method === LOGIN_METHODS.SSO && (
                        <span className="text-xs text-gray-500 mt-1">Próximamente</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {/* Formulario de email/password */}
                {loginMethod === LOGIN_METHODS.EMAIL && (
                  <motion.form
                    key="email-form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onSubmit={formSubmit(handleFormSubmit)}
                    className="space-y-6"
                  >
                    {/* Campo Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Correo Electrónico
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          name="email"
                          value={values.email}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200 ${errors.email && touched.email
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-300'
                            }`}
                          placeholder="ejemplo@empresa.com"
                          disabled={isLoading}
                          autoComplete="email"
                        />
                        {errors.email && touched.email && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          </div>
                        )}
                      </div>
                      {errors.email && touched.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>

                    {/* Campo Contraseña */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          <Lock className="w-4 h-4 inline mr-2" />
                          Contraseña
                        </label>
                        <Link
                          to="/forgot-password"
                          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          ¿Olvidaste tu contraseña?
                        </Link>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={values.password}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200 pr-12 ${errors.password && touched.password
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-300'
                            }`}
                          placeholder="••••••••"
                          disabled={isLoading}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                          tabIndex={-1}
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      {errors.password && touched.password && (
                        <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                      )}
                    </div>

                    {/* Opciones adicionales */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="remember"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          disabled={isLoading}
                        />
                        <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
                          Recordar esta sesión
                        </label>
                      </div>
                    </div>

                    {/* reCAPTCHA */}
                    {process.env.REACT_APP_RECAPTCHA_SITE_KEY && (
                      <div className="flex justify-center">
                        <ReCAPTCHA
                          ref={recaptchaRef}
                          sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
                          onChange={handleRecaptchaChange}
                          theme="light"
                          size="normal"
                        />
                      </div>
                    )}

                    {/* Error general */}
                    {errors.submit && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <div className="flex items-center">
                          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                          <p className="text-sm text-red-600">{errors.submit}</p>
                        </div>
                      </motion.div>
                    )}

                    {/* Botón de submit */}
                    <button
                      type="submit"
                      disabled={isLoading || (process.env.REACT_APP_RECAPTCHA_SITE_KEY && !recaptchaToken)}
                      className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 shadow-md ${isLoading
                          ? 'bg-blue-400 cursor-not-allowed'
                          : 'bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Iniciando sesión...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <LogIn className="w-5 h-5 mr-2" />
                          Iniciar Sesión
                        </div>
                      )}
                    </button>
                  </motion.form>
                )}

                {/* Login con QR */}
                {loginMethod === LOGIN_METHODS.QR && (
                  <motion.div
                    key="qr-form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-center py-6"
                  >
                    {renderQrStatus()}

                    {qrCodeUrl ? (
                      <>
                        <div className="bg-gray-50 rounded-xl p-6 mb-6">
                          <div className="w-48 h-48 bg-white rounded-lg mx-auto mb-4 p-4 shadow-inner">
                            {/* QR Code generado por el backend */}
                            <img
                              src={qrCodeUrl}
                              alt="Código QR para login"
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                const parent = e.target.parentElement;
                                parent.innerHTML = '<div class="flex items-center justify-center h-full"><AlertCircle className="w-12 h-12 text-red-500" /></div>';
                                if (isMounted.current) {
                                  setQrStatus(QR_STATUS.EXPIRED);
                                }
                              }}
                            />
                          </div>
                          <p className="text-gray-600 mb-2">
                            Escanea este código QR con la aplicación móvil
                          </p>
                          <p className="text-sm text-gray-500">
                            El código expira en 5 minutos
                          </p>
                        </div>

                        <div className="space-y-3">
                          <button
                            onClick={generateQrCode}
                            disabled={isGeneratingQr || qrStatus === QR_STATUS.SCANNING || qrStatus === QR_STATUS.SUCCESS}
                            className="w-full py-2 px-4 text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <RefreshCw className={`w-4 h-4 inline mr-2 ${isGeneratingQr ? 'animate-spin' : ''}`} />
                            {isGeneratingQr ? 'Generando...' : 'Generar nuevo código QR'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="py-12">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Generando código QR...</p>
                      </div>
                    )}

                    <button
                      onClick={() => handleMethodChange(LOGIN_METHODS.EMAIL)}
                      className="mt-6 text-blue-600 hover:text-blue-800 font-medium transition-colors flex items-center justify-center"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Volver a inicio con correo
                    </button>
                  </motion.div>
                )}

                {/* Login con SSO */}
                {loginMethod === LOGIN_METHODS.SSO && (
                  <motion.div
                    key="sso-form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-center py-8"
                  >
                    <div className="mb-6">
                      <Smartphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Inicio de Sesión Único (SSO)
                      </h3>
                      <p className="text-gray-600">
                        Inicia sesión con tu proveedor de identidad corporativo
                      </p>
                      <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-700">
                          Esta funcionalidad estará disponible próximamente.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleMethodChange(LOGIN_METHODS.EMAIL)}
                      className="text-blue-600 hover:text-blue-800 font-medium transition-colors flex items-center justify-center"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Otros métodos de inicio de sesión
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Separador */}
              <div className="my-6 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    ¿No tienes una cuenta?
                  </span>
                </div>
              </div>

              {/* Enlace a registro */}
              <div className="text-center">
                <Link
                  to="/register"
                  className="inline-block px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-200"
                >
                  Crear una cuenta nueva
                </Link>
              </div>
            </div>

            {/* Información de seguridad */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200"
            >
              <div className="flex items-start">
                <Shield className="w-5 h-5 text-blue-600 mr-2 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">
                    Sesión protegida con encriptación TLS/SSL
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Tu información está segura. Usamos encriptación de última generación.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Enlaces de ayuda */}
            <div className="mt-4 text-center text-sm text-gray-500">
              <p>
                ¿Necesitas ayuda?{' '}
                <Link to="/support" className="text-blue-600 hover:text-blue-800">
                  Contacta al soporte
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

Login.displayName = 'Login';

export { Login };
export default Login;