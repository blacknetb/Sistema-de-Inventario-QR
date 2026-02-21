/**
 * Servicio de Autenticación para Inventory QR System
 * Actúa como una capa de abstracción sobre authApi para manejar la lógica de negocio
 * relacionada con la autenticación y el estado del usuario en la aplicación.
 */

import authApi from '../api/authApi';

class AuthService {
    /**
     * Inicia sesión de un usuario.
     * @param {string} email - Correo electrónico del usuario.
     * @param {string} password - Contraseña del usuario.
     * @returns {Promise<Object>} - Respuesta de la API con los datos del usuario y tokens.
     */
    async login(email, password) {
        try {
            const response = await authApi.login(email, password);
            return response;
        } catch (error) {
            console.error('Error en AuthService.login:', error);
            throw error;
        }
    }

    /**
     * Registra un nuevo usuario.
     * @param {Object} userData - Datos del usuario a registrar.
     * @returns {Promise<Object>} - Respuesta de la API con los datos del usuario creado.
     */
    async register(userData) {
        try {
            const response = await authApi.register(userData);
            return response;
        } catch (error) {
            console.error('Error en AuthService.register:', error);
            throw error;
        }
    }

    /**
     * Cierra la sesión del usuario actual.
     * @returns {Promise<void>}
     */
    async logout() {
        try {
            await authApi.logout();
        } catch (error) {
            console.error('Error en AuthService.logout:', error);
            // Asegurar que la sesión se limpie incluso si la API falla
            authApi.logout(); // Llama al método logout de authApi que limpia el localStorage
        }
    }

    /**
     * Refresca el token de acceso.
     * @returns {Promise<Object>} - Respuesta de la API con los nuevos tokens.
     */
    async refreshToken() {
        try {
            const response = await authApi.refreshToken();
            return response;
        } catch (error) {
            console.error('Error en AuthService.refreshToken:', error);
            throw error;
        }
    }

    /**
     * Verifica si el usuario está autenticado.
     * @returns {boolean} - `true` si el usuario está autenticado, `false` en caso contrario.
     */
    isAuthenticated() {
        return authApi.isAuthenticated();
    }

    /**
     * Obtiene los datos del usuario actual desde el almacenamiento local.
     * @returns {Object|null} - Objeto del usuario o `null` si no existe.
     */
    getCurrentUser() {
        return authApi.getCurrentUser();
    }

    /**
     * Obtiene los permisos del usuario actual.
     * @returns {Array} - Lista de permisos del usuario.
     */
    getUserPermissions() {
        return authApi.getUserPermissions();
    }

    /**
     * Cambia la contraseña del usuario actual.
     * @param {string} currentPassword - Contraseña actual.
     * @param {string} newPassword - Nueva contraseña.
     * @returns {Promise<Object>} - Respuesta de la API.
     */
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await authApi.changePassword(currentPassword, newPassword);
            return response;
        } catch (error) {
            console.error('Error en AuthService.changePassword:', error);
            throw error;
        }
    }

    /**
     * Solicita un correo para restablecer la contraseña.
     * @param {string} email - Correo electrónico del usuario.
     * @returns {Promise<Object>} - Respuesta de la API.
     */
    async forgotPassword(email) {
        try {
            const response = await authApi.forgotPassword(email);
            return response;
        } catch (error) {
            console.error('Error en AuthService.forgotPassword:', error);
            throw error;
        }
    }

    /**
     * Restablece la contraseña usando un token.
     * @param {string} token - Token de restablecimiento.
     * @param {string} newPassword - Nueva contraseña.
     * @returns {Promise<Object>} - Respuesta de la API.
     */
    async resetPassword(token, newPassword) {
        try {
            const response = await authApi.resetPassword(token, newPassword);
            return response;
        } catch (error) {
            console.error('Error en AuthService.resetPassword:', error);
            throw error;
        }
    }

    /**
     * Verifica la validez del token de acceso actual.
     * @returns {Promise<Object>} - Respuesta de la API.
     */
    async verifyToken() {
        try {
            const response = await authApi.verifyToken();
            return response;
        } catch (error) {
            console.error('Error en AuthService.verifyToken:', error);
            throw error;
        }
    }

    /**
     * Actualiza el perfil del usuario en el almacenamiento local.
     * @param {Object} userData - Nuevos datos del usuario.
     */
    updateStoredUser(userData) {
        if (userData) {
            localStorage.setItem('user', JSON.stringify(userData));
        }
    }
}

// Exportar una instancia única del servicio
export default new AuthService();