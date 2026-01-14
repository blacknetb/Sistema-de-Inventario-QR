// Sistema de Inventario QR - Configuración de la Aplicación
// Versión: 1.0.0

(function() {
    'use strict';
    
    // =============== CONFIGURACIÓN DEL ENTORNO ===============
    // Detección de entorno local y desarrollo
    var isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname === '[::1]' ||
                    window.location.hostname === '0.0.0.0';
    
    var isDevelopment = window.location.port === '5173' ||
                      window.location.port === '3000' ||
                      window.location.port === '8080' ||
                      isLocalhost;
    
    // =============== CONFIGURACIÓN GLOBAL DE LA APLICACIÓN ===============
    window.APP_CONFIG = {
        // Información básica
        environment: isDevelopment ? 'development' : 'production',
        version: '1.0.0',
        buildDate: '2024-01-01',
        
        // Configuración de API
        api: {
            baseUrl: isDevelopment ? 
                    'http://' + window.location.hostname + ':3000/api' : 
                    window.location.origin + '/api',
            timeout: 30000,
            retry: {
                attempts: 3,
                delay: 1000
            },
            endpoints: {
                products: '/products',
                categories: '/categories',
                inventory: '/inventory',
                users: '/users',
                auth: '/auth',
                reports: '/reports',
                qr: '/qr'
            }
        },
        
        // Configuración de subida de archivos
        upload: {
            maxFileSize: 10 * 1024 * 1024, // 10MB
            allowedTypes: [
                'image/jpeg',
                'image/png',
                'image/gif',
                'application/pdf',
                'image/webp'
            ],
            endpoints: {
                images: '/upload/images',
                documents: '/upload/documents'
            }
        },
        
        // Configuración de paginación
        pagination: {
            defaultLimit: 20,
            maxLimit: 100,
            defaultPage: 1
        },
        
        // Configuración de caché
        cache: {
            ttl: 5 * 60 * 1000, // 5 minutos
            enabled: true,
            prefix: 'inventario_qr_'
        },
        
        // Configuración de notificaciones
        notifications: {
            position: 'top-right',
            duration: 5000,
            maxVisible: 3
        },
        
        // Funcionalidades habilitadas
        features: {
            offlineMode: true,
            qrScanner: true,
            barcodeScanner: true,
            exportToCSV: true,
            exportToPDF: true,
            importFromExcel: true,
            batchOperations: true
        },
        
        // Rutas de la aplicación
        routes: {
            home: '/',
            dashboard: '/dashboard',
            products: {
                list: '/products',
                create: '/products/new',
                edit: '/products/:id/edit',
                view: '/products/:id'
            },
            inventory: {
                list: '/inventory',
                movements: '/inventory/movements',
                adjustments: '/inventory/adjustments'
            },
            scanner: '/scanner',
            reports: '/reports',
            settings: '/settings',
            profile: '/profile'
        },
        
        // Configuración de QR
        qr: {
            size: 200,
            margin: 10,
            colorDark: '#000000',
            colorLight: '#ffffff',
            format: 'png'
        },
        
        // Configuración de exportación
        export: {
            csv: {
                delimiter: ',',
                encoding: 'utf-8'
            },
            pdf: {
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            }
        }
    };
    
    // =============== FUNCIONES UTILITARIAS ===============
    
    /**
     * Oculta la pantalla de carga de la aplicación
     * @function
     */
    window.hideAppLoading = function() {
        var loading = document.getElementById('app-loading');
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(function() {
                loading.style.display = 'none';
                // Disparar evento personalizado para notificar a otros componentes
                document.dispatchEvent(new CustomEvent('app-loading-hidden'));
            }, 400);
        }
    };
    
    /**
     * Muestra un error en la pantalla de carga
     * @param {string} message - Mensaje de error
     */
    function showLoadingError(message) {
        var loading = document.getElementById('app-loading');
        if (loading && loading.style.display !== 'none') {
            var container = loading.querySelector('.loading-container');
            if (container) {
                container.innerHTML = `
                    <div class="loading-error-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h2 class="error-title">Error de carga</h2>
                    <p class="error-description">${message}</p>
                    <div class="error-solutions">
                        <ul>
                            <li>Verifica tu conexión a internet</li>
                            <li>Recarga la página</li>
                            <li>Limpia la caché del navegador</li>
                            <li>Verifica que JavaScript esté habilitado</li>
                        </ul>
                    </div>
                    <button id="reload-button" class="reload-btn">🔄 Recargar Aplicación</button>
                `;
                
                var reloadBtn = document.getElementById('reload-button');
                if (reloadBtn) {
                    reloadBtn.addEventListener('click', function() {
                        window.location.reload();
                    });
                }
            }
        }
    }
    
    /**
     * Verifica la compatibilidad del navegador con las características requeridas
     * @returns {boolean} - True si el navegador es compatible
     */
    function checkBrowserCompatibility() {
        var requiredFeatures = [
            { name: 'Promises', test: function() { return !!window.Promise; } },
            { name: 'Fetch API', test: function() { return !!window.fetch; } },
            { name: 'LocalStorage', test: function() { return !!window.localStorage; } },
            { name: 'Query Selector', test: function() { return !!document.querySelector; } },
            { name: 'AddEventListener', test: function() { return !!window.addEventListener; } },
            { name: 'ES6 Syntax', test: function() { return typeof Symbol !== 'undefined'; } },
            { name: 'URL API', test: function() { return !!window.URL; } }
        ];
        
        var incompatibleReasons = [];
        
        requiredFeatures.forEach(function(feature) {
            if (!feature.test()) {
                incompatibleReasons.push(feature.name + ' no soportada');
            }
        });
        
        if (incompatibleReasons.length > 0) {
            console.warn('Compatibilidad limitada del navegador:', incompatibleReasons);
            showLoadingError('Tu navegador no soporta todas las características necesarias. Por favor, actualízalo.');
            return false;
        }
        
        return true;
    }
    
    // =============== API HELPER FUNCTIONS ===============
    
    /**
     * Realiza una petición a la API con manejo de errores
     * @param {string} endpoint - Endpoint de la API
     * @param {Object} options - Opciones de fetch
     * @returns {Promise} - Promise con la respuesta
     */
    window.apiRequest = async function(endpoint, options = {}) {
        const url = window.APP_CONFIG.api.baseUrl + endpoint;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), window.APP_CONFIG.api.timeout);
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            signal: controller.signal
        };
        
        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            console.error('Error en la petición API:', error);
            throw error;
        }
    };
    
    /**
     * Almacena datos en localStorage con manejo de errores
     * @param {string} key - Clave para almacenar
     * @param {any} value - Valor a almacenar
     * @returns {boolean} - True si se almacenó correctamente
     */
    window.safeStorageSet = function(key, value) {
        try {
            const prefixedKey = window.APP_CONFIG.cache.prefix + key;
            localStorage.setItem(prefixedKey, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn('⚠️ No se pudo guardar en localStorage:', error);
            return false;
        }
    };
    
    /**
     * Obtiene datos de localStorage con manejo de errores
     * @param {string} key - Clave a obtener
     * @returns {any} - Valor almacenado o null
     */
    window.safeStorageGet = function(key) {
        try {
            const prefixedKey = window.APP_CONFIG.cache.prefix + key;
            const item = localStorage.getItem(prefixedKey);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.warn('⚠️ No se pudo obtener de localStorage:', error);
            return null;
        }
    };
    
    /**
     * Elimina datos de localStorage
     * @param {string} key - Clave a eliminar
     */
    window.safeStorageRemove = function(key) {
        try {
            const prefixedKey = window.APP_CONFIG.cache.prefix + key;
            localStorage.removeItem(prefixedKey);
            return true;
        } catch (error) {
            console.warn('⚠️ No se pudo eliminar de localStorage:', error);
            return false;
        }
    };
    
    /**
     * Verifica la conexión a internet
     * @returns {boolean} - True si hay conexión
     */
    window.checkConnection = function() {
        return navigator.onLine;
    };
    
    // =============== NOTIFICATION SYSTEM ===============
    
    /**
     * Muestra una notificación
     * @param {string} type - Tipo de notificación (success, error, warning, info)
     * @param {string} message - Mensaje a mostrar
     * @param {string} title - Título de la notificación (opcional)
     */
    window.showNotification = function(type, message, title = '') {
        const container = document.querySelector('.toast-container') || createNotificationContainer();
        const toast = createToastElement(type, message, title);
        
        container.appendChild(toast);
        
        // Auto-remover después de la duración configurada
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, window.APP_CONFIG.notifications.duration);
        
        // Limitar el número de notificaciones visibles
        const visibleToasts = container.querySelectorAll('.toast');
        if (visibleToasts.length > window.APP_CONFIG.notifications.maxVisible) {
            visibleToasts[0].remove();
        }
    };
    
    function createNotificationContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }
    
    function createToastElement(type, message, title) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const titleHtml = title ? `
            <div class="toast-header">
                <span class="toast-title">${title}</span>
                <button class="toast-close">&times;</button>
            </div>
        ` : '';
        
        toast.innerHTML = `
            ${titleHtml}
            <div class="toast-body">${message}</div>
        `;
        
        // Añadir funcionalidad de cierre
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => toast.remove(), 300);
            });
        }
        
        return toast;
    }
    
    // =============== EXPORT FUNCTIONS ===============
    
    /**
     * Exporta datos a CSV
     * @param {Array} data - Datos a exportar
     * @param {string} filename - Nombre del archivo
     */
    window.exportToCSV = function(data, filename = 'export.csv') {
        if (!data || data.length === 0) {
            window.showNotification('warning', 'No hay datos para exportar');
            return;
        }
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(window.APP_CONFIG.export.csv.delimiter),
            ...data.map(row => 
                headers.map(header => 
                    JSON.stringify(row[header] || '')
                ).join(window.APP_CONFIG.export.csv.delimiter)
            )
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.showNotification('success', 'Archivo CSV exportado correctamente');
    };
    
    /**
     * Genera un UUID
     * @returns {string} - UUID generado
     */
    window.generateUUID = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };
    
    /**
     * Formatea una fecha
     * @param {Date|string} date - Fecha a formatear
     * @param {string} format - Formato deseado
     * @returns {string} - Fecha formateada
     */
    window.formatDate = function(date, format = 'dd/MM/yyyy') {
        const d = date instanceof Date ? date : new Date(date);
        
        if (isNaN(d.getTime())) {
            return 'Fecha inválida';
        }
        
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        const seconds = d.getSeconds().toString().padStart(2, '0');
        
        return format
            .replace('dd', day)
            .replace('MM', month)
            .replace('yyyy', year)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    };
    
    // =============== VALIDATION FUNCTIONS ===============
    
    /**
     * Valida un email
     * @param {string} email - Email a validar
     * @returns {boolean} - True si el email es válido
     */
    window.isValidEmail = function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };
    
    /**
     * Valida un teléfono
     * @param {string} phone - Teléfono a validar
     * @returns {boolean} - True si el teléfono es válido
     */
    window.isValidPhone = function(phone) {
        const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
        return phoneRegex.test(phone);
    };
    
    /**
     * Valida una URL
     * @param {string} url - URL a validar
     * @returns {boolean} - True si la URL es válida
     */
    window.isValidURL = function(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };
    
    // =============== INITIALIZATION ===============
    
    /**
     * Inicializa la aplicación
     */
    function initializeApp() {
        // Log de información de desarrollo
        console.log('%c📦 Sistema de Inventario QR', 'color: #3b82f6; font-size: 18px; font-weight: bold;');
        console.log('✅ Configuración cargada correctamente');
        console.log('🌍 Entorno:', window.APP_CONFIG.environment);
        console.log('🔗 API:', window.APP_CONFIG.api.baseUrl);
        console.log('📊 Versión:', window.APP_CONFIG.version);
        
        // Verificar compatibilidad del navegador
        if (!checkBrowserCompatibility()) {
            return;
        }
        
        // Registrar Service Worker para PWA en producción
        if ('serviceWorker' in navigator && window.APP_CONFIG.environment === 'production') {
            window.addEventListener('load', function() {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(function(registration) {
                        console.log('✅ ServiceWorker registrado correctamente:', registration.scope);
                        
                        // Verificar actualizaciones del Service Worker
                        if (registration.waiting) {
                            console.log('🔄 Nueva versión disponible');
                            if (confirm('Hay una nueva versión disponible. ¿Recargar para actualizar?')) {
                                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                                window.location.reload();
                            }
                        }
                    })
                    .catch(function(error) {
                        console.warn('⚠️ Service Worker no registrado:', error);
                    });
            });
        }
        
        // Disparar evento de aplicación cargada
        setTimeout(function() {
            window.dispatchEvent(new CustomEvent('app-loaded'));
        }, 1000);
    }
    
    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        initializeApp();
    }
    
    // =============== GLOBAL ERROR HANDLING ===============
    
    /**
     * Captura errores globales de JavaScript
     */
    window.addEventListener('error', function(e) {
        console.error('❌ Error global capturado:', e.error);
        console.error('📄 Archivo:', e.filename);
        console.error('📍 Línea:', e.lineno, 'Columna:', e.colno);
        
        // Mostrar notificación de error al usuario
        window.showNotification('error', 'Ha ocurrido un error inesperado', 'Error del Sistema');
        
        // En producción, podríamos enviar estos errores a un servicio de monitoreo
        if (window.APP_CONFIG.environment === 'production') {
            // Aquí iría el código para enviar el error a un servicio como Sentry
        }
    });
    
    /**
     * Captura promesas rechazadas no manejadas
     */
    window.addEventListener('unhandledrejection', function(e) {
        console.error('❌ Promesa rechazada no manejada:', e.reason);
        window.showNotification('error', 'Error en operación asíncrona', 'Error del Sistema');
    });
    
    // =============== CONNECTION MANAGEMENT ===============
    
    // Escuchar cambios en la conexión
    window.addEventListener('online', function() {
        console.log('✅ Conexión restablecida');
        window.showNotification('success', 'Conexión a internet restablecida', 'Conexión');
        
        // Sincronizar datos pendientes
        window.dispatchEvent(new CustomEvent('connection-restored'));
    });
    
    window.addEventListener('offline', function() {
        console.warn('⚠️ Conexión perdida');
        window.showNotification('warning', 'Modo offline activado. Algunas funciones pueden no estar disponibles.', 'Sin Conexión');
        
        // Activar modo offline
        window.dispatchEvent(new CustomEvent('connection-lost'));
    });
    
    // =============== UNSAVED CHANGES PROTECTION ===============
    
    /**
     * Evento para prevenir cierre de página con cambios sin guardar
     */
    window.addEventListener('beforeunload', function(e) {
        if (window.hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = 'Tienes cambios sin guardar. ¿Seguro que quieres salir?';
            return e.returnValue;
        }
    });
    
})();