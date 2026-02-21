/**
 * API de Productos para Inventory QR System
 * CRUD completo de productos con gestión de stock, precios y QR
 */

import axiosInstance from './axiosConfig';

// Configuración desde variables de entorno
const DEFAULT_LIMIT = parseInt(process.env.PAGINATION_DEFAULT_LIMIT) || 20;
const MAX_LIMIT = parseInt(process.env.PAGINATION_MAX_LIMIT) || 100;
const LOW_STOCK_THRESHOLD = parseInt(process.env.NOTIFY_LOW_STOCK_THRESHOLD) || 10;

const productsApi = {
    /**
     * Obtener lista paginada de productos
     * @param {Object} params - Parámetros de consulta
     * @returns {Promise}
     */
    getProducts: async (params = {}) => {
        try {
            const queryParams = {
                page: params.page || 1,
                limit: Math.min(params.limit || DEFAULT_LIMIT, MAX_LIMIT),
                search: params.search || '',
                category: params.category || '',
                supplier: params.supplier || '',
                minPrice: params.minPrice || '',
                maxPrice: params.maxPrice || '',
                minStock: params.minStock || '',
                maxStock: params.maxStock || '',
                status: params.status || '',
                lowStock: params.lowStock || false,
                expiryDate: params.expiryDate || '',
                sortBy: params.sortBy || 'createdAt',
                sortOrder: params.sortOrder || 'DESC'
            };
            
            const response = await axiosInstance.get('/products', { params: queryParams });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener producto por ID
     * @param {number|string} id - ID del producto
     * @returns {Promise}
     */
    getProductById: async (id) => {
        try {
            const response = await axiosInstance.get(`/products/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener producto por código QR
     * @param {string} qrCode - Código QR del producto
     * @returns {Promise}
     */
    getProductByQR: async (qrCode) => {
        try {
            const response = await axiosInstance.get(`/products/qr/${qrCode}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener producto por código de barras
     * @param {string} barcode - Código de barras
     * @returns {Promise}
     */
    getProductByBarcode: async (barcode) => {
        try {
            const response = await axiosInstance.get(`/products/barcode/${barcode}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Crear nuevo producto
     * @param {Object} productData - Datos del producto
     * @returns {Promise}
     */
    createProduct: async (productData) => {
        try {
            // Validar datos requeridos
            if (!productData.name || !productData.price) {
                throw new Error('Nombre y precio son requeridos');
            }
            
            const response = await axiosInstance.post('/products', productData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Actualizar producto existente
     * @param {number|string} id - ID del producto
     * @param {Object} productData - Datos a actualizar
     * @returns {Promise}
     */
    updateProduct: async (id, productData) => {
        try {
            const response = await axiosInstance.put(`/products/${id}`, productData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Eliminar producto
     * @param {number|string} id - ID del producto
     * @returns {Promise}
     */
    deleteProduct: async (id) => {
        try {
            const response = await axiosInstance.delete(`/products/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Actualizar stock de producto
     * @param {number|string} id - ID del producto
     * @param {number} quantity - Cantidad a agregar/quitar
     * @param {string} type - Tipo de movimiento ('add', 'remove', 'set')
     * @param {string} reason - Razón del movimiento
     * @returns {Promise}
     */
    updateStock: async (id, quantity, type = 'add', reason = '') => {
        try {
            const response = await axiosInstance.patch(`/products/${id}/stock`, {
                quantity,
                type,
                reason
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener productos con stock bajo
     * @param {number} threshold - Umbral de stock bajo
     * @returns {Promise}
     */
    getLowStockProducts: async (threshold = LOW_STOCK_THRESHOLD) => {
        try {
            const response = await axiosInstance.get('/products/low-stock', {
                params: { threshold }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener productos próximos a vencer
     * @param {number} days - Días para vencimiento
     * @returns {Promise}
     */
    getExpiringProducts: async (days = 30) => {
        try {
            const response = await axiosInstance.get('/products/expiring', {
                params: { days }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener productos por categoría
     * @param {number|string} categoryId - ID de la categoría
     * @param {Object} params - Parámetros de paginación
     * @returns {Promise}
     */
    getProductsByCategory: async (categoryId, params = {}) => {
        try {
            const queryParams = {
                page: params.page || 1,
                limit: params.limit || DEFAULT_LIMIT
            };
            
            const response = await axiosInstance.get(`/products/category/${categoryId}`, {
                params: queryParams
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener productos por proveedor
     * @param {number|string} supplierId - ID del proveedor
     * @param {Object} params - Parámetros de paginación
     * @returns {Promise}
     */
    getProductsBySupplier: async (supplierId, params = {}) => {
        try {
            const queryParams = {
                page: params.page || 1,
                limit: params.limit || DEFAULT_LIMIT
            };
            
            const response = await axiosInstance.get(`/products/supplier/${supplierId}`, {
                params: queryParams
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Buscar productos
     * @param {string} searchTerm - Término de búsqueda
     * @returns {Promise}
     */
    searchProducts: async (searchTerm) => {
        try {
            const response = await axiosInstance.get('/products/search', {
                params: { q: searchTerm }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener estadísticas de productos
     * @returns {Promise}
     */
    getProductStats: async () => {
        try {
            const response = await axiosInstance.get('/products/stats/summary');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener historial de movimientos de un producto
     * @param {number|string} id - ID del producto
     * @param {Object} params - Parámetros de paginación
     * @returns {Promise}
     */
    getProductHistory: async (id, params = {}) => {
        try {
            const queryParams = {
                page: params.page || 1,
                limit: params.limit || 20,
                startDate: params.startDate || '',
                endDate: params.endDate || ''
            };
            
            const response = await axiosInstance.get(`/products/${id}/history`, {
                params: queryParams
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Exportar productos
     * @param {string} format - Formato de exportación
     * @param {Object} filters - Filtros a aplicar
     * @returns {Promise}
     */
    exportProducts: async (format = 'csv', filters = {}) => {
        try {
            const response = await axiosInstance.get('/products/export', {
                params: { format, ...filters },
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Importar productos desde archivo
     * @param {File} file - Archivo a importar
     * @returns {Promise}
     */
    importProducts: async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await axiosInstance.post('/products/import', formData, {
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
     * Generar código QR para producto
     * @param {number|string} id - ID del producto
     * @returns {Promise}
     */
    generateQRCode: async (id) => {
        try {
            const response = await axiosInstance.post(`/products/${id}/generate-qr`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Descargar código QR del producto
     * @param {number|string} id - ID del producto
     * @param {string} format - Formato de imagen (png, svg)
     * @returns {Promise}
     */
    downloadQRCode: async (id, format = 'png') => {
        try {
            const response = await axiosInstance.get(`/products/${id}/qr/download`, {
                params: { format },
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Actualizar imágenes del producto
     * @param {number|string} id - ID del producto
     * @param {File[]} images - Array de imágenes
     * @returns {Promise}
     */
    updateImages: async (id, images) => {
        try {
            const formData = new FormData();
            images.forEach((image, index) => {
                formData.append(`images`, image);
            });
            
            const response = await axiosInstance.post(`/products/${id}/images`, formData, {
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
     * Eliminar imagen del producto
     * @param {number|string} productId - ID del producto
     * @param {number|string} imageId - ID de la imagen
     * @returns {Promise}
     */
    deleteImage: async (productId, imageId) => {
        try {
            const response = await axiosInstance.delete(`/products/${productId}/images/${imageId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Ajustar inventario (entrada/salida)
     * @param {Object} adjustmentData - Datos del ajuste
     * @returns {Promise}
     */
    adjustInventory: async (adjustmentData) => {
        try {
            const response = await axiosInstance.post('/products/inventory/adjust', adjustmentData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Realizar conteo de inventario
     * @param {Object} countData - Datos del conteo
     * @returns {Promise}
     */
    inventoryCount: async (countData) => {
        try {
            const response = await axiosInstance.post('/products/inventory/count', countData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener productos duplicados por SKU/código
     * @returns {Promise}
     */
    getDuplicateProducts: async () => {
        try {
            const response = await axiosInstance.get('/products/duplicates');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Fusionar productos duplicados
     * @param {number} masterId - ID del producto principal
     * @param {number[]} duplicateIds - IDs de productos duplicados
     * @returns {Promise}
     */
    mergeProducts: async (masterId, duplicateIds) => {
        try {
            const response = await axiosInstance.post('/products/merge', {
                masterId,
                duplicateIds
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Actualizar precio de múltiples productos
     * @param {Object} bulkPriceData - Datos de actualización masiva
     * @returns {Promise}
     */
    bulkUpdatePrices: async (bulkPriceData) => {
        try {
            const response = await axiosInstance.patch('/products/bulk/prices', bulkPriceData);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default productsApi;