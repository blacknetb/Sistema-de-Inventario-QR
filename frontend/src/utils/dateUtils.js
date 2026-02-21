/**
 * dateUtils.js - Utilidades para manejo de fechas en Inventory QR System
 * Proporciona funciones para formatear, manipular y validar fechas
 */

import { format, formatDistance, formatRelative, differenceInDays, differenceInHours, addDays, subDays, isAfter, isBefore, isWithinInterval, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

// ========================================
// CONFIGURACIÓN
// ========================================

const DEFAULT_LOCALE = es;
const DEFAULT_DATE_FORMAT = 'dd/MM/yyyy';
const DEFAULT_TIME_FORMAT = 'HH:mm:ss';
const DEFAULT_DATETIME_FORMAT = 'dd/MM/yyyy HH:mm:ss';

// ========================================
// FORMATEO DE FECHAS
// ========================================

/**
 * Formatea una fecha según el formato especificado
 * @param {Date|string} date - Fecha a formatear
 * @param {string} formatStr - Formato deseado (por defecto: DD/MM/YYYY)
 * @returns {string} - Fecha formateada
 */
export function formatDate(date, formatStr = DEFAULT_DATE_FORMAT) {
    if (!date) return '';
    
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        if (!isValid(dateObj)) return '';
        
        return format(dateObj, formatStr, { locale: DEFAULT_LOCALE });
    } catch (error) {
        console.error('Error formateando fecha:', error);
        return '';
    }
}

/**
 * Formatea una hora según el formato especificado
 * @param {Date|string} date - Fecha a formatear
 * @param {string} formatStr - Formato deseado (por defecto: HH:mm:ss)
 * @returns {string} - Hora formateada
 */
export function formatTime(date, formatStr = DEFAULT_TIME_FORMAT) {
    if (!date) return '';
    
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        if (!isValid(dateObj)) return '';
        
        return format(dateObj, formatStr, { locale: DEFAULT_LOCALE });
    } catch (error) {
        console.error('Error formateando hora:', error);
        return '';
    }
}

/**
 * Formatea fecha y hora
 * @param {Date|string} date - Fecha a formatear
 * @param {string} formatStr - Formato deseado
 * @returns {string} - Fecha y hora formateadas
 */
export function formatDateTime(date, formatStr = DEFAULT_DATETIME_FORMAT) {
    return formatDate(date, formatStr);
}

/**
 * Formatea una fecha en formato relativo (hace 2 días, en 3 horas, etc.)
 * @param {Date|string} date - Fecha a formatear
 * @param {Date|string} baseDate - Fecha base (por defecto: ahora)
 * @returns {string} - Fecha relativa
 */
export function formatRelativeTime(date, baseDate = new Date()) {
    if (!date) return '';
    
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        const baseObj = typeof baseDate === 'string' ? parseISO(baseDate) : baseDate;
        
        if (!isValid(dateObj) || !isValid(baseObj)) return '';
        
        return formatDistance(dateObj, baseObj, { 
            locale: DEFAULT_LOCALE,
            addSuffix: true 
        });
    } catch (error) {
        console.error('Error formateando tiempo relativo:', error);
        return '';
    }
}

/**
 * Formatea una fecha en formato de calendario (Hoy, Ayer, etc.)
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} - Fecha en formato calendario
 */
export function formatCalendarDate(date) {
    if (!date) return '';
    
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        if (!isValid(dateObj)) return '';
        
        return formatRelative(dateObj, new Date(), { locale: DEFAULT_LOCALE });
    } catch (error) {
        console.error('Error formateando fecha calendario:', error);
        return '';
    }
}

// ========================================
// MANIPULACIÓN DE FECHAS
// ========================================

/**
 * Añade días a una fecha
 * @param {Date|string} date - Fecha base
 * @param {number} days - Número de días a añadir
 * @returns {Date} - Nueva fecha
 */
export function addDaysToDate(date, days) {
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        if (!isValid(dateObj)) return null;
        
        return addDays(dateObj, days);
    } catch (error) {
        console.error('Error añadiendo días:', error);
        return null;
    }
}

/**
 * Resta días a una fecha
 * @param {Date|string} date - Fecha base
 * @param {number} days - Número de días a restar
 * @returns {Date} - Nueva fecha
 */
export function subtractDaysFromDate(date, days) {
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        if (!isValid(dateObj)) return null;
        
        return subDays(dateObj, days);
    } catch (error) {
        console.error('Error restando días:', error);
        return null;
    }
}

/**
 * Obtiene el inicio del día (00:00:00)
 * @param {Date|string} date - Fecha
 * @returns {Date} - Inicio del día
 */
export function getStartOfDay(date = new Date()) {
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        if (!isValid(dateObj)) return null;
        
        dateObj.setHours(0, 0, 0, 0);
        return dateObj;
    } catch (error) {
        console.error('Error obteniendo inicio del día:', error);
        return null;
    }
}

/**
 * Obtiene el final del día (23:59:59)
 * @param {Date|string} date - Fecha
 * @returns {Date} - Final del día
 */
export function getEndOfDay(date = new Date()) {
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        if (!isValid(dateObj)) return null;
        
        dateObj.setHours(23, 59, 59, 999);
        return dateObj;
    } catch (error) {
        console.error('Error obteniendo final del día:', error);
        return null;
    }
}

// ========================================
// CÁLCULOS CON FECHAS
// ========================================

/**
 * Calcula la diferencia en días entre dos fechas
 * @param {Date|string} date1 - Primera fecha
 * @param {Date|string} date2 - Segunda fecha
 * @returns {number} - Diferencia en días
 */
export function getDaysDifference(date1, date2) {
    try {
        const dateObj1 = typeof date1 === 'string' ? parseISO(date1) : date1;
        const dateObj2 = typeof date2 === 'string' ? parseISO(date2) : date2;
        
        if (!isValid(dateObj1) || !isValid(dateObj2)) return 0;
        
        return differenceInDays(dateObj1, dateObj2);
    } catch (error) {
        console.error('Error calculando diferencia de días:', error);
        return 0;
    }
}

/**
 * Calcula la diferencia en horas entre dos fechas
 * @param {Date|string} date1 - Primera fecha
 * @param {Date|string} date2 - Segunda fecha
 * @returns {number} - Diferencia en horas
 */
export function getHoursDifference(date1, date2) {
    try {
        const dateObj1 = typeof date1 === 'string' ? parseISO(date1) : date1;
        const dateObj2 = typeof date2 === 'string' ? parseISO(date2) : date2;
        
        if (!isValid(dateObj1) || !isValid(dateObj2)) return 0;
        
        return differenceInHours(dateObj1, dateObj2);
    } catch (error) {
        console.error('Error calculando diferencia de horas:', error);
        return 0;
    }
}

/**
 * Verifica si una fecha está entre dos fechas
 * @param {Date|string} date - Fecha a verificar
 * @param {Date|string} startDate - Fecha inicial
 * @param {Date|string} endDate - Fecha final
 * @returns {boolean} - True si está en el rango
 */
export function isDateBetween(date, startDate, endDate) {
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        const startObj = typeof startDate === 'string' ? parseISO(startDate) : startDate;
        const endObj = typeof endDate === 'string' ? parseISO(endDate) : endDate;
        
        if (!isValid(dateObj) || !isValid(startObj) || !isValid(endObj)) return false;
        
        return isWithinInterval(dateObj, { start: startObj, end: endObj });
    } catch (error) {
        console.error('Error verificando rango de fechas:', error);
        return false;
    }
}

/**
 * Verifica si una fecha es anterior a otra
 * @param {Date|string} date - Fecha a verificar
 * @param {Date|string} compareDate - Fecha de comparación
 * @returns {boolean} - True si es anterior
 */
export function isDateBefore(date, compareDate) {
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        const compareObj = typeof compareDate === 'string' ? parseISO(compareDate) : compareDate;
        
        if (!isValid(dateObj) || !isValid(compareObj)) return false;
        
        return isBefore(dateObj, compareObj);
    } catch (error) {
        console.error('Error verificando fecha anterior:', error);
        return false;
    }
}

/**
 * Verifica si una fecha es posterior a otra
 * @param {Date|string} date - Fecha a verificar
 * @param {Date|string} compareDate - Fecha de comparación
 * @returns {boolean} - True si es posterior
 */
export function isDateAfter(date, compareDate) {
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        const compareObj = typeof compareDate === 'string' ? parseISO(compareDate) : compareDate;
        
        if (!isValid(dateObj) || !isValid(compareObj)) return false;
        
        return isAfter(dateObj, compareObj);
    } catch (error) {
        console.error('Error verificando fecha posterior:', error);
        return false;
    }
}

// ========================================
// UTILIDADES ESPECÍFICAS DEL SISTEMA
// ========================================

/**
 * Verifica si un producto está próximo a vencer
 * @param {string} expiryDate - Fecha de vencimiento
 * @param {number} daysThreshold - Días de umbral
 * @returns {boolean} - True si está próximo a vencer
 */
export function isExpiringSoon(expiryDate, daysThreshold = 7) {
    if (!expiryDate) return false;
    
    try {
        const expiry = typeof expiryDate === 'string' ? parseISO(expiryDate) : expiryDate;
        const today = new Date();
        
        if (!isValid(expiry)) return false;
        
        const daysUntilExpiry = getDaysDifference(expiry, today);
        return daysUntilExpiry >= 0 && daysUntilExpiry <= daysThreshold;
    } catch (error) {
        console.error('Error verificando vencimiento:', error);
        return false;
    }
}

/**
 * Verifica si un producto ya venció
 * @param {string} expiryDate - Fecha de vencimiento
 * @returns {boolean} - True si está vencido
 */
export function isExpired(expiryDate) {
    if (!expiryDate) return false;
    
    try {
        const expiry = typeof expiryDate === 'string' ? parseISO(expiryDate) : expiryDate;
        const today = new Date();
        
        if (!isValid(expiry)) return false;
        
        return isDateBefore(expiry, today);
    } catch (error) {
        console.error('Error verificando vencimiento:', error);
        return false;
    }
}

/**
 * Obtiene el rango de fechas para un reporte
 * @param {string} period - Período (today, yesterday, thisWeek, lastWeek, thisMonth, lastMonth)
 * @returns {Object} - Objeto con startDate y endDate
 */
export function getDateRangeForReport(period) {
    const today = new Date();
    const startDate = new Date(today);
    const endDate = new Date(today);

    switch (period) {
        case 'today':
            return {
                startDate: getStartOfDay(today),
                endDate: getEndOfDay(today)
            };
        
        case 'yesterday':
            { const yesterday = subDays(today, 1);
            return {
                startDate: getStartOfDay(yesterday),
                endDate: getEndOfDay(yesterday)
            }; }
        
        case 'thisWeek':
            startDate.setDate(today.getDate() - today.getDay());
            endDate.setDate(startDate.getDate() + 6);
            return {
                startDate: getStartOfDay(startDate),
                endDate: getEndOfDay(endDate)
            };
        
        case 'lastWeek':
            startDate.setDate(today.getDate() - today.getDay() - 7);
            endDate.setDate(startDate.getDate() + 6);
            return {
                startDate: getStartOfDay(startDate),
                endDate: getEndOfDay(endDate)
            };
        
        case 'thisMonth':
            return {
                startDate: getStartOfDay(new Date(today.getFullYear(), today.getMonth(), 1)),
                endDate: getEndOfDay(new Date(today.getFullYear(), today.getMonth() + 1, 0))
            };
        
        case 'lastMonth':
            return {
                startDate: getStartOfDay(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
                endDate: getEndOfDay(new Date(today.getFullYear(), today.getMonth(), 0))
            };
        
        default:
            return {
                startDate: null,
                endDate: null
            };
    }
}

/**
 * Parsea una fecha de string a Date de forma segura
 * @param {string} dateString - String de fecha
 * @returns {Date|null} - Objeto Date o null si es inválido
 */
export function safeParseDate(dateString) {
    if (!dateString) return null;
    
    try {
        const date = parseISO(dateString);
        return isValid(date) ? date : null;
    } catch {
        return null;
    }
}