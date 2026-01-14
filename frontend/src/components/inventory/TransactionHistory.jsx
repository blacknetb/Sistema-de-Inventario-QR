import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { inventoryService } from '../../services/inventoryService';
import { productService } from '../../services/productService';
import PropTypes from 'prop-types';
import Table from '../common/Table';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import Badge from '../common/Badge';
import Chart from '../common/Chart';
import Skeleton from '../common/Skeleton';
import "../../assets/styles/inventory.css"
import {
  formatDate,
  formatNumber,
  formatCurrency,
  exportToCSV,
} from '../../utils/helpers';
import { useNotification } from '../../context/NotificationContext';
import {
  FiFilter,
  FiRefresh,
  FiTrendingUp,
  FiTrendingDown,
  FiCalendar,
  FiPackage,
  FiUser,
  FiDownload,
  FiBarChart2,
  FiEye,
  FiExternalLink,
  FiSearch,
  FiPrinter,
  FiList,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiX,
} from 'react-icons/fi';

// ✅ Constantes fuera del componente
const MOVEMENT_TYPES = {
  in: { label: 'Entrada', color: 'success', icon: <FiTrendingUp /> },
  out: { label: 'Salida', color: 'danger', icon: <FiTrendingDown /> },
};

const PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;

// ✅ Hook useDebounce optimizado
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

const TransactionHistory = ({
  productId,
  initialLimit = DEFAULT_PAGE_SIZE,
  showProductColumn = true,
}) => {
  // ✅ HOOKS DE CONTEXTO
  const { success, error } = useNotification();

  // ✅ ESTADOS PRINCIPALES
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  // ✅ FILTROS
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    movement_type: '',
    min_quantity: '',
    max_quantity: '',
    reason: '',
    product_id: productId || '',
    created_by: '',
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  // ✅ PAGINACIÓN
  const [pagination, setPagination] = useState({
    page: 1,
    limit: initialLimit,
    totalPages: 1,
    totalItems: 0,
  });

  // ✅ ESTADOS DE UI
  const [showChart, setShowChart] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);

  // ✅ REFERENCIAS
  const filtersRef = useRef(filters);
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  // ✅ DEBOUNCE para filtros
  const debouncedReason = useDebounce(filters.reason, 500);

  // ✅ PROP TYPES
  TransactionHistory.propTypes = {
    productId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    initialLimit: PropTypes.number,
    showProductColumn: PropTypes.bool,
  };

  TransactionHistory.defaultProps = {
    initialLimit: DEFAULT_PAGE_SIZE,
    showProductColumn: true,
  };

  // ✅ EFECTO INICIAL CON CLEANUP
  useEffect(() => {
    isMountedRef.current = true;
    loadInitialData();

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ✅ EFECTO PARA RE-CARGAR CUANDO CAMBIA productId
  useEffect(() => {
    if (!isMountedRef.current) return;

    const newFilters = {
      ...filtersRef.current,
      product_id: productId || '',
    };

    filtersRef.current = newFilters;
    setFilters(newFilters);

    loadTransactions(newFilters, 1);
  }, [productId]);

  // ✅ EFECTO PARA DEBOUNCE DE FILTRO REASON
  useEffect(() => {
    if (isMountedRef.current) {
      const newFilters = { ...filtersRef.current, reason: debouncedReason };
      filtersRef.current = newFilters;
      loadTransactions(newFilters, 1);
    }
  }, [debouncedReason]);

  // ✅ CARGA INICIAL DE DATOS
  const loadInitialData = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      await Promise.all([loadProducts(), loadUsers()]);
      await loadTransactions();
    } catch (err) {
      console.error('Error cargando datos iniciales:', err);
      if (isMountedRef.current) {
        error('Error al cargar los datos iniciales');
      }
    }
  }, [error]);

  // ✅ CARGA DE TRANSACCIONES
  const loadTransactions = useCallback(
    async (newFilters = null, newPage = 1) => {
      if (!isMountedRef.current) return;

      // Cancelar petición anterior si existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Crear nuevo abort controller
      abortControllerRef.current = new AbortController();

      try {
        setRefreshing(true);

        const currentFilters = newFilters || filtersRef.current;
        const currentPage = newPage || pagination.page;
        const currentLimit = pagination.limit;

        // ✅ PREPARAR PARÁMETROS PARA BACKEND
        const params = {
          page: currentPage,
          limit: currentLimit,
          sort_by: currentFilters.sort_by,
          sort_order: currentFilters.sort_order,
          signal: abortControllerRef.current.signal,
        };

        // Agregar filtros condicionalmente
        if (currentFilters.start_date) params.start_date = currentFilters.start_date;
        if (currentFilters.end_date) params.end_date = currentFilters.end_date;
        if (currentFilters.movement_type) params.movement_type = currentFilters.movement_type;
        if (currentFilters.min_quantity) params.min_quantity = parseInt(currentFilters.min_quantity, 10);
        if (currentFilters.max_quantity) params.max_quantity = parseInt(currentFilters.max_quantity, 10);
        if (currentFilters.reason) params.reason = currentFilters.reason;
        if (currentFilters.product_id) params.product_id = currentFilters.product_id;
        if (currentFilters.created_by) params.created_by = currentFilters.created_by;

        const response = await inventoryService.getHistory(params);

        if (response.success && isMountedRef.current) {
          setTransactions(response.data || []);

          // ✅ ACTUALIZAR PAGINACIÓN
          if (response.pagination) {
            setPagination((prev) => ({
              ...prev,
              page: response.pagination.page || currentPage,
              totalPages: response.pagination.totalPages || 1,
              totalItems: response.pagination.total || 0,
              limit: response.pagination.limit || currentLimit,
            }));
          }

          // ✅ ACTUALIZAR REFERENCIA DE FILTROS
          filtersRef.current = currentFilters;
          setFilters(currentFilters);
        } else if (isMountedRef.current) {
          setTransactions([]);
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          console.log('Petición cancelada');
          return;
        }
        console.error('Error cargando transacciones:', err);
        if (isMountedRef.current) {
          error('Error cargando transacciones. Intenta nuevamente.');
          setTransactions([]);
        }
      }
      finally {
        if (isMountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [pagination.page, pagination.limit, error]
  );

  // ✅ CARGA DE PRODUCTOS
  const loadProducts = async () => {
    if (!isMountedRef.current) return;

    try {
      const response = await productService.getAll({
        limit: 100,
        fields: 'id,name,sku,current_stock',
        status: 'active',
      });

      if (response.success && isMountedRef.current) {
        setProducts(response.data || []);
      }
    } catch (err) {
      console.error('Error cargando productos:', err);
      if (isMountedRef.current) {
        setProducts([]);
      }
    }
  };

  // ✅ CARGA DE USUARIOS
  const loadUsers = async () => {
    if (!isMountedRef.current) return;

    try {
      // Simulación de datos de usuarios
      const mockUsers = [
        { id: 1, name: 'Admin Sistema' },
        { id: 2, name: 'Usuario Operativo' },
        { id: 3, name: 'Manager Inventario' },
      ];

      if (isMountedRef.current) {
        setUsers(mockUsers);
      }
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    }
  };

  // ✅ MANEJO DE FILTROS
  const handleFilterChange = useCallback((field, value) => {
    if (!isMountedRef.current) return;

    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);

    if (field !== 'reason') {
      filtersRef.current = newFilters;
      loadTransactions(newFilters, 1);
    }
  }, [filters, loadTransactions]);

  // ✅ MANEJO DE CAMBIO DE PÁGINA
  const handlePageChange = useCallback(
    (newPage) => {
      if (!isMountedRef.current || newPage < 1 || newPage > pagination.totalPages) {
        return;
      }

      setPagination((prev) => ({ ...prev, page: newPage }));
      loadTransactions(filtersRef.current, newPage);
    },
    [pagination.totalPages, loadTransactions]
  );

  // ✅ MANEJO DE TAMAÑO DE PÁGINA
  const handlePageSizeChange = useCallback(
    (newSize) => {
      if (!isMountedRef.current) return;

      const newPageSize = parseInt(newSize, 10);
      setPagination((prev) => ({
        ...prev,
        limit: newPageSize,
        page: 1
      }));

      loadTransactions(filtersRef.current, 1);
    },
    [loadTransactions]
  );

  // ✅ RESET DE FILTROS
  const resetFilters = useCallback(() => {
    if (!isMountedRef.current) return;

    const defaultFilters = {
      start_date: '',
      end_date: '',
      movement_type: '',
      min_quantity: '',
      max_quantity: '',
      reason: '',
      product_id: productId || '',
      created_by: '',
      sort_by: 'created_at',
      sort_order: 'desc',
    };

    setFilters(defaultFilters);
    filtersRef.current = defaultFilters;
    loadTransactions(defaultFilters, 1);
  }, [productId, loadTransactions]);

  // ✅ EXPORTACIÓN
  const exportTransactions = useCallback(
    async (format = 'csv') => {
      if (!isMountedRef.current) return;

      try {
        setExporting(true);

        if (format === 'csv') {
          // ✅ PREPARAR DATOS PARA CSV
          const csvData = transactions.map((transaction) => ({
            'Fecha': formatDate(transaction.created_at, 'dd/MM/yyyy'),
            'Hora': formatDate(transaction.created_at, 'HH:mm:ss'),
            'Producto': transaction.product_name || 'N/A',
            'SKU': transaction.sku || 'N/A',
            'Tipo': MOVEMENT_TYPES[transaction.movement_type]?.label || transaction.movement_type,
            'Cantidad': transaction.quantity,
            'Unidad': transaction.unit || 'unidad',
            'Motivo': transaction.reason || 'N/A',
            'Responsable': transaction.created_by_name || 'N/A',
            'Stock Anterior': transaction.before_stock || 'N/A',
            'Stock Posterior': transaction.after_stock || 'N/A',
            'Referencia': transaction.reference_number || 'N/A',
            'Notas': transaction.notes || 'N/A',
            'Valor Unitario': transaction.price ? formatCurrency(transaction.price) : 'N/A',
            'Valor Total': transaction.price && transaction.quantity
              ? formatCurrency(transaction.price * transaction.quantity)
              : 'N/A',
          }));

          const filename = `transacciones-${productId || 'general'}-${formatDate(new Date(), 'yyyy-MM-dd')}`;
          exportToCSV(csvData, filename);

          if (isMountedRef.current) {
            success('Transacciones exportadas exitosamente');
          }

        } else if (format === 'pdf') {
          // ✅ SIMULACIÓN PARA PDF
          if (isMountedRef.current) {
            success('Función PDF disponible en versión completa');
          }
        }
      } catch (err) {
        console.error('Error exportando transacciones:', err);
        if (isMountedRef.current) {
          error('Error al exportar las transacciones');
        }
      } finally {
        if (isMountedRef.current) {
          setExporting(false);
        }
      }
    },
    [transactions, productId, success, error]
  );

  // ✅ ESTADÍSTICAS OPTIMIZADAS
  const statistics = useMemo(() => {
    if (!transactions.length) return null;

    const stats = transactions.reduce(
      (acc, transaction) => {
        // Totales
        acc.totalTransactions++;

        // Por tipo de movimiento
        if (transaction.movement_type === 'in') {
          acc.totalEntries++;
          acc.totalQuantityIn += parseFloat(transaction.quantity) || 0;
          if (transaction.quantity > acc.largestEntry.quantity) {
            acc.largestEntry = transaction;
          }
        } else {
          acc.totalExits++;
          acc.totalQuantityOut += parseFloat(transaction.quantity) || 0;
          if (transaction.quantity > acc.largestExit.quantity) {
            acc.largestExit = transaction;
          }
        }

        // Fechas
        const date = new Date(transaction.created_at);
        if (!acc.firstDate || date < acc.firstDate) {
          acc.firstDate = date;
        }
        if (!acc.lastDate || date > acc.lastDate) {
          acc.lastDate = date;
        }

        // Agrupación por día para gráficos
        const dateKey = formatDate(transaction.created_at, 'yyyy-MM-dd');
        if (!acc.transactionsByDay[dateKey]) {
          acc.transactionsByDay[dateKey] = { entries: 0, exits: 0 };
        }

        if (transaction.movement_type === 'in') {
          acc.transactionsByDay[dateKey].entries += parseFloat(transaction.quantity) || 0;
        } else {
          acc.transactionsByDay[dateKey].exits += parseFloat(transaction.quantity) || 0;
        }

        return acc;
      },
      {
        totalTransactions: 0,
        totalEntries: 0,
        totalExits: 0,
        totalQuantityIn: 0,
        totalQuantityOut: 0,
        largestEntry: { quantity: 0 },
        largestExit: { quantity: 0 },
        firstDate: null,
        lastDate: null,
        transactionsByDay: {},
      }
    );

    // ✅ CALCULAR BALANCE NETO
    stats.netBalance = stats.totalQuantityIn - stats.totalQuantityOut;
    stats.isPositiveBalance = stats.netBalance >= 0;

    return stats;
  }, [transactions]);

  // ✅ DATOS PARA EL GRÁFICO
  const chartData = useMemo(() => {
    if (!statistics || !showChart || Object.keys(statistics.transactionsByDay).length === 0) {
      return null;
    }

    // ✅ OBTENER ÚLTIMOS 7 DÍAS CON DATOS
    const days = Object.keys(statistics.transactionsByDay)
      .sort((a, b) => new Date(a) - new Date(b))
      .slice(-7);

    return {
      labels: days.map((date) => formatDate(date, 'dd/MM')),
      datasets: [
        {
          label: 'Entradas',
          data: days.map((date) => statistics.transactionsByDay[date]?.entries || 0),
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
          borderColor: '#10B981',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Salidas',
          data: days.map((date) => statistics.transactionsByDay[date]?.exits || 0),
          backgroundColor: 'rgba(239, 68, 68, 0.5)',
          borderColor: '#EF4444',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
        },
      ],
    };
  }, [statistics, showChart]);

  // ✅ COLUMNAS DE TABLA
  const columns = useMemo(() => {
    const baseColumns = [
      {
        id: 'date',
        header: 'Fecha/Hora',
        cell: (transaction) => (
          <div className="space-y-1">
            <div className="font-medium text-primary">
              {formatDate(transaction.created_at, 'dd/MM/yyyy')}
            </div>
            <div className="text-sm text-muted">
              {formatDate(transaction.created_at, 'HH:mm:ss')}
            </div>
          </div>
        ),
        width: '140px',
        sortable: true
      },
      {
        id: 'type',
        header: 'Tipo',
        cell: (transaction) => {
          const type = MOVEMENT_TYPES[transaction.movement_type] || MOVEMENT_TYPES.in;
          return (
            <Badge variant={type.color} icon={type.icon} className="capitalize">
              {type.label}
            </Badge>
          );
        },
        width: '100px',
      },
      {
        id: 'quantity',
        header: 'Cantidad',
        cell: (transaction) => {
          const quantity = parseFloat(transaction.quantity) || 0;
          const isIn = transaction.movement_type === 'in';

          return (
            <div
              className={`quantity-cell ${isIn ? 'text-success' : 'text-danger'}`}
            >
              {isIn ? '+' : '-'}
              {formatNumber(quantity)} {transaction.unit || 'unidad'}
            </div>
          );
        },
        width: '140px',
        sortable: true,
      },
      {
        id: 'stock_change',
        header: 'Cambio de Stock',
        cell: (transaction) => {
          const before = parseFloat(transaction.before_stock) || 0;
          const after = parseFloat(transaction.after_stock) || 0;
          const change = after - before;

          if (before !== 0 || after !== 0) {
            return (
              <div className="space-y-1">
                <div className="flex items-center text-sm">
                  <span className="text-muted">
                    {formatNumber(before)}
                  </span>
                  <span className="mx-2 text-border">→</span>
                  <span className="font-medium text-primary">
                    {formatNumber(after)}
                  </span>
                </div>
                <div
                  className={`stock-change-badge ${change >= 0
                    ? 'stock-change-positive'
                    : 'stock-change-negative'
                    }`}
                >
                  Δ: {change >= 0 ? '+' : ''}
                  {formatNumber(change)}
                </div>
              </div>
            );
          }
          return <span className="text-muted text-sm">N/A</span>;
        },
        width: '160px',
      },
      {
        id: 'reason',
        header: 'Motivo',
        cell: (transaction) => (
          <div
            className="reason-cell"
            onClick={() => setSelectedTransaction(transaction)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setSelectedTransaction(transaction);
              }
            }}
          >
            <div className="reason-text">
              {transaction.reason || 'Sin motivo'}
            </div>

            {transaction.notes && (
              <div className="reason-notes">
                {transaction.notes}
              </div>
            )}
            {transaction.reference_number && (
              <div className="reason-reference">
                Ref: {transaction.reference_number}
              </div>
            )}
          </div>
        ),
        width: '250px',
      },
      {
        id: 'user',
        header: 'Responsable',
        cell: (transaction) => (
          <div className="flex items-center">
            <div className="user-avatar-small">
              <FiUser className="text-primary" />
            </div>
            <div>
              <div className="user-name">{transaction.created_by_name || 'Usuario'}</div>
              <div className="user-department">
                {transaction.department || 'Inventario'}
              </div>
            </div>
          </div>
        ),
        width: '180px',
      },
    ];

    // ✅ AGREGAR COLUMNA DE PRODUCTO SI ES NECESARIO
    if (showProductColumn && !productId) {
      baseColumns.splice(1, 0, {
        id: 'product',
        header: 'Producto',
        cell: (transaction) => (
          <div className="flex items-center">
            <div className="product-icon">
              <FiPackage className="text-muted" />
            </div>
            <div className="min-w-0">
              <div className="product-name">
                {transaction.product_name || 'Producto'}
              </div>
              <div className="product-sku">
                {transaction.sku || 'Sin SKU'}
              </div>
              <div className="product-stock">
                Stock actual: {transaction.after_stock || '0'} {transaction.unit || 'unidad'}
              </div>
            </div>
          </div>
        ),
        width: '250px',
      });
    }

    return baseColumns;
  }, [showProductColumn, productId]);

  // ✅ RENDERIZADO DE GRÁFICO
  const renderChart = () => {
    if (!chartData) {
      return (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                Tendencia de Movimientos
              </h3>
              <p className="card-subtitle">No hay datos suficientes para mostrar el gráfico</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              Tendencia de Movimientos
            </h3>
            <p className="card-subtitle">Últimos 7 días</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="small"
              onClick={() => setViewMode('list')}
              icon={<FiList />}
            >
              Ver Lista
            </Button>
          </div>
        </div>

        <Chart
          type="line"
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
              },
              tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                  label: (context) => {
                    const label = context.dataset.label || '';
                    const value = context.parsed.y;
                    return `${label}: ${formatNumber(value)} unidades`;
                  },
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Cantidad (unidades)',
                },
                ticks: {
                  callback: (value) => formatNumber(value),
                },
              },
              x: {
                title: {
                  display: true,
                  text: 'Fecha',
                },
              },
            },
          }}
          height={300}
        />
      </div>
    );
  };

  // ✅ VISTA DETALLE DE TRANSACCIÓN
  const renderTransactionDetail = () => {
    if (!selectedTransaction) return null;

    const transaction = selectedTransaction;
    const type = MOVEMENT_TYPES[transaction.movement_type] || MOVEMENT_TYPES.in;
    const quantity = parseFloat(transaction.quantity) || 0;
    const beforeStock = parseFloat(transaction.before_stock) || 0;
    const afterStock = parseFloat(transaction.after_stock) || 0;
    const price = parseFloat(transaction.price) || 0;
    const totalValue = price * quantity;

    return (
      <div className="modal-overlay" onClick={() => setSelectedTransaction(null)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-body">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">
                  Detalle de Transacción
                </h2>
                <p className="modal-subtitle">
                  ID: {transaction.id || 'N/A'}
                </p>
              </div>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="modal-close"
                aria-label="Cerrar"
              >
                <FiX />
              </button>
            </div>

            <div className="modal-details">
              {/* Información principal */}
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">Producto</div>
                  <div className="detail-value">
                    {transaction.product_name || 'Producto no especificado'}
                  </div>
                  <div className="detail-description">
                    SKU: {transaction.sku || 'N/A'}
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Tipo</div>
                  <Badge variant={type.color} icon={type.icon} size="lg">
                    {type.label}
                  </Badge>
                </div>
              </div>

              {/* Cantidad y valor */}
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">Cantidad</div>
                  <div
                    className={`detail-value ${type.color === 'success' ? 'text-success' : 'text-danger'
                      }`}
                  >
                    {type.color === 'success' ? '+' : '-'}
                    {formatNumber(quantity)} {transaction.unit || 'unidad'}
                  </div>
                </div>

                {price > 0 && (
                  <div className="detail-item">
                    <div className="detail-label">Valor</div>
                    <div className="detail-value">
                      {formatCurrency(totalValue)}
                    </div>
                    <div className="detail-description">
                      {formatCurrency(price)} c/u
                    </div>
                  </div>
                )}
              </div>

              {/* Cambio de stock */}
              {(beforeStock > 0 || afterStock > 0) && (
                <div className="stock-change-card">
                  <div className="stock-change-label">
                    Cambio de Stock
                  </div>
                  <div className="stock-change-values">
                    <div className="stock-item">
                      <div className="stock-label">Antes</div>
                      <div className="stock-value">
                        {formatNumber(beforeStock)}
                      </div>
                    </div>
                    <div className="stock-arrow">→</div>
                    <div className="stock-item">
                      <div className="stock-label">Después</div>
                      <div className="stock-value">
                        {formatNumber(afterStock)}
                      </div>
                    </div>
                  </div>
                  <div className="stock-change-delta">
                    <div
                      className={`delta-badge ${afterStock > beforeStock
                        ? 'delta-positive'
                        : 'delta-negative'
                        }`}
                    >
                      Δ:{' '}
                      {afterStock > beforeStock ? '+' : ''}
                      {formatNumber(afterStock - beforeStock)} unidades
                    </div>
                  </div>
                </div>
              )}

              {/* Detalles adicionales */}
              <div className="detail-section">
                <div className="detail-field">
                  <div className="detail-label">Motivo</div>
                  <div className="detail-content">
                    {transaction.reason || 'No especificado'}
                  </div>
                </div>

                {transaction.notes && (
                  <div className="detail-field">
                    <div className="detail-label">Notas</div>
                    <div className="detail-content">
                      {transaction.notes}
                    </div>
                  </div>
                )}

                <div className="detail-grid">
                  <div className="detail-field">
                    <div className="detail-label">
                      Responsable
                    </div>
                    <div className="flex items-center">
                      <FiUser className="text-muted mr-2" />
                      <span className="detail-content">
                        {transaction.created_by_name || 'No especificado'}
                      </span>
                    </div>
                  </div>

                  <div className="detail-field">
                    <div className="detail-label">
                      Fecha y Hora
                    </div>
                    <div className="flex items-center">
                      <FiCalendar className="text-muted mr-2" />
                      <span className="detail-content">
                        {formatDate(transaction.created_at, 'dd/MM/yyyy HH:mm:ss')}
                      </span>
                    </div>
                  </div>
                </div>

                {transaction.reference_number && (
                  <div className="detail-field">
                    <div className="detail-label">
                      Referencia
                    </div>
                    <div className="detail-content">
                      {transaction.reference_number}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <div className="modal-actions">
              <Button
                variant="outline"
                onClick={() => setSelectedTransaction(null)}
              >
                Cerrar
              </Button>

              {transaction.product_id && (
                <Button
                  variant="primary"
                  onClick={() =>
                    window.open(`/products/${transaction.product_id}`, '_blank')
                  }
                  icon={<FiExternalLink />}
                >
                  Ver Producto
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ✅ SKELETON LOADING
  if (loading && !refreshing) {
    return (
      <div className="space-y-6">
        <Skeleton height={40} width={300} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((key) => (
            <Skeleton key={key} height={80} />
          ))}
        </div>
        <Skeleton height={400} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ✅ HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Historial de Transacciones
          </h1>
          <p className="page-subtitle">
            {pagination.totalItems} movimientos registrados
            {productId && ' para este producto'}
          </p>
        </div>

        <div className="action-buttons">
          <Button
            variant="outline"
            icon={<FiDownload />}
            onClick={() => exportTransactions('csv')}
            loading={exporting}
            disabled={transactions.length === 0 || loading}
            tooltip="Exportar a CSV"
            size="small"
          >
            CSV
          </Button>

          <Button
            variant="outline"
            icon={<FiPrinter />}
            onClick={() => exportTransactions('pdf')}
            loading={exporting}
            disabled={transactions.length === 0 || loading}
            tooltip="Generar PDF"
            size="small"
          >
            PDF
          </Button>

          <Button
            variant={showChart ? 'primary' : 'secondary'}
            icon={<FiBarChart2 />}
            onClick={() => {
              setShowChart(!showChart);
              if (!showChart) setViewMode('chart');
            }}
            size="small"
            disabled={transactions.length === 0 || loading}
          >
            {showChart ? 'Ocultar Gráfico' : 'Mostrar Gráfico'}
          </Button>
        </div>
      </div>

      {/* ✅ ESTADÍSTICAS RÁPIDAS */}
      {statistics && viewMode === 'list' && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{pagination.totalItems}</div>
            <div className="stat-label">Transacciones totales</div>
            <div className="stat-description">
              {statistics.totalEntries} entradas • {statistics.totalExits} salidas
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-value text-success">
              {formatNumber(statistics.totalQuantityIn)}
            </div>
            <div className="stat-label">Entradas totales</div>
            <div className="stat-description">
              Mayor: {formatNumber(statistics.largestEntry?.quantity || 0)}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-value text-danger">
              {formatNumber(statistics.totalQuantityOut)}
            </div>
            <div className="stat-label">Salidas totales</div>
            <div className="stat-description">
              Mayor: {formatNumber(statistics.largestExit?.quantity || 0)}
            </div>
          </div>

          <div className="stat-card">
            <div
              className={`stat-value ${statistics.isPositiveBalance ? 'text-success' : 'text-danger'
                }`}
            >
              {statistics.isPositiveBalance ? '+' : ''}
              {formatNumber(statistics.netBalance)}
            </div>
            <div className="stat-label">Balance neto</div>
            <div className="stat-description">
              {statistics.firstDate && statistics.lastDate && (
                <span>
                  {formatDate(statistics.firstDate, 'dd/MM')} -{' '}
                  {formatDate(statistics.lastDate, 'dd/MM')}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ✅ GRÁFICO */}
      {showChart && viewMode === 'chart' && renderChart()}

      {/* ✅ FILTROS */}
      <Card>
        <div className="card-header">
          <div className="flex items-center gap-3">
            <FiFilter className="text-muted" />
            <h3 className="card-title">Filtros</h3>
          </div>
        </div>

        <div className="card-body">
          <div className="filters-actions">
            <Button
              variant="outline"
              icon={<FiRefresh />}
              onClick={resetFilters}
              size="small"
              disabled={loading}
            >
              Limpiar Filtros
            </Button>

            <Button
              variant="secondary"
              icon={<FiRefresh />}
              onClick={() =>
                loadTransactions(filtersRef.current, pagination.page)
              }
              loading={refreshing}
              size="small"
            >
              Actualizar
            </Button>
          </div>

          <div className="filters-grid">
            {/* Rango de fechas */}
            <div>
              <label className="form-label">
                Fecha desde
              </label>
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                icon={<FiCalendar />}
                disabled={loading}
              />
            </div>

            <div>
              <label className="form-label">
                Fecha hasta
              </label>
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                icon={<FiCalendar />}
                min={filters.start_date}
                disabled={loading}
              />
            </div>

            {/* Tipo de movimiento */}
            <div>
              <label className="form-label">
                Tipo
              </label>
              <Select
                value={filters.movement_type}
                onChange={(e) => handleFilterChange('movement_type', e.target.value)}
                options={[
                  { value: '', label: 'Todos' },
                  { value: 'in', label: 'Entradas' },
                  { value: 'out', label: 'Salidas' },
                ]}
                disabled={loading}
              />
            </div>

            {/* Producto (solo si no hay productId) */}
            {!productId && (
              <div>
                <label className="form-label" htmlFor="product-select">
                  Producto
                </label>
                <Select
                  id="product-select"
                  value={filters.product_id}
                  onChange={(e) => handleFilterChange('product_id', e.target.value)}
                  options={[
                    { value: '', label: 'Todos los productos' },
                    ...products.map((p) => ({
                      value: p.id,
                      label: `${p.name} (${p.sku})`,
                    })),
                  ]}
                  placeholder="Seleccionar producto"
                  disabled={loading}
                />
              </div>
            )}
          </div>

          {/* Filtros avanzados */}
          <div className="advanced-filters">
            <div className="filters-grid">
              <div>
                <label className="form-label" htmlFor="min-quantity">
                  Cantidad mínima
                </label>
                <Input
                  id="min-quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ej: 10"
                  value={filters.min_quantity}
                  onChange={(e) => handleFilterChange('min_quantity', e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="form-label" htmlFor="max-quantity">
                  Cantidad máxima
                </label>
                <Input
                  id="max-quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ej: 100"
                  value={filters.max_quantity}
                  onChange={(e) => handleFilterChange('max_quantity', e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="form-label" htmlFor="responsable-select">
                  Responsable
                </label>
                <Select
                  id="responsable-select"
                  value={filters.created_by}
                  onChange={(e) => handleFilterChange('created_by', e.target.value)}
                  options={[
                    { value: '', label: 'Todos' },
                    ...users.map((u) => ({
                      value: u.id,
                      label: u.name,
                    })),
                  ]}
                  placeholder="Seleccionar responsable"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Buscador de motivo */}
          <div className="search-filter">
            <label className="form-label" htmlFor="reason-search">
              Buscar en motivo
            </label>
            <Input
              id="reason-search"
              type="text"
              placeholder="Buscar texto en el motivo..."
              value={filters.reason}
              onChange={(e) => handleFilterChange('reason', e.target.value)}
              icon={<FiSearch />}
              disabled={loading}
            />
          </div>

        </div>

        {/* ✅ TABLA */}
        <div className="table-container">
          {viewMode === 'list' && (
            <Table
              columns={columns}
              data={transactions}
              loading={refreshing}
              emptyMessage={
                <div className="empty-state">
                  <div className="empty-icon">
                    <FiPackage />
                  </div>
                  <h3 className="empty-title">
                    No hay transacciones
                  </h3>
                  <p className="empty-description">
                    {Object.values(filters).some((val) => val && val !== '')
                      ? 'No se encontraron transacciones con los filtros aplicados. Intenta con otros criterios.'
                      : 'Aún no se han registrado movimientos en el sistema.'}
                  </p>
                </div>
              }
              onRowClick={(transaction) => setSelectedTransaction(transaction)}
              rowClassName="table-row-hover"
            />
          )}
        </div>

        {/* ✅ PAGINACIÓN MEJORADA */}
        {pagination.totalPages > 1 && transactions.length > 0 && (
          <div className="table-pagination">
            <div className="pagination-info">
              Mostrando{' '}
              <span className="font-medium">
                {Math.min(
                  pagination.totalItems,
                  (pagination.page - 1) * pagination.limit + transactions.length
                )}
              </span>{' '}
              de <span className="font-medium">{pagination.totalItems}</span>{' '}
              transacciones
            </div>

            <div className="pagination-controls">
              {/* Selector de tamaño de página */}
              <div className="page-size-selector">
                <span className="page-size-label">Mostrar:</span>
                <select
                  className="page-size-select"
                  value={pagination.limit}
                  onChange={(e) => handlePageSizeChange(e.target.value)}
                  disabled={loading}
                >
                  {PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              {/* Navegación de página */}
              <div className="page-navigation">
                <Button
                  variant="outline"
                  size="small"
                  icon={<FiChevronsLeft />}
                  onClick={() => handlePageChange(1)}
                  disabled={pagination.page === 1 || loading}
                  tooltip="Primera página"
                />

                <Button
                  variant="outline"
                  size="small"
                  icon={<FiChevronLeft />}
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || loading}
                  tooltip="Página anterior"
                />

                <div className="page-info">
                  Página{' '}
                  <span className="font-medium">{pagination.page}</span> de{' '}
                  <span className="font-medium">{pagination.totalPages}</span>
                </div>

                <Button
                  variant="outline"
                  size="small"
                  icon={<FiChevronRight />}
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages || loading}
                  tooltip="Página siguiente"
                />

                <Button
                  variant="outline"
                  size="small"
                  icon={<FiChevronsRight />}
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={pagination.page === pagination.totalPages || loading}
                  tooltip="Última página"
                />
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* ✅ MODAL DE DETALLE */}
      {renderTransactionDetail()}
    </div>
  );
};

export default TransactionHistory;