import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

// ✅ Importaciones unificadas
import { authService } from './authService';
import { loginSchema, registerSchema, passwordStrength, emailValidator } from './validationSchemas';
import './Auth.css';

// ✅ Hook para rate limiting
const useRateLimit = (maxAttempts = 5, lockoutTime = 5 * 60 * 1000) => {
  const [attempts, setAttempts] = useState(() => {
    const saved = localStorage.getItem('login_attempts');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [lastAttempt, setLastAttempt] = useState(() => {
    const saved = localStorage.getItem('last_attempt_time');
    return saved ? parseInt(saved, 10) : null;
  });
  const [isLimited, setIsLimited] = useState(false);

  const checkLimit = useCallback(() => {
    if (attempts >= maxAttempts && lastAttempt) {
      const now = Date.now();
      const timeSinceLast = now - lastAttempt;

      if (timeSinceLast < lockoutTime) {
        const minutesLeft = Math.ceil((lockoutTime - timeSinceLast) / (60 * 1000));
        setIsLimited(true);
        return {
          limited: true,
          message: `Demasiados intentos. Espera ${minutesLeft} ${minutesLeft === 1 ? 'minuto' : 'minutos'}.`,
          attemptsLeft: 0
        };
      }
      // Reset si pasó el tiempo
      setAttempts(0);
      setLastAttempt(null);
      localStorage.removeItem('login_attempts');
      localStorage.removeItem('last_attempt_time');
    }
    setIsLimited(false);
    return {
      limited: false,
      message: '',
      attemptsLeft: maxAttempts - attempts
    };
  }, [attempts, lastAttempt, maxAttempts, lockoutTime]);

  const recordAttempt = useCallback((success = false) => {
    const newAttempts = success ? 0 : attempts + 1;
    const now = Date.now();
    
    setAttempts(newAttempts);
    setLastAttempt(now);
    
    if (success) {
      localStorage.removeItem('login_attempts');
      localStorage.removeItem('last_attempt_time');
    } else {
      localStorage.setItem('login_attempts', newAttempts.toString());
      localStorage.setItem('last_attempt_time', now.toString());
    }
    
    return newAttempts;
  }, [attempts]);

  useEffect(() => {
    checkLimit();
  }, [checkLimit]);

  return {
    attempts,
    isLimited,
    checkLimit,
    recordAttempt,
    reset: () => {
      setAttempts(0);
      setLastAttempt(null);
      setIsLimited(false);
      localStorage.removeItem('login_attempts');
      localStorage.removeItem('last_attempt_time');
    }
  };
};

const LoginForm = ({
  onSuccess = null,
  onError = null,
  demoMode = process.env.NODE_ENV === 'development',
  redirectTo = null,
  className = '',
  ...props
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const formRef = useRef(null);
  const submitBtnRef = useRef(null);
  const emailInputRef = useRef(null);

  // ✅ Estados
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [backendError, setBackendError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // ✅ Rate limiting
  const rateLimit = useRateLimit();

  // ✅ Redirección segura
  const getRedirectPath = useCallback(() => {
    if (redirectTo) return redirectTo;
    const from = location.state?.from;
    
    if (from?.pathname && !['/auth/login', '/auth/register'].includes(from.pathname)) {
      return from.pathname;
    }
    if (typeof from === 'string' && !from.includes('/auth/')) {
      return from;
    }
    return '/dashboard';
  }, [redirectTo, location]);

  // ✅ Formulario
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty, touchedFields },
    setError,
    setValue,
    watch,
    trigger,
    clearErrors,
    reset
  } = useForm({
    resolver: yupResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: useMemo(() => ({
      email: demoMode ? 'admin@inventario.com' : '',
      password: demoMode ? 'Admin123' : '',
      remember: false,
    }), [demoMode]),
  });

  const watchedPassword = watch('password');

  // ✅ Focus al cargar
  useEffect(() => {
    if (emailInputRef.current && !demoMode) {
      setTimeout(() => emailInputRef.current?.focus(), 100);
    }
  }, [demoMode]);

  // ✅ Check rate limit al cambiar
  useEffect(() => {
    const limitCheck = rateLimit.checkLimit();
    if (limitCheck.limited) {
      setBackendError(limitCheck.message);
    }
  }, [rateLimit]);

  // ✅ Manejador de submit optimizado
  const onSubmit = async (data) => {
    // Verificar rate limit
    const limitCheck = rateLimit.checkLimit();
    if (limitCheck.limited) {
      setBackendError(limitCheck.message);
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    setBackendError('');
    clearErrors();

    try {
      console.log('🔄 Procesando login...');
      
      const loginData = {
        email: data.email.trim().toLowerCase(),
        password: data.password,
      };

      const result = await authService.login(loginData.email, loginData.password);

      if (result.success) {
        // Validar token
        const isValidToken = await authService.validateToken(result.token);
        
        if (!isValidToken) {
          throw new Error('Token de autenticación inválido. Por favor, inicia sesión nuevamente.');
        }

        // Almacenar datos
        authService.storeAuthData(result.token, result.user, data.remember);

        // Resetear rate limit
        rateLimit.recordAttempt(true);

        // Mostrar éxito
        setShowSuccess(true);
        
        // Llamar callback
        if (typeof onSuccess === 'function') {
          onSuccess(result);
        }

        // Redirigir después de breve delay
        setTimeout(() => {
          const redirectPath = getRedirectPath();
          navigate(redirectPath, {
            replace: true,
            state: {
              from: location,
              message: 'Inicio de sesión exitoso',
              timestamp: new Date().toISOString(),
              user: result.user,
              showWelcome: true
            }
          });
        }, 1000);

      } else {
        throw new Error(result.message || 'Error en la autenticación');
      }
    } catch (error) {
      console.error('❌ Error en login:', error);

      // Registrar intento fallido
      const newAttempts = rateLimit.recordAttempt(false);
      const limitCheck = rateLimit.checkLimit();

      // Determinar mensaje de error
      let errorMessage = error.message || 'Error al iniciar sesión';
      
      if (limitCheck.limited) {
        errorMessage = limitCheck.message;
      } else if (error.message.includes('credencial') || 
                 error.message.includes('incorrect') || 
                 error.message.includes('invalid') ||
                 error.message.includes('password') ||
                 error.message.includes('email')) {
        errorMessage = 'Correo o contraseña incorrectos';
      }

      setBackendError(errorMessage);

      // Marcar errores en campos
      if (errorMessage.includes('Correo o contraseña incorrectos')) {
        setError('email', { type: 'manual', message: ' ' });
        setError('password', { type: 'manual', message: ' ' });
      }

      // Llamar callback de error
      if (typeof onError === 'function') {
        onError({ 
          success: false, 
          message: errorMessage, 
          attempts: newAttempts,
          limited: limitCheck.limited
        });
      }

      // Focus en el primer error
      if (formRef.current) {
        const firstError = formRef.current.querySelector('.input-error');
        if (firstError) {
          setTimeout(() => firstError.focus(), 100);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Fill demo credentials
  const fillDemoCredentials = () => {
    setValue('email', 'admin@inventario.com', { shouldValidate: true });
    setValue('password', 'Admin123', { shouldValidate: true });
    setValue('remember', true);
    setBackendError('');
    rateLimit.reset();
    clearErrors();
    
    setTimeout(() => {
      trigger();
      if (emailInputRef.current) {
        emailInputRef.current.focus();
      }
    }, 100);
  };

  // ✅ Manejador de teclas
  const handleKeyPress = useCallback((e, action) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  }, []);

  const handleFormKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !isSubmitting && isValid && isDirty) {
      handleSubmit(onSubmit)();
    }
  }, [isSubmitting, isValid, isDirty, handleSubmit, onSubmit]);

  const canSubmit = isValid && isDirty && !isSubmitting && !rateLimit.isLimited;

  return (
    <div className={`login-form ${className}`} {...props} ref={formRef}>
      <div className="login-header">
        <div className="login-icon" aria-hidden="true">
          <span className="icon-key">🔑</span>
        </div>
        <h1 className="login-title">Iniciar Sesión</h1>
        <p className="login-subtitle">
          Accede a tu cuenta para gestionar tu inventario
        </p>
      </div>

      {backendError && (
        <div className="alert alert-error" role="alert" aria-live="assertive">
          <span className="alert-icon" aria-hidden="true">⚠️</span>
          <span className="alert-message">{backendError}</span>
        </div>
      )}

      {showSuccess && (
        <div className="alert alert-success" role="alert">
          <span className="alert-icon">✅</span>
          <span className="alert-message">¡Inicio de sesión exitoso! Redirigiendo...</span>
        </div>
      )}

      <form 
        onSubmit={handleSubmit(onSubmit)} 
        className="login-form-container" 
        noValidate
        aria-label="Formulario de inicio de sesión"
        onKeyDown={handleFormKeyPress}
      >
        <div className="form-group">
          <label htmlFor="login-email" className="form-label">
            <span className="label-icon" aria-hidden="true">📧</span>
            <span className="label-text">Correo electrónico</span>
            <span className="required-indicator" aria-hidden="true"> *</span>
          </label>
          <div className="input-container">
            <span className="input-icon" aria-hidden="true">✉️</span>
            <input
              id="login-email"
              type="email"
              placeholder="usuario@ejemplo.com"
              autoComplete="email"
              disabled={isSubmitting || rateLimit.isLimited}
              className={`form-input ${errors.email ? 'input-error' : ''} ${touchedFields.email ? 'input-touched' : ''}`}
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "email-error" : undefined}
              aria-required="true"
              ref={(e) => {
                emailInputRef.current = e;
                register('email').ref(e);
              }}
              {...register('email')}
            />
          </div>
          {errors.email && errors.email.message && (
            <span id="email-error" className="error-message" role="alert" aria-live="polite">
              {errors.email.message}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="login-password" className="form-label">
            <span className="label-icon" aria-hidden="true">🔒</span>
            <span className="label-text">Contraseña</span>
            <span className="required-indicator" aria-hidden="true"> *</span>
          </label>
          <div className="input-container">
            <span className="input-icon" aria-hidden="true">🔒</span>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isSubmitting || rateLimit.isLimited}
              className={`form-input ${errors.password ? 'input-error' : ''} ${touchedFields.password ? 'input-touched' : ''}`}
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "password-error password-strength" : "password-strength"}
              aria-required="true"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isSubmitting || rateLimit.isLimited}
              className="password-toggle"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={showPassword}
              tabIndex={0}
              onKeyDown={(e) => handleKeyPress(e, () => setShowPassword(!showPassword))}
            >
              <span aria-hidden="true">{showPassword ? '👁️' : '👁️‍🗨️'}</span>
            </button>
          </div>
          {errors.password && errors.password.message && (
            <span id="password-error" className="error-message" role="alert" aria-live="polite">
              {errors.password.message}
            </span>
          )}
          {watchedPassword && !errors.password && (
            <div id="password-strength" className="password-strength" aria-live="polite">
              <span className="strength-text">Longitud: {watchedPassword.length} caracteres</span>
              {watchedPassword.length < 8 && (
                <span className="strength-warning"> (Recomendado: mínimo 8 caracteres)</span>
              )}
            </div>
          )}
        </div>

        <div className="form-options">
          <div className="checkbox-container">
            <input
              id="remember"
              type="checkbox"
              disabled={isSubmitting || rateLimit.isLimited}
              className="form-checkbox"
              aria-describedby="remember-hint"
              {...register('remember')}
            />
            <label htmlFor="remember" className="checkbox-label">
              Recordar sesión
            </label>
            <span id="remember-hint" className="checkbox-hint">
              (Solo en este dispositivo)
            </span>
          </div>

          <div className="forgot-password">
            <Link
              to="/auth/forgot-password"
              className={`forgot-link ${isSubmitting || rateLimit.isLimited ? 'link-disabled' : ''}`}
              onClick={(e) => {
                if (isSubmitting || rateLimit.isLimited) {
                  e.preventDefault();
                }
              }}
              aria-disabled={isSubmitting || rateLimit.isLimited}
              tabIndex={isSubmitting || rateLimit.isLimited ? -1 : 0}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        <div className="form-submit">
          <button
            type="submit"
            disabled={!canSubmit}
            className={`submit-btn ${isSubmitting ? 'btn-loading' : ''} ${!canSubmit ? 'btn-disabled' : ''}`}
            aria-busy={isSubmitting}
            aria-label={isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
            ref={submitBtnRef}
            tabIndex={0}
          >
            {isSubmitting ? (
              <>
                <span className="loading-spinner" aria-hidden="true"></span>
                <span className="btn-text">Iniciando sesión...</span>
              </>
            ) : (
              <>
                <span className="btn-icon" aria-hidden="true">🚀</span>
                <span className="btn-text">Iniciar sesión</span>
              </>
            )}
          </button>
        </div>

        {rateLimit.attempts > 0 && !rateLimit.isLimited && (
          <div className="attempts-warning" role="status" aria-live="polite">
            <span className="warning-icon" aria-hidden="true">⚠️</span>
            <span className="warning-text">Intentos fallidos: {rateLimit.attempts} de 5</span>
          </div>
        )}

        {demoMode && (
          <>
            <div className="form-separator">
              <span className="separator-text">O continúa con</span>
            </div>

            <div className="demo-section">
              <button
                type="button"
                onClick={fillDemoCredentials}
                disabled={isSubmitting || rateLimit.isLimited}
                className="demo-btn"
                aria-label="Usar credenciales de demostración"
                onKeyDown={(e) => handleKeyPress(e, fillDemoCredentials)}
                tabIndex={0}
              >
                <span className="demo-icon" aria-hidden="true">🎮</span>
                <span className="demo-text">Usar credenciales de demostración</span>
              </button>
            </div>
          </>
        )}

        <div className="register-link-container">
          <p className="register-text">
            ¿No tienes una cuenta?{' '}
            <Link
              to="/auth/register"
              className={`register-link ${isSubmitting || rateLimit.isLimited ? 'link-disabled' : ''}`}
              onClick={(e) => {
                if (isSubmitting || rateLimit.isLimited) {
                  e.preventDefault();
                }
              }}
              aria-disabled={isSubmitting || rateLimit.isLimited}
              tabIndex={isSubmitting || rateLimit.isLimited ? -1 : 0}
            >
              Regístrate gratis
            </Link>
          </p>
        </div>
      </form>

      <div className="security-info" role="complementary" aria-label="Información de seguridad">
        <h2 className="security-title">
          <span className="security-icon" aria-hidden="true">🔒</span>
          Seguridad del sistema
        </h2>
        <ul className="security-list" aria-label="Características de seguridad">
          <li>Conexión segura SSL/TLS</li>
          <li>Protección contra fuerza bruta</li>
          <li>Contraseñas encriptadas</li>
          <li>Sesiones temporales</li>
          <li>Validación de tokens JWT</li>
        </ul>
      </div>
    </div>
  );
};

LoginForm.propTypes = {
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
  demoMode: PropTypes.bool,
  redirectTo: PropTypes.string,
  className: PropTypes.string,
};

// ✅ Componente de página completa
export const LoginPage = (props) => {
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      // Verificar si ya está autenticado
      const { token } = authService.getStoredAuthData();
      if (token) {
        // Intentar validar token existente
        authService.validateToken(token).then(isValid => {
          if (isValid) {
            // Redirigir a dashboard si el token es válido
            window.location.href = '/dashboard';
          }
        });
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="auth-loading" role="status" aria-label="Cargando">
        <div className="loading-container">
          <div className="spinner" aria-hidden="true"></div>
          <p className="loading-text">Cargando sistema de autenticación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page" ref={containerRef}>
      <div className="login-container">
        <header className="logo-section" role="banner">
          <div className="app-logo" aria-hidden="true">
            <span className="logo-icon">📊</span>
          </div>
          <h1 className="app-title">Sistema de Inventario QR</h1>
          <p className="app-tagline">Gestión profesional de inventarios</p>
        </header>

        <main className="login-card" role="main">
          <LoginForm {...props} />
        </main>

        <footer className="login-footer" role="contentinfo">
          <p className="footer-text">
            Sistema de Inventario QR v1.0 • © {new Date().getFullYear()}
          </p>
          <p className="footer-subtext">
            Protegido por encriptación de extremo a extremo
          </p>
        </footer>
      </div>
    </div>
  );
};

// ✅ Componente modal
export const LoginModal = ({ isOpen, onClose, onSuccess, ...props }) => {
  const navigate = useNavigate();
  const modalRef = useRef(null);
  const closeBtnRef = useRef(null);

  const handleSuccess = useCallback((result) => {
    if (typeof onSuccess === 'function') {
      onSuccess(result);
    }
    if (typeof onClose === 'function') {
      onClose();
    }
  }, [onSuccess, onClose]);

  const handleRegisterClick = useCallback(() => {
    if (typeof onClose === 'function') {
      onClose();
    }
    navigate('/auth/register');
  }, [navigate, onClose]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && typeof onClose === 'function') {
      e.preventDefault();
      onClose();
    }
  }, [onClose]);

  const handleTabKey = useCallback((e) => {
    if (e.key === 'Tab' && modalRef.current) {
      const focusable = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusable.length === 0) return;
      
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      
      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keydown', handleTabKey);
      document.body.style.overflow = 'hidden';
      
      setTimeout(() => {
        closeBtnRef.current?.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleTabKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown, handleTabKey]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && typeof onClose === 'function') {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Modal de inicio de sesión"
    >
      <div
        className="modal-container"
        ref={modalRef}
        role="document"
        tabIndex={-1}
      >
        <button
          ref={closeBtnRef}
          onClick={onClose}
          className="modal-close-btn"
          aria-label="Cerrar modal de inicio de sesión"
          autoFocus
        >
          <span aria-hidden="true">✕</span>
        </button>

        <LoginForm
          onSuccess={handleSuccess}
          redirectTo="/"
          className="modal-form"
          {...props}
        />

        <div className="modal-footer">
          <button
            type="button"
            onClick={handleRegisterClick}
            className="modal-register-btn"
            aria-label="Crear una cuenta nueva"
            tabIndex={0}
          >
            ¿Nuevo usuario? Crea una cuenta
          </button>
        </div>
      </div>
    </div>
  );
};

LoginModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};

export default LoginForm;
export { LoginPage, LoginModal };