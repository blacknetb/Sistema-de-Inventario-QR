// StatCard.jsx - CORREGIDO Y COMPLETO
import React, { useMemo, memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/StatCard.css';

/**
 * ✅ STATCARD COMPLETAMENTE CORREGIDO Y OPTIMIZADO
 */

// ✅ CONFIGURACIÓN DE COLORES
const COLOR_CONFIG = {
  primary: {
    bg: '#eff6ff',
    border: '#dbeafe',
    text: '#1e40af'
  },
  success: {
    bg: '#d1fae5',
    border: '#a7f3d0',
    text: '#065f46'
  },
  warning: {
    bg: '#fef3c7',
    border: '#fde68a',
    text: '#92400e'
  },
  danger: {
    bg: '#fee2e2',
    border: '#fecaca',
    text: '#991b1b'
  },
  purple: {
    bg: '#f3e8ff',
    border: '#e9d5ff',
    text: '#6b21a8'
  },
  teal: {
    bg: '#ccfbf1',
    border: '#99f6e4',
    text: '#0d9488'
  },
  orange: {
    bg: '#ffedd5',
    border: '#fed7aa',
    text: '#9a3412'
  },
  pink: {
    bg: '#fce7f3',
    border: '#fbcfe8',
    text: '#9d174d'
  },
  gray: {
    bg: '#f9fafb',
    border: '#e5e7eb',
    text: '#6b7280'
  }
};

// ✅ MAPA DE ICONOS
const ICON_MAP = {
  chart: '📊',
  sales: '💰',
  revenue: '💵',
  profit: '📈',
  users: '👥',
  inventory: '📦',
  orders: '📋',
  percent: '%',
  ratio: '📊',
  time: '⏰',
  calendar: '📅',
  warning: '⚠️',
  error: '❌',
  success: '✅',
  info: 'ℹ️',
  star: '⭐',
  heart: '❤️',
  thumbsup: '👍',
  trophy: '🏆',
  bell: '🔔',
  search: '🔍',
  filter: '⚙️',
  refresh: '🔄',
  download: '⬇️',
  upload: '⬆️',
  edit: '✏️',
  delete: '🗑️',
  add: '➕',
  remove: '➖',
  check: '✓',
  cross: '✗',
  lock: '🔒',
  unlock: '🔓',
  eye: '👁️',
  eyeoff: '👁️‍🗨️',
  send: '📤',
  receive: '📥',
  home: '🏠',
  settings: '⚙️',
  help: '❓',
  question: '❔'
};

// ✅ COMPONENTE PRINCIPAL
const StatCard = memo(({
  title,
  value,
  change,
  icon = 'chart',
  trend = 'up',
  loading = false,
  error = false,
  onClick,
  unit = '',
  description,
  showChange = true,
  showTrendIcon = true,
  compact = false,
  className = '',
  color = 'primary',
  showAction = false,
  actionLabel = 'Ver detalles',
  formatValue,
  badge,
  badgeColor = 'primary',
  inventoryType = null,
  stockStatus = null,
  ariaLabel,
  tabIndex,
  dataTestId,
}) => {
  // ✅ OBTENER CONFIGURACIÓN
  const config = useMemo(() => {
    return COLOR_CONFIG[color] || COLOR_CONFIG.primary;
  }, [color]);

  // ✅ OBTENER ICONO
  const iconEmoji = useMemo(() => {
    return ICON_MAP[icon] || ICON_MAP.chart;
  }, [icon]);

  // ✅ DETERMINAR SI ES POSITIVO
  const isPositive = useMemo(() => {
    return trend === 'up';
  }, [trend]);

  // ✅ DETERMINAR SI TIENE CAMBIO
  const hasChange = useMemo(() => {
    return change !== undefined && change !== null && !error && !loading;
  }, [change, error, loading]);

  // ✅ FORMATEAR VALOR
  const formattedValue = useMemo(() => {
    if (error) return 'Error';
    if (loading) return 'Cargando...';
    
    if (value === null || value === undefined) {
      return 'N/A';
    }
    
    if (formatValue) {
      return formatValue(value);
    }
    
    if (typeof value === 'number') {
      if (icon === 'percent' || icon === 'ratio') {
        return `${value.toFixed(1)}%`;
      }
      
      if (['sales', 'revenue', 'profit'].includes(icon)) {
        return `$${value.toLocaleString('es-ES', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        })}`;
      }
      
      return value.toLocaleString('es-ES');
    }
    
    return value.toString();
  }, [value, formatValue, loading, error, icon]);

  // ✅ RENDERIZAR CAMBIO
  const renderChange = useMemo(() => {
    if (!showChange || !hasChange) return null;
    
    const changeValue = Math.abs(change);
    const changeText = `${isPositive ? '+' : '-'}${changeValue.toFixed(1)}%`;
    
    return (
      <div className={`stat-card-change ${isPositive ? 'stat-card-change-positive' : 'stat-card-change-negative'}`}>
        {showTrendIcon && (
          <span className="stat-card-trend-icon">
            {isPositive ? '📈' : '📉'}
          </span>
        )}
        <span>{changeText}</span>
      </div>
    );
  }, [showChange, hasChange, isPositive, showTrendIcon, change]);

  // ✅ RENDERIZAR BADGE
  const renderBadge = useMemo(() => {
    if (!badge) return null;
    
    const badgeConfig = COLOR_CONFIG[badgeColor] || COLOR_CONFIG.primary;
    
    return (
      <div 
        className="stat-card-badge"
        style={{ 
          backgroundColor: badgeConfig.bg,
          color: badgeConfig.text,
          border: `1px solid ${badgeConfig.border}`
        }}
      >
        {badge}
      </div>
    );
  }, [badge, badgeColor]);

  // ✅ MANEJAR CLICK
  const handleClick = useCallback((e) => {
    if (onClick) {
      e.stopPropagation();
      onClick();
    }
  }, [onClick]);

  // ✅ CLASE DINÁMICA
  const cardClassName = useMemo(() => {
    const classes = ['stat-card'];
    if (compact) classes.push('stat-card-compact');
    if (onClick) classes.push('stat-card-clickable');
    if (error) classes.push('stat-card-error');
    if (className) classes.push(className);
    return classes.join(' ');
  }, [compact, onClick, error, className]);

  // ✅ ESTADO DE CARGA
  if (loading) {
    return (
      <div 
        className={`stat-card stat-card-loading ${compact ? 'stat-card-compact' : ''} ${className || ''}`}
        data-testid={dataTestId ? `${dataTestId}-loading` : 'statcard-loading'}
      >
        <div className="stat-card-skeleton">
          <div className="stat-card-skeleton-header">
            <div className={`stat-card-skeleton-icon ${compact ? 'stat-card-icon-container-compact' : 'stat-card-icon-container'}`}
              style={{ 
                width: compact ? '32px' : '40px', 
                height: compact ? '32px' : '40px' 
              }}
            ></div>
            <div className="stat-card-skeleton-change"></div>
          </div>
          <div className={`stat-card-skeleton-value ${compact ? 'stat-card-skeleton-value-compact' : ''}`}
            style={{ 
              height: compact ? '24px' : '32px' 
            }}
          ></div>
          <div className="stat-card-skeleton-description"></div>
        </div>
      </div>
    );
  }

  // ✅ ESTADO DE ERROR
  if (error) {
    return (
      <div 
        className={`stat-card stat-card-error ${compact ? 'stat-card-compact' : ''} ${className || ''}`}
        data-testid={dataTestId ? `${dataTestId}-error` : 'statcard-error'}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: compact ? '12px' : '16px' }}>
          <div className="stat-card-error-icon-container">
            <span>❌</span>
          </div>
        </div>
        <div>
          <h3 className={`stat-card-value ${compact ? 'stat-card-value-compact' : ''}`} style={{ margin: '0 0 4px 0' }}>
            Error
          </h3>
          <p className={`stat-card-title ${compact ? 'stat-card-title-compact' : ''}`} style={{ margin: '0 0 4px 0' }}>
            No se pudo cargar {title.toLowerCase()}
          </p>
          {description && (
            <p className="stat-card-description" style={{ margin: '4px 0 0 0' }}>
              {description}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick ? handleClick : undefined}
      className={cardClassName}
      style={{ 
        borderColor: config.border,
        ...(onClick && {
          cursor: 'pointer'
        })
      }}
      tabIndex={tabIndex}
      aria-label={ariaLabel || `${title}: ${formattedValue}${unit}`}
      data-testid={dataTestId}
      role={onClick ? 'button' : 'article'}
    >
      {/* Header */}
      <div className={`stat-card-header ${compact ? 'stat-card-header-compact' : ''}`}>
        <div 
          className={`stat-card-icon-container ${compact ? 'stat-card-icon-container-compact' : ''}`}
          style={{ backgroundColor: config.bg }}
        >
          <span style={{ color: config.text }}>
            {iconEmoji}
          </span>
        </div>
        {renderChange}
      </div>

      {/* Valor principal */}
      <div style={{ marginBottom: '4px' }}>
        <h3 className={`stat-card-value ${compact ? 'stat-card-value-compact' : ''}`} style={{ margin: 0 }}>
          {formattedValue}
          {unit && (
            <span className={`stat-card-unit ${compact ? 'stat-card-unit-compact' : ''}`}>
              {unit}
            </span>
          )}
        </h3>
      </div>

      {/* Título y descripción */}
      <div>
        <p className={`stat-card-title ${compact ? 'stat-card-title-compact' : ''}`} style={{ margin: '0 0 4px 0' }}>
          {title}
        </p>
        {description && (
          <p className="stat-card-description" style={{ margin: '4px 0 0 0' }}>
            {description}
          </p>
        )}
        {renderBadge}
      </div>

      {/* Acción */}
      {showAction && onClick && (
        <div className="stat-card-action">
          <button
            onClick={handleClick}
            className="stat-card-action-button"
            aria-label={actionLabel}
          >
            {actionLabel}
            <span className="stat-card-action-arrow">→</span>
          </button>
        </div>
      )}
    </div>
  );
});

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  change: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  icon: PropTypes.string,
  trend: PropTypes.oneOf(['up', 'down']),
  loading: PropTypes.bool,
  error: PropTypes.bool,
  onClick: PropTypes.func,
  unit: PropTypes.string,
  description: PropTypes.string,
  showChange: PropTypes.bool,
  showTrendIcon: PropTypes.bool,
  compact: PropTypes.bool,
  className: PropTypes.string,
  color: PropTypes.string,
  showAction: PropTypes.bool,
  actionLabel: PropTypes.string,
  formatValue: PropTypes.func,
  badge: PropTypes.string,
  badgeColor: PropTypes.string,
  inventoryType: PropTypes.string,
  stockStatus: PropTypes.string,
  ariaLabel: PropTypes.string,
  tabIndex: PropTypes.number,
  dataTestId: PropTypes.string,
};

StatCard.defaultProps = {
  icon: 'chart',
  trend: 'up',
  loading: false,
  error: false,
  unit: '',
  showChange: true,
  showTrendIcon: true,
  compact: false,
  color: 'primary',
  showAction: false,
  actionLabel: 'Ver detalles',
  badgeColor: 'primary',
};

StatCard.displayName = 'StatCard';

export default StatCard;