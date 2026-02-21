/**
 * API de Usuarios para Inventory QR System
 * CRUD completo de usuarios con manejo de roles y permisos
 */

import axiosInstance from './axiosConfig';

// Configuración de paginación desde variables de entorno
const DEFAULT_LIMIT = parseInt(process.env.PAGINATION_DEFAULT_LIMIT) || 20;
const MAX_LIMIT = parseInt(process.env.PAGINATION_MAX_LIMIT) || 100;

const usersApi = {
    /**
     * Obtener lista paginada de usuarios
     * @param {Object} params - Parámetros de consulta
     * @returns {Promise}
     */
    getUsers: async (params = {}) => {
        try {
            const queryParams = {
                page: params.page || 1,
                limit: Math.min(params.limit || DEFAULT_LIMIT, MAX_LIMIT),
                search: params.search || '',
                role: params.role || '',
                status: params.status || '',
                sortBy: params.sortBy || 'createdAt',
                sortOrder: params.sortOrder || 'DESC'
            };
            
            const response = await axiosInstance.get('/users', { params: queryParams });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener usuario por ID
     * @param {number|string} id - ID del usuario
     * @returns {Promise}
     */
    getUserById: async (id) => {
        try {
            const response = await axiosInstance.get(`/users/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Crear nuevo usuario
     * @param {Object} userData - Datos del usuario
     * @returns {Promise}
     */
    createUser: async (userData) => {
        try {
            // Validar datos requeridos
            if (!userData.email || !userData.password || !userData.name) {
                throw new Error('Email, password y nombre son requeridos');
            }
            
            const response = await axiosInstance.post('/users', userData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Actualizar usuario existente
     * @param {number|string} id - ID del usuario
     * @param {Object} userData - Datos a actualizar
     * @returns {Promise}
     */
    updateUser: async (id, userData) => {
        try {
            const response = await axiosInstance.put(`/users/${id}`, userData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Eliminar usuario (soft delete)
     * @param {number|string} id - ID del usuario
     * @returns {Promise}
     */
    deleteUser: async (id) => {
        try {
            const response = await axiosInstance.delete(`/users/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Activar/Desactivar usuario
     * @param {number|string} id - ID del usuario
     * @param {boolean} isActive - Estado activo/inactivo
     * @returns {Promise}
     */
    toggleUserStatus: async (id, isActive) => {
        try {
            const response = await axiosInstance.patch(`/users/${id}/status`, { isActive });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Asignar roles a usuario
     * @param {number|string} id - ID del usuario
     * @param {Array} roles - Array de IDs de roles
     * @returns {Promise}
     */
    assignRoles: async (id, roles) => {
        try {
            const response = await axiosInstance.post(`/users/${id}/roles`, { roles });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener roles del usuario
     * @param {number|string} id - ID del usuario
     * @returns {Promise}
     */
    getUserRoles: async (id) => {
        try {
            const response = await axiosInstance.get(`/users/${id}/roles`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener permisos del usuario
     * @param {number|string} id - ID del usuario
     * @returns {Promise}
     */
    getUserPermissions: async (id) => {
        try {
            const response = await axiosInstance.get(`/users/${id}/permissions`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Buscar usuarios por término
     * @param {string} searchTerm - Término de búsqueda
     * @returns {Promise}
     */
    searchUsers: async (searchTerm) => {
        try {
            const response = await axiosInstance.get('/users/search', {
                params: { q: searchTerm }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener estadísticas de usuarios
     * @returns {Promise}
     */
    getUserStats: async () => {
        try {
            const response = await axiosInstance.get('/users/stats/summary');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Exportar usuarios
     * @param {string} format - Formato de exportación (csv, excel, pdf)
     * @param {Object} filters - Filtros a aplicar
     * @returns {Promise}
     */
    exportUsers: async (format = 'csv', filters = {}) => {
        try {
            const response = await axiosInstance.get('/users/export', {
                params: { format, ...filters },
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Importar usuarios desde archivo
     * @param {File} file - Archivo a importar
     * @returns {Promise}
     */
    importUsers: async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await axiosInstance.post('/users/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Actualizar perfil de usuario actual
     * @param {Object} profileData - Datos del perfil
     * @returns {Promise}
     */
    updateProfile: async (profileData) => {
        try {
            const response = await axiosInstance.put('/users/profile', profileData);
            
            // Actualizar usuario en localStorage
            if (response.data.user) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
            
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Cambiar avatar de usuario
     * @param {File} image - Archivo de imagen
     * @returns {Promise}
     */
    updateAvatar: async (image) => {
        try {
            const formData = new FormData();
            formData.append('avatar', image);
            
            const response = await axiosInstance.post('/users/avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            // Actualizar usuario en localStorage
            if (response.data.user) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
            
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener logs de actividad del usuario
     * @param {number|string} id - ID del usuario
     * @param {Object} params - Parámetros de paginación
     * @returns {Promise}
     */
    getUserActivityLogs: async (id, params = {}) => {
        try {
            const queryParams = {
                page: params.page || 1,
                limit: params.limit || 20,
                startDate: params.startDate || '',
                endDate: params.endDate || ''
            };
            
            const response = await axiosInstance.get(`/users/${id}/activity`, {
                params: queryParams
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default usersApi;