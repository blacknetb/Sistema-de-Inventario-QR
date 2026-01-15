/**
 * SERVICIO DE CATEGORÍAS
 * Maneja todas las operaciones CRUD para categorías
 * Compatible con backend RESTful API
 */

import axios from 'axios';

// Configuración base de axios
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Instancia de axios con configuración común
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000 // 10 segundos
});

// Interceptor para manejar errores globalmente
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      console.error('Error de servidor:', error.response.data);
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // La solicitud fue hecha pero no se recibió respuesta
      console.error('Error de red:', error.message);
      return Promise.reject(new Error('Error de conexión con el servidor'));
    } else {
      // Algo sucedió al configurar la solicitud
      console.error('Error:', error.message);
      return Promise.reject(error);
    }
  }
);

/**
 * Servicio de Categorías
 */
const categoryService = {
  /**
   * Obtiene todas las categorías con filtros opcionales
   * @param {Object} params - Parámetros de filtrado
   * @param {number} params.page - Página actual
   * @param {number} params.limit - Elementos por página
   * @param {string} params.search - Término de búsqueda
   * @param {string} params.sort - Campo para ordenar
   * @param {string} params.order - Orden (asc/desc)
   * @param {AbortSignal} signal - Señal para cancelar la solicitud
   * @returns {Promise} Promesa con las categorías
   */
  getAll: async (params = {}, signal) => {
    try {
      const config = signal ? { params, signal } : { params };
      
      const response = await apiClient.get('/categories', config);
      
      return {
        success: true,
        data: response.data.data || response.data,
        pagination: response.data.pagination || {
          page: params.page || 1,
          limit: params.limit || 10,
          total: response.data.length || 0,
          pages: Math.ceil((response.data.length || 0) / (params.limit || 10))
        }
      };
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      return {
        success: false,
        message: error.message || 'Error al cargar las categorías',
        data: []
      };
    }
  },

  /**
   * Obtiene una categoría por su ID
   * @param {string|number} id - ID de la categoría
   * @returns {Promise} Promesa con la categoría
   */
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/categories/${id}`);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error al obtener categoría ${id}:`, error);
      return {
        success: false,
        message: error.message || 'Error al cargar la categoría'
      };
    }
  },

  /**
   * Crea una nueva categoría
   * @param {Object} categoryData - Datos de la categoría
   * @param {string} categoryData.name - Nombre de la categoría
   * @param {string} categoryData.description - Descripción de la categoría
   * @returns {Promise} Promesa con la categoría creada
   */
  create: async (categoryData) => {
    try {
      // Validación básica del lado del cliente
      if (!categoryData.name || categoryData.name.trim().length < 2) {
        throw new Error('El nombre de la categoría debe tener al menos 2 caracteres');
      }

      const response = await apiClient.post('/categories', categoryData);
      
      return {
        success: true,
        data: response.data,
        message: 'Categoría creada exitosamente'
      };
    } catch (error) {
      console.error('Error al crear categoría:', error);
      return {
        success: false,
        message: error.message || 'Error al crear la categoría'
      };
    }
  },

  /**
   * Actualiza una categoría existente
   * @param {string|number} id - ID de la categoría
   * @param {Object} categoryData - Datos actualizados de la categoría
   * @returns {Promise} Promesa con la categoría actualizada
   */
  update: async (id, categoryData) => {
    try {
      // Validación básica del lado del cliente
      if (categoryData.name && categoryData.name.trim().length < 2) {
        throw new Error('El nombre de la categoría debe tener al menos 2 caracteres');
      }

      const response = await apiClient.put(`/categories/${id}`, categoryData);
      
      return {
        success: true,
        data: response.data,
        message: 'Categoría actualizada exitosamente'
      };
    } catch (error) {
      console.error(`Error al actualizar categoría ${id}:`, error);
      return {
        success: false,
        message: error.message || 'Error al actualizar la categoría'
      };
    }
  },

  /**
   * Elimina una categoría
   * @param {string|number} id - ID de la categoría
   * @returns {Promise} Promesa con el resultado de la eliminación
   */
  delete: async (id) => {
    try {
      await apiClient.delete(`/categories/${id}`);
      
      return {
        success: true,
        message: 'Categoría eliminada exitosamente'
      };
    } catch (error) {
      console.error(`Error al eliminar categoría ${id}:`, error);
      
      // Manejo específico de errores comunes
      let message = 'Error al eliminar la categoría';
      if (error.status === 409) {
        message = 'No se puede eliminar la categoría porque tiene productos asociados';
      } else if (error.status === 404) {
        message = 'La categoría no existe';
      }
      
      return {
        success: false,
        message: error.message || message
      };
    }
  },

  /**
   * Elimina múltiples categorías
   * @param {Array<string|number>} ids - IDs de las categorías a eliminar
   * @returns {Promise} Promesa con el resultado de la eliminación
   */
  deleteMultiple: async (ids) => {
    try {
      const response = await apiClient.post('/categories/bulk-delete', { ids });
      
      return {
        success: true,
        data: response.data,
        message: `${ids.length} categoría(s) eliminada(s) exitosamente`
      };
    } catch (error) {
      console.error('Error al eliminar múltiples categorías:', error);
      return {
        success: false,
        message: error.message || 'Error al eliminar las categorías'
      };
    }
  },

  /**
   * Exporta categorías en formato CSV
   * @param {Object} params - Parámetros de filtrado
   * @returns {Promise} Promesa con los datos exportados
   */
  exportToCSV: async (params = {}) => {
    try {
      const response = await apiClient.get('/categories/export', {
        params,
        responseType: 'blob'
      });
      
      return {
        success: true,
        data: response.data,
        filename: response.headers['content-disposition']?.split('filename=')[1] || 'categorias.csv'
      };
    } catch (error) {
      console.error('Error al exportar categorías:', error);
      return {
        success: false,
        message: error.message || 'Error al exportar las categorías'
      };
    }
  },

  /**
   * Obtiene estadísticas de categorías
   * @returns {Promise} Promesa con las estadísticas
   */
  getStats: async () => {
    try {
      const response = await apiClient.get('/categories/stats');
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return {
        success: false,
        message: error.message || 'Error al cargar estadísticas'
      };
    }
  },

  /**
   * Valida si un nombre de categoría está disponible
   * @param {string} name - Nombre a validar
   * @param {string|number} [excludeId] - ID de categoría a excluir (para edición)
   * @returns {Promise} Promesa con el resultado de la validación
   */
  validateName: async (name, excludeId = null) => {
    try {
      const params = { name };
      if (excludeId) params.excludeId = excludeId;
      
      const response = await apiClient.get('/categories/validate-name', { params });
      
      return {
        success: true,
        data: response.data,
        isValid: response.data.isValid
      };
    } catch (error) {
      console.error('Error al validar nombre:', error);
      return {
        success: false,
        message: error.message || 'Error al validar el nombre'
      };
    }
  },

  /**
   * Obtiene categorías populares (con más productos)
   * @param {number} limit - Límite de resultados
   * @returns {Promise} Promesa con las categorías populares
   */
  getPopular: async (limit = 10) => {
    try {
      const response = await apiClient.get('/categories/popular', {
        params: { limit }
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error al obtener categorías populares:', error);
      return {
        success: false,
        message: error.message || 'Error al cargar categorías populares'
      };
    }
  },

  /**
   * Obtiene categorías sin productos
   * @returns {Promise} Promesa con las categorías sin productos
   */
  getWithoutProducts: async () => {
    try {
      const response = await apiClient.get('/categories/without-products');
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error al obtener categorías sin productos:', error);
      return {
        success: false,
        message: error.message || 'Error al cargar categorías sin productos'
      };
    }
  }
};

// Métodos de utilidad para manejar archivos y exportación
categoryService.downloadCSV = (data, filename = 'categorias.csv') => {
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Configuración global de la API
categoryService.setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

// Configuración de la URL base
categoryService.setBaseURL = (url) => {
  apiClient.defaults.baseURL = url;
};

export default categoryService;