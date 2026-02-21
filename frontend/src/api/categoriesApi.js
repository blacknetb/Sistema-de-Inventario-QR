/**
 * API de Categorías para Inventory QR System
 * CRUD completo de categorías para productos
 */

import axiosInstance from './axiosConfig';

const DEFAULT_LIMIT = parseInt(process.env.PAGINATION_DEFAULT_LIMIT) || 20;
const MAX_LIMIT = parseInt(process.env.PAGINATION_MAX_LIMIT) || 100;

const categoriesApi = {
    /**
     * Obtener lista paginada de categorías
     * @param {Object} params - Parámetros de consulta
     * @returns {Promise}
     */
    getCategories: async (params = {}) => {
        try {
            const queryParams = {
                page: params.page || 1,
                limit: Math.min(params.limit || DEFAULT_LIMIT, MAX_LIMIT),
                search: params.search || '',
                status: params.status || '',
                parentId: params.parentId || '',
                sortBy: params.sortBy || 'name',
                sortOrder: params.sortOrder || 'ASC'
            };
            
            const response = await axiosInstance.get('/categories', { params: queryParams });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener todas las categorías (sin paginación)
     * @returns {Promise}
     */
    getAllCategories: async () => {
        try {
            const response = await axiosInstance.get('/categories/all');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener categoría por ID
     * @param {number|string} id - ID de la categoría
     * @returns {Promise}
     */
    getCategoryById: async (id) => {
        try {
            const response = await axiosInstance.get(`/categories/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Crear nueva categoría
     * @param {Object} categoryData - Datos de la categoría
     * @returns {Promise}
     */
    createCategory: async (categoryData) => {
        try {
            if (!categoryData.name) {
                throw new Error('El nombre de la categoría es requerido');
            }
            
            const response = await axiosInstance.post('/categories', categoryData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Actualizar categoría existente
     * @param {number|string} id - ID de la categoría
     * @param {Object} categoryData - Datos a actualizar
     * @returns {Promise}
     */
    updateCategory: async (id, categoryData) => {
        try {
            const response = await axiosInstance.put(`/categories/${id}`, categoryData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Eliminar categoría
     * @param {number|string} id - ID de la categoría
     * @returns {Promise}
     */
    deleteCategory: async (id) => {
        try {
            const response = await axiosInstance.delete(`/categories/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener categorías padre (nivel superior)
     * @returns {Promise}
     */
    getParentCategories: async () => {
        try {
            const response = await axiosInstance.get('/categories/parents');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener subcategorías de una categoría
     * @param {number|string} parentId - ID de la categoría padre
     * @returns {Promise}
     */
    getSubcategories: async (parentId) => {
        try {
            const response = await axiosInstance.get(`/categories/${parentId}/subcategories`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener árbol completo de categorías
     * @returns {Promise}
     */
    getCategoryTree: async () => {
        try {
            const response = await axiosInstance.get('/categories/tree');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Buscar categorías por término
     * @param {string} searchTerm - Término de búsqueda
     * @returns {Promise}
     */
    searchCategories: async (searchTerm) => {
        try {
            const response = await axiosInstance.get('/categories/search', {
                params: { q: searchTerm }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Activar/Desactivar categoría
     * @param {number|string} id - ID de la categoría
     * @param {boolean} isActive - Estado activo/inactivo
     * @returns {Promise}
     */
    toggleCategoryStatus: async (id, isActive) => {
        try {
            const response = await axiosInstance.patch(`/categories/${id}/status`, { isActive });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener productos de una categoría
     * @param {number|string} id - ID de la categoría
     * @param {Object} params - Parámetros de paginación
     * @returns {Promise}
     */
    getCategoryProducts: async (id, params = {}) => {
        try {
            const queryParams = {
                page: params.page || 1,
                limit: params.limit || DEFAULT_LIMIT
            };
            
            const response = await axiosInstance.get(`/categories/${id}/products`, {
                params: queryParams
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener estadísticas de categorías
     * @returns {Promise}
     */
    getCategoryStats: async () => {
        try {
            const response = await axiosInstance.get('/categories/stats/summary');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Reordenar categorías
     * @param {Array} categoriesOrder - Array con IDs en nuevo orden
     * @returns {Promise}
     */
    reorderCategories: async (categoriesOrder) => {
        try {
            const response = await axiosInstance.post('/categories/reorder', { categoriesOrder });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Mover productos entre categorías
     * @param {number|string} sourceCategoryId - Categoría origen
     * @param {number|string} targetCategoryId - Categoría destino
     * @param {Array} productIds - IDs de productos a mover
     * @returns {Promise}
     */
    moveProducts: async (sourceCategoryId, targetCategoryId, productIds) => {
        try {
            const response = await axiosInstance.post('/categories/move-products', {
                sourceCategoryId,
                targetCategoryId,
                productIds
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener categorías populares (más productos)
     * @param {number} limit - Límite de resultados
     * @returns {Promise}
     */
    getPopularCategories: async (limit = 10) => {
        try {
            const response = await axiosInstance.get('/categories/popular', {
                params: { limit }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Exportar categorías
     * @param {string} format - Formato de exportación
     * @returns {Promise}
     */
    exportCategories: async (format = 'csv') => {
        try {
            const response = await axiosInstance.get('/categories/export', {
                params: { format },
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Importar categorías desde archivo
     * @param {File} file - Archivo a importar
     * @returns {Promise}
     */
    importCategories: async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await axiosInstance.post('/categories/import', formData, {
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
     * Obtener historial de cambios de categoría
     * @param {number|string} id - ID de la categoría
     * @param {Object} params - Parámetros de paginación
     * @returns {Promise}
     */
    getCategoryHistory: async (id, params = {}) => {
        try {
            const queryParams = {
                page: params.page || 1,
                limit: params.limit || 20,
                startDate: params.startDate || '',
                endDate: params.endDate || ''
            };
            
            const response = await axiosInstance.get(`/categories/${id}/history`, {
                params: queryParams
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener categoría por slug
     * @param {string} slug - Slug de la categoría
     * @returns {Promise}
     */
    getCategoryBySlug: async (slug) => {
        try {
            const response = await axiosInstance.get(`/categories/slug/${slug}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener categorías con bajo stock
     * @returns {Promise}
     */
    getCategoriesWithLowStock: async () => {
        try {
            const response = await axiosInstance.get('/categories/low-stock');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Fusionar categorías
     * @param {number} masterCategoryId - ID de categoría principal
     * @param {number[]} categoryIdsToMerge - IDs de categorías a fusionar
     * @returns {Promise}
     */
    mergeCategories: async (masterCategoryId, categoryIdsToMerge) => {
        try {
            const response = await axiosInstance.post('/categories/merge', {
                masterCategoryId,
                categoryIdsToMerge
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Validar nombre de categoría único
     * @param {string} name - Nombre a validar
     * @param {number|null} excludeId - ID a excluir de la validación
     * @returns {Promise}
     */
    validateCategoryName: async (name, excludeId = null) => {
        try {
            const response = await axiosInstance.get('/categories/validate-name', {
                params: { name, excludeId }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener categorías sin productos
     * @returns {Promise}
     */
    getEmptyCategories: async () => {
        try {
            const response = await axiosInstance.get('/categories/empty');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Asignar imagen a categoría
     * @param {number|string} id - ID de la categoría
     * @param {File} image - Archivo de imagen
     * @returns {Promise}
     */
    uploadCategoryImage: async (id, image) => {
        try {
            const formData = new FormData();
            formData.append('image', image);
            
            const response = await axiosInstance.post(`/categories/${id}/image`, formData, {
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
     * Eliminar imagen de categoría
     * @param {number|string} id - ID de la categoría
     * @returns {Promise}
     */
    deleteCategoryImage: async (id) => {
        try {
            const response = await axiosInstance.delete(`/categories/${id}/image`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default categoriesApi;