import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { inventoryService } from '../../services/inventoryService';
import { productService } from '../../services/productService';
import Table from '../common/Table';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Card from '../common/Card';
import Alert from '../common/Alert';
import "../../assets/styles/inventory.css"
import Badge from '../common/Badge';
import ProgressBar from '../common/ProgressBar';
import Skeleton from '../common/Skeleton';
import {
  formatCurrency,
  formatNumber,
  formatDate,
  exportToCSV
} from '../../utils/helpers';
import { useNotification } from '../../context/NotificationContext';
import {
  FiAlertTriangle,
  FiPackage,
  FiMail,
  FiDownload,
  FiRefresh,
  FiBell,
  FiTrendingUp,
  FiBarChart2,
  FiDollarSign,
  FiCheckCircle,
  FiClock,
  FiInfo,
  FiSettings
} from 'react-icons/fi';

// ✅ Constantes fuera del componente
const STOCK_STATUS = {
  CRITICAL: { threshold: 0.1, color: 'danger', text: 'Crítico', icon: <FiAlertTriangle /> },
  LOW: { threshold: 0.3, color: 'warning', text: 'Bajo', icon: <FiAlertTriangle /> },
  WARNING: { threshold: 1, color: 'info', text: 'Advertencia', icon: <FiBell /> },
  NORMAL: { threshold: Infinity, color: 'success', text: 'Normal', icon: <FiCheckCircle /> }
};

const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutos

const StockAlert = () => {
  const { success, error, warning, withLoadingNotification } = useNotification();
  
  // ✅ ESTADOS PRINCIPALES
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [criticalStockProducts, setCriticalStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendEmailLoading, setSendEmailLoading] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState(0);
  const [statistics, setStatistics] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    sortBy: 'critical',
    sortOrder: 'asc'
  });

  // ✅ REFERENCIAS
  const lastUpdateRef = useRef(null);
  const autoRefreshTimerRef = useRef(null);
  const isMountedRef = useRef(true);

  // ✅ Cargar alertas de stock con cleanup
  useEffect(() => {
    isMountedRef.current = true;
    loadStockAlerts();

    // Configurar auto-refresh
    autoRefreshTimerRef.current = setInterval(() => {
      if (isMountedRef.current) {
        loadStockAlerts(false);
      }
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      isMountedRef.current = false;
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
      }
    };
  }, []);

  // ✅ FUNCIÓN PARA CARGAR ALERTAS
  const loadStockAlerts = useCallback(async (showNotification = false) => {
    if (refreshing || !isMountedRef.current) return;

    try {
      setRefreshing(true);
      if (showNotification && isMountedRef.current) {
        success('Actualizando alertas de stock...', { duration: 2000 });
      }

      const response = await inventoryService.getLowStockReport();

      if (response.success && response.data && isMountedRef.current) {
        const products = response.data;
        setLowStockProducts(products);
        lastUpdateRef.current = new Date();

        // Separar productos críticos
        const critical = products.filter(product => {
          if (!product || !product.min_stock || product.current_stock === undefined) return false;
          return product.current_stock <= (product.min_stock * STOCK_STATUS.CRITICAL.threshold);
        });
        setCriticalStockProducts(critical);

        // Calcular estadísticas
        calculateStatistics(products);

        // Notificación inteligente
        if (critical.length > 0 && isMountedRef.current) {
          warning(`${critical.length} producto(s) en stock crítico`, {
            duration: 10000,
            type: 'critical',
            action: {
              label: 'Ver críticos',
              onClick: () => handleFilterChange('status', 'crítico')
            }
          });
        } else if (products.length > 0 && isMountedRef.current) {
          success(`${products.length} producto(s) requieren atención`, {
            duration: 5000
          });
        }
      } else if (isMountedRef.current) {
        setLowStockProducts([]);
        setCriticalStockProducts([]);
        setStatistics(null);
      }
    } catch (err) {
      console.error('Error cargando alertas de stock:', err);
      if (isMountedRef.current) {
        error('Error cargando alertas de stock. Intente nuevamente.');
        setLowStockProducts([]);
        setCriticalStockProducts([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [refreshing, success, error, warning]);

  // ✅ FUNCIÓN PARA CALCULAR ESTADÍSTICAS
  const calculateStatistics = useCallback((products) => {
    if (!products || !Array.isArray(products) || products.length === 0 || !isMountedRef.current) {
      setStatistics(null);
      return;
    }

    const validProducts = products.filter(p => p && p.min_stock !== undefined && p.current_stock !== undefined);
    const totalProducts = validProducts.length;

    if (totalProducts === 0) {
      setStatistics(null);
      return;
    }

    const stats = validProducts.reduce((acc, product) => {
      // Valor en riesgo
      const productValue = (product.price || 0) * product.current_stock;
      acc.totalValueAtRisk += productValue;

      // Unidades faltantes
      const missing = Math.max(0, product.min_stock - product.current_stock);
      acc.totalMissingUnits += missing;

      // Porcentaje de stock
      const percentage = (product.current_stock / product.min_stock) * 100;
      acc.avgStockPercentage += percentage;

      // Producto más crítico
      if (percentage < acc.mostCriticalPercentage) {
        acc.mostCriticalProduct = product;
        acc.mostCriticalPercentage = percentage;
      }

      // Contar por estado
      if (product.current_stock === 0) {
        acc.outOfStockCount++;
      } else if (percentage <= STOCK_STATUS.CRITICAL.threshold * 100) {
        acc.criticalCount++;
      } else if (percentage <= STOCK_STATUS.LOW.threshold * 100) {
        acc.lowCount++;
      } else if (percentage <= STOCK_STATUS.WARNING.threshold * 100) {
        acc.warningCount++;
      }

      return acc;
    }, {
      totalValueAtRisk: 0,
      totalMissingUnits: 0,
      avgStockPercentage: 0,
      mostCriticalProduct: validProducts[0],
      mostCriticalPercentage: Infinity,
      outOfStockCount: 0,
      criticalCount: 0,
      lowCount: 0,
      warningCount: 0
    });

    if (isMountedRef.current) {
      setStatistics({
        totalProducts,
        totalValueAtRisk: stats.totalValueAtRisk,
        totalMissingUnits: stats.totalMissingUnits,
        avgStockPercentage: stats.avgStockPercentage / totalProducts,
        mostCriticalProduct: stats.mostCriticalProduct,
        outOfStockCount: stats.outOfStockCount,
        criticalCount: stats.criticalCount,
        lowCount: stats.lowCount,
        warningCount: stats.warningCount,
        lastUpdate: new Date()
      });
    }
  }, []);

  // ✅ FUNCIÓN PARA DETERMINAR ESTADO DE STOCK
  const getStockStatus = useCallback((product) => {
    if (!product || product.current_stock === undefined || product.min_stock === undefined) {
      return STOCK_STATUS.NORMAL;
    }

    if (product.current_stock === 0) {
      return { ...STOCK_STATUS.CRITICAL, text: 'Agotado' };
    }

    const percentage = product.current_stock / product.min_stock;

    if (percentage <= STOCK_STATUS.CRITICAL.threshold) {
      return STOCK_STATUS.CRITICAL;
    } else if (percentage <= STOCK_STATUS.LOW.threshold) {
      return STOCK_STATUS.LOW;
    } else if (percentage <= STOCK_STATUS.WARNING.threshold) {
      return STOCK_STATUS.WARNING;
    } else {
      return STOCK_STATUS.NORMAL;
    }
  }, []);

  // ✅ MANEJO DE FILTROS
  const handleFilterChange = useCallback((field, value) => {
    if (!isMountedRef.current) return;
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  // ✅ FILTRAR PRODUCTOS
  const filteredProducts = useMemo(() => {
    let filtered = [...lowStockProducts];

    // Filtrar por estado
    if (filters.status) {
      filtered = filtered.filter(product => {
        const status = getStockStatus(product);
        return status.text.toLowerCase() === filters.status.toLowerCase();
      });
    }

    // Ordenar
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        const percentageA = (a.current_stock / a.min_stock);
        const percentageB = (b.current_stock / b.min_stock);

        if (filters.sortBy === 'critical') {
          return filters.sortOrder === 'asc'
            ? percentageA - percentageB
            : percentageB - percentageA;
        } else if (filters.sortBy === 'name') {
          return filters.sortOrder === 'asc'
            ? (a.name || '').localeCompare(b.name || '')
            : (b.name || '').localeCompare(a.name || '');
        } else if (filters.sortBy === 'missing') {
          const missingA = Math.max(0, a.min_stock - a.current_stock);
          const missingB = Math.max(0, b.min_stock - b.current_stock);
          return filters.sortOrder === 'asc'
            ? missingA - missingB
            : missingB - missingA;
        }
        return 0;
      });
    }

    return filtered;
  }, [lowStockProducts, filters, getStockStatus]);

  // ✅ MANEJO DE RESTOCK
  const handleRestockClick = useCallback((product) => {
    if (!product || !isMountedRef.current) return;

    setSelectedProduct(product);
    const suggested = Math.max(
      product.min_stock * 2 - product.current_stock,
      product.min_stock
    );
    setRestockQuantity(suggested > 0 ? suggested : product.min_stock);
    setIsRestockModalOpen(true);
  }, []);

  const handleRestock = async () => {
    if (!selectedProduct || restockQuantity <= 0 || !isMountedRef.current) {
      error('Cantidad inválida para reposición');
      return;
    }

    try {
      const response = await withLoadingNotification(
        () => inventoryService.createMovement({
          product_id: selectedProduct.id,
          quantity: restockQuantity,
          movement_type: 'in',
          reason: `Reposición automática - Stock bajo: ${selectedProduct.current_stock}/${selectedProduct.min_stock}`,
          notes: `Reposición desde alertas de stock`
        }),
        'Reponiendo stock...'
      );

      if (response.success && isMountedRef.current) {
        success(`${restockQuantity} unidades repuestas a ${selectedProduct.name}`);
        setIsRestockModalOpen(false);
        setSelectedProduct(null);
        setRestockQuantity(0);
        loadStockAlerts(true);
      }
    } catch (err) {
      console.error('Error en reposición:', err);
      if (isMountedRef.current) {
        error('Error al reponer stock');
      }
    }
  };

  // ✅ ENVÍO DE EMAIL
  const sendEmailAlert = async () => {
    try {
      setSendEmailLoading(true);

      await withLoadingNotification(
        async () => {
          // Simulación de envío de email
          await new Promise(resolve => setTimeout(resolve, 1000));

          if (isMountedRef.current) {
            success('Alerta enviada exitosamente', {
              duration: 5000,
              icon: '📧'
            });
          }
        },
        'Enviando alerta por email...'
      );
    } catch (err) {
      console.error('Error enviando email:', err);
      if (isMountedRef.current) {
        error('Error al enviar la alerta por email');
      }
    } finally {
      if (isMountedRef.current) {
        setSendEmailLoading(false);
      }
    }
  };

  // ✅ EXPORTACIÓN
  const exportAlertsToCSV = useCallback(() => {
    try {
      const csvData = filteredProducts.map(product => {
        const status = getStockStatus(product);
        const missing = Math.max(0, product.min_stock - product.current_stock);

        return {
          'Producto': product.name || 'N/A',
          'SKU': product.sku || 'N/A',
          'Categoría': product.category_name || 'Sin categoría',
          'Stock Actual': product.current_stock || 0,
          'Stock Mínimo': product.min_stock || 0,
          'Unidades Faltantes': missing,
          'Porcentaje Stock': `${((product.current_stock / product.min_stock) * 100).toFixed(1)}%`,
          'Estado': status.text,
          'Precio Unitario': formatCurrency(product.price || 0),
          'Valor en Riesgo': formatCurrency((product.price || 0) * product.current_stock),
          'Unidad': product.unit || 'unidad',
          'Proveedor': product.supplier_name || 'N/A',
          'Última Reposición': product.last_restock_date
            ? formatDate(product.last_restock_date, 'dd/MM/yyyy')
            : 'N/A'
        };
      });

      const filename = `alertas-stock-${formatDate(new Date(), 'yyyy-MM-dd-HHmm')}`;
      exportToCSV(csvData, filename);

      if (isMountedRef.current) {
        success(`${filteredProducts.length} alertas exportadas`, {
          duration: 3000
        });
      }
    } catch (err) {
      console.error('Error exportando CSV:', err);
      if (isMountedRef.current) {
        error('Error al exportar las alertas');
      }
    }
  }, [filteredProducts, getStockStatus, success, error]);

  // ✅ RESTOCK MASIVO
  const handleQuickRestockAll = async () => {
    try {
      await withLoadingNotification(
        async () => {
          // Solo reponer productos críticos y sin stock
          const productsToRestock = lowStockProducts.filter(p =>
            p.current_stock <= (p.min_stock * STOCK_STATUS.CRITICAL.threshold)
          );

          // Simulación de reposición masiva
          for (const product of productsToRestock) {
            const quantity = Math.max(0, product.min_stock * 2 - product.current_stock);
            if (quantity > 0) {
              await inventoryService.createMovement({
                product_id: product.id,
                quantity: quantity,
                movement_type: 'in',
                reason: 'Reposición masiva automática - Stock crítico',
                notes: `Reposición desde alertas masivas`
              });
            }
          }

          if (isMountedRef.current) {
            success(`${productsToRestock.length} productos repuestos automáticamente`);
            loadStockAlerts(true);
          }
        },
        'Reponiendo productos críticos...'
      );
    } catch (err) {
      console.error('Error en restock masivo:', err);
      if (isMountedRef.current) {
        error('Error al reponer productos críticos');
      }
    }
  };

  // ✅ COLUMNAS DE TABLA
  const columns = useMemo(() => [
    {
      id: 'status',
      header: 'Estado',
      cell: (product) => {
        const status = getStockStatus(product);
        return (
          <Badge
            variant={status.color}
            icon={status.icon}
            className="capitalize"
          >
            {status.text}
          </Badge>
        );
      },
      width: '120px'
    },
    {
      id: 'product',
      header: 'Producto',
      cell: (product) => (
        <div className="flex items-center min-w-0">
          <div className="product-icon-small">
            <FiPackage className="text-primary" />
          </div>
          <div className="ml-3 min-w-0 flex-1">
            <p className="product-name">
              {product.name || 'Producto sin nombre'}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="product-sku">{product.sku || 'Sin SKU'}</span>
              {product.category_name && (
                <span className="product-category">
                  {product.category_name}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
      width: '250px'
    },
    {
      id: 'stock_info',
      header: 'Nivel de Stock',
      cell: (product) => {
        if (!product || product.min_stock === undefined || product.current_stock === undefined) {
          return <div className="text-muted">Datos incompletos</div>;
        }
        
        const percentage = (product.current_stock / product.min_stock) * 100;
        const missing = Math.max(0, product.min_stock - product.current_stock);

        return (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{product.current_stock} {product.unit || 'unidad'}</span>
              <span className="text-muted">de {product.min_stock}</span>
            </div>
            <ProgressBar
              value={Math.min(percentage, 100)}
              max={100}
              variant={
                percentage <= 10 ? 'danger' :
                percentage <= 30 ? 'warning' :
                percentage <= 100 ? 'info' :
                'success'
              }
              showLabel={false}
              height="8px"
            />
            <div className="flex justify-between text-xs">
              <span className="text-muted">{percentage.toFixed(1)}%</span>
              {missing > 0 && (
                <span className="text-danger font-medium">
                  -{missing} {product.unit || 'unidad'}
                </span>
              )}
            </div>
          </div>
        );
      },
      width: '200px'
    },
    {
      id: 'value',
      header: 'Valor',
      cell: (product) => {
        const price = parseFloat(product.price) || 0;
        const currentStock = parseFloat(product.current_stock) || 0;
        const totalValue = price * currentStock;
        
        return (
          <div className="space-y-1">
            <div className="font-medium">
              {formatCurrency(totalValue)}
            </div>
            <div className="text-xs text-muted">
              {formatCurrency(price)} c/u
            </div>
            {product.last_purchase_price && (
              <div className="text-xs text-muted-light">
                Compra: {formatCurrency(product.last_purchase_price)}
              </div>
            )}
          </div>
        );
      },
      width: '140px'
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: (product) => (
        <div className="flex gap-2">
          <Button
            size="small"
            variant="outline"
            onClick={() => handleRestockClick(product)}
            tooltip="Reponer stock"
            icon={<FiTrendingUp />}
            className="shrink-0"
          />

          <Button
            size="small"
            variant="primary"
            onClick={() => window.open(`/products/${product.id}`, '_blank')}
            tooltip="Ver detalles"
            icon={<FiInfo />}
            className="shrink-0"
          />

          <Button
            size="small"
            variant="secondary"
            onClick={() => {
              window.location.href = `/inventory/history?product=${product.id}`;
            }}
            tooltip="Ver historial"
            icon={<FiClock />}
            className="shrink-0"
          />
        </div>
      ),
      width: '140px',
      align: 'center'
    }
  ], [getStockStatus, handleRestockClick]);

  // ✅ ESTADOS DE CARGA
  if (loading) {
    return (
      <Card
        title={
          <div className="flex items-center">
            <FiAlertTriangle className="text-warning mr-2" />
            Alertas de Stock
          </div>
        }
        subtitle="Cargando información de stock..."
      >
        <div className="space-y-4 py-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} height="60px" className="rounded-lg" />
          ))}
        </div>
      </Card>
    );
  }

  // ✅ SIN ALERTAS
  if (lowStockProducts.length === 0) {
    return (
      <Card
        title={
          <div className="flex items-center">
            <FiCheckCircle className="text-success mr-2" />
            Alertas de Stock
          </div>
        }
        subtitle="Estado actual del inventario"
      >
        <div className="text-center py-8 px-4">
          <div className="empty-state-icon bg-success-light">
            <FiCheckCircle className="text-success" />
          </div>
          <h3 className="empty-state-title">
            ¡Todo en orden!
          </h3>
          <p className="empty-state-description">
            No hay productos con stock bajo en este momento.
            Todos los niveles de inventario están dentro de los parámetros establecidos.
          </p>
          <div className="empty-state-actions">
            <Button
              variant="outline"
              icon={<FiRefresh />}
              onClick={() => loadStockAlerts(true)}
              loading={refreshing}
            >
              Actualizar
            </Button>

            <Button
              variant="secondary"
              icon={<FiSettings />}
              onClick={() => window.location.href = '/inventory/settings'}
            >
              Configurar Alertas
            </Button>
          </div>
          <div className="empty-state-footer">
            Última verificación: {lastUpdateRef.current
              ? formatDate(lastUpdateRef.current, 'dd/MM/yyyy HH:mm')
              : 'Nunca'}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ✅ HEADER CON ESTADÍSTICAS */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Alertas de Stock
          </h1>
          <p className="page-subtitle">
            {filteredProducts.length} productos requieren atención
            {criticalStockProducts.length > 0 &&
              ` (${criticalStockProducts.length} críticos)`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="last-update">
            <FiClock className="mr-1.5" />
            {lastUpdateRef.current
              ? `Actualizado: ${formatDate(lastUpdateRef.current, 'HH:mm')}`
              : 'Sin actualizar'
            }
          </div>

          <Button
            variant="outline"
            icon={<FiRefresh />}
            onClick={() => loadStockAlerts(true)}
            loading={refreshing}
            tooltip="Actualizar alertas"
            size="small"
          />
        </div>
      </div>

      {/* ✅ PANEL DE ESTADÍSTICAS */}
      {statistics && (
        <div className="stats-grid">
          <div className="stat-card-danger">
            <div className="stat-header">
              <div>
                <div className="stat-label">Críticos</div>
                <div className="stat-value">
                  {statistics.criticalCount + statistics.outOfStockCount}
                </div>
                <div className="stat-description">
                  {statistics.outOfStockCount} agotados
                </div>
              </div>
              <div className="stat-icon">
                <FiAlertTriangle className="text-danger" />
              </div>
            </div>
          </div>

          <div className="stat-card-warning">
            <div className="stat-header">
              <div>
                <div className="stat-label">En Riesgo</div>
                <div className="stat-value">
                  {statistics.lowCount + statistics.warningCount}
                </div>
                <div className="stat-description">
                  {statistics.warningCount} en advertencia
                </div>
              </div>
              <div className="stat-icon">
                <FiBell className="text-warning" />
              </div>
            </div>
          </div>

          <div className="stat-card-info">
            <div className="stat-header">
              <div>
                <div className="stat-label">Valor en Riesgo</div>
                <div className="stat-value">
                  {formatCurrency(statistics.totalValueAtRisk)}
                </div>
                <div className="stat-description">
                  {formatCurrency(statistics.totalValueAtRisk / statistics.totalProducts)} promedio
                </div>
              </div>
              <div className="stat-icon">
                <FiDollarSign className="text-info" />
              </div>
            </div>
          </div>

          <div className="stat-card-primary">
            <div className="stat-header">
              <div>
                <div className="stat-label">Unidades Faltantes</div>
                <div className="stat-value">
                  {formatNumber(statistics.totalMissingUnits)}
                </div>
                <div className="stat-description">
                  {statistics.avgStockPercentage.toFixed(1)}% del mínimo
                </div>
              </div>
              <div className="stat-icon">
                <FiPackage className="text-primary" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ FILTROS Y ACCIONES */}
      <div className="card">
        <div className="card-header">
          <div className="filters-container">
            {/* Filtros */}
            <div className="filters-group">
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                disabled={loading}
              >
                <option value="">Todos los estados</option>
                <option value="crítico">Solo Críticos</option>
                <option value="bajo">Solo Bajos</option>
                <option value="advertencia">Solo Advertencia</option>
                <option value="agotado">Solo Agotados</option>
              </select>

              <select
                className="form-select"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                disabled={loading}
              >
                <option value="critical">Ordenar por criticidad</option>
                <option value="missing">Ordenar por faltantes</option>
                <option value="name">Ordenar por nombre</option>
              </select>
            </div>

            {/* Acciones */}
            <div className="actions-group">
              <Button
                variant="outline"
                icon={<FiDownload />}
                onClick={exportAlertsToCSV}
                size="small"
                disabled={filteredProducts.length === 0 || loading}
              >
                Exportar CSV
              </Button>

              <Button
                variant="outline"
                icon={<FiMail />}
                onClick={sendEmailAlert}
                loading={sendEmailLoading}
                size="small"
                disabled={filteredProducts.length === 0 || loading}
              >
                Enviar Alerta
              </Button>

              {criticalStockProducts.length > 0 && (
                <Button
                  variant="danger"
                  icon={<FiTrendingUp />}
                  onClick={handleQuickRestockAll}
                  size="small"
                  disabled={loading}
                >
                  Reponer Críticos
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ✅ TABLA DE PRODUCTOS */}
        <div className="table-container">
          <Table
            columns={columns}
            data={filteredProducts}
            emptyMessage={
              <div className="empty-table">
                <div className="empty-icon">
                  <FiPackage />
                </div>
                <h3 className="empty-title">
                  No hay productos con los filtros aplicados
                </h3>
                <p className="empty-description">
                  Intenta con otros filtros
                </p>
              </div>
            }
            rowClassName={(product) => {
              const status = getStockStatus(product);
              return `table-row-${status.color}`;
            }}
            loading={refreshing}
          />
        </div>

        {/* ✅ PIE DE TABLA */}
        <div className="table-footer">
          <div className="table-footer-content">
            <span>
              Mostrando {filteredProducts.length} de {lowStockProducts.length} productos
            </span>
            <div className="table-footer-help">
              <FiInfo className="text-muted" />
              <span>Haz clic en cualquier fila para más opciones</span>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ RECOMENDACIONES */}
      <div className="recommendations-card">
        <h3 className="recommendations-title">
          <FiBarChart2 className="mr-2" />
          Recomendaciones
        </h3>
        <div className="recommendations-grid">
          <div className="recommendation-item">
            <div className="recommendation-header">
              <div className="priority-dot priority-high"></div>
              <span className="priority-text">Prioridad Alta</span>
            </div>
            <p className="recommendation-description">
              Reponga inmediatamente productos en <strong>stock crítico</strong> y agotados
            </p>
          </div>

          <div className="recommendation-item">
            <div className="recommendation-header">
              <div className="priority-dot priority-medium"></div>
              <span className="priority-text">Prioridad Media</span>
            </div>
            <p className="recommendation-description">
              Programe pedidos para productos en <strong>stock bajo</strong>
            </p>
          </div>

          <div className="recommendation-item">
            <div className="recommendation-header">
              <div className="priority-dot priority-low"></div>
              <span className="priority-text">Prevención</span>
            </div>
            <p className="recommendation-description">
              Mantenga un <strong>stock de seguridad</strong> del 20-30% sobre el mínimo
            </p>
          </div>
        </div>
      </div>

      {/* ✅ MODAL DE REPOSICIÓN */}
      <Modal
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        title="Reponer Stock"
        size="medium"
        closeOnOverlayClick={false}
      >
        {selectedProduct && (
          <div className="space-y-6">
            {/* Información del producto */}
            <div className="product-card">
              <div className="flex items-center">
                <div className="product-avatar">
                  <FiPackage className="text-primary" />
                </div>
                <div className="ml-4">
                  <h4 className="product-title">{selectedProduct.name}</h4>
                  <div className="product-tags">
                    <span className="product-tag">
                      SKU: {selectedProduct.sku}
                    </span>
                    <span className="product-tag">
                      {selectedProduct.category_name}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Estadísticas actuales */}
            <div className="stock-stats-grid">
              <div className="stock-stat">
                <div className="stock-stat-label">Stock Actual</div>
                <div className="stock-stat-value text-danger">
                  {selectedProduct.current_stock} {selectedProduct.unit}
                </div>
                <div className="stock-stat-description">
                  {((selectedProduct.current_stock / selectedProduct.min_stock) * 100).toFixed(1)}% del mínimo
                </div>
              </div>

              <div className="stock-stat">
                <div className="stock-stat-label">Stock Mínimo</div>
                <div className="stock-stat-value">
                  {selectedProduct.min_stock} {selectedProduct.unit}
                </div>
                <div className="stock-stat-description">
                  Objetivo mínimo establecido
                </div>
              </div>
            </div>

            {/* Configuración de reposición */}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="restock-quantity"
                  className="form-label"
                >
                  <div className="flex justify-between items-center">
                    <span>Cantidad a Reponer</span>
                    <button
                      type="button"
                      onClick={() => {
                        const suggested = selectedProduct.min_stock * 2 - selectedProduct.current_stock;
                        setRestockQuantity(suggested > 0 ? suggested : selectedProduct.min_stock);
                      }}
                      className="btn-link"
                    >
                      Usar cantidad sugerida
                    </button>
                  </div>
                </label>

                <div className="quantity-input-group">
                  <input
                    id="restock-quantity"
                    type="number"
                    min="1"
                    step="1"
                    value={restockQuantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      setRestockQuantity(isNaN(value) ? 0 : Math.max(1, value));
                    }}
                    className="form-input"
                    placeholder="Cantidad..."
                  />
                  <span className="quantity-unit">{selectedProduct.unit}</span>
                </div>
              </div>

              {/* Previsualización */}
              <div className="preview-card">
                <div className="preview-header">
                  <div>
                    <div className="preview-label">Nuevo Stock</div>
                    <div className="preview-value text-success">
                      {selectedProduct.current_stock + restockQuantity} {selectedProduct.unit}
                    </div>
                  </div>
                  <div className="preview-right">
                    <div className="preview-label">Inversión</div>
                    <div className="preview-value">
                      {formatCurrency((selectedProduct.price || 0) * restockQuantity)}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <ProgressBar
                    value={((selectedProduct.current_stock + restockQuantity) / selectedProduct.min_stock) * 100}
                    max={100}
                    variant={
                      ((selectedProduct.current_stock + restockQuantity) / selectedProduct.min_stock) >= 2
                        ? 'success' : 'info'
                    }
                    showLabel
                    label={`${(((selectedProduct.current_stock + restockQuantity) / selectedProduct.min_stock) * 100).toFixed(1)}% del mínimo`}
                    height="10px"
                  />
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="modal-actions">
              <Button
                variant="outline"
                onClick={() => setIsRestockModalOpen(false)}
              >
                Cancelar
              </Button>

              <Button
                variant="primary"
                onClick={handleRestock}
                disabled={restockQuantity <= 0}
                icon={<FiTrendingUp />}
                className="btn-confirm"
              >
                Confirmar Reposición
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StockAlert;