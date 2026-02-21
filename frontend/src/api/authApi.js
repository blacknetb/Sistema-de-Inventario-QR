/**
 * API de Autenticación para Inventory QR System
 * Maneja login, registro, refresh token y logout
 */

import axiosInstance from './axiosConfig';

// Configuración de rate limiting desde variables de entorno
const LOGIN_ATTEMPTS_LIMIT = parseInt(process.env.LOGIN_ATTEMPTS_LIMIT) || 5;
const LOGIN_LOCKOUT_TIME = parseInt(process.env.LOGIN_LOCKOUT_TIME) || 900000;

// Almacenamiento local para intentos fallidos
let loginAttempts = 0;
let lockoutUntil = null;

const authApi = {
    /**
     * Iniciar sesión de usuario
     * @param {string} email - Email del usuario
     * @param {string} password - Contraseña
     * @returns {Promise} - Datos del usuario y tokens
     */
    login: async (email, password) => {
        // Verificar si está bloqueado
        if (lockoutUntil && Date.now() < lockoutUntil) {
            const waitTime = Math.ceil((lockoutUntil - Date.now()) / 60000);
            throw {
                success: false,
                message: `Demasiados intentos fallidos. Espere ${waitTime} minutos.`
            };
        }

        try {
            const response = await axiosInstance.post('/auth/login', {
                email,
                password
            });

            // Resetear intentos fallidos en login exitoso
            if (response.data.success) {
                loginAttempts = 0;
                lockoutUntil = null;
                
                // Guardar tokens
                if (response.data.accessToken) {
                    localStorage.setItem('accessToken', response.data.accessToken);
                }
                if (response.data.refreshToken) {
                    localStorage.setItem('refreshToken', response.data.refreshToken);
                }
                if (response.data.user) {
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                }
            }
            
            return response.data;
        } catch (error) {
            // Incrementar contador de intentos fallidos
            loginAttempts++;
            
            // Bloquear si excede el límite
            if (loginAttempts >= LOGIN_ATTEMPTS_LIMIT) {
                lockoutUntil = Date.now() + LOGIN_LOCKOUT_TIME;
                throw {
                    success: false,
                    message: `Ha excedido el límite de ${LOGIN_ATTEMPTS_LIMIT} intentos. Cuenta bloqueada por ${LOGIN_LOCKOUT_TIME/60000} minutos.`
                };
            }
            
            throw error;
        }
    },

    /**
     * Registrar nuevo usuario
     * @param {Object} userData - Datos del usuario
     * @returns {Promise} - Usuario creado
     */
    register: async (userData) => {
        try {
            const response = await axiosInstance.post('/auth/register', userData);
            
            if (response.data.success && response.data.accessToken) {
                localStorage.setItem('accessToken', response.data.accessToken);
                localStorage.setItem('refreshToken', response.data.refreshToken);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
            
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Cerrar sesión
     * @returns {Promise}
     */
    logout: async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                await axiosInstance.post('/auth/logout', { refreshToken });
            }
        } catch (error) {
            console.error('Error en logout:', error);
        } finally {
            // Limpiar almacenamiento local
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            localStorage.removeItem('permissions');
            
            // Resetear contadores
            loginAttempts = 0;
            lockoutUntil = null;
        }
    },

    /**
     * Refrescar token de acceso
     * @returns {Promise}
     */
    refreshToken: async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }
            
            const response = await axiosInstance.post('/auth/refresh', {
                refreshToken
            });
            
            if (response.data.accessToken) {
                localStorage.setItem('accessToken', response.data.accessToken);
            }
            if (response.data.refreshToken) {
                localStorage.setItem('refreshToken', response.data.refreshToken);
            }
            
            return response.data;
        } catch (error) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            throw error;
        }
    },

    /**
     * Verificar si el usuario está autenticado
     * @returns {boolean}
     */
    isAuthenticated: () => {
        return !!localStorage.getItem('accessToken');
    },

    /**
     * Obtener usuario actual
     * @returns {Object|null}
     */
    getCurrentUser: () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    /**
     * Obtener permisos del usuario
     * @returns {Array}
     */
    getUserPermissions: () => {
        const user = authApi.getCurrentUser();
        return user?.permissions || [];
    },

    /**
     * Cambiar contraseña
     * @param {string} currentPassword - Contraseña actual
     * @param {string} newPassword - Nueva contraseña
     * @returns {Promise}
     */
    changePassword: async (currentPassword, newPassword) => {
        try {
            const response = await axiosInstance.post('/auth/change-password', {
                currentPassword,
                newPassword
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Solicitar restablecimiento de contraseña
     * @param {string} email - Email del usuario
     * @returns {Promise}
     */
    forgotPassword: async (email) => {
        try {
            const response = await axiosInstance.post('/auth/forgot-password', { email });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Restablecer contraseña con token
     * @param {string} token - Token de restablecimiento
     * @param {string} newPassword - Nueva contraseña
     * @returns {Promise}
     */
    resetPassword: async (token, newPassword) => {
        try {
            const response = await axiosInstance.post('/auth/reset-password', {
                token,
                newPassword
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Verificar token de autenticación
     * @returns {Promise}
     */
    verifyToken: async () => {
        try {
            const response = await axiosInstance.get('/auth/verify');
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default authApi;