import React, { useEffect } from 'react';
import '../../assets/styles/layout/layout.css';

const ModalLayout = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  position = 'center',
  showCloseButton = true,
  backdrop = true,
  closeOnBackdrop = true,
  footer,
  icon,
  className = '',
  style = {}
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalClass = `
    modal 
    modal-${size} 
    modal-${position} 
    ${className}
  `.trim();

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target.classList.contains('modal-backdrop')) {
      onClose();
    }
  };

  return (
    <div 
      className={`modal-backdrop ${backdrop ? 'modal-backdrop-dark' : ''}`}
      onClick={handleBackdropClick}
    >
      <div className={modalClass} style={style} role="dialog" aria-modal="true">
        <div className="modal-header">
          <div className="modal-header-left">
            {icon && <span className="modal-icon">{icon}</span>}
            <div className="modal-header-content">
              {title && <h2 className="modal-title">{title}</h2>}
              {subtitle && <p className="modal-subtitle">{subtitle}</p>}
            </div>
          </div>
          
          {showCloseButton && (
            <button 
              className="modal-close"
              onClick={onClose}
              aria-label="Cerrar modal"
            >
              ×
            </button>
          )}
        </div>
        
        <div className="modal-body">
          {children}
        </div>
        
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalLayout;