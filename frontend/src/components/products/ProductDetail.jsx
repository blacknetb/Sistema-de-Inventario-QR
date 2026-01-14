import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { productService } from '../../services/productService';
import { inventoryService } from '../../services/inventoryService';
import { formatCurrency, formatDate, formatNumber } from '../../utils/helpers';
import Button from '../common/Button';
import Card from '../common/Card';
import Table from '../common/Table';
import Loader from '../common/Loader';
import Chart from '../common/Chart';
import QRCodeDisplay from '../common/QRCodeDisplay';
import PropTypes from 'prop-types';
import {
  FiPackage,
  FiEdit2,
  FiTrash2,
  FiTrendingUp,
  FiTrendingDown,
  FiDownload,
  FiAlertTriangle,
  FiBarChart2,
  FiDollarSign,
  FiCalendar,
  FiTag,
  FiGrid,
  FiActivity
} from 'react-icons/fi';
import { useNotification } from '../../context/NotificationContext';

// ✅ CORRECCIÓN: Funciones auxiliares para estatus
const getStatusStyles = (status) => {
  const styles = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-yellow-100 text-yellow-800',
    discontinued: 'bg-red-100 text-red-800',
    low_stock: 'bg-yellow-100 text-yellow-800',
    out_of_stock: 'bg-red-100 text-red-800'
  };
  return styles[status] || styles.active;
};

const getStatusLabel = (status) => {
  const labels = {
    active: 'Activo',
    inactive: 'Inactivo',
    discontinued: 'Descontinuado',
    low_stock: 'Stock Bajo',
    out_of_stock: 'Sin Stock'
  };
  return labels[status] || labels.active;
};

const ProductDetail = ({
  product,
  onEdit,
  onClose,
  onInventoryAction,
  className = ''
}) => {
  const { success, error, withLoadingNotification } = useNotification();

  // ✅ CORRECCIÓN: Estados correctamente inicializados
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [inventoryHistory, setInventoryHistory] = useState([]);
  const [currentStock, setCurrentStock] = useState(product?.current_stock || 0);
  const [stockHistory, setStockHistory] = useState([]);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [previewImage, setPreviewImage] = useState(product?.image_url || null);
  const [imageFile, setImageFile] = useState(null);

  // ✅ CORRECCIÓN: Calcular métricas con useMemo
  const metrics = useMemo(() => {
    if (!product) return {};

    const price = parseFloat(product.price) || 0;
    const cost = parseFloat(product.cost) || 0;
    const margin = price > 0 && cost > 0
      ? ((price - cost) / cost) * 100
      : 0;

    const profitPerUnit = price - cost;
    const totalStockValue = price * currentStock;
    const stockPercentage = Math.min((currentStock / (product.max_stock || 100)) * 100, 100);

    return {
      margin,
      profitPerUnit,
      totalStockValue,
      stockPercentage
    };
  }, [product, currentStock]);

  // ✅ CORRECCIÓN: Estado del stock con useMemo
  const stockStatus = useMemo(() => {
    if (!product) return { label: 'N/A', color: 'secondary', icon: '❓' };

    if (currentStock <= 0) {
      return { label: 'Sin stock', color: 'danger', icon: '❌' };
    }
    if (currentStock <= (product.min_stock || 0)) {
      return { label: 'Stock bajo', color: 'warning', icon: '⚠️' };
    }
    if (currentStock >= (product.max_stock || 100)) {
      return { label: 'Exceso', color: 'info', icon: '📈' };
    }
    return { label: 'En stock', color: 'success', icon: '✅' };
  }, [product, currentStock]);

  // ✅ CORRECCIÓN: Cargar detalles del producto
  const loadProductDetails = useCallback(async () => {
    if (!product?.id) return;

    try {
      setLoading(true);

      // ✅ MEJORA: Cargar datos en paralelo
      const [stockResponse, historyResponse] = await Promise.allSettled([
        inventoryService.getCurrentStock(product.id),
        inventoryService.getHistoryByProduct(product.id, { limit: 10 })
      ]);

      // Procesar stock actual
      if (stockResponse.status === 'fulfilled' && stockResponse.value?.success) {
        setCurrentStock(stockResponse.value.data?.current_stock || product.current_stock || 0);
      }

      // Procesar historial de inventario
      if (historyResponse.status === 'fulfilled' && historyResponse.value?.success) {
        const formattedHistory = (historyResponse.value.data || []).map(item => ({
          ...item,
          formatted_created_at: formatDate(item.created_at),
          formatted_quantity: `${item.quantity} ${product.unit || 'unidad'}`,
          movement_type_formatted: item.movement_type === 'in' ? 'Entrada' : 'Salida'
        }));
        setInventoryHistory(formattedHistory);
      }

    } catch (err) {
      console.error('Error loading product details:', err);
      error('Error al cargar los detalles del producto');
    } finally {
      setLoading(false);
    }
  }, [product, error]);

  useEffect(() => {
    if (product?.id) {
      loadProductDetails();
    }
  }, [product, loadProductDetails]);

  // ✅ CORRECCIÓN: Manejo de acciones de inventario
  const handleInventoryAction = (type) => {
    if (onInventoryAction) {
      onInventoryAction(product, type);
    } else {
      console.log(`Acción de inventario: ${type} para ${product?.name}`);
    }
  };

  // ✅ CORRECCIÓN: Generar y mostrar código QR
  const handleGenerateQR = async () => {
    if (!product?.id) return;

    try {
      const response = await withLoadingNotification(
        productService.generateQRCode(product.id),
        'Generando código QR...'
      );

      if (response?.success && response.data?.qrCode) {
        setQrCodeData(response.data.qrCode);
        setShowQRCode(true);
        success('Código QR generado exitosamente');
      }
    } catch (err) {
      error('Error generando código QR');
    }
  };

  // ✅ CORRECCIÓN: Descargar código QR
  const handleDownloadQR = () => {
    if (qrCodeData) {
      const link = document.createElement('a');
      link.href = qrCodeData;
      link.download = `QR_${product?.sku || 'producto'}_${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      success('Código QR descargado');
    }
  };

  // ✅ CORRECCIÓN: Manejo de error de imagen
  const handleImageError = (e) => {
    setImageError(true);
    e.target.onerror = null;
    e.target.src = '/placeholder-image.png';
    e.target.classList.add('bg-gray-100');
  };

  // ✅ CORRECCIÓN: Columnas de tabla optimizadas
  const columns = useMemo(() => [
    {
      key: 'formatted_created_at',
      title: 'Fecha',
      headerClass: 'w-32',
      cellClass: 'font-medium',
      render: (row) => row.formatted_created_at
    },
    {
      key: 'movement_type_formatted',
      title: 'Tipo',
      headerClass: 'w-24',
      render: (row) => (
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${row.movement_type === 'in'
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
          }`}>
          {row.movement_type === 'in' ? (
            <>
              <FiTrendingUp className="mr-1" />
              Entrada
            </>
          ) : (
            <>
              <FiTrendingDown className="mr-1" />
              Salida
            </>
          )}
        </div>
      )
    },
    {
      key: 'formatted_quantity',
      title: 'Cantidad',
      headerClass: 'w-24',
      cellClass: 'font-semibold',
      render: (row) => row.formatted_quantity
    },
    {
      key: 'reason',
      title: 'Motivo',
      render: (row) => (
        <div className="max-w-[200px]">
          <div className="truncate" title={row.reason}>
            {row.reason || 'Sin motivo especificado'}
          </div>
          {row.notes && (
            <div className="text-xs text-gray-500 truncate" title={row.notes}>
              {row.notes}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'created_by_name',
      title: 'Responsable',
      headerClass: 'w-32',
      render: (row) => row.created_by_name
    }
  ], []);

  // ✅ CORRECCIÓN: Datos para gráfico de historial de stock
  const stockChartData = useMemo(() => {
    if (!stockHistory.length) return null;

    return {
      labels: stockHistory.map(item => formatDate(item.date, 'short')),
      datasets: [
        {
          label: 'Stock',
          data: stockHistory.map(item => item.stock),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        },
        {
          label: 'Stock mínimo',
          data: stockHistory.map(() => product?.min_stock || 0),
          borderColor: '#f59e0b',
          borderDash: [5, 5],
          backgroundColor: 'transparent',
          tension: 0
        }
      ]
    };
  }, [stockHistory, product]);

  // ✅ CORRECCIÓN: URL de imagen del producto
  const productImageUrl = useMemo(() => {
    if (!product?.image_url || imageError) return null;

    const url = product.image_url;
    if (url.startsWith('http') || url.startsWith('data:')) {
      return url;
    }

    const apiUrl = process.env.REACT_APP_API_URL || import.meta.env?.VITE_API_URL || '';
    return `${apiUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }, [product?.image_url, imageError]);

  // ✅ CORRECCIÓN: Estados de carga y error
  if (!product) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <FiAlertTriangle className="text-yellow-500 text-4xl mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay producto seleccionado
        </h3>
        <p className="text-gray-600">Selecciona un producto para ver sus detalles</p>
      </div>
    );
  }

  if (loading && !inventoryHistory.length) {
    return (
      <div className={`flex justify-center items-center py-12 ${className}`}>
        <Loader size="large" text="Cargando detalles del producto..." />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header con información básica */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start space-x-4 flex-1 min-w-0">
          {/* Imagen del producto */}
          <div className="relative shrink-0">
            {productImageUrl ? (
              <div className="relative group">
                <img
                  src={productImageUrl}
                  alt={product.name}
                  className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200"
                  onError={handleImageError}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-xl" />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-xl bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                <FiPackage className="text-gray-400 text-3xl" />
              </div>
            )}
          </div>

          {/* Información del producto */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <h2 className="text-2xl font-bold text-gray-900 truncate" title={product.name}>
                  {product.name}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-100 text-primary-800 text-sm font-medium">
                    <FiTag className="mr-1" />
                    {product.sku || 'Sin SKU'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {product.category_name || 'Sin categoría'}
                  </div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${stockStatus.color === 'danger' ? 'bg-red-100 text-red-800' :
                    stockStatus.color === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      stockStatus.color === 'success' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                    }`}>
                    {stockStatus.icon} {stockStatus.label}
                  </div>
                </div>
              </div>

              {/* Acciones rápidas */}
              <div className="flex flex-wrap gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit?.(product)}
                  startIcon={<FiEdit2 />}
                  title="Editar producto"
                >
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateQR}
                  startIcon={<FiDownload />}
                  title="Generar código QR"
                >
                  QR
                </Button>
              </div>
            </div>

            {/* Descripción */}
            {product.description && (
              <p className="mt-4 text-gray-600 line-clamp-2">
                {product.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Información detallada */}
        <div className="lg:col-span-2 space-y-6">
          {/* Estadísticas de stock */}
          <Card title="Estadísticas de Stock" icon={FiActivity}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-3xl font-bold text-gray-900">{currentStock}</div>
                <div className="text-sm text-gray-600 mt-1">Stock Actual</div>
              </div>

              <div className="text-center p-4 bg-yellow-50 rounded-xl">
                <div className="text-3xl font-bold text-yellow-600">{product.min_stock || 0}</div>
                <div className="text-sm text-gray-600 mt-1">Stock Mínimo</div>
              </div>

              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-3xl font-bold text-blue-600">{product.max_stock || 100}</div>
                <div className="text-sm text-gray-600 mt-1">Stock Máximo</div>
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-3xl font-bold text-gray-900">{product.unit || 'unidad'}</div>
                <div className="text-sm text-gray-600 mt-1">Unidad</div>
              </div>
            </div>

            {/* Barra de progreso de stock */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium text-gray-700">
                  Nivel de stock actual
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {metrics.stockPercentage?.toFixed(1) || 0}%
                </div>
              </div>

              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${stockStatus.color === 'danger' ? 'bg-red-500' :
                      stockStatus.color === 'warning' ? 'bg-yellow-500' :
                        stockStatus.color === 'success' ? 'bg-green-500' :
                          'bg-blue-500'
                      }`}
                    style={{ width: `${metrics.stockPercentage || 0}%` }}
                  />
                </div>

                {/* Marcas de referencia */}
                <div className="flex justify-between mt-2">
                  <div className="text-xs text-gray-500">0</div>
                  <div className="text-xs text-yellow-600">Mín: {product.min_stock || 0}</div>
                  <div className="text-xs text-blue-600">Máx: {product.max_stock || 100}</div>
                </div>
              </div>
            </div>

            {/* Gráfico de historial de stock */}
            {stockChartData && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">
                    <FiBarChart2 className="inline mr-2" />
                    Historial de stock (30 días)
                  </h4>
                </div>
                <Chart
                  type="line"
                  data={stockChartData}
                  height={200}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    }
                  }}
                />
              </div>
            )}
          </Card>

          {/* Historial de inventario */}
          <Card
            title="Historial Reciente de Movimientos"
            icon={FiGrid}
            action={
              inventoryHistory.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => console.log('Ver historial completo')}
                >
                  Ver completo
                </Button>
              )
            }
          >
            <Table
              columns={columns}
              data={inventoryHistory}
              emptyMessage={
                <div className="text-center py-8">
                  <FiActivity className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-600">No hay movimientos registrados</p>
                </div>
              }
              loading={loading}
              className="max-h-96"
              stickyHeader
            />
          </Card>
        </div>

        {/* Columna derecha - Información adicional */}
        <div className="space-y-6">
          {/* Información financiera */}
          <Card title="Información Financiera" icon={FiDollarSign}>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Precio de venta</div>
                <div className="text-xl font-semibold text-gray-900">
                  {formatCurrency(product.price || 0)}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Costo unitario</div>
                <div className="text-xl font-semibold text-gray-900">
                  {formatCurrency(product.cost || 0)}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Margen de ganancia</div>
                <div className={`text-xl font-semibold ${metrics.margin > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {formatCurrency(metrics.profitPerUnit || 0)}
                  <span className="text-sm ml-2">
                    ({metrics.margin?.toFixed(1) || 0}%)
                  </span>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Valor total en stock</div>
                <div className="text-xl font-semibold text-gray-900">
                  {formatCurrency(metrics.totalStockValue || 0)}
                </div>
              </div>
            </div>
          </Card>

          <Card title="Información del Producto" icon={FiPackage}>
            <div className="space-y-3">
              {/* Estado */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">Estado</div>
                <div className="font-medium">
                  <div
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusStyles(product.status)}`}
                  >
                    {getStatusLabel(product.status)}
                  </div>
                </div>
              </div>

              {/* Fecha de creación */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <FiCalendar className="inline mr-1" />
                  Creado
                </div>
                <div className="font-medium">{formatDate(product.created_at)}</div>
              </div>

              {/* Fecha de actualización */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <FiCalendar className="inline mr-1" />
                  Actualizado
                </div>
                <div className="font-medium">{formatDate(product.updated_at)}</div>
              </div>

              {/* ID del producto */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">ID del producto</div>
                <div className="font-medium text-gray-500">#{product.id}</div>
              </div>
            </div>
          </Card>

          {/* Acciones rápidas */}
          <Card title="Acciones Rápidas">
            <div className="space-y-3">
              <Button
                variant="outline"
                fullWidth
                startIcon={<FiTrendingUp />}
                onClick={() => handleInventoryAction('entry')}
                className="justify-start"
              >
                <div className="text-left">
                  <div className="font-medium">Entrada de Stock</div>
                  <div className="text-xs text-gray-500">Agregar unidades al inventario</div>
                </div>
              </Button>

              <Button
                variant="outline"
                fullWidth
                startIcon={<FiTrendingDown />}
                onClick={() => handleInventoryAction('exit')}
                disabled={currentStock <= 0}
                className="justify-start"
              >
                <div className="text-left">
                  <div className="font-medium">Salida de Stock</div>
                  <div className="text-xs text-gray-500">Retirar unidades del inventario</div>
                </div>
              </Button>

              <Button
                variant="outline"
                fullWidth
                startIcon={<FiDownload />}
                onClick={showQRCode ? handleDownloadQR : handleGenerateQR}
                className="justify-start"
              >
                <div className="text-left">
                  <div className="font-medium">
                    {showQRCode ? 'Descargar QR' : 'Generar QR'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {showQRCode ? 'Descargar código QR' : 'Generar código QR para escaneo'}
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                fullWidth
                startIcon={<FiEdit2 />}
                onClick={() => onEdit?.(product)}
                className="justify-start"
              >
                <div className="text-left">
                  <div className="font-medium">Editar Producto</div>
                  <div className="text-xs text-gray-500">Modificar información del producto</div>
                </div>
              </Button>
            </div>
          </Card>

          {/* Código QR */}
          {showQRCode && qrCodeData && (
            <Card title="Código QR">
              <div className="space-y-4">
                <QRCodeDisplay
                  data={qrCodeData}
                  size={200}
                  className="mx-auto"
                />
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    Escanea este código para ver los detalles del producto
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadQR}
                      startIcon={<FiDownload />}
                      className="flex-1"
                    >
                      Descargar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowQRCode(false)}
                      className="flex-1"
                    >
                      Cerrar
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// ✅ CORRECCIÓN: PropTypes actualizados
ProductDetail.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    sku: PropTypes.string,
    price: PropTypes.number,
    cost: PropTypes.number,
    current_stock: PropTypes.number,
    min_stock: PropTypes.number,
    max_stock: PropTypes.number,
    unit: PropTypes.string,
    category_name: PropTypes.string,
    description: PropTypes.string,
    status: PropTypes.string,
    image_url: PropTypes.string,
    created_at: PropTypes.string,
    updated_at: PropTypes.string
  }),
  onEdit: PropTypes.func,
  onClose: PropTypes.func,
  onInventoryAction: PropTypes.func,
  className: PropTypes.string
};

ProductDetail.defaultProps = {
  product: null,
  onEdit: () => { },
  onClose: () => { },
  onInventoryAction: () => { },
  className: ''
};

export default ProductDetail;