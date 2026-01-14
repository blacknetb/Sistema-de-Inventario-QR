import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types'; // ✅ Importación agregada
import {
  Search, Filter, Calendar, Download, Printer,
  ArrowUpRight, ArrowDownRight, DollarSign,
  CreditCard, Wallet, TrendingUp, Eye,
  FileText, MoreVertical, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle, XCircle, Clock,
  Users, Building, Tag, Layers,
  Mail, RefreshCw, Trash2, ExternalLink,
  BarChart, PieChart, LineChart, Grid,
  CheckSquare, Square, FilterX
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import ExportOptions from './ExportOptions';
import TransactionFilters from './TransactionFilters';
import { transactionService } from '../../services/transactionService';
import { useNotification } from '../../context/NotificationContext';

const TransactionReport = () => {
  const { success, error, withLoadingNotification } = useNotification();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [filters, setFilters] = useState({
    type: 'all',
    dateRange: 'month',
    search: '',
    startDate: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    minAmount: '',
    maxAmount: '',
    status: 'all',
    paymentMethod: 'all',
    customer: '',
    category: '',
    sortBy: 'date_desc'
  });
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    transactionCount: 0,
    averageTransaction: 0,
    pendingAmount: 0
  });
  const [selectedTransactions, setSelectedTransactions] = useState(new Set());
  const [viewMode, setViewMode] = useState('table');
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0
  });
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  // ✅ Cargar datos filtrados cuando cambian los filtros
  useEffect(() => {
    filterTransactions();
  }, [filters, transactions]);

  // ✅ Cargar datos iniciales
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      const [transactionsData, categoriesData, customersData] = await Promise.all([
        transactionService.getTransactions({
          startDate: filters.startDate,
          endDate: filters.endDate,
          signal
        }),
        transactionService.getCategories({ signal }),
        transactionService.getCustomers({ signal })
      ]);

      if (transactionsData.success) {
        const transactionsList = transactionsData.data.transactions || [];
        setTransactions(transactionsList);
        setFilteredTransactions(transactionsList);
        setPagination(prev => ({
          ...prev,
          total: transactionsData.data.total || transactionsList.length
        }));
        calculateStats(transactionsList);
      } else {
        error(transactionsData.message || 'Error cargando transacciones');
      }

      if (categoriesData.success) {
        setCategories(categoriesData.data || []);
      } else {
        console.warn('Error cargando categorías:', categoriesData.message);
      }

      if (customersData.success) {
        setCustomers(customersData.data || []);
      } else {
        console.warn('Error cargando clientes:', customersData.message);
      }

      setLastUpdate(new Date().toISOString());
    } catch (err) {
      if (err.name !== 'AbortError') {
        error('Error cargando datos de transacciones');
        console.error('Error loading transaction data:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [filters, error]);

  // ✅ Calcular estadísticas
  const calculateStats = useCallback((transactionsList) => {
    const revenue = transactionsList
      .filter(t => t.type === 'sale' && t.status === 'completed')
      .reduce((sum, t) => sum + (t.net_amount || t.amount || 0), 0);

    const expenses = transactionsList
      .filter(t => ['purchase', 'expense'].includes(t.type) && t.status === 'completed')
      .reduce((sum, t) => sum + (t.net_amount || t.amount || 0), 0);

    const refunds = transactionsList
      .filter(t => t.type === 'refund' && t.status === 'completed')
      .reduce((sum, t) => sum + (t.net_amount || t.amount || 0), 0);

    const pending = transactionsList
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + (t.net_amount || t.amount || 0), 0);

    const totalTransactions = transactionsList.length;
    const average = totalTransactions > 0 ? (revenue + expenses + refunds) / totalTransactions : 0;

    setStats({
      totalRevenue: revenue,
      totalExpenses: expenses + refunds,
      netProfit: revenue - expenses - refunds,
      transactionCount: totalTransactions,
      averageTransaction: average,
      pendingAmount: pending
    });
  }, []);

  // ✅ Filtrar transacciones
  const filterTransactions = useCallback(() => {
    let filtered = [...transactions];

    // Filtrar por tipo
    if (filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    // Filtrar por búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(t =>
        (t.description?.toLowerCase() || '').includes(searchLower) ||
        (t.customer?.toLowerCase() || '').includes(searchLower) ||
        (t.supplier?.toLowerCase() || '').includes(searchLower) ||
        (t.invoice?.toLowerCase() || '').includes(searchLower) ||
        (t.notes?.toLowerCase() || '').includes(searchLower)
      );
    }

    // Filtrar por rango de fechas
    if (filters.startDate && filters.endDate) {
      filtered = filtered.filter(t => {
        try {
          const transactionDate = new Date(t.date || t.created_at);
          const start = new Date(filters.startDate);
          const end = new Date(filters.endDate);
          end.setHours(23, 59, 59, 999);
          return transactionDate >= start && transactionDate <= end;
        } catch {
          return false;
        }
      });
    }

    // Filtrar por monto
    if (filters.minAmount) {
      const min = parseFloat(filters.minAmount);
      if (!isNaN(min)) {
        filtered = filtered.filter(t => (t.amount || 0) >= min);
      }
    }
    if (filters.maxAmount) {
      const max = parseFloat(filters.maxAmount);
      if (!isNaN(max)) {
        filtered = filtered.filter(t => (t.amount || 0) <= max);
      }
    }

    // Filtrar por estado
    if (filters.status !== 'all') {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    // Filtrar por método de pago
    if (filters.paymentMethod !== 'all') {
      filtered = filtered.filter(t => t.paymentMethod === filters.paymentMethod);
    }

    // Filtrar por categoría
    if (filters.category) {
      filtered = filtered.filter(t => t.category === filters.category);
    }

    // Ordenar transacciones
    filtered = sortTransactions(filtered, filters.sortBy);

    setFilteredTransactions(filtered);
    calculateStats(filtered);
  }, [filters, transactions, calculateStats]);

  // ✅ Ordenar transacciones
  const sortTransactions = useCallback((transactionsList, sortBy) => {
    const sorted = [...transactionsList];

    switch (sortBy) {
      case 'date_desc':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.date || a.created_at);
          const dateB = new Date(b.date || b.created_at);
          return dateB - dateA;
        });
      case 'date_asc':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.date || a.created_at);
          const dateB = new Date(b.date || b.created_at);
          return dateA - dateB;
        });
      case 'amount_desc':
        return sorted.sort((a, b) => (b.amount || 0) - (a.amount || 0));
      case 'amount_asc':
        return sorted.sort((a, b) => (a.amount || 0) - (b.amount || 0));
      default:
        return sorted;
    }
  }, []);

  // ✅ Cambiar filtro
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // ✅ Cambiar rango de fechas
  const handleDateRangeChange = useCallback((range) => {
    const today = new Date();
    let startDate = new Date();

    switch (range) {
      case 'today':
        startDate = today;
        break;
      case 'week':
        startDate = subDays(today, 7);
        break;
      case 'month':
        startDate = subMonths(today, 1);
        break;
      case 'quarter':
        startDate = subMonths(today, 3);
        break;
      case 'year':
        startDate = subDays(today, 365);
        break;
      default:
        startDate = null;
    }

    setFilters(prev => ({
      ...prev,
      dateRange: range,
      startDate: startDate ? format(startDate, 'yyyy-MM-dd') : '',
      endDate: range !== 'all' ? format(today, 'yyyy-MM-dd') : ''
    }));
  }, []);

  // ✅ Resetear filtros
  const resetFilters = useCallback(() => {
    setFilters({
      type: 'all',
      dateRange: 'month',
      search: '',
      startDate: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      minAmount: '',
      maxAmount: '',
      status: 'all',
      paymentMethod: 'all',
      customer: '',
      category: '',
      sortBy: 'date_desc'
    });
  }, []);

  // ✅ Refrescar datos
  const refreshData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await loadInitialData();
      success('Datos actualizados correctamente');
    } catch (err) {
      error('Error al actualizar datos');
    } finally {
      setIsRefreshing(false);
    }
  }, [loadInitialData, success, error]);

  // ✅ Alternar expansión de fila
  const toggleRowExpansion = useCallback((id) => {
    setExpandedRows(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return newExpanded;
    });
  }, []);

  // ✅ Seleccionar transacción
  const toggleTransactionSelection = useCallback((id) => {
    setSelectedTransactions(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  }, []);

  // ✅ Seleccionar todas las transacciones
  const selectAllTransactions = useCallback(() => {
    if (selectedTransactions.size === filteredTransactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(filteredTransactions.map(t => t.id).filter(id => id)));
    }
  }, [filteredTransactions, selectedTransactions.size]);

  // ✅ Obtener configuración de tipo
  const getTypeConfig = useCallback((type) => {
    const configs = {
      sale: { label: 'Venta', color: 'transaction-type-sale', icon: ArrowUpRight },
      purchase: { label: 'Compra', color: 'transaction-type-purchase', icon: ArrowDownRight },
      expense: { label: 'Gasto', color: 'transaction-type-expense', icon: ArrowDownRight },
      refund: { label: 'Devolución', color: 'transaction-type-refund', icon: ArrowUpRight }
    };
    return configs[type] || { label: 'Otro', color: 'transaction-type-other', icon: DollarSign };
  }, []);

  // ✅ Obtener configuración de estado
  const getStatusConfig = useCallback((status) => {
    const configs = {
      completed: { label: 'Completado', color: 'transaction-status-completed', icon: CheckCircle },
      pending: { label: 'Pendiente', color: 'transaction-status-pending', icon: Clock },
      processing: { label: 'Procesando', color: 'transaction-status-processing', icon: Clock },
      cancelled: { label: 'Cancelado', color: 'transaction-status-cancelled', icon: XCircle }
    };
    return configs[status] || { label: 'Desconocido', color: 'transaction-status-unknown', icon: AlertCircle };
  }, []);

  // ✅ Formatear moneda
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  }, []);

  // ✅ Formatear fecha
  const formatDate = useCallback((dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      return format(date, "dd/MM/yyyy HH:mm", { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  }, []);

  // ✅ Manejar exportación
  const handleExport = useCallback(async (exportConfig) => {
    try {
      const selectedIds = Array.from(selectedTransactions);
      const exportData = selectedIds.length > 0
        ? filteredTransactions.filter(t => selectedIds.includes(t.id))
        : filteredTransactions;

      await withLoadingNotification(
        transactionService.exportTransactions({
          ...exportConfig,
          transactionIds: selectedIds,
          filters,
          data: exportData
        }),
        'Exportando transacciones...'
      );

      success('Transacciones exportadas exitosamente');
      setShowExportModal(false);
    } catch (err) {
      error('Error al exportar transacciones');
    }
  }, [selectedTransactions, filteredTransactions, filters, withLoadingNotification, success, error]);

  // ✅ Manejar acción por lotes
  const handleBatchAction = useCallback(async (action) => {
    if (selectedTransactions.size === 0) {
      error('Por favor, selecciona al menos una transacción');
      return;
    }

    const selectedIds = Array.from(selectedTransactions);

    try {
      switch (action) {
        case 'export':
          setShowExportModal(true);
          break;
        case 'print':
          window.print();
          break;
        case 'email':
          await withLoadingNotification(
            transactionService.sendByEmail(selectedIds),
            'Enviando transacciones por email...'
          );
          success('Transacciones enviadas por email exitosamente');
          break;
        case 'delete':
          if (window.confirm(`¿Eliminar ${selectedIds.length} transacciones seleccionadas?`)) {
            await withLoadingNotification(
              transactionService.deleteTransactions(selectedIds),
              'Eliminando transacciones...'
            );
            setTransactions(prev => prev.filter(t => !selectedIds.includes(t.id)));
            setSelectedTransactions(new Set());
            success('Transacciones eliminadas exitosamente');
          }
          break;
      }
    } catch (err) {
      error(`Error al ${action} transacciones`);
    }
  }, [selectedTransactions, withLoadingNotification, success, error]);

  // ✅ Resumen de transacciones
  const transactionSummary = useMemo(() => {
    const summary = {
      sales: { count: 0, amount: 0 },
      purchases: { count: 0, amount: 0 },
      expenses: { count: 0, amount: 0 },
      refunds: { count: 0, amount: 0 }
    };

    filteredTransactions.forEach(t => {
      if (summary[t.type]) {
        summary[t.type].count++;
        summary[t.type].amount += t.amount || 0;
      }
    });

    return summary;
  }, [filteredTransactions]);

  // ✅ Cargar más datos
  const loadMoreTransactions = useCallback(async () => {
    try {
      const nextPage = pagination.page + 1;
      const response = await transactionService.getTransactions({
        page: nextPage,
        pageSize: pagination.pageSize,
        ...filters
      });

      if (response.success) {
        const newTransactions = response.data.transactions || [];
        setTransactions(prev => [...prev, ...newTransactions]);
        setPagination(prev => ({
          ...prev,
          page: nextPage,
          total: response.data.total || prev.total + newTransactions.length
        }));
      }
    } catch (err) {
      error('Error cargando más transacciones');
    }
  }, [pagination, filters, error]);

  // ✅ Estado de carga
  if (loading && transactions.length === 0) {
    return (
      <div className="transactions-loading">
        <div className="transactions-loading-content">
          <div className="transactions-loading-spinner"></div>
          <p className="transactions-loading-text">Cargando transacciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transactions-container">
      {/* ✅ Modal de exportación */}
      <AnimatePresence>
        {showExportModal && (
          <ExportOptions
            data={filteredTransactions}
            reportType="transactions"
            fileName={`transacciones-${new Date().toISOString().split('T')[0]}`}
            onClose={() => setShowExportModal(false)}
            onExport={handleExport}
            exportConfig={{
              format: 'pdf',
              includeCharts: true,
              includeFilters: true,
              lastUpdate: lastUpdate
            }}
          />
        )}
      </AnimatePresence>

      {/* ✅ Header */}
      <div className="transactions-header">
        <div className="transactions-header-content">
          <h2 className="transactions-title">Reporte de Transacciones</h2>
          <p className="transactions-subtitle">
            {filteredTransactions.length} transacciones • Actualizado: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Cargando...'}
          </p>
        </div>
        <div className="transactions-header-actions">
          {selectedTransactions.size > 0 && (
            <div className="transactions-selection-badge">
              <span className="transactions-selection-count">
                {selectedTransactions.size} seleccionadas
              </span>
              <div className="transactions-selection-actions">
                <button
                  onClick={() => handleBatchAction('export')}
                  className="transactions-selection-action"
                  title="Exportar seleccionadas"
                  aria-label="Exportar transacciones seleccionadas"
                >
                  <Download className="transactions-selection-action-icon" />
                </button>
                <button
                  onClick={() => handleBatchAction('email')}
                  className="transactions-selection-action"
                  title="Enviar por email"
                  aria-label="Enviar transacciones por email"
                >
                  <Mail className="transactions-selection-action-icon" />
                </button>
                <button
                  onClick={() => handleBatchAction('delete')}
                  className="transactions-selection-action danger"
                  title="Eliminar seleccionadas"
                  aria-label="Eliminar transacciones seleccionadas"
                >
                  <Trash2 className="transactions-selection-action-icon" />
                </button>
              </div>
            </div>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="transactions-filter-toggle"
          >
            <Filter className="transactions-filter-toggle-icon" />
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="transactions-refresh-button"
          >
            <RefreshCw className={`transactions-refresh-icon ${isRefreshing ? 'spinning' : ''}`} />
            {isRefreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="transactions-export-button"
          >
            <Download className="transactions-export-icon" />
            Exportar
          </button>
        </div>
      </div>

      {/* ✅ Filtros */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="transactions-filters-container"
          >
            <TransactionFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onDateRangeChange={handleDateRangeChange}
              onReset={resetFilters}
              transactionCount={filteredTransactions.length}
              totalCount={transactions.length}
              categories={categories}
              customers={customers}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ Estadísticas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="transactions-stats-grid"
      >
        <div className="transactions-stat revenue">
          <div className="transactions-stat-header">
            <div className="transactions-stat-icon revenue">
              <ArrowUpRight className="transactions-stat-icon-svg" />
            </div>
            <span className="transactions-stat-trend">
              {stats.totalRevenue > 0 && stats.totalExpenses > 0
                ? `+${((stats.totalRevenue - stats.totalExpenses) / stats.totalExpenses * 100).toFixed(1)}%`
                : '+0%'
              }
            </span>
          </div>
          <h3 className="transactions-stat-value">{formatCurrency(stats.totalRevenue)}</h3>
          <p className="transactions-stat-label">Ingresos Totales</p>
          <div className="transactions-stat-detail">
            {transactionSummary.sales.count} ventas realizadas
          </div>
        </div>

        <div className="transactions-stat expenses">
          <div className="transactions-stat-header">
            <div className="transactions-stat-icon expenses">
              <ArrowDownRight className="transactions-stat-icon-svg" />
            </div>
            <span className="transactions-stat-trend">
              {stats.totalRevenue > 0
                ? `-${((stats.totalExpenses / stats.totalRevenue) * 100).toFixed(1)}%`
                : '-0%'
              }
            </span>
          </div>
          <h3 className="transactions-stat-value">{formatCurrency(stats.totalExpenses)}</h3>
          <p className="transactions-stat-label">Gastos Totales</p>
          <div className="transactions-stat-detail">
            {transactionSummary.purchases.count + transactionSummary.expenses.count} transacciones
          </div>
        </div>

        <div className="transactions-stat profit">
          <div className="transactions-stat-header">
            <div className="transactions-stat-icon profit">
              <TrendingUp className="transactions-stat-icon-svg" />
            </div>
            <span className="transactions-stat-trend">
              {stats.totalRevenue > 0
                ? `+${((stats.netProfit / stats.totalRevenue) * 100).toFixed(1)}%`
                : '+0%'
              }
            </span>
          </div>
          <h3 className="transactions-stat-value">{formatCurrency(stats.netProfit)}</h3>
          <p className="transactions-stat-label">Utilidad Neta</p>
          <div className="transactions-stat-detail">
            {stats.averageTransaction > 0 ? formatCurrency(stats.averageTransaction) : 'N/A'} promedio
          </div>
        </div>

        <div className="transactions-stat count">
          <div className="transactions-stat-header">
            <div className="transactions-stat-icon count">
              <DollarSign className="transactions-stat-icon-svg" />
            </div>
            <span className="transactions-stat-trend">+{stats.transactionCount}</span>
          </div>
          <h3 className="transactions-stat-value">{stats.transactionCount}</h3>
          <p className="transactions-stat-label">Total Transacciones</p>
          <div className="transactions-stat-detail">
            {stats.pendingAmount > 0 ? `${formatCurrency(stats.pendingAmount)} pendientes` : 'Todas completadas'}
          </div>
        </div>
      </motion.div>

      {/* ✅ Selector de vista */}
      <div className="transactions-view-controls">
        <div className="transactions-view-info">
          <div className="transactions-view-count">
            Mostrando {filteredTransactions.length} de {pagination.total} transacciones
          </div>
          <div className="transactions-view-toggle">
            <button
              onClick={() => setViewMode('table')}
              className={`transactions-view-button ${viewMode === 'table' ? 'active' : ''}`}
            >
              <Grid className="transactions-view-button-icon" />
              Tabla
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`transactions-view-button ${viewMode === 'card' ? 'active' : ''}`}
            >
              <Layers className="transactions-view-button-icon" />
              Tarjetas
            </button>
          </div>
        </div>

        <div className="transactions-selection-controls">
          <button
            onClick={selectAllTransactions}
            className="transactions-select-all"
          >
            {selectedTransactions.size === filteredTransactions.length
              ? <><CheckSquare className="transactions-select-all-icon" /> Deseleccionar todo</>
              : <><Square className="transactions-select-all-icon" /> Seleccionar todo</>
            }
          </button>
        </div>
      </div>

      {/* ✅ Renderizar vista según el modo */}
      {viewMode === 'table' ? (
        <TransactionTableView
          transactions={filteredTransactions}
          expandedRows={expandedRows}
          selectedTransactions={selectedTransactions}
          onToggleRow={toggleRowExpansion}
          onSelectTransaction={toggleTransactionSelection}
          onSelectAll={selectAllTransactions}
          getTypeConfig={getTypeConfig}
          getStatusConfig={getStatusConfig}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          onLoadMore={loadMoreTransactions}
          hasMore={filteredTransactions.length < pagination.total}
        />
      ) : (
        <TransactionCardView
          transactions={filteredTransactions}
          selectedTransactions={selectedTransactions}
          onSelectTransaction={toggleTransactionSelection}
          getTypeConfig={getTypeConfig}
          getStatusConfig={getStatusConfig}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      )}

      {/* ✅ Resumen por categoría */}
      {filteredTransactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="transactions-summary"
        >
          <h3 className="transactions-summary-title">Resumen por Categoría</h3>
          <div className="transactions-summary-grid">
            {Object.entries(transactionSummary).map(([category, data]) => (
              <div key={category} className="transactions-summary-item">
                <div className="transactions-summary-category">{category}</div>
                <div className="transactions-summary-value">
                  {formatCurrency(data.amount)}
                </div>
                <div className="transactions-summary-count">{data.count} transacciones</div>
                <div className="transactions-summary-average">
                  Promedio: {data.count > 0 ? formatCurrency(data.amount / data.count) : 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ✅ Componente de vista de tabla
const TransactionTableView = React.memo(({
  transactions,
  expandedRows,
  selectedTransactions,
  onToggleRow,
  onSelectTransaction,
  onSelectAll,
  getTypeConfig,
  getStatusConfig,
  formatCurrency,
  formatDate,
  onLoadMore,
  hasMore
}) => {
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  // ✅ Manejar ordenación
  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // ✅ Transacciones ordenadas
  const sortedTransactions = useMemo(() => {
    const sorted = [...transactions];
    if (!sortConfig.key) return sorted;

    return sorted.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Manejar fechas
      if (sortConfig.key === 'date') {
        aValue = new Date(aValue || a.created_at);
        bValue = new Date(bValue || b.created_at);
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [transactions, sortConfig]);

  if (transactions.length === 0) {
    return (
      <div className="transactions-empty">
        <Filter className="transactions-empty-icon" />
        <h3 className="transactions-empty-title">No se encontraron transacciones</h3>
        <p className="transactions-empty-text">Intenta ajustar los filtros para ver resultados</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="transactions-table-container"
    >
      <div className="transactions-table-wrapper">
        <table className="transactions-table">
          <thead className="transactions-table-head">
            <tr>
              <th className="transactions-table-th selection">
                <input
                  type="checkbox"
                  checked={selectedTransactions.size === transactions.length && transactions.length > 0}
                  onChange={onSelectAll}
                  className="transactions-table-checkbox"
                  disabled={transactions.length === 0}
                />
              </th>
              <th
                className="transactions-table-th date"
                onClick={() => handleSort('date')}
              >
                Fecha {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="transactions-table-th description">
                Descripción
              </th>
              <th className="transactions-table-th type">
                Tipo
              </th>
              <th
                className="transactions-table-th amount"
                onClick={() => handleSort('amount')}
              >
                Monto {sortConfig.key === 'amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="transactions-table-th contact">
                Cliente/Proveedor
              </th>
              <th className="transactions-table-th status">
                Estado
              </th>
              <th className="transactions-table-th actions">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="transactions-table-body">
            {sortedTransactions.map((transaction) => {
              const typeConfig = getTypeConfig(transaction.type);
              const statusConfig = getStatusConfig(transaction.status);
              const TypeIcon = typeConfig.icon;
              const StatusIcon = statusConfig.icon;
              const isExpanded = expandedRows.has(transaction.id);
              const isSelected = selectedTransactions.has(transaction.id);

              return (
                <React.Fragment key={transaction.id}>
                  <tr className={`transactions-table-row ${isSelected ? 'selected' : ''}`}>
                    <td className="transactions-table-td selection">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectTransaction(transaction.id)}
                        className="transactions-table-checkbox"
                      />
                    </td>
                    <td className="transactions-table-td date">
                      <div className="transactions-table-date">{formatDate(transaction.date)}</div>
                    </td>
                    <td className="transactions-table-td description">
                      <div className="transactions-table-description">{transaction.description}</div>
                      <div className="transactions-table-invoice">{transaction.invoice}</div>
                      {transaction.category && (
                        <div className="transactions-table-category">
                          <Tag className="transactions-table-category-icon" />
                          {transaction.category}
                        </div>
                      )}
                    </td>
                    <td className="transactions-table-td type">
                      <span className={`transactions-table-type ${typeConfig.color}`}>
                        <TypeIcon className="transactions-table-type-icon" />
                        {typeConfig.label}
                      </span>
                    </td>
                    <td className="transactions-table-td amount">
                      <div className={`transactions-table-amount ${transaction.type === 'sale' ? 'positive' : 'negative'}`}>
                        {formatCurrency(transaction.amount)}
                      </div>
                    </td>
                    <td className="transactions-table-td contact">
                      <div className="transactions-table-contact">
                        {transaction.customer || transaction.supplier || 'N/A'}
                      </div>
                      {transaction.customer_email && (
                        <div className="transactions-table-email">{transaction.customer_email}</div>
                      )}
                    </td>
                    <td className="transactions-table-td status">
                      <span className={`transactions-table-status ${statusConfig.color}`}>
                        <StatusIcon className="transactions-table-status-icon" />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="transactions-table-td actions">
                      <div className="transactions-table-actions">
                        <button
                          onClick={() => onToggleRow(transaction.id)}
                          className="transactions-table-action"
                          title={isExpanded ? 'Contraer detalles' : 'Expandir detalles'}
                        >
                          {isExpanded ? (
                            <ChevronUp className="transactions-table-action-icon" />
                          ) : (
                            <ChevronDown className="transactions-table-action-icon" />
                          )}
                        </button>
                        <button
                          onClick={() => window.open(`/transactions/${transaction.id}`, '_blank')}
                          className="transactions-table-action"
                          title="Ver detalles"
                        >
                          <Eye className="transactions-table-action-icon" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Detalles expandidos */}
                  {isExpanded && (
                    <tr className="transactions-table-details">
                      <td colSpan="8" className="transactions-table-details-cell">
                        <div className="transactions-table-details-content">
                          <div className="transactions-table-details-grid">
                            <div className="transactions-table-details-section">
                              <h4 className="transactions-table-details-title">Detalles Financieros</h4>
                              <div className="transactions-table-details-list">
                                <div className="transactions-table-details-item">
                                  <span className="transactions-table-details-label">Monto Bruto:</span>
                                  <span className="transactions-table-details-value">{formatCurrency(transaction.amount)}</span>
                                </div>
                                {transaction.tax > 0 && (
                                  <div className="transactions-table-details-item">
                                    <span className="transactions-table-details-label">Impuestos:</span>
                                    <span className="transactions-table-details-value negative">{formatCurrency(transaction.tax)}</span>
                                  </div>
                                )}
                                {transaction.discount > 0 && (
                                  <div className="transactions-table-details-item">
                                    <span className="transactions-table-details-label">Descuento:</span>
                                    <span className="transactions-table-details-value positive">-{formatCurrency(transaction.discount)}</span>
                                  </div>
                                )}
                                <div className="transactions-table-details-item total">
                                  <span className="transactions-table-details-label">Monto Neto:</span>
                                  <span className="transactions-table-details-value bold">{formatCurrency(transaction.net_amount || transaction.amount)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="transactions-table-details-section">
                              <h4 className="transactions-table-details-title">Información de Contacto</h4>
                              <div className="transactions-table-details-list">
                                <div className="transactions-table-details-item">
                                  <Users className="transactions-table-details-icon" />
                                  <span>{transaction.customer || transaction.supplier || 'N/A'}</span>
                                </div>
                                {transaction.customer_email && (
                                  <div className="transactions-table-details-item">
                                    <Building className="transactions-table-details-icon" />
                                    <span>{transaction.customer_email}</span>
                                  </div>
                                )}
                                {transaction.customer_phone && (
                                  <div className="transactions-table-details-item">
                                    <span className="transactions-table-details-icon phone">📱</span>
                                    <span>{transaction.customer_phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="transactions-table-details-section">
                              <h4 className="transactions-table-details-title">Notas</h4>
                              <p className="transactions-table-details-notes">
                                {transaction.notes || 'Sin notas adicionales'}
                              </p>
                            </div>
                          </div>

                          {transaction.items && transaction.items.length > 0 && (
                            <div className="transactions-table-items">
                              <h4 className="transactions-table-items-title">Artículos</h4>
                              <div className="transactions-table-items-table">
                                <table className="transactions-items-table">
                                  <thead>
                                    <tr>
                                      <th className="transactions-items-th">Artículo</th>
                                      <th className="transactions-items-th">Cantidad</th>
                                      <th className="transactions-items-th">Precio Unitario</th>
                                      <th className="transactions-items-th">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {transaction.items.map((item, index) => (
                                      <tr key={index}>
                                        <td className="transactions-items-td">{item.name}</td>
                                        <td className="transactions-items-td">{item.quantity}</td>
                                        <td className="transactions-items-td">{formatCurrency(item.price)}</td>
                                        <td className="transactions-items-td">
                                          {formatCurrency(item.price * item.quantity)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ✅ Botón para cargar más */}
      {hasMore && (
        <div className="transactions-load-more">
          <button
            onClick={onLoadMore}
            className="transactions-load-more-button"
          >
            Cargar más transacciones
          </button>
        </div>
      )}
    </motion.div>
  );
});

TransactionTableView.propTypes = {
  transactions: PropTypes.array.isRequired,
  expandedRows: PropTypes.instanceOf(Set).isRequired,
  selectedTransactions: PropTypes.instanceOf(Set).isRequired,
  onToggleRow: PropTypes.func.isRequired,
  onSelectTransaction: PropTypes.func.isRequired,
  onSelectAll: PropTypes.func.isRequired,
  getTypeConfig: PropTypes.func.isRequired,
  getStatusConfig: PropTypes.func.isRequired,
  formatCurrency: PropTypes.func.isRequired,
  formatDate: PropTypes.func.isRequired,
  onLoadMore: PropTypes.func.isRequired,
  hasMore: PropTypes.bool.isRequired
};

TransactionTableView.displayName = 'TransactionTableView';

// ✅ Componente de vista de tarjetas
const TransactionCardView = React.memo(({
  transactions,
  selectedTransactions,
  onSelectTransaction,
  getTypeConfig,
  getStatusConfig,
  formatCurrency,
  formatDate
}) => {
  if (transactions.length === 0) {
    return (
      <div className="transactions-card-empty">
        <Layers className="transactions-card-empty-icon" />
        <h3 className="transactions-card-empty-title">No se encontraron transacciones</h3>
        <p className="transactions-card-empty-text">Intenta ajustar los filtros para ver resultados</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="transactions-card-grid"
    >
      {transactions.map((transaction) => {
        const typeConfig = getTypeConfig(transaction.type);
        const statusConfig = getStatusConfig(transaction.status);
        const TypeIcon = typeConfig.icon;
        const StatusIcon = statusConfig.icon;
        const isSelected = selectedTransactions.has(transaction.id);

        return (
          <div
            key={transaction.id}
            className={`transactions-card ${isSelected ? 'selected' : ''}`}
          >
            <div className="transactions-card-content">
              <div className="transactions-card-header">
                <div className="transactions-card-info">
                  <div className="transactions-card-invoice">{transaction.invoice}</div>
                  <div className="transactions-card-date">{formatDate(transaction.date)}</div>
                </div>
                <span className={`transactions-card-type ${typeConfig.color}`}>
                  <TypeIcon className="transactions-card-type-icon" />
                  {typeConfig.label}
                </span>
              </div>

              <h3 className="transactions-card-title">{transaction.description}</h3>

              <div className="transactions-card-amount">
                <div className={`transactions-card-amount-value ${transaction.type === 'sale' ? 'positive' : 'negative'}`}>
                  {formatCurrency(transaction.amount)}
                </div>
              </div>

              <div className="transactions-card-details">
                <div className="transactions-card-detail">
                  <Users className="transactions-card-detail-icon" />
                  <span>{transaction.customer || transaction.supplier || 'N/A'}</span>
                </div>

                <div className="transactions-card-payment">
                  <div className="transactions-card-payment-method">
                    {transaction.paymentMethod === 'credit_card' && <CreditCard className="transactions-card-payment-icon" />}
                    {transaction.paymentMethod === 'cash' && <Wallet className="transactions-card-payment-icon" />}
                    <span className="transactions-card-payment-text">
                      {transaction.paymentMethod?.replace('_', ' ') || 'No especificado'}
                    </span>
                  </div>

                  <span className={`transactions-card-status ${statusConfig.color}`}>
                    <StatusIcon className="transactions-card-status-icon" />
                    {statusConfig.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="transactions-card-footer">
              <button
                onClick={() => window.open(`/transactions/${transaction.id}`, '_blank')}
                className="transactions-card-action"
              >
                <Eye className="transactions-card-action-icon" />
                Ver detalles
              </button>
              <div className="transactions-card-selection">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onSelectTransaction(transaction.id)}
                  className="transactions-card-checkbox"
                />
              </div>
            </div>
          </div>
        );
      })}
    </motion.div>
  );
});

TransactionCardView.propTypes = {
  transactions: PropTypes.array.isRequired,
  selectedTransactions: PropTypes.instanceOf(Set).isRequired,
  onSelectTransaction: PropTypes.func.isRequired,
  getTypeConfig: PropTypes.func.isRequired,
  getStatusConfig: PropTypes.func.isRequired,
  formatCurrency: PropTypes.func.isRequired,
  formatDate: PropTypes.func.isRequired
};

TransactionCardView.displayName = 'TransactionCardView';

// ✅ Componente de filtros
const TransactionFilters = React.memo(({
  filters,
  onFilterChange,
  onDateRangeChange,
  onReset,
  transactionCount,
  totalCount,
  categories = [],
  customers = []
}) => {
  const dateRanges = [
    { id: 'today', label: 'Hoy' },
    { id: 'week', label: 'Última semana' },
    { id: 'month', label: 'Último mes' },
    { id: 'quarter', label: 'Último trimestre' },
    { id: 'year', label: 'Último año' },
    { id: 'all', label: 'Todo' }
  ];

  const types = [
    { id: 'all', label: 'Todos' },
    { id: 'sale', label: 'Ventas' },
    { id: 'purchase', label: 'Compras' },
    { id: 'expense', label: 'Gastos' },
    { id: 'refund', label: 'Devoluciones' }
  ];

  const statuses = [
    { id: 'all', label: 'Todos' },
    { id: 'completed', label: 'Completado' },
    { id: 'pending', label: 'Pendiente' },
    { id: 'processing', label: 'Procesando' },
    { id: 'cancelled', label: 'Cancelado' }
  ];

  const paymentMethods = [
    { id: 'all', label: 'Todos' },
    { id: 'cash', label: 'Efectivo' },
    { id: 'credit_card', label: 'Tarjeta de crédito' },
    { id: 'debit_card', label: 'Tarjeta de débito' },
    { id: 'bank_transfer', label: 'Transferencia bancaria' },
    { id: 'check', label: 'Cheque' }
  ];

  const sortOptions = [
    { id: 'date_desc', label: 'Fecha (más reciente)' },
    { id: 'date_asc', label: 'Fecha (más antigua)' },
    { id: 'amount_desc', label: 'Monto (mayor a menor)' },
    { id: 'amount_asc', label: 'Monto (menor a mayor)' }
  ];

  const handleSearchChange = useCallback((e) => {
    onFilterChange('search', e.target.value);
  }, [onFilterChange]);

  const handleTypeChange = useCallback((e) => {
    onFilterChange('type', e.target.value);
  }, [onFilterChange]);

  const handleDateRangeSelect = useCallback((e) => {
    onDateRangeChange(e.target.value);
  }, [onDateRangeChange]);

  const handleStatusChange = useCallback((e) => {
    onFilterChange('status', e.target.value);
  }, [onFilterChange]);

  const handlePaymentMethodChange = useCallback((e) => {
    onFilterChange('paymentMethod', e.target.value);
  }, [onFilterChange]);

  const handleStartDateChange = useCallback((e) => {
    onFilterChange('startDate', e.target.value);
  }, [onFilterChange]);

  const handleEndDateChange = useCallback((e) => {
    onFilterChange('endDate', e.target.value);
  }, [onFilterChange]);

  const handleMinAmountChange = useCallback((e) => {
    onFilterChange('minAmount', e.target.value);
  }, [onFilterChange]);

  const handleMaxAmountChange = useCallback((e) => {
    onFilterChange('maxAmount', e.target.value);
  }, [onFilterChange]);

  const handleCategoryChange = useCallback((e) => {
    onFilterChange('category', e.target.value);
  }, [onFilterChange]);

  const handleSortChange = useCallback((e) => {
    onFilterChange('sortBy', e.target.value);
  }, [onFilterChange]);

  const handleReset = useCallback(() => {
    onReset();
  }, [onReset]);

  return (
    <div className="transactions-filters-card">
      <div className="transactions-filters-header">
        <h3 className="transactions-filters-title">Filtros Avanzados</h3>
        <div className="transactions-filters-count">
          {transactionCount} de {totalCount} transacciones
        </div>
      </div>

      <div className="transactions-filters-content">
        <div className="transactions-filter-search">
          <label className="transactions-filter-label">Búsqueda</label>
          <div className="transactions-search-container">
            <Search className="transactions-search-icon" />
            <input
              type="text"
              placeholder="Buscar por descripción, factura, cliente..."
              value={filters.search}
              onChange={handleSearchChange}
              className="transactions-search-input"
            />
          </div>
        </div>

        <div className="transactions-filters-grid">
          <div className="transactions-filter-group">
            <label className="transactions-filter-label">Tipo de Transacción</label>
            <select
              value={filters.type}
              onChange={handleTypeChange}
              className="transactions-filter-select"
            >
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="transactions-filter-group">
            <label className="transactions-filter-label">Rango de Fechas</label>
            <select
              value={filters.dateRange}
              onChange={handleDateRangeSelect}
              className="transactions-filter-select"
            >
              {dateRanges.map((range) => (
                <option key={range.id} value={range.id}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          <div className="transactions-filter-group">
            <label className="transactions-filter-label">Estado</label>
            <select
              value={filters.status}
              onChange={handleStatusChange}
              className="transactions-filter-select"
            >
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className="transactions-filter-group">
            <label
              className="transactions-filter-label"
              htmlFor="transactions-payment-method"
            >
              Método de Pago
            </label>

            <select
              id="transactions-payment-method"
              name="paymentMethod"
              className="transactions-filter-input"
            >
              <option value="all">Todos</option>
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
              <option value="transfer">Transferencia</option>
            </select>

          </div>
        </div>

        <div className="transactions-filters-secondary">
          <div className="transactions-filter-group">
            <label
              className="transactions-filter-label"
              htmlFor="transactions-date-from"
            >
              Fecha desde
            </label>

            <input
              id="transactions-date-from"
              type="date"
              name="dateFrom"
              className="transactions-filter-input"
            />

          </div>

          <div className="transactions-filter-group">
            <label
              className="transactions-filter-label"
              htmlFor="transactions-date-until"
            >
              Fecha hasta
            </label>

            <input
              id="transactions-date-until"
              type="date"
              name="dateUntil"
              className="transactions-filter-input"
            />

            <input
              type="date"
              value={filters.endDate}
              onChange={handleEndDateChange}
              className="transactions-filter-input"
              min={filters.startDate}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="transactions-amount-filters">
            <div className="transactions-filter-group">
              <label
                className="transactions-filter-label"
                htmlFor="transactions-min-amount"
              >
                Monto mínimo
              </label>

              <input
                id="transactions-min-amount"
                type="number"
                name="minAmount"
                placeholder="Ingrese monto"
                className="transactions-filter-input"
              />

            </div>
            <div className="transactions-filter-group">
              <label
                className="transactions-filter-label"
                htmlFor="transactions-max-amount"
              >
                Monto máximo
              </label>

              <input
                id="transactions-max-amount"
                type="number"
                name="maxAmount"
                placeholder="Ingrese monto"
                className="transactions-filter-input"
              />

            </div>
          </div>
        </div>

        <div className="transactions-filters-tertiary">
          <div className="transactions-filter-group">
            <label
              className="transactions-filter-label"
              htmlFor="transactions-category-select"
            >
              Categoría
            </label>

            <select id="transactions-category-select" name="category">
              <option value="all">Todas</option>
              <option value="food">Alimentación</option>
              <option value="transport">Transporte</option>
              <option value="services">Servicios</option>
            </select>

          </div>

          <div className="transactions-filter-group">
            <label
              className="transactions-filter-label"
              htmlFor="transactions-order-select"
            >
              Ordenar por
            </label>

            <select id="transactions-order-select" name="order">
              <option value="date">Fecha</option>
              <option value="amount">Monto</option>
            </select>

          </div>
        </div>

        <div className="transactions-filters-footer">
          <button
            onClick={handleReset}
            className="transactions-filters-clear"
          >
            <FilterX className="transactions-filters-clear-icon" />
            Limpiar Filtros
          </button>

          <div className="transactions-filters-date-info">
            <Calendar className="transactions-filters-date-icon" />
            {filters.startDate && filters.endDate
              ? `${filters.startDate} - ${filters.endDate}`
              : 'Todo el período'
            }
          </div>
        </div>
      </div>
    </div>
  );
});

TransactionFilters.propTypes = {
  filters: PropTypes.object.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onDateRangeChange: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  transactionCount: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  categories: PropTypes.array,
  customers: PropTypes.array
};

TransactionFilters.defaultProps = {
  categories: [],
  customers: []
};

TransactionFilters.displayName = 'TransactionFilters';

// ✅ Prop Types
TransactionReport.propTypes = {
  // No hay props requeridas para este componente
};

export default React.memo(TransactionReport);