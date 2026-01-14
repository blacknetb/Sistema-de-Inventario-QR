import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Link, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

// ✅ Importaciones unificadas
import { authService } from './authService';
import { loginSchema, registerSchema, passwordStrength, emailValidator } from './validationSchemas';
import './Auth.css';

// ✅ Hook para verificación de email
const useEmailVerification = () => {
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState(null);
  const [debounceTimer, setDebounceTimer] = useState(null);

  const checkEmail = useCallback(async (email) => {
    if (!email || !emailValidator.isValid(email)) {
      setAvailable(null);
      return;
    }

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const result = await authService.checkEmailAvailability(email);
        setAvailable(result.available);
      } catch (error) {
        console.error('Error verificando email:', error);
        setAvailable(null);
      } finally {
        setChecking(false);
      }
    }, 800);

    setDebounceTimer(timer);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [debounceTimer]);

  const reset = useCallback(() => {
    setAvailable(null);
    setChecking(false);
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  }, [debounceTimer]);

  return {
    checking,
    available,
    checkEmail,
    reset,
  };
};

const RegisterForm = ({
  onSuccess = null,
  onError = null,
  autoLogin = false,
  className = '',
  ...props
}) => {
  const navigate = useNavigate();
  const formRef = useRef(null);

  // ✅ Estados
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [backendError, setBackendError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // ✅ Email verification
  const emailVerification = useEmailVerification();

  // ✅ Formulario
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty, touchedFields },
    watch,
    setValue,
    setError,
    reset,
    trigger,
    clearErrors,
  } = useForm({
    resolver: yupResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: useMemo(() => ({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false,
    }), []),
  });

  const email = watch('email', '');
  const password = watch('password', '');
  const confirmPassword = watch('confirmPassword', '');

  // ✅ Calcular fuerza de contraseña
  const [pwdStrength, setPwdStrength] = useState(0);
  const [pwdRules, setPwdRules] = useState(passwordStrength.getRules(''));

  useEffect(() => {
    const strength = passwordStrength.calculate(password);
    const rules = passwordStrength.getRules(password);
    
    setPwdStrength(strength);
    setPwdRules(rules);
  }, [password]);

  // ✅ Verificar email al cambiar
  useEffect(() => {
    if (email && !errors.email && emailValidator.isValid(email)) {
      emailVerification.checkEmail(email);
    } else {
      emailVerification.reset();
    }
  }, [email, errors.email, emailVerification]);

  // ✅ Validar confirmación de contraseña
  useEffect(() => {
    if (confirmPassword && password !== confirmPassword && touchedFields.confirmPassword) {
      setError('confirmPassword', {
        type: 'manual',
        message: 'Las contraseñas no coinciden',
      });
    } else if (errors.confirmPassword?.type === 'manual' && password === confirmPassword) {
      clearErrors('confirmPassword');
    }
  }, [password, confirmPassword, setError, errors.confirmPassword, touchedFields.confirmPassword, clearErrors]);

  // ✅ Manejador de submit
  const onSubmit = async (data) => {
    if (!acceptedTerms) {
      setBackendError('Debes aceptar los términos y condiciones');
      return;
    }

    if (emailVerification.available === false) {
      setBackendError('Este correo ya está registrado');
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    setBackendError('');
    setShowSuccess(false);

    try {
      console.log('🔄 Procesando registro...');

      const userData = {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        role: 'user',
        status: 'active',
        createdAt: new Date().toISOString(),
        metadata: {
          source: 'web_register',
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        }
      };

      const result = await authService.register(userData);

      if (result.success) {
        setShowSuccess(true);
        setBackendError('');

        // Limpiar datos previos
        authService.clearAuthStorage();

        // Mostrar éxito y redirigir
        setTimeout(() => {
          if (autoLogin && result.user && process.env.NODE_ENV === 'development') {
            // Solo para desarrollo
            localStorage.setItem('registration_complete', 'true');
            localStorage.setItem('user_data', JSON.stringify(result.user));
            
            navigate('/dashboard', {
              state: {
                message: '¡Cuenta creada exitosamente! Bienvenido.',
                showTutorial: true,
                requiresVerification: true,
                user: result.user
              }
            });
          } else {
            navigate('/auth/login', {
              state: {
                message: 'Cuenta creada exitosamente. Por favor, inicia sesión.',
                registeredEmail: userData.email,
                requiresVerification: true,
                success: true
              },
              replace: true
            });
          }
        }, 1500);

        reset();
        setAcceptedTerms(false);
        emailVerification.reset();

        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        throw new Error(result.message || 'Error al crear la cuenta');
      }
    } catch (error) {
      console.error('❌ Error en registro:', error);

      const errorMessage = error.message || 'Error al crear la cuenta';
      setBackendError(errorMessage);

      // Manejar errores específicos
      if (errorMessage.includes('existente') ||
          errorMessage.includes('already exists') ||
          errorMessage.includes('ya está registrado')) {
        setError('email', {
          type: 'manual',
          message: 'Este correo ya está registrado',
        });
        emailVerification.checkEmail(email);
      }

      if (onError) {
        onError({ success: false, message: errorMessage });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Manejador de teclas
  const handleKeyPress = useCallback((e, action) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  }, []);

  const handleFormKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !isSubmitting && isValid && isDirty && acceptedTerms) {
      handleSubmit(onSubmit)();
    }
  }, [isSubmitting, isValid, isDirty, acceptedTerms, handleSubmit, onSubmit]);

  const canSubmit = isValid && isDirty && acceptedTerms && !isSubmitting && emailVerification.available !== false;

  return (
    <div className={`register-form ${className}`} {...props} ref={formRef}>
      <div className="register-header">
        <div className="register-icon">
          <span className="icon-user">👤</span>
        </div>
        <h2 className="register-title">Crear Cuenta</h2>
        <p className="register-subtitle">
          Regístrate para empezar a gestionar tu inventario
        </p>
      </div>

      {backendError && (
        <div className="alert alert-error" role="alert">
          <span className="alert-icon">⚠️</span>
          <span>{backendError}</span>
        </div>
      )}

      {showSuccess && (
        <div className="alert alert-success" role="alert">
          <span className="alert-icon">✅</span>
          <span className="alert-message">¡Cuenta creada exitosamente! Redirigiendo...</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="register-form-container" noValidate onKeyDown={handleFormKeyPress}>
        <div className="form-group">
          <label htmlFor="register-name" className="form-label">
            <span className="label-icon">👤</span>
            Nombre completo
          </label>
          <div className="input-container">
            <span className="input-icon">👤</span>
            <input
              id="register-name"
              type="text"
              placeholder="Juan Pérez"
              autoComplete="name"
              disabled={isSubmitting}
              className={`form-input ${errors.name ? 'input-error' : ''}`}
              aria-invalid={errors.name ? "true" : "false"}
              aria-describedby={errors.name ? "name-error" : undefined}
              {...register('name')}
            />
          </div>
          {errors.name && (
            <span id="name-error" className="error-message" role="alert">
              {errors.name.message}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="register-email" className="form-label">
            <span className="label-icon">📧</span>
            Correo electrónico
          </label>
          <div className="input-container">
            <span className="input-icon">✉️</span>
            <input
              id="register-email"
              type="email"
              placeholder="usuario@ejemplo.com"
              autoComplete="email"
              disabled={isSubmitting}
              className={`form-input ${errors.email ? 'input-error' : ''} ${emailVerification.available === true ? 'input-success' : ''}`}
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "email-error" : "email-hint"}
              {...register('email')}
            />
            {emailVerification.checking && (
              <div className="email-checking" aria-hidden="true">🔄</div>
            )}
            {emailVerification.available === true && !emailVerification.checking && (
              <div className="email-available" aria-label="Correo disponible">✓</div>
            )}
          </div>
          {errors.email ? (
            <span id="email-error" className="error-message" role="alert">
              {errors.email.message}
            </span>
          ) : emailVerification.available === true ? (
            <p id="email-hint" className="input-success-message">
              ✓ Correo disponible
            </p>
          ) : email && !errors.email ? (
            <p id="email-hint" className="input-hint">
              Utiliza un correo que puedas verificar
            </p>
          ) : null}
        </div>

        <div className="form-group">
          <label htmlFor="register-password" className="form-label">
            <span className="label-icon">🔒</span>
            Contraseña
          </label>
          <div className="input-container">
            <span className="input-icon">🔐</span>
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isSubmitting}
              className={`form-input ${errors.password ? 'input-error' : ''}`}
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "password-error" : "password-strength"}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isSubmitting}
              className="password-toggle"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={showPassword}
              onKeyDown={(e) => handleKeyPress(e, () => setShowPassword(!showPassword))}
            >
              <span aria-hidden="true">{showPassword ? '👁️' : '👁️‍🗨️'}</span>
            </button>
          </div>

          {password && (
            <div id="password-strength" className="password-strength-container">
              <div className="strength-header">
                <span className="strength-label">Fortaleza:</span>
                <span className={`strength-value ${passwordStrength.getStrengthClass(pwdStrength)}`}>
                  {passwordStrength.getStrengthText(pwdStrength)}
                </span>
              </div>
              <div className="strength-bar" aria-hidden="true">
                <div
                  className={`strength-progress ${passwordStrength.getStrengthClass(pwdStrength)}`}
                  style={{ width: `${pwdStrength}%` }}
                  role="progressbar"
                  aria-valuenow={pwdStrength}
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>
              <ul className="strength-rules">
                <li className={pwdRules.length ? 'rule-valid' : ''}>
                  {pwdRules.length ? '✓' : '○'} Mínimo 8 caracteres
                </li>
                <li className={pwdRules.uppercase ? 'rule-valid' : ''}>
                  {pwdRules.uppercase ? '✓' : '○'} Una mayúscula
                </li>
                <li className={pwdRules.lowercase ? 'rule-valid' : ''}>
                  {pwdRules.lowercase ? '✓' : '○'} Una minúscula
                </li>
                <li className={pwdRules.number ? 'rule-valid' : ''}>
                  {pwdRules.number ? '✓' : '○'} Un número
                </li>
                <li className={pwdRules.special ? 'rule-valid' : ''}>
                  {pwdRules.special ? '✓' : '○'} Un carácter especial
                </li>
              </ul>
            </div>
          )}
          {errors.password && (
            <span id="password-error" className="error-message" role="alert">
              {errors.password.message}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="register-confirm-password" className="form-label">
            <span className="label-icon">🔐</span>
            Confirmar contraseña
          </label>
          <div className="input-container">
            <span className="input-icon">🔐</span>
            <input
              id="register-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isSubmitting}
              className={`form-input ${errors.confirmPassword ? 'input-error' : ''} ${password && confirmPassword && password === confirmPassword ? 'input-success' : ''}`}
              aria-invalid={errors.confirmPassword ? "true" : "false"}
              aria-describedby={errors.confirmPassword ? "confirm-error" : "confirm-success"}
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isSubmitting}
              className="password-toggle"
              aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={showConfirmPassword}
              onKeyDown={(e) => handleKeyPress(e, () => setShowConfirmPassword(!showConfirmPassword))}
            >
              <span aria-hidden="true">{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</span>
            </button>
          </div>
          {errors.confirmPassword && (
            <span id="confirm-error" className="error-message" role="alert">
              {errors.confirmPassword.message}
            </span>
          )}
          {password && confirmPassword && password === confirmPassword && !errors.confirmPassword && (
            <p id="confirm-success" className="confirmation-success">
              <span className="success-icon">✓</span>
              Las contraseñas coinciden
            </p>
          )}
        </div>

        <div className="terms-container">
          <div className="checkbox-container">
            <input
              type="checkbox"
              id="terms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              disabled={isSubmitting}
              className="form-checkbox"
              aria-describedby="terms-error"
            />
            <label htmlFor="terms" className="terms-label">
              Acepto los{' '}
              <button
                type="button"
                onClick={() => window.open('/terms', '_blank')}
                className="terms-link"
                disabled={isSubmitting}
                aria-label="Leer términos y condiciones en nueva ventana"
                onKeyDown={(e) => handleKeyPress(e, () => window.open('/terms', '_blank'))}
              >
                términos y condiciones
              </button>{' '}
              y la{' '}
              <button
                type="button"
                onClick={() => window.open('/privacy', '_blank')}
                className="terms-link"
                disabled={isSubmitting}
                aria-label="Leer política de privacidad en nueva ventana"
                onKeyDown={(e) => handleKeyPress(e, () => window.open('/privacy', '_blank'))}
              >
                política de privacidad
              </button>
            </label>
          </div>

          {!acceptedTerms && isDirty && (
            <p id="terms-error" className="terms-error" role="alert">
              Debes aceptar los términos y condiciones para continuar
            </p>
          )}
        </div>

        <div className="form-submit">
          <button
            type="submit"
            disabled={!canSubmit}
            className={`submit-btn ${isSubmitting ? 'btn-loading' : ''} ${!canSubmit ? 'btn-disabled' : ''}`}
            aria-label={isSubmitting ? "Creando cuenta en progreso" : "Crear cuenta"}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="loading-spinner" aria-hidden="true"></span>
                <span className="btn-text">
                  Creando cuenta<span className="visually-hidden"> en progreso</span>
                </span>
              </>
            ) : (
              <>
                <span className="btn-icon" aria-hidden="true">🚀</span>
                <span className="btn-text">Crear cuenta</span>
              </>
            )}
          </button>
        </div>

        <div className="form-separator">
          <span>¿Ya tienes una cuenta?</span>
        </div>

        <div className="login-link-container">
          <Link
            to="/auth/login"
            className="login-link"
            onClick={(e) => isSubmitting && e.preventDefault()}
            aria-disabled={isSubmitting}
            tabIndex={isSubmitting ? -1 : 0}
          >
            ← Volver a iniciar sesión
          </Link>
        </div>
      </form>

      <div className="system-info">
        <h4 className="info-title">
          <span className="info-icon" aria-hidden="true">ℹ️</span>
          <span>Información importante</span>
        </h4>
        <ul className="info-list">
          <li>Tu información está protegida con encriptación</li>
          <li>Recibirás un correo de verificación</li>
          <li>Puedes recuperar tu cuenta si olvidas la contraseña</li>
          <li>Soporte disponible 24/7 para problemas de acceso</li>
          <li>Tus datos nunca serán compartidos con terceros</li>
        </ul>
      </div>
    </div>
  );
};

RegisterForm.propTypes = {
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
  autoLogin: PropTypes.bool,
  className: PropTypes.string,
};

// ✅ Componente de página completa
export const RegisterPage = (props) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      
      // Verificar si ya está autenticado
      const { token } = authService.getStoredAuthData();
      if (token) {
        authService.validateToken(token).then(isValid => {
          if (isValid) {
            window.location.href = '/dashboard';
          }
        });
      }
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-container">
          <div className="spinner" aria-label="Cargando"></div>
          <p>Cargando sistema de registro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="logo-section">
          <div className="app-logo" aria-hidden="true">
            <span className="logo-icon">📊</span>
          </div>
          <h1 className="app-title">Sistema de Inventario QR</h1>
          <p className="app-tagline">Crea tu cuenta gratuita</p>
        </div>

        <div className="register-card">
          <RegisterForm {...props} />
        </div>

        <div className="register-footer">
          <p className="footer-text">
            Sistema de Inventario QR • Registro seguro
          </p>
          <p className="footer-subtext">
            Tus datos están protegidos por encriptación de extremo a extremo
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
export { RegisterPage };