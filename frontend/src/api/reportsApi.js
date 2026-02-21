/**
 * API de Reportes para Inventory QR System
 * Generación y gestión de reportes del sistema
 */

import axiosInstance from './axiosConfig';

// Configuración desde variables de entorno
const REPORT_TIMEZONE = process.env.REPORT_TIMEZONE || 'America/Mexico_City';
const REPORT_DATE_FORMAT = process.env.REPORT_DATE_FORMAT || 'DD/MM/YYYY';
const REPORT_CURRENCY = process.env.REPORT_CURRENCY || 'MXN';
const EXPORT_MAX_ROWS = parseInt(process.env.EXPORT_MAX_ROWS) || 10000;

const reportsApi = {
    /**
     * Generar reporte de inventario
     * @param {Object} params - Parámetros del reporte
     * @returns {Promise}
     */
    generateInventoryReport: async (params = {}) => {
        try {
            const reportParams = {
                type: params.type || 'summary', // summary, detailed, valuation
                startDate: params.startDate || '',
                endDate: params.endDate || '',
                category: params.category || '',
                supplier: params.supplier || '',
                includeLowStock: params.includeLowStock || false,
                includeExpiring: params.includeExpiring || false,
                groupBy: params.groupBy || 'category',
                timezone: REPORT_TIMEZONE,
                currency: REPORT_CURRENCY
            };
            
            const response = await axiosInstance.post('/reports/inventory', reportParams);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Generar reporte de movimientos
     * @param {Object} params - Parámetros del reporte
     * @returns {Promise}
     */
    generateMovementsReport: async (params = {}) => {
        try {
            const reportParams = {
                type: params.type || 'all', // all, entries, exits, adjustments
                startDate: params.startDate || '',
                endDate: params.endDate || '',
                productId: params.productId || '',
                category: params.category || '',
                userId: params.userId || '',
                movementType: params.movementType || '',
                timezone: REPORT_TIMEZONE,
                groupBy: params.groupBy || 'day'
            };
            
            const response = await axiosInstance.post('/reports/movements', reportParams);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Generar reporte de ventas
     * @param {Object} params - Parámetros del reporte
     * @returns {Promise}
     */
    generateSalesReport: async (params = {}) => {
        try {
            const reportParams = {
                type: params.type || 'summary', // summary, detailed, byProduct, byCategory
                startDate: params.startDate || '',
                endDate: params.endDate || '',
                productId: params.productId || '',
                category: params.category || '',
                paymentMethod: params.paymentMethod || '',
                timezone: REPORT_TIMEZONE,
                currency: REPORT_CURRENCY,
                groupBy: params.groupBy || 'day'
            };
            
            const response = await axiosInstance.post('/reports/sales', reportParams);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Generar reporte de productos
     * @param {Object} params - Parámetros del reporte
     * @returns {Promise}
     */
    generateProductsReport: async (params = {}) => {
        try {
            const reportParams = {
                type: params.type || 'summary', // summary, detailed, topSelling, slowMoving
                startDate: params.startDate || '',
                endDate: params.endDate || '',
                category: params.category || '',
                supplier: params.supplier || '',
                minStock: params.minStock || '',
                maxStock: params.maxStock || '',
                sortBy: params.sortBy || 'name',
                sortOrder: params.sortOrder || 'ASC',
                limit: params.limit || EXPORT_MAX_ROWS
            };
            
            const response = await axiosInstance.post('/reports/products', reportParams);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Generar reporte de proveedores
     * @param {Object} params - Parámetros del reporte
     * @returns {Promise}
     */
    generateSuppliersReport: async (params = {}) => {
        try {
            const reportParams = {
                type: params.type || 'summary', // summary, detailed, performance
                startDate: params.startDate || '',
                endDate: params.endDate || '',
                supplierId: params.supplierId || '',
                includeProducts: params.includeProducts || false,
                includePurchases: params.includePurchases || false,
                timezone: REPORT_TIMEZONE,
                currency: REPORT_CURRENCY
            };
            
            const response = await axiosInstance.post('/reports/suppliers', reportParams);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Generar reporte de caducidad
     * @param {Object} params - Parámetros del reporte
     * @returns {Promise}
     */
    generateExpiryReport: async (params = {}) => {
        try {
            const reportParams = {
                daysToExpire: params.daysToExpire || 30,
                category: params.category || '',
                supplier: params.supplier || '',
                includeExpired: params.includeExpired || false,
                groupBy: params.groupBy || 'month',
                timezone: REPORT_TIMEZONE,
                dateFormat: REPORT_DATE_FORMAT
            };
            
            const response = await axiosInstance.post('/reports/expiry', reportParams);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Generar reporte de stock bajo
     * @param {Object} params - Parámetros del reporte
     * @returns {Promise}
     */
    generateLowStockReport: async (params = {}) => {
        try {
            const reportParams = {
                threshold: params.threshold || 10,
                category: params.category || '',
                supplier: params.supplier || '',
                includeZeroStock: params.includeZeroStock || false,
                sortBy: params.sortBy || 'stock',
                sortOrder: params.sortOrder || 'ASC'
            };
            
            const response = await axiosInstance.post('/reports/low-stock', reportParams);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Generar reporte de valor de inventario
     * @param {Object} params - Parámetros del reporte
     * @returns {Promise}
     */
    generateValuationReport: async (params = {}) => {
        try {
            const reportParams = {
                valuationMethod: params.valuationMethod || 'average', // average, fifo, lifo
                asOfDate: params.asOfDate || new Date().toISOString().split('T')[0],
                category: params.category || '',
                supplier: params.supplier || '',
                groupBy: params.groupBy || 'category',
                currency: REPORT_CURRENCY
            };
            
            const response = await axiosInstance.post('/reports/valuation', reportParams);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Generar reporte de auditoría
     * @param {Object} params - Parámetros del reporte
     * @returns {Promise}
     */
    generateAuditReport: async (params = {}) => {
        try {
            const reportParams = {
                startDate: params.startDate || '',
                endDate: params.endDate || '',
                userId: params.userId || '',
                action: params.action || '',
                entityType: params.entityType || '',
                entityId: params.entityId || '',
                timezone: REPORT_TIMEZONE,
                includeDetails: params.includeDetails || false
            };
            
            const response = await axiosInstance.post('/reports/audit', reportParams);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Generar reporte de rendimiento
     * @param {Object} params - Parámetros del reporte
     * @returns {Promise}
     */
    generatePerformanceReport: async (params = {}) => {
        try {
            const reportParams = {
                type: params.type || 'system', // system, database, api
                startDate: params.startDate || '',
                endDate: params.endDate || '',
                metrics: params.metrics || ['responseTime', 'errorRate', 'requests'],
                groupBy: params.groupBy || 'hour'
            };
            
            const response = await axiosInstance.post('/reports/performance', reportParams);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Generar reporte de actividad de usuarios
     * @param {Object} params - Parámetros del reporte
     * @returns {Promise}
     */
    generateUserActivityReport: async (params = {}) => {
        try {
            const reportParams = {
                startDate: params.startDate || '',
                endDate: params.endDate || '',
                userId: params.userId || '',
                role: params.role || '',
                actions: params.actions || [],
                groupBy: params.groupBy || 'day',
                timezone: REPORT_TIMEZONE
            };
            
            const response = await axiosInstance.post('/reports/user-activity', reportParams);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Generar reporte comparativo
     * @param {Object} params - Parámetros del reporte
     * @returns {Promise}
     */
    generateComparativeReport: async (params = {}) => {
        try {
            const reportParams = {
                metric: params.metric || 'sales', // sales, stock, movements
                period1: {
                    startDate: params.period1?.startDate || '',
                    endDate: params.period1?.endDate || ''
                },
                period2: {
                    startDate: params.period2?.startDate || '',
                    endDate: params.period2?.endDate || ''
                },
                groupBy: params.groupBy || 'category',
                timezone: REPORT_TIMEZONE
            };
            
            const response = await axiosInstance.post('/reports/comparative', reportParams);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Generar reporte de pronóstico
     * @param {Object} params - Parámetros del reporte
     * @returns {Promise}
     */
    generateForecastReport: async (params = {}) => {
        try {
            const reportParams = {
                metric: params.metric || 'demand', // demand, stock
                productId: params.productId || '',
                category: params.category || '',
                forecastMonths: params.forecastMonths || 3,
                historicalMonths: params.historicalMonths || 12,
                confidence: params.confidence || 0.95,
                method: params.method || 'arima'
            };
            
            const response = await axiosInstance.post('/reports/forecast', reportParams);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Exportar reporte
     * @param {string} reportId - ID del reporte
     * @param {string} format - Formato de exportación
     * @returns {Promise}
     */
    exportReport: async (reportId, format = 'pdf') => {
        try {
            const response = await axiosInstance.get(`/reports/${reportId}/export`, {
                params: { format },
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener todos los reportes generados
     * @param {Object} params - Parámetros de paginación
     * @returns {Promise}
     */
    getGeneratedReports: async (params = {}) => {
        try {
            const queryParams = {
                page: params.page || 1,
                limit: params.limit || 20,
                type: params.type || '',
                fromDate: params.fromDate || '',
                toDate: params.toDate || '',
                status: params.status || ''
            };
            
            const response = await axiosInstance.get('/reports/history', { params: queryParams });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener reporte por ID
     * @param {string} reportId - ID del reporte
     * @returns {Promise}
     */
    getReportById: async (reportId) => {
        try {
            const response = await axiosInstance.get(`/reports/${reportId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Eliminar reporte
     * @param {string} reportId - ID del reporte
     * @returns {Promise}
     */
    deleteReport: async (reportId) => {
        try {
            const response = await axiosInstance.delete(`/reports/${reportId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Programar reporte
     * @param {Object} scheduleData - Datos de programación
     * @returns {Promise}
     */
    scheduleReport: async (scheduleData) => {
        try {
            const response = await axiosInstance.post('/reports/schedule', {
                reportType: scheduleData.reportType,
                params: scheduleData.params,
                schedule: scheduleData.schedule, // daily, weekly, monthly
                time: scheduleData.time,
                recipients: scheduleData.recipients,
                format: scheduleData.format || 'pdf',
                name: scheduleData.name
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener reportes programados
     * @returns {Promise}
     */
    getScheduledReports: async () => {
        try {
            const response = await axiosInstance.get('/reports/scheduled');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Cancelar reporte programado
     * @param {string} scheduleId - ID de la programación
     * @returns {Promise}
     */
    cancelScheduledReport: async (scheduleId) => {
        try {
            const response = await axiosInstance.delete(`/reports/schedule/${scheduleId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Enviar reporte por email
     * @param {string} reportId - ID del reporte
     * @param {Array} recipients - Lista de destinatarios
     * @param {string} message - Mensaje adicional
     * @returns {Promise}
     */
    emailReport: async (reportId, recipients, message = '') => {
        try {
            const response = await axiosInstance.post(`/reports/${reportId}/email`, {
                recipients,
                message
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Compartir reporte
     * @param {string} reportId - ID del reporte
     * @param {Object} shareData - Datos de compartición
     * @returns {Promise}
     */
    shareReport: async (reportId, shareData) => {
        try {
            const response = await axiosInstance.post(`/reports/${reportId}/share`, {
                method: shareData.method,
                recipient: shareData.recipient,
                expiresIn: shareData.expiresIn || 7,
                password: shareData.password || null
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener plantillas de reportes
     * @returns {Promise}
     */
    getReportTemplates: async () => {
        try {
            const response = await axiosInstance.get('/reports/templates');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Guardar como plantilla
     * @param {Object} templateData - Datos de la plantilla
     * @returns {Promise}
     */
    saveAsTemplate: async (templateData) => {
        try {
            const response = await axiosInstance.post('/reports/templates', {
                name: templateData.name,
                description: templateData.description,
                reportType: templateData.reportType,
                params: templateData.params,
                isPublic: templateData.isPublic || false
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener dashboard de reportes
     * @returns {Promise}
     */
    getReportDashboard: async () => {
        try {
            const response = await axiosInstance.get('/reports/dashboard');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener métricas rápidas
     * @returns {Promise}
     */
    getQuickMetrics: async () => {
        try {
            const response = await axiosInstance.get('/reports/quick-metrics');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Validar parámetros de reporte
     * @param {string} reportType - Tipo de reporte
     * @param {Object} params - Parámetros a validar
     * @returns {Promise}
     */
    validateReportParams: async (reportType, params) => {
        try {
            const response = await axiosInstance.post('/reports/validate', {
                reportType,
                params
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener datos en tiempo real para dashboard
     * @returns {Promise}
     */
    getRealtimeData: async () => {
        try {
            const response = await axiosInstance.get('/reports/realtime');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Descargar datos en bruto
     * @param {string} reportType - Tipo de reporte
     * @param {Object} params - Parámetros
     * @returns {Promise}
     */
    downloadRawData: async (reportType, params = {}) => {
        try {
            const response = await axiosInstance.post('/reports/raw-data', {
                reportType,
                params
            }, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Comparar múltiples períodos
     * @param {Object} params - Parámetros de comparación
     * @returns {Promise}
     */
    comparePeriods: async (params) => {
        try {
            const response = await axiosInstance.post('/reports/compare-periods', {
                metric: params.metric,
                periods: params.periods,
                groupBy: params.groupBy || 'total'
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener tendencias
     * @param {Object} params - Parámetros de tendencia
     * @returns {Promise}
     */
    getTrends: async (params) => {
        try {
            const response = await axiosInstance.post('/reports/trends', {
                metric: params.metric,
                startDate: params.startDate,
                endDate: params.endDate,
                interval: params.interval || 'month'
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Generar reporte consolidado
     * @param {Array} reports - Lista de reportes a consolidar
     * @param {Object} options - Opciones de consolidación
     * @returns {Promise}
     */
    generateConsolidatedReport: async (reports, options = {}) => {
        try {
            const response = await axiosInstance.post('/reports/consolidated', {
                reports,
                title: options.title || 'Reporte Consolidado',
                includeCharts: options.includeCharts || true,
                format: options.format || 'pdf'
            }, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Generar reporte de cumplimiento
     * @param {Object} params - Parámetros del reporte
     * @returns {Promise}
     */
    generateComplianceReport: async (params = {}) => {
        try {
            const reportParams = {
                startDate: params.startDate || '',
                endDate: params.endDate || '',
                standards: params.standards || ['ISO9001'],
                includeEvidence: params.includeEvidence || false
            };
            
            const response = await axiosInstance.post('/reports/compliance', reportParams);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtener resumen ejecutivo
     * @param {Object} params - Parámetros del resumen
     * @returns {Promise}
     */
    getExecutiveSummary: async (params = {}) => {
        try {
            const response = await axiosInstance.post('/reports/executive-summary', {
                period: params.period || 'month',
                includeForecast: params.includeForecast || true,
                includeAlerts: params.includeAlerts || true
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Generar reporte de rentabilidad
     * @param {Object} params - Parámetros del reporte
     * @returns {Promise}
     */
    generateProfitabilityReport: async (params = {}) => {
        try {
            const reportParams = {
                startDate: params.startDate || '',
                endDate: params.endDate || '',
                productId: params.productId || '',
                category: params.category || '',
                includeCosts: params.includeCosts || true,
                groupBy: params.groupBy || 'product'
            };
            
            const response = await axiosInstance.post('/reports/profitability', reportParams);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Generar reporte de rotación
     * @param {Object} params - Parámetros del reporte
     * @returns {Promise}
     */
    generateTurnoverReport: async (params = {}) => {
        try {
            const reportParams = {
                startDate: params.startDate || '',
                endDate: params.endDate || '',
                category: params.category || '',
                periodType: params.periodType || 'monthly', // monthly, quarterly, yearly
                threshold: params.threshold || 0
            };
            
            const response = await axiosInstance.post('/reports/turnover', reportParams);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default reportsApi;