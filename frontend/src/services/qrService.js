/**
 * Servicio de QR para Inventory QR System
 * Actúa como una capa de abstracción sobre qrApi y proporciona utilidades adicionales
 * para el manejo de códigos QR.
 */

import qrApi from '../api/qrApi';

class QRService {
    /**
     * Genera un código QR para un producto.
     * @param {number|string} productId - ID del producto.
     * @param {Object} options - Opciones de generación.
     * @returns {Promise<Object>} - Respuesta de la API con los datos del QR generado.
     */
    async generateProductQR(productId, options = {}) {
        try {
            const response = await qrApi.generateProductQR(productId, options);
            return response;
        } catch (error) {
            console.error('Error en QRService.generateProductQR:', error);
            throw error;
        }
    }

    /**
     * Obtiene la información del código QR de un producto.
     * @param {number|string} productId - ID del producto.
     * @returns {Promise<Object>} - Respuesta de la API con los datos del QR.
     */
    async getProductQR(productId) {
        try {
            const response = await qrApi.getProductQR(productId);
            return response;
        } catch (error) {
            console.error('Error en QRService.getProductQR:', error);
            throw error;
        }
    }

    /**
     * Decodifica un código QR desde una imagen.
     * @param {File} qrImage - Archivo de imagen del QR.
     * @returns {Promise<Object>} - Respuesta de la API con el contenido decodificado.
     */
    async decodeQR(qrImage) {
        try {
            const response = await qrApi.decodeQR(qrImage);
            return response;
        } catch (error) {
            console.error('Error en QRService.decodeQR:', error);
            throw error;
        }
    }

    /**
     * Valida si un código QR es válido en el sistema.
     * @param {string} qrCode - Código QR a validar.
     * @returns {Promise<Object>} - Respuesta de la API.
     */
    async validateQR(qrCode) {
        try {
            const response = await qrApi.validateQR(qrCode);
            return response;
        } catch (error) {
            console.error('Error en QRService.validateQR:', error);
            throw error;
        }
    }

    /**
     * Descarga un código QR como imagen.
     * @param {string} qrCode - Código QR.
     * @param {string} format - Formato de imagen (png, svg, jpeg).
     * @returns {Promise<Blob>} - Blob de la imagen.
     */
    async downloadQR(qrCode, format = 'png') {
        try {
            const blob = await qrApi.downloadQR(qrCode, format);
            return blob;
        } catch (error) {
            console.error('Error en QRService.downloadQR:', error);
            throw error;
        }
    }

    /**
     * Descarga el código QR de un producto específico.
     * @param {number|string} productId - ID del producto.
     * @param {string} format - Formato de imagen.
     * @returns {Promise<Blob>} - Blob de la imagen.
     */
    async downloadProductQR(productId, format = 'png') {
        try {
            const blob = await qrApi.downloadProductQR(productId, format);
            return blob;
        } catch (error) {
            console.error('Error en QRService.downloadProductQR:', error);
            throw error;
        }
    }

    /**
     * Genera un código QR dinámico (con datos personalizados).
     * @param {Object} data - Datos a codificar.
     * @param {Object} options - Opciones de generación.
     * @returns {Promise<Object>} - Respuesta de la API.
     */
    async generateDynamicQR(data, options = {}) {
        try {
            const response = await qrApi.generateDynamicQR(data, options);
            return response;
        } catch (error) {
            console.error('Error en QRService.generateDynamicQR:', error);
            throw error;
        }
    }

    /**
     * Obtiene las estadísticas de escaneo de un código QR.
     * @param {string} qrId - ID del código QR.
     * @param {Object} params - Parámetros de consulta (fechas, período).
     * @returns {Promise<Object>} - Respuesta de la API.
     */
    async getQRStats(qrId, params = {}) {
        try {
            const response = await qrApi.getQRStats(qrId, params);
            return response;
        } catch (error) {
            console.error('Error en QRService.getQRStats:', error);
            throw error;
        }
    }

    /**
     * Genera múltiples códigos QR en lote.
     * @param {Array} items - Array de items para generar QR.
     * @param {Object} options - Opciones comunes.
     * @returns {Promise<Object>} - Respuesta de la API.
     */
    async generateBulkQR(items, options = {}) {
        try {
            const response = await qrApi.generateBulkQR(items, options);
            return response;
        } catch (error) {
            console.error('Error en QRService.generateBulkQR:', error);
            throw error;
        }
    }

    /**
     * Imprime un código QR.
     * @param {string} qrCode - Código QR.
     * @param {Object} printOptions - Opciones de impresión.
     * @returns {Promise<Object>} - Respuesta de la API.
     */
    async printQR(qrCode, printOptions = {}) {
        try {
            const response = await qrApi.printQR(qrCode, printOptions);
            return response;
        } catch (error) {
            console.error('Error en QRService.printQR:', error);
            throw error;
        }
    }

    /**
     * Escanea un código QR desde datos de imagen (ej. cámara).
     * @param {string} imageData - Datos de la imagen en base64.
     * @returns {Promise<Object>} - Respuesta de la API con el contenido decodificado.
     */
    async scanFromCamera(imageData) {
        try {
            const response = await qrApi.scanFromCamera(imageData);
            return response;
        } catch (error) {
            console.error('Error en QRService.scanFromCamera:', error);
            throw error;
        }
    }

    /**
     * Verifica que un código QR corresponda a un producto específico.
     * @param {string} qrCode - Código QR.
     * @param {number|string} productId - ID del producto.
     * @returns {Promise<Object>} - Respuesta de la API.
     */
    async verifyProductQR(qrCode, productId) {
        try {
            const response = await qrApi.verifyProductQR(qrCode, productId);
            return response;
        } catch (error) {
            console.error('Error en QRService.verifyProductQR:', error);
            throw error;
        }
    }

    /**
     * Personaliza el diseño de un código QR existente.
     * @param {string} qrId - ID del código QR.
     * @param {Object} designData - Datos de diseño (colores, logo, etc.).
     * @returns {Promise<Object>} - Respuesta de la API.
     */
    async customizeQRDesign(qrId, designData) {
        try {
            const response = await qrApi.customizeQRDesign(qrId, designData);
            return response;
        } catch (error) {
            console.error('Error en QRService.customizeQRDesign:', error);
            throw error;
        }
    }
}

export default new QRService();