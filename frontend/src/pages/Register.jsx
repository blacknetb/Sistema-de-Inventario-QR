import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Lock, Eye, EyeOff,
  CheckCircle, AlertCircle, UserPlus,
  Building, Phone,
  ArrowRight, ChevronLeft, Loader2,
  Globe, ShieldCheck, Users,
  Briefcase, ChevronDown
} from 'lucide-react';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';

// ✅ CORRECCIÓN: Configuración centralizada
const API_CONFIG = {
  BASE_URL: globalThis.APP_CONFIG?.apiUrl || 'http://localhost:3000/api'
};

// ✅ CORRECCIÓN: Expresiones regulares para validación
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// ✅ CORRECCIÓN: Props validation para FormStep
FormStep.propTypes = {
  step: PropTypes.number.isRequired,
  totalSteps: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  children: PropTypes.node
};

// ✅ MEJORA: Componente de paso del formulario optimizado
const FormStep = React.memo(({ step, totalSteps, title, description, children }) => (
  <motion.div
    key={step}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
    className="space-y-6"
  >
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
        <div className="text-sm text-gray-500">
          Paso {step} de {totalSteps}
        </div>
      </div>

      {/* ✅ MEJORA: Barra de progreso mejorada */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-linear-to-r from-green-600 to-teal-600 h-2 rounded-full transition-all duration-500"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>

      {/* ✅ MEJORA: Indicadores de pasos */}
      <div className="flex justify-between mt-2">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          return (
            <div
              key={`step-indicator-${stepNumber}`}
              className={`w-2 h-2 rounded-full ${stepNumber <= step ? 'bg-green-600' : 'bg-gray-300'}`}
            />
          );
        })}
      </div>
    </div>

    {children}
  </motion.div>
));

FormStep.displayName = 'FormStep';

// ✅ CORRECCIÓN: Props validation para ValidatedInput
ValidatedInput.propTypes = {
  label: PropTypes.string.isRequired,
  type: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  icon: PropTypes.elementType,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  showStrength: PropTypes.bool
};

// ✅ MEJORA: Componente de input con validación optimizado
const ValidatedInput = React.memo(({
  label,
  type = 'text',
  name,
  value,
  onChange,
  error,
  icon: Icon,
  placeholder,
  required = false,
  disabled = false,
  showStrength = false,
  ...props
}) => {
  const [isTouched, setIsTouched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const calculatePasswordStrength = useCallback((password) => {
    if (!password) return 0;

    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[@$!%*?&]/.test(password)) strength += 1;
    return Math.min(strength, 4);
  }, []);

  const passwordStrength = type === 'password' ? calculatePasswordStrength(value) : 0;

  // ✅ CORRECCIÓN: Sin ternarios anidados - Extraer lógica de clases
  const getInputClass = () => {
    if (error && isTouched) {
      return 'border-red-500 bg-red-50';
    }
    if (isFocused) {
      return 'border-green-500 bg-white';
    }
    return 'border-gray-300 bg-white';
  };

  const getPasswordStrengthLabel = () => {
    switch (passwordStrength) {
      case 1: return { text: 'Muy débil', color: 'text-red-500' };
      case 2: return { text: 'Débil', color: 'text-orange-500' };
      case 3: return { text: 'Buena', color: 'text-yellow-500' };
      case 4: return { text: 'Excelente', color: 'text-green-500' };
      default: return { text: 'Muy débil', color: 'text-gray-500' };
    }
  };

  const getPasswordStrengthBarColor = (level) => {
    if (level > passwordStrength) return 'bg-gray-200';

    switch (passwordStrength) {
      case 1: return 'bg-red-500';
      case 2: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-green-500';
      default: return 'bg-gray-200';
    }
  };

  const strengthLabel = getPasswordStrengthLabel();

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {Icon && <Icon className="w-4 h-4 inline mr-2 text-gray-400" />}
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
        )}

        <input
          type={type}
          name={name}
          value={value}
          onChange={(e) => {
            onChange(e);
            setIsTouched(true);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            setIsTouched(true);
          }}
          disabled={disabled}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200 ${getInputClass()} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          placeholder={placeholder}
          aria-invalid={!!error && isTouched}
          aria-describedby={error && isTouched ? `${name}-error` : undefined}
          {...props}
        />
      </div>

      {showStrength && type === 'password' && value && (
        <div className="mt-2">
          <div className="flex justify-between text-xs mb-1">
            <span>Seguridad:</span>
            <span className={`font-medium ${strengthLabel.color}`}>
              {strengthLabel.text}
            </span>
          </div>
          <div className="flex space-x-1">
            {[1, 2, 3, 4].map((level) => (
              <div
                key={`strength-level-${level}`}
                className={`h-1 flex-1 rounded-full ${getPasswordStrengthBarColor(level)}`}
              />
            ))}
          </div>
        </div>
      )}

      {error && isTouched && (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
});

ValidatedInput.displayName = 'ValidatedInput';

// ✅ CORRECCIÓN: Props validation para CustomCheckbox
CustomCheckbox.propTypes = {
  label: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  required: PropTypes.bool,
  link: PropTypes.string,
  linkText: PropTypes.string
};

// ✅ MEJORA: Componente de Checkbox personalizado
const CustomCheckbox = React.memo(({ label, checked, onChange, error, required = false, link, linkText }) => {
  const [isTouched, setIsTouched] = useState(false);

  const handleChange = (e) => {
    onChange(e);
    setIsTouched(true);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            type="checkbox"
            checked={checked}
            onChange={handleChange}
            className="h-4 w-4 text-green-600 rounded focus:ring-green-500 focus:ring-offset-2"
            required={required}
            id={`checkbox-${label.replaceAll(/\s+/g, '-').toLowerCase()}`}
            aria-label={label}
          />
        </div>
        <label
          htmlFor={`checkbox-${label.replaceAll(/\s+/g, '-').toLowerCase()}`}
          className="ml-3 text-sm text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-800 font-medium ml-1"
            >
              {linkText}
            </a>
          )}
        </label>
      </div>

      {error && isTouched && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
});

CustomCheckbox.displayName = 'CustomCheckbox';

// ✅ FUNCIONES AUXILIARES PARA REDUCIR COMPLEJIDAD
const getStepValidationErrors = (stepNumber, formData) => {
  const newErrors = {};

  switch (stepNumber) {
    case 1:
      validatePersonalInfo(formData, newErrors);
      break;
    case 2:
      validateProfessionalInfo(formData, newErrors);
      break;
    case 3:
      validateSecurityInfo(formData, newErrors);
      break;
  }

  return newErrors;
};

const validatePersonalInfo = (formData, errors) => {
  if (!formData.firstName.trim()) {
    errors.firstName = 'El nombre es requerido';
  } else if (formData.firstName.length < 2) {
    errors.firstName = 'El nombre debe tener al menos 2 caracteres';
  }

  if (!formData.lastName.trim()) {
    errors.lastName = 'El apellido es requerido';
  } else if (formData.lastName.length < 2) {
    errors.lastName = 'El apellido debe tener al menos 2 caracteres';
  }

  if (!formData.email.trim()) {
    errors.email = 'El correo electrónico es requerido';
  } else if (!EMAIL_REGEX.test(formData.email)) {
    errors.email = 'Correo electrónico inválido';
  }

  if (!formData.phone.trim()) {
    errors.phone = 'El teléfono es requerido';
  } else if (!PHONE_REGEX.test(formData.phone.replaceAll(' ', ''))) {
    errors.phone = 'Número de teléfono inválido';
  }
};

const validateProfessionalInfo = (formData, errors) => {
  if (!formData.company.trim()) {
    errors.company = 'El nombre de la empresa es requerido';
  }

  if (!formData.jobTitle.trim()) {
    errors.jobTitle = 'El puesto es requerido';
  }

  if (!formData.industry) {
    errors.industry = 'La industria es requerida';
  }

  if (!formData.department) {
    errors.department = 'El departamento es requerido';
  }
};

const validateSecurityInfo = (formData, errors) => {
  if (!formData.password) {
    errors.password = 'La contraseña es requerida';
  } else if (!PASSWORD_REGEX.test(formData.password)) {
    errors.password = 'Debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y un carácter especial (@$!%*?&)';
  }

  if (!formData.confirmPassword) {
    errors.confirmPassword = 'Confirma tu contraseña';
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden';
  }

  if (!formData.acceptTerms) {
    errors.acceptTerms = 'Debes aceptar los términos y condiciones';
  }

  if (!formData.acceptPrivacy) {
    errors.acceptPrivacy = 'Debes aceptar la política de privacidad';
  }
};

// ✅ COMPONENTE PRINCIPAL OPTIMIZADO
const Register = () => {
  const navigate = useNavigate();

  // ✅ MEJORA: Estado inicial con validación
  const [formData, setFormData] = useState({
    // Información personal
    firstName: '',
    lastName: '',
    email: '',
    phone: '',

    // Información profesional
    company: '',
    jobTitle: '',
    industry: '',
    department: '',

    // Seguridad
    password: '',
    confirmPassword: '',

    // Preferencias
    role: 'user',
    acceptTerms: false,
    acceptPrivacy: false,
    acceptNewsletter: true,
    acceptMarketing: false
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [submitError, setSubmitError] = useState('');
  const [industries, setIndustries] = useState([]);
  const [departments, setDepartments] = useState([]);

  // ✅ MEJORA: Total de pasos
  const totalSteps = 3;

  // ✅ MEJORA: Cargar datos de select
  useEffect(() => {
    // Industrias comunes
    setIndustries([
      'Tecnología',
      'Retail',
      'Manufactura',
      'Salud',
      'Educación',
      'Finanzas',
      'Logística',
      'Construcción',
      'Alimentos',
      'Servicios',
      'Otro'
    ]);

    // Departamentos comunes
    setDepartments([
      'Administración',
      'Ventas',
      'Marketing',
      'TI',
      'Operaciones',
      'Recursos Humanos',
      'Finanzas',
      'Logística',
      'Calidad',
      'Investigación y Desarrollo',
      'Otro'
    ]);
  }, []);

  // ✅ MEJORA: Validación por paso usando useCallback
  const validateStep = useCallback((stepNumber) => {
    return getStepValidationErrors(stepNumber, formData);
  }, [formData]);

  // ✅ MEJORA: Función para avanzar al siguiente paso
  const handleNextStep = useCallback(() => {
    const validationErrors = validateStep(step);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      // Scroll al primer error
      const firstError = Object.keys(validationErrors)[0];
      const element = document.querySelector(`[name="${firstError}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }

      return;
    }

    setErrors({});

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  }, [step, validateStep]);

  // ✅ MEJORA: Función para retroceder al paso anterior
  const handlePrevStep = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
      setErrors({});
      setSubmitError('');
    }
  }, [step]);

  // ✅ MEJORA: Función de envío del formulario con integración al backend
  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setSubmitError('');

    try {
      // ✅ MEJORA: Preparar datos para enviar al backend
      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.replaceAll(' ', ''),
        company: formData.company.trim(),
        jobTitle: formData.jobTitle.trim(),
        industry: formData.industry,
        department: formData.department,
        password: formData.password,
        role: formData.role,
        acceptTerms: formData.acceptTerms,
        acceptPrivacy: formData.acceptPrivacy,
        acceptNewsletter: formData.acceptNewsletter,
        acceptMarketing: formData.acceptMarketing,
        createdAt: new Date().toISOString()
      };

      // ✅ MEJORA: Integración con API del backend
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error en el registro');
      }

      // ✅ MEJORA: Guardar token si viene en la respuesta
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // ✅ MEJORA: Redirigir con mensaje de éxito
      toast.success('¡Registro exitoso! Bienvenido al sistema.');

      navigate('/dashboard', {
        replace: true,
        state: {
          message: '¡Registro exitoso! Bienvenido al sistema.',
          user: data.user
        }
      });

    } catch (error) {
      console.error('Registration error:', error);

      let errorMessage = error.message || 'Error al registrar. Por favor, intenta nuevamente.';

      // ✅ MEJORA: Mensajes de error específicos
      if (error.message.includes('email')) {
        errorMessage = 'El correo electrónico ya está registrado. Intenta con otro o inicia sesión.';
      } else if (error.message.includes('phone')) {
        errorMessage = 'El número de teléfono ya está registrado.';
      }

      setSubmitError(errorMessage);

      // ✅ MEJORA: Scroll al error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  }, [formData, navigate]);

  // ✅ MEJORA: Manejo de cambios en el formulario
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // ✅ MEJORA: Limpiar error específico inmediatamente
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    if (submitError) {
      setSubmitError('');
    }
  }, [errors, submitError]);

  // ✅ MEJORA: Efecto para resetear errores al cambiar de paso
  useEffect(() => {
    setErrors({});
    setSubmitError('');
  }, [step]);

  // ✅ Mapa de roles para evitar ternarios anidados
  const roleLabels = {
    user: 'Usuario estándar',
    manager: 'Gerente',
    admin: 'Administrador',
    owner: 'Propietario',
  };

  const summaryData = [
    { id: 'name', label: 'Nombre completo', value: `${formData.firstName} ${formData.lastName}` },
    { id: 'email', label: 'Correo electrónico', value: formData.email },
    { id: 'phone', label: 'Teléfono', value: formData.phone },
    { id: 'company', label: 'Empresa', value: formData.company },
    { id: 'jobTitle', label: 'Puesto', value: formData.jobTitle },
    { id: 'industry', label: 'Industria', value: formData.industry || 'No especificada' },
    { id: 'department', label: 'Departamento', value: formData.department || 'No especificado' },
    { id: 'role', label: 'Tipo de cuenta', value: roleLabels[formData.role] || 'No especificado' },
  ];

  // ✅ CORRECCIÓN: Función para determinar clase de círculo de paso
  const getStepCircleClass = (stepNumber) => {
    if (step === stepNumber) {
      return "border-green-600 bg-green-600 text-white scale-110";
    } else if (step > stepNumber) {
      return "border-green-600 bg-green-100 text-green-600";
    }
    return "border-gray-300 text-gray-400";
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Panel izquierdo - Información y beneficios */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex flex-col justify-center p-8 lg:p-12"
        >
          <div className="max-w-lg">
            <div className="mb-10">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-linear-to-r from-green-600 to-teal-600 rounded-2xl shadow-lg">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 ml-4">
                  Únete a nuestro sistema
                </h1>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                Regístrate para acceder a herramientas profesionales de gestión de inventarios que optimizarán tus operaciones y aumentarán tu productividad.
              </p>
            </div>

            <div className="space-y-8">
              {[
                {
                  emoji: "🚀",
                  title: "Implementación rápida",
                  desc: "Comienza a usar el sistema en minutos con nuestra configuración guiada.",
                },
                {
                  emoji: "📊",
                  title: "Analítica avanzada",
                  desc: "Toma decisiones informadas con reportes en tiempo real y dashboards interactivos.",
                },
                {
                  emoji: "🔐",
                  title: "Seguridad empresarial",
                  desc: "Tus datos están protegidos con encriptación de grado empresarial y copias de seguridad automáticas.",
                },
                {
                  emoji: "🤝",
                  title: "Soporte dedicado",
                  desc: "Acceso a soporte técnico especializado y documentación completa.",
                },
              ].map((feature) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-start group"
                >
                  <div className="shrink-0 mt-1">
                    <div className="w-12 h-12 bg-linear-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <span className="text-2xl">{feature.emoji}</span>
                    </div>
                  </div>
                  <div className="ml-5">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 mt-1">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-12 p-8 bg-linear-to-r from-green-600 to-teal-600 rounded-2xl text-white shadow-xl"
            >
              <div className="flex items-start">
                <Users className="w-6 h-6 mr-3 mt-1 shrink-0" />
                <div>
                  <h3 className="text-xl font-bold mb-3">¿Ya eres parte de nuestro equipo?</h3>
                  <p className="mb-6 opacity-90">
                    Más de 1,000 empresas ya confían en nuestro sistema para gestionar sus inventarios.
                  </p>
                  <Link
                    to="/login"
                    className="inline-flex items-center px-6 py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 shadow-md"
                  >
                    Iniciar Sesión
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Panel derecho - Formulario de registro */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex items-center justify-center"
        >
          <div className="w-full max-w-lg">
            <div className="bg-white rounded-2xl shadow-2xl p-8 lg:p-10 border border-gray-100">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-r from-green-600 to-teal-600 rounded-2xl mb-6 shadow-lg">
                  <UserPlus className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Crear Cuenta</h2>
                <p className="text-gray-600 mt-3">
                  Completa el formulario paso a paso para registrarte
                </p>

                {/* ✅ MEJORA: Indicador de pasos mejorado */}
                <div className="mt-8 flex justify-center">
                  <div className="flex items-center">
                    {Array.from({ length: totalSteps }).map((_, i) => {
                      const stepNumber = i + 1;
                      const isCompleted = step > stepNumber;

                      return (
                        <React.Fragment key={`step-${stepNumber}`}>
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${getStepCircleClass(stepNumber)}`}
                          >
                            {isCompleted ? (
                              <CheckCircle className="w-6 h-6" />
                            ) : (
                              <span className="font-bold">{stepNumber}</span>
                            )}
                          </div>
                          {stepNumber < totalSteps && (
                            <div
                              className={`w-20 h-1 mx-2 transition-all duration-500 ${isCompleted ? "bg-green-600" : "bg-gray-200"
                                }`}
                            ></div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ✅ MEJORA: Error de envío */}
              {submitError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6"
                >
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-3 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Error en el registro</p>
                      <p className="text-sm text-red-600 mt-1">{submitError}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              <AnimatePresence mode="wait">
                {/* ✅ MEJORA: Paso 1: Información personal */}
                {step === 1 && (
                  <FormStep step={step} totalSteps={totalSteps} title="Información personal" description="Ingresa tus datos básicos">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <ValidatedInput
                        label="Nombre"
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        error={errors.firstName}
                        icon={User}
                        placeholder="Juan"
                        required
                      />

                      <ValidatedInput
                        label="Apellido"
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        error={errors.lastName}
                        placeholder="Pérez"
                        required
                      />
                    </div>

                    <ValidatedInput
                      label="Correo Electrónico"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      error={errors.email}
                      icon={Mail}
                      placeholder="ejemplo@empresa.com"
                      required
                    />

                    <ValidatedInput
                      label="Teléfono"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      error={errors.phone}
                      icon={Phone}
                      placeholder="+52 55 1234 5678"
                      required
                    />
                  </FormStep>
                )}

                {/* ✅ MEJORA: Paso 2: Información profesional */}
                {step === 2 && (
                  <FormStep step={step} totalSteps={totalSteps} title="Información profesional" description="Datos de tu empresa y puesto">
                    <ValidatedInput
                      label="Nombre de la Empresa"
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      error={errors.company}
                      icon={Building}
                      placeholder="Nombre de tu empresa"
                      required
                    />

                    <ValidatedInput
                      label="Puesto o Cargo"
                      type="text"
                      name="jobTitle"
                      value={formData.jobTitle}
                      onChange={handleInputChange}
                      error={errors.jobTitle}
                      icon={Briefcase}
                      placeholder="Gerente, Supervisor, etc."
                      required
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div>
                        <label
                          htmlFor="industry"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          <Globe className="w-4 h-4 inline mr-2 text-gray-400" />
                          Industria
                        </label>
                        <div className="relative">
                          <select
                            id="industry"
                            name="industry"
                            value={formData.industry}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors duration-200 appearance-none bg-white"
                            required
                          >
                            <option value="">Seleccionar industria</option>
                            {industries.map((industry) => (
                              <option key={industry} value={industry}>
                                {industry}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                        </div>
                        {errors.industry && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.industry}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="department"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          <Users className="w-4 h-4 inline mr-2 text-gray-400" />
                          Departamento
                        </label>
                        <div className="relative">
                          <select
                            id="department"
                            name="department"
                            value={formData.department}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors duration-200 appearance-none bg-white"
                            required
                          >
                            <option value="">Seleccionar departamento</option>
                            {departments.map((dept) => (
                              <option key={dept} value={dept}>
                                {dept}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                        </div>
                        {errors.department && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.department}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <fieldset>
                        <legend className="block text-sm font-medium text-gray-700 mb-2">
                          Tipo de Cuenta
                        </legend>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: "user", label: "Usuario", desc: "Acceso básico" },
                            { value: "manager", label: "Gerente", desc: "Acceso completo" },
                            { value: "admin", label: "Administrador", desc: "Acceso total" },
                            { value: "owner", label: "Propietario", desc: "Control total" },
                          ].map((role) => (
                            <label
                              key={role.value}
                              htmlFor={`role-${role.value}`}
                              className={`relative flex flex-col p-4 border rounded-lg cursor-pointer transition-all duration-200 ${formData.role === role.value
                                ? "border-green-500 bg-green-50 ring-2 ring-green-200"
                                : "border-gray-300 hover:border-gray-400"
                                }`}
                            >
                              <input
                                id={`role-${role.value}`}
                                type="radio"
                                name="role"
                                value={role.value}
                                checked={formData.role === role.value}
                                onChange={handleInputChange}
                                className="sr-only"
                              />
                              <div className="flex items-center">
                                <div
                                  className={`w-4 h-4 border rounded-full flex items-center justify-center ${formData.role === role.value
                                    ? "border-green-500"
                                    : "border-gray-400"
                                    }`}
                                >
                                  {formData.role === role.value && (
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  )}
                                </div>
                                <span className="ml-2 font-medium text-gray-900">{role.label}</span>
                              </div>
                              <span className="text-xs text-gray-500 mt-1">{role.desc}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    </div>
                  </FormStep>
                )}

                {/* ✅ MEJORA: Paso 3: Seguridad y confirmación */}
                {step === 3 && (
                  <FormStep step={step} totalSteps={totalSteps} title="Seguridad y confirmación" description="Crea una contraseña segura y revisa tu información">
                    <ValidatedInput
                      label="Contraseña"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      error={errors.password}
                      icon={Lock}
                      placeholder="••••••••"
                      required
                      showStrength
                    />

                    <ValidatedInput
                      label="Confirmar Contraseña"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      error={errors.confirmPassword}
                      placeholder="••••••••"
                      required
                    />

                    <div className="flex flex-wrap gap-4 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-sm text-gray-600 hover:text-gray-800 flex items-center transition-colors duration-200"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 mr-1" />
                        ) : (
                          <Eye className="w-4 h-4 mr-1" />
                        )}
                        {showPassword ? 'Ocultar' : 'Mostrar'} contraseña
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-sm text-gray-600 hover:text-gray-800 flex items-center transition-colors duration-200"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4 mr-1" />
                        ) : (
                          <Eye className="w-4 h-4 mr-1" />
                        )}
                        {showConfirmPassword ? 'Ocultar' : 'Mostrar'} confirmación
                      </button>
                    </div>

                    <div className="bg-linear-to-r from-green-50 to-teal-50 border border-green-200 rounded-xl p-6 mt-6">
                      <div className="flex items-center mb-4">
                        <CheckCircle className="w-6 h-6 text-green-600 mr-3 shrink-0" />
                        <div>
                          <h4 className="font-semibold text-green-800">Resumen de tu información</h4>
                          <p className="text-sm text-green-700">Revisa antes de continuar</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {summaryData.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center py-2 border-b border-green-100 last:border-0"
                          >
                            <span className="text-sm text-gray-600">{item.label}:</span>
                            <span
                              className="text-sm font-medium text-gray-900 text-right max-w-[200px] truncate"
                              title={item.value}
                            >
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>

                    </div>

                    <div className="space-y-4 pt-4">
                      <CustomCheckbox
                        label="Acepto los"
                        checked={formData.acceptTerms}
                        onChange={handleInputChange}
                        error={errors.acceptTerms}
                        name="acceptTerms"
                        required
                        link="/terms"
                        linkText="Términos y Condiciones"
                      />

                      <CustomCheckbox
                        label="Acepto la"
                        checked={formData.acceptPrivacy}
                        onChange={handleInputChange}
                        error={errors.acceptPrivacy}
                        name="acceptPrivacy"
                        required
                        link="/privacy"
                        linkText="Política de Privacidad"
                      />

                      <CustomCheckbox
                        label="Deseo recibir notificaciones y actualizaciones por correo electrónico"
                        checked={formData.acceptNewsletter}
                        onChange={handleInputChange}
                        name="acceptNewsletter"
                      />

                      <CustomCheckbox
                        label="Acepto recibir información sobre productos y ofertas especiales"
                        checked={formData.acceptMarketing}
                        onChange={handleInputChange}
                        name="acceptMarketing"
                      />
                    </div>
                  </FormStep>
                )}
              </AnimatePresence>

              {/* ✅ MEJORA: Botones de navegación */}
              <div className="mt-10 flex justify-between items-center">
                <div>
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      disabled={loading}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium flex items-center"
                    >
                      <ChevronLeft className="w-5 h-5 mr-2" />
                      Atrás
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={loading}
                  className={`px-8 py-3 rounded-lg font-medium text-white transition-all duration-200 ${loading
                    ? 'bg-green-400 cursor-not-allowed'
                    : 'bg-linear-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 shadow-lg hover:shadow-xl'
                    } ${step === 1 ? 'ml-auto' : ''} flex items-center`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {step === totalSteps ? 'Creando cuenta...' : 'Procesando...'}
                    </>
                  ) : (
                    <>
                      {step === totalSteps ? 'Crear Cuenta' : 'Continuar'}
                      {step < totalSteps && <ArrowRight className="w-5 h-5 ml-2" />}
                    </>
                  )}
                </button>
              </div>

              {/* ✅ MEJORA: Enlace a login */}
              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-gray-600">
                  ¿Ya tienes una cuenta?{' '}
                  <Link
                    to="/login"
                    className="font-medium text-green-600 hover:text-green-800 transition-colors duration-200"
                  >
                    Inicia sesión
                  </Link>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Al registrarte, aceptas nuestros términos y políticas.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;