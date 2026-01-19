import React, { useEffect, useState } from 'react';
import '../../assets/styles/layout/layout.css';

const Alert = ({
  type = 'info',
  message,
  title,
  onClose,
  autoClose = false,
  duration = 5000,
  showIcon = true,
  showCloseButton = true,
  className = '',
  style = {}
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose && isVisible) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      setTimeout(onClose, 300); // Esperar a que termine la animación
    }
  };

  if (!isVisible) return null;

  const alertClass = `
    alert 
    alert-${type} 
    ${className}
  `.trim();

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  return (
    <div 
      className={alertClass} 
      style={style}
      role="alert"
    >
      <div className="alert-content">
        {showIcon && (
          <span className="alert-icon">{getIcon()}</span>
        )}
        
        <div className="alert-text">
          {title && <div className="alert-title">{title}</div>}
          <div className="alert-message">{message}</div>
        </div>
      </div>
      
      {showCloseButton && (
        <button 
          className="alert-close"
          onClick={handleClose}
          aria-label="Cerrar alerta"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default Alert;