import React, { useState, useMemo, useCallback } from 'react';
import {
  FiPackage,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiAlertTriangle,
  FiStar,
  FiShoppingCart,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign
} from 'react-icons/fi';
export { ProductGrid };
import { formatCurrency } from '../../utils/helpers';
import PropTypes from 'prop-types';
import Button from '../common/Button';
import Badge from '../common/Badge';
import ProgressBar from '../common/ProgressBar';

// ✅ CORRECCIÓN: Definición única y completa de PropTypes
const ProductCardPropTypes = {
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    sku: PropTypes.string,
    price: PropTypes.number,
    cost: PropTypes.number,
    description: PropTypes.string,
    category_name: PropTypes.string,
    image_url: PropTypes.string,
    unit: PropTypes.string,
    current_stock: PropTypes.number,
    min_stock: PropTypes.number,
    max_stock: PropTypes.number,
    status: PropTypes.string,
  }).isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func,
  onQuickAction: PropTypes.func,
  variant: PropTypes.oneOf(['default', 'compact', 'featured']),
  className: PropTypes.string,
};

// ✅ CORRECCIÓN: Normalizador de datos del producto para compatibilidad con backend
const normalizeProductData = (product) => {
  if (!product) return null;

  return {
    id: product.id || '',
    name: product.name || 'Producto sin nombre',
    sku: product.sku || 'N/A',
    price: Number(product.price) || 0,
    cost: Number(product.cost) || 0,
    description: product.description || '',
    category_name: product.category_name || product.category || 'Sin categoría',
    image_url: product.image_url || product.image || '',
    unit: product.unit || 'unidad',
    current_stock: Number(product.current_stock) || Number(product.stock) || 0,
    min_stock: Number(product.min_stock) || 0,
    max_stock: Number(product.max_stock) || 100,
    status: product.status || 'active',
  };
};

// ✅ CORRECCIÓN: Función para generar IDs únicos seguros
const generateSafeId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const ProductCard = ({
  product: rawProduct,
  onEdit,
  onDelete,
  onView,
  onQuickAction,
  className = '',
  variant = 'default'
}) => {
  // ✅ CORRECCIÓN: Normalizar datos del producto
  const product = useMemo(() => normalizeProductData(rawProduct), [rawProduct]);

  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  // ✅ CORRECCIÓN: Configuración de estados optimizada
  const statusInfo = useMemo(() => {
    const statusConfig = {
      active: { label: 'Activo', color: 'success', icon: '✅' },
      inactive: { label: 'Inactivo', color: 'warning', icon: '⏸️' },
      discontinued: { label: 'Descontinuado', color: 'danger', icon: '⛔' },
      low_stock: { label: 'Stock Bajo', color: 'warning', icon: '⚠️' },
      out_of_stock: { label: 'Sin Stock', color: 'danger', icon: '❌' },
    };
    return statusConfig[product?.status] || statusConfig.active;
  }, [product?.status]);

  // ✅ CORRECCIÓN: Cálculo de información de stock mejorado
  const stockInfo = useMemo(() => {
    const current = product?.current_stock || 0;
    const min = product?.min_stock || 0;
    const max = product?.max_stock || 100;

    if (product?.status === 'out_of_stock' || current <= 0) {
      return {
        label: 'Sin stock',
        color: 'danger',
        bgColor: 'bg-red-50',
        icon: <FiAlertTriangle className="text-red-500" />,
        priority: 1
      };
    }
    if (product?.status === 'low_stock' || (min > 0 && current <= min)) {
      return {
        label: 'Stock bajo',
        color: 'warning',
        bgColor: 'bg-yellow-50',
        icon: <FiAlertTriangle className="text-yellow-500" />,
        priority: 2
      };
    }
    if (max > 0 && current >= max * 0.9) {
      return {
        label: 'Alto stock',
        color: 'info',
        bgColor: 'bg-blue-50',
        icon: <FiTrendingUp className="text-blue-500" />,
        priority: 3
      };
    }
    return {
      label: 'En stock',
      color: 'success',
      bgColor: 'bg-green-50',
      icon: <FiPackage className="text-green-500" />,
      priority: 4
    };
  }, [product?.current_stock, product?.min_stock, product?.max_stock, product?.status]);

  // ✅ CORRECCIÓN: Métricas financieras
  const financialMetrics = useMemo(() => {
    if (!product) return { margin: 0, profitPerUnit: 0, totalValue: 0, marginPercentage: 0 };

    const price = Number(product.price) || 0;
    const cost = Number(product.cost) || 0;
    const currentStock = Number(product.current_stock) || 0;

    let marginPercentage = 0;
    if (price > 0 && cost > 0) {
      marginPercentage = ((price - cost) / cost) * 100;
    } else if (price > 0 && cost === 0) {
      marginPercentage = 100;
    }

    const profitPerUnit = Math.max(price - cost, 0);
    const totalValue = price * currentStock;

    return {
      margin: profitPerUnit,
      profitPerUnit,
      totalValue,
      marginPercentage,
      hasProfit: profitPerUnit > 0
    };
  }, [product]);

  // ✅ CORRECCIÓN: Manejo de imagen
  const imageUrl = useMemo(() => {
    if (!product?.image_url || imageError) return null;

    const url = product.image_url.trim();

    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }

    const baseUrl = import.meta.env?.VITE_API_URL || process.env.REACT_APP_API_URL || '';
    if (baseUrl && url.startsWith('/')) {
      return `${baseUrl}${url}`;
    } else if (baseUrl) {
      return `${baseUrl}/${url}`;
    }

    return url.startsWith('/') ? url : `/${url}`;
  }, [product?.image_url, imageError]);

  // ✅ CORRECCIÓN: Handlers optimizados
  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleAction = useCallback((action, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    if (action && product) {
      action(product);
    }
  }, [product]);

  const handleView = useCallback((e) => handleAction(onView, e), [handleAction, onView]);
  const handleEdit = useCallback((e) => handleAction(onEdit, e), [handleAction, onEdit]);
  const handleDelete = useCallback((e) => handleAction(onDelete, e), [handleAction, onDelete]);
  const handleQuickAction = useCallback((e) => handleAction(onQuickAction, e), [handleAction, onQuickAction]);

  // ✅ CORRECCIÓN: Skeleton loader
  if (!product) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse ${className}`}>
        <div className="h-48 bg-gray-200"></div>
        <div className="p-4">
          <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded mb-4 w-1/2"></div>
          <div className="flex justify-between mb-4">
            <div className="h-8 bg-gray-200 rounded w-20"></div>
            <div className="h-8 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // ✅ CORRECCIÓN: Componente Compact
  const renderCompact = () => (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-all duration-200 cursor-pointer group ${className}`}
      onClick={handleView}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`Ver detalles de ${product.name}`}
      onKeyDown={(e) => e.key === 'Enter' && handleView(e)}
    >
      <div className="flex items-center space-x-3">
        <div className="shrink-0 relative">
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={product.name}
                className="w-12 h-12 rounded-lg object-cover"
                onError={handleImageError}
                loading="lazy"
              />
              {isHovered && (
                <div className="absolute inset-0 bg-black bg-opacity-10 rounded-lg"></div>
              )}
            </>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
              <FiPackage className="text-gray-400 text-lg" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 truncate group-hover:text-primary-600 transition-colors">
              {product.name}
            </h3>
            <Badge color={stockInfo.color} size="sm" className="ml-2">
              {stockInfo.icon} {product.current_stock}
            </Badge>
          </div>

          <div className="flex items-center justify-between mt-1">
            <div className="text-sm text-gray-500 truncate">
              {product.sku} • {product.category_name}
            </div>
            <div className="font-semibold text-gray-900">
              {formatCurrency(product.price)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ✅ CORRECCIÓN: Componente Default - CORREGIDO bg-linear-to-br
  const renderDefault = () => (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group ${className}`}
      onClick={handleView}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="article"
      aria-label={`Producto: ${product.name}`}
      onKeyDown={(e) => e.key === 'Enter' && handleView(e)}
    >
      <div className="relative h-48 bg-linear-to-br from-gray-50 to-gray-100 overflow-hidden">
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={product.name}
              className={`w-full h-full object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'}`}
              onError={handleImageError}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/10 to-transparent"></div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FiPackage className="text-gray-300 text-5xl" />
          </div>
        )}

        <div className="absolute top-3 right-3 flex flex-col gap-1">
          <Badge color={statusInfo.color} size="sm" className="shadow-sm">
            {statusInfo.label}
          </Badge>
          <Badge color={stockInfo.color} size="sm" className="shadow-sm">
            {stockInfo.icon} {stockInfo.label}
          </Badge>
        </div>

        {isHovered && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-200">
            <Button
              variant="primary"
              size="sm"
              onClick={handleView}
              startIcon={<FiEye />}
              className="shadow-lg transform hover:scale-105 transition-transform"
            >
              Ver detalles
            </Button>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span
            className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-full truncate max-w-[140px]"
            title={product.sku}
          >
            {product.sku}
          </span>
          <span
            className="text-xs text-gray-500 truncate max-w-[120px]"
            title={product.category_name}
          >
            {product.category_name}
          </span>
        </div>

        <h3
          className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors duration-200"
          title={product.name}
        >
          {product.name}
        </h3>

        {product.description && (
          <p
            className="text-sm text-gray-600 mb-4 line-clamp-2"
            title={product.description}
          >
            {product.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="text-xs text-gray-500 mb-1">Precio</div>
            <div className="font-bold text-gray-900 text-lg">
              {formatCurrency(product.price)}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="text-xs text-gray-500 mb-1">Stock</div>
            <div className="font-bold text-gray-900 text-lg">
              {product.current_stock} <span className="text-xs text-gray-500">{product.unit}</span>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <div className="text-gray-600">Margen de ganancia</div>
            <div className={`font-semibold ${financialMetrics.hasProfit ? 'text-green-600' : 'text-red-600'}`}>
              {financialMetrics.marginPercentage.toFixed(1)}%
            </div>
          </div>
          <ProgressBar
            value={Math.min(Math.max(financialMetrics.marginPercentage, 0), 100)}
            max={100}
            color={financialMetrics.marginPercentage > 30 ? 'success' : financialMetrics.marginPercentage > 10 ? 'warning' : 'danger'}
            size="sm"
            className="h-2"
          />
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 mb-2">
            <span>Nivel de stock</span>
            <span>
              {product.max_stock > 0
                ? Math.round((product.current_stock / product.max_stock) * 100)
                : 0}%
            </span>
          </div>
          <ProgressBar
            value={product.current_stock}
            max={product.max_stock}
            color={stockInfo.color}
            showLabels={false}
            className="h-2"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Mín: {product.min_stock}</span>
            <span>Máx: {product.max_stock}</span>
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleView}
            startIcon={<FiEye />}
            className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
          >
            Detalles
          </Button>

          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              startIcon={<FiEdit2 />}
              title="Editar producto"
              className="text-gray-600 hover:text-gray-700 hover:bg-gray-100"
            >
              Editar
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              startIcon={<FiTrash2 />}
              title="Eliminar producto"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Eliminar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // ✅ CORRECCIÓN: Componente Featured - CORREGIDO bg-linear-to-br
  const renderFeatured = () => (
    <button
      type="button"
      className={`bg-linear-to-br from-white via-primary-50/20 to-white rounded-xl shadow-lg border border-primary-100 overflow-hidden transform hover:-translate-y-1 transition-all duration-300 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleView}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1">
            <Badge color="primary" size="sm" className="mb-3 px-3 py-1">
              <FiStar className="mr-1" /> Destacado
            </Badge>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{product.name}</h3>
            <p className="text-sm text-gray-600">{product.sku}</p>
          </div>

          <div className="text-right ml-4">
            <div className="text-3xl font-bold text-primary-600">
              {formatCurrency(product.price)}
            </div>
            <div className="text-sm text-gray-500">Precio de venta</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-200 transition-colors">
            <div className="text-sm text-gray-500 mb-2">Stock actual</div>
            <div className="text-2xl font-bold text-gray-900">{product.current_stock}</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-200 transition-colors">
            <div className="text-sm text-gray-500 mb-2">Margen</div>
            <div className={`text-2xl font-bold ${financialMetrics.hasProfit ? 'text-green-600' : 'text-red-600'}`}>
              {financialMetrics.marginPercentage.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button
            variant="primary"
            fullWidth
            onClick={handleView}
            startIcon={<FiEye />}
            className="flex-1"
          >
            Ver detalles
          </Button>
          <Button
            variant="outline"
            onClick={handleQuickAction}
            startIcon={<FiShoppingCart />}
            title="Acción rápida"
            className="border-primary-200 text-primary-600 hover:bg-primary-50"
          >
            Acción
          </Button>
        </div>
      </div>
    </button>
  );

  // ✅ CORRECCIÓN: Renderizado por variante
  switch (variant) {
    case 'compact':
      return renderCompact();
    case 'featured':
      return renderFeatured();
    default:
      return renderDefault();
  }
};

// ✅ CORRECCIÓN: Asignar PropTypes
ProductCard.propTypes = ProductCardPropTypes;

ProductCard.defaultProps = {
  onEdit: () => { },
  onDelete: () => { },
  onView: () => { },
  onQuickAction: () => { },
  variant: 'default',
  className: ''
};

// ✅ CORRECCIÓN: PropTypes para ProductGrid
const ProductGridPropTypes = {
  products: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    sku: PropTypes.string,
    price: PropTypes.number,
    cost: PropTypes.number,
    description: PropTypes.string,
    category_name: PropTypes.string,
    image_url: PropTypes.string,
    unit: PropTypes.string,
    current_stock: PropTypes.number,
    min_stock: PropTypes.number,
    max_stock: PropTypes.number,
    status: PropTypes.string,
  })),
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func,
  onQuickAction: PropTypes.func,
  loading: PropTypes.bool,
  emptyMessage: PropTypes.object,
  variant: PropTypes.string,
  className: PropTypes.string,
  columns: PropTypes.shape({
    sm: PropTypes.number,
    md: PropTypes.number,
    lg: PropTypes.number,
    xl: PropTypes.number,
  }),
};

// ✅ CORRECCIÓN: Componente ProductGrid optimizado
const ProductGrid = ({
  products = [],
  onEdit,
  onDelete,
  onView,
  onQuickAction,
  loading = false,
  emptyMessage,
  variant = 'default',
  className = '',
  columns = { sm: 2, md: 3, lg: 4, xl: 5 },
}) => {
  // ✅ CORRECCIÓN: Sistema de grid responsive mejorado
  const gridClasses = useMemo(() => {
    const baseClass = 'grid gap-6';
    const responsiveClasses = {
      1: 'grid-cols-1',
      2: 'sm:grid-cols-2',
      3: 'md:grid-cols-3',
      4: 'lg:grid-cols-4',
      5: 'xl:grid-cols-5',
    };

    const classes = [baseClass];

    if (columns.sm) classes.push(responsiveClasses[columns.sm] || 'grid-cols-1');
    if (columns.md && responsiveClasses[columns.md]) classes.push(`md:${responsiveClasses[columns.md].split(':').pop()}`);
    if (columns.lg && responsiveClasses[columns.lg]) classes.push(`lg:${responsiveClasses[columns.lg].split(':').pop()}`);
    if (columns.xl && responsiveClasses[columns.xl]) classes.push(`xl:${responsiveClasses[columns.xl].split(':').pop()}`);

    return `${classes.join(' ')} ${className}`.trim();
  }, [columns, className]);

  // ✅ CORRECCIÓN: Loading state
  if (loading) {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 ${className}`}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 rounded-xl h-48 mb-4"></div>
            <div className="space-y-3 p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="flex justify-between pt-3">
                <div className="h-8 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ✅ CORRECCIÓN: Empty state
  if (!products || products.length === 0) {
    const defaultEmptyMessage = {
      title: 'No hay productos',
      description: 'Comienza agregando tu primer producto al inventario.',
      action: emptyMessage?.action
    };

    const message = { ...defaultEmptyMessage, ...emptyMessage };

    return (
      <div className={`text-center py-16 px-4 ${className}`}>
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-50 mb-6">
          <FiPackage className="text-primary-400 text-3xl" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          {message.title}
        </h3>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          {message.description}
        </p>
        {message.action && (
          <Button
            variant="primary"
            onClick={message.action.onClick}
            startIcon={message.action.icon}
            size="lg"
          >
            {message.action.label}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={gridClasses}>
      {products.map((product) => (
        <ProductCard
          key={`product-${product.id}-${variant}`}
          product={product}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          onQuickAction={onQuickAction}
          variant={variant}
        />
      ))}
    </div>
  );
};

// ✅ CORRECCIÓN: Asignar PropTypes a ProductGrid
ProductGrid.propTypes = ProductGridPropTypes;

ProductGrid.defaultProps = {
  products: [],
  onEdit: () => { },
  onDelete: () => { },
  onView: () => { },
  onQuickAction: () => { },
  loading: false,
  variant: 'default',
  className: '',
  columns: {
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5
  }
};

// ✅ CORRECCIÓN: Exportar ambos componentes
export default ProductCard;
export { ProductGrid };