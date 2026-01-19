import React, { useEffect } from 'react';
import '../../assets/styles/layout/layout.css';

const Drawer = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  size = 'md',
  footer,
  showCloseButton = true,
  backdrop = true,
  closeOnBackdrop = true,
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

  const drawerClass = `
    drawer 
    drawer-${position} 
    drawer-${size} 
    ${className}
  `.trim();

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target.classList.contains('drawer-backdrop')) {
      onClose();
    }
  };

  return (
    <div 
      className={`drawer-backdrop ${backdrop ? 'drawer-backdrop-dark' : ''}`}
      onClick={handleBackdropClick}
    >
      <div className={drawerClass} style={style} role="dialog" aria-modal="true">
        <div className="drawer-header">
          {title && <h2 className="drawer-title">{title}</h2>}
          
          {showCloseButton && (
            <button 
              className="drawer-close"
              onClick={onClose}
              aria-label="Cerrar drawer"
            >
              ×
            </button>
          )}
        </div>
        
        <div className="drawer-body">
          {children}
        </div>
        
        {footer && (
          <div className="drawer-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Drawer;