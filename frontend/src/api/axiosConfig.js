/**
 * Configuración centralizada de Axios para Inventory QR System
 * Utiliza las variables de entorno para configurar las peticiones HTTP
 */

import axios from 'axios';

// Obtener configuración del entorno
const API_PREFIX = process.env.API_PREFIX || '/api/v1';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';
const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT) || 30000;

// Crear instancia de axios con configuración base
const axiosInstance = axios.create({
    baseURL: `${FRONTEND_URL}${API_PREFIX}`,
    timeout: REQUEST_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Interceptor para agregar token de autenticación
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Logging en desarrollo
        if (process.env.NODE_ENV === 'development') {
            console.log(`📤 ${config.method.toUpperCase()} ${config.baseURL}${config.url}`, config);
        }
        
        return config;
    },
    (error) => {
        console.error('❌ Error en la petición:', error);
        return Promise.reject(error);
    }
);

// Interceptor para manejar respuestas y errores
axiosInstance.interceptors.response.use(
    (response) => {
        // Logging en desarrollo
        if (process.env.NODE_ENV === 'development') {
            console.log(`📥 ${response.status} ${response.config.url}`, response.data);
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        // Manejar errores de autenticación (401)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                // Intentar refrescar el token
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const response = await axios.post(`${FRONTEND_URL}${API_PREFIX}/auth/refresh`, {
                        refreshToken
                    });
                    
                    if (response.data.accessToken) {
                        localStorage.setItem('accessToken', response.data.accessToken);
                        originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
                        return axiosInstance(originalRequest);
                    }
                }
            } catch (refreshError) {
                // Si falla el refresh, redirigir al login
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        
        // Manejar errores de red
        if (!error.response) {
            console.error('🌐 Error de red:', error.message);
            return Promise.reject({
                success: false,
                message: 'Error de conexión. Verifique su red.',
                error: error.message
            });
        }
        
        // Logging de errores
        console.error('❌ Error en respuesta:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        
        return Promise.reject(error.response?.data || error);
    }
);

export default axiosInstance;