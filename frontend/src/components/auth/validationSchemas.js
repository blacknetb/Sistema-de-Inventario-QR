/**
 * Esquemas de validación para formularios de autenticación
 * Utiliza Yup para validaciones robustas y consistentes
 * @version 1.0.0
 * @created 2024-01-01
 */

/**
 * Validador de email con regex mejorado
 */
export const emailValidator = {
  isValid: (email) => {
    if (!email) return false;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  },
  
  normalize: (email) => {
    return email.toLowerCase().trim();
  },
  
  getHint: () => {
    return 'ejemplo@dominio.com';
  }
};

/**
 * Calculador de fortaleza de contraseña
 */
export const passwordStrength = {
  calculate: (password) => {
    if (!password) return 0;
    
    let score = 0;
    
    // Longitud
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
    
    // Caracteres diversos
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/[0-9]/.test(password)) score += 10;
    if (/[^a-zA-Z0-9]/.test(password)) score += 10;
    
    // Patrones complejos
    if (/(?=.*[a-z])(?=.*[A-Z])/.test(password)) score += 10;
    if (/(?=.*[0-9])(?=.*[^a-zA-Z0-9])/.test(password)) score += 10;
    if (!/(.)\1{2,}/.test(password)) score += 10; // Sin repeticiones
    
    return Math.min(score, 100);
  },
  
  getRules: (password) => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^a-zA-Z0-9]/.test(password)
    };
  },
  
  getStrengthClass: (score) => {
    if (score >= 80) return 'strength-strong';
    if (score >= 60) return 'strength-medium';
    if (score >= 30) return 'strength-weak';
    return 'strength-very-weak';
  },
  
  getStrengthText: (score) => {
    if (score >= 80) return 'Muy fuerte';
    if (score >= 60) return 'Fuerte';
    if (score >= 30) return 'Moderada';
    return 'Débil';
  },
  
  getRequirements: () => {
    return [
      'Mínimo 8 caracteres',
      'Al menos una mayúscula',
      'Al menos una minúscula',
      'Al menos un número',
      'Al menos un carácter especial'
    ];
  }
};

/**
 * Validador de nombre
 */
export const nameValidator = {
  isValid: (name) => {
    if (!name) return false;
    const trimmed = name.trim();
    return trimmed.length >= 2 && trimmed.length <= 100;
  },
  
  normalize: (name) => {
    return name.trim();
  },
  
  getError: (name) => {
    if (!name) return 'El nombre es requerido';
    if (name.length < 2) return 'El nombre debe tener al menos 2 caracteres';
    if (name.length > 100) return 'El nombre no puede exceder los 100 caracteres';
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name)) return 'Solo se permiten letras y espacios';
    return null;
  }
};

/**
 * Validaciones manuales (reemplazo de Yup)
 */
export const validators = {
  email: (value) => {
    if (!value) return 'El correo electrónico es requerido';
    if (!emailValidator.isValid(value)) return 'Ingresa un correo electrónico válido';
    if (value.length > 100) return 'El correo no puede exceder los 100 caracteres';
    return null;
  },
  
  password: (value, isLogin = false) => {
    if (!value) return 'La contraseña es requerida';
    
    if (isLogin) {
      if (value.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
      if (value.length > 50) return 'La contraseña no puede exceder los 50 caracteres';
    } else {
      // Validación más estricta para registro
      if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
      if (value.length > 50) return 'La contraseña no puede exceder los 50 caracteres';
      if (!/[a-z]/.test(value)) return 'Debe contener al menos una minúscula';
      if (!/[A-Z]/.test(value)) return 'Debe contener al menos una mayúscula';
      if (!/[0-9]/.test(value)) return 'Debe contener al menos un número';
      if (!/[^a-zA-Z0-9]/.test(value)) return 'Debe contener al menos un carácter especial';
    }
    
    return null;
  },
  
  confirmPassword: (value, password) => {
    if (!value) return 'Confirma tu contraseña';
    if (value !== password) return 'Las contraseñas deben coincidir';
    return null;
  },
  
  terms: (value) => {
    if (!value) return 'Debes aceptar los términos y condiciones';
    return null;
  }
};

/**
 * Esquema de validación para login
 */
export const loginSchema = {
  validate: (data) => {
    const errors = {};
    
    const emailError = validators.email(data.email);
    if (emailError) errors.email = emailError;
    
    const passwordError = validators.password(data.password, true);
    if (passwordError) errors.password = passwordError;
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },
  
  getDefaults: () => ({
    email: '',
    password: '',
    remember: false
  })
};

/**
 * Esquema de validación para registro
 */
export const registerSchema = {
  validate: (data) => {
    const errors = {};
    
    const nameError = nameValidator.getError(data.name);
    if (nameError) errors.name = nameError;
    
    const emailError = validators.email(data.email);
    if (emailError) errors.email = emailError;
    
    const passwordError = validators.password(data.password, false);
    if (passwordError) errors.password = passwordError;
    
    const confirmError = validators.confirmPassword(data.confirmPassword, data.password);
    if (confirmError) errors.confirmPassword = confirmError;
    
    const termsError = validators.terms(data.terms);
    if (termsError) errors.terms = termsError;
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },
  
  getDefaults: () => ({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false
  })
};

/**
 * Esquema de validación para recuperación de contraseña
 */
export const forgotPasswordSchema = {
  validate: (data) => {
    const errors = {};
    
    const emailError = validators.email(data.email);
    if (emailError) errors.email = emailError;
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },
  
  getDefaults: () => ({
    email: ''
  })
};

/**
 * Esquema de validación para reset de contraseña
 */
export const resetPasswordSchema = {
  validate: (data) => {
    const errors = {};
    
    const passwordError = validators.password(data.password, false);
    if (passwordError) errors.password = passwordError;
    
    const confirmError = validators.confirmPassword(data.confirmPassword, data.password);
    if (confirmError) errors.confirmPassword = confirmError;
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },
  
  getDefaults: () => ({
    password: '',
    confirmPassword: ''
  })
};

/**
 * Validador de formulario genérico
 */
export const validateForm = async (schema, data) => {
  return schema.validate(data);
};

export default {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  emailValidator,
  passwordStrength,
  nameValidator,
  validators,
  validateForm
};