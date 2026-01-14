import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types'; // ✅ Importación agregada
import { reportService } from '../../services/reportService';
import { inventoryService } from '../../services/inventoryService';
import Table from '../common/Table';
import Card from '../common/Card';
import Button from '../common/Button';
import { formatCurrency, formatNumber, formatDate } from '../../utils/helpers';
import { useNotification } from '../../context/NotificationContext';
import {
  FiDownload,
  FiFilter,
  FiRefresh,
  FiPrinter,
  FiMail,
  FiChevronDown,
  FiChevronUp,
  FiShoppingCart,
  FiEye,
  FiSettings,
  FiAlertTriangle,
  FiPackage,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiGrid,
  FiList,
  FiCheck,
  FiX
} from 'react-icons/fi';
import ExportOptions from './ExportOptions';
import DateRangePicker from '../common/DateRangePicker';
import './assets/styles/index.css';

const InventoryReport = () => {
  const { success, error, withLoadingNotification } = useNotification();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    format: 'json',
    email: false,
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    category_id: '',
    min_stock: '',
    max_stock: '',
    status: 'all',
    sort_by: 'name_asc',
    page: 1,
    page_size: 20,
    search: ''
  });
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    total_pages: 0,
    current_page: 1
  });
  const [lastUpdate, setLastUpdate] = useState(null);

  // ✅ Referencia para abortar peticiones
  const abortControllerRef = useRef(null);

  // ✅ Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ✅ Cargar datos cuando cambian filtros con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadReport();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters]);

  // ✅ Cargar datos iniciales
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      const [categoriesResponse, reportResponse] = await Promise.all([
        inventoryService.getCategories({ signal }),
        reportService.generateInventoryReport({
          ...filters,
          signal
        })
      ]);

      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data || []);
      } else {
        console.warn('Error cargando categorías:', categoriesResponse.message);
      }

      if (reportResponse.success) {
        setReportData(reportResponse.data);
        setPagination(reportResponse.data.pagination || {
          total: reportResponse.data.summary?.total_products || 0,
          total_pages: 1,
          current_page: 1
        });
        setLastUpdate(new Date().toISOString());
      } else {
        error(reportResponse.message || 'Error cargando reporte de inventario');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        error('Error cargando datos iniciales');
        console.error('Error loading initial data:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [filters, error]);

  // ✅ Cargar reporte
  const loadReport = useCallback(async () => {
    try {
      setLoading(true);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      const response = await reportService.generateInventoryReport({
        ...filters,
        signal
      });

      if (response.success) {
        setReportData(response.data);
        setPagination(response.data.pagination || {
          total: response.data.summary?.total_products || 0,
          total_pages: 1,
          current_page: 1
        });
        setLastUpdate(new Date().toISOString());
      } else {
        error(response.message || 'Error cargando reporte');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        error('Error cargando reporte de inventario');
        console.error('Error loading report:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [filters, error]);

  // ✅ Cambiar filtro
  const handleFilterChange = useCallback((field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1
    }));
  }, []);

  // ✅ Cambiar página
  const handlePageChange = useCallback((page) => {
    setFilters(prev => ({
      ...prev,
      page
    }));
  }, []);

  // ✅ Cambiar tamaño de página
  const handlePageSizeChange = useCallback((page_size) => {
    setFilters(prev => ({
      ...prev,
      page_size,
      page: 1
    }));
  }, []);

  // ✅ Resetear filtros
  const resetFilters = useCallback(() => {
    setFilters({
      format: 'json',
      email: false,
      start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      category_id: '',
      min_stock: '',
      max_stock: '',
      status: 'all',
      sort_by: 'name_asc',
      page: 1,
      page_size: 20,
      search: ''
    });
  }, []);

  // ✅ Generar reporte
  const generateReport = useCallback(async () => {
    try {
      setLoading(true);

      if (filters.format === 'pdf') {
        await withLoadingNotification(
          reportService.generateInventoryReport({ ...filters, format: 'pdf' }),
          'Generando PDF...'
        );
        success('PDF generado exitosamente');
        return;
      }

      if (filters.email) {
        await withLoadingNotification(
          reportService.sendReportByEmail('inventory', filters),
          'Enviando reporte por email...'
        );
        success('Reporte enviado por email exitosamente');
        return;
      }

      await loadReport();
      success('Reporte generado exitosamente');
    } catch (err) {
      error('Error generando reporte');
    } finally {
      setLoading(false);
    }
  }, [filters, loadReport, withLoadingNotification, success, error]);

  // ✅ Exportar reporte
  const handleExport = useCallback(async (exportConfig) => {
    try {
      const selectedIds = Array.from(selectedProducts);
      await withLoadingNotification(
        reportService.exportReport({
          ...exportConfig,
          product_ids: selectedIds.length > 0 ? selectedIds : undefined,
          filters
        }),
        'Exportando reporte...'
      );
      success('Reporte exportado exitosamente');
      setShowExportModal(false);
      setSelectedProducts(new Set());
    } catch (err) {
      error('Error al exportar el reporte');
    }
  }, [selectedProducts, filters, withLoadingNotification, success, error]);

  // ✅ Imprimir reporte
  const printReport = useCallback(() => {
    const printContent = document.getElementById('printable-report');
    if (!printContent) return;

    const originalContents = document.body.innerHTML;
    const printWindow = window.open('', '_blank');

    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Reporte de Inventario - ${new Date().toLocaleDateString()}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
              h1 { color: #1a237e; border-bottom: 2px solid #1a237e; padding-bottom: 10px; }
              h2 { color: #283593; margin-top: 25px; }
              h3 { color: #3949ab; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
              th { background-color: #e8eaf6; font-weight: 600; }
              .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
              .summary-card { padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .summary-card.total { background-color: #e3f2fd; border: 1px solid #bbdefb; }
              .summary-card.in-stock { background-color: #e8f5e9; border: 1px solid #c8e6c9; }
              .summary-card.out-stock { background-color: #ffebee; border: 1px solid #ffcdd2; }
              .summary-card.low-stock { background-color: #fff3e0; border: 1px solid #ffe0b2; }
              .summary-number { font-size: 2em; font-weight: bold; margin: 10px 0; }
              .badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 0.85em; font-weight: 500; }
              .badge-success { background-color: #4caf50; color: white; }
              .badge-warning { background-color: #ff9800; color: white; }
              .badge-danger { background-color: #f44336; color: white; }
              .badge-info { background-color: #2196f3; color: white; }
              .no-print { display: none !important; }
              @page { margin: 1cm; }
              @media print {
                body { margin: 0; }
                .no-print { display: none !important; }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);

      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  }, []);

  // ✅ Alternar categoría
  const toggleCategory = useCallback((category) => {
    setExpandedCategories(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(category)) {
        newExpanded.delete(category);
      } else {
        newExpanded.add(category);
      }
      return newExpanded;
    });
  }, []);

  // ✅ Seleccionar producto
  const toggleProductSelection = useCallback((productId) => {
    setSelectedProducts(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(productId)) {
        newSelected.delete(productId);
      } else {
        newSelected.add(productId);
      }
      return newSelected;
    });
  }, []);

  // ✅ Seleccionar todos los productos
  const selectAllProducts = useCallback(() => {
    if (!reportData?.detailed_report) return;

    if (selectedProducts.size === reportData.detailed_report.length) {
      setSelectedProducts(new Set());
    } else {
      const allIds = reportData.detailed_report.map(p => p.id).filter(id => id);
      setSelectedProducts(new Set(allIds));
    }
  }, [reportData, selectedProducts.size]);

  // ✅ Generar orden de compra
  const generatePurchaseOrder = useCallback(async () => {
    if (selectedProducts.size === 0) {
      error('Por favor, selecciona al menos un producto');
      return;
    }

    try {
      await withLoadingNotification(
        inventoryService.generatePurchaseOrder(Array.from(selectedProducts)),
        'Generando orden de compra...'
      );
      success('Orden de compra generada exitosamente');
      setSelectedProducts(new Set());
    } catch (err) {
      error('Error al generar orden de compra');
    }
  }, [selectedProducts, withLoadingNotification, success, error]);

  // ✅ Columnas de la tabla
  const columns = useMemo(() => [
    {
      key: 'selection',
      label: (
        <input
          type="checkbox"
          checked={reportData?.detailed_report &&
            selectedProducts.size === reportData.detailed_report.length &&
            reportData.detailed_report.length > 0}
          onChange={selectAllProducts}
          className="inventory-checkbox"
          disabled={!reportData?.detailed_report || reportData.detailed_report.length === 0}
        />
      ),
      cell: (product) => (
        <input
          type="checkbox"
          checked={selectedProducts.has(product.id)}
          onChange={() => toggleProductSelection(product.id)}
          className="inventory-checkbox"
        />
      ),
      width: '50px'
    },
    {
      key: 'name',
      label: 'Producto',
      cell: (product) => (
        <div className="inventory-product-cell">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="inventory-product-image"
              onError={(e) => {
                e.target.src = '/images/placeholder-product.png';
                e.target.onerror = null;
              }}
            />
          ) : (
            <div className="inventory-product-placeholder">
              <FiPackage className="inventory-product-placeholder-icon" />
            </div>
          )}
          <div className="inventory-product-info">
            <span className="inventory-product-name">{product.name || 'Sin nombre'}</span>
            {product.brand && (
              <div className="inventory-product-brand">{product.brand}</div>
            )}
          </div>
        </div>
      ),
      sortable: true
    },
    {
      key: 'sku',
      label: 'SKU',
      cell: (product) => (
        <span className="inventory-sku">{product.sku || 'N/A'}</span>
      ),
      sortable: true
    },
    {
      key: 'category_name',
      label: 'Categoría',
      cell: (product) => product.category_name || 'Sin categoría',
      sortable: true
    },
    {
      key: 'current_stock',
      label: 'Stock',
      cell: (product) => {
        const currentStock = Number(product.current_stock) || 0;
        const minStock = Number(product.min_stock) || 0;
        const maxStock = Number(product.max_stock) || Infinity;
        const unit = product.unit || 'unidades';

        const isLowStock = currentStock <= minStock;
        const isOutOfStock = currentStock === 0;
        const isOverStock = currentStock > maxStock;

        let className = 'inventory-stock-cell ';
        let icon = null;

        if (isOutOfStock) {
          className += 'inventory-stock-out';
          icon = <FiX className="inventory-stock-icon" />;
        } else if (isLowStock) {
          className += 'inventory-stock-low';
          icon = <FiAlertTriangle className="inventory-stock-icon" />;
        } else if (isOverStock) {
          className += 'inventory-stock-over';
          icon = <FiTrendingUp className="inventory-stock-icon" />;
        } else {
          className += 'inventory-stock-normal';
          icon = <FiCheck className="inventory-stock-icon" />;
        }

        return (
          <div className={className}>
            {icon}
            <span className="inventory-stock-value">{formatNumber(currentStock)} {unit}</span>
            <div className="inventory-stock-limits">
              Min: {formatNumber(minStock)} | Max: {formatNumber(maxStock)}
            </div>
          </div>
        );
      },
      sortable: true
    },
    {
      key: 'price',
      label: 'Precio',
      cell: (product) => formatCurrency(product.price || 0),
      sortable: true
    },
    {
      key: 'total_value',
      label: 'Valor Total',
      cell: (product) => {
        const price = Number(product.price) || 0;
        const stock = Number(product.current_stock) || 0;
        return (
          <div className="inventory-total-value">
            {formatCurrency(price * stock)}
          </div>
        );
      },
      sortable: true
    },
    {
      key: 'stock_status',
      label: 'Estado',
      cell: (product) => {
        const statusConfig = {
          in_stock: { label: 'En Stock', color: 'success', icon: FiCheck },
          low_stock: { label: 'Stock Bajo', color: 'warning', icon: FiAlertTriangle },
          out_of_stock: { label: 'Sin Stock', color: 'danger', icon: FiX },
          over_stock: { label: 'Exceso', color: 'info', icon: FiTrendingUp },
        };

        const status = product.stock_status || 'in_stock';
        const config = statusConfig[status] || statusConfig.in_stock;
        const Icon = config.icon;

        return (
          <span className={`inventory-status-badge inventory-status-${config.color}`}>
            <Icon className="inventory-status-icon" />
            {config.label}
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'Acciones',
      cell: (product) => (
        <div className="inventory-actions">
          <Button
            size="small"
            variant="outline"
            onClick={() => window.open(`/products/${product.id}`, '_blank')}
            startIcon={<FiEye />}
            className="inventory-action-button"
          >
            Ver
          </Button>
          <Button
            size="small"
            variant="outline"
            onClick={() => window.open(`/inventory/movements?product=${product.id}`, '_blank')}
            startIcon={<FiList />}
            className="inventory-action-button"
          >
            Movimientos
          </Button>
        </div>
      )
    },
  ], [reportData, selectedProducts, selectAllProducts, toggleProductSelection]);

  // ✅ Análisis por categoría
  const getCategoryAnalysis = useMemo(() => {
    if (!reportData?.detailed_report) return {};

    const analysis = {};
    reportData.detailed_report.forEach(product => {
      const category = product.category_name || 'Sin categoría';
      if (!analysis[category]) {
        analysis[category] = {
          products: 0,
          in_stock: 0,
          low_stock: 0,
          out_of_stock: 0,
          over_stock: 0,
          total_value: 0,
          productsList: [],
        };
      }

      analysis[category].products++;

      const price = Number(product.price) || 0;
      const stock = Number(product.current_stock) || 0;
      analysis[category].total_value += price * stock;
      analysis[category].productsList.push(product);

      const status = product.stock_status || 'in_stock';
      if (status === 'in_stock') {
        analysis[category].in_stock++;
      } else if (status === 'low_stock') {
        analysis[category].low_stock++;
      } else if (status === 'out_of_stock') {
        analysis[category].out_of_stock++;
      } else if (status === 'over_stock') {
        analysis[category].over_stock++;
      }
    });

    return analysis;
  }, [reportData]);

  // ✅ Estado de carga
  if (loading && !reportData) {
    return (
      <div className="inventory-loading-container">
        <Card title="Reporte de Inventario" className="inventory-card">
          <div className="inventory-loading-content">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="inventory-loading-item">
                <div className="inventory-loading-line"></div>
                <div className="inventory-loading-line short"></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="inventory-report-container">
      {/* ✅ Modal de exportación */}
      {showExportModal && (
        <ExportOptions
          data={reportData}
          reportType="inventory"
          fileName={`inventory-report-${new Date().toISOString().split('T')[0]}`}
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          exportConfig={{
            selectedCount: selectedProducts.size,
            totalCount: reportData?.summary?.total_products || 0,
            lastUpdate: lastUpdate
          }}
        />
      )}

      {/* ✅ Header */}
      <div className="inventory-header">
        <div className="inventory-header-content">
          <h1 className="inventory-title">Reporte de Inventario</h1>
          <p className="inventory-subtitle">
            Análisis completo del inventario actual •
            Última actualización: {lastUpdate ? formatDate(lastUpdate, 'full') : 'Cargando...'}
          </p>
        </div>

        <div className="inventory-header-actions">
          {selectedProducts.size > 0 && (
            <div className="inventory-selection-badge">
              <span className="inventory-selection-count">
                {selectedProducts.size} seleccionados
              </span>
              <div className="inventory-selection-actions">
                <button
                  onClick={generatePurchaseOrder}
                  className="inventory-selection-action"
                  title="Generar orden de compra"
                  aria-label="Generar orden de compra para productos seleccionados"
                >
                  <FiShoppingCart className="inventory-selection-action-icon" />
                </button>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="inventory-selection-action"
                  title="Exportar seleccionados"
                  aria-label="Exportar productos seleccionados"
                >
                  <FiDownload className="inventory-selection-action-icon" />
                </button>
              </div>
            </div>
          )}

          <Button
            variant="outline"
            startIcon={showFilters ? <FiChevronUp /> : <FiChevronDown />}
            onClick={() => setShowFilters(!showFilters)}
            className="inventory-filter-toggle"
          >
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </Button>

          <Button
            variant="outline"
            startIcon={<FiPrinter />}
            onClick={printReport}
            className="inventory-print-button"
          >
            Imprimir
          </Button>

          <Button
            variant="primary"
            startIcon={<FiDownload />}
            onClick={() => setShowExportModal(true)}
            className="inventory-export-button"
          >
            Exportar
          </Button>
        </div>
      </div>

      {/* ✅ Filtros */}
      {showFilters && (
        <Card title="Filtros Avanzados" className="inventory-filters-card">
          <div className="inventory-filters-content">
            <div className="inventory-filters-grid">
              <DateRangePicker
                startDate={filters.start_date}
                endDate={filters.end_date}
                onStartDateChange={(date) => handleFilterChange('start_date', date)}
                onEndDateChange={(date) => handleFilterChange('end_date', date)}
                presets={[
                  { label: 'Hoy', days: 0 },
                  { label: 'Última semana', days: 7 },
                  { label: 'Último mes', days: 30 },
                  { label: 'Último trimestre', days: 90 },
                ]}
                className="inventory-date-picker"
              />

              <div className="inventory-filter-group">
                <label className="inventory-filter-label">Categoría</label>
                <select
                  value={filters.category_id}
                  onChange={(e) => handleFilterChange('category_id', e.target.value)}
                  className="inventory-filter-select"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="inventory-filter-group">
                <label className="inventory-filter-label">Estado</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="inventory-filter-select"
                >
                  <option value="all">Todos</option>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="discontinued">Descontinuado</option>
                </select>
              </div>

              <div className="inventory-filter-group">
                <label className="inventory-filter-label">Ordenar por</label>
                <select
                  value={filters.sort_by}
                  onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                  className="inventory-filter-select"
                >
                  <option value="name_asc">Nombre (A-Z)</option>
                  <option value="name_desc">Nombre (Z-A)</option>
                  <option value="stock_asc">Stock (menor a mayor)</option>
                  <option value="stock_desc">Stock (mayor a menor)</option>
                  <option value="value_asc">Valor (menor a mayor)</option>
                  <option value="value_desc">Valor (mayor a menor)</option>
                </select>
              </div>
            </div>

            <div className="inventory-filters-secondary">
              <div className="inventory-filter-group">
                <label className="inventory-filter-label">Búsqueda</label>
                <div className="inventory-search-container">
                  <FiFilter className="inventory-search-icon" />
                  <input
                    type="text"
                    className="inventory-search-input"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Buscar por nombre, SKU..."
                  />
                </div>
              </div>

              <div className="inventory-filter-group">
                <label className="inventory-filter-label">Stock Mínimo</label>
                <input
                  type="number"
                  min="0"
                  className="inventory-filter-input"
                  value={filters.min_stock}
                  onChange={(e) => handleFilterChange('min_stock', e.target.value)}
                  placeholder="Ej: 10"
                />
              </div>

              <div className="inventory-filter-group">
                <label className="inventory-filter-label">Stock Máximo</label>
                <input
                  type="number"
                  min="0"
                  className="inventory-filter-input"
                  value={filters.max_stock}
                  onChange={(e) => handleFilterChange('max_stock', e.target.value)}
                  placeholder="Ej: 100"
                />
              </div>
            </div>

            <div className="inventory-filters-footer">
              <div className="inventory-filters-options">
                <label className="inventory-checkbox-label">
                  <input
                    type="checkbox"
                    id="send-email"
                    className="inventory-checkbox"
                    checked={filters.email}
                    onChange={(e) => handleFilterChange('email', e.target.checked)}
                  />
                  <span className="inventory-checkbox-text">Enviar por email</span>
                </label>
              </div>

              <div className="inventory-filters-actions">
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="inventory-clear-button"
                >
                  Limpiar
                </Button>

                <Button
                  variant="outline"
                  startIcon={<FiRefresh />}
                  onClick={loadReport}
                  className="inventory-refresh-button"
                >
                  Actualizar
                </Button>

                <Button
                  variant="primary"
                  startIcon={<FiFilter />}
                  onClick={generateReport}
                  loading={loading}
                  className="inventory-apply-button"
                >
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ✅ Contenido principal */}
      <div id="printable-report" className="inventory-printable-content">
        {reportData && (
          <>
            {/* ✅ Resumen */}
            <Card title="Resumen del Inventario" className="inventory-summary-card">
              <div className="inventory-summary-grid">
                <div className="inventory-summary-item inventory-summary-total">
                  <div className="inventory-summary-value">
                    {reportData.summary?.total_products || 0}
                  </div>
                  <div className="inventory-summary-label">Total Productos</div>
                  <div className="inventory-summary-detail">
                    Valor: {formatCurrency(reportData.detailed_report?.reduce((sum, p) =>
                      sum + ((p.price || 0) * (p.current_stock || 0)), 0) || 0)}
                  </div>
                </div>

                <div className="inventory-summary-item inventory-summary-instock">
                  <div className="inventory-summary-value">
                    {reportData.summary?.in_stock || 0}
                  </div>
                  <div className="inventory-summary-label">En Stock</div>
                  <div className="inventory-summary-percentage">
                    {reportData.summary?.total_products ?
                      ((reportData.summary.in_stock / reportData.summary.total_products) * 100).toFixed(1) + '%' :
                      '0%'
                    }
                  </div>
                </div>

                <div className="inventory-summary-item inventory-summary-outstock">
                  <div className="inventory-summary-value">
                    {reportData.summary?.out_of_stock || 0}
                  </div>
                  <div className="inventory-summary-label">Sin Stock</div>
                  <div className="inventory-summary-percentage">
                    {reportData.summary?.total_products ?
                      ((reportData.summary.out_of_stock / reportData.summary.total_products) * 100).toFixed(1) + '%' :
                      '0%'
                    }
                  </div>
                </div>

                <div className="inventory-summary-item inventory-summary-lowstock">
                  <div className="inventory-summary-value">
                    {reportData.summary?.low_stock || 0}
                  </div>
                  <div className="inventory-summary-label">Stock Bajo</div>
                  <div className="inventory-summary-percentage">
                    {reportData.summary?.total_products ?
                      ((reportData.summary.low_stock / reportData.summary.total_products) * 100).toFixed(1) + '%' :
                      '0%'
                    }
                  </div>
                </div>
              </div>

              <div className="inventory-summary-footer">
                <div className="inventory-summary-info">
                  <span>
                    Generado el {formatDate(reportData.generated_at, 'full')}
                    {reportData.generated_by && ` por ${reportData.generated_by}`}
                  </span>
                  <span className="inventory-pagination-badge">
                    Página {pagination.current_page} de {pagination.total_pages}
                  </span>
                </div>
              </div>
            </Card>

            {/* ✅ Productos con stock bajo */}
            {reportData.low_stock_products && reportData.low_stock_products.length > 0 && (
              <Card
                title={
                  <div className="inventory-alert-header">
                    <div className="inventory-alert-indicator"></div>
                    <span className="inventory-alert-title">
                      ⚠️ Productos con Stock Bajo ({reportData.low_stock_products.length})
                    </span>
                  </div>
                }
                className="inventory-alert-card"
              >
                <div className="inventory-alert-actions">
                  <Button
                    variant="outline"
                    size="small"
                    onClick={generatePurchaseOrder}
                    startIcon={<FiShoppingCart />}
                    className="inventory-alert-button"
                  >
                    Generar Orden de Compra
                  </Button>
                </div>
                <Table
                  columns={columns.filter(col =>
                    ['selection', 'name', 'sku', 'current_stock', 'total_value', 'stock_status', 'actions'].includes(col.key)
                  )}
                  data={reportData.low_stock_products}
                  emptyMessage="No hay productos con stock bajo"
                  className="inventory-alert-table"
                />
              </Card>
            )}

            {/* ✅ Reporte detallado */}
            <Card
              title={
                <div className="inventory-detailed-header">
                  <span>Reporte Detallado ({reportData.detailed_report?.length || 0} productos)</span>
                  <div className="inventory-detailed-actions">
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => setShowExportModal(true)}
                      startIcon={<FiDownload />}
                      className="inventory-export-detailed-button"
                    >
                      Exportar
                    </Button>
                  </div>
                </div>
              }
              className="inventory-detailed-card"
            >
              <Table
                columns={columns}
                data={reportData.detailed_report || []}
                emptyMessage={
                  <div className="inventory-empty-state">
                    <FiPackage className="inventory-empty-icon" />
                    <p className="inventory-empty-text">No hay datos disponibles con los filtros aplicados</p>
                    <Button
                      variant="outline"
                      className="inventory-empty-button"
                      onClick={resetFilters}
                    >
                      Limpiar Filtros
                    </Button>
                  </div>
                }
                pagination={{
                  current: pagination.current_page,
                  total: pagination.total_pages,
                  pageSize: filters.page_size,
                  onPageChange: handlePageChange,
                  onPageSizeChange: handlePageSizeChange,
                  showSizeChanger: true,
                  pageSizeOptions: [10, 20, 50, 100]
                }}
                searchable={false}
                sortable={true}
                onSort={(key, direction) => {
                  const sortMap = {
                    name: direction === 'asc' ? 'name_asc' : 'name_desc',
                    current_stock: direction === 'asc' ? 'stock_asc' : 'stock_desc',
                    price: direction === 'asc' ? 'value_asc' : 'value_desc',
                    total_value: direction === 'asc' ? 'value_asc' : 'value_desc',
                    category_name: direction === 'asc' ? 'category_asc' : 'category_desc'
                  };

                  if (sortMap[key]) {
                    handleFilterChange('sort_by', sortMap[key]);
                  }
                }}
                className="inventory-detailed-table"
              />
            </Card>

            {/* ✅ Análisis por categoría */}
            <Card title="Análisis Detallado por Categoría" className="inventory-category-card">
              <div className="inventory-category-content">
                {Object.entries(getCategoryAnalysis).map(([category, data]) => (
                  <div key={category} className="inventory-category-item">
                    <div
                      className="inventory-category-header"
                      onClick={() => toggleCategory(category)}
                    >
                      <div className="inventory-category-info">
                        <div className="inventory-category-name">{category}</div>
                        <div className="inventory-category-stats">
                          {data.products} productos • Valor total: {formatCurrency(data.total_value)}
                        </div>
                      </div>
                      <div className="inventory-category-status">
                        <div className="inventory-category-badges">
                          <span className="inventory-category-badge success">{data.in_stock}</span>
                          <span className="inventory-category-badge warning">{data.low_stock}</span>
                          <span className="inventory-category-badge danger">{data.out_of_stock}</span>
                        </div>
                        <div className="inventory-category-toggle">
                          {expandedCategories.has(category) ? (
                            <FiChevronUp className="inventory-category-toggle-icon" />
                          ) : (
                            <FiChevronDown className="inventory-category-toggle-icon" />
                          )}
                        </div>
                      </div>
                    </div>

                    {expandedCategories.has(category) && (
                      <div className="inventory-category-details">
                        <Table
                          columns={columns.filter(col =>
                            ['selection', 'name', 'sku', 'current_stock', 'price', 'total_value', 'stock_status'].includes(col.key)
                          )}
                          data={data.productsList}
                          pagination={{ pageSize: 5 }}
                          className="inventory-category-table"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* ✅ Recomendaciones */}
            <Card title="Recomendaciones" className="inventory-recommendations-card">
              <div className="inventory-recommendations-content">
                {reportData.summary?.out_of_stock > 0 && (
                  <div className="inventory-recommendation">
                    <div className="inventory-recommendation-icon danger">
                      <span>!</span>
                    </div>
                    <div className="inventory-recommendation-text">
                      <p className="inventory-recommendation-title">
                        {reportData.summary.out_of_stock} productos sin stock
                      </p>
                      <p className="inventory-recommendation-description">
                        Considera realizar pedidos de reposición para estos productos urgentemente.
                      </p>
                    </div>
                  </div>
                )}

                {reportData.summary?.low_stock > 0 && (
                  <div className="inventory-recommendation">
                    <div className="inventory-recommendation-icon warning">
                      <span>⚠</span>
                    </div>
                    <div className="inventory-recommendation-text">
                      <p className="inventory-recommendation-title">
                        {reportData.summary.low_stock} productos con stock bajo
                      </p>
                      <p className="inventory-recommendation-description">
                        Planifica pedidos de reposición para evitar interrupciones.
                      </p>
                    </div>
                  </div>
                )}

                <div className="inventory-recommendation">
                  <div className="inventory-recommendation-icon success">
                    <span>✓</span>
                  </div>
                  <div className="inventory-recommendation-text">
                    <p className="inventory-recommendation-title">
                      {reportData.summary?.in_stock || 0} productos en buen estado de stock
                    </p>
                    <p className="inventory-recommendation-description">
                      Mantén el control regular de estos productos para optimizar el inventario.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* ✅ Footer */}
      <div className="inventory-footer">
        <div className="inventory-footer-content">
          <div className="inventory-footer-info">
            © {new Date().getFullYear()} Sistema de Inventario • v1.0.0
          </div>
          <div className="inventory-footer-actions">
            <Button
              variant="outline"
              size="small"
              onClick={printReport}
              startIcon={<FiPrinter />}
              className="inventory-footer-button"
            >
              Vista para Impresión
            </Button>
            <Button
              variant="outline"
              size="small"
              onClick={() => {
                if (reportData) {
                  try {
                    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `inventario-backup-${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove(); // ✅ más limpio que removeChild
                    URL.revokeObjectURL(url);
                  } catch (err) {
                    console.error('Error descargando backup:', err);
                    error('Error al descargar backup');
                  }
                }
              }}
              startIcon={<FiDownload />}
              className="inventory-footer-button"
            >
              Backup JSON
            </Button>

          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ Prop Types
InventoryReport.propTypes = {
  // No hay props requeridas para este componente
};

export default React.memo(InventoryReport);