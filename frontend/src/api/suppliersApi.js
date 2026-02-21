/**
 * API de Proveedores para Inventory QR System
 * CRUD completo de proveedores con gestión de productos asociados
 */

import axiosInstance from './axiosConfig';

const DEFAULT_LIMIT = parseInt(process.env.PAGINATION_DEFAULT_LIMIT) || 20;
const MAX_LIMIT = parseInt(process.env.PAGINATION_MAX_LIMIT) || 100;

const suppliersApi = {
    /**
     * Obtener lista paginada de proveedores
     * @param {Object} params - Parámetros de consulta
     * @returns {Promise}
     */
    getSuppliers: async (params = {}) => {
        try {
            const queryParams = {
                page: params.page || 1,
                limit: Math.min(params.limit || DEFAULT_LIMIT, MAX_LIMIT),
                search: params.search || '',
                status: params.status || '',
                category: params.category || '',
                sortBy: params.sortBy || 'name',
                sortOrder: params.sortOrder || 'ASC'
            };
            
            const response = await axiosInstance.get('/suppliers', { params: queryParams });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener todos los proveedores (sin paginación)
     * @returns {Promise}
     */
    getAllSuppliers: async () => {
        try {
            const response = await axiosInstance.get('/suppliers/all');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener proveedor por ID
     * @param {number|string} id - ID del proveedor
     * @returns {Promise}
     */
    getSupplierById: async (id) => {
        try {
            const response = await axiosInstance.get(`/suppliers/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Crear nuevo proveedor
     * @param {Object} supplierData - Datos del proveedor
     * @returns {Promise}
     */
    createSupplier: async (supplierData) => {
        try {
            if (!supplierData.name || !supplierData.email) {
                throw new Error('Nombre y email son requeridos');
            }
            
            const response = await axiosInstance.post('/suppliers', supplierData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Actualizar proveedor existente
     * @param {number|string} id - ID del proveedor
     * @param {Object} supplierData - Datos a actualizar
     * @returns {Promise}
     */
    updateSupplier: async (id, supplierData) => {
        try {
            const response = await axiosInstance.put(`/suppliers/${id}`, supplierData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Eliminar proveedor
     * @param {number|string} id - ID del proveedor
     * @returns {Promise}
     */
    deleteSupplier: async (id) => {
        try {
            const response = await axiosInstance.delete(`/suppliers/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Activar/Desactivar proveedor
     * @param {number|string} id - ID del proveedor
     * @param {boolean} isActive - Estado activo/inactivo
     * @returns {Promise}
     */
    toggleSupplierStatus: async (id, isActive) => {
        try {
            const response = await axiosInstance.patch(`/suppliers/${id}/status`, { isActive });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener productos de un proveedor
     * @param {number|string} id - ID del proveedor
     * @param {Object} params - Parámetros de paginación
     * @returns {Promise}
     */
    getSupplierProducts: async (id, params = {}) => {
        try {
            const queryParams = {
                page: params.page || 1,
                limit: params.limit || DEFAULT_LIMIT,
                search: params.search || ''
            };
            
            const response = await axiosInstance.get(`/suppliers/${id}/products`, {
                params: queryParams
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Buscar proveedores
     * @param {string} searchTerm - Término de búsqueda
     * @returns {Promise}
     */
    searchSuppliers: async (searchTerm) => {
        try {
            const response = await axiosInstance.get('/suppliers/search', {
                params: { q: searchTerm }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener estadísticas de proveedores
     * @returns {Promise}
     */
    getSupplierStats: async () => {
        try {
            const response = await axiosInstance.get('/suppliers/stats/summary');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener historial de compras a proveedor
     * @param {number|string} id - ID del proveedor
     * @param {Object} params - Parámetros de paginación
     * @returns {Promise}
     */
    getPurchaseHistory: async (id, params = {}) => {
        try {
            const queryParams = {
                page: params.page || 1,
                limit: params.limit || 20,
                startDate: params.startDate || '',
                endDate: params.endDate || ''
            };
            
            const response = await axiosInstance.get(`/suppliers/${id}/purchases`, {
                params: queryParams
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener proveedores por categoría de producto
     * @param {number|string} categoryId - ID de la categoría
     * @returns {Promise}
     */
    getSuppliersByCategory: async (categoryId) => {
        try {
            const response = await axiosInstance.get('/suppliers/by-category', {
                params: { categoryId }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Evaluar desempeño de proveedor
     * @param {number|string} id - ID del proveedor
     * @param {Object} ratingData - Datos de evaluación
     * @returns {Promise}
     */
    rateSupplier: async (id, ratingData) => {
        try {
            const response = await axiosInstance.post(`/suppliers/${id}/rate`, ratingData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener calificaciones de proveedor
     * @param {number|string} id - ID del proveedor
     * @returns {Promise}
     */
    getSupplierRatings: async (id) => {
        try {
            const response = await axiosInstance.get(`/suppliers/${id}/ratings`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Exportar proveedores
     * @param {string} format - Formato de exportación
     * @param {Object} filters - Filtros a aplicar
     * @returns {Promise}
     */
    exportSuppliers: async (format = 'csv', filters = {}) => {
        try {
            const response = await axiosInstance.get('/suppliers/export', {
                params: { format, ...filters },
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Importar proveedores desde archivo
     * @param {File} file - Archivo a importar
     * @returns {Promise}
     */
    importSuppliers: async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await axiosInstance.post('/suppliers/import', formData, {
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
     * Obtener contactos de proveedor
     * @param {number|string} id - ID del proveedor
     * @returns {Promise}
     */
    getSupplierContacts: async (id) => {
        try {
            const response = await axiosInstance.get(`/suppliers/${id}/contacts`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Agregar contacto a proveedor
     * @param {number|string} id - ID del proveedor
     * @param {Object} contactData - Datos del contacto
     * @returns {Promise}
     */
    addSupplierContact: async (id, contactData) => {
        try {
            const response = await axiosInstance.post(`/suppliers/${id}/contacts`, contactData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Actualizar contacto de proveedor
     * @param {number|string} supplierId - ID del proveedor
     * @param {number|string} contactId - ID del contacto
     * @param {Object} contactData - Datos actualizados
     * @returns {Promise}
     */
    updateSupplierContact: async (supplierId, contactId, contactData) => {
        try {
            const response = await axiosInstance.put(`/suppliers/${supplierId}/contacts/${contactId}`, contactData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Eliminar contacto de proveedor
     * @param {number|string} supplierId - ID del proveedor
     * @param {number|string} contactId - ID del contacto
     * @returns {Promise}
     */
    deleteSupplierContact: async (supplierId, contactId) => {
        try {
            const response = await axiosInstance.delete(`/suppliers/${supplierId}/contacts/${contactId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener direcciones de proveedor
     * @param {number|string} id - ID del proveedor
     * @returns {Promise}
     */
    getSupplierAddresses: async (id) => {
        try {
            const response = await axiosInstance.get(`/suppliers/${id}/addresses`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Agregar dirección a proveedor
     * @param {number|string} id - ID del proveedor
     * @param {Object} addressData - Datos de la dirección
     * @returns {Promise}
     */
    addSupplierAddress: async (id, addressData) => {
        try {
            const response = await axiosInstance.post(`/suppliers/${id}/addresses`, addressData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener órdenes de compra a proveedor
     * @param {number|string} id - ID del proveedor
     * @param {Object} params - Parámetros de paginación
     * @returns {Promise}
     */
    getPurchaseOrders: async (id, params = {}) => {
        try {
            const queryParams = {
                page: params.page || 1,
                limit: params.limit || 20,
                status: params.status || ''
            };
            
            const response = await axiosInstance.get(`/suppliers/${id}/purchase-orders`, {
                params: queryParams
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener proveedores destacados
     * @param {number} limit - Límite de resultados
     * @returns {Promise}
     */
    getTopSuppliers: async (limit = 10) => {
        try {
            const response = await axiosInstance.get('/suppliers/top', {
                params: { limit }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Validar email único de proveedor
     * @param {string} email - Email a validar
     * @param {number|null} excludeId - ID a excluir
     * @returns {Promise}
     */
    validateSupplierEmail: async (email, excludeId = null) => {
        try {
            const response = await axiosInstance.get('/suppliers/validate-email', {
                params: { email, excludeId }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Validar teléfono único de proveedor
     * @param {string} phone - Teléfono a validar
     * @param {number|null} excludeId - ID a excluir
     * @returns {Promise}
     */
    validateSupplierPhone: async (phone, excludeId = null) => {
        try {
            const response = await axiosInstance.get('/suppliers/validate-phone', {
                params: { phone, excludeId }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener proveedores con productos próximos a vencer
     * @param {number} days - Días para vencimiento
     * @returns {Promise}
     */
    getSuppliersWithExpiringProducts: async (days = 30) => {
        try {
            const response = await axiosInstance.get('/suppliers/expiring-products', {
                params: { days }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Enviar comunicación a proveedor
     * @param {number|string} id - ID del proveedor
     * @param {Object} communicationData - Datos de la comunicación
     * @returns {Promise}
     */
    sendCommunication: async (id, communicationData) => {
        try {
            const response = await axiosInstance.post(`/suppliers/${id}/communicate`, communicationData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener historial de comunicaciones
     * @param {number|string} id - ID del proveedor
     * @param {Object} params - Parámetros de paginación
     * @returns {Promise}
     */
    getCommunicationHistory: async (id, params = {}) => {
        try {
            const queryParams = {
                page: params.page || 1,
                limit: params.limit || 20,
                type: params.type || ''
            };
            
            const response = await axiosInstance.get(`/suppliers/${id}/communications`, {
                params: queryParams
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener condiciones de pago del proveedor
     * @param {number|string} id - ID del proveedor
     * @returns {Promise}
     */
    getPaymentTerms: async (id) => {
        try {
            const response = await axiosInstance.get(`/suppliers/${id}/payment-terms`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Actualizar condiciones de pago
     * @param {number|string} id - ID del proveedor
     * @param {Object} paymentTermsData - Datos de condiciones de pago
     * @returns {Promise}
     */
    updatePaymentTerms: async (id, paymentTermsData) => {
        try {
            const response = await axiosInstance.put(`/suppliers/${id}/payment-terms`, paymentTermsData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener facturas de proveedor
     * @param {number|string} id - ID del proveedor
     * @param {Object} params - Parámetros de paginación
     * @returns {Promise}
     */
    getInvoices: async (id, params = {}) => {
        try {
            const queryParams = {
                page: params.page || 1,
                limit: params.limit || 20,
                status: params.status || '',
                startDate: params.startDate || '',
                endDate: params.endDate || ''
            };
            
            const response = await axiosInstance.get(`/suppliers/${id}/invoices`, {
                params: queryParams
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener resumen financiero del proveedor
     * @param {number|string} id - ID del proveedor
     * @returns {Promise}
     */
    getFinancialSummary: async (id) => {
        try {
            const response = await axiosInstance.get(`/suppliers/${id}/financial-summary`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener productos más comprados al proveedor
     * @param {number|string} id - ID del proveedor
     * @param {number} limit - Límite de resultados
     * @returns {Promise}
     */
    getTopProducts: async (id, limit = 10) => {
        try {
            const response = await axiosInstance.get(`/suppliers/${id}/top-products`, {
                params: { limit }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener rendimiento de entregas del proveedor
     * @param {number|string} id - ID del proveedor
     * @returns {Promise}
     */
    getDeliveryPerformance: async (id) => {
        try {
            const response = await axiosInstance.get(`/suppliers/${id}/delivery-performance`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Generar orden de compra
     * @param {number|string} id - ID del proveedor
     * @param {Object} purchaseOrderData - Datos de la orden
     * @returns {Promise}
     */
    createPurchaseOrder: async (id, purchaseOrderData) => {
        try {
            const response = await axiosInstance.post(`/suppliers/${id}/purchase-orders`, purchaseOrderData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener productos sugeridos para reorden
     * @param {number|string} id - ID del proveedor
     * @returns {Promise}
     */
    getSuggestedReorderProducts: async (id) => {
        try {
            const response = await axiosInstance.get(`/suppliers/${id}/suggested-reorder`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default suppliersApi;