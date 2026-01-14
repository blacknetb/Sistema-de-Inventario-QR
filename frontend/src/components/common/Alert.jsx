import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import "../../assets/styles/global.css";

// ✅ CONSTANTES
const AUTO_DISMISS_DEFAULT = 5000;
const PROGRESS_INTERVAL = 100;
const PROGRESS_COMPLETE = 100;
const PROGRESS_START = 100;

// ✅ ICONOS POR DEFECTO
const DEFAULT_ICONS = {
  info: (
    <svg className="alert-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  ),
  success: (
    <svg className="alert-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg className="alert-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  danger: (
    <svg className="alert-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  )
};

const ALERT_TYPES = ['info', 'success', 'warning', 'danger'];
const ALERT_VARIANTS = ['default', 'solid', 'light', 'outline'];
const ALERT_SIZES = ['default', 'sm', 'lg'];
const ALERT_ROUNDED = ['none', 'sm', 'md', 'lg', 'full'];
const ALERT_ELEVATIONS = ['none', 'sm', 'md', 'lg'];

const Alert = React.forwardRef(({
  type = 'info',
  variant = 'default',
  size = 'default',
  rounded = 'md',
  border = false,
  dismissible = false,
  showIcon = true,
  autoDismiss = AUTO_DISMISS_DEFAULT,
  animate = true,
  elevation = 'none',
  title,
  children,
  action,
  actions = [],
  className = '',
  isOpen = true,
  onClose,
  icon: customIcon,
  closeLabel = 'Cerrar alerta',
  ...props
}, ref) => {
  const [isVisible, setIsVisible] = useState(isOpen);
  const [progress, setProgress] = useState(PROGRESS_START);
  const [isHovered, setIsHovered] = useState(false);
  
  const dismissTimeoutRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimers();
    };
  }, []);

  const clearTimers = useCallback(() => {
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
      dismissTimeoutRef.current = null;
    }
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const validateProps = useMemo(() => {
    const validType = ALERT_TYPES.includes(type) ? type : 'info';
    const validVariant = ALERT_VARIANTS.includes(variant) ? variant : 'default';
    const validSize = ALERT_SIZES.includes(size) ? size : 'default';
    const validRounded = ALERT_ROUNDED.includes(rounded) ? rounded : 'md';
    const validElevation = ALERT_ELEVATIONS.includes(elevation) ? elevation : 'none';
    const validAutoDismiss = typeof autoDismiss === 'number' && autoDismiss > 0 ? autoDismiss : 0;
    
    return {
      type: validType,
      variant: validVariant,
      size: validSize,
      rounded: validRounded,
      elevation: validElevation,
      autoDismiss: validAutoDismiss
    };
  }, [type, variant, size, rounded, elevation, autoDismiss]);

  const alertClasses = useMemo(() => {
    return clsx(
      'alert',
      `alert-type-${validateProps.type}`,
      `alert-variant-${validateProps.variant}`,
      `alert-size-${validateProps.size}`,
      `alert-rounded-${validateProps.rounded}`,
      {
        'alert-with-border': border,
        'alert-dismissible': dismissible,
        'alert-with-icon': showIcon,
        'alert-auto-dismiss': validateProps.autoDismiss > 0,
        'alert-visible': isVisible && animate,
        'alert-hidden': !isVisible && animate,
        'alert-elevated': validateProps.elevation !== 'none',
        'alert-has-title': !!title,
        'alert-has-actions': !!(action || actions.length > 0),
      },
      className
    );
  }, [
    validateProps, border, dismissible, showIcon, 
    isVisible, animate, title, action, actions.length, className
  ]);

  const alertIcon = useMemo(() => {
    if (customIcon) {
      if (React.isValidElement(customIcon)) {
        return React.cloneElement(customIcon, {
          className: clsx('alert-icon', customIcon.props?.className),
          'aria-hidden': 'true'
        });
      }
    }
    return DEFAULT_ICONS[validateProps.type] || DEFAULT_ICONS.info;
  }, [customIcon, validateProps.type]);

  const handleClose = useCallback((e) => {
    e?.stopPropagation();
    
    if (!mountedRef.current) return;
    
    setIsVisible(false);
    clearTimers();
    
    if (onClose && typeof onClose === 'function') {
      onClose(e);
    }
  }, [onClose, clearTimers]);

  useEffect(() => {
    if (!isVisible || !validateProps.autoDismiss || validateProps.autoDismiss <= 0) {
      clearTimers();
      return;
    }
    
    clearTimers();
    
    setProgress(PROGRESS_START);
    
    const decrement = (PROGRESS_START / (validateProps.autoDismiss / PROGRESS_INTERVAL));
    
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - decrement;
        if (newProgress <= 0) {
          clearTimers();
          return 0;
        }
        return newProgress;
      });
    }, PROGRESS_INTERVAL);
    
    dismissTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        handleClose();
      }
    }, validateProps.autoDismiss);
    
    return () => {
      clearTimers();
    };
  }, [isVisible, validateProps.autoDismiss, handleClose, clearTimers]);

  const handleMouseEnter = useCallback(() => {
    if (!validateProps.autoDismiss || validateProps.autoDismiss <= 0) return;
    setIsHovered(true);
    clearTimers();
  }, [validateProps.autoDismiss, clearTimers]);

  const handleMouseLeave = useCallback(() => {
    if (!validateProps.autoDismiss || validateProps.autoDismiss <= 0) return;
    setIsHovered(false);
    
    if (isVisible && mountedRef.current) {
      const remainingTime = (progress / PROGRESS_START) * validateProps.autoDismiss;
      
      if (remainingTime > 0) {
        dismissTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            handleClose();
          }
        }, remainingTime);
        
        const decrement = (PROGRESS_START / (remainingTime / PROGRESS_INTERVAL));
        
        progressIntervalRef.current = setInterval(() => {
          setProgress(prev => {
            const newProgress = prev - decrement;
            if (newProgress <= 0) {
              clearTimers();
              return 0;
            }
            return newProgress;
          });
        }, PROGRESS_INTERVAL);
      }
    }
  }, [validateProps.autoDismiss, isVisible, progress, handleClose, clearTimers]);

  useEffect(() => {
    if (mountedRef.current && isOpen !== isVisible) {
      setIsVisible(isOpen);
    }
  }, [isOpen, isVisible]);

  const renderCloseButton = useMemo(() => {
    if (!dismissible) return null;
    
    return (
      <button
        type="button"
        className="alert-close-button"
        onClick={handleClose}
        aria-label={closeLabel}
        tabIndex={0}
      >
        <svg className="alert-close-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    );
  }, [dismissible, handleClose, closeLabel]);

  const renderProgressBar = useMemo(() => {
    if (!validateProps.autoDismiss || validateProps.autoDismiss <= 0) return null;
    
    return (
      <div className="alert-progress-bar" aria-hidden="true">
        <div 
          className="alert-progress-fill"
          style={{ 
            width: `${progress}%`,
            transition: isHovered ? 'none' : 'width 0.1s linear'
          }}
        />
      </div>
    );
  }, [validateProps.autoDismiss, progress, isHovered]);

  const renderActions = useMemo(() => {
    const actionItems = [];
    
    if (action && React.isValidElement(action)) {
      actionItems.push(action);
    }
    
    if (actions && Array.isArray(actions)) {
      actions.forEach((actionItem) => {
        if (React.isValidElement(actionItem)) {
          actionItems.push(actionItem);
        }
      });
    }
    
    if (actionItems.length === 0) return null;
    
    return (
      <div className="alert-actions">
        {actionItems.map((actionItem, index) => (
          React.cloneElement(actionItem, {
            key: actionItem.key || `alert-action-${index}`,
            className: clsx('alert-action', actionItem.props?.className)
          })
        ))}
      </div>
    );
  }, [action, actions]);

  if (!isVisible) return null;

  return (
    <div
      ref={ref}
      className={alertClasses}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      onMouseEnter={validateProps.autoDismiss > 0 ? handleMouseEnter : undefined}
      onMouseLeave={validateProps.autoDismiss > 0 ? handleMouseLeave : undefined}
      {...props}
    >
      <div className="alert-content">
        {showIcon && (
          <div className="alert-icon-container" aria-hidden="true">
            {alertIcon}
          </div>
        )}
        
        <div className="alert-body">
          {title && (
            <h3 className="alert-title">
              {title}
            </h3>
          )}
          
          <div className="alert-message">
            {children}
          </div>
          
          {renderActions}
        </div>
        
        {renderCloseButton}
      </div>
      
      {renderProgressBar}
    </div>
  );
});

Alert.displayName = 'Alert';

Alert.propTypes = {
  type: PropTypes.oneOf(ALERT_TYPES),
  variant: PropTypes.oneOf(ALERT_VARIANTS),
  size: PropTypes.oneOf(ALERT_SIZES),
  rounded: PropTypes.oneOf(ALERT_ROUNDED),
  border: PropTypes.bool,
  dismissible: PropTypes.bool,
  showIcon: PropTypes.bool,
  autoDismiss: PropTypes.number,
  animate: PropTypes.bool,
  elevation: PropTypes.oneOf(ALERT_ELEVATIONS),
  title: PropTypes.node,
  children: PropTypes.node.isRequired,
  action: PropTypes.node,
  actions: PropTypes.arrayOf(PropTypes.node),
  className: PropTypes.string,
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  icon: PropTypes.node,
  closeLabel: PropTypes.string,
};

Alert.defaultProps = {
  type: 'info',
  variant: 'default',
  size: 'default',
  rounded: 'md',
  border: false,
  dismissible: false,
  showIcon: true,
  autoDismiss: 0,
  animate: true,
  elevation: 'none',
  isOpen: true,
  actions: [],
  closeLabel: 'Cerrar alerta',
};

const InlineAlert = React.forwardRef(({
  type = 'info',
  children,
  className = '',
  size = 'default',
  pill = false,
  ...props
}, ref) => {
  const validType = ALERT_TYPES.includes(type) ? type : 'info';
  const validSize = ALERT_SIZES.includes(size) ? size : 'default';
  
  const inlineClasses = clsx(
    'alert-inline',
    `alert-inline-type-${validType}`,
    `alert-inline-size-${validSize}`,
    pill && 'alert-inline-pill',
    className
  );

  return (
    <span
      ref={ref}
      className={inlineClasses}
      role="status"
      aria-label={`Alerta inline: ${validType}`}
      {...props}
    >
      {children}
    </span>
  );
});

InlineAlert.displayName = 'InlineAlert';

InlineAlert.propTypes = {
  type: PropTypes.oneOf(ALERT_TYPES),
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  size: PropTypes.oneOf(ALERT_SIZES),
  pill: PropTypes.bool,
};

InlineAlert.defaultProps = {
  type: 'info',
  size: 'default',
  pill: false,
};

Alert.Inline = InlineAlert;

export const useAlert = () => {
  const [alerts, setAlerts] = useState([]);
  const alertIdsRef = useRef(new Set());
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      alertIdsRef.current.clear();
    };
  }, []);

  const generateId = useCallback(() => {
    let id;
    do {
      id = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    } while (alertIdsRef.current.has(id));
    
    alertIdsRef.current.add(id);
    return id;
  }, []);

  const addAlert = useCallback((alertProps) => {
    if (!mountedRef.current) return null;
    
    if (!alertProps.children) {
      return null;
    }
    
    const id = generateId();
    const newAlert = {
      id,
      type: ALERT_TYPES.includes(alertProps.type) ? alertProps.type : 'info',
      variant: ALERT_VARIANTS.includes(alertProps.variant) ? alertProps.variant : 'default',
      size: ALERT_SIZES.includes(alertProps.size) ? alertProps.size : 'default',
      dismissible: alertProps.dismissible !== undefined ? alertProps.dismissible : true,
      autoDismiss: typeof alertProps.autoDismiss === 'number' && alertProps.autoDismiss > 0 ? alertProps.autoDismiss : 0,
      ...alertProps,
      isOpen: true,
    };
    
    setAlerts(prev => [...prev, newAlert]);
    
    if (newAlert.autoDismiss && newAlert.autoDismiss > 0) {
      setTimeout(() => {
        if (mountedRef.current) {
          removeAlert(id);
        }
      }, newAlert.autoDismiss);
    }
    
    return id;
  }, [generateId]);

  const removeAlert = useCallback((id) => {
    if (!mountedRef.current) return;
    
    setAlerts(prev => prev.filter(alert => alert.id !== id));
    alertIdsRef.current.delete(id);
  }, []);

  const clearAll = useCallback(() => {
    if (!mountedRef.current) return;
    
    setAlerts([]);
    alertIdsRef.current.clear();
  }, []);

  const success = useCallback((message, options = {}) => {
    return addAlert({
      type: 'success',
      children: message,
      ...options,
    });
  }, [addAlert]);

  const error = useCallback((message, options = {}) => {
    return addAlert({
      type: 'danger',
      children: message,
      ...options,
    });
  }, [addAlert]);

  const warning = useCallback((message, options = {}) => {
    return addAlert({
      type: 'warning',
      children: message,
      ...options,
    });
  }, [addAlert]);

  const info = useCallback((message, options = {}) => {
    return addAlert({
      type: 'info',
      children: message,
      ...options,
    });
  }, [addAlert]);

  const AlertContainer = useCallback(({ 
    position = 'top-right', 
    className = '',
    maxAlerts = 5 
  }) => {
    if (alerts.length === 0) return null;
    
    const visibleAlerts = alerts.slice(0, maxAlerts);
    
    return (
      <div className={`alert-container alert-container-${position} ${className}`}>
        {visibleAlerts.map(alert => (
          <Alert
            key={alert.id}
            {...alert}
            onClose={() => removeAlert(alert.id)}
          />
        ))}
      </div>
    );
  }, [alerts, removeAlert]);

  return {
    alerts,
    addAlert,
    removeAlert,
    clearAll,
    success,
    error,
    warning,
    info,
    AlertContainer,
  };
};

export default Alert;