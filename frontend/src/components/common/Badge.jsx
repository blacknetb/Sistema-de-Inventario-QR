import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import "../../assets/styles/global.css";

const BADGE_VARIANTS = ['primary', 'secondary', 'success', 'warning', 'error', 'info', 'light', 'dark', 'outline'];
const BADGE_SIZES = ['xs', 'sm', 'md', 'lg', 'xl'];
const BADGE_SHAPES = ['square', 'rounded', 'pill', 'circle'];

const BADGE_VARIANT_CLASSES = {
  primary: 'badge-variant-primary',
  secondary: 'badge-variant-secondary',
  success: 'badge-variant-success',
  warning: 'badge-variant-warning',
  error: 'badge-variant-error',
  info: 'badge-variant-info',
  light: 'badge-variant-light',
  dark: 'badge-variant-dark',
  outline: 'badge-variant-outline'
};

const BADGE_SIZE_CLASSES = {
  xs: 'badge-size-xs',
  sm: 'badge-size-sm',
  md: 'badge-size-md',
  lg: 'badge-size-lg',
  xl: 'badge-size-xl'
};

const BADGE_SHAPE_CLASSES = {
  square: 'badge-shape-square',
  rounded: 'badge-shape-rounded',
  pill: 'badge-shape-pill',
  circle: 'badge-shape-circle'
};

const Badge = React.forwardRef(({
  variant = 'primary',
  size = 'md',
  shape = 'rounded',
  interactive = false,
  removable = false,
  onRemove = null,
  icon = null,
  iconAfter = null,
  count = null,
  maxCount = 99,
  dot = false,
  pulse = false,
  className = '',
  children,
  ...props
}, ref) => {

  const validatedProps = React.useMemo(() => {
    return {
      variant: BADGE_VARIANTS.includes(variant) ? variant : 'primary',
      size: BADGE_SIZES.includes(size) ? size : 'md',
      shape: BADGE_SHAPES.includes(shape) ? shape : 'rounded',
      interactive: Boolean(interactive),
      removable: Boolean(removable),
      dot: Boolean(dot),
      pulse: Boolean(pulse),
      count: count !== null && count !== undefined ? count : null,
      maxCount: Math.max(0, Number(maxCount) || 99)
    };
  }, [variant, size, shape, interactive, removable, dot, pulse, count, maxCount]);

  const formatCount = React.useCallback(() => {
    if (validatedProps.count === null) return null;

    const numCount = Number(validatedProps.count);
    
    if (isNaN(numCount)) {
      return validatedProps.count.toString();
    }

    if (numCount <= 0) return '0';
    
    if (numCount > validatedProps.maxCount) {
      return `${validatedProps.maxCount}+`;
    }

    return numCount.toLocaleString();
  }, [validatedProps.count, validatedProps.maxCount]);

  const handleRemove = React.useCallback((event) => {
    event.stopPropagation();
    event.preventDefault();
    
    if (onRemove && typeof onRemove === 'function') {
      onRemove(event);
    }
  }, [onRemove]);

  const badgeClasses = clsx(
    'badge',
    BADGE_VARIANT_CLASSES[validatedProps.variant] || BADGE_VARIANT_CLASSES.primary,
    BADGE_SIZE_CLASSES[validatedProps.size] || BADGE_SIZE_CLASSES.md,
    BADGE_SHAPE_CLASSES[validatedProps.shape] || BADGE_SHAPE_CLASSES.rounded,
    {
      'badge-interactive': validatedProps.interactive,
      'badge-removable': validatedProps.removable,
      'badge-dot': validatedProps.dot,
      'badge-pulse': validatedProps.pulse,
      'badge-has-icon': !!icon,
      'badge-has-icon-after': !!iconAfter,
      'badge-has-count': validatedProps.count !== null && !validatedProps.dot,
      'badge-empty': !children && validatedProps.count === null && !validatedProps.dot
    },
    className
  );

  const renderContent = React.useMemo(() => {
    if (validatedProps.dot) {
      return null;
    }

    if (validatedProps.count !== null) {
      const formatted = formatCount();
      return formatted !== null ? formatted : '0';
    }

    return children;
  }, [validatedProps.dot, validatedProps.count, formatCount, children]);

  const renderIcon = React.useCallback((iconToRender, position = 'before') => {
    if (!iconToRender) return null;

    if (typeof iconToRender === 'string') {
      return (
        <span className={`badge-icon badge-icon-${position}`} aria-hidden="true">
          {iconToRender}
        </span>
      );
    }

    if (React.isValidElement(iconToRender)) {
      return React.cloneElement(iconToRender, {
        className: clsx(`badge-icon badge-icon-${position}`, iconToRender.props?.className),
        'aria-hidden': 'true'
      });
    }

    return null;
  }, []);

  const getAriaLabel = React.useMemo(() => {
    if (props['aria-label']) return props['aria-label'];
    
    if (validatedProps.dot) return 'Badge indicador';
    
    if (validatedProps.count !== null) {
      return `Badge con ${formatCount()} elementos`;
    }
    
    if (typeof children === 'string') return children;
    
    return 'Badge';
  }, [props['aria-label'], validatedProps.dot, validatedProps.count, formatCount, children]);

  return (
    <div
      ref={ref}
      className={badgeClasses}
      role={validatedProps.interactive ? 'button' : 'status'}
      tabIndex={validatedProps.interactive ? 0 : -1}
      aria-label={getAriaLabel}
      aria-disabled={validatedProps.interactive ? 'false' : undefined}
      {...props}
    >
      {renderIcon(icon, 'before')}

      <span className="badge-content">
        {renderContent}
      </span>

      {renderIcon(iconAfter, 'after')}

      {validatedProps.removable && (
        <button
          type="button"
          className="badge-remove-button"
          onClick={handleRemove}
          aria-label="Remover badge"
          tabIndex={validatedProps.interactive ? 0 : -1}
          disabled={!onRemove}
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </div>
  );
});

Badge.displayName = 'Badge';

Badge.propTypes = {
  variant: PropTypes.oneOf(BADGE_VARIANTS),
  size: PropTypes.oneOf(BADGE_SIZES),
  shape: PropTypes.oneOf(BADGE_SHAPES),
  interactive: PropTypes.bool,
  removable: PropTypes.bool,
  onRemove: PropTypes.func,
  icon: PropTypes.node,
  iconAfter: PropTypes.node,
  count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  maxCount: PropTypes.number,
  dot: PropTypes.bool,
  pulse: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
  'aria-label': PropTypes.string
};

Badge.defaultProps = {
  variant: 'primary',
  size: 'md',
  shape: 'rounded',
  interactive: false,
  removable: false,
  onRemove: null,
  icon: null,
  iconAfter: null,
  count: null,
  maxCount: 99,
  dot: false,
  pulse: false,
  className: ''
};

export const StatusBadge = ({ status = "active", children, ...props }) => {
  const statusConfig = {
    active: { variant: "success", label: "Activo" },
    inactive: { variant: "secondary", label: "Inactivo" },
    pending: { variant: "warning", label: "Pendiente" },
    approved: { variant: "success", label: "Aprobado" },
    rejected: { variant: "error", label: "Rechazado" },
    draft: { variant: "light", label: "Borrador" },
    archived: { variant: "dark", label: "Archivado" },
  };

  const config = statusConfig[status] || statusConfig.active;

  return (
    <Badge
      variant={config.variant}
      aria-label={`Estado: ${config.label}`}
      role="status"
      {...props}
    >
      {children || config.label}
    </Badge>
  );
};

StatusBadge.propTypes = {
  status: PropTypes.oneOf([
    "active",
    "inactive",
    "pending",
    "approved",
    "rejected",
    "draft",
    "archived",
  ]),
  children: PropTypes.node,
};

StatusBadge.defaultProps = {
  status: 'active',
};

export const NotificationBadge = ({ count = 0, maxCount = 99, ...props }) => {
  const safeCount = Math.max(0, Number(count) || 0);
  const hasNotifications = safeCount > 0;

  return (
    <Badge
      variant={hasNotifications ? "error" : "secondary"}
      shape="circle"
      count={hasNotifications ? safeCount : null}
      maxCount={maxCount}
      pulse={hasNotifications}
      aria-label={hasNotifications ? `${safeCount} notificaciones` : 'Sin notificaciones'}
      role="status"
      {...props}
    />
  );
};

NotificationBadge.propTypes = {
  count: PropTypes.number,
  maxCount: PropTypes.number,
};

NotificationBadge.defaultProps = {
  count: 0,
  maxCount: 99,
};

export const InventoryBadge = ({ stock = 0, lowStockThreshold = 10, ...props }) => {
  const safeStock = Math.max(0, Number(stock) || 0);
  
  let config;
  if (safeStock === 0) {
    config = { variant: "error", label: "Agotado" };
  } else if (safeStock <= lowStockThreshold) {
    config = { variant: "warning", label: `Bajo (${safeStock})` };
  } else {
    config = { variant: "success", label: `En stock (${safeStock})` };
  }

  return (
    <Badge
      variant={config.variant}
      aria-label={`Stock: ${config.label}`}
      role="status"
      {...props}
    >
      {config.label}
    </Badge>
  );
};

InventoryBadge.propTypes = {
  stock: PropTypes.number,
  lowStockThreshold: PropTypes.number,
};

InventoryBadge.defaultProps = {
  stock: 0,
  lowStockThreshold: 10,
};

export default Badge;