import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Edit2, Trash2, Package,
  DollarSign, BarChart3, TrendingUp,
  Calendar, Tag, AlertTriangle, CheckCircle,
  ShoppingCart, Truck, RefreshCw,
  Star, StarHalf, Share2,
  Printer, ChevronLeft, ChevronRight, Maximize2,
  Percent, Barcode, MapPin, Award,
  Minus
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import PropTypes from 'prop-types';

// ✅ MEJORA: Constantes para configuración de API
const API_CONFIG = {
  BASE_URL: globalThis.APP_CONFIG?.apiUrl || 'http://localhost:3000/api',
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
  getAuthHeader: () => ({
    'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  })
};

// ✅ MEJORA: Custom Hook para manejo de producto con mejor manejo de errores
const useProduct = (id) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchProduct = useCallback(async (forceRefresh = false) => {
    // ✅ MEJORA: Prevenir múltiples llamadas simultáneas
    if (loading && !forceRefresh) return;

    try {
      if (!forceRefresh) setLoading(true);
      setIsRefreshing(forceRefresh);

      // ✅ MEJORA: Intentar obtener del cache primero (solo si no es refresh forzado)
      const cacheKey = `product_${id}`;
      const cachedData = localStorage.getItem(cacheKey);

      if (!forceRefresh && cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        // Usar cache si tiene menos del tiempo configurado
        if (Date.now() - timestamp < API_CONFIG.CACHE_DURATION) {
          setProduct(data);
          setImages(data.images || []);
          setError(null);
          return;
        }
      }

      // ✅ MEJORA: Llamada a la API con manejo de timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_CONFIG.BASE_URL}/products/${id}`, {
        headers: API_CONFIG.getAuthHeader(),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Producto no encontrado');
        } else if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        } else {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
      }

      const data = await response.json();

      // ✅ MEJORA: Validar datos recibidos
      if (!data || typeof data !== 'object') {
        throw new TypeError('Datos del producto inválidos');
      }

      setProduct(data);
      setImages(data.images || []);
      setError(null);

      // ✅ MEJORA: Guardar en cache con validación
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      } catch (cacheError) {
        console.warn('Error al guardar en cache:', cacheError);
      }

    } catch (err) {
      // ✅ MEJORA: Manejo específico de errores
      const errorMessage = err.name === 'AbortError'
        ? 'Tiempo de espera agotado. Verifica tu conexión.'
        : err.message || 'Error al cargar el producto';

      setError(errorMessage);
      toast.error(errorMessage);

      // ✅ MEJORA: Limpiar cache si hay error
      if (err.message.includes('no encontrado') || err.message.includes('404')) {
        localStorage.removeItem(`product_${id}`);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [id, loading]);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }

    // ✅ MEJORA: Cleanup function
    return () => {
      setProduct(null);
      setError(null);
    };
  }, [fetchProduct, id]);

  const deleteProduct = useCallback(async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/products/${id}`, {
        method: 'DELETE',
        headers: API_CONFIG.getAuthHeader()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al eliminar');
      }

      // ✅ MEJORA: Eliminar del cache
      try {
        localStorage.removeItem(`product_${id}`);
      } catch (cacheError) {
        console.warn('Error al limpiar cache:', cacheError);
      }

      toast.success('Producto eliminado correctamente');
      return true;
    } catch (err) {
      console.error('Error al eliminar producto:', err);
      toast.error(err.message || 'Error al eliminar el producto');
      return false;
    }
  }, [id]);

  const updateStock = useCallback(async (quantity, reason, notes = '') => {
    try {
      // ✅ MEJORA: Validación de cantidad
      if (typeof quantity !== 'number' || Number.isNaN(quantity)) {
        throw new TypeError('Cantidad inválida');
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/products/${id}/stock`, {
        method: 'PATCH',
        headers: API_CONFIG.getAuthHeader(),
        body: JSON.stringify({
          quantity,
          reason,
          notes,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al actualizar stock');
      }

      const updatedStock = await response.json();

      // ✅ MEJORA: Actualizar estado optimista
      setProduct(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          stock: updatedStock.stock,
          lastUpdated: new Date().toISOString()
        };
      });

      // ✅ MEJORA: Invalidar cache
      fetchProduct(true);

      toast.success('Stock actualizado correctamente');
      return updatedStock;
    } catch (err) {
      console.error('Error al actualizar stock:', err);
      toast.error(err.message || 'Error al actualizar stock');
      throw err;
    }
  }, [id, fetchProduct]);

  const refreshProduct = useCallback(() => {
    fetchProduct(true);
  }, [fetchProduct]);

  return {
    product,
    loading: loading && !isRefreshing,
    refreshing: isRefreshing,
    error,
    images,
    currentImageIndex,
    setCurrentImageIndex,
    fetchProduct: refreshProduct,
    deleteProduct,
    updateStock
  };
};

// ✅ MEJORA: Componente de Galería de Imágenes con PropTypes corregido
const ProductGallery = ({ images, currentIndex, onImageChange, onZoom }) => {
  const [zoomed, setZoomed] = useState(false);
  const [loadedImages, setLoadedImages] = useState({});

  const handleNext = useCallback(() => {
    onImageChange((currentIndex + 1) % images.length);
  }, [currentIndex, images, onImageChange]);

  const handlePrev = useCallback(() => {
    onImageChange((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, images, onImageChange]);

  const handleZoom = useCallback(() => {
    const newZoomed = !zoomed;
    setZoomed(newZoomed);
    onZoom?.(newZoomed);
  }, [zoomed, onZoom]);

  const handleImageLoad = useCallback((index) => {
    setLoadedImages(prev => ({ ...prev, [index]: true }));
  }, []);

  const handleImageClick = useCallback((e) => {
    e.preventDefault();
    handleZoom();
  }, [handleZoom]);

  if (!images || !Array.isArray(images) || images.length === 0) {
    return (
      <div className="aspect-square bg-linear-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
        <Package className="w-16 h-16 text-gray-400" />
        <span className="sr-only">Sin imagen disponible</span>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  return (
    <div className="relative group">
      <div
        className={`aspect-square rounded-lg overflow-hidden ${zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'} transition-all duration-300`}
      >
        <button
          onClick={handleImageClick}
          className="w-full h-full border-0 p-0 bg-transparent cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label={zoomed ? "Reducir imagen" : "Ampliar imagen"}
          type="button"
        >
          <img
            src={currentImage}
            alt={`Producto - Imagen ${currentIndex + 1} de ${images.length}`}
            className={`w-full h-full object-cover transition-transform duration-300 ${zoomed ? 'scale-110' : 'group-hover:scale-105'
              } ${loadedImages[currentIndex] ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
            decoding="async"
            onLoad={() => handleImageLoad(currentIndex)}
            onError={(e) => {
              console.error('Error loading image:', currentImage);
              e.target.style.display = 'none';
            }}
          />
        </button>

        {/* ✅ MEJORA: Placeholder mientras carga */}
        {!loadedImages[currentIndex] && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="animate-pulse">
              <Package className="w-12 h-12 text-gray-300" />
            </div>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/90 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10"
            aria-label="Imagen anterior"
            type="button"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/90 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10"
            aria-label="Siguiente imagen"
            type="button"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {images.map((_, index) => (
            <button
              key={`image-dot-${images[index]}-${index}`}
              onClick={() => onImageChange(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${index === currentIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/70'
                }`}
              aria-label={`Ir a imagen ${index + 1}`}
              aria-current={index === currentIndex ? 'true' : 'false'}
              type="button"
            />
          ))}
        </div>
      )}

      <button
        onClick={handleZoom}
        className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10"
        aria-label={zoomed ? "Reducir imagen" : "Ampliar imagen"}
        type="button"
      >
        <Maximize2 className="w-5 h-5" />
      </button>
    </div>
  );
};

ProductGallery.propTypes = {
  images: PropTypes.arrayOf(PropTypes.string).isRequired,
  currentIndex: PropTypes.number.isRequired,
  onImageChange: PropTypes.func.isRequired,
  onZoom: PropTypes.func
};

// ✅ MEJORA: Componente de Estadísticas de Stock con PropTypes mejorado
const StockStats = ({ product }) => {
  const getStockStatus = useMemo(() => {
    if (!product || typeof product !== 'object') return 'unknown';

    const { stock = 0, minStock = 0, maxStock = 1 } = product;

    if (stock <= 0) return 'critical';
    if (stock <= minStock * 0.3) return 'critical';
    if (stock <= minStock * 0.5) return 'warning';

    const stockPercentage = maxStock > 0 ? (stock / maxStock) * 100 : 0;
    if (stockPercentage >= 80) return 'high';

    return 'normal';
  }, [product]);

  const statusConfig = useMemo(() => ({
    critical: {
      color: 'bg-red-500',
      text: 'Crítico',
      icon: AlertTriangle,
      bgColor: 'bg-red-50',
      textColor: 'text-red-800'
    },
    warning: {
      color: 'bg-yellow-500',
      text: 'Bajo',
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800'
    },
    normal: {
      color: 'bg-green-500',
      text: 'Normal',
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      textColor: 'text-green-800'
    },
    high: {
      color: 'bg-blue-500',
      text: 'Alto',
      icon: TrendingUp,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-800'
    },
    unknown: {
      color: 'bg-gray-500',
      text: 'Desconocido',
      icon: AlertTriangle,
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-800'
    }
  }), []);

  const { color, text, icon: Icon, bgColor, textColor } = statusConfig[getStockStatus] || statusConfig.unknown;

  const stock = product?.stock || 0;
  const maxStock = product?.maxStock || 1;
  const minStock = product?.minStock || 0;
  const progressPercentage = Math.min((stock / maxStock) * 100, 100);

  return (
    <div className="space-y-4">
      <div className={`flex items-center justify-between p-3 ${bgColor} rounded-lg`}>
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${color}`} aria-hidden="true" />
          <span className={`font-medium ${textColor}`}>Estado del stock: {text}</span>
        </div>
        <Icon className={`w-5 h-5 ${textColor}`} aria-hidden="true" />
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Stock actual</span>
          <span className="font-semibold">{stock} unidades</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <progress
            className={`h-2.5 rounded-full ${color} transition-all duration-500 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:rounded-full [&::-moz-progress-bar]:rounded-full`}
            value={stock}
            max={maxStock}
            style={{ width: `${progressPercentage}%` }}
            aria-label={`${stock} unidades de ${maxStock} disponibles`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Mínimo</span>
            <div className="font-medium">{minStock}</div>
          </div>
          <div>
            <span className="text-gray-600">Máximo</span>
            <div className="font-medium">{maxStock}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

StockStats.propTypes = {
  product: PropTypes.shape({
    stock: PropTypes.number,
    minStock: PropTypes.number,
    maxStock: PropTypes.number
  })
};

StockStats.defaultProps = {
  product: null
};

// ✅ MEJORA: Componente de Especificaciones con PropTypes
const ProductSpecifications = ({ specifications }) => {
  const groupedSpecs = useMemo(() => {
    if (!specifications || !Array.isArray(specifications)) return {};

    return specifications.reduce((acc, spec) => {
      if (!spec || typeof spec !== 'object') return acc;

      const category = spec.category || 'general';
      if (!acc[category]) acc[category] = [];

      if (spec.label && spec.value !== undefined) {
        acc[category].push(spec);
      }

      return acc;
    }, {});
  }, [specifications]);

  if (Object.keys(groupedSpecs).length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">No hay especificaciones disponibles</p>
      </div>
    );
  }

  return (
    <section aria-label="Especificaciones del producto">
      <div className="space-y-6">
        {Object.entries(groupedSpecs).map(([category, specs]) => (
          <div key={category}>
            <h4 className="text-lg font-semibold text-gray-900 mb-3 capitalize">
              {category.replaceAll('_', ' ')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {specs.map((spec) => (
                <div
                  key={`spec-${spec.label}-${spec.value}`}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 list-none"
                >
                  <div className="text-sm text-gray-500 font-medium">{spec.label}</div>
                  <div className="font-medium text-gray-900 mt-1">{spec.value}</div>
                  {spec.description && (
                    <div className="text-xs text-gray-500 mt-1">{spec.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

ProductSpecifications.propTypes = {
  specifications: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string,
    value: PropTypes.string,
    description: PropTypes.string,
    category: PropTypes.string
  }))
};

ProductSpecifications.defaultProps = {
  specifications: []
};

// ✅ MEJORA: Componente de Historial con PropTypes
const ProductHistory = ({ history }) => {
  const formatDateTime = useCallback((dateString) => {
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return 'Fecha inválida';

      return date.toLocaleString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Fecha inválida';
    }
  }, []);

  const getActionColor = useCallback((action) => {
    if (!action) return 'bg-gray-100 text-gray-800';

    const actionLower = action.toLowerCase();
    if (actionLower.includes('venta')) return 'bg-green-100 text-green-800';
    if (actionLower.includes('compra')) return 'bg-blue-100 text-blue-800';
    if (actionLower.includes('ajuste')) return 'bg-yellow-100 text-yellow-800';
    if (actionLower.includes('transferencia')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  }, []);

  if (!history || !Array.isArray(history) || history.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">No hay historial disponible</p>
      </div>
    );
  }

  return (
    <section aria-label="Historial del producto">
      <div className="overflow-x-auto">
        <div className="min-w-full inline-block align-middle">
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acción
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notas
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((item) => (
                  <tr
                    key={`history-${item.date}-${item.action}-${item.quantity}`}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {formatDateTime(item.date)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(item.action)}`}>
                        {item.action || 'Sin especificar'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium whitespace-nowrap">
                      <span className={item.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                        {item.quantity > 0 ? `+${item.quantity}` : item.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {item.user || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={item.notes}>
                      {item.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

ProductHistory.propTypes = {
  history: PropTypes.arrayOf(PropTypes.shape({
    date: PropTypes.string,
    action: PropTypes.string,
    quantity: PropTypes.number,
    user: PropTypes.string,
    notes: PropTypes.string
  }))
};

ProductHistory.defaultProps = {
  history: []
};

// ✅ MEJORA: Componente de pestañas reutilizable con PropTypes
const TabButton = ({ tab, isActive, onClick }) => {
  const Icon = tab.icon;

  return (
    <button
      onClick={() => onClick(tab.id)}
      className={`shrink-0 px-4 md:px-6 py-3 text-sm font-medium flex items-center whitespace-nowrap transition-all duration-200 ${isActive
        ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }`}
      aria-selected={isActive}
      role="tab"
      type="button"
    >
      <Icon className="w-4 h-4 mr-2" aria-hidden="true" />
      {tab.label}
    </button>
  );
};

TabButton.propTypes = {
  tab: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired
};

// ✅ MEJORA: Componente de tarjeta de métrica con PropTypes
const MetricCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', text: 'text-blue-600' },
    green: { bg: 'bg-green-50', icon: 'text-green-600', text: 'text-green-600' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', text: 'text-purple-600' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', text: 'text-orange-600' }
  };

  const { bg, icon, text } = colorClasses[color] || colorClasses.blue;

  return (
    <div className="p-4 rounded-lg transition-all duration-300 hover:shadow-md">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 ${bg} rounded-lg`}>
          <Icon className={`w-5 h-5 ${icon}`} aria-hidden="true" />
        </div>
        <span className={`text-sm font-medium ${text}`}>{title}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {subtitle && (
        <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
      )}
    </div>
  );
};

MetricCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.oneOf(['blue', 'green', 'purple', 'orange'])
};

MetricCard.defaultProps = {
  subtitle: '',
  color: 'blue'
};

// ✅ MEJORA: Función simplificada para manejar impresión
const handlePrintDocument = (product, formatCurrency, calculateProfit) => {
  const printContent = document.createElement('div');
  
  printContent.innerHTML = `
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
      .section { margin-bottom: 20px; }
      .label { font-weight: bold; color: #555; }
      .value { margin-left: 10px; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #f4f4f4; }
      .footer { margin-top: 30px; text-align: center; color: #777; font-size: 12px; }
      @media print {
        @page { margin: 0.5in; }
        body { -webkit-print-color-adjust: exact; }
      }
    </style>
    <div class="header">
      <h1>${product?.name || 'Producto'}</h1>
      <p>SKU: ${product?.sku || 'N/A'} | Categoría: ${product?.category || 'N/A'}</p>
      <p>Generado: ${new Date().toLocaleString('es-MX')}</p>
    </div>
    
    <div class="section">
      <h2>Información General</h2>
      <p><span class="label">Descripción:</span> <span class="value">${product?.description || 'N/A'}</span></p>
      <p><span class="label">Marca:</span> <span class="value">${product?.brand || 'N/A'}</span></p>
      <p><span class="label">Ubicación:</span> <span class="value">${product?.location || 'N/A'}</span></p>
    </div>
    
    <div class="section">
      <h2>Stock y Precios</h2>
      <p><span class="label">Stock Actual:</span> <span class="value">${product?.stock || 0} unidades</span></p>
      <p><span class="label">Precio:</span> <span class="value">${formatCurrency(product?.price || 0)}</span></p>
      <p><span class="label">Costo:</span> <span class="value">${formatCurrency(product?.cost || 0)}</span></p>
      <p><span class="label">Margen:</span> <span class="value">${calculateProfit.margin}%</span></p>
    </div>
    
    <div class="footer">
      <p>Sistema de Inventario</p>
      <p>Página 1 de 1</p>
    </div>
  `;

  // Crear ventana para imprimir
  const printWindow = globalThis.open('', '_blank');
  if (printWindow) {
    printWindow.document.write('<html><head><title>Documento para imprimir</title></head><body>');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    
    // Esperar a que cargue el contenido
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      
      // Manejar el cierre después de imprimir
      const handleAfterPrint = () => {
        printWindow.close();
        printWindow.removeEventListener('afterprint', handleAfterPrint);
      };
      
      printWindow.addEventListener('afterprint', handleAfterPrint);
      
      // Fallback: cerrar después de un tiempo
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.close();
        }
      }, 5000);
    };
    
    return true;
  }
  
  return false;
};

// ✅ Componente principal mejorado
const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [quantity, setQuantity] = useState(1);
  const [showStockModal, setShowStockModal] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const {
    product,
    loading,
    refreshing,
    error,
    images,
    currentImageIndex,
    setCurrentImageIndex,
    deleteProduct,
    updateStock
  } = useProduct(id);

  // ✅ MEJORA: Tabs configurables
  const tabs = useMemo(() => [
    { id: 'overview', label: 'Resumen', icon: BarChart3 },
    { id: 'specs', label: 'Especificaciones', icon: Package },
    { id: 'history', label: 'Historial', icon: Calendar },
    { id: 'analytics', label: 'Analíticas', icon: TrendingUp },
    { id: 'supplier', label: 'Proveedor', icon: Truck }
  ], []);

  const handleBack = useCallback(() => {
    navigate('/products', { replace: true });
  }, [navigate]);

  const handleOrder = useCallback(async () => {
    if (!product || quantity <= 0) {
      toast.error('Cantidad inválida');
      return;
    }

    if (quantity > product.stock) {
      toast.error('Stock insuficiente');
      return;
    }

    try {
      await updateStock(-quantity, 'Venta', `Venta de ${quantity} unidades`);
      toast.success(`Orden realizada por ${quantity} unidades`);
      setQuantity(1);
    } catch (error) {
      console.error('Error al realizar orden:', error);
    }
  }, [product, quantity, updateStock]);

  const handleDelete = useCallback(async () => {
    if (!globalThis.confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) {
      return;
    }

    const success = await deleteProduct();
    if (success) {
      navigate('/products', { replace: true });
    }
  }, [deleteProduct, navigate]);

  const formatCurrency = useCallback((amount) => {
    if (typeof amount !== 'number' || Number.isNaN(amount)) {
      return '$0.00';
    }

    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }, []);

  const calculateProfit = useMemo(() => {
    if (!product || typeof product !== 'object') {
      return { margin: 0, total: 0, perUnit: 0 };
    }

    const price = Number(product.price) || 0;
    const cost = Number(product.cost) || 0;
    const totalSold = Number(product.totalSold) || 0;

    if (cost === 0) return { margin: 0, total: 0, perUnit: 0 };

    const margin = ((price - cost) / cost) * 100;
    const perUnit = price - cost;
    const total = perUnit * totalSold;

    return {
      margin: Math.round(margin * 10) / 10,
      perUnit: Math.round(perUnit * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  }, [product]);

  const renderStars = useCallback((rating) => {
    const safeRating = Math.min(Math.max(Number(rating) || 0, 0), 5);
    const stars = [];
    const fullStars = Math.floor(safeRating);
    const hasHalfStar = safeRating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star
          key={`star-full-${i}`}
          className="w-4 h-4 text-yellow-400 fill-current"
          aria-hidden="true"
        />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <StarHalf
          key="star-half"
          className="w-4 h-4 text-yellow-400 fill-current"
          aria-hidden="true"
        />
      );
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star
          key={`star-empty-${i}`}
          className="w-4 h-4 text-gray-300"
          aria-hidden="true"
        />
      );
    }

    return stars;
  }, []);

  const handlePrint = useCallback(async () => {
    setIsPrinting(true);
    
    try {
      const success = handlePrintDocument(product, formatCurrency, calculateProfit);
      
      if (!success) {
        toast.error('No se pudo abrir la ventana de impresión. Verifica los pop-ups.');
      }
    } catch (error) {
      console.error('Error al imprimir:', error);
      toast.error('Error al generar el documento para imprimir');
    } finally {
      setIsPrinting(false);
    }
  }, [product, formatCurrency, calculateProfit]);

  // ✅ MEJORA: Loading state mejorado
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <Package className="w-8 h-8 text-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-4 text-gray-600 font-medium">Cargando información del producto...</p>
          <p className="text-sm text-gray-500 mt-2">Por favor espera</p>
        </div>
      </div>
    );
  }

  // ✅ MEJORA: Error state mejorado
  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="text-center max-w-md">
          <div className="p-4 bg-red-100 rounded-full inline-flex mb-4">
            <Package className="w-16 h-16 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Producto no encontrado</h2>
          <p className="text-gray-600 mb-6">
            {error || 'El producto que buscas no existe o no tienes permiso para verlo.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleBack}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              Volver a productos
            </button>
            <button
              onClick={() => globalThis.location.reload()}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
        {/* ✅ MEJORA: Header mejorado con indicador de carga */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 md:p-6 rounded-xl shadow-sm">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Volver a la lista de productos"
              type="button"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{product.name}</h1>
                {refreshing && (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">SKU: {product.sku}</span>
                <div className="flex items-center">
                  {renderStars(product.rating)}
                  <span className="ml-2 text-sm text-gray-600">{product.rating}/5</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${product.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
                  }`}>
                  {product.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            <button
              onClick={handlePrint}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center font-medium"
              disabled={isPrinting}
              type="button"
            >
              <Printer className="w-4 h-4 mr-2" />
              {isPrinting ? 'Imprimiendo...' : 'Imprimir'}
            </button>
            <button
              onClick={() => navigate(`/products/${id}/edit`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center font-medium"
              type="button"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Editar
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center font-medium"
              type="button"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </button>
          </div>
        </div>

        {/* ✅ MEJORA: Contenido principal con grid responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Imagen y descripción */}
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ProductGallery
                  images={images}
                  currentIndex={currentImageIndex}
                  onImageChange={setCurrentImageIndex}
                />
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">Descripción</h2>
                    <p className="text-gray-600 leading-relaxed">{product.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-gray-500">
                        <Tag className="w-4 h-4 mr-2 shrink-0" />
                        <span className="text-sm font-medium">Categoría</span>
                      </div>
                      <p className="font-medium text-gray-900">{product.category}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center text-gray-500">
                        <Award className="w-4 h-4 mr-2 shrink-0" />
                        <span className="text-sm font-medium">Marca</span>
                      </div>
                      <p className="font-medium text-gray-900">{product.brand}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center text-gray-500">
                        <MapPin className="w-4 h-4 mr-2 shrink-0" />
                        <span className="text-sm font-medium">Ubicación</span>
                      </div>
                      <p className="font-medium text-gray-900">{product.location}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center text-gray-500">
                        <Barcode className="w-4 h-4 mr-2 shrink-0" />
                        <span className="text-sm font-medium">Código</span>
                      </div>
                      <p className="font-medium text-gray-900 font-mono">{product.barcode}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pestañas */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="border-b border-gray-200">
                <div className="flex overflow-x-auto scrollbar-thin" role="tablist">
                  {tabs.map((tab) => (
                    <TabButton
                      key={tab.id}
                      tab={tab}
                      isActive={activeTab === tab.id}
                      onClick={setActiveTab}
                    />
                  ))}
                </div>
              </div>

              <div className="p-4 md:p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    role="tabpanel"
                  >
                    {activeTab === 'overview' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <MetricCard
                            title="Stock"
                            value={`${product.stock} ${product.unit}`}
                            subtitle={`Mín: ${product.minStock} | Máx: ${product.maxStock}`}
                            icon={Package}
                            color="blue"
                          />
                          <MetricCard
                            title="Precio"
                            value={formatCurrency(product.price)}
                            subtitle={`Costo: ${formatCurrency(product.cost)}`}
                            icon={DollarSign}
                            color="green"
                          />
                          <MetricCard
                            title="Margen"
                            value={`${calculateProfit.margin.toFixed(1)}%`}
                            subtitle={`${formatCurrency(calculateProfit.perUnit)} por unidad`}
                            icon={Percent}
                            color="purple"
                          />
                          <MetricCard
                            title="Vendidos"
                            value={product.totalSold}
                            subtitle="Unidades totales"
                            icon={ShoppingCart}
                            color="orange"
                          />
                        </div>

                        <div className="bg-gray-50 p-4 md:p-6 rounded-lg">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado del Inventario</h3>
                          <StockStats product={product} />
                        </div>
                      </div>
                    )}

                    {activeTab === 'specs' && (
                      <ProductSpecifications specifications={product.specifications} />
                    )}

                    {activeTab === 'history' && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Historial de Movimientos</h3>
                        <ProductHistory history={product.history} />
                      </div>
                    )}

                    {activeTab === 'analytics' && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Métricas de rendimiento</h3>
                        <div className="bg-linear-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                          <div className="flex items-center mb-4">
                            <TrendingUp className="w-6 h-6 text-blue-600 mr-3" />
                            <div>
                              <h4 className="font-semibold text-gray-900">Análisis de ventas</h4>
                              <p className="text-sm text-gray-600">Próximamente: Gráficos detallados</p>
                            </div>
                          </div>
                          <p className="text-gray-600">
                            En esta sección podrás ver análisis detallados de ventas, rotación de stock y tendencias de consumo.
                          </p>
                        </div>
                      </div>
                    )}

                    {activeTab === 'supplier' && product.supplier && (
                      <div className="space-y-6">
                        <div className="bg-blue-50 p-4 md:p-6 rounded-lg">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del proveedor</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-gray-500">Nombre</div>
                              <div className="font-medium text-gray-900">{product.supplier.name}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">Contacto</div>
                              <div className="font-medium text-gray-900">{product.supplier.contact}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">Teléfono</div>
                              <div className="font-medium text-gray-900">{product.supplier.phone}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">ID Proveedor</div>
                              <div className="font-medium text-gray-900">
                                #{String(product.supplier.id).padStart(4, '0')}
                              </div>
                            </div>
                            {product.supplier.email && (
                              <div className="md:col-span-2">
                                <div className="text-sm text-gray-500">Email</div>
                                <div className="font-medium text-gray-900">{product.supplier.email}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* ✅ CORRECCIÓN: Columna derecha - Acciones mejoradas */}
          <div className="space-y-6">
            {/* Acciones rápidas */}
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones rápidas</h3>

              <div className="space-y-5">
                <div className="flex items-center">
                  {/* Botón reducir */}
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="px-3 py-2.5 border border-gray-300 rounded-l-lg hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:z-10 flex items-center justify-center"
                    aria-label="Reducir cantidad"
                    type="button"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-5 h-5" />
                  </button>

                  {/* Campo numérico con label accesible */}
                  <label htmlFor="quantity-input" className="sr-only">
                    Cantidad
                  </label>
                  <input
                    id="quantity-input"
                    type="number"
                    min="1"
                    max={product.stock}
                    value={quantity}
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value) || 1;
                      setQuantity(Math.max(1, Math.min(product.stock, value)));
                    }}
                    className="flex-1 px-3 py-2.5 border-t border-b border-gray-300 text-center outline-none focus:ring-1 focus:ring-blue-500"
                  />

                  {/* Botón aumentar */}
                  <button
                    onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                    className="px-3 py-2.5 border border-gray-300 rounded-r-lg hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:z-10 flex items-center justify-center"
                    aria-label="Aumentar cantidad"
                    type="button"
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>

                <div className="mt-2 text-sm text-gray-500">
                  Máximo disponible: <span className="font-medium">{product.stock}</span> unidades
                </div>

                <button
                  onClick={handleOrder}
                  disabled={quantity > product.stock || quantity <= 0}
                  className="w-full py-3 bg-linear-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium"
                  type="button"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Ordenar producto
                </button>

                <button
                  onClick={() => setShowStockModal(true)}
                  className="w-full py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center font-medium"
                  type="button"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Ajustar stock
                </button>

                <button
                  onClick={() => navigator.clipboard.writeText(globalThis.location.href)}
                  className="w-full py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center font-medium"
                  type="button"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartir producto
                </button>
              </div>
            </div>

            {/* Información adicional */}
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información adicional</h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Creado</span>
                  <span className="font-medium text-gray-900">
                    {new Date(product.createdAt).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Actualizado</span>
                  <span className="font-medium text-gray-900">
                    {new Date(product.lastUpdated).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Peso</span>
                  <span className="font-medium text-gray-900">{product.weight} kg</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Dimensiones</span>
                  <span className="font-medium text-gray-900">{product.dimensions}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Estado</span>
                  <span className={`font-medium capitalize px-2 py-1 rounded-full text-xs ${product.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                    }`}>
                    {product.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ MEJORA: Modal de ajuste de stock CORREGIDO */}
      <AnimatePresence>
        {showStockModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
            onClick={() => setShowStockModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Ajustar stock</h3>
                <button
                  onClick={() => setShowStockModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Cerrar"
                  type="button"
                >
                  <span className="sr-only">Cerrar</span>
                  <span className="text-gray-500 text-xl">×</span>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="adjustQuantity"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Cantidad a ajustar
                  </label>
                  <input
                    id="adjustQuantity"
                    name="adjustQuantity"
                    type="number"
                    placeholder="Ej: +10 o -5"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reason"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Motivo
                  </label>
                  <select
                    id="reason"
                    name="reason"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">Seleccionar motivo</option>
                    <option value="compra">Compra</option>
                    <option value="venta">Venta</option>
                    <option value="ajuste">Ajuste de inventario</option>
                    <option value="devolucion">Devolución</option>
                    <option value="perdida">Pérdida</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Notas (opcional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows="3"
                    placeholder="Agregar notas adicionales..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowStockModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  type="button"
                >
                  Aplicar ajuste
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductDetails;
