/**
 * API de Códigos QR para Inventory QR System
 * Gestión completa de generación, lectura y descarga de códigos QR
 */

import axiosInstance from './axiosConfig';

// Configuración desde variables de entorno
const QR_CODE_SIZE = parseInt(process.env.QR_CODE_SIZE) || 300;
const QR_BASE_URL = process.env.QR_BASE_URL || 'http://localhost:3000/qr-codes';

const qrApi = {
    /**
     * Generar código QR para un producto
     * @param {number|string} productId - ID del producto
     * @param {Object} options - Opciones de generación
     * @returns {Promise}
     */
    generateProductQR: async (productId, options = {}) => {
        try {
            const response = await axiosInstance.post(`/qr/products/${productId}/generate`, {
                size: options.size || QR_CODE_SIZE,
                margin: options.margin || 4,
                color: options.color || '#000000',
                bgColor: options.bgColor || '#FFFFFF',
                errorCorrection: options.errorCorrection || 'H',
                includeLogo: options.includeLogo || true,
                format: options.format || 'png'
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener código QR de un producto
     * @param {number|string} productId - ID del producto
     * @returns {Promise}
     */
    getProductQR: async (productId) => {
        try {
            const response = await axiosInstance.get(`/qr/products/${productId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Leer/Decodificar código QR
     * @param {File} qrImage - Archivo de imagen QR
     * @returns {Promise}
     */
    decodeQR: async (qrImage) => {
        try {
            const formData = new FormData();
            formData.append('qrImage', qrImage);
            
            const response = await axiosInstance.post('/qr/decode', formData, {
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
     * Validar código QR
     * @param {string} qrCode - Código QR a validar
     * @returns {Promise}
     */
    validateQR: async (qrCode) => {
        try {
            const response = await axiosInstance.get('/qr/validate', {
                params: { code: qrCode }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Descargar código QR
     * @param {string} qrCode - Código QR
     * @param {string} format - Formato de descarga (png, svg, jpeg)
     * @returns {Promise}
     */
    downloadQR: async (qrCode, format = 'png') => {
        try {
            const response = await axiosInstance.get('/qr/download', {
                params: { code: qrCode, format },
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Descargar código QR de producto por ID
     * @param {number|string} productId - ID del producto
     * @param {string} format - Formato de descarga
     * @returns {Promise}
     */
    downloadProductQR: async (productId, format = 'png') => {
        try {
            const response = await axiosInstance.get(`/qr/products/${productId}/download`, {
                params: { format },
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Generar código QR dinámico
     * @param {Object} data - Datos para el QR
     * @param {Object} options - Opciones de generación
     * @returns {Promise}
     */
    generateDynamicQR: async (data, options = {}) => {
        try {
            const response = await axiosInstance.post('/qr/dynamic', {
                data,
                type: options.type || 'text',
                size: options.size || QR_CODE_SIZE,
                margin: options.margin || 4,
                color: options.color || '#000000',
                bgColor: options.bgColor || '#FFFFFF',
                expiresIn: options.expiresIn || null,
                maxScans: options.maxScans || null
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener estadísticas de escaneo de QR
     * @param {string} qrId - ID del código QR
     * @param {Object} params - Parámetros de consulta
     * @returns {Promise}
     */
    getQRStats: async (qrId, params = {}) => {
        try {
            const queryParams = {
                startDate: params.startDate || '',
                endDate: params.endDate || '',
                period: params.period || 'day'
            };
            
            const response = await axiosInstance.get(`/qr/${qrId}/stats`, {
                params: queryParams
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener todos los códigos QR generados
     * @param {Object} params - Parámetros de paginación
     * @returns {Promise}
     */
    getAllQRCodes: async (params = {}) => {
        try {
            const queryParams = {
                page: params.page || 1,
                limit: params.limit || 20,
                type: params.type || '',
                search: params.search || '',
                sortBy: params.sortBy || 'createdAt',
                sortOrder: params.sortOrder || 'DESC'
            };
            
            const response = await axiosInstance.get('/qr', { params: queryParams });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Generar códigos QR masivos
     * @param {Array} items - Array de items para generar QR
     * @param {Object} options - Opciones comunes
     * @returns {Promise}
     */
    generateBulkQR: async (items, options = {}) => {
        try {
            const response = await axiosInstance.post('/qr/bulk', {
                items,
                size: options.size || QR_CODE_SIZE,
                margin: options.margin || 4,
                color: options.color || '#000000',
                bgColor: options.bgColor || '#FFFFFF'
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Imprimir código QR
     * @param {string} qrCode - Código QR
     * @param {Object} printOptions - Opciones de impresión
     * @returns {Promise}
     */
    printQR: async (qrCode, printOptions = {}) => {
        try {
            const response = await axiosInstance.post('/qr/print', {
                code: qrCode,
                size: printOptions.size || 'medium',
                copies: printOptions.copies || 1,
                label: printOptions.label || ''
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Exportar códigos QR a PDF
     * @param {Array} qrCodes - Array de códigos QR
     * @param {Object} options - Opciones de exportación
     * @returns {Promise}
     */
    exportToPDF: async (qrCodes, options = {}) => {
        try {
            const response = await axiosInstance.post('/qr/export/pdf', {
                codes: qrCodes,
                title: options.title || 'Códigos QR',
                layout: options.layout || 'grid',
                pageSize: options.pageSize || 'A4'
            }, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Exportar códigos QR a ZIP
     * @param {Array} qrCodes - Array de códigos QR
     * @param {string} format - Formato de imagen
     * @returns {Promise}
     */
    exportToZIP: async (qrCodes, format = 'png') => {
        try {
            const response = await axiosInstance.post('/qr/export/zip', {
                codes: qrCodes,
                format: format
            }, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Eliminar código QR
     * @param {string} qrId - ID del código QR
     * @returns {Promise}
     */
    deleteQR: async (qrId) => {
        try {
            const response = await axiosInstance.delete(`/qr/${qrId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Actualizar código QR
     * @param {string} qrId - ID del código QR
     * @param {Object} updateData - Datos a actualizar
     * @returns {Promise}
     */
    updateQR: async (qrId, updateData) => {
        try {
            const response = await axiosInstance.put(`/qr/${qrId}`, updateData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Escanear código QR desde cámara (web)
     * @param {string} imageData - Datos de imagen base64
     * @returns {Promise}
     */
    scanFromCamera: async (imageData) => {
        try {
            const response = await axiosInstance.post('/qr/scan', { image: imageData });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Verificar si un código QR es válido para producto
     * @param {string} qrCode - Código QR
     * @param {number|string} productId - ID del producto
     * @returns {Promise}
     */
    verifyProductQR: async (qrCode, productId) => {
        try {
            const response = await axiosInstance.get('/qr/verify-product', {
                params: { code: qrCode, productId }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener información de escaneos en tiempo real
     * @param {string} qrId - ID del código QR
     * @returns {Promise}
     */
    getRealtimeScans: async (qrId) => {
        try {
            const response = await axiosInstance.get(`/qr/${qrId}/realtime`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Configurar webhook para escaneos de QR
     * @param {string} qrId - ID del código QR
     * @param {string} webhookUrl - URL del webhook
     * @returns {Promise}
     */
    setWebhook: async (qrId, webhookUrl) => {
        try {
            const response = await axiosInstance.post(`/qr/${qrId}/webhook`, { webhookUrl });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Generar código QR para ubicación
     * @param {Object} locationData - Datos de ubicación
     * @param {Object} options - Opciones de generación
     * @returns {Promise}
     */
    generateLocationQR: async (locationData, options = {}) => {
        try {
            const response = await axiosInstance.post('/qr/location', {
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                name: locationData.name,
                size: options.size || QR_CODE_SIZE,
                format: options.format || 'png'
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Generar código QR para contacto
     * @param {Object} contactData - Datos de contacto (vCard)
     * @param {Object} options - Opciones de generación
     * @returns {Promise}
     */
    generateContactQR: async (contactData, options = {}) => {
        try {
            const response = await axiosInstance.post('/qr/contact', {
                name: contactData.name,
                phone: contactData.phone,
                email: contactData.email,
                company: contactData.company,
                title: contactData.title,
                address: contactData.address,
                size: options.size || QR_CODE_SIZE
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Generar código QR para WiFi
     * @param {Object} wifiData - Datos de WiFi
     * @param {Object} options - Opciones de generación
     * @returns {Promise}
     */
    generateWifiQR: async (wifiData, options = {}) => {
        try {
            const response = await axiosInstance.post('/qr/wifi', {
                ssid: wifiData.ssid,
                password: wifiData.password,
                encryption: wifiData.encryption || 'WPA',
                hidden: wifiData.hidden || false,
                size: options.size || QR_CODE_SIZE
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Generar código QR para evento (calendario)
     * @param {Object} eventData - Datos del evento
     * @param {Object} options - Opciones de generación
     * @returns {Promise}
     */
    generateEventQR: async (eventData, options = {}) => {
        try {
            const response = await axiosInstance.post('/qr/event', {
                title: eventData.title,
                startDate: eventData.startDate,
                endDate: eventData.endDate,
                location: eventData.location,
                description: eventData.description,
                size: options.size || QR_CODE_SIZE
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Clonar código QR existente
     * @param {string} qrId - ID del código QR a clonar
     * @param {Object} modifications - Modificaciones a aplicar
     * @returns {Promise}
     */
    cloneQR: async (qrId, modifications = {}) => {
        try {
            const response = await axiosInstance.post(`/qr/${qrId}/clone`, modifications);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener historial de cambios de un QR
     * @param {string} qrId - ID del código QR
     * @returns {Promise}
     */
    getQRHistory: async (qrId) => {
        try {
            const response = await axiosInstance.get(`/qr/${qrId}/history`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Compartir código QR
     * @param {string} qrCode - Código QR
     * @param {string} method - Método de compartición (email, whatsapp, etc)
     * @param {Object} shareData - Datos adicionales
     * @returns {Promise}
     */
    shareQR: async (qrCode, method, shareData = {}) => {
        try {
            const response = await axiosInstance.post('/qr/share', {
                code: qrCode,
                method,
                recipient: shareData.recipient,
                message: shareData.message
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Personalizar diseño de QR
     * @param {string} qrId - ID del código QR
     * @param {Object} designData - Datos de diseño
     * @returns {Promise}
     */
    customizeQRDesign: async (qrId, designData) => {
        try {
            const response = await axiosInstance.post(`/qr/${qrId}/customize`, {
                foregroundColor: designData.foregroundColor,
                backgroundColor: designData.backgroundColor,
                cornerStyle: designData.cornerStyle,
                eyeStyle: designData.eyeStyle,
                logo: designData.logo,
                gradient: designData.gradient
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener vista previa de QR personalizado
     * @param {Object} previewData - Datos para vista previa
     * @returns {Promise}
     */
    getQRPreview: async (previewData) => {
        try {
            const response = await axiosInstance.post('/qr/preview', previewData, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Analizar calidad de código QR
     * @param {File} qrImage - Imagen del QR
     * @returns {Promise}
     */
    analyzeQRQuality: async (qrImage) => {
        try {
            const formData = new FormData();
            formData.append('qrImage', qrImage);
            
            const response = await axiosInstance.post('/qr/analyze', formData, {
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
     * Obtener recomendaciones para mejorar QR
     * @param {string} qrId - ID del código QR
     * @returns {Promise}
     */
    getQRRecommendations: async (qrId) => {
        try {
            const response = await axiosInstance.get(`/qr/${qrId}/recommendations`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Programar desactivación de QR
     * @param {string} qrId - ID del código QR
     * @param {Date} deactivateAt - Fecha de desactivación
     * @returns {Promise}
     */
    scheduleQRDeactivation: async (qrId, deactivateAt) => {
        try {
            const response = await axiosInstance.post(`/qr/${qrId}/schedule-deactivation`, {
                deactivateAt
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Activar/Desactivar QR temporalmente
     * @param {string} qrId - ID del código QR
     * @param {boolean} isActive - Estado activo/inactivo
     * @returns {Promise}
     */
    toggleQRStatus: async (qrId, isActive) => {
        try {
            const response = await axiosInstance.patch(`/qr/${qrId}/status`, { isActive });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default qrApi;