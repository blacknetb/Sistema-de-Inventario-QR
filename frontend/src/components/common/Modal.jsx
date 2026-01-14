import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import "../../assets/styles/global.css";

/**
 * ✅ COMPONENTE MODAL COMPLETAMENTE CORREGIDO
 */

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  actions,
  className,
  overlayClassName,
  contentClassName,
  preventClose = false,
  loading = false,
  maxHeight = '90vh',
  scrollable = true,
  centered = true,
  animation = 'fade',
  fullScreenOnMobile = false,
  disableScrollLock = false,
  initialFocusRef,
  ...props
}) => {
  const modalRef = useRef(null);
  const overlayRef = useRef(null);
  const previousFocusRef = useRef(null);
  const scrollYRef = useRef(0);

  // ✅ MANEJAR SCROLL LOCK
  useEffect(() => {
    if (isOpen && !disableScrollLock) {
      scrollYRef.current = window.scrollY;
      
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalTop = document.body.style.top;
      const originalWidth = document.body.style.width;
      
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.width = '100%';
      
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.top = originalTop;
        document.body.style.width = originalWidth;
        
        window.scrollTo(0, scrollYRef.current);
      };
    }
  }, [isOpen, disableScrollLock]);

  // ✅ GUARDAR FOCO PREVIO
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
    }
  }, [isOpen]);

  // ✅ RESTAURAR FOCO AL CERRAR
  useEffect(() => {
    return () => {
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        try {
          previousFocusRef.current.focus();
        } catch (error) {
          console.warn('No se pudo restaurar el foco:', error);
        }
      }
    };
  }, []);

  // ✅ MANEJAR TECLADO (ESCAPE)
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && closeOnEsc && !preventClose && isOpen) {
        e.preventDefault();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, closeOnEsc, preventClose, onClose]);

  // ✅ TRAP DE FOCO
  useEffect(() => {
    if (!isOpen) return;

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  // ✅ FOCO INICIAL
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const timer = setTimeout(() => {
        if (initialFocusRef?.current) {
          initialFocusRef.current.focus();
        } else {
          const focusableElements = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          } else {
            modalRef.current.focus();
          }
        }
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialFocusRef]);

  // ✅ MANEJAR CLICK EN OVERLAY
  const handleOverlayClick = useCallback((e) => {
    if (
      closeOnOverlayClick && 
      !preventClose && 
      overlayRef.current && 
      e.target === overlayRef.current
    ) {
      onClose();
    }
  }, [closeOnOverlayClick, preventClose, onClose]);

  // ✅ NO RENDERIZAR SI NO ESTÁ ABIERTO
  if (!isOpen) return null;

  // ✅ CLASES CSS
  const modalClasses = clsx(
    "modal",
    `modal-size-${size}`,
    `modal-animation-${animation}`,
    centered && "modal-centered",
    fullScreenOnMobile && "modal-fullscreen-mobile",
    className
  );

  const overlayClasses = clsx(
    "modal-overlay",
    `modal-animation-${animation}`,
    overlayClassName
  );

  const contentClasses = clsx(
    "modal-content",
    contentClassName
  );

  // ✅ CONTENIDO DEL MODAL
  const modalContent = (
    <div
      className={overlayClasses}
      ref={overlayRef}
      onClick={handleOverlayClick}
      aria-modal="true"
      aria-hidden={!isOpen}
      data-testid="modal-overlay"
    >
      <div 
        className={modalClasses}
        style={{ '--modal-max-height': maxHeight }}
      >
        <div
          ref={modalRef}
          className={contentClasses}
          style={{
            maxHeight: scrollable ? maxHeight : 'auto',
            overflow: scrollable ? 'auto' : 'visible'
          }}
          tabIndex={-1}
          {...props}
        >
          {/* HEADER */}
          {(title || showCloseButton) && (
            <div className="modal-header">
              <div className="modal-header-content">
                {title && (
                  <h2 
                    id="modal-title" 
                    className="modal-title"
                  >
                    {title}
                  </h2>
                )}
                
                {showCloseButton && !preventClose && (
                  <button
                    onClick={onClose}
                    className="modal-close-button"
                    disabled={loading}
                    aria-label="Cerrar modal"
                    data-testid="modal-close-button"
                    type="button"
                  >
                    <svg 
                      className="modal-close-icon" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M6 18L18 6M6 6l12 12" 
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* BODY */}
          <div 
            className={clsx(
              'modal-body',
              scrollable && 'modal-body-scrollable'
            )} 
            style={{ 
              maxHeight: scrollable ? `calc(${maxHeight} - 200px)` : 'auto',
              overflow: scrollable ? 'auto' : 'visible'
            }}
          >
            {loading ? (
              <div className="modal-loading">
                <div className="modal-loading-spinner"></div>
                <span className="modal-loading-text">Cargando...</span>
              </div>
            ) : (
              children
            )}
          </div>

          {/* FOOTER */}
          {actions && (
            <div className="modal-footer">
              <div className="modal-actions">
                {actions}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.node,
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', '2xl', 'full']),
  showCloseButton: PropTypes.bool,
  closeOnOverlayClick: PropTypes.bool,
  closeOnEsc: PropTypes.bool,
  actions: PropTypes.node,
  className: PropTypes.string,
  overlayClassName: PropTypes.string,
  contentClassName: PropTypes.string,
  preventClose: PropTypes.bool,
  loading: PropTypes.bool,
  maxHeight: PropTypes.string,
  scrollable: PropTypes.bool,
  centered: PropTypes.bool,
  animation: PropTypes.oneOf(['fade', 'slide-up', 'slide-down', 'scale', 'none']),
  fullScreenOnMobile: PropTypes.bool,
  disableScrollLock: PropTypes.bool,
  initialFocusRef: PropTypes.shape({ 
    current: PropTypes.instanceOf(Element) 
  })
};

// ✅ COMPONENTE DE ACCIONES
const ModalActions = React.memo(({
  onCancel,
  onConfirm,
  cancelText = 'Cancelar',
  confirmText = 'Confirmar',
  confirmVariant = 'primary',
  loading = false,
  cancelLoading = false,
  disableCancel = false,
  disableConfirm = false,
  extraButtons = [],
  reverseOnMobile = false,
  className,
  ...props
}) => {
  const actionsClasses = clsx(
    "modal-actions-container",
    reverseOnMobile && "modal-actions-reverse",
    className
  );

  const handleCancel = useCallback((e) => {
    e.preventDefault();
    if (onCancel && !cancelLoading && !disableCancel) {
      onCancel();
    }
  }, [onCancel, cancelLoading, disableCancel]);

  const handleConfirm = useCallback((e) => {
    e.preventDefault();
    if (onConfirm && !loading && !disableConfirm) {
      onConfirm();
    }
  }, [onConfirm, loading, disableConfirm]);

  return (
    <div 
      className={actionsClasses}
      {...props}
    >
      {onCancel && (
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading || cancelLoading || disableCancel}
          className="modal-action-button modal-action-button-secondary"
          aria-label={cancelText}
        >
          {cancelLoading ? (
            <>
              <span className="modal-action-button-spinner" aria-hidden="true"></span>
              {cancelText}
            </>
          ) : cancelText}
        </button>
      )}
      
      {onConfirm && (
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading || disableConfirm || cancelLoading}
          className={clsx(
            "modal-action-button",
            `modal-action-button-${confirmVariant}`
          )}
          aria-label={confirmText}
        >
          {loading ? (
            <>
              <span className="modal-action-button-spinner" aria-hidden="true"></span>
              {confirmText}
            </>
          ) : confirmText}
        </button>
      )}
      
      {extraButtons.map((button, index) => (
        <button
          key={`extra-button-${index}`}
          type="button"
          {...button}
          className={clsx(
            "modal-action-button",
            button.className || ''
          )}
        />
      ))}
    </div>
  );
});

ModalActions.propTypes = {
  onCancel: PropTypes.func,
  onConfirm: PropTypes.func,
  cancelText: PropTypes.string,
  confirmText: PropTypes.string,
  confirmVariant: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning']),
  loading: PropTypes.bool,
  cancelLoading: PropTypes.bool,
  disableCancel: PropTypes.bool,
  disableConfirm: PropTypes.bool,
  extraButtons: PropTypes.array,
  reverseOnMobile: PropTypes.bool,
  className: PropTypes.string
};

Modal.Actions = ModalActions;

// ✅ MODAL DE CONFIRMACIÓN
Modal.Confirm = React.memo(({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirmar acción', 
  message, 
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar',
  type = 'warning',
  loading = false,
  confirmLoading = false,
  ...props 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return (
          <svg 
            className="modal-confirm-icon modal-confirm-icon-danger" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        );
      case 'success':
        return (
          <svg 
            className="modal-confirm-icon modal-confirm-icon-success" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        );
      case 'info':
        return (
          <svg 
            className="modal-confirm-icon modal-confirm-icon-info" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        );
      default:
        return (
          <svg 
            className="modal-confirm-icon modal-confirm-icon-warning" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
      {...props}
    >
      <div className="modal-confirm">
        <div className="modal-confirm-icon-container">
          {getIcon()}
        </div>
        <div className="modal-confirm-content">
          <p className="modal-confirm-message">{message}</p>
          <div className="modal-confirm-actions">
            <Modal.Actions
              onCancel={onClose}
              onConfirm={onConfirm}
              confirmText={confirmText}
              cancelText={cancelText}
              confirmVariant={type}
              loading={confirmLoading || loading}
              reverseOnMobile={true}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
});

Modal.Confirm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.node.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  type: PropTypes.oneOf(['warning', 'danger', 'success', 'info', 'primary']),
  loading: PropTypes.bool,
  confirmLoading: PropTypes.bool
};

// ✅ MODAL DE ALERTA
Modal.Alert = React.memo(({
  isOpen,
  onClose,
  title = 'Información',
  message,
  type = 'info',
  confirmText = 'Aceptar',
  ...props
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'danger':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      showCloseButton={false}
      {...props}
    >
      <div className="modal-alert">
        <div className="modal-alert-icon" aria-hidden="true">
          {getIcon()}
        </div>
        <div className="modal-alert-content">
          <p className="modal-alert-message">{message}</p>
          <div className="modal-alert-actions">
            <button
              onClick={onClose}
              className="modal-action-button modal-action-button-primary"
              type="button"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
});

Modal.Alert.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.node.isRequired,
  type: PropTypes.oneOf(['info', 'success', 'warning', 'danger']),
  confirmText: PropTypes.string
};

// ✅ VALORES POR DEFECTO
Modal.defaultProps = {
  size: 'md',
  showCloseButton: true,
  closeOnOverlayClick: true,
  closeOnEsc: true,
  preventClose: false,
  loading: false,
  maxHeight: '90vh',
  scrollable: true,
  centered: true,
  animation: 'fade',
  fullScreenOnMobile: false,
  disableScrollLock: false
};

export default Modal;