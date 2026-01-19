import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import "../assets/styles/main/components.css";
/**
 * Componente de botón de pestaña para navegación entre secciones
 * Soporta múltiples modos de visualización y estados
 */
const TabButton = ({
  tabs = [],
  activeTab = '',
  onTabChange,
  mode = 'default',
  size = 'medium',
  fullWidth = false,
  withIcons = true,
  withBadges = true,
  animated = true,
  disabled = false,
  className = '',
  style = {}
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState(activeTab);
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const [hoveredTab, setHoveredTab] = useState(null);
  
  const tabContainerRef = React.useRef(null);
  const tabRefs = React.useRef({});

  // Actualizar tab activo cuando cambia la prop
  useEffect(() => {
    if (activeTab !== internalActiveTab) {
      setInternalActiveTab(activeTab);
    }
  }, [activeTab]);

  // Calcular posición del indicador
  useEffect(() => {
    updateIndicatorPosition();
  }, [internalActiveTab, tabs]);

  // Actualizar indicador al redimensionar
  useEffect(() => {
    const handleResize = () => updateIndicatorPosition();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateIndicatorPosition = () => {
    if (!tabContainerRef.current) return;
    
    const activeTabElement = tabRefs.current[internalActiveTab];
    if (!activeTabElement) return;

    const containerRect = tabContainerRef.current.getBoundingClientRect();
    const tabRect = activeTabElement.getBoundingClientRect();
    
    const indicatorWidth = mode === 'underline' ? '80%' : '100%';
    const indicatorHeight = mode === 'underline' ? '3px' : '100%';
    
    setIndicatorStyle({
      left: `${tabRect.left - containerRect.left}px`,
      width: `${tabRect.width}px`,
      height: indicatorHeight,
      maxWidth: indicatorWidth,
      transform: 'translateX(0)',
      transition: animated ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
    });
  };

  const handleTabClick = (tabId) => {
    if (disabled) return;
    
    setInternalActiveTab(tabId);
    
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  const handleMouseEnter = (tabId) => {
    if (animated && !disabled) {
      setHoveredTab(tabId);
    }
  };

  const handleMouseLeave = () => {
    if (animated && !disabled) {
      setHoveredTab(null);
    }
  };

  const getTabSizeClass = () => {
    switch(size) {
      case 'small': return 'tab-size-small';
      case 'large': return 'tab-size-large';
      default: return 'tab-size-medium';
    }
  };

  const getTabModeClass = () => {
    switch(mode) {
      case 'pill': return 'tab-mode-pill';
      case 'underline': return 'tab-mode-underline';
      case 'rounded': return 'tab-mode-rounded';
      case 'outline': return 'tab-mode-outline';
      case 'segmented': return 'tab-mode-segmented';
      default: return 'tab-mode-default';
    }
  };

  const renderBadge = (badge) => {
    if (!badge) return null;
    
    const badgeClass = `tab-badge ${
      badge.type === 'error' ? 'badge-error' :
      badge.type === 'warning' ? 'badge-warning' :
      badge.type === 'success' ? 'badge-success' :
      badge.type === 'info' ? 'badge-info' :
      'badge-default'
    }`;
    
    return (
      <span className={badgeClass}>
        {badge.count > 99 ? '99+' : badge.count}
      </span>
    );
  };

  const renderIcon = (icon, position = 'left') => {
    if (!icon) return null;
    
    const iconClass = `tab-icon icon-${position} ${
      typeof icon === 'string' ? 'icon-emoji' : 'icon-component'
    }`;
    
    return (
      <span className={iconClass}>
        {typeof icon === 'string' ? icon : React.cloneElement(icon)}
      </span>
    );
  };

  // Si no hay tabs, mostrar estado vacío
  if (!tabs || tabs.length === 0) {
    return (
      <div className={`tab-container empty ${className}`} style={style}>
        <div className="empty-tabs">
          <span className="empty-icon">📋</span>
          <p className="empty-text">No hay pestañas configuradas</p>
        </div>
      </div>
    );
  }

  // Encontrar tab activo por defecto si no hay uno seleccionado
  const defaultActiveTab = internalActiveTab || (tabs.find(tab => tab.default)?.id || tabs[0]?.id);

  return (
    <div 
      className={`tab-container ${getTabModeClass()} ${getTabSizeClass()} ${
        fullWidth ? 'full-width' : ''
      } ${disabled ? 'disabled' : ''} ${className}`}
      style={style}
      ref={tabContainerRef}
    >
      <div className="tabs-wrapper">
        {tabs.map((tab) => {
          const isActive = internalActiveTab === tab.id;
          const isHovered = hoveredTab === tab.id;
          
          const tabClass = `tab-button ${isActive ? 'active' : ''} ${
            isHovered ? 'hovered' : ''
          } ${tab.disabled ? 'tab-disabled' : ''}`;
          
          return (
            <button
              key={tab.id}
              ref={(el) => { tabRefs.current[tab.id] = el; }}
              className={tabClass}
              onClick={() => !tab.disabled && handleTabClick(tab.id)}
              onMouseEnter={() => handleMouseEnter(tab.id)}
              onMouseLeave={handleMouseLeave}
              disabled={disabled || tab.disabled}
              title={tab.tooltip || tab.label}
              aria-label={tab.label}
              aria-selected={isActive}
              aria-disabled={disabled || tab.disabled}
              role="tab"
              tabIndex={disabled || tab.disabled ? -1 : 0}
            >
              <div className="tab-content">
                {/* Icono izquierdo */}
                {withIcons && renderIcon(tab.iconLeft || tab.icon, 'left')}
                
                {/* Contenido principal */}
                <span className="tab-label">{tab.label}</span>
                
                {/* Icono derecho */}
                {withIcons && renderIcon(tab.iconRight, 'right')}
                
                {/* Badge */}
                {withBadges && tab.badge && renderBadge(tab.badge)}
              </div>
              
              {/* Subtexto opcional */}
              {tab.subtext && (
                <span className="tab-subtext">{tab.subtext}</span>
              )}
              
              {/* Estado de carga */}
              {tab.loading && (
                <div className="tab-loading">
                  <span className="loading-spinner"></span>
                </div>
              )}
            </button>
          );
        })}
        
        {/* Indicador visual para tabs activo */}
        {mode !== 'segmented' && (
          <div 
            className={`tab-indicator ${
              mode === 'underline' ? 'indicator-underline' : 'indicator-background'
            }`}
            style={indicatorStyle}
            aria-hidden="true"
          />
        )}
      </div>
      
      {/* Contenido de la pestaña activa (opcional) */}
      {tabs.find(tab => tab.id === internalActiveTab)?.content && (
        <div className="tab-content-container">
          {tabs.find(tab => tab.id === internalActiveTab).content}
        </div>
      )}
    </div>
  );
};

TabButton.propTypes = {
  /**
   * Array de objetos de pestañas con:
   * id: string (requerido)
   * label: string (requerido)
   * icon: string|ReactNode (opcional)
   * iconLeft: string|ReactNode (opcional)
   * iconRight: string|ReactNode (opcional)
   * badge: {count: number, type: string} (opcional)
   * subtext: string (opcional)
   * tooltip: string (opcional)
   * disabled: boolean (opcional)
   * loading: boolean (opcional)
   * default: boolean (opcional)
   * content: ReactNode (opcional)
   */
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
      iconLeft: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
      iconRight: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
      badge: PropTypes.shape({
        count: PropTypes.number.isRequired,
        type: PropTypes.oneOf(['default', 'error', 'warning', 'success', 'info'])
      }),
      subtext: PropTypes.string,
      tooltip: PropTypes.string,
      disabled: PropTypes.bool,
      loading: PropTypes.bool,
      default: PropTypes.bool,
      content: PropTypes.node
    })
  ).isRequired,
  
  /** ID de la pestaña activa */
  activeTab: PropTypes.string,
  
  /** Callback cuando cambia la pestaña */
  onTabChange: PropTypes.func,
  
  /** Modo de visualización */
  mode: PropTypes.oneOf(['default', 'pill', 'underline', 'rounded', 'outline', 'segmented']),
  
  /** Tamaño de los botones */
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  
  /** Ocupar todo el ancho disponible */
  fullWidth: PropTypes.bool,
  
  /** Mostrar iconos */
  withIcons: PropTypes.bool,
  
  /** Mostrar badges */
  withBadges: PropTypes.bool,
  
  /** Habilitar animaciones */
  animated: PropTypes.bool,
  
  /** Deshabilitar todo el componente */
  disabled: PropTypes.bool,
  
  /** Clase CSS adicional */
  className: PropTypes.string,
  
  /** Estilos adicionales */
  style: PropTypes.object
};

TabButton.defaultProps = {
  tabs: [],
  mode: 'default',
  size: 'medium',
  fullWidth: false,
  withIcons: true,
  withBadges: true,
  animated: true,
  disabled: false,
  className: '',
  style: {}
};

export default TabButton;