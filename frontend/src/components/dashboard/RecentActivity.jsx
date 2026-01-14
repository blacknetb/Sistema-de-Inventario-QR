// RecentActivity.jsx - CORREGIDO Y COMPLETO
import React, { useMemo, memo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/RecentActivity.css';

// ✅ TIPOS DE ACTIVIDAD
const ACTIVITY_TYPES = {
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info',
  INVENTORY_ADD: 'inventory_add',
  INVENTORY_UPDATE: 'inventory_update',
  INVENTORY_DELETE: 'inventory_delete',
  INVENTORY_SCAN: 'inventory_scan',
  ORDER_CREATE: 'order_create',
  ORDER_COMPLETE: 'order_complete',
  USER_LOGIN: 'user_login',
  QR_GENERATE: 'qr_generate',
  QR_SCAN: 'qr_scan',
};

// ✅ CONFIGURACIÓN DE ACTIVIDADES
const ACTIVITY_CONFIG = {
  [ACTIVITY_TYPES.SUCCESS]: {
    icon: '✅',
    bgColor: '#d1fae5',
    textColor: '#065f46',
    label: 'Completado'
  },
  [ACTIVITY_TYPES.WARNING]: {
    icon: '⚠️',
    bgColor: '#fef3c7',
    textColor: '#92400e',
    label: 'Advertencia'
  },
  [ACTIVITY_TYPES.ERROR]: {
    icon: '❌',
    bgColor: '#fee2e2',
    textColor: '#991b1b',
    label: 'Error'
  },
  [ACTIVITY_TYPES.INFO]: {
    icon: 'ℹ️',
    bgColor: '#dbeafe',
    textColor: '#1e40af',
    label: 'Información'
  },
  [ACTIVITY_TYPES.INVENTORY_ADD]: {
    icon: '📦',
    bgColor: '#d1fae5',
    textColor: '#065f46',
    label: 'Producto Agregado'
  },
  [ACTIVITY_TYPES.INVENTORY_UPDATE]: {
    icon: '🔄',
    bgColor: '#e0e7ff',
    textColor: '#3730a3',
    label: 'Producto Actualizado'
  },
  [ACTIVITY_TYPES.INVENTORY_DELETE]: {
    icon: '🗑️',
    bgColor: '#fee2e2',
    textColor: '#991b1b',
    label: 'Producto Eliminado'
  },
  [ACTIVITY_TYPES.INVENTORY_SCAN]: {
    icon: '📱',
    bgColor: '#e0e7ff',
    textColor: '#3730a3',
    label: 'QR Escaneado'
  },
  [ACTIVITY_TYPES.ORDER_CREATE]: {
    icon: '📝',
    bgColor: '#f0f9ff',
    textColor: '#0c4a6e',
    label: 'Orden Creada'
  },
  [ACTIVITY_TYPES.ORDER_COMPLETE]: {
    icon: '✅',
    bgColor: '#d1fae5',
    textColor: '#065f46',
    label: 'Orden Completada'
  },
  [ACTIVITY_TYPES.USER_LOGIN]: {
    icon: '👤',
    bgColor: '#f0f9ff',
    textColor: '#0c4a6e',
    label: 'Inicio de Sesión'
  },
  [ACTIVITY_TYPES.QR_GENERATE]: {
    icon: '🏷️',
    bgColor: '#f3e8ff',
    textColor: '#6b21a8',
    label: 'QR Generado'
  },
  [ACTIVITY_TYPES.QR_SCAN]: {
    icon: '📱',
    bgColor: '#e0e7ff',
    textColor: '#3730a3',
    label: 'QR Escaneado'
  },
};

// ✅ FORMATEAR FECHA
const formatTime = (timestamp) => {
  try {
    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return "Fecha inválida";
    }

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return "Ahora mismo";
    }
    if (diffMins < 60) {
      return `Hace ${diffMins} ${diffMins === 1 ? "minuto" : "minutos"}`;
    }
    if (diffHours < 24) {
      return `Hace ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`;
    }
    if (diffDays < 7) {
      return `Hace ${diffDays} ${diffDays === 1 ? "día" : "días"}`;
    }

    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (error) {
    console.error("Error formateando fecha:", error);
    return "Fecha inválida";
  }
};

// ✅ COMPONENTE ACTIVITY ITEM
const ActivityItem = memo(({ 
  activity, 
  config, 
  onClick 
}) => {
  const handleClick = useCallback(() => {
    if (onClick) onClick(activity);
  }, [onClick, activity]);

  const handleKeyDown = useCallback((e) => {
    if ((e.key === "Enter" || e.key === " ") && onClick) {
      e.preventDefault();
      onClick(activity);
    }
  }, [onClick, activity]);

  return (
    <div
      className={`recent-activity-item ${activity.unread ? 'recent-activity-item-unread' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : "article"}
      tabIndex={onClick ? 0 : -1}
      aria-label={`Actividad: ${activity.message}. Tipo: ${config.label}. ${formatTime(activity.timestamp)}`}
    >
      {/* Icono */}
      <div 
        className="recent-activity-item-icon"
        style={{ backgroundColor: config.bgColor }}
      >
        <span style={{ fontSize: '18px', color: config.textColor }}>
          {config.icon}
        </span>
      </div>

      {/* Contenido */}
      <div className="recent-activity-item-content">
        <p className="recent-activity-item-message">
          {activity.message}
        </p>

        {/* Metadatos */}
        <div className="recent-activity-item-meta">
          <span className="recent-activity-item-time">
            <span>🕒</span>
            {formatTime(activity.timestamp)}
          </span>

          {activity.user && activity.user !== 'Sistema' && (
            <>
              <span className="recent-activity-item-separator">•</span>
              <span className="recent-activity-item-user">
                <span>👤</span>
                {activity.user}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Badge de estado */}
      <div 
        className="recent-activity-item-badge"
        style={{ 
          backgroundColor: config.bgColor,
          color: config.textColor
        }}
      >
        {config.label}
      </div>
    </div>
  );
});

ActivityItem.displayName = 'ActivityItem';

// ✅ COMPONENTE PRINCIPAL
const RecentActivity = memo(({
  activities = [],
  title = 'Actividad Reciente',
  showFilters = true,
  showSearch = true,
  maxItems = 5,
  emptyMessage = 'No hay actividad reciente',
  loading = false,
  error = false,
  onViewAll,
  onActivityClick,
  onRefresh,
  ariaLabel,
  dataTestId,
  className,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  // ✅ FILTRAR ACTIVIDADES
  const filteredActivities = useMemo(() => {
    if (!activities || !Array.isArray(activities)) return [];

    let filtered = activities.filter(activity =>
      activity &&
      typeof activity === 'object' &&
      activity.message &&
      activity.timestamp
    );

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(activity =>
        activity.message?.toLowerCase().includes(term) ||
        activity.user?.toLowerCase().includes(term) ||
        activity.type?.toLowerCase().includes(term)
      );
    }

    // Filtrar por tipo
    if (selectedType !== 'all') {
      filtered = filtered.filter(activity => activity.type === selectedType);
    }

    // Ordenar por fecha (más reciente primero)
    return filtered.sort((a, b) => {
      try {
        return new Date(b.timestamp) - new Date(a.timestamp);
      } catch {
        return 0;
      }
    });
  }, [activities, searchTerm, selectedType]);

  // ✅ TIPOS ÚNICOS
  const uniqueTypes = useMemo(() => {
    const types = new Set(['all']);
    
    filteredActivities.forEach(activity => {
      if (activity.type) {
        types.add(activity.type);
      }
    });
    
    return Array.from(types);
  }, [filteredActivities]);

  // ✅ MANEJADORES DE EVENTOS
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleTypeChange = useCallback((e) => {
    setSelectedType(e.target.value);
  }, []);

  const handleRefreshClick = useCallback((e) => {
    e.stopPropagation();
    if (onRefresh) onRefresh();
  }, [onRefresh]);

  const handleViewAllClick = useCallback((e) => {
    e.stopPropagation();
    if (onViewAll) onViewAll();
  }, [onViewAll]);

  // ✅ ESTADO DE CARGA
  if (loading) {
    return (
      <div
        className={`recent-activity-container ${className || ''}`}
        data-testid={dataTestId ? `${dataTestId}-loading` : 'recent-activity-loading'}
      >
        <div className="recent-activity-loading">
          <div className="recent-activity-skeleton-header">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div className="recent-activity-skeleton-icon"></div>
              <div className="recent-activity-skeleton-title"></div>
            </div>
            <div className="recent-activity-skeleton-action"></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="recent-activity-skeleton-item">
                <div className="recent-activity-skeleton-item-icon"></div>
                <div className="recent-activity-skeleton-item-content">
                  <div className="recent-activity-skeleton-item-title"></div>
                  <div className="recent-activity-skeleton-item-description"></div>
                </div>
                <div className="recent-activity-skeleton-item-time"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ✅ ESTADO DE ERROR
  if (error) {
    return (
      <div
        className={`recent-activity-container ${className || ''}`}
        data-testid={dataTestId ? `${dataTestId}-error` : 'recent-activity-error'}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <div className="recent-activity-error-icon-container" style={{
            padding: '8px',
            borderRadius: '8px',
            backgroundColor: '#fee2e2',
            marginRight: '12px'
          }}>
            <span>❌</span>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>{title}</h3>
        </div>
        <div className="recent-activity-error">
          <div className="recent-activity-error-icon">❌</div>
          <p className="recent-activity-error-message">Error al cargar la actividad</p>
          {onRefresh && (
            <button
              onClick={handleRefreshClick}
              className="recent-activity-retry-button"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`recent-activity-container ${className || ''}`}
      data-testid={dataTestId}
      aria-label={ariaLabel || 'Actividad reciente del sistema'}
    >
      {/* Header */}
      <div className="recent-activity-header">
        <div className="recent-activity-title-container">
          <div className="recent-activity-title-wrapper">
            <div className="recent-activity-icon-container">
              <span className="recent-activity-icon">📊</span>
            </div>
            <div>
              <h3 className="recent-activity-title">
                {title}
              </h3>
              <p className="recent-activity-subtitle">
                {filteredActivities.length} {filteredActivities.length === 1 ? 'actividad' : 'actividades'}
              </p>
            </div>
          </div>

          {onRefresh && (
            <button
              onClick={handleRefreshClick}
              className="recent-activity-refresh-button"
              aria-label="Actualizar actividad"
            >
              🔄
            </button>
          )}
        </div>

        {/* Filtros */}
        {showFilters && (
          <div className="recent-activity-filters">
            {showSearch && (
              <div className="recent-activity-search-container">
                <span className="recent-activity-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Buscar actividad..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="recent-activity-search-input"
                  aria-label="Buscar actividad"
                />
              </div>
            )}

            <select
              value={selectedType}
              onChange={handleTypeChange}
              className="recent-activity-type-select"
              aria-label="Filtrar por tipo de actividad"
            >
              <option value="all">Todos los tipos</option>
              {uniqueTypes.filter(type => type !== 'all').map(type => {
                const config = ACTIVITY_CONFIG[type] || ACTIVITY_CONFIG[ACTIVITY_TYPES.INFO];
                return (
                  <option key={type} value={type}>
                    {config.label}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {/* Lista de actividades */}
      <div className="recent-activity-list">
        {filteredActivities.length === 0 ? (
          <div className="recent-activity-empty">
            <div className="recent-activity-empty-icon">📝</div>
            <p className="recent-activity-empty-message">{emptyMessage}</p>
          </div>
        ) : (
          filteredActivities.slice(0, maxItems).map((activity, index) => {
            const config = ACTIVITY_CONFIG[activity.type] || ACTIVITY_CONFIG[ACTIVITY_TYPES.INFO];

            return (
              <ActivityItem
                key={`activity-${activity.id || index}`}
                activity={activity}
                config={config}
                onClick={onActivityClick}
              />
            );
          })
        )}
      </div>

      {/* Ver todo */}
      {filteredActivities.length > maxItems && onViewAll && (
        <button
          onClick={handleViewAllClick}
          className="recent-activity-view-all"
          aria-label={`Ver todas las actividades (${filteredActivities.length} disponibles)`}
        >
          Ver todas las actividades ({filteredActivities.length})
          <span className="recent-activity-view-all-arrow">→</span>
        </button>
      )}
    </div>
  );
});

RecentActivity.propTypes = {
  activities: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      type: PropTypes.string,
      message: PropTypes.string.isRequired,
      timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]).isRequired,
      user: PropTypes.string,
      unread: PropTypes.bool,
    })
  ),
  title: PropTypes.string,
  showFilters: PropTypes.bool,
  showSearch: PropTypes.bool,
  maxItems: PropTypes.number,
  emptyMessage: PropTypes.string,
  loading: PropTypes.bool,
  error: PropTypes.bool,
  onViewAll: PropTypes.func,
  onActivityClick: PropTypes.func,
  onRefresh: PropTypes.func,
  ariaLabel: PropTypes.string,
  dataTestId: PropTypes.string,
  className: PropTypes.string,
};

RecentActivity.defaultProps = {
  activities: [],
  title: 'Actividad Reciente',
  showFilters: true,
  showSearch: true,
  maxItems: 5,
  emptyMessage: 'No hay actividad reciente',
  loading: false,
  error: false,
};

RecentActivity.displayName = 'RecentActivity';

export default RecentActivity;