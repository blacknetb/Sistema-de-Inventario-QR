const validationService = {
  // Validar item de inventario
  validateInventoryItem: (itemData, isUpdate = false) => {
    const errors = {};
    
    // Validar nombre
    if (!itemData.name || itemData.name.trim().length === 0) {
      errors.name = 'El nombre es requerido';
    } else if (itemData.name.trim().length < 2) {
      errors.name = 'El nombre debe tener al menos 2 caracteres';
    } else if (itemData.name.trim().length > 100) {
      errors.name = 'El nombre no puede exceder 100 caracteres';
    }
    
    // Validar categoría
    if (!itemData.category || itemData.category.trim().length === 0) {
      errors.category = 'La categoría es requerida';
    }
    
    // Validar cantidad
    if (itemData.quantity === undefined || itemData.quantity === null) {
      errors.quantity = 'La cantidad es requerida';
    } else if (!Number.isInteger(Number(itemData.quantity))) {
      errors.quantity = 'La cantidad debe ser un número entero';
    } else if (itemData.quantity < 0) {
      errors.quantity = 'La cantidad no puede ser negativa';
    } else if (itemData.quantity > 999999) {
      errors.quantity = 'La cantidad no puede exceder 999,999';
    }
    
    // Validar precio
    if (itemData.price === undefined || itemData.price === null) {
      errors.price = 'El precio es requerido';
    } else if (isNaN(Number(itemData.price))) {
      errors.price = 'El precio debe ser un número válido';
    } else if (itemData.price < 0) {
      errors.price = 'El precio no puede ser negativo';
    } else if (itemData.price > 9999999.99) {
      errors.price = 'El precio no puede exceder $9,999,999.99';
    }
    
    // Validar stock mínimo
    if (itemData.minimumStock !== undefined && itemData.minimumStock !== null) {
      if (!Number.isInteger(Number(itemData.minimumStock))) {
        errors.minimumStock = 'El stock mínimo debe ser un número entero';
      } else if (itemData.minimumStock < 0) {
        errors.minimumStock = 'El stock mínimo no puede ser negativo';
      } else if (itemData.minimumStock > 99999) {
        errors.minimumStock = 'El stock mínimo no puede exceder 99,999';
      }
    }
    
    // Validar SKU
    if (itemData.sku && itemData.sku.trim().length > 0) {
      if (itemData.sku.trim().length > 50) {
        errors.sku = 'El SKU no puede exceder 50 caracteres';
      } else if (!/^[A-Za-z0-9\-_]+$/.test(itemData.sku.trim())) {
        errors.sku = 'El SKU solo puede contener letras, números, guiones y guiones bajos';
      }
    }
    
    // Validar descripción
    if (itemData.description && itemData.description.trim().length > 500) {
      errors.description = 'La descripción no puede exceder 500 caracteres';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Validar datos de categoría
  validateCategory: (categoryData) => {
    const errors = {};
    
    // Validar nombre
    if (!categoryData.name || categoryData.name.trim().length === 0) {
      errors.name = 'El nombre de la categoría es requerido';
    } else if (categoryData.name.trim().length < 2) {
      errors.name = 'El nombre debe tener al menos 2 caracteres';
    } else if (categoryData.name.trim().length > 50) {
      errors.name = 'El nombre no puede exceder 50 caracteres';
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s\-]+$/.test(categoryData.name.trim())) {
      errors.name = 'El nombre solo puede contener letras, espacios y guiones';
    }
    
    // Validar descripción
    if (categoryData.description && categoryData.description.trim().length > 200) {
      errors.description = 'La descripción no puede exceder 200 caracteres';
    }
    
    // Validar color
    if (categoryData.color && !/^#[0-9A-Fa-f]{6}$/.test(categoryData.color)) {
      errors.color = 'El color debe ser un código hexadecimal válido (ej: #3498db)';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Validar datos de usuario/login
  validateLogin: (email, password) => {
    const errors = {};
    
    // Validar email
    if (!email || email.trim().length === 0) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'El email no es válido';
    } else if (email.trim().length > 100) {
      errors.email = 'El email no puede exceder 100 caracteres';
    }
    
    // Validar contraseña
    if (!password || password.length === 0) {
      errors.password = 'La contraseña es requerida';
    } else if (password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    } else if (password.length > 50) {
      errors.password = 'La contraseña no puede exceder 50 caracteres';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Validar datos de registro de usuario
  validateRegister: (userData) => {
    const errors = {};
    
    // Validar nombre
    if (!userData.name || userData.name.trim().length === 0) {
      errors.name = 'El nombre es requerido';
    } else if (userData.name.trim().length < 2) {
      errors.name = 'El nombre debe tener al menos 2 caracteres';
    } else if (userData.name.trim().length > 50) {
      errors.name = 'El nombre no puede exceder 50 caracteres';
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(userData.name.trim())) {
      errors.name = 'El nombre solo puede contener letras y espacios';
    }
    
    // Validar email
    if (!userData.email || userData.email.trim().length === 0) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email.trim())) {
      errors.email = 'El email no es válido';
    }
    
    // Validar contraseña
    if (!userData.password || userData.password.length === 0) {
      errors.password = 'La contraseña es requerida';
    } else if (userData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    // Validar confirmación de contraseña
    if (userData.password !== userData.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Validar búsqueda
  validateSearch: (searchTerm) => {
    const errors = {};
    
    if (searchTerm && searchTerm.trim().length > 100) {
      errors.search = 'El término de búsqueda no puede exceder 100 caracteres';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Validar filtros
  validateFilters: (filters) => {
    const errors = {};
    
    // Validar rango de precio
    if (filters.minPrice !== undefined && filters.minPrice !== null) {
      if (isNaN(Number(filters.minPrice))) {
        errors.minPrice = 'El precio mínimo debe ser un número válido';
      } else if (filters.minPrice < 0) {
        errors.minPrice = 'El precio mínimo no puede ser negativo';
      }
    }
    
    if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
      if (isNaN(Number(filters.maxPrice))) {
        errors.maxPrice = 'El precio máximo debe ser un número válido';
      } else if (filters.maxPrice < 0) {
        errors.maxPrice = 'El precio máximo no puede ser negativo';
      }
    }
    
    // Validar que precio mínimo no sea mayor que máximo
    if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
      if (Number(filters.minPrice) > Number(filters.maxPrice)) {
        errors.priceRange = 'El precio mínimo no puede ser mayor que el máximo';
      }
    }
    
    // Validar rango de cantidad
    if (filters.minQuantity !== undefined && filters.minQuantity !== null) {
      if (!Number.isInteger(Number(filters.minQuantity))) {
        errors.minQuantity = 'La cantidad mínima debe ser un número entero';
      } else if (filters.minQuantity < 0) {
        errors.minQuantity = 'La cantidad mínima no puede ser negativa';
      }
    }
    
    if (filters.maxQuantity !== undefined && filters.maxQuantity !== null) {
      if (!Number.isInteger(Number(filters.maxQuantity))) {
        errors.maxQuantity = 'La cantidad máxima debe ser un número entero';
      } else if (filters.maxQuantity < 0) {
        errors.maxQuantity = 'La cantidad máxima no puede ser negativa';
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Sanitizar entrada de texto
  sanitizeText: (text, maxLength = null) => {
    if (!text) return '';
    
    let sanitized = String(text)
      .trim()
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    
    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength - 3) + '...';
    }
    
    return sanitized;
  },

  // Sanitizar número
  sanitizeNumber: (value, defaultValue = 0) => {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }
    
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  },

  // Validar formato de archivo
  validateFile: (file, allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'], maxSizeMB = 5) => {
    const errors = {};
    
    if (!file) {
      errors.file = 'El archivo es requerido';
      return { isValid: false, errors };
    }
    
    // Validar tipo
    if (!allowedTypes.includes(file.type)) {
      errors.file = `Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(', ')}`;
    }
    
    // Validar tamaño
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      errors.file = `El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`;
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Validar URL
  validateURL: (url) => {
    if (!url) return true;
    
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // Validar fecha
  validateDate: (dateString) => {
    if (!dateString) return true;
    
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  },

  // Validar que una fecha no sea futura
  validateDateNotFuture: (dateString) => {
    if (!dateString) return true;
    
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    return date <= today;
  },

  // Validar que una fecha no sea pasada
  validateDateNotPast: (dateString) => {
    if (!dateString) return true;
    
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return date >= today;
  },

  // Generar mensajes de error amigables
  getErrorMessage: (field, errorType, customMessage = null) => {
    if (customMessage) return customMessage;
    
    const messages = {
      required: `${field} es requerido`,
      email: `${field} debe ser un email válido`,
      minLength: `${field} es demasiado corto`,
      maxLength: `${field} es demasiado largo`,
      number: `${field} debe ser un número válido`,
      integer: `${field} debe ser un número entero`,
      positive: `${field} debe ser positivo`,
      match: `${field} no coincide`,
      invalid: `${field} no es válido`
    };
    
    return messages[errorType] || `Error en ${field}`;
  }
};

export default validationService;