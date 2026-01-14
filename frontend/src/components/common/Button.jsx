import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import "../../assets/styles/global.css";

// ✅ CONSTANTES PARA VALORES PREDETERMINADOS
const BUTTON_VARIANTS = [
  'primary', 'secondary', 'danger', 'success', 'warning',
  'outline-primary', 'outline-secondary', 'outline-danger', 'outline-success', 'outline-warning',
  'ghost', 'link'
];

const BUTTON_SIZES = ['small', 'medium', 'large'];
const BUTTON_TYPES = ['button', 'submit', 'reset'];
const ROUNDED_OPTIONS = ['default', 'none', 'full', 'pill'];
const ICON_POSITIONS = ['left', 'right'];

// ✅ COMPONENTE BUTTON PRINCIPAL
const Button = forwardRef(({
  // ✅ CONTENIDO
  children,
  
  // ✅ TIPO Y ACCIÓN
  type = 'button',
  onClick,
  href,
  target,
  rel,
  
  // ✅ ESTILO Y VARIANTE
  variant = 'primary',
  size = 'medium',
  rounded = 'default',
  fullWidth = false,
  
  // ✅ ESTADOS
  disabled = false,
  loading = false,
  loadingText,
  
  // ✅ ICONOS
  icon,
  iconPosition = 'left',
  iconOnly = false,
  
  // ✅ ACCESIBILIDAD
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'aria-pressed': ariaPressed,
  'aria-expanded': ariaExpanded,
  
  // ✅ EVENTOS
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  
  // ✅ CLASES Y ESTILOS
  className = '',
  
  // ✅ OTRAS PROPS
  ...props
}, ref) => {
  // ✅ ESTADO LOCAL PARA MANEJO DE HOVER/FOCUS
  const [state, setState] = useState({
    isHovered: false,
    isFocused: false
  });
  
  // ✅ DETERMINAR SI ES ENLACE O BOTÓN
  const isLink = Boolean(href);
  const Tag = isLink ? 'a' : 'button';
  
  // ✅ SISTEMA DE CLASES CSS
  const buttonClasses = useMemo(() => {
    // Validar variante
    const validVariant = BUTTON_VARIANTS.includes(variant) ? variant : 'primary';
    const validSize = BUTTON_SIZES.includes(size) ? size : 'medium';
    const validRounded = ROUNDED_OPTIONS.includes(rounded) ? rounded : 'default';
    
    // Determinar el tipo de variante
    const isOutline = validVariant.startsWith('outline-');
    const isGhost = validVariant === 'ghost';
    const isLinkVariant = validVariant === 'link';
    
    // Extraer el tipo base
    const baseVariant = isOutline ? validVariant.replace('outline-', '') : validVariant;
    
    return clsx(
      'button',
      `button-${baseVariant}`,
      `button-size-${validSize}`,
      {
        // Variantes especiales
        'button-outline': isOutline,
        'button-ghost': isGhost,
        'button-link': isLinkVariant,
        
        // Estados
        'button-disabled': disabled || loading,
        'button-loading': loading,
        'button-full-width': fullWidth,
        'button-icon-only': iconOnly,
        
        // Bordes redondeados
        'button-rounded-none': validRounded === 'none',
        'button-rounded-full': validRounded === 'full',
        'button-rounded-pill': validRounded === 'pill',
        'button-rounded-default': validRounded === 'default',
        
        // Estados interactivos
        'button-hovered': state.isHovered && !disabled && !loading,
        'button-focused': state.isFocused && !disabled && !loading,
        
        // Tipos específicos
        'button-is-link': isLink,
      },
      className
    );
  }, [
    variant, size, disabled, loading, fullWidth, 
    iconOnly, rounded, state.isHovered, state.isFocused, 
    isLink, className
  ]);
  
  // ✅ RENDERIZADO DE ICONOS
  const renderIcon = useMemo(() => {
    if (!icon) return null;

    if (typeof icon === 'string') {
      const emojiPattern = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}]/u;
      const isEmoji = emojiPattern.test(icon);

      if (isEmoji) {
        return <span className="button-icon-emoji" aria-hidden="true">{icon}</span>;
      }

      if (icon.includes(' ')) {
        return <i className={clsx('button-icon', icon)} aria-hidden="true" />;
      }

      return <span className="button-icon-text" aria-hidden="true">{icon}</span>;
    }

    if (React.isValidElement(icon)) {
      return React.cloneElement(icon, {
        className: clsx('button-icon', icon.props?.className),
        'aria-hidden': 'true'
      });
    }

    return null;
  }, [icon]);
  
  // ✅ CONTENIDO DEL BOTÓN CON LOADING STATES
  const buttonContent = useMemo(() => {
    // Si está en estado loading
    if (loading) {
      if (loadingText) {
        return (
          <span className="button-content-wrapper">
            <span className="button-loading-spinner" aria-hidden="true" />
            <span className="button-text">{loadingText}</span>
          </span>
        );
      }
      
      return (
        <span className="button-content-wrapper">
          <span className="button-loading-spinner" aria-hidden="true" />
          {children && (
            <span className="button-text button-text-hidden">
              {children}
            </span>
          )}
        </span>
      );
    }
    
    // Botón solo con icono (iconOnly)
    if (iconOnly && icon) {
      return (
        <>
          {renderIcon}
          {children && (
            <span className="button-sr-only">{children}</span>
          )}
        </>
      );
    }
    
    // Botón con icono y texto
    if (icon && children) {
      return (
        <span className="button-content-wrapper">
          {iconPosition === 'left' && renderIcon}
          <span className="button-text">
            {children}
          </span>
          {iconPosition === 'right' && renderIcon}
        </span>
      );
    }
    
    // Botón solo con texto
    if (children) {
      return <span className="button-text">{children}</span>;
    }
    
    // Botón solo con icono (sin children)
    if (icon) {
      return renderIcon;
    }
    
    return null;
  }, [loading, loadingText, children, iconOnly, icon, iconPosition, renderIcon]);
  
  // ✅ MANEJO DE EVENTES
  const handleClick = useCallback((event) => {
    if (disabled || loading) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    
    if (onClick) {
      onClick(event);
    }
  }, [disabled, loading, onClick]);
  
  const handleMouseEnter = useCallback((event) => {
    if (!disabled && !loading) {
      setState(prev => ({ ...prev, isHovered: true }));
      if (onMouseEnter) onMouseEnter(event);
    }
  }, [disabled, loading, onMouseEnter]);
  
  const handleMouseLeave = useCallback((event) => {
    setState(prev => ({ ...prev, isHovered: false }));
    if (onMouseLeave) onMouseLeave(event);
  }, [onMouseLeave]);
  
  const handleFocus = useCallback((event) => {
    if (!disabled && !loading) {
      setState(prev => ({ ...prev, isFocused: true }));
      if (onFocus) onFocus(event);
    }
  }, [disabled, loading, onFocus]);
  
  const handleBlur = useCallback((event) => {
    setState(prev => ({ ...prev, isFocused: false }));
    if (onBlur) onBlur(event);
  }, [onBlur]);
  
  // ✅ PROPS COMUNES PARA BOTÓN Y ENLACE
  const commonProps = {
    ref,
    className: buttonClasses,
    'aria-label': ariaLabel || (iconOnly && children ? String(children) : undefined),
    'aria-describedby': ariaDescribedBy,
    'aria-pressed': ariaPressed,
    'aria-expanded': ariaExpanded,
    'aria-disabled': disabled || loading ? 'true' : undefined,
    'aria-busy': loading ? 'true' : undefined,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onClick: handleClick,
    tabIndex: disabled || loading ? -1 : 0,
    ...props
  };
  
  // ✅ PROPS ESPECÍFICAS SEGÚN EL TIPO
  const specificProps = isLink ? {
    href: disabled || loading ? undefined : href,
    target: target,
    rel: rel || (target === '_blank' ? 'noopener noreferrer' : undefined),
    role: 'button',
    'data-is-link': 'true'
  } : {
    type: type,
    disabled: disabled || loading,
    'data-is-button': 'true'
  };
  
  return (
    <Tag {...commonProps} {...specificProps}>
      {buttonContent}
    </Tag>
  );
});

Button.propTypes = {
  children: PropTypes.node,
  type: PropTypes.oneOf(BUTTON_TYPES),
  onClick: PropTypes.func,
  href: PropTypes.string,
  target: PropTypes.oneOf(['_self', '_blank', '_parent', '_top']),
  rel: PropTypes.string,
  variant: PropTypes.oneOf(BUTTON_VARIANTS),
  size: PropTypes.oneOf(BUTTON_SIZES),
  rounded: PropTypes.oneOf(ROUNDED_OPTIONS),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  loadingText: PropTypes.string,
  icon: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.element,
    PropTypes.string
  ]),
  iconPosition: PropTypes.oneOf(ICON_POSITIONS),
  iconOnly: PropTypes.bool,
  'aria-label': PropTypes.string,
  'aria-describedby': PropTypes.string,
  'aria-pressed': PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  'aria-expanded': PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  className: PropTypes.string,
  style: PropTypes.object
};

Button.defaultProps = {
  type: 'button',
  variant: 'primary',
  size: 'medium',
  rounded: 'default',
  fullWidth: false,
  disabled: false,
  loading: false,
  iconPosition: 'left',
  iconOnly: false,
  className: ''
};

Button.displayName = 'Button';

// ✅ COMPONENTE BUTTONGROUP
const ButtonGroup = forwardRef(({
  children,
  className = '',
  vertical = false,
  attached = false,
  size,
  legend,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  role = 'group',
  ...props
}, ref) => {
  const childrenArray = React.Children.toArray(children).filter(
    child => React.isValidElement(child) && child.type === Button
  );
  
  const groupClasses = useMemo(() => clsx(
    'button-group',
    vertical ? 'button-group-vertical' : 'button-group-horizontal',
    attached && 'button-group-attached',
    size && BUTTON_SIZES.includes(size) && `button-group-size-${size}`,
    className
  ), [vertical, attached, size, className]);
  
  const getButtonClasses = useCallback((index, childClassName) => {
    return clsx(
      childClassName,
      'button-group-item',
      {
        'button-group-first': attached && index === 0,
        'button-group-middle': attached && index > 0 && index < childrenArray.length - 1,
        'button-group-last': attached && index === childrenArray.length - 1
      }
    );
  }, [attached, childrenArray.length]);
  
  if (childrenArray.length === 0) {
    return null;
  }
  
  return (
    <div
      ref={ref}
      className={groupClasses}
      role={role}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      {...props}
    >
      {legend && (
        <legend className="button-group-legend">{legend}</legend>
      )}
      
      <div className="button-group-container">
        {childrenArray.map((child, index) => {
          return React.cloneElement(child, {
            className: getButtonClasses(index, child.props.className),
            key: child.key || `button-group-item-${index}`,
            size: child.props.size || size,
            rounded: attached ? 'none' : child.props.rounded || 'default'
          });
        })}
      </div>
    </div>
  );
});

ButtonGroup.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  vertical: PropTypes.bool,
  attached: PropTypes.bool,
  size: PropTypes.oneOf(BUTTON_SIZES),
  legend: PropTypes.string,
  'aria-label': PropTypes.string,
  'aria-labelledby': PropTypes.string,
  role: PropTypes.string
};

ButtonGroup.defaultProps = {
  vertical: false,
  attached: false,
  role: 'group'
};

ButtonGroup.displayName = 'ButtonGroup';

// ✅ COMPONENTE ICONBUTTON
const IconButton = forwardRef(({
  icon,
  'aria-label': ariaLabel,
  children,
  size = 'medium',
  variant = 'ghost',
  ...props
}, ref) => {
  const buttonAriaLabel = useMemo(() => {
    if (ariaLabel) return ariaLabel;
    if (children) return String(children);
    if (typeof icon === 'string') return `Botón: ${icon}`;
    return 'Botón con icono';
  }, [ariaLabel, children, icon]);
  
  return (
    <Button
      ref={ref}
      icon={icon}
      iconOnly
      size={BUTTON_SIZES.includes(size) ? size : 'medium'}
      variant={BUTTON_VARIANTS.includes(variant) ? variant : 'ghost'}
      aria-label={buttonAriaLabel}
      {...props}
    >
      {children}
    </Button>
  );
});

IconButton.propTypes = {
  icon: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.element,
    PropTypes.string
  ]).isRequired,
  'aria-label': PropTypes.string,
  children: PropTypes.node,
  size: PropTypes.oneOf(BUTTON_SIZES),
  variant: PropTypes.oneOf(BUTTON_VARIANTS)
};

IconButton.defaultProps = {
  size: 'medium',
  variant: 'ghost'
};

IconButton.displayName = 'IconButton';

// ✅ COMPONENTE LOADINGBUTTON
const LoadingButton = forwardRef(({
  loading,
  loadingText = 'Cargando...',
  children,
  disabledWhenLoading = true,
  disabled,
  ...props
}, ref) => {
  return (
    <Button
      ref={ref}
      loading={loading}
      loadingText={loadingText}
      disabled={disabledWhenLoading ? (loading || disabled) : disabled}
      {...props}
    >
      {children}
    </Button>
  );
});

LoadingButton.propTypes = {
  loading: PropTypes.bool.isRequired,
  loadingText: PropTypes.string,
  disabledWhenLoading: PropTypes.bool,
  disabled: PropTypes.bool,
  children: PropTypes.node
};

LoadingButton.defaultProps = {
  loadingText: 'Cargando...',
  disabledWhenLoading: true
};

LoadingButton.displayName = 'LoadingButton';

// ✅ ASIGNAR COMPONENTES AL BOTÓN PRINCIPAL
Button.Group = ButtonGroup;
Button.Icon = IconButton;
Button.Loading = LoadingButton;

export default Button;