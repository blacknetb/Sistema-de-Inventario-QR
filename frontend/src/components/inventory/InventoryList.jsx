import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { inventoryService } from '../../services/inventoryService';
import { productService } from '../../services/productService';
import Table from '../common/Table';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Chart from '../common/Chart';
import Skeleton from '../common/Skeleton';
import InventoryForm from './InventoryForm';
import "../../assets/styles/inventory.css"
import { 
  formatDate, 
  formatNumber, 
  formatCurrency,
  exportToCSV
} from '../../utils/helpers';
import { useNotification } from '../../context/NotificationContext';
import { 
  FiPlus, 
  FiFilter, 
  FiDownload, 
  FiRefresh, 
  FiTrendingUp, 
  FiTrendingDown,
  FiPackage,
  FiCalendar,
  FiUser,
  FiBarChart2,
  FiList,
  FiEye,
  FiTrash2,
  FiPrinter,
  FiChevronLeft,
  FiChevronRight,
  FiExternalLink,
  FiSearch
} from 'react-icons/fi';

// ✅ Constantes fuera del componente
const MOVEMENT_TYPES = {
  in: { label: 'Entrada', color: 'success', icon: <FiTrendingUp /> },
  out: { label: 'Salida', color: 'danger', icon: <FiTrendingDown /> }
};

const FILTER_PRESETS = {
  today: { label: 'Hoy', value: 'today' },
  week: { label: 'Esta semana', value: 'week' },
  month: { label: 'Este mes', value: 'month' },
  custom: { label: 'Personalizado', value: 'custom' }
};

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

const InventoryList = () => {
  const { success, error, withLoadingNotification } = useNotification();
  
  // ✅ ESTADOS PRINCIPALES
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [movementsData, setMovementsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // ✅ PAGINACIÓN
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    totalPages: 1,
    totalItems: 0
  });
  
  // ✅ FILTROS
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    movement_type: '',
    product_id: '',
    reason: '',
    created_by: '',
    min_quantity: '',
    max_quantity: '',
    reference_number: '',
    sort_by: 'created_at',
    sort_order: 'desc',
    preset: 'month'
  });

  // ✅ REFERENCIAS
  const filtersRef = useRef(filters);
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  // ✅ DEBOUNCE para filtro de razón
  const debouncedReason = useDebounce(filters.reason, 500);

  // ✅ EFECTO INICIAL CON CLEANUP
  useEffect(() => {
    isMountedRef.current = true;
    
    const initializeData = async () => {
      await loadInitialData();
      applyFilterPreset('month');
    };
    
    initializeData();

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ✅ EFECTO PARA FILTROS CON DEBOUNCE
  useEffect(() => {
    if (isMountedRef.current && debouncedReason !== undefined) {
      const newFilters = { ...filtersRef.current, reason: debouncedReason };
      filtersRef.current = newFilters;
      loadMovements({ ...newFilters, page: 1 });
    }
  }, [debouncedReason]);

  // ✅ CARGA INICIAL DE DATOS
  const loadInitialData = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      await Promise.all([
        loadProducts(),
        loadUsers()
      ]);
    } catch (err) {
      console.error('Error cargando datos iniciales:', err);
      if (isMountedRef.current) {
        error('Error al cargar los datos iniciales');
      }
    }
  }, [error]);

  // ✅ CARGA DE MOVIMIENTOS CON PAGINACIÓN
  const loadMovements = useCallback(async (params = {}) => {
    if (!isMountedRef.current) return;
    
    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Crear nuevo abort controller
    abortControllerRef.current = new AbortController();
    
    try {
      setRefreshing(true);
      setLoading(true);
      
      const currentPage = params.page || pagination.page;
      const currentLimit = params.limit || pagination.limit;
      const currentFilters = { ...filtersRef.current, ...params };
      
      // ✅ Preparar parámetros para backend
      const apiParams = {
        page: currentPage,
        limit: currentLimit,
        sort_by: currentFilters.sort_by,
        sort_order: currentFilters.sort_order,
        signal: abortControllerRef.current.signal,
        ...(currentFilters.start_date && { start_date: currentFilters.start_date }),
        ...(currentFilters.end_date && { end_date: currentFilters.end_date }),
        ...(currentFilters.movement_type && { movement_type: currentFilters.movement_type }),
        ...(currentFilters.product_id && { product_id: currentFilters.product_id }),
        ...(currentFilters.reason && { reason: currentFilters.reason }),
        ...(currentFilters.created_by && { created_by: currentFilters.created_by }),
        ...(currentFilters.min_quantity && { min_quantity: parseInt(currentFilters.min_quantity, 10) }),
        ...(currentFilters.max_quantity && { max_quantity: parseInt(currentFilters.max_quantity, 10) }),
        ...(currentFilters.reference_number && { reference_number: currentFilters.reference_number }),
      };
      
      const response = await inventoryService.getHistory(apiParams);
      
      if (response.success && isMountedRef.current) {
        setMovementsData(response.data || []);
        
        // Actualizar paginación
        if (response.pagination) {
          setPagination(prev => ({
            ...prev,
            page: response.pagination.page || currentPage,
            totalPages: response.pagination.totalPages || 1,
            totalItems: response.pagination.total || 0,
            limit: response.pagination.limit || currentLimit
          }));
        }
        
        // Actualizar referencia de filtros
        filtersRef.current = currentFilters;
        setFilters(currentFilters);
      } else if (isMountedRef.current) {
        setMovementsData([]);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Petición cancelada');
        return;
      }
      console.error('Error cargando movimientos:', err);
      if (isMountedRef.current) {
        error('Error cargando movimientos. Intenta nuevamente.');
        setMovementsData([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [pagination.page, pagination.limit, error]);

  // ✅ ACTUALIZAR MOVIMIENTOS
  const refreshMovements = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setRefreshing(true);
    await loadMovements({ page: pagination.page });
    setRefreshing(false);
  }, [loadMovements, pagination.page]);

  // ✅ CARGA DE PRODUCTOS
  const loadProducts = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      const response = await productService.getAll({ 
        limit: 100,
        status: 'active',
        fields: 'id,name,sku,current_stock,unit'
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
  }, []);

  // ✅ CARGA DE USUARIOS
  const loadUsers = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      // En un caso real, llamarías a un servicio de usuarios
      const mockUsers = [
        { id: 1, name: 'Admin Sistema' },
        { id: 2, name: 'Usuario Operativo' },
        { id: 3, name: 'Manager Inventario' }
      ];
      
      if (isMountedRef.current) {
        setUsers(mockUsers);
      }
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    }
  }, []);

  // ✅ APLICAR PRESET DE FILTROS
  const applyFilterPreset = useCallback((preset) => {
    if (!isMountedRef.current) return;
    
    const now = new Date();
    let startDate = '';
    let endDate = formatDate(now, 'yyyy-MM-dd');
    
    switch (preset) {
      case 'today':
        startDate = formatDate(now, 'yyyy-MM-dd');
        break;
      case 'week': {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = formatDate(weekAgo, 'yyyy-MM-dd');
        break;
      }
      case 'month': {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = formatDate(monthAgo, 'yyyy-MM-dd');
        break;
      }
      default:
        break;
    }
    
    const newFilters = {
      ...filters,
      preset,
      start_date: startDate,
      end_date: endDate
    };
    
    setFilters(newFilters);
    filtersRef.current = newFilters;
    loadMovements({ ...newFilters, page: 1 });
  }, [filters, loadMovements]);

  // ✅ MANEJO DE FILTROS
  const handleFilterChange = useCallback((field, value) => {
    if (!isMountedRef.current) return;
    
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    
    if (field !== 'reason') {
      filtersRef.current = newFilters;
      loadMovements({ ...newFilters, page: 1 });
    }
  }, [filters, loadMovements]);

  // ✅ RESET DE FILTROS
  const resetFilters = useCallback(() => {
    if (!isMountedRef.current) return;
    
    const defaultFilters = {
      start_date: '',
      end_date: '',
      movement_type: '',
      product_id: '',
      reason: '',
      created_by: '',
      min_quantity: '',
      max_quantity: '',
      reference_number: '',
      sort_by: 'created_at',
      sort_order: 'desc',
      preset: 'custom'
    };
    
    setFilters(defaultFilters);
    filtersRef.current = defaultFilters;
    loadMovements({ ...defaultFilters, page: 1 });
  }, [loadMovements]);

  // ✅ MANEJO DE PAGINACIÓN
  const goToPage = useCallback((page) => {
    if (!isMountedRef.current) return;
    
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page }));
      loadMovements({ page });
    }
  }, [pagination.totalPages, loadMovements]);

  const changeLimit = useCallback((limit) => {
    if (!isMountedRef.current) return;
    
    setPagination(prev => ({ ...prev, limit, page: 1 }));
    loadMovements({ limit, page: 1 });
  }, [loadMovements]);

  // ✅ MANEJO DE FORMULARIO
  const handleFormSubmit = useCallback((movementData) => {
    if (!isMountedRef.current) return;
    
    setIsFormOpen(false);
    success('Movimiento registrado exitosamente');
    refreshMovements();
  }, [success, refreshMovements]);

  // ✅ ELIMINAR MOVIMIENTO
  const handleDeleteMovement = useCallback(async (movement) => {
    if (!isMountedRef.current || !movement) return;

    try {
      const confirmed = window.confirm(
        `¿Estás seguro de eliminar el movimiento de ${movement.product_name}?\nEsta acción no se puede deshacer.`
      );
      
      if (confirmed && isMountedRef.current) {
        await withLoadingNotification(
          () => inventoryService.deleteMovement(movement.id),
          'Eliminando movimiento...'
        );
        
        success('Movimiento eliminado exitosamente');
        refreshMovements();
      }
    } catch (err) {
      console.error('Error eliminando movimiento:', err);
      if (isMountedRef.current) {
        error('Error eliminando movimiento');
      }
    }
  }, [withLoadingNotification, success, error, refreshMovements]);

  // ✅ EXPORTACIÓN
  const exportData = useCallback(async (format) => {
    if (!isMountedRef.current) return;

    try {
      await withLoadingNotification(
        async () => {
          // Obtener todos los datos sin paginación
          const response = await inventoryService.getHistory({ 
            ...filtersRef.current, 
            limit: 1000,
            page: 1 
          });
          
          if (response.success && response.data && isMountedRef.current) {
            if (format === 'csv') {
              const csvData = response.data.map(movement => ({
                'Fecha': formatDate(movement.created_at),
                'Hora': formatDate(movement.created_at, 'HH:mm'),
                'Producto': movement.product_name,
                'SKU': movement.sku,
                'Tipo': MOVEMENT_TYPES[movement.movement_type]?.label || movement.movement_type,
                'Cantidad': movement.quantity,
                'Unidad': movement.unit || 'unidad',
                'Motivo': movement.reason,
                'Responsable': movement.created_by_name,
                'Stock Anterior': movement.before_stock || 'N/A',
                'Stock Nuevo': movement.after_stock || 'N/A',
                'Referencia': movement.reference_number || 'N/A',
                'Notas': movement.notes || 'N/A'
              }));
              
              exportToCSV(csvData, `movimientos-inventario-${formatDate(new Date(), 'yyyy-MM-dd')}`);
              success('Datos exportados exitosamente');
            } else if (format === 'pdf') {
              success('Función PDF disponible en versión completa');
            }
          }
        },
        `Exportando datos a ${format.toUpperCase()}...`
      );
    } catch (err) {
      console.error('Error exportando datos:', err);
      if (isMountedRef.current) {
        error('Error al exportar los datos');
      }
    }
  }, [withLoadingNotification, success, error]);

  // ✅ ESTADÍSTICAS OPTIMIZADAS
  const statistics = useMemo(() => {
    const movements = movementsData || [];
    if (!movements.length) return null;
    
    const stats = movements.reduce((acc, movement) => {
      acc.totalMovements++;
      
      if (movement.movement_type === 'in') {
        acc.totalEntries++;
        acc.totalQuantityIn += parseFloat(movement.quantity) || 0;
        acc.totalValueIn += (movement.price || 0) * movement.quantity;
        
        if (movement.quantity > acc.largestEntry.quantity) {
          acc.largestEntry = movement;
        }
      } else {
        acc.totalExits++;
        acc.totalQuantityOut += parseFloat(movement.quantity) || 0;
        acc.totalValueOut += (movement.price || 0) * movement.quantity;
        
        if (movement.quantity > acc.largestExit.quantity) {
          acc.largestExit = movement;
        }
      }
      
      return acc;
    }, {
      totalMovements: 0,
      totalEntries: 0,
      totalExits: 0,
      totalQuantityIn: 0,
      totalQuantityOut: 0,
      totalValueIn: 0,
      totalValueOut: 0,
      largestEntry: { quantity: 0 },
      largestExit: { quantity: 0 }
    });

    // Calcular balance neto
    stats.netBalance = stats.totalQuantityIn - stats.totalQuantityOut;
    stats.isPositiveBalance = stats.netBalance >= 0;

    return stats;
  }, [movementsData]);

  // ✅ DATOS PARA EL GRÁFICO
  const chartData = useMemo(() => {
    const movements = movementsData || [];
    if (!movements.length || viewMode !== 'chart') return null;
    
    const movementsByDay = movements.reduce((acc, movement) => {
      const date = formatDate(movement.created_at, 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = { entries: 0, exits: 0 };
      }
      
      if (movement.movement_type === 'in') {
        acc[date].entries += parseFloat(movement.quantity) || 0;
      } else {
        acc[date].exits += parseFloat(movement.quantity) || 0;
      }
      
      return acc;
    }, {});
    
    const days = Object.keys(movementsByDay)
      .sort()
      .slice(-10);
    
    return {
      labels: days.map(date => formatDate(date, 'dd/MM')),
      datasets: [
        {
          label: 'Entradas',
          data: days.map(date => movementsByDay[date]?.entries || 0),
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: '#10B981',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        },
        {
          label: 'Salidas',
          data: days.map(date => movementsByDay[date]?.exits || 0),
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          borderColor: '#EF4444',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        }
      ]
    };
  }, [movementsData, viewMode]);

  // ✅ COLUMNAS DE TABLA
  const columns = useMemo(() => [
    {
      id: 'date',
      header: 'Fecha/Hora',
      cell: (movement) => (
        <div className="space-y-1">
          <div className="font-medium text-primary">
            {formatDate(movement.created_at, 'dd/MM/yyyy')}
          </div>
          <div className="text-sm text-muted">
            {formatDate(movement.created_at, 'HH:mm')}
          </div>
        </div>
      ),
      width: '140px',
      sortable: true
    },
    {
      id: 'product',
      header: 'Producto',
      cell: (movement) => (
        <div className="flex items-center">
          <div className={`product-icon ${
            movement.movement_type === 'in' ? 'product-icon-in' : 'product-icon-out'
          }`}>
            {movement.movement_type === 'in' ? (
              <FiTrendingUp className="text-success" />
            ) : (
              <FiTrendingDown className="text-danger" />
            )}
          </div>
          <div className="min-w-0">
            <div className="product-name">
              {movement.product_name}
            </div>
            <div className="product-sku">{movement.sku}</div>
            <div className="product-category">
              {movement.category_name || 'Sin categoría'}
            </div>
          </div>
        </div>
      ),
      width: '250px'
    },
    {
      id: 'type',
      header: 'Tipo',
      cell: (movement) => {
        const type = MOVEMENT_TYPES[movement.movement_type] || MOVEMENT_TYPES.in;
        return (
          <Badge 
            variant={type.color}
            icon={type.icon}
            className="capitalize"
          >
            {type.label}
          </Badge>
        );
      },
      width: '100px'
    },
    {
      id: 'quantity',
      header: 'Cantidad',
      cell: (movement) => {
        const quantity = parseFloat(movement.quantity) || 0;
        const isIn = movement.movement_type === 'in';
        
        return (
          <div className={`quantity-display ${
            isIn ? 'text-success' : 'text-danger'
          }`}>
            {isIn ? '+' : '-'}{formatNumber(quantity)} {movement.unit || 'unidad'}
          </div>
        );
      },
      width: '140px',
      sortable: true
    },
    {
      id: 'stock_change',
      header: 'Cambio de Stock',
      cell: (movement) => {
        const before = parseFloat(movement.before_stock) || 0;
        const after = parseFloat(movement.after_stock) || 0;
        const change = after - before;
        
        if (before !== 0 || after !== 0) {
          return (
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <span className="text-muted">{formatNumber(before)}</span>
                <span className="mx-2 text-border">→</span>
                <span className="font-medium text-primary">{formatNumber(after)}</span>
              </div>
              <div className="progress-bar-thin">
                <div 
                  className={`progress-fill ${change >= 0 ? 'bg-success' : 'bg-danger'}`}
                  style={{ 
                    width: `${Math.min(
                      Math.abs(change) / Math.max(before, after, 1) * 100, 
                      100
                    )}%` 
                  }}
                />
              </div>
            </div>
          );
        }
        return <span className="text-muted text-sm">N/A</span>;
      },
      width: '180px'
    },
    {
      id: 'value',
      header: 'Valor',
      cell: (movement) => {
        const price = parseFloat(movement.price) || 0;
        const quantity = parseFloat(movement.quantity) || 0;
        const totalValue = price * quantity;
        
        return (
          <div className="space-y-1">
            {price > 0 ? (
              <>
                <div className="font-medium">
                  {formatCurrency(totalValue)}
                </div>
                <div className="text-sm text-muted">
                  {formatCurrency(price)} c/u
                </div>
              </>
            ) : (
              <span className="text-muted">No disponible</span>
            )}
          </div>
        );
      },
      width: '140px'
    },
    {
      id: 'user',
      header: 'Responsable',
      cell: (movement) => (
        <div className="flex items-center">
          <div className="user-avatar">
            <FiUser className="text-primary" />
          </div>
          <div>
            <div className="user-name">{movement.created_by_name}</div>
            <div className="user-date">
              {formatDate(movement.created_at, 'dd/MM')}
            </div>
          </div>
        </div>
      ),
      width: '160px'
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: (movement) => (
        <div className="flex gap-1">
          <Button
            size="small"
            variant="outline"
            onClick={() => setSelectedMovement(movement)}
            tooltip="Ver detalles"
            icon={<FiEye />}
          />
          
          <Button
            size="small"
            variant="outline"
            onClick={() => window.open(`/products/${movement.product_id}`, '_blank')}
            tooltip="Ir al producto"
            icon={<FiPackage />}
          />
          
          <Button
            size="small"
            variant="danger"
            onClick={() => handleDeleteMovement(movement)}
            tooltip="Eliminar movimiento"
            icon={<FiTrash2 />}
          />
        </div>
      ),
      width: '140px',
      align: 'center'
    }
  ], [handleDeleteMovement]);

  // ✅ RENDERIZADO DE GRÁFICO
  const renderChartView = () => {
    if (!chartData) {
      return (
        <Card>
          <div className="card-header">
            <div>
              <h3 className="card-title">Tendencia de Movimientos</h3>
              <p className="card-subtitle">No hay datos suficientes para mostrar el gráfico</p>
            </div>
          </div>
        </Card>
      );
    }
    
    return (
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Tendencia de Movimientos</h3>
            <p className="card-subtitle">Últimos 10 días</p>
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
            interaction: {
              mode: 'index',
              intersect: false
            },
            plugins: {
              legend: {
                position: 'top',
              },
              tooltip: {
                mode: 'index',
                intersect: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Cantidad de unidades'
                }
              },
              x: {
                title: {
                  display: true,
                  text: 'Fecha'
                }
              }
            }
          }}
          height={400}
        />
        
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="stat-card bg-success-light">
            <div className="stat-value text-success">
              {formatNumber(statistics?.totalQuantityIn || 0)}
            </div>
            <div className="stat-label">Total entradas</div>
          </div>
          
          <div className="stat-card bg-danger-light">
            <div className="stat-value text-danger">
              {formatNumber(statistics?.totalQuantityOut || 0)}
            </div>
            <div className="stat-label">Total salidas</div>
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
          <h1 className="page-title">Movimientos de Inventario</h1>
          <p className="page-subtitle">
            Historial completo de entradas y salidas
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Selector de vista */}
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'view-toggle-active' : ''}`}
              onClick={() => setViewMode('list')}
              disabled={loading}
            >
              <FiList className="mr-1.5" />
              Lista
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'chart' ? 'view-toggle-active' : ''}`}
              onClick={() => setViewMode('chart')}
              disabled={loading || movementsData.length === 0}
            >
              <FiBarChart2 className="mr-1.5" />
              Gráfico
            </button>
          </div>
          
          {/* Botones de acción */}
          <Button
            variant="outline"
            icon={<FiDownload />}
            onClick={() => exportData('csv')}
            tooltip="Exportar CSV"
            size="small"
            disabled={movementsData.length === 0 || loading}
          >
            CSV
          </Button>
          
          <Button
            variant="outline"
            icon={<FiPrinter />}
            onClick={() => exportData('pdf')}
            tooltip="Exportar PDF"
            size="small"
            disabled={movementsData.length === 0 || loading}
          >
            PDF
          </Button>
          
          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            onClick={() => setShowFilters(!showFilters)}
            icon={<FiFilter />}
            size="small"
            disabled={loading}
          >
            {showFilters ? 'Ocultar Filtros' : 'Filtros'}
          </Button>
          
          <Button
            variant="primary"
            onClick={() => setIsFormOpen(true)}
            icon={<FiPlus />}
            size="small"
            disabled={loading}
          >
            Nuevo Movimiento
          </Button>
        </div>
      </div>

      {/* ✅ ESTADÍSTICAS RÁPIDAS */}
      {statistics && viewMode === 'list' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="stat-value">{pagination.totalItems}</div>
            <div className="stat-label">Movimientos totales</div>
            <div className="stat-description">
              Página {pagination.page} de {pagination.totalPages}
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value text-success">
              {formatNumber(statistics.totalQuantityIn)}
            </div>
            <div className="stat-label">Entradas totales</div>
            <div className="stat-description">
              {statistics.totalEntries} movimientos
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value text-danger">
              {formatNumber(statistics.totalQuantityOut)}
            </div>
            <div className="stat-label">Salidas totales</div>
            <div className="stat-description">
              {statistics.totalExits} movimientos
            </div>
          </div>
          
          <div className="stat-card">
            <div className={`stat-value ${
              statistics.isPositiveBalance ? 'text-success' : 'text-danger'
            }`}>
              {statistics.isPositiveBalance ? '+' : ''}
              {formatNumber(statistics.netBalance)}
            </div>
            <div className="stat-label">Balance neto</div>
            <div className="stat-description">
              {filters.start_date && filters.end_date && (
                <span>
                  {formatDate(filters.start_date, 'dd/MM')} - {formatDate(filters.end_date, 'dd/MM')}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ✅ FILTROS */}
      {showFilters && (
        <Card className="filters-card">
          <div className="filters-header">
            <div className="flex items-center gap-3">
              <FiFilter className="text-muted" />
              <h3 className="filters-title">Filtros y Búsqueda</h3>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                icon={<FiRefresh />}
                onClick={resetFilters}
                size="small"
                disabled={loading}
              >
                Limpiar Todo
              </Button>
              
              <Button
                variant="secondary"
                icon={<FiRefresh />}
                onClick={refreshMovements}
                loading={refreshing}
                size="small"
              >
                Actualizar
              </Button>
            </div>
          </div>
          
          {/* Presets rápidos */}
          <div className="mb-4">
            <label className="form-label mb-2">Periodo</label>
            <div className="filter-presets">
              {Object.entries(FILTER_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  className={`filter-preset ${filters.preset === key ? 'filter-preset-active' : ''}`}
                  onClick={() => applyFilterPreset(key)}
                  disabled={loading}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Filtros principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Fechas */}
            <div>
              <label className="form-label">Fecha desde</label>
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                icon={<FiCalendar />}
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="form-label">Fecha hasta</label>
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                icon={<FiCalendar />}
                min={filters.start_date}
                disabled={loading}
              />
            </div>
            
            {/* Tipo */}
            <div>
              <label className="form-label">Tipo</label>
              <Select
                value={filters.movement_type}
                onChange={(e) => handleFilterChange('movement_type', e.target.value)}
                options={[
                  { value: '', label: 'Todos' },
                  { value: 'in', label: 'Entradas' },
                  { value: 'out', label: 'Salidas' }
                ]}
                disabled={loading}
              />
            </div>
            
            {/* Producto */}
            <div>
              <label className="form-label">Producto</label>
              <Select
                value={filters.product_id}
                onChange={(e) => handleFilterChange('product_id', e.target.value)}
                options={[
                  { value: '', label: 'Todos los productos' },
                  ...products.map(p => ({
                    value: p.id,
                    label: `${p.name} (${p.sku})`
                  }))
                ]}
                disabled={loading}
              />
            </div>
          </div>
          
          {/* Filtros avanzados */}
          <div className="advanced-filters">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Cantidad mínima</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Ej: 10"
                  value={filters.min_quantity}
                  onChange={(e) => handleFilterChange('min_quantity', e.target.value)}
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="form-label">Cantidad máxima</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Ej: 100"
                  value={filters.max_quantity}
                  onChange={(e) => handleFilterChange('max_quantity', e.target.value)}
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="form-label">Responsable</label>
                <Select
                  value={filters.created_by}
                  onChange={(e) => handleFilterChange('created_by', e.target.value)}
                  options={[
                    { value: '', label: 'Todos' },
                    ...users.map(u => ({
                      value: u.id,
                      label: u.name
                    }))
                  ]}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
          
          {/* Buscador */}
          <div className="search-filter">
            <label className="form-label">Buscar en motivo</label>
            <Input
              type="text"
              placeholder="Buscar texto en el motivo..."
              value={filters.reason}
              onChange={(e) => handleFilterChange('reason', e.target.value)}
              icon={<FiSearch />}
              disabled={loading}
            />
          </div>
        </Card>
      )}

      {/* ✅ CONTENIDO PRINCIPAL */}
      {viewMode === 'chart' ? (
        renderChartView()
      ) : (
        <div className="data-table-container">
          {/* Tabla */}
          <Table
            columns={columns}
            data={movementsData}
            loading={loading && !refreshing}
            emptyMessage={
              <div className="empty-state">
                <div className="empty-icon">
                  <FiPackage />
                </div>
                <h3 className="empty-title">
                  No hay movimientos registrados
                </h3>
                <p className="empty-description">
                  {Object.values(filters).some(v => v && v !== 'month' && v !== '') 
                    ? 'No se encontraron movimientos con los filtros aplicados.'
                    : 'Comienza registrando tu primer movimiento.'}
                </p>
                <div className="empty-action">
                  <Button
                    variant="primary"
                    onClick={() => setIsFormOpen(true)}
                    icon={<FiPlus />}
                    disabled={loading}
                  >
                    Registrar Primer Movimiento
                  </Button>
                </div>
              </div>
            }
            onRowClick={(movement) => setSelectedMovement(movement)}
            rowClassName="table-row-hover"
          />
          
          {/* Paginación */}
          {pagination.totalPages > 1 && movementsData.length > 0 && (
            <div className="table-pagination">
              <div className="pagination-info">
                Mostrando <span className="font-medium">
                  {Math.min(pagination.totalItems, (pagination.page - 1) * pagination.limit + movementsData.length)}
                </span> de{' '}
                <span className="font-medium">{pagination.totalItems}</span> movimientos
              </div>
              
              <div className="pagination-controls">
                {/* Selector de tamaño de página */}
                <div className="page-size-selector">
                  <span className="page-size-label">Mostrar:</span>
                  <select
                    className="page-size-select"
                    value={pagination.limit}
                    onChange={(e) => changeLimit(parseInt(e.target.value, 10))}
                    disabled={loading}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                
                {/* Navegación de página */}
                <div className="page-navigation">
                  <Button
                    variant="outline"
                    size="small"
                    icon={<FiChevronLeft />}
                    onClick={() => goToPage(pagination.page - 1)}
                    disabled={pagination.page <= 1 || loading}
                  />
                  
                  <div className="page-info">
                    Página <span className="font-medium">{pagination.page}</span> de{' '}
                    <span className="font-medium">{pagination.totalPages}</span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="small"
                    icon={<FiChevronRight />}
                    onClick={() => goToPage(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages || loading}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ✅ MODALES */}
      
      {/* Modal de formulario */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Registrar Movimiento de Inventario"
        size="xl"
        closeOnOverlayClick={false}
      >
        <InventoryForm
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>

      {/* Modal de detalle */}
      {selectedMovement && (
        <Modal
          isOpen={!!selectedMovement}
          onClose={() => setSelectedMovement(null)}
          title="Detalle del Movimiento"
          size="lg"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="detail-label">Producto</div>
                <div className="detail-value">{selectedMovement.product_name}</div>
                <div className="detail-description">SKU: {selectedMovement.sku}</div>
              </div>
              
              <div>
                <div className="detail-label">Tipo</div>
                <Badge 
                  variant={MOVEMENT_TYPES[selectedMovement.movement_type]?.color || 'primary'}
                  icon={MOVEMENT_TYPES[selectedMovement.movement_type]?.icon || <FiPackage />}
                  size="lg"
                >
                  {MOVEMENT_TYPES[selectedMovement.movement_type]?.label || selectedMovement.movement_type}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="detail-label">Cantidad</div>
                <div className={`detail-value ${
                  selectedMovement.movement_type === 'in' ? 'text-success' : 'text-danger'
                }`}>
                  {selectedMovement.movement_type === 'in' ? '+' : '-'}
                  {formatNumber(selectedMovement.quantity)} {selectedMovement.unit}
                </div>
              </div>
              
              {selectedMovement.price && (
                <div>
                  <div className="detail-label">Valor</div>
                  <div className="detail-value">
                    {formatCurrency(selectedMovement.price * selectedMovement.quantity)}
                  </div>
                  <div className="detail-description">
                    {formatCurrency(selectedMovement.price)} c/u
                  </div>
                </div>
              )}
            </div>
            
            {selectedMovement.before_stock !== undefined && selectedMovement.after_stock !== undefined && (
              <div className="stock-change-card">
                <div className="stock-change-label">Cambio de Stock</div>
                <div className="stock-change-values">
                  <div className="stock-before">
                    <div className="stock-label">Antes</div>
                    <div className="stock-value">{selectedMovement.before_stock}</div>
                  </div>
                  <div className="stock-arrow">→</div>
                  <div className="stock-after">
                    <div className="stock-label">Después</div>
                    <div className="stock-value">{selectedMovement.after_stock}</div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <div className="detail-label">Motivo</div>
                <div className="detail-content">{selectedMovement.reason}</div>
              </div>
              
              {selectedMovement.notes && (
                <div>
                  <div className="detail-label">Notas</div>
                  <div className="detail-content">{selectedMovement.notes}</div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="detail-label">Responsable</div>
                  <div className="flex items-center">
                    <FiUser className="text-muted mr-2" />
                    <span className="detail-content">{selectedMovement.created_by_name}</span>
                  </div>
                </div>
                
                <div>
                  <div className="detail-label">Fecha</div>
                  <div className="flex items-center">
                    <FiCalendar className="text-muted mr-2" />
                    <span className="detail-content">
                      {formatDate(selectedMovement.created_at, 'dd/MM/yyyy HH:mm:ss')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <Button
                variant="outline"
                onClick={() => setSelectedMovement(null)}
              >
                Cerrar
              </Button>
              
              <Button
                variant="primary"
                onClick={() => window.open(`/products/${selectedMovement.product_id}`, '_blank')}
                icon={<FiExternalLink />}
              >
                Ver Producto
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default InventoryList;