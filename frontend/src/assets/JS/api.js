// ============================================
// API CLIENT - CLIENTE PARA COMUNICACIÓN CON EL BACKEND
// ============================================

class ApiClient {
    constructor() {
        this.baseUrl = AppConfig.API_CONFIG.BASE_URL;
        this.defaultHeaders = AppConfig.API_CONFIG.REQUEST_CONFIG.HEADERS;
        this.timeout = AppConfig.API_CONFIG.REQUEST_CONFIG.TIMEOUT;
        this.retryAttempts = AppConfig.API_CONFIG.REQUEST_CONFIG.RETRY_ATTEMPTS;
        this.retryDelay = AppConfig.API_CONFIG.REQUEST_CONFIG.RETRY_DELAY;
    }
    
    /**
     * Obtiene el token de autenticación
     * @returns {string|null} - Token o null
     */
    getAuthToken() {
        return Utils.Storage.get(AppConfig.AUTH_CONFIG.TOKEN_KEY);
    }
    
    /**
     * Establece el token de autenticación
     * @param {string} token - Token JWT
     */
    setAuthToken(token) {
        Utils.Storage.set(
            AppConfig.AUTH_CONFIG.TOKEN_KEY,
            token,
            AppConfig.AUTH_CONFIG.TOKEN_EXPIRY
        );
    }
    
    /**
     * Elimina el token de autenticación
     */
    clearAuthToken() {
        Utils.Storage.remove(AppConfig.AUTH_CONFIG.TOKEN_KEY);
        Utils.Storage.remove(AppConfig.AUTH_CONFIG.REFRESH_TOKEN_KEY);
        Utils.Storage.remove(AppConfig.AUTH_CONFIG.USER_KEY);
    }
    
    /**
     * Verifica si el usuario está autenticado
     * @returns {boolean} - True si está autenticado
     */
    isAuthenticated() {
        return !!this.getAuthToken();
    }
    
    /**
     * Obtiene los headers de autenticación
     * @returns {Object} - Headers
     */
    getAuthHeaders() {
        const headers = { ...this.defaultHeaders };
        const token = this.getAuthToken();
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }
    
    /**
     * Realiza una petición HTTP con reintentos
     * @param {string} endpoint - Endpoint de la API
     * @param {Object} options - Opciones de fetch
     * @param {number} attempt - Intento actual
     * @returns {Promise<Object>} - Respuesta de la API
     */
    async request(endpoint, options = {}, attempt = 1) {
        const url = `${this.baseUrl}${endpoint}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        const defaultOptions = {
            headers: this.getAuthHeaders(),
            signal: controller.signal
        };
        
        const requestOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(url, requestOptions);
            clearTimeout(timeoutId);
            
            // Manejar respuesta
            if (!response.ok) {
                throw await this.handleError(response, endpoint);
            }
            
            // Procesar respuesta
            return await this.handleResponse(response, endpoint);
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            // Reintentar si es posible
            if (attempt < this.retryAttempts && this.shouldRetry(error)) {
                await this.delay(this.retryDelay);
                return this.request(endpoint, options, attempt + 1);
            }
            
            // Manejar error final
            throw this.handleRequestError(error, endpoint);
        }
    }
    
    /**
     * Realiza una petición GET
     * @param {string} endpoint - Endpoint de la API
     * @param {Object} params - Parámetros de consulta
     * @returns {Promise<Object>} - Respuesta de la API
     */
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        
        return this.request(url, {
            method: 'GET'
        });
    }
    
    /**
     * Realiza una petición POST
     * @param {string} endpoint - Endpoint de la API
     * @param {Object} data - Datos a enviar
     * @returns {Promise<Object>} - Respuesta de la API
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    /**
     * Realiza una petición PUT
     * @param {string} endpoint - Endpoint de la API
     * @param {Object} data - Datos a enviar
     * @returns {Promise<Object>} - Respuesta de la API
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    /**
     * Realiza una petición PATCH
     * @param {string} endpoint - Endpoint de la API
     * @param {Object} data - Datos a enviar
     * @returns {Promise<Object>} - Respuesta de la API
     */
    async patch(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }
    
    /**
     * Realiza una petición DELETE
     * @param {string} endpoint - Endpoint de la API
     * @returns {Promise<Object>} - Respuesta de la API
     */
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
    
    /**
     * Sube un archivo
     * @param {string} endpoint - Endpoint de subida
     * @param {File} file - Archivo a subir
     * @param {Object} additionalData - Datos adicionales
     * @returns {Promise<Object>} - Respuesta de la API
     */
    async uploadFile(endpoint, file, additionalData = {}) {
        const formData = new FormData();
        formData.append('file', file);
        
        // Agregar datos adicionales
        Object.entries(additionalData).forEach(([key, value]) => {
            formData.append(key, value);
        });
        
        return this.request(endpoint, {
            method: 'POST',
            body: formData,
            headers: {
                // No establecer Content-Type para FormData
            }
        });
    }
    
    /**
     * Maneja errores de la API
     * @param {Response} response - Respuesta HTTP
     * @param {string} endpoint - Endpoint de la petición
     * @returns {Promise<Error>} - Error procesado
     */
    async handleError(response, endpoint) {
        let errorData;
        
        try {
            errorData = await response.json();
        } catch {
            errorData = {
                message: 'Error desconocido',
                code: 'UNKNOWN_ERROR'
            };
        }
        
        // Manejar errores específicos de autenticación
        if (response.status === 401) {
            await this.handleUnauthorizedError();
        }
        
        // Manejar errores específicos de permisos
        if (response.status === 403) {
            this.handleForbiddenError(errorData);
        }
        
        // Crear error personalizado
        return Utils.ErrorUtils.create(
            errorData.message || `Error ${response.status}: ${response.statusText}`,
            errorData.code || `HTTP_${response.status}`,
            {
                status: response.status,
                statusText: response.statusText,
                endpoint: endpoint,
                ...errorData
            }
        );
    }
    
    /**
     * Maneja respuesta exitosa
     * @param {Response} response - Respuesta HTTP
     * @param {string} endpoint - Endpoint de la petición
     * @returns {Promise<Object>} - Datos procesados
     */
    async handleResponse(response, endpoint) {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        
        if (contentType && contentType.includes('text/')) {
            return await response.text();
        }
        
        if (contentType && contentType.includes('application/pdf')) {
            return await response.blob();
        }
        
        // Para otros tipos de contenido, devolver la respuesta
        return response;
    }
    
    /**
     * Maneja errores de petición
     * @param {Error} error - Error de petición
     * @param {string} endpoint - Endpoint de la petición
     * @returns {Error} - Error procesado
     */
    handleRequestError(error, endpoint) {
        if (error.name === 'AbortError') {
            return Utils.ErrorUtils.create(
                'La petición ha excedido el tiempo de espera',
                'TIMEOUT_ERROR',
                { endpoint }
            );
        }
        
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            return Utils.ErrorUtils.create(
                'Error de conexión. Por favor, verifica tu conexión a internet',
                'NETWORK_ERROR',
                { endpoint }
            );
        }
        
        return error;
    }
    
    /**
     * Maneja error de autorización
     * @returns {Promise<void>}
     */
    async handleUnauthorizedError() {
        // Intentar refrescar el token
        try {
            await this.refreshToken();
        } catch (refreshError) {
            // Si no se puede refrescar, cerrar sesión
            this.clearAuthToken();
            
            // Redirigir a login si no estamos ya ahí
            if (!window.location.pathname.includes('/login')) {
                window.location.href = AppConfig.ROUTES.PUBLIC.LOGIN;
            }
        }
    }
    
    /**
     * Maneja error de permisos
     * @param {Object} errorData - Datos del error
     */
    handleForbiddenError(errorData) {
        // Mostrar mensaje de permisos insuficientes
        if (window.showNotification) {
            window.showNotification(
                'error',
                errorData.message || 'No tienes permisos para realizar esta acción'
            );
        }
    }
    
    /**
     * Refresca el token de autenticación
     * @returns {Promise<void>}
     */
    async refreshToken() {
        const refreshToken = Utils.Storage.get(AppConfig.AUTH_CONFIG.REFRESH_TOKEN_KEY);
        
        if (!refreshToken) {
            throw new Error('No hay token de refresco disponible');
        }
        
        try {
            const response = await fetch(`${this.baseUrl}${AppConfig.API_CONFIG.ENDPOINTS.AUTH.REFRESH}`, {
                method: 'POST',
                headers: this.defaultHeaders,
                body: JSON.stringify({ refreshToken })
            });
            
            if (!response.ok) {
                throw new Error('Error al refrescar el token');
            }
            
            const data = await response.json();
            
            // Guardar nuevos tokens
            this.setAuthToken(data.accessToken);
            if (data.refreshToken) {
                Utils.Storage.set(
                    AppConfig.AUTH_CONFIG.REFRESH_TOKEN_KEY,
                    data.refreshToken,
                    AppConfig.AUTH_CONFIG.REFRESH_TOKEN_EXPIRY
                );
            }
            
        } catch (error) {
            // Limpiar tokens en caso de error
            this.clearAuthToken();
            throw error;
        }
    }
    
    /**
     * Determina si se debe reintentar una petición
     * @param {Error} error - Error ocurrido
     * @returns {boolean} - True si se debe reintentar
     */
    shouldRetry(error) {
        // Reintentar solo para errores de red o timeout
        return error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT_ERROR';
    }
    
    /**
     * Espera un tiempo determinado
     * @param {number} ms - Milisegundos a esperar
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Instancia singleton del cliente API
window.ApiClient = new ApiClient();

// Servicios específicos de la API
class ApiServices {
    constructor() {
        this.api = window.ApiClient;
    }
    
    // =============== AUTENTICACIÓN ===============
    
    /**
     * Inicia sesión
     * @param {Object} credentials - Credenciales de inicio de sesión
     * @returns {Promise<Object>} - Respuesta de autenticación
     */
    async login(credentials) {
        try {
            const response = await this.api.post(
                AppConfig.API_CONFIG.ENDPOINTS.AUTH.LOGIN,
                credentials
            );
            
            // Guardar tokens
            this.api.setAuthToken(response.accessToken);
            
            if (response.refreshToken) {
                Utils.Storage.set(
                    AppConfig.AUTH_CONFIG.REFRESH_TOKEN_KEY,
                    response.refreshToken,
                    AppConfig.AUTH_CONFIG.REFRESH_TOKEN_EXPIRY
                );
            }
            
            // Guardar información del usuario
            if (response.user) {
                Utils.Storage.set(
                    AppConfig.AUTH_CONFIG.USER_KEY,
                    response.user
                );
            }
            
            return response;
            
        } catch (error) {
            Utils.ErrorUtils.handle(error, 'Error al iniciar sesión');
            throw error;
        }
    }
    
    /**
     * Cierra sesión
     * @returns {Promise<void>}
     */
    async logout() {
        try {
            await this.api.post(AppConfig.API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
        } catch (error) {
            // Continuar incluso si hay error
            console.warn('Error al cerrar sesión:', error);
        } finally {
            // Limpiar tokens locales
            this.api.clearAuthToken();
        }
    }
    
    /**
     * Obtiene el perfil del usuario
     * @returns {Promise<Object>} - Perfil del usuario
     */
    async getProfile() {
        try {
            return await this.api.get(AppConfig.API_CONFIG.ENDPOINTS.AUTH.PROFILE);
        } catch (error) {
            Utils.ErrorUtils.handle(error, 'Error al obtener perfil');
            throw error;
        }
    }
    
    /**
     * Verifica si el usuario está autenticado
     * @returns {boolean} - True si está autenticado
     */
    isAuthenticated() {
        return this.api.isAuthenticated();
    }
    
    /**
     * Obtiene el usuario actual
     * @returns {Object|null} - Usuario actual
     */
    getCurrentUser() {
        return Utils.Storage.get(AppConfig.AUTH_CONFIG.USER_KEY);
    }
    
    /**
     * Verifica si el usuario tiene un permiso específico
     * @param {string} permission - Permiso a verificar
     * @returns {boolean} - True si tiene el permiso
     */
    hasPermission(permission) {
        const user = this.getCurrentUser();
        if (!user || !user.permissions) return false;
        
        return user.permissions.includes(permission) || 
               user.role === AppConfig.AUTH_CONFIG.ROLES.ADMIN;
    }
    
    /**
     * Verifica si el usuario tiene un rol específico
     * @param {string} role - Rol a verificar
     * @returns {boolean} - True si tiene el rol
     */
    hasRole(role) {
        const user = this.getCurrentUser();
        if (!user) return false;
        
        return user.role === role;
    }
    
    // =============== PRODUCTOS ===============
    
    /**
     * Obtiene la lista de productos
     * @param {Object} filters - Filtros de búsqueda
     * @param {Object} pagination - Configuración de paginación
     * @returns {Promise<Object>} - Lista de productos
     */
    async getProducts(filters = {}, pagination = {}) {
        try {
            const params = {
                ...filters,
                page: pagination.page || AppConfig.PAGINATION_CONFIG.DEFAULT_PAGE,
                limit: pagination.limit || AppConfig.PAGINATION_CONFIG.DEFAULT_LIMIT
            };
            
            return await this.api.get(
                AppConfig.API_CONFIG.ENDPOINTS.PRODUCTS.BASE,
                params
            );
            
        } catch (error) {
            Utils.ErrorUtils.handle(error, 'Error al obtener productos');
            throw error;
        }
    }
    
    /**
     * Obtiene un producto por ID
     * @param {string|number} id - ID del producto
     * @returns {Promise<Object>} - Producto
     */
    async getProductById(id) {
        try {
            return await this.api.get(
                `${AppConfig.API_CONFIG.ENDPOINTS.PRODUCTS.BASE}/${id}`
            );
        } catch (error) {
            Utils.ErrorUtils.handle(error, `Error al obtener producto ${id}`);
            throw error;
        }
    }
    
    /**
     * Crea un nuevo producto
     * @param {Object} productData - Datos del producto
     * @returns {Promise<Object>} - Producto creado
     */
    async createProduct(productData) {
        try {
            return await this.api.post(
                AppConfig.API_CONFIG.ENDPOINTS.PRODUCTS.BASE,
                productData
            );
        } catch (error) {
            Utils.ErrorUtils.handle(error, 'Error al crear producto');
            throw error;
        }
    }
    
    /**
     * Actualiza un producto
     * @param {string|number} id - ID del producto
     * @param {Object} productData - Datos actualizados
     * @returns {Promise<Object>} - Producto actualizado
     */
    async updateProduct(id, productData) {
        try {
            return await this.api.put(
                `${AppConfig.API_CONFIG.ENDPOINTS.PRODUCTS.BASE}/${id}`,
                productData
            );
        } catch (error) {
            Utils.ErrorUtils.handle(error, `Error al actualizar producto ${id}`);
            throw error;
        }
    }
    
    /**
     * Elimina un producto
     * @param {string|number} id - ID del producto
     * @returns {Promise<Object>} - Respuesta de eliminación
     */
    async deleteProduct(id) {
        try {
            return await this.api.delete(
                `${AppConfig.API_CONFIG.ENDPOINTS.PRODUCTS.BASE}/${id}`
            );
        } catch (error) {
            Utils.ErrorUtils.handle(error, `Error al eliminar producto ${id}`);
            throw error;
        }
    }
    
    /**
     * Importa productos desde un archivo
     * @param {File} file - Archivo a importar
     * @returns {Promise<Object>} - Resultado de importación
     */
    async importProducts(file) {
        try {
            return await this.api.uploadFile(
                AppConfig.API_CONFIG.ENDPOINTS.PRODUCTS.IMPORT,
                file
            );
        } catch (error) {
            Utils.ErrorUtils.handle(error, 'Error al importar productos');
            throw error;
        }
    }
    
    /**
     * Exporta productos a un archivo
     * @param {Object} filters - Filtros de exportación
     * @param {string} format - Formato de exportación
     * @returns {Promise<Blob>} - Archivo exportado
     */
    async exportProducts(filters = {}, format = 'csv') {
        try {
            const params = { ...filters, format };
            const response = await this.api.get(
                AppConfig.API_CONFIG.ENDPOINTS.PRODUCTS.EXPORT,
                params
            );
            
            return response;
        } catch (error) {
            Utils.ErrorUtils.handle(error, 'Error al exportar productos');
            throw error;
        }
    }
    
    // =============== INVENTARIO ===============
    
    /**
     * Obtiene el inventario
     * @param {Object} filters - Filtros de búsqueda
     * @param {Object} pagination - Configuración de paginación
     * @returns {Promise<Object>} - Inventario
     */
    async getInventory(filters = {}, pagination = {}) {
        try {
            const params = {
                ...filters,
                page: pagination.page || AppConfig.PAGINATION_CONFIG.DEFAULT_PAGE,
                limit: pagination.limit || AppConfig.PAGINATION_CONFIG.DEFAULT_LIMIT
            };
            
            return await this.api.get(
                AppConfig.API_CONFIG.ENDPOINTS.INVENTORY.BASE,
                params
            );
        } catch (error) {
            Utils.ErrorUtils.handle(error, 'Error al obtener inventario');
            throw error;
        }
    }
    
    /**
     * Actualiza el stock de un producto
     * @param {string|number} productId - ID del producto
     * @param {Object} stockData - Datos de stock
     * @returns {Promise<Object>} - Stock actualizado
     */
    async updateStock(productId, stockData) {
        try {
            return await this.api.post(
                `${AppConfig.API_CONFIG.ENDPOINTS.INVENTORY.STOCK}/${productId}`,
                stockData
            );
        } catch (error) {
            Utils.ErrorUtils.handle(error, `Error al actualizar stock del producto ${productId}`);
            throw error;
        }
    }
    
    /**
     * Registra un movimiento de inventario
     * @param {Object} movementData - Datos del movimiento
     * @returns {Promise<Object>} - Movimiento registrado
     */
    async registerMovement(movementData) {
        try {
            return await this.api.post(
                AppConfig.API_CONFIG.ENDPOINTS.INVENTORY.MOVEMENTS,
                movementData
            );
        } catch (error) {
            Utils.ErrorUtils.handle(error, 'Error al registrar movimiento');
            throw error;
        }
    }
    
    /**
     * Obtiene los movimientos de inventario
     * @param {Object} filters - Filtros de búsqueda
     * @param {Object} pagination - Configuración de paginación
     * @returns {Promise<Object>} - Movimientos
     */
    async getMovements(filters = {}, pagination = {}) {
        try {
            const params = {
                ...filters,
                page: pagination.page || AppConfig.PAGINATION_CONFIG.DEFAULT_PAGE,
                limit: pagination.limit || AppConfig.PAGINATION_CONFIG.DEFAULT_LIMIT
            };
            
            return await this.api.get(
                AppConfig.API_CONFIG.ENDPOINTS.INVENTORY.MOVEMENTS,
                params
            );
        } catch (error) {
            Utils.ErrorUtils.handle(error, 'Error al obtener movimientos');
            throw error;
        }
    }
    
    // =============== CÓDIGOS QR ===============
    
    /**
     * Genera un código QR
     * @param {Object} qrData - Datos para el QR
     * @returns {Promise<Object>} - Código QR generado
     */
    async generateQR(qrData) {
        try {
            return await this.api.post(
                AppConfig.API_CONFIG.ENDPOINTS.QR.GENERATE,
                qrData
            );
        } catch (error) {
            Utils.ErrorUtils.handle(error, 'Error al generar código QR');
            throw error;
        }
    }
    
    /**
     * Escanea un código QR
     * @param {string} qrCode - Código QR escaneado
     * @returns {Promise<Object>} - Resultado del escaneo
     */
    async scanQR(qrCode) {
        try {
            return await this.api.post(
                AppConfig.API_CONFIG.ENDPOINTS.QR.SCAN,
                { qrCode }
            );
        } catch (error) {
            Utils.ErrorUtils.handle(error, 'Error al escanear código QR');
            throw error;
        }
    }
    
    // =============== REPORTES ===============
    
    /**
     * Obtiene reportes
     * @param {string} type - Tipo de reporte
     * @param {Object} filters - Filtros de reporte
     * @returns {Promise<Object>} - Reporte
     */
    async getReports(type, filters = {}) {
        try {
            const params = { ...filters, type };
            
            return await this.api.get(
                AppConfig.API_CONFIG.ENDPOINTS.REPORTS.BASE,
                params
            );
        } catch (error) {
            Utils.ErrorUtils.handle(error, 'Error al obtener reportes');
            throw error;
        }
    }
    
    // =============== USUARIOS ===============
    
    /**
     * Obtiene la lista de usuarios
     * @param {Object} filters - Filtros de búsqueda
     * @param {Object} pagination - Configuración de paginación
     * @returns {Promise<Object>} - Lista de usuarios
     */
    async getUsers(filters = {}, pagination = {}) {
        try {
            const params = {
                ...filters,
                page: pagination.page || AppConfig.PAGINATION_CONFIG.DEFAULT_PAGE,
                limit: pagination.limit || AppConfig.PAGINATION_CONFIG.DEFAULT_LIMIT
            };
            
            return await this.api.get(
                AppConfig.API_CONFIG.ENDPOINTS.USERS.BASE,
                params
            );
        } catch (error) {
            Utils.ErrorUtils.handle(error, 'Error al obtener usuarios');
            throw error;
        }
    }
    
    /**
     * Crea un nuevo usuario
     * @param {Object} userData - Datos del usuario
     * @returns {Promise<Object>} - Usuario creado
     */
    async createUser(userData) {
        try {
            return await this.api.post(
                AppConfig.API_CONFIG.ENDPOINTS.USERS.BASE,
                userData
            );
        } catch (error) {
            Utils.ErrorUtils.handle(error, 'Error al crear usuario');
            throw error;
        }
    }
    
    /**
     * Actualiza un usuario
     * @param {string|number} id - ID del usuario
     * @param {Object} userData - Datos actualizados
     * @returns {Promise<Object>} - Usuario actualizado
     */
    async updateUser(id, userData) {
        try {
            return await this.api.put(
                `${AppConfig.API_CONFIG.ENDPOINTS.USERS.BASE}/${id}`,
                userData
            );
        } catch (error) {
            Utils.ErrorUtils.handle(error, `Error al actualizar usuario ${id}`);
            throw error;
        }
    }
    
    /**
     * Elimina un usuario
     * @param {string|number} id - ID del usuario
     * @returns {Promise<Object>} - Respuesta de eliminación
     */
    async deleteUser(id) {
        try {
            return await this.api.delete(
                `${AppConfig.API_CONFIG.ENDPOINTS.USERS.BASE}/${id}`
            );
        } catch (error) {
            Utils.ErrorUtils.handle(error, `Error al eliminar usuario ${id}`);
            throw error;
        }
    }
    
    // =============== CONFIGURACIÓN ===============
    
    /**
     * Obtiene la configuración
     * @returns {Promise<Object>} - Configuración
     */
    async getSettings() {
        try {
            return await this.api.get(
                AppConfig.API_CONFIG.ENDPOINTS.SETTINGS.BASE
            );
        } catch (error) {
            Utils.ErrorUtils.handle(error, 'Error al obtener configuración');
            throw error;
        }
    }
    
    /**
     * Actualiza la configuración
     * @param {Object} settingsData - Datos de configuración
     * @returns {Promise<Object>} - Configuración actualizada
     */
    async updateSettings(settingsData) {
        try {
            return await this.api.put(
                AppConfig.API_CONFIG.ENDPOINTS.SETTINGS.BASE,
                settingsData
            );
        } catch (error) {
            Utils.ErrorUtils.handle(error, 'Error al actualizar configuración');
            throw error;
        }
    }
    
    // =============== CACHE ===============
    
    /**
     * Obtiene datos de caché
     * @param {string} key - Clave de caché
     * @returns {Promise<Object|null>} - Datos de caché
     */
    async getCachedData(key) {
        try {
            const cached = Utils.Storage.get(key);
            
            if (cached) {
                console.log(`📦 Cache hit: ${key}`);
                return cached;
            }
            
            console.log(`🔄 Cache miss: ${key}`);
            return null;
            
        } catch (error) {
            console.warn(`⚠️ Error al obtener caché ${key}:`, error);
            return null;
        }
    }
    
    /**
     * Almacena datos en caché
     * @param {string} key - Clave de caché
     * @param {Object} data - Datos a almacenar
     * @param {number} ttl - Tiempo de vida en milisegundos
     * @returns {boolean} - True si se almacenó correctamente
     */
    async setCachedData(key, data, ttl = null) {
        try {
            const defaultTTL = AppConfig.STORAGE_CONFIG.TTL[key] || 5 * 60 * 1000;
            return Utils.Storage.set(key, data, ttl || defaultTTL);
        } catch (error) {
            console.warn(`⚠️ Error al almacenar en caché ${key}:`, error);
            return false;
        }
    }
    
    /**
     * Limpia la caché
     * @param {string} key - Clave específica (opcional)
     * @returns {boolean} - True si se limpió correctamente
     */
    async clearCache(key = null) {
        try {
            if (key) {
                return Utils.Storage.remove(key);
            } else {
                // Limpiar todas las claves de caché
                Object.values(AppConfig.STORAGE_CONFIG.KEYS).forEach(cacheKey => {
                    Utils.Storage.remove(cacheKey);
                });
                return true;
            }
        } catch (error) {
            console.warn('⚠️ Error al limpiar caché:', error);
            return false;
        }
    }
}

// Instancia singleton de los servicios API
window.Api = new ApiServices();

// Log de carga
if (AppConfig.ENVIRONMENT.DEBUG) {
    console.log('✅ API Client cargado correctamente');
    console.log('🔗 Base URL:', AppConfig.API_CONFIG.BASE_URL);
    console.log('🔐 Autenticado:', window.Api.isAuthenticated());
}