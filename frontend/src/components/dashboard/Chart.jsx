// Chart.jsx - CORREGIDO Y COMPLETO
import React, { useMemo, memo, useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import "../../assets/styles/Chart.css"
// ✅ CHART COMPLETAMENTE CORREGIDO Y OPTIMIZADO
const CHART_COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  teal: '#14b8a6',
  orange: '#f97316',
  pink: '#ec4899',
  gray: '#6b7280',
  borderLight: '#e5e7eb',
  borderMedium: '#d1d5db',
  borderDark: '#9ca3af'
};

const DEFAULT_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.danger,
  CHART_COLORS.purple,
  CHART_COLORS.teal,
  CHART_COLORS.orange,
  CHART_COLORS.pink,
];

// ✅ Componente CustomTooltip separado
const CustomTooltip = memo(({
  active,
  payload,
  label,
  tooltipFormatter,
  tooltipLabelFormatter,
  formatValue,
  unit
}) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="chart-tooltip" style={{
      backgroundColor: 'white',
      padding: '12px',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      maxWidth: '300px'
    }}>
      <p className="chart-tooltip-label" style={{ 
        fontWeight: '600', 
        color: '#111827',
        marginBottom: '8px',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        {tooltipLabelFormatter ? tooltipLabelFormatter(label) : label}
      </p>
      <div className="chart-tooltip-items" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {payload.map((entry, index) => {
          let displayValue;
          const entryValue = entry?.value;
          const entryName = entry?.name;

          if (tooltipFormatter) {
            displayValue = tooltipFormatter(entryValue, entryName, entry?.payload);
          } else if (formatValue) {
            displayValue = formatValue(entryValue);
          } else if (typeof entryValue === 'number') {
            displayValue = entryValue.toLocaleString('es-ES');
          } else {
            displayValue = entryValue || 'N/A';
          }

          return (
            <div key={`tooltip-${index}`} className="chart-tooltip-item" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div className="chart-tooltip-item-label" style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  className="chart-tooltip-item-color"
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '2px',
                    backgroundColor: entry?.color || CHART_COLORS.primary,
                    marginRight: '8px',
                    flexShrink: 0
                  }}
                />
                <span className="chart-tooltip-item-name" style={{ 
                  fontSize: '14px', 
                  color: '#374151',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {entryName || 'Serie'}:
                </span>
              </div>
              <span className="chart-tooltip-item-value" style={{ 
                fontSize: '14px', 
                fontWeight: '600',
                color: '#111827',
                marginLeft: '8px'
              }}>
                {displayValue} {unit}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

CustomTooltip.displayName = 'CustomTooltip';

// ✅ TIPOS DE GRÁFICO SOPORTADOS
const CHART_TYPES = {
  LINE: 'line',
  BAR: 'bar',
  AREA: 'area',
  PIE: 'pie',
  RADAR: 'radar',
  SCATTER: 'scatter',
  COMPOSED: 'composed',
};

// ✅ COMPONENTE PRINCIPAL
const Chart = memo(({
  type = CHART_TYPES.LINE,
  data = [],
  title = 'Gráfico',
  description,
  height = 300,
  dataKey,
  categoryKey = 'name',
  unit = '',
  formatValue,
  colors,
  colorScheme = 'default',
  strokeWidth = 2,
  fillOpacity = 0.2,
  radius = [4, 4, 0, 0],
  showLegend = true,
  showGrid = true,
  showTooltip = true,
  showAnimation = true,
  stacked = false,
  syncId,
  xAxisLabel,
  yAxisLabel,
  xAxisFormatter,
  yAxisFormatter,
  xAxisAngle = 0,
  yAxisAngle = 0,
  tooltipFormatter,
  tooltipLabelFormatter,
  loading = false,
  error = false,
  emptyMessage = 'No hay datos disponibles',
  onPointClick,
  onLegendClick,
  showExport = false,
  showRefresh = false,
  showFullscreen = false,
  showFilters = false,
  onExport,
  onRefresh,
  onFullscreen,
  onFilter,
  inventoryMetrics = null,
  showStockLevels = false,
  referenceLines = [],
  ariaLabel,
  dataTestId,
  className,
}) => {
  // ✅ ESTADOS
  const [processedData, setProcessedData] = useState([]);
  const [isClient, setIsClient] = useState(false);

  // ✅ DETECTAR CLIENTE
  useEffect(() => {
    setIsClient(true);
  }, []);

  // ✅ PROCESAR DATOS
  useEffect(() => {
    if (!data || !Array.isArray(data)) {
      setProcessedData([]);
      return;
    }

    try {
      const safeData = data
        .filter(item => item && typeof item === 'object')
        .map(item => {
          const normalized = { ...item };
          Object.keys(normalized).forEach(key => {
            if (normalized[key] === null || normalized[key] === undefined) {
              normalized[key] = 0;
            }
          });
          return normalized;
        });
      
      setProcessedData(safeData);
    } catch (error) {
      console.error('Error procesando datos:', error);
      setProcessedData([]);
    }
  }, [data]);

  // ✅ DETERMINAR COLUMNAS DE DATOS
  const dataKeys = useMemo(() => {
    if (!processedData.length) return [];
    
    if (dataKey) {
      if (Array.isArray(dataKey)) {
        return dataKey.filter(key => typeof key === 'string');
      }
      return [dataKey];
    }
    
    const sampleItem = processedData[0];
    if (!sampleItem || typeof sampleItem !== 'object') return [];
    
    return Object.keys(sampleItem).filter(key => 
      key !== categoryKey && 
      (typeof sampleItem[key] === 'number' || typeof sampleItem[key] === 'string')
    );
  }, [processedData, dataKey, categoryKey]);

  // ✅ CONFIGURAR COLORES
  const chartColors = useMemo(() => {
    if (colors && Array.isArray(colors) && colors.length > 0) {
      return colors;
    }
    return DEFAULT_COLORS;
  }, [colors]);

  // ✅ RENDERIZAR GRÁFICO POR TIPO
  const renderChart = useCallback(() => {
    if (!processedData.length || !dataKeys.length) return null;

    const commonProps = {
      data: processedData,
      syncId,
    };

    const axisProps = {
      xAxis: {
        dataKey: categoryKey,
        stroke: CHART_COLORS.borderDark,
        fontSize: 12,
        tickLine: false,
        axisLine: { stroke: CHART_COLORS.borderMedium },
        label: xAxisLabel ? { 
          value: xAxisLabel, 
          position: 'insideBottom', 
          offset: -5,
          style: { fill: CHART_COLORS.gray, fontSize: 12 }
        } : null,
        angle: xAxisAngle,
        tickFormatter: xAxisFormatter,
      },
      yAxis: {
        stroke: CHART_COLORS.borderDark,
        fontSize: 12,
        tickLine: false,
        axisLine: { stroke: CHART_COLORS.borderMedium },
        label: yAxisLabel ? { 
          value: yAxisLabel, 
          angle: -90, 
          position: 'insideLeft',
          style: { fill: CHART_COLORS.gray, fontSize: 12 }
        } : null,
        angle: yAxisAngle,
        tickFormatter: yAxisFormatter || ((value) => {
          if (typeof value === 'number') {
            const formatted = value.toLocaleString('es-ES');
            return unit ? `${formatted}${unit}` : formatted;
          }
          return value;
        }),
      },
    };

    const renderDataSeries = (Component, extraProps = {}) => 
      dataKeys.map((key, index) => (
        <Component
          key={key}
          dataKey={key}
          fill={chartColors[index % chartColors.length]}
          stroke={chartColors[index % chartColors.length]}
          strokeWidth={strokeWidth}
          fillOpacity={fillOpacity}
          isAnimationActive={showAnimation}
          stackId={stacked ? "stack" : undefined}
          onClick={onPointClick ? (data, idx) => onPointClick?.({ data, index: idx, key }) : undefined}
          name={key}
          {...extraProps}
        />
      ));

    switch (type) {
      case CHART_TYPES.BAR:
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.borderLight} />}
            <XAxis {...axisProps.xAxis} />
            <YAxis {...axisProps.yAxis} />
            {showTooltip && (
              <Tooltip 
                content={<CustomTooltip 
                  tooltipFormatter={tooltipFormatter}
                  tooltipLabelFormatter={tooltipLabelFormatter}
                  formatValue={formatValue}
                  unit={unit}
                />} 
              />
            )}
            {showLegend && <Legend />}
            {renderDataSeries(Bar, { radius })}
          </BarChart>
        );

      case CHART_TYPES.AREA:
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.borderLight} />}
            <XAxis {...axisProps.xAxis} />
            <YAxis {...axisProps.yAxis} />
            {showTooltip && (
              <Tooltip 
                content={<CustomTooltip 
                  tooltipFormatter={tooltipFormatter}
                  tooltipLabelFormatter={tooltipLabelFormatter}
                  formatValue={formatValue}
                  unit={unit}
                />} 
              />
            )}
            {showLegend && <Legend />}
            {renderDataSeries(Area, { connectNulls: true })}
          </AreaChart>
        );

      case CHART_TYPES.PIE:
        const pieData = useMemo(() => {
          return processedData.map((item, index) => ({
            name: item[categoryKey] || `Item ${index + 1}`,
            value: parseFloat(item[dataKeys[0]]) || 0,
          }));
        }, [processedData, categoryKey, dataKeys]);

        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: ${entry.value}`}
              outerRadius={80}
              fill={chartColors[0]}
              dataKey="value"
            >
              {pieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            {showTooltip && (
              <Tooltip 
                content={<CustomTooltip 
                  tooltipFormatter={tooltipFormatter}
                  tooltipLabelFormatter={tooltipLabelFormatter}
                  formatValue={formatValue}
                  unit={unit}
                />} 
              />
            )}
            {showLegend && <Legend />}
          </PieChart>
        );

      case CHART_TYPES.RADAR:
        return (
          <RadarChart data={processedData}>
            <PolarGrid />
            <PolarAngleAxis dataKey={categoryKey} />
            <PolarRadiusAxis />
            {dataKeys.map((key, index) => (
              <Radar
                key={key}
                name={key}
                dataKey={key}
                stroke={chartColors[index % chartColors.length]}
                fill={chartColors[index % chartColors.length]}
                fillOpacity={fillOpacity}
              />
            ))}
            {showTooltip && (
              <Tooltip 
                content={<CustomTooltip 
                  tooltipFormatter={tooltipFormatter}
                  tooltipLabelFormatter={tooltipLabelFormatter}
                  formatValue={formatValue}
                  unit={unit}
                />} 
              />
            )}
            {showLegend && <Legend />}
          </RadarChart>
        );

      case CHART_TYPES.LINE:
      default:
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.borderLight} />}
            <XAxis {...axisProps.xAxis} />
            <YAxis {...axisProps.yAxis} />
            {showTooltip && (
              <Tooltip 
                content={<CustomTooltip 
                  tooltipFormatter={tooltipFormatter}
                  tooltipLabelFormatter={tooltipLabelFormatter}
                  formatValue={formatValue}
                  unit={unit}
                />} 
              />
            )}
            {showLegend && <Legend />}
            {renderDataSeries(Line, { 
              type: "monotone",
              dot: { r: 4, strokeWidth: 2 },
              activeDot: { r: 6, strokeWidth: 3 },
              connectNulls: true 
            })}
          </LineChart>
        );
    }
  }, [
    type, processedData, dataKeys, chartColors, categoryKey, unit, strokeWidth, 
    fillOpacity, showAnimation, stacked, syncId, showGrid, showTooltip, showLegend, 
    xAxisLabel, yAxisLabel, xAxisAngle, yAxisAngle, xAxisFormatter, yAxisFormatter, 
    tooltipFormatter, tooltipLabelFormatter, formatValue, radius, onPointClick
  ]);

  // ✅ ESTADO DE CARGA
  if (loading) {
    return (
      <div 
        className={`chart-container chart-loading ${className || ''}`}
        data-testid={dataTestId ? `${dataTestId}-loading` : 'chart-loading'}
      >
        <div className="chart-skeleton">
          <div className="chart-skeleton-header">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div className="chart-skeleton-icon"></div>
              <div className="chart-skeleton-text">
                <div className="chart-skeleton-title"></div>
                <div className="chart-skeleton-description"></div>
              </div>
            </div>
            <div className="chart-skeleton-action"></div>
          </div>
          <div className="chart-skeleton-chart" style={{ height: `${height}px` }}></div>
        </div>
      </div>
    );
  }

  // ✅ ESTADO DE ERROR
  if (error) {
    return (
      <div 
        className={`chart-container chart-error-container ${className || ''}`}
        data-testid={dataTestId ? `${dataTestId}-error` : 'chart-error'}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="chart-error-header" style={{ padding: '8px', borderRadius: '8px', marginRight: '12px' }}>
              <span>⚠️</span>
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>{title}</h3>
              {description && (
                <p style={{ fontSize: '14px', color: '#6b7280' }}>{description}</p>
              )}
            </div>
          </div>
        </div>
        <div className="chart-error-state" style={{ height: `${height}px` }}>
          <div className="chart-error-icon">⚠️</div>
          <p className="chart-error-message">Error al cargar los datos</p>
        </div>
      </div>
    );
  }

  // ✅ SIN DATOS
  if (!processedData.length) {
    return (
      <div 
        className={`chart-container ${className || ''}`}
        data-testid={dataTestId ? `${dataTestId}-empty` : 'chart-empty'}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#eff6ff', marginRight: '12px' }}>
              <span style={{ color: CHART_COLORS.primary }}>📊</span>
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>{title}</h3>
              {description && (
                <p style={{ fontSize: '14px', color: '#6b7280' }}>{description}</p>
              )}
            </div>
          </div>
        </div>
        <div className="chart-empty-state" style={{ height: `${height}px` }}>
          <div className="chart-empty-icon">📊</div>
          <p className="chart-empty-message">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  // ✅ COMPONENTE PRINCIPAL
  return (
    <div 
      className={`chart-container ${className || ''}`}
      data-testid={dataTestId}
      aria-label={ariaLabel || `Gráfico: ${title}`}
    >
      {/* Header */}
      <div className="chart-header">
        <div className="chart-title-container">
          <div className="chart-icon-container">
            <span className="chart-icon">📊</span>
          </div>
          <h3 className="chart-title">
            {title}
          </h3>
        </div>
        {description && (
          <p className="chart-description">
            {description}
          </p>
        )}
      </div>

      {/* Gráfico */}
      <div className="chart-wrapper" style={{ height: `${height}px` }}>
        {isClient ? (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        ) : (
          <div className="chart-loading-state">
            Cargando gráfico...
          </div>
        )}
      </div>
    </div>
  );
});

Chart.propTypes = {
  type: PropTypes.oneOf(Object.values(CHART_TYPES)),
  data: PropTypes.arrayOf(PropTypes.object),
  title: PropTypes.string,
  description: PropTypes.string,
  height: PropTypes.number,
  dataKey: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
  categoryKey: PropTypes.string,
  unit: PropTypes.string,
  formatValue: PropTypes.func,
  colors: PropTypes.arrayOf(PropTypes.string),
  colorScheme: PropTypes.string,
  strokeWidth: PropTypes.number,
  fillOpacity: PropTypes.number,
  radius: PropTypes.arrayOf(PropTypes.number),
  showLegend: PropTypes.bool,
  showGrid: PropTypes.bool,
  showTooltip: PropTypes.bool,
  showAnimation: PropTypes.bool,
  stacked: PropTypes.bool,
  syncId: PropTypes.string,
  xAxisLabel: PropTypes.string,
  yAxisLabel: PropTypes.string,
  xAxisFormatter: PropTypes.func,
  yAxisFormatter: PropTypes.func,
  xAxisAngle: PropTypes.number,
  yAxisAngle: PropTypes.number,
  tooltipFormatter: PropTypes.func,
  tooltipLabelFormatter: PropTypes.func,
  loading: PropTypes.bool,
  error: PropTypes.bool,
  emptyMessage: PropTypes.string,
  onPointClick: PropTypes.func,
  onLegendClick: PropTypes.func,
  showExport: PropTypes.bool,
  showRefresh: PropTypes.bool,
  showFullscreen: PropTypes.bool,
  showFilters: PropTypes.bool,
  onExport: PropTypes.func,
  onRefresh: PropTypes.func,
  onFullscreen: PropTypes.func,
  onFilter: PropTypes.func,
  inventoryMetrics: PropTypes.arrayOf(PropTypes.string),
  showStockLevels: PropTypes.bool,
  referenceLines: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.number.isRequired,
    label: PropTypes.string,
    color: PropTypes.string
  })),
  ariaLabel: PropTypes.string,
  dataTestId: PropTypes.string,
  className: PropTypes.string,
};

Chart.defaultProps = {
  type: CHART_TYPES.LINE,
  data: [],
  title: 'Gráfico',
  height: 300,
  categoryKey: 'name',
  colorScheme: 'default',
  strokeWidth: 2,
  fillOpacity: 0.2,
  radius: [4, 4, 0, 0],
  showLegend: true,
  showGrid: true,
  showTooltip: true,
  showAnimation: true,
  stacked: false,
  loading: false,
  error: false,
  emptyMessage: 'No hay datos disponibles',
  showExport: false,
  showRefresh: false,
  showFullscreen: false,
  showFilters: false,
  inventoryMetrics: null,
  showStockLevels: false,
  referenceLines: [],
};

Chart.displayName = 'Chart';

export default Chart;