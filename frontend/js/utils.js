/**
 * Utilidades generales para la aplicación
 */

// Formatear fechas
function formatDate(date, format = 'long') {
    if (!date) return '-';
    
    const d = new Date(date);
    
    if (isNaN(d.getTime())) {
        return date; // Si no es una fecha válida, devolver el valor original
    }
    
    const formats = {
        short: `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`,
        medium: `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`,
        long: d.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }),
        iso: d.toISOString().split('T')[0],
        time: `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    };
    
    return formats[format] || formats.medium;
}

// Formatear números (precios, cantidades)
function formatNumber(number, decimals = 2) {
    if (number === null || number === undefined) return '0';
    
    return new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(number);
}

// Formatear moneda
function formatCurrency(amount, currency = 'USD') {
    if (amount === null || amount === undefined) return '$0.00';
    
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

// Validar email
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validar teléfono
function isValidPhone(phone) {
    const re = /^[\+]?[0-9]{10,15}$/;
    return re.test(phone.replace(/[\s\-\(\)]/g, ''));
}

// Capitalizar texto
function capitalize(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

// Truncar texto
function truncateText(text, maxLength = 100) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Generar ID único
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Debounce para funciones
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle para funciones
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Obtener parámetros de URL
function getUrlParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    const pairs = queryString.split('&');
    
    for (let pair of pairs) {
        const [key, value] = pair.split('=');
        if (key) {
            params[decodeURIComponent(key)] = decodeURIComponent(value || '');
        }
    }
    
    return params;
}

// Establecer parámetros de URL
function setUrlParams(params) {
    const url = new URL(window.location);
    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
            url.searchParams.set(key, params[key]);
        } else {
            url.searchParams.delete(key);
        }
    });
    window.history.pushState({}, '', url);
}

// Descargar archivo
function downloadFile(content, fileName, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Copiar al portapapeles
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        return new Promise((res, rej) => {
            document.execCommand('copy') ? res() : rej();
            textArea.remove();
        });
    }
}

// Mostrar/ocultar loading
function showLoading(text = 'Cargando...') {
    const overlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    
    if (overlay) {
        if (loadingText) {
            loadingText.textContent = text;
        }
        overlay.style.display = 'flex';
        APP_STATE.loading = true;
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    
    if (overlay) {
        overlay.style.display = 'none';
        APP_STATE.loading = false;
    }
}

function showMiniLoading() {
    const miniLoading = document.getElementById('miniLoading');
    if (miniLoading) {
        miniLoading.style.display = 'block';
    }
}

function hideMiniLoading() {
    const miniLoading = document.getElementById('miniLoading');
    if (miniLoading) {
        miniLoading.style.display = 'none';
    }
}

// Verificar conexión a internet
function isOnline() {
    return navigator.onLine;
}

// Detectar dispositivo móvil
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Manejar errores de API
function handleApiError(error) {
    console.error('Error de API:', error);
    
    let message = 'Error en la petición';
    
    if (error.message) {
        message = error.message;
    } else if (error.status === 401) {
        message = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
        setTimeout(() => {
            clearAuthData();
            window.location.href = 'index.html';
        }, 2000);
    } else if (error.status === 403) {
        message = 'No tienes permisos para realizar esta acción.';
    } else if (error.status === 404) {
        message = 'Recurso no encontrado.';
    } else if (error.status >= 500) {
        message = 'Error del servidor. Por favor, intenta más tarde.';
    }
    
    showNotification(message, 'error');
    
    return { success: false, message };
}

// Exportar funciones
window.formatDate = formatDate;
window.formatNumber = formatNumber;
window.formatCurrency = formatCurrency;
window.isValidEmail = isValidEmail;
window.isValidPhone = isValidPhone;
window.capitalize = capitalize;
window.truncateText = truncateText;
window.generateId = generateId;
window.debounce = debounce;
window.throttle = throttle;
window.getUrlParams = getUrlParams;
window.setUrlParams = setUrlParams;
window.downloadFile = downloadFile;
window.copyToClipboard = copyToClipboard;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showMiniLoading = showMiniLoading;
window.hideMiniLoading = hideMiniLoading;
window.isOnline = isOnline;
window.isMobile = isMobile;
window.handleApiError = handleApiError;