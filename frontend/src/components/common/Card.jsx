import React, { forwardRef, useMemo, useCallback, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import clsx from 'clsx';
import "../../assets/styles/global.css";

// ✅ COMPONENTE SKELETON DE CARGA - MEJORADO: Manejo de props optimizado
const CardLoadingSkeleton = forwardRef(({
  title = false,
  subtitle = false,
  header = false,
  footer = false,
  className,
  ariaLabel,
  headerPadding = true,
  footerPadding = true,
  padding = true,
  headerClassName,
  bodyClassName,
  footerClassName,
  skeletonType = 'default',
  ...props
}, ref) => {
  
  const skeletonId = useMemo(() => uuidv4(), []);

  return (
    <div
      ref={ref}
      className={clsx(
        'card', 
        'card-loading-skeleton', 
        `card-skeleton-${skeletonType}`, 
        className
      )}
      aria-busy="true"
      aria-label={ariaLabel || 'Cargando contenido...'}
      data-testid={`card-loading-${skeletonId}`}
      role="status"
      {...props}
    >
      {(title || subtitle || header) && (
        <div
          className={clsx(
            'card-header',
            { 'card-header-padding': headerPadding },
            headerClassName
          )}
        >
          {title && <div className="card-loading-line card-loading-line-title"></div>}
          {subtitle && <div className="card-loading-line card-loading-line-medium"></div>}
          {header && <div className="card-loading-line card-loading-line-wide"></div>}
        </div>
      )}

      <div className={clsx('card-body', { 'card-body-padding': padding }, bodyClassName)}>
        <div className="card-loading-content">
          <div className="card-loading-line"></div>
          <div className="card-loading-line card-loading-line-medium"></div>
          <div className="card-loading-line card-loading-line-narrow"></div>
        </div>
      </div>

      {footer && (
        <div
          className={clsx(
            'card-footer',
            { 'card-footer-padding': footerPadding },
            footerClassName
          )}
        >
          <div className="card-loading-line card-loading-line-medium"></div>
        </div>
      )}
    </div>
  );
});

CardLoadingSkeleton.displayName = 'CardLoadingSkeleton';
CardLoadingSkeleton.propTypes = {
  title: PropTypes.bool,
  subtitle: PropTypes.bool,
  header: PropTypes.bool,
  footer: PropTypes.bool,
  className: PropTypes.string,
  ariaLabel: PropTypes.string,
  headerPadding: PropTypes.bool,
  footerPadding: PropTypes.bool,
  padding: PropTypes.bool,
  headerClassName: PropTypes.string,
  bodyClassName: PropTypes.string,
  footerClassName: PropTypes.string,
  skeletonType: PropTypes.oneOf(['default', 'stat', 'action', 'product', 'list']),
};

CardLoadingSkeleton.defaultProps = {
  title: false,
  subtitle: false,
  header: false,
  footer: false,
  headerPadding: true,
  footerPadding: true,
  padding: true,
  skeletonType: 'default',
};

// ✅ COMPONENTE CARDACTION - MEJORADO: Manejo de eventos y accesibilidad
const CardAction = forwardRef(({
  children,
  onClick,
  disabled = false,
  className = '',
  ...props
}, ref) => {
  const handleClick = useCallback((event) => {
    if (!disabled && onClick) {
      onClick(event);
    }
  }, [disabled, onClick]);

  const handleKeyDown = useCallback((e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled && onClick) {
      e.preventDefault();
      onClick(e);
    }
  }, [disabled, onClick]);

  return (
    <div
      ref={ref}
      className={clsx('card-action', className, { 'card-action-disabled': disabled })}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      {...props}
    >
      {children}
    </div>
  );
});

CardAction.displayName = 'CardAction';
CardAction.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

// ✅ COMPONENTE CARDPRODUCT - MEJORADO: Accesibilidad y manejo de imágenes
const CardProduct = forwardRef(({
  image,
  title,
  price,
  description,
  rating,
  stock,
  className = '',
  ...props
}, ref) => {
  const hasStock = stock !== undefined && stock !== null;
  const stockStatus = hasStock ? (stock > 0 ? 'in-stock' : 'out-of-stock') : 'unknown';

  return (
    <Card
      ref={ref}
      className={clsx('card-product', className)}
      hover
      {...props}
    >
      {image && (
        <div className="card-product-image">
          <img 
            src={image} 
            alt={title || 'Producto'} 
            loading="lazy" 
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjNjY2Ij5JbWFnZW4gbm8gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=';
            }}
          />
        </div>
      )}
      <div className="card-product-content">
        <h3 className="card-product-title">{title || 'Producto sin título'}</h3>
        {description && <p className="card-product-description">{description}</p>}
        <div className="card-product-footer">
          <span className="card-product-price">{price || '$0.00'}</span>
          {rating !== undefined && rating !== null && (
            <span 
              className="card-product-rating" 
              aria-label={`Rating: ${rating} de 5 estrellas`}
            >
              ⭐ {rating}
            </span>
          )}
          {hasStock && (
            <span 
              className={`card-product-stock ${stockStatus}`}
              aria-label={stock > 0 ? `Stock disponible: ${stock} unidades` : 'Producto agotado'}
            >
              {stock > 0 ? `Stock: ${stock}` : 'Agotado'}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
});

CardProduct.displayName = 'CardProduct';
CardProduct.propTypes = {
  image: PropTypes.string,
  title: PropTypes.string,
  price: PropTypes.string,
  description: PropTypes.string,
  rating: PropTypes.number,
  stock: PropTypes.number,
  className: PropTypes.string,
};

// ✅ COMPONENTE CARDLIST - MEJORADO: Manejo de items vacíos y loading
const CardList = forwardRef(({
  items = [],
  loading = false,
  emptyMessage = 'No hay elementos',
  className = '',
  ...props
}, ref) => {
  if (loading) {
    return (
      <CardLoadingSkeleton
        ref={ref}
        className={clsx('card-list', className)}
        skeletonType="list"
        {...props}
      />
    );
  }

  if (!items || items.length === 0) {
    return (
      <Card
        ref={ref}
        className={clsx('card-list card-list-empty', className)}
        {...props}
      >
        <div className="card-list-empty-content" role="status" aria-live="polite">
          {emptyMessage}
        </div>
      </Card>
    );
  }

  return (
    <Card
      ref={ref}
      className={clsx('card-list', className)}
      padding={false}
      {...props}
    >
      <ul className="card-list-items" role="list">
        {items.map((item, index) => (
          <li 
            key={item.id || `item-${index}`} 
            className="card-list-item"
            role="listitem"
          >
            {item.content}
          </li>
        ))}
      </ul>
    </Card>
  );
});

CardList.displayName = 'CardList';
CardList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    content: PropTypes.node
  })),
  loading: PropTypes.bool,
  emptyMessage: PropTypes.string,
  className: PropTypes.string,
};

// ✅ COMPONENTE CARDSECTION - MEJORADO: Estructura semántica
const CardSection = forwardRef(({
  title,
  children,
  actions,
  className = '',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={clsx('card-section', className)}
      {...props}
    >
      {(title || actions) && (
        <div className="card-section-header">
          {title && <h3 className="card-section-title">{title}</h3>}
          {actions && <div className="card-section-actions">{actions}</div>}
        </div>
      )}
      <div className="card-section-content">
        {children}
      </div>
    </div>
  );
});

CardSection.displayName = 'CardSection';
CardSection.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  actions: PropTypes.node,
  className: PropTypes.string,
};

// ✅ COMPONENTE CARDSTAT - COMPLETAMENTE REVISADO
const CardStat = forwardRef(({
  title,
  value,
  change,
  icon,
  color = 'primary',
  format,
  description,
  trend = 'neutral',
  loading = false,
  className = '',
  ...props
}, ref) => {
  
  const colorClasses = useMemo(() => ({
    primary: 'card-stat-color-primary',
    secondary: 'card-stat-color-secondary',
    success: 'card-stat-color-success',
    warning: 'card-stat-color-warning',
    danger: 'card-stat-color-danger',
    info: 'card-stat-color-info',
    light: 'card-stat-color-light',
    dark: 'card-stat-color-dark'
  }), []);
  
  const formattedValue = useMemo(() => {
    try {
      if (format && typeof format === 'function') {
        return format(value);
      }
      if (typeof value === 'number') {
        return new Intl.NumberFormat('es-ES').format(value);
      }
      return value || 'N/A';
    } catch (error) {
      console.error('Error formatting value:', error);
      return value || 'Error';
    }
  }, [value, format]);
  
  const getChangeClass = useCallback(() => {
    if (trend === 'up') return 'card-stat-change-up';
    if (trend === 'down') return 'card-stat-change-down';
    return 'card-stat-change-neutral';
  }, [trend]);
  
  if (loading) {
    return (
      <CardLoadingSkeleton
        ref={ref}
        className={clsx('card-stat', className)}
        skeletonType="stat"
        ariaLabel={`${title || 'Estadística'} - Cargando...`}
        {...props}
      />
    );
  }
  
  const showChange = change !== undefined && change !== null && !isNaN(parseFloat(change));
  const showDescription = description && typeof description === 'string' && description.trim() !== '';
  const selectedColorClass = colorClasses[color] || colorClasses.primary;
  
  return (
    <Card 
      ref={ref} 
      className={clsx('card-stat', className)} 
      padding={false}
      aria-label={`Estadística: ${title || 'Sin título'}, Valor: ${formattedValue}`}
      {...props}
    >
      <div className='card-stat-content'>
        <div className='card-stat-left'>
          <p className='card-stat-title'>{title || 'Sin título'}</p>
          <p className='card-stat-value'>
            {formattedValue}
          </p>
          
          {showDescription && (
            <p className='card-stat-description'>{description}</p>
          )}
          
          {showChange && (
            <div className={clsx('card-stat-change', getChangeClass())}>
              {trend === 'up' && '↗'}
              {trend === 'down' && '↘'}
              {Math.abs(change)}%
              <span className='card-stat-change-label'>vs anterior</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={clsx('card-stat-icon', selectedColorClass)} aria-hidden="true">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
});

CardStat.displayName = 'CardStat';
CardStat.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.object]).isRequired,
  change: PropTypes.number,
  icon: PropTypes.node,
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'warning', 'danger', 'info', 'light', 'dark']),
  format: PropTypes.func,
  description: PropTypes.string,
  trend: PropTypes.oneOf(['up', 'down', 'neutral']),
  loading: PropTypes.bool,
  className: PropTypes.string,
};

CardStat.defaultProps = {
  color: 'primary',
  trend: 'neutral',
  loading: false,
};

// ✅ COMPONENTE PRINCIPAL CARD - OPTIMIZADO Y CORREGIDO
const Card = forwardRef(({
  children,
  title,
  subtitle,
  header,
  footer,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  variant = 'default',
  elevation = 'md',
  border = true,
  hover = false,
  padding = true,
  headerPadding = true,
  footerPadding = true,
  clickable = false,
  onClick,
  loading = false,
  selected = false,
  disabled = false,
  role,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'aria-labelledby': ariaLabelledBy,
  tabIndex,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  onKeyDown,
  as: Component = 'div',
  href,
  target,
  ...props
}, ref) => {
  
  const isLink = Boolean(href);
  const isButton = clickable && !isLink;
  
  const Tag = useMemo(() => {
    if (isLink) return 'a';
    if (isButton) return 'button';
    return Component;
  }, [isLink, isButton, Component]);
  
  const cardClasses = useMemo(() => clsx(
    'card',
    `card-${variant}`,
    `card-elevation-${elevation}`,
    {
      'card-with-border': border,
      'card-hover': hover && !disabled,
      'card-clickable': clickable && !disabled,
      'card-selected': selected,
      'card-disabled': disabled,
      'card-loading': loading,
      'card-no-padding': !padding,
    },
    className
  ), [variant, elevation, border, hover, disabled, clickable, selected, loading, padding, className]);
  
  const headerClasses = useMemo(() => clsx(
    'card-header',
    { 'card-header-padding': headerPadding && !loading },
    headerClassName
  ), [headerPadding, headerClassName, loading]);
  
  const bodyClasses = useMemo(() => clsx(
    'card-body',
    { 'card-body-padding': padding && !loading },
    bodyClassName
  ), [padding, bodyClassName, loading]);
  
  const footerClasses = useMemo(() => clsx(
    'card-footer',
    { 'card-footer-padding': footerPadding && !loading },
    footerClassName
  ), [footerPadding, footerClassName, loading]);
  
  const handleClick = useCallback((event) => {
    if (disabled || loading) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    
    if (onClick && typeof onClick === 'function') {
      try {
        onClick(event);
      } catch (error) {
        console.error('Error en click handler:', error);
      }
    }
  }, [disabled, loading, onClick]);
  
  const handleKeyDown = useCallback((event) => {
    if (onKeyDown && typeof onKeyDown === 'function') {
      try {
        onKeyDown(event);
      } catch (error) {
        console.error('Error en keydown handler:', error);
      }
    }
    
    if (clickable && (event.key === 'Enter' || event.key === ' ') && !disabled && !loading && onClick) {
      event.preventDefault();
      handleClick(event);
    }
  }, [clickable, disabled, loading, onClick, onKeyDown, handleClick]);
  
  const elementProps = useMemo(() => {
    const propsObj = {
      ref,
      className: cardClasses,
      onMouseEnter,
      onMouseLeave,
      onFocus,
      onBlur,
      'aria-disabled': disabled ? true : undefined,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      'aria-labelledby': ariaLabelledBy,
      role: role || (isButton ? 'button' : isLink ? 'link' : 'region'),
      tabIndex: disabled ? -1 : tabIndex !== undefined ? tabIndex : (clickable ? 0 : undefined),
      ...props,
    };
    
    if (clickable || isLink || isButton) {
      propsObj.onClick = handleClick;
    }
    
    if (clickable || isButton) {
      propsObj.onKeyDown = handleKeyDown;
    }
    
    if (isButton && disabled) {
      propsObj.disabled = true;
    }
    
    if (isLink) {
      propsObj.href = disabled ? undefined : href;
      propsObj.target = target;
      if (target === '_blank') {
        propsObj.rel = 'noopener noreferrer';
      }
    }
    
    return propsObj;
  }, [
    ref, cardClasses, clickable, isLink, isButton, handleClick, handleKeyDown, 
    onMouseEnter, onMouseLeave, onFocus, onBlur, disabled, ariaLabel, 
    ariaDescribedBy, ariaLabelledBy, role, tabIndex, href, target, props
  ]);
  
  if (loading) {
    return (
      <CardLoadingSkeleton
        ref={ref}
        title={!!title}
        subtitle={!!subtitle}
        header={!!header}
        footer={!!footer}
        className={className}
        ariaLabel={ariaLabel}
        headerPadding={headerPadding}
        footerPadding={footerPadding}
        padding={padding}
        headerClassName={headerClassName}
        bodyClassName={bodyClassName}
        footerClassName={footerClassName}
      />
    );
  }
  
  return (
    <Tag {...elementProps}>
      {(title || subtitle || header) && (
        <div className={headerClasses}>
          {header || (
            <>
              {title && <h3 className='card-title'>{title}</h3>}
              {subtitle && <p className='card-subtitle'>{subtitle}</p>}
            </>
          )}
        </div>
      )}
      
      <div className={bodyClasses}>
        {children}
      </div>
      
      {footer && (
        <div className={footerClasses}>
          {footer}
        </div>
      )}
    </Tag>
  );
});

Card.displayName = 'Card';

Card.propTypes = {
  children: PropTypes.node,
  title: PropTypes.node,
  subtitle: PropTypes.node,
  header: PropTypes.node,
  footer: PropTypes.node,
  className: PropTypes.string,
  headerClassName: PropTypes.string,
  bodyClassName: PropTypes.string,
  footerClassName: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'primary', 'secondary', 'success', 'warning', 'danger', 'info', 'light', 'dark']),
  elevation: PropTypes.oneOf(['none', 'sm', 'md', 'lg', 'xl']),
  border: PropTypes.bool,
  hover: PropTypes.bool,
  padding: PropTypes.bool,
  headerPadding: PropTypes.bool,
  footerPadding: PropTypes.bool,
  clickable: PropTypes.bool,
  onClick: PropTypes.func,
  loading: PropTypes.bool,
  selected: PropTypes.bool,
  disabled: PropTypes.bool,
  role: PropTypes.string,
  'aria-label': PropTypes.string,
  'aria-describedby': PropTypes.string,
  'aria-labelledby': PropTypes.string,
  tabIndex: PropTypes.number,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  onKeyDown: PropTypes.func,
  as: PropTypes.elementType,
  href: PropTypes.string,
  target: PropTypes.oneOf(['_self', '_blank', '_parent', '_top']),
};

Card.defaultProps = {
  variant: 'default',
  elevation: 'md',
  border: true,
  hover: false,
  padding: true,
  headerPadding: true,
  footerPadding: true,
  clickable: false,
  loading: false,
  selected: false,
  disabled: false,
  as: 'div',
};

// ✅ ASIGNACIÓN DE SUBCOMPONENTES
Card.Stat = CardStat;
Card.Action = CardAction;
Card.Product = CardProduct;
Card.List = CardList;
Card.Section = CardSection;
Card.LoadingSkeleton = CardLoadingSkeleton;

export default Card;