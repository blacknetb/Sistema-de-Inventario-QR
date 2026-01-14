import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import PropTypes from 'prop-types'; // ✅ Importación agregada
import { reportService } from '../../services/reportService';
import { inventoryService } from '../../services/inventoryService';
import Card from '../common/Card';
import Button from '../common/Button';
import { formatCurrency, formatNumber, formatDate } from '../../utils/helpers';
import { useNotification } from '../../context/NotificationContext';
import {
  FiBarChart2, FiTrendingUp, FiTrendingDown, FiPackage,
  FiAlertTriangle, FiDownload, FiMail, FiRefreshCw,
  FiDollarSign, FiPercent, FiCalendar, FiFilter,
  FiArrowUp, FiArrowDown, FiUsers, FiShoppingCart,
  FiEye, FiSettings, FiBell, FiDatabase,
  FiGrid, FiList, FiLayers, FiPieChart,
  FiTarget, FiClock, FiActivity
} from 'react-icons/fi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import ExportOptions from './ExportOptions';

// Registrar ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * ✅ DASHBOARD DE REPORTES MEJORADO
 * Correcciones aplicadas:
 * 1. ✅ Importación de PropTypes agregada
 * 2. ✅ Manejo de errores completo en servicios
 * 3. ✅ Compatibilidad con estilos especificados
 * 4. ✅ Cleanup de intervalos y abort controllers
 * 5. ✅ Memoización de componentes pesados
 * 6. ✅ Validación de datos del backend
 */

const ReportDashboard = () => {
  const { success, error, withLoadingNotification } = useNotification();
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });
  const [timeFrame, setTimeFrame] = useState('month');
  const [selectedView, setSelectedView] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const [dashboardConfig, setDashboardConfig] = useState({
    showCharts: true,
    showAlerts: true,
    showMetrics: true,
    showRecent: true,
    chartType: 'line'
  });
  const [lastRefresh, setLastRefresh] = useState(null);

  // ✅ Referencias para cleanup
  const refreshIntervalRef = useRef(null);
  const abortControllerRef = useRef(null);

  // ✅ Configurar auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        loadDashboardData();
      }, refreshInterval);
    } else {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [autoRefresh, refreshInterval]);

  // ✅ Cargar datos iniciales
  useEffect(() => {
    loadDashboardData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [dateRange, timeFrame]);

  // ✅ Cargar datos del dashboard
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      const [statsResponse, trendsResponse] = await Promise.all([
        reportService.getDashboardStats({ 
          start_date: dateRange.start_date,
          end_date: dateRange.end_date,
          signal 
        }),
        reportService.getInventoryTrends({ 
          timeframe: timeFrame, 
          signal 
        })
      ]);
      
      if (statsResponse.success) {
        setStats(statsResponse.data || {});
      } else {
        error(statsResponse.message || 'Error cargando estadísticas');
      }

      if (trendsResponse.success) {
        setTrends(trendsResponse.data || {});
      } else {
        error(trendsResponse.message || 'Error cargando tendencias');
      }

      setLastRefresh(new Date().toISOString());
    } catch (err) {
      if (err.name !== 'AbortError') {
        error('Error cargando dashboard');
        console.error('Dashboard error:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [dateRange, timeFrame, error]);

  // ✅ Cambiar fecha
  const handleDateChange = useCallback((field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // ✅ Cambiar período
  const handleTimeFrameChange = useCallback(async (timeframe) => {
    setTimeFrame(timeframe);
  }, []);

  // ✅ Aplicar filtros
  const applyFilters = useCallback(async () => {
    await loadDashboardData();
  }, [loadDashboardData]);

  // ✅ Resetear filtros
  const resetFilters = useCallback(() => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    setDateRange({
      start_date: thirtyDaysAgo,
      end_date: today,
    });
    setTimeFrame('month');
  }, []);

  // ✅ Manejar exportación
  const handleExport = useCallback(async (exportConfig) => {
    try {
      await withLoadingNotification(
        reportService.exportDashboard({
          ...exportConfig,
          dateRange,
          timeFrame,
          dashboardConfig,
          stats,
          trends
        }),
        'Exportando dashboard...'
      );
      success('Dashboard exportado exitosamente');
      setShowExportModal(false);
    } catch (err) {
      error('Error al exportar el dashboard');
    }
  }, [dateRange, timeFrame, dashboardConfig, stats, trends, withLoadingNotification, success, error]);

  // ✅ Enviar reporte por email
  const sendEmailReport = useCallback(async () => {
    try {
      await withLoadingNotification(
        reportService.sendDashboardByEmail({
          dateRange,
          timeFrame,
          stats,
          trends
        }),
        'Enviando dashboard por email...'
      );
      success('Dashboard enviado por email exitosamente');
    } catch (err) {
      error('Error enviando dashboard por email');
    }
  }, [dateRange, timeFrame, stats, trends, withLoadingNotification, success, error]);

  // ✅ Acciones rápidas
  const handleQuickAction = useCallback((action) => {
    switch (action) {
      case 'reorder':
        window.location.href = '/purchases/new?source=dashboard';
        break;
      case 'alert':
        withLoadingNotification(
          inventoryService.sendLowStockAlerts(),
          'Enviando alertas...'
        ).then(() => success('Alertas enviadas'))
         .catch(() => error('Error enviando alertas'));
        break;
      case 'export':
        setShowExportModal(true);
        break;
      case 'refresh':
        loadDashboardData();
        break;
      default:
        console.warn('Acción no reconocida:', action);
    }
  }, [withLoadingNotification, success, error, loadDashboardData]);

  // ✅ Datos para gráficos
  const stockChartData = useMemo(() => {
    if (!stats?.products) return null;
    
    return {
      labels: ['En Stock', 'Stock Bajo', 'Sin Stock', 'Exceso'],
      datasets: [
        {
          label: 'Productos',
          data: [
            stats.products.in_stock || 0,
            stats.products.low_stock || 0,
            stats.products.out_of_stock || 0,
            stats.products.over_stock || 0,
          ],
          backgroundColor: [
            'rgba(34, 197, 94, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(239, 68, 68, 0.7)',
            'rgba(59, 130, 246, 0.7)',
          ],
          borderColor: [
            'rgb(34, 197, 94)',
            'rgb(245, 158, 11)',
            'rgb(239, 68, 68)',
            'rgb(59, 130, 246)',
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [stats]);

  const movementChartData = useMemo(() => {
    if (!trends?.daily_movements || !Array.isArray(trends.daily_movements)) return null;
    
    return {
      labels: trends.daily_movements.map(m => formatDate(m.date, 'dd/MM')),
      datasets: [
        {
          label: 'Entradas',
          data: trends.daily_movements.map(m => m.entries || 0),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Salidas',
          data: trends.daily_movements.map(m => m.exits || 0),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [trends]);

  const valueByCategoryData = useMemo(() => {
    if (!stats?.category_value || typeof stats.category_value !== 'object') return null;
    
    const categories = Object.keys(stats.category_value);
    const values = Object.values(stats.category_value);
    
    if (categories.length === 0) return null;
    
    return {
      labels: categories,
      datasets: [
        {
          label: 'Valor por Categoría',
          data: values,
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [stats]);

  // ✅ Opciones de gráficos
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            family: 'inherit'
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          family: 'inherit'
        },
        bodyFont: {
          family: 'inherit'
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          drawBorder: false,
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            family: 'inherit'
          }
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: 'inherit'
          }
        }
      },
    },
  }), []);

  // ✅ Estado de carga
  if (loading && !stats) {
    return (
      <div className="dashboard-loading-container">
        <div className="dashboard-loading-grid">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="dashboard-loading-card">
              <div className="dashboard-loading-content">
                <div className="dashboard-loading-line"></div>
                <div className="dashboard-loading-line long"></div>
                <div className="dashboard-loading-line short"></div>
              </div>
            </Card>
          ))}
        </div>
        <div className="dashboard-loading-charts">
          <Card className="dashboard-loading-chart">
            <div className="dashboard-loading-chart-content"></div>
          </Card>
          <Card className="dashboard-loading-chart">
            <div className="dashboard-loading-chart-content"></div>
          </Card>
        </div>
      </div>
    );
  }

  // ✅ Sin datos
  if (!stats) {
    return (
      <Card className="dashboard-empty-card">
        <div className="dashboard-empty-content">
          <FiBarChart2 className="dashboard-empty-icon" />
          <h3 className="dashboard-empty-title">No hay datos disponibles</h3>
          <p className="dashboard-empty-description">
            No se pudieron cargar las estadísticas del dashboard
          </p>
          <div className="dashboard-empty-actions">
            <Button
              onClick={loadDashboardData}
              variant="primary"
              startIcon={<FiRefreshCw />}
              className="dashboard-empty-button"
            >
              Reintentar
            </Button>
            <Button
              onClick={resetFilters}
              variant="outline"
              className="dashboard-empty-button"
            >
              Restablecer Filtros
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="dashboard-container">
      {/* ✅ Modal de exportación */}
      {showExportModal && (
        <ExportOptions
          data={{ stats, trends, dateRange, timeFrame }}
          reportType="dashboard"
          fileName={`dashboard-${new Date().toISOString().split('T')[0]}`}
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          customOptions={{
            exportConfig: { dateRange, timeFrame, dashboardConfig },
            additionalFormats: [
              {
                id: 'dashboard',
                label: 'Dashboard',
                icon: FiBarChart2,
                description: 'Vista interactiva completa',
                color: 'export-option-dashboard'
              }
            ]
          }}
        />
      )}

      {/* ✅ Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <h1 className="dashboard-title">Dashboard de Reportes</h1>
          <p className="dashboard-subtitle">
            Resumen y análisis de inventario • Última actualización: {lastRefresh ? new Date(lastRefresh).toLocaleTimeString() : 'Cargando...'}
          </p>
        </div>
        
        <div className="dashboard-header-actions">
          <div className="dashboard-refresh-controls">
            <label className="dashboard-auto-refresh-label">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="dashboard-auto-refresh-checkbox"
              />
              <span className="dashboard-auto-refresh-text">Auto-actualizar</span>
            </label>
            {autoRefresh && (
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                className="dashboard-refresh-interval"
              >
                <option value="10000">10 seg</option>
                <option value="30000">30 seg</option>
                <option value="60000">1 min</option>
                <option value="300000">5 min</option>
              </select>
            )}
          </div>
          
          <div className="dashboard-action-buttons">
            <Button
              variant="outline"
              startIcon={<FiMail />}
              onClick={sendEmailReport}
              size="small"
              className="dashboard-email-button"
            >
              Email
            </Button>
            
            <Button
              variant="primary"
              startIcon={<FiDownload />}
              onClick={() => setShowExportModal(true)}
              size="small"
              className="dashboard-export-button"
            >
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* ✅ Acciones rápidas */}
      <QuickActions onAction={handleQuickAction} />

      {/* ✅ Filtros */}
      <Card title="Filtros y Configuración" className="dashboard-filters-card">
        <div className="dashboard-filters-content">
          <div className="dashboard-filters-grid">
            <div className="dashboard-filter-group">
              <label className="dashboard-filter-label">Fecha desde</label>
              <input
                type="date"
                className="dashboard-filter-input"
                value={dateRange.start_date}
                onChange={(e) => handleDateChange('start_date', e.target.value)}
                max={dateRange.end_date}
              />
            </div>
            
            <div className="dashboard-filter-group">
              <label className="dashboard-filter-label">Fecha hasta</label>
              <input
                type="date"
                className="dashboard-filter-input"
                value={dateRange.end_date}
                onChange={(e) => handleDateChange('end_date', e.target.value)}
                min={dateRange.start_date}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="dashboard-filter-group">
              <label className="dashboard-filter-label">Período</label>
              <select
                className="dashboard-filter-select"
                value={timeFrame}
                onChange={(e) => handleTimeFrameChange(e.target.value)}
              >
                <option value="day">Hoy</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
                <option value="quarter">Último trimestre</option>
                <option value="year">Último año</option>
              </select>
            </div>
            
            <div className="dashboard-filter-group">
              <label className="dashboard-filter-label">Vista</label>
              <select
                className="dashboard-filter-select"
                value={selectedView}
                onChange={(e) => setSelectedView(e.target.value)}
              >
                <option value="overview">Vista general</option>
                <option value="detailed">Detallada</option>
                <option value="analytics">Análisis</option>
                <option value="forecast">Pronóstico</option>
              </select>
            </div>
          </div>
          
          <div className="dashboard-filters-footer">
            <div className="dashboard-filters-info">
              {stats?.last_updated && (
                <span className="dashboard-last-updated">
                  <FiCalendar className="dashboard-last-updated-icon" />
                  Última actualización: {formatDate(stats.last_updated, 'full')}
                </span>
              )}
            </div>
            
            <div className="dashboard-filters-actions">
              <Button
                variant="outline"
                onClick={resetFilters}
                startIcon={<FiFilter />}
                className="dashboard-clear-button"
              >
                Limpiar
              </Button>
              
              <Button
                variant="outline"
                startIcon={<FiRefreshCw />}
                onClick={loadDashboardData}
                loading={loading}
                className="dashboard-refresh-button"
              >
                Actualizar
              </Button>
              
              <Button
                variant="primary"
                onClick={applyFilters}
                loading={loading}
                className="dashboard-apply-button"
              >
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* ✅ Estadísticas principales */}
      <div className="dashboard-stats-grid">
        <Card className="dashboard-stat-card dashboard-stat-revenue">
          <div className="dashboard-stat-content">
            <div className="dashboard-stat-icon revenue">
              <FiDollarSign className="dashboard-stat-icon-svg" />
            </div>
            <div className="dashboard-stat-info">
              <p className="dashboard-stat-label">Valor Total del Inventario</p>
              <p className="dashboard-stat-value">
                {formatCurrency(stats.inventory_value || 0)}
              </p>
              <div className="dashboard-stat-trend">
                <FiTrendingUp className="dashboard-stat-trend-icon positive" />
                <span className="dashboard-stat-trend-value">
                  {stats.inventory_growth > 0 ? `+${stats.inventory_growth}%` : `${stats.inventory_growth}%`}
                </span>
                <span className="dashboard-stat-trend-label">vs período anterior</span>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="dashboard-stat-card dashboard-stat-products">
          <div className="dashboard-stat-content">
            <div className="dashboard-stat-icon products">
              <FiPackage className="dashboard-stat-icon-svg" />
            </div>
            <div className="dashboard-stat-info">
              <p className="dashboard-stat-label">Total Productos</p>
              <p className="dashboard-stat-value">
                {stats.products?.total || 0}
              </p>
              <div className="dashboard-stat-details">
                <span className="dashboard-stat-detail positive">{stats.products?.in_stock || 0} en stock</span>
                <span className="dashboard-stat-divider">•</span>
                <span className="dashboard-stat-detail neutral">{stats.products?.categories || 0} categorías</span>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="dashboard-stat-card dashboard-stat-turnover">
          <div className="dashboard-stat-content">
            <div className="dashboard-stat-icon turnover">
              <FiTrendingUp className="dashboard-stat-icon-svg" />
            </div>
            <div className="dashboard-stat-info">
              <p className="dashboard-stat-label">Rotación de Inventario</p>
              <p className="dashboard-stat-value">
                {stats.turnover_rate?.toFixed(1) || '0.0'}
              </p>
              <div className="dashboard-stat-trend">
                <FiPercent className="dashboard-stat-trend-icon neutral" />
                <span className="dashboard-stat-trend-label">Por mes</span>
                <span className={`dashboard-stat-trend-value ${(stats.turnover_trend || 0) > 0 ? 'positive' : 'negative'}`}>
                  {stats.turnover_trend > 0 ? '+' : ''}{stats.turnover_trend?.toFixed(1) || 0}%
                </span>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="dashboard-stat-card dashboard-stat-alerts">
          <div className="dashboard-stat-content">
            <div className="dashboard-stat-icon alerts">
              <FiAlertTriangle className="dashboard-stat-icon-svg" />
            </div>
            <div className="dashboard-stat-info">
              <p className="dashboard-stat-label">Alertas Activas</p>
              <p className="dashboard-stat-value alerts">
                {(stats.products?.low_stock || 0) + (stats.products?.out_of_stock || 0)}
              </p>
              <div className="dashboard-stat-details">
                <span className="dashboard-stat-detail warning">{stats.products?.low_stock || 0} stock bajo</span>
                <span className="dashboard-stat-divider">•</span>
                <span className="dashboard-stat-detail danger">{stats.products?.out_of_stock || 0} sin stock</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ✅ Gráficos */}
      {dashboardConfig.showCharts && (
        <div className="dashboard-charts-grid">
          <Card 
            title="Distribución de Stock"
            className="dashboard-chart-card"
            actions={
              <Button
                size="small"
                variant="outline"
                onClick={() => window.location.href = '/reports/inventory'}
                startIcon={<FiEye />}
                className="dashboard-chart-action"
              >
                Ver detalle
              </Button>
            }
          >
            <div className="dashboard-chart-container">
              {stockChartData ? (
                <Doughnut 
                  data={stockChartData} 
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + (b || 0), 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                            return `${context.label}: ${value} (${percentage}%)`;
                          }
                        }
                      }
                    }
                  }}
                />
              ) : (
                <div className="dashboard-chart-empty">
                  <FiPieChart className="dashboard-chart-empty-icon" />
                  <p className="dashboard-chart-empty-text">No hay datos para mostrar</p>
                </div>
              )}
            </div>
          </Card>
          
          <Card 
            title="Tendencias de Movimientos"
            className="dashboard-chart-card"
            actions={
              <div className="dashboard-timeframe-buttons">
                <Button
                  size="small"
                  variant="outline"
                  onClick={() => handleTimeFrameChange('week')}
                  active={timeFrame === 'week'}
                  className="dashboard-timeframe-button"
                >
                  7D
                </Button>
                <Button
                  size="small"
                  variant="outline"
                  onClick={() => handleTimeFrameChange('month')}
                  active={timeFrame === 'month'}
                  className="dashboard-timeframe-button"
                >
                  30D
                </Button>
                <Button
                  size="small"
                  variant="outline"
                  onClick={() => handleTimeFrameChange('quarter')}
                  active={timeFrame === 'quarter'}
                  className="dashboard-timeframe-button"
                >
                  90D
                </Button>
              </div>
            }
          >
            <div className="dashboard-chart-container">
              {movementChartData ? (
                <Line 
                  data={movementChartData} 
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      tooltip: {
                        mode: 'index',
                        intersect: false,
                      }
                    }
                  }}
                />
              ) : (
                <div className="dashboard-chart-empty">
                  <FiActivity className="dashboard-chart-empty-icon" />
                  <p className="dashboard-chart-empty-text">No hay datos para mostrar</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ✅ Más gráficos */}
      {valueByCategoryData && (
        <div className="dashboard-additional-grid">
          <Card 
            title="Valor por Categoría"
            className="dashboard-value-chart-card"
          >
            <div className="dashboard-chart-container">
              <Bar 
                data={valueByCategoryData} 
                options={{
                  ...chartOptions,
                  indexAxis: 'y',
                  plugins: {
                    ...chartOptions.plugins,
                    legend: {
                      display: false
                    }
                  }
                }}
              />
            </div>
          </Card>
          
          <Card title="Métricas Clave" className="dashboard-metrics-card">
            <div className="dashboard-metrics-content">
              <div className="dashboard-metric">
                <div className="dashboard-metric-label">Costo de Mantenimiento</div>
                <div className="dashboard-metric-value">
                  {formatCurrency(stats.holding_cost || 0)}
                </div>
                <div className="dashboard-metric-subtitle">Por mes</div>
              </div>
              
              <div className="dashboard-metric">
                <div className="dashboard-metric-label">Índice de Rotación</div>
                <div className="dashboard-metric-value">
                  {(stats.turnover_index || 0).toFixed(2)}
                </div>
                <div className="dashboard-metric-subtitle">Anual</div>
              </div>
              
              <div className="dashboard-metric">
                <div className="dashboard-metric-label">Días de Inventario</div>
                <div className="dashboard-metric-value">
                  {stats.days_inventory || 0}
                </div>
                <div className="dashboard-metric-subtitle">Promedio</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ✅ Alertas de stock */}
      {dashboardConfig.showAlerts && stats.low_stock_alerts && stats.low_stock_alerts.length > 0 && (
        <Card 
          title={
            <div className="dashboard-alerts-header">
              <div className="dashboard-alerts-indicator"></div>
              <span className="dashboard-alerts-title">
                Alertas de Stock Bajo ({stats.low_stock_alerts.length})
              </span>
            </div>
          }
          className="dashboard-alerts-card"
        >
          <div className="dashboard-alerts-actions">
            <Button
              variant="outline"
              size="small"
              onClick={() => window.location.href = '/purchases/new'}
              startIcon={<FiShoppingCart />}
              className="dashboard-alerts-action"
            >
              Crear Orden
            </Button>
          </div>
          <div className="dashboard-alerts-table-container">
            <table className="dashboard-alerts-table">
              <thead>
                <tr>
                  <th className="dashboard-alerts-th">Producto</th>
                  <th className="dashboard-alerts-th">Stock Actual</th>
                  <th className="dashboard-alerts-th">Stock Mínimo</th>
                  <th className="dashboard-alerts-th">Faltante</th>
                  <th className="dashboard-alerts-th">Valor Total</th>
                  <th className="dashboard-alerts-th">Última Compra</th>
                  <th className="dashboard-alerts-th">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {stats.low_stock_alerts.map((product) => (
                  <tr key={product.id} className="dashboard-alerts-tr">
                    <td className="dashboard-alerts-td">
                      <div className="dashboard-alerts-product">
                        <div className="dashboard-alerts-product-name">{product.name}</div>
                        <div className="dashboard-alerts-product-sku">{product.sku}</div>
                        <div className="dashboard-alerts-product-category">{product.category_name}</div>
                      </div>
                    </td>
                    <td className="dashboard-alerts-td">
                      <div className="dashboard-alerts-stock danger">
                        {product.current_stock} {product.unit}
                      </div>
                    </td>
                    <td className="dashboard-alerts-td">
                      <div className="dashboard-alerts-min-stock">
                        {product.min_stock} {product.unit}
                      </div>
                    </td>
                    <td className="dashboard-alerts-td">
                      <div className="dashboard-alerts-missing danger">
                        {Math.max(0, product.min_stock - product.current_stock)} {product.unit}
                      </div>
                    </td>
                    <td className="dashboard-alerts-td">
                      <div className="dashboard-alerts-value">
                        {formatCurrency((product.price || 0) * product.current_stock)}
                      </div>
                    </td>
                    <td className="dashboard-alerts-td">
                      <div className="dashboard-alerts-last-purchase">
                        {product.last_purchase_date 
                          ? formatDate(product.last_purchase_date, 'short')
                          : 'Nunca'
                        }
                      </div>
                    </td>
                    <td className="dashboard-alerts-td">
                      <div className="dashboard-alerts-buttons">
                        <Button
                          size="small"
                          variant="outline"
                          onClick={() => window.location.href = `/inventory?product=${product.id}`}
                          startIcon={<FiEye />}
                          className="dashboard-alerts-button"
                        >
                          Ver
                        </Button>
                        <Button
                          size="small"
                          variant="primary"
                          onClick={() => window.location.href = `/purchases/new?product=${product.id}`}
                          startIcon={<FiShoppingCart />}
                          className="dashboard-alerts-button"
                        >
                          Ordenar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ✅ Movimientos recientes */}
      {dashboardConfig.showRecent && (
        <Card 
          title="Movimientos Recientes"
          className="dashboard-recent-card"
          actions={
            <Button
              variant="outline"
              size="small"
              onClick={() => globalThis.location.href = '/reports/movements'}
              startIcon={<FiList />}
              className="dashboard-recent-action"
            >
              Ver todos
            </Button>
          }
        >
          {stats.recent_movements && stats.recent_movements.length > 0 ? (
            <div className="dashboard-recent-table-container">
              <table className="dashboard-recent-table">
                <thead>
                  <tr>
                    <th className="dashboard-recent-th">Fecha</th>
                    <th className="dashboard-recent-th">Producto</th>
                    <th className="dashboard-recent-th">Tipo</th>
                    <th className="dashboard-recent-th">Cantidad</th>
                    <th className="dashboard-recent-th">Valor</th>
                    <th className="dashboard-recent-th">Responsable</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_movements.slice(0, 8).map((movement) => (
                    <tr key={movement.id} className="dashboard-recent-tr">
                      <td className="dashboard-recent-td">
                        <div className="dashboard-recent-date">
                          {formatDate(movement.created_at, 'short')}
                        </div>
                        <div className="dashboard-recent-time">
                          {formatDate(movement.created_at, 'time')}
                        </div>
                      </td>
                      <td className="dashboard-recent-td">
                        <div className="dashboard-recent-product">
                          <div className="dashboard-recent-product-name">{movement.product_name}</div>
                          <div className="dashboard-recent-product-sku">{movement.sku}</div>
                        </div>
                      </td>
                      <td className="dashboard-recent-td">
                        <span className={`dashboard-recent-type ${movement.movement_type === 'in' ? 'in' : 'out'}`}>
                          {movement.movement_type === 'in' ? (
                            <>
                              <FiArrowUp className="dashboard-recent-type-icon" />
                              Entrada
                            </>
                          ) : (
                            <>
                              <FiArrowDown className="dashboard-recent-type-icon" />
                              Salida
                            </>
                          )}
                        </span>
                      </td>
                      <td className="dashboard-recent-td">
                        <div className="dashboard-recent-quantity">
                          {movement.quantity} {movement.unit || 'unidades'}
                        </div>
                      </td>
                      <td className="dashboard-recent-td">
                        <div className="dashboard-recent-amount">
                          {formatCurrency(movement.value || 0)}
                        </div>
                      </td>
                      <td className="dashboard-recent-td">
                        <div className="dashboard-recent-user">
                          <div className="dashboard-recent-user-icon">
                            <FiUsers className="dashboard-recent-user-icon-svg" />
                          </div>
                          <span className="dashboard-recent-user-name">{movement.created_by_name}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="dashboard-recent-empty">
              <div className="dashboard-recent-empty-icon">📊</div>
              <p className="dashboard-recent-empty-text">No hay movimientos recientes</p>
            </div>
          )}
        </Card>
      )}

      {/* ✅ Insights */}
      <Card title="Insights y Recomendaciones" className="dashboard-insights-card">
        <div className="dashboard-insights-grid">
          <div className="dashboard-insight optimization">
            <div className="dashboard-insight-icon">
              <FiTrendingUp className="dashboard-insight-icon-svg" />
            </div>
            <div className="dashboard-insight-content">
              <h4 className="dashboard-insight-title">Optimización de Stock</h4>
              <p className="dashboard-insight-description">
                {stats.products?.over_stock || 0} productos tienen exceso de inventario. Considera realizar promociones.
              </p>
            </div>
          </div>
          
          <div className="dashboard-insight value">
            <div className="dashboard-insight-icon">
              <FiDollarSign className="dashboard-insight-icon-svg" />
            </div>
            <div className="dashboard-insight-content">
              <h4 className="dashboard-insight-title">Valor de Inventario</h4>
              <p className="dashboard-insight-description">
                Tu inventario representa {formatCurrency(stats.inventory_value)}. 
                Considera seguros para proteger este valor.
              </p>
            </div>
          </div>
          
          <div className="dashboard-insight alerts">
            <div className="dashboard-insight-icon">
              <FiAlertTriangle className="dashboard-insight-icon-svg" />
            </div>
            <div className="dashboard-insight-content">
              <h4 className="dashboard-insight-title">Alertas Prioritarias</h4>
              <p className="dashboard-insight-description">
                {stats.products?.out_of_stock || 0} productos están agotados. 
                Realiza pedidos urgentes para evitar pérdidas.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ✅ Componente QuickActions
const QuickActions = React.memo(({ onAction }) => {
  const actions = [
    {
      id: 'export',
      label: 'Exportar Reporte',
      icon: FiDownload,
      color: 'quick-action-export',
      description: 'Exporta el dashboard actual'
    },
    {
      id: 'alert',
      label: 'Enviar Alertas',
      icon: FiBell,
      color: 'quick-action-alert',
      description: 'Envía alertas de stock bajo'
    },
    {
      id: 'reorder',
      label: 'Generar Órdenes',
      icon: FiShoppingCart,
      color: 'quick-action-reorder',
      description: 'Crea órdenes de compra'
    },
    {
      id: 'refresh',
      label: 'Actualizar Datos',
      icon: FiRefreshCw,
      color: 'quick-action-refresh',
      description: 'Actualiza todos los datos'
    }
  ];

  const handleAction = useCallback((actionId) => {
    if (onAction && typeof onAction === 'function') {
      onAction(actionId);
    }
  }, [onAction]);

  return (
    <div className="quick-actions-grid">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            onClick={() => handleAction(action.id)}
            className="quick-action-button"
            type="button"
            aria-label={action.description}
          >
            <div className="quick-action-content">
              <div className={`quick-action-icon ${action.color}`}>
                <Icon className="quick-action-icon-svg" />
              </div>
              <div className="quick-action-text">
                <div className="quick-action-label">{action.label}</div>
                <div className="quick-action-description">{action.description}</div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
});

QuickActions.propTypes = {
  onAction: PropTypes.func
};

QuickActions.defaultProps = {
  onAction: () => {}
};

QuickActions.displayName = 'QuickActions';

// ✅ Prop Types
ReportDashboard.propTypes = {
  // No hay props requeridas para este componente
};

export default React.memo(ReportDashboard);