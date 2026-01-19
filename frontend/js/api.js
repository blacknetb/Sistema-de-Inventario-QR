/**
 * Funciones para llamadas a la API
 */

// Cliente HTTP genérico
class ApiClient {
    constructor() {
        this.baseUrl = API_CONFIG.BASE_URL;
    }
    
    // Método genérico para peticiones
    async request(endpoint, options = {}) {
        const url = buildApiUrl(endpoint);
        
        // Configurar headers por defecto
        const defaultHeaders = {
            'Content-Type': 'application/json',
            ...authHeader()
        };
        
        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(url, config);
            
            // Si el token expiró, intentar refrescarlo
            if (response.status === 401 && !endpoint.includes('auth/refresh')) {
                const refreshResult = await refreshToken();
                if (refreshResult.success) {
                    // Reintentar la petición con el nuevo token
                    config.headers.Authorization = `Bearer ${refreshResult.token}`;
                    const retryResponse = await fetch(url, config);
                    return await this.handleResponse(retryResponse);
                } else {
                    // Si no se puede refrescar, redirigir al login
                    clearAuthData();
                    window.location.href = 'index.html';
                    throw new Error('Sesión expirada');
                }
            }
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error en petición API:', error);
            throw error;
        }
    }
    
    async handleResponse(response) {
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }
        
        if (!response.ok) {
            throw {
                status: response.status,
                statusText: response.statusText,
                message: data.message || 'Error en la petición',
                data
            };
        }
        
        return data;
    }
    
    // Métodos HTTP
    async get(endpoint, params = {}) {
        const queryString = buildQueryString(params);
        return await this.request(`${endpoint}${queryString}`);
    }
    
    async post(endpoint, data = {}) {
        return await this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    async put(endpoint, data = {}) {
        return await this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    async patch(endpoint, data = {}) {
        return await this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }
    
    async delete(endpoint) {
        return await this.request(endpoint, {
            method: 'DELETE'
        });
    }
}

// Instancia global del cliente API
const api = new ApiClient();

// Funciones específicas para cada recurso

// ===== USUARIOS =====
async function getUsers(params = {}) {
    return await api.get(API_CONFIG.ENDPOINTS.USERS.BASE, params);
}

async function getUser(id) {
    return await api.get(`${API_CONFIG.ENDPOINTS.USERS.BASE}/${id}`);
}

async function createUser(userData) {
    return await api.post(API_CONFIG.ENDPOINTS.USERS.BASE, userData);
}

async function updateUser(id, userData) {
    return await api.put(`${API_CONFIG.ENDPOINTS.USERS.BASE}/${id}`, userData);
}

async function deleteUser(id) {
    return await api.delete(`${API_CONFIG.ENDPOINTS.USERS.BASE}/${id}`);
}

async function getProfile() {
    return await api.get(API_CONFIG.ENDPOINTS.USERS.PROFILE);
}

async function updateProfile(profileData) {
    return await api.put(API_CONFIG.ENDPOINTS.USERS.PROFILE, profileData);
}

// ===== PRODUCTOS =====
async function getProducts(params = {}) {
    return await api.get(API_CONFIG.ENDPOINTS.PRODUCTS.BASE, params);
}

async function getProduct(id) {
    return await api.get(`${API_CONFIG.ENDPOINTS.PRODUCTS.BASE}/${id}`);
}

async function createProduct(productData) {
    return await api.post(API_CONFIG.ENDPOINTS.PRODUCTS.BASE, productData);
}

async function updateProduct(id, productData) {
    return await api.put(`${API_CONFIG.ENDPOINTS.PRODUCTS.BASE}/${id}`, productData);
}

async function deleteProduct(id) {
    return await api.delete(`${API_CONFIG.ENDPOINTS.PRODUCTS.BASE}/${id}`);
}

async function searchProducts(query, params = {}) {
    return await api.get(API_CONFIG.ENDPOINTS.PRODUCTS.SEARCH, { q: query, ...params });
}

async function getProductsByCategory(categoryId, params = {}) {
    return await api.get(`${API_CONFIG.ENDPOINTS.PRODUCTS.BY_CATEGORY}/${categoryId}`, params);
}

async function getProductsByLocation(locationId, params = {}) {
    return await api.get(`${API_CONFIG.ENDPOINTS.PRODUCTS.BY_LOCATION}/${locationId}`, params);
}

async function getLowStockProducts(params = {}) {
    return await api.get(API_CONFIG.ENDPOINTS.PRODUCTS.LOW_STOCK, params);
}

async function generateProductQR(productId, options = {}) {
    return await api.post(`${API_CONFIG.ENDPOINTS.PRODUCTS.GENERATE_QR}/${productId}`, options);
}

async function generateBulkQR(productIds, options = {}) {
    return await api.post(API_CONFIG.ENDPOINTS.PRODUCTS.BULK_QR, { productIds, ...options });
}

// ===== CATEGORÍAS =====
async function getCategories(params = {}) {
    return await api.get(API_CONFIG.ENDPOINTS.CATEGORIES.BASE, params);
}

async function getCategory(id) {
    return await api.get(`${API_CONFIG.ENDPOINTS.CATEGORIES.BASE}/${id}`);
}

async function createCategory(categoryData) {
    return await api.post(API_CONFIG.ENDPOINTS.CATEGORIES.BASE, categoryData);
}

async function updateCategory(id, categoryData) {
    return await api.put(`${API_CONFIG.ENDPOINTS.CATEGORIES.BASE}/${id}`, categoryData);
}

async function deleteCategory(id) {
    return await api.delete(`${API_CONFIG.ENDPOINTS.CATEGORIES.BASE}/${id}`);
}

// ===== UBICACIONES =====
async function getLocations(params = {}) {
    return await api.get(API_CONFIG.ENDPOINTS.LOCATIONS.BASE, params);
}

async function getLocation(id) {
    return await api.get(`${API_CONFIG.ENDPOINTS.LOCATIONS.BASE}/${id}`);
}

async function createLocation(locationData) {
    return await api.post(API_CONFIG.ENDPOINTS.LOCATIONS.BASE, locationData);
}

async function updateLocation(id, locationData) {
    return await api.put(`${API_CONFIG.ENDPOINTS.LOCATIONS.BASE}/${id}`, locationData);
}

async function deleteLocation(id) {
    return await api.delete(`${API_CONFIG.ENDPOINTS.LOCATIONS.BASE}/${id}`);
}

// ===== MOVIMIENTOS =====
async function getMovements(params = {}) {
    return await api.get(API_CONFIG.ENDPOINTS.MOVEMENTS.BASE, params);
}

async function getMovement(id) {
    return await api.get(`${API_CONFIG.ENDPOINTS.MOVEMENTS.BASE}/${id}`);
}

async function createMovement(movementData) {
    return await api.post(API_CONFIG.ENDPOINTS.MOVEMENTS.BASE, movementData);
}

async function updateMovement(id, movementData) {
    return await api.put(`${API_CONFIG.ENDPOINTS.MOVEMENTS.BASE}/${id}`, movementData);
}

async function deleteMovement(id) {
    return await api.delete(`${API_CONFIG.ENDPOINTS.MOVEMENTS.BASE}/${id}`);
}

async function getMovementStats(params = {}) {
    return await api.get(API_CONFIG.ENDPOINTS.MOVEMENTS.STATS, params);
}

async function getMovementsByDate(date, params = {}) {
    return await api.get(`${API_CONFIG.ENDPOINTS.MOVEMENTS.BY_DATE}/${date}`, params);
}

// ===== REPORTES =====
async function getInventoryReport(params = {}) {
    return await api.get(API_CONFIG.ENDPOINTS.REPORTS.INVENTORY, params);
}

async function getMovementsReport(params = {}) {
    return await api.get(API_CONFIG.ENDPOINTS.REPORTS.MOVEMENTS, params);
}

async function getLowStockReport(params = {}) {
    return await api.get(API_CONFIG.ENDPOINTS.REPORTS.LOW_STOCK, params);
}

async function getCategoriesReport(params = {}) {
    return await api.get(API_CONFIG.ENDPOINTS.REPORTS.CATEGORIES, params);
}

async function getLocationsReport(params = {}) {
    return await api.get(API_CONFIG.ENDPOINTS.REPORTS.LOCATIONS, params);
}

async function getValuationReport(params = {}) {
    return await api.get(API_CONFIG.ENDPOINTS.REPORTS.VALUATION, params);
}

async function exportReport(type, format, params = {}) {
    return await api.get(`${API_CONFIG.ENDPOINTS.REPORTS.EXPORT}/${type}/${format}`, params);
}

// Exportar todas las funciones
window.api = api;
window.getUsers = getUsers;
window.getUser = getUser;
window.createUser = createUser;
window.updateUser = updateUser;
window.deleteUser = deleteUser;
window.getProfile = getProfile;
window.updateProfile = updateProfile;
window.getProducts = getProducts;
window.getProduct = getProduct;
window.createProduct = createProduct;
window.updateProduct = updateProduct;
window.deleteProduct = deleteProduct;
window.searchProducts = searchProducts;
window.getProductsByCategory = getProductsByCategory;
window.getProductsByLocation = getProductsByLocation;
window.getLowStockProducts = getLowStockProducts;
window.generateProductQR = generateProductQR;
window.generateBulkQR = generateBulkQR;
window.getCategories = getCategories;
window.getCategory = getCategory;
window.createCategory = createCategory;
window.updateCategory = updateCategory;
window.deleteCategory = deleteCategory;
window.getLocations = getLocations;
window.getLocation = getLocation;
window.createLocation = createLocation;
window.updateLocation = updateLocation;
window.deleteLocation = deleteLocation;
window.getMovements = getMovements;
window.getMovement = getMovement;
window.createMovement = createMovement;
window.updateMovement = updateMovement;
window.deleteMovement = deleteMovement;
window.getMovementStats = getMovementStats;
window.getMovementsByDate = getMovementsByDate;
window.getInventoryReport = getInventoryReport;
window.getMovementsReport = getMovementsReport;
window.getLowStockReport = getLowStockReport;
window.getCategoriesReport = getCategoriesReport;
window.getLocationsReport = getLocationsReport;
window.getValuationReport = getValuationReport;
window.exportReport = exportReport;