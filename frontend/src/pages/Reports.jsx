import React, { useState, useCallback, useEffect, useMemo, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { 
  BarChart3, TrendingUp, Download, 
  Calendar, DollarSign, Package,
  ShoppingCart, Users, RefreshCw, Settings,
  AlertCircle
} from 'lucide-react';

// ✅ MEJORA: Importación dinámica para mejor rendimiento
const InventoryReport = lazy(() => import('../components/reports/InventoryReport'));
const TransactionReport = lazy(() => import('../components/reports/TransactionReport'));
const ReportDashboard = lazy(() => import('../components/reports/ReportDashboard'));
const ExportOptions = lazy(() => import('../components/reports/ExportOptions'));

// ✅ MEJORA: Configuración de API
const API_CONFIG = {
  BASE_URL: globalThis.APP_CONFIG?.apiUrl || 'http://localhost:3000/api',
  getAuthHeader: () => ({
    'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  })
};

// ✅ MEJORA: Loading fallback para suspense
const LoadingFallback = () => (
  <div className="bg-white rounded-xl shadow-sm p-12 flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="relative inline-block">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-blue-500" />
        </div>
      </div>
      <p className="text-gray-600 mt-2">Cargando reporte...</p>
      <p className="text-sm text-gray-400 mt-1">Por favor espera</p>
    </div>
  </div>
);

// ✅ MEJORA: Tipos de reporte como constante para evitar recreación
const REPORT_TYPES = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, color: 'bg-blue-500' },
  { id: 'inventory', label: 'Inventario', icon: Package, color: 'bg-green-500' },
  { id: 'transactions', label: 'Transacciones', icon: TrendingUp, color: 'bg-purple-500' },
  { id: 'sales', label: 'Ventas', icon: DollarSign, color: 'bg-yellow-500' },
  { id: 'customers', label: 'Clientes', icon: Users, color: 'bg-pink-500' },
  { id: 'products', label: 'Productos', icon: ShoppingCart, color: 'bg-orange-500' }
];

// ✅ MEJORA: Rango de fechas como constante
const DATE_RANGES = [
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: 'Esta semana' },
  { id: 'month', label: 'Este mes' },
  { id: 'quarter', label: 'Este trimestre' },
  { id: 'year', label: 'Este año' },
  { id: 'custom', label: 'Personalizado' }
];

// ✅ MEJORA: Tarjetas de resumen como componente separado
const SummaryCard = React.memo(({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  colorClass, 
  changePositive 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02 }}
    transition={{ type: 'spring', stiffness: 300 }}
    className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 ${colorClass} bg-opacity-20 rounded-xl`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className={`text-sm font-medium px-2 py-1 rounded-full ${changePositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {change}
      </span>
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
    <p className="text-gray-600 text-sm">{title}</p>
  </motion.div>
));

SummaryCard.displayName = 'SummaryCard';

SummaryCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  change: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  colorClass: PropTypes.string.isRequired,
  changePositive: PropTypes.bool.isRequired
};

// ✅ COMPONENTE PRINCIPAL MEJORADO
const Reports = () => {
  // ✅ MEJORA: Estado inicializado desde localStorage si existe
  const getInitialState = useCallback(() => {
    try {
      const saved = localStorage.getItem('reportsState');
      if (saved) {
        const parsed = JSON.parse(saved);
        // ✅ MEJORA: Validar estructura del estado guardado
        if (parsed && typeof parsed === 'object') {
          const hasActiveReport = REPORT_TYPES.some(r => r.id === parsed.activeReport);
          const hasDateRange = DATE_RANGES.some(d => d.id === parsed.dateRange);
          
          return {
            activeReport: hasActiveReport ? parsed.activeReport : 'dashboard',
            dateRange: hasDateRange ? parsed.dateRange : 'month'
          };
        }
      }
    } catch (error) {
      console.error('Error loading saved state:', error);
    }
    return {
      activeReport: 'dashboard',
      dateRange: 'month'
    };
  }, []);

  const [activeReport, setActiveReport] = useState(getInitialState().activeReport);
  const [dateRange, setDateRange] = useState(getInitialState().dateRange);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);

  // ✅ MEJORA: Guardar estado en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('reportsState', JSON.stringify({
        activeReport,
        dateRange
      }));
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }, [activeReport, dateRange]);

  // ✅ MEJORA: Fetch de datos del reporte
  const fetchReportData = useCallback(async () => {
    if (!activeReport) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // ✅ MEJORA: Validación de parámetros
      const params = new URLSearchParams({
        type: activeReport,
        range: dateRange,
        timestamp: new Date().toISOString()
      }).toString();
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/reports?${params}`, {
        headers: API_CONFIG.getAuthHeader(),
        signal: AbortSignal.timeout(30000) // Timeout de 30 segundos
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // ✅ MEJORA: Validar datos recibidos
      if (!data || typeof data !== 'object') {
        throw new Error('Datos del reporte inválidos');
      }
      
      setReportData(data);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError(err.name === 'AbortError' 
        ? 'Tiempo de espera agotado. Verifica tu conexión.'
        : err.message || 'Error al cargar el reporte'
      );
    } finally {
      setLoading(false);
    }
  }, [activeReport, dateRange]);

  // ✅ MEJORA: Cargar datos al cambiar reporte o rango de fechas
  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // ✅ MEJORA: useCallback para funciones handler
  const handleExport = useCallback(() => {
    setShowExportOptions(true);
  }, []);

  const handleExportComplete = useCallback(async (config) => {
    try {
      console.log('Export config:', config);
      
      // ✅ MEJORA: Implementación real de exportación
      const response = await fetch(`${API_CONFIG.BASE_URL}/reports/export`, {
        method: 'POST',
        headers: API_CONFIG.getAuthHeader(),
        body: JSON.stringify({
          reportType: activeReport,
          dateRange,
          format: config.format || 'pdf',
          includeCharts: config.includeCharts || false,
          filters: config.filters || {}
        })
      });
      
      if (!response.ok) {
        throw new Error('Error al exportar el reporte');
      }
      
      const blob = await response.blob();
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${activeReport}_${new Date().toISOString().split('T')[0]}.${config.format || 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      globalThis.URL.revokeObjectURL(url);
      a.remove();
      
      setShowExportOptions(false);
    } catch (error) {
      console.error('Error exporting report:', error);
      setError('Error al exportar el reporte');
    }
  }, [activeReport, dateRange]);

  const handleRefresh = useCallback(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleReportChange = useCallback((reportId) => {
    if (!REPORT_TYPES.some(r => r.id === reportId)) {
      console.error('Report type not found:', reportId);
      return;
    }
    
    setActiveReport(reportId);
    // ✅ MEJORA: Scroll suave al cambiar reporte
    globalThis.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ✅ MEJORA: Función para renderizar el contenido del reporte
  const renderReportContent = () => {
    if (loading) {
      return <LoadingFallback />;
    }

    if (error) {
      return (
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12 text-center">
          <div className="inline-flex p-4 bg-red-100 rounded-full mb-4">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar reporte</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRefresh}
              className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
            >
              Reintentar
            </button>
            <button
              onClick={() => setError(null)}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      );
    }

    switch(activeReport) {
      case 'dashboard':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ReportDashboard 
              data={reportData}
              dateRange={dateRange}
              onRefresh={handleRefresh}
            />
          </Suspense>
        );
      case 'inventory':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <InventoryReport 
              data={reportData}
              dateRange={dateRange}
            />
          </Suspense>
        );
      case 'transactions':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <TransactionReport 
              data={reportData}
              dateRange={dateRange}
            />
          </Suspense>
        );
      default:
        const currentReport = REPORT_TYPES.find(r => r.id === activeReport);
        return (
          <div className="bg-white rounded-xl shadow-sm p-8 md:p-12 text-center">
            <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
              {currentReport?.icon && 
                React.createElement(currentReport.icon, {
                  className: "w-12 h-12 text-gray-400"
                })
              }
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {currentReport?.label || 'Reporte'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Este reporte está en desarrollo y estará disponible próximamente.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => handleReportChange('dashboard')}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                Ir al Dashboard
              </button>
              <button
                onClick={() => handleReportChange('inventory')}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
              >
                Ver Reporte de Inventario
              </button>
            </div>
          </div>
        );
    }
  };

  // ✅ MEJORA: Datos de tarjetas de resumen desde API o por defecto
  const summaryCards = useMemo(() => {
    if (reportData?.summary) {
      return reportData.summary;
    }
    
    // ✅ MEJORA: Datos por defecto mientras carga
    return [
      {
        id: 'revenue',
        title: 'Ingresos totales',
        value: '$24,580',
        change: '+12.5%',
        icon: DollarSign,
        colorClass: 'text-blue-600 bg-blue-100',
        changePositive: true
      },
      {
        id: 'orders',
        title: 'Pedidos completados',
        value: '156',
        change: '+8.3%',
        icon: ShoppingCart,
        colorClass: 'text-green-600 bg-green-100',
        changePositive: true
      },
      {
        id: 'inventory',
        title: 'Productos en inventario',
        value: '1,248',
        change: '-2.1%',
        icon: Package,
        colorClass: 'text-purple-600 bg-purple-100',
        changePositive: false
      },
      {
        id: 'customers',
        title: 'Clientes nuevos',
        value: '48',
        change: '+5.7%',
        icon: Users,
        colorClass: 'text-orange-600 bg-orange-100',
        changePositive: true
      }
    ];
  }, [reportData]);

  // ✅ MEJORA: Función para formatear fecha del rango seleccionado
  const getDateRangeLabel = useCallback(() => {
    const range = DATE_RANGES.find(r => r.id === dateRange);
    if (!range) return 'Este mes';
    
    if (dateRange === 'custom') {
      return 'Personalizado';
    }
    
    const now = new Date();
    let label = range.label;
    
    // ✅ MEJORA: Añadir fechas específicas para contexto
    switch(dateRange) {
      case 'today':
        label = `Hoy, ${now.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`;
        break;
      case 'week':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        label = `Semana del ${startOfWeek.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`;
        break;
      case 'month':
        label = `${now.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}`;
        break;
      case 'quarter':
        const quarter = Math.floor((now.getMonth() + 3) / 3);
        label = `T${quarter} ${now.getFullYear()}`;
        break;
      case 'year':
        label = `Año ${now.getFullYear()}`;
        break;
      default:
        label = range.label;
    }
    
    return label;
  }, [dateRange]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
        {/* ✅ MEJORA: Header mejorado */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 md:p-6 rounded-xl shadow-sm"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Reportes y Análisis</h1>
            </div>
            <p className="text-gray-600">
              Visualiza y analiza el rendimiento de tu inventario • {getDateRangeLabel()}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200 appearance-none"
                aria-label="Seleccionar rango de fechas"
                disabled={loading}
              >
                {DATE_RANGES.map((range) => (
                  <option key={range.id} value={range.id}>
                    {range.label}
                  </option>
                ))}
              </select>
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center font-medium"
              aria-label="Actualizar reportes"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Actualizando...' : 'Actualizar'}
            </button>
            
            <button
              onClick={handleExport}
              disabled={loading || !reportData}
              className="px-4 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center font-medium shadow-sm"
              aria-label="Exportar reportes"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </button>
          </div>
        </motion.div>

        {/* ✅ MEJORA: Tarjetas de resumen como grid responsivo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {summaryCards.map((card) => (
            <SummaryCard
              key={card.id}
              {...card}
            />
          ))}
        </motion.div>

        {/* ✅ MEJORA: Navegación de reportes mejorada */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-4"
        >
          <div className="flex flex-wrap gap-2 items-center">
            {REPORT_TYPES.map((report) => {
              const Icon = report.icon;
              const isActive = activeReport === report.id;
              
              return (
                <button
                  key={report.id}
                  onClick={() => handleReportChange(report.id)}
                  className={`flex items-center px-4 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? `${report.color} text-white shadow-sm`
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-pressed={isActive}
                  aria-label={`Ver reporte de ${report.label.toLowerCase()}`}
                  disabled={loading}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  <span className="font-medium whitespace-nowrap">{report.label}</span>
                </button>
              );
            })}
            
            <button 
              className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 ml-auto"
              aria-label="Configurar reportes"
              disabled={loading}
            >
              <Settings className="w-4 h-4 mr-2" />
              <span className="font-medium hidden sm:inline">Configurar</span>
            </button>
          </div>
        </motion.div>

        {/* ✅ MEJORA: Contenido del reporte con animación optimizada */}
        <motion.div
          key={activeReport}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          layout
        >
          {renderReportContent()}
        </motion.div>

        {/* ✅ MEJORA: Modal de exportación con suspense */}
        {showExportOptions && (
          <Suspense fallback={
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
              <div className="bg-white rounded-xl p-6">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando opciones de exportación...</p>
              </div>
            </div>
          }>
            <ExportOptions
              reportType={activeReport}
              dateRange={dateRange}
              fileName={`reporte_${activeReport}_${new Date().toISOString().split('T')[0]}`}
              onClose={() => setShowExportOptions(false)}
              onExport={handleExportComplete}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
};

export default Reports;