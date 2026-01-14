/**
 * Servicio de autenticación unificado
 * Maneja todas las operaciones de autenticación, registro y gestión de tokens
 * @version 1.0.0
 * @created 2024-01-01
 */

class AuthService {
  constructor() {
    this.TOKEN_KEY = 'auth_token';
    this.USER_KEY = 'user_data';
    this.TIMESTAMP_KEY = 'auth_timestamp';
    this.REMEMBER_KEY = 'auth_remember';
    
    // Configuración de API - Se obtiene del APP_CONFIG global
    this.API_BASE = window.APP_CONFIG?.api?.baseUrl || 'http://localhost:3000/api';
    this.API_TIMEOUT = window.APP_CONFIG?.api?.timeout || 30000;
    
    // Inicialización
    this.init();
  }

  /**
   * Inicializa el servicio
   */
  init() {
    console.log('🔧 AuthService inicializado');
    console.log('🌍 API Base:', this.API_BASE);
    console.log('⏱️  Timeout:', this.API_TIMEOUT);
    
    // Sincronización entre pestañas
    window.addEventListener('storage', (e) => {
      if (e.key === this.TOKEN_KEY || e.key === this.USER_KEY) {
        this.syncAuthState();
      }
    });
  }

  /**
   * Sincroniza el estado de autenticación entre pestañas
   */
  syncAuthState() {
    const { isAuthenticated } = this.getStoredAuthData();
    window.dispatchEvent(new CustomEvent('auth-sync', {
      detail: { isAuthenticated }
    }));
  }

  /**
   * Almacena datos de autenticación
   * @param {string} token - Token JWT
   * @param {object} user - Datos del usuario
   * @param {boolean} remember - Recordar sesión
   */
  storeAuthData(token, user, remember = false) {
    try {
      const storage = remember ? localStorage : sessionStorage;
      
      // Limpiar almacenamiento previo
      this.clearAuthStorage();
      
      // Validar datos antes de almacenar
      if (!token || typeof token !== 'string') {
        throw new Error('Token inválido');
      }
      
      if (!user || typeof user !== 'object') {
        throw new Error('Datos de usuario inválidos');
      }
      
      // Almacenar en el storage seleccionado
      storage.setItem(this.TOKEN_KEY, token);
      storage.setItem(this.USER_KEY, JSON.stringify(user));
      storage.setItem(this.TIMESTAMP_KEY, Date.now().toString());
      
      // Marcar si es sesión permanente
      if (remember) {
        localStorage.setItem(this.REMEMBER_KEY, 'true');
      }
      
      // Disparar evento para sincronización entre pestañas
      window.dispatchEvent(new CustomEvent('auth-change', {
        detail: { 
          action: 'login', 
          user,
          timestamp: Date.now()
        }
      }));
      
      console.log('✅ Datos de autenticación almacenados');
      return { success: true, message: 'Autenticación almacenada' };
    } catch (error) {
      console.error('❌ Error almacenando datos de autenticación:', error);
      return { 
        success: false, 
        message: error.message || 'Error almacenando autenticación'
      };
    }
  }

  /**
   * Obtiene datos de autenticación almacenados
   * @returns {object} Datos de autenticación
   */
  getStoredAuthData() {
    try {
      // Verificar si localStorage está disponible
      const isLocalStorageAvailable = this.checkStorageAvailability('localStorage');
      const isSessionStorageAvailable = this.checkStorageAvailability('sessionStorage');
      
      let token = null;
      let userData = null;
      let timestamp = null;
      let rememberMe = false;
      
      // Intentar primero localStorage (sesiones recordadas)
      if (isLocalStorageAvailable) {
        token = localStorage.getItem(this.TOKEN_KEY);
        userData = localStorage.getItem(this.USER_KEY);
        timestamp = localStorage.getItem(this.TIMESTAMP_KEY);
        rememberMe = localStorage.getItem(this.REMEMBER_KEY) === 'true';
      }
      
      // Si no hay en localStorage, intentar sessionStorage
      if ((!token || !userData) && isSessionStorageAvailable) {
        token = sessionStorage.getItem(this.TOKEN_KEY);
        userData = sessionStorage.getItem(this.USER_KEY);
        timestamp = sessionStorage.getItem(this.TIMESTAMP_KEY);
        rememberMe = false;
      }
      
      return {
        token,
        userData,
        timestamp: timestamp ? parseInt(timestamp, 10) : null,
        rememberMe,
        isAuthenticated: !!token && !!userData
      };
    } catch (error) {
      console.error('❌ Error obteniendo datos de autenticación:', error);
      return {
        token: null,
        userData: null,
        timestamp: null,
        rememberMe: false,
        isAuthenticated: false
      };
    }
  }

  /**
   * Verifica disponibilidad del almacenamiento
   * @param {string} type - Tipo de almacenamiento
   * @returns {boolean} True si está disponible
   */
  checkStorageAvailability(type) {
    try {
      const storage = window[type];
      const testKey = '__storage_test__';
      storage.setItem(testKey, testKey);
      storage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn(`⚠️ ${type} no disponible:`, error);
      return false;
    }
  }

  /**
   * Limpia todos los datos de autenticación
   */
  clearAuthStorage() {
    try {
      // Limpiar ambos storages
      if (this.checkStorageAvailability('localStorage')) {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        localStorage.removeItem(this.TIMESTAMP_KEY);
        localStorage.removeItem(this.REMEMBER_KEY);
      }
      
      if (this.checkStorageAvailability('sessionStorage')) {
        sessionStorage.removeItem(this.TOKEN_KEY);
        sessionStorage.removeItem(this.USER_KEY);
        sessionStorage.removeItem(this.TIMESTAMP_KEY);
      }
      
      // Disparar evento de logout
      window.dispatchEvent(new CustomEvent('auth-change', {
        detail: { 
          action: 'logout',
          timestamp: Date.now()
        }
      }));
      
      console.log('✅ Datos de autenticación limpiados');
      return { success: true, message: 'Sesión cerrada' };
    } catch (error) {
      console.error('❌ Error limpiando datos de autenticación:', error);
      return { 
        success: false, 
        message: 'Error cerrando sesión' 
      };
    }
  }

  /**
   * Verifica si el token ha expirado
   * @param {number} timestamp - Timestamp del token
   * @returns {boolean} True si ha expirado
   */
  isTokenExpired(timestamp) {
    if (!timestamp) return true;
    
    const now = Date.now();
    const tokenAge = now - timestamp;
    
    // Sesiones recordadas: 30 días, sesiones temporales: 8 horas
    const { rememberMe } = this.getStoredAuthData();
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000;
    
    return tokenAge > maxAge;
  }

  /**
   * Valida un token con el backend
   * @param {string} token - Token a validar
   * @returns {Promise<boolean>} True si el token es válido
   */
  async validateToken(token) {
    if (!token) return false;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.API_TIMEOUT);
      
      const response = await fetch(`${this.API_BASE}/auth/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.warn('⚠️ Token inválido:', response.status);
        return false;
      }
      
      const data = await response.json();
      return data.valid === true;
    } catch (error) {
      console.error('❌ Error validando token:', error.name === 'AbortError' ? 'Timeout' : error.message);
      
      // En caso de error de red, verificar si el token local no ha expirado
      const { timestamp } = this.getStoredAuthData();
      return !this.isTokenExpired(timestamp);
    }
  }

  /**
   * Inicio de sesión
   * @param {string} email - Correo electrónico
   * @param {string} password - Contraseña
   * @returns {Promise<object>} Resultado de la operación
   */
  async login(email, password) {
    try {
      console.log('🔐 Iniciando sesión para:', email);
      
      // Validar entrada
      if (!email || !password) {
        return {
          success: false,
          message: 'Email y contraseña son requeridos',
          code: 'VALIDATION_ERROR'
        };
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.API_TIMEOUT);
      
      const response = await fetch(`${this.API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Error al iniciar sesión',
          code: data.code || 'LOGIN_FAILED',
          status: response.status
        };
      }
      
      return {
        success: true,
        token: data.token,
        user: data.user,
        message: 'Inicio de sesión exitoso'
      };
    } catch (error) {
      console.error('❌ Error en login:', error);
      
      return {
        success: false,
        message: error.name === 'AbortError' 
          ? 'El servidor tardó demasiado en responder' 
          : 'Error de conexión. Verifica tu internet.',
        code: error.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR'
      };
    }
  }

  /**
   * Registro de nuevo usuario
   * @param {object} userData - Datos del usuario
   * @returns {Promise<object>} Resultado de la operación
   */
  async register(userData) {
    try {
      console.log('👤 Registrando usuario:', userData.email);
      
      // Validar datos requeridos
      const requiredFields = ['name', 'email', 'password'];
      for (const field of requiredFields) {
        if (!userData[field]) {
          return {
            success: false,
            message: `El campo ${field} es requerido`,
            code: 'VALIDATION_ERROR'
          };
        }
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.API_TIMEOUT);
      
      const response = await fetch(`${this.API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Error al crear la cuenta',
          code: data.code || 'REGISTRATION_FAILED',
          errors: data.errors || null,
          status: response.status
        };
      }
      
      return {
        success: true,
        user: data.user,
        message: 'Cuenta creada exitosamente',
        requiresVerification: data.requiresVerification || false
      };
    } catch (error) {
      console.error('❌ Error en registro:', error);
      
      return {
        success: false,
        message: error.name === 'AbortError' 
          ? 'El servidor tardó demasiado en responder' 
          : 'Error de conexión. No se pudo crear la cuenta.',
        code: error.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR'
      };
    }
  }

  /**
   * Verifica disponibilidad de email
   * @param {string} email - Correo a verificar
   * @returns {Promise<object>} Resultado de la verificación
   */
  async checkEmailAvailability(email) {
    try {
      if (!email || email.length < 3) {
        return { 
          available: null, 
          checking: false,
          message: 'Email demasiado corto'
        };
      }
      
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { 
          available: false, 
          checking: false,
          message: 'Formato de email inválido'
        };
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.API_BASE}/auth/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return { 
          available: null, 
          error: 'Error verificando email',
          status: response.status
        };
      }
      
      const data = await response.json();
      return { 
        available: data.available || false,
        message: data.available ? 'Email disponible' : 'Email ya registrado'
      };
    } catch (error) {
      console.warn('⚠️ Error verificando email:', error.message);
      return { 
        available: null, 
        error: error.message,
        code: error.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR'
      };
    }
  }

  /**
   * Cierre de sesión
   * @returns {Promise<object>} Resultado de la operación
   */
  async logout() {
    try {
      const { token } = this.getStoredAuthData();
      
      if (token) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        await fetch(`${this.API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal: controller.signal
        }).catch(() => {
          // Ignorar errores en logout, siempre limpiar localmente
        });
        
        clearTimeout(timeoutId);
      }
      
      const result = this.clearAuthStorage();
      
      return {
        success: result.success,
        message: result.success ? 'Sesión cerrada exitosamente' : 'Error cerrando sesión'
      };
    } catch (error) {
      console.error('❌ Error en logout:', error);
      this.clearAuthStorage();
      return {
        success: false,
        message: 'Error al cerrar sesión'
      };
    }
  }

  /**
   * Obtiene el usuario actual
   * @returns {object|null} Usuario actual
   */
  getCurrentUser() {
    try {
      const { userData } = this.getStoredAuthData();
      if (!userData) return null;
      
      const user = JSON.parse(userData);
      
      // Validar estructura básica del usuario
      if (!user || typeof user !== 'object') {
        console.warn('⚠️ Datos de usuario corruptos, limpiando...');
        this.clearAuthStorage();
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('❌ Error obteniendo usuario:', error);
      this.clearAuthStorage();
      return null;
    }
  }

  /**
   * Obtiene el token actual
   * @returns {string|null} Token actual
   */
  getCurrentToken() {
    const { token } = this.getStoredAuthData();
    return token;
  }

  /**
   * Verifica si el usuario está autenticado
   * @returns {Promise<boolean>} True si está autenticado
   */
  async isAuthenticated() {
    const { token, timestamp } = this.getStoredAuthData();
    
    if (!token) {
      console.log('🔍 No hay token almacenado');
      return false;
    }
    
    if (this.isTokenExpired(timestamp)) {
      console.log('⏰ Token expirado');
      this.clearAuthStorage();
      return false;
    }
    
    return await this.validateToken(token);
  }

  /**
   * Verifica permisos del usuario
   * @param {string|Array} requiredPermission - Permiso(s) requerido(s)
   * @returns {boolean} True si tiene permiso
   */
  hasPermission(requiredPermission) {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    // Admin tiene todos los permisos
    if (user.role === 'admin' || user.isAdmin === true) {
      return true;
    }
    
    const permissions = user.permissions || [];
    const required = Array.isArray(requiredPermission) 
      ? requiredPermission 
      : [requiredPermission];
    
    return required.some(perm => permissions.includes(perm));
  }

  /**
   * Verifica rol del usuario
   * @param {string|Array} requiredRole - Rol(es) requerido(s)
   * @returns {boolean} True si tiene el rol
   */
  hasRole(requiredRole) {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    const roles = Array.isArray(requiredRole) 
      ? requiredRole 
      : [requiredRole];
    
    return roles.includes(user.role);
  }

  /**
   * Actualiza datos del usuario localmente
   * @param {object} updates - Datos a actualizar
   * @returns {boolean} True si se actualizó correctamente
   */
  updateUserData(updates) {
    try {
      const user = this.getCurrentUser();
      if (!user) return false;
      
      const updatedUser = { ...user, ...updates };
      const { rememberMe } = this.getStoredAuthData();
      const token = this.getCurrentToken();
      
      // Guardar usuario actualizado
      this.storeAuthData(token, updatedUser, rememberMe);
      
      return true;
    } catch (error) {
      console.error('❌ Error actualizando datos de usuario:', error);
      return false;
    }
  }
}

// Exportar instancia singleton
const authService = new AuthService();

// Hacer disponible globalmente para debugging (solo desarrollo)
if (process.env.NODE_ENV === 'development') {
  window.authService = authService;
}

export { authService };
export default authService;