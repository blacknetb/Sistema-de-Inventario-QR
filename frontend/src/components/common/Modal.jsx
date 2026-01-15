/**
 * Modal.js
 * Componente de modal reutilizable
 * Ubicación: E:\portafolio de desarrollo web\app web\proyectos basicos\inventarios basicos\frontend\src\components\common\Modal.js
 */

import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import '../../assets/styles/common/modals.css';

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'medium',
    showCloseButton = true,
    showHeader = true,
    showFooter = true,
    footerContent,
    onConfirm,
    onCancel,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    confirmVariant = 'primary',
    cancelVariant = 'secondary',
    isLoading = false,
    disableConfirm = false,
    disableCancel = false,
    closeOnOverlayClick = true,
    closeOnEsc = true,
    className = '',
    ...props
}) => {
    const modalRef = useRef(null);

    // Manejar tecla Escape
    useEffect(() => {
        const handleEscape = (event) => {
            if (closeOnEsc && event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen && closeOnEsc) {
            document.addEventListener('keydown', handleEscape);
            // Prevenir scroll del body
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, closeOnEsc, onClose]);

    // Enfocar en el modal cuando se abre
    useEffect(() => {
        if (isOpen && modalRef.current) {
            modalRef.current.focus();
        }
    }, [isOpen]);

    // Manejar clic en overlay
    const handleOverlayClick = (event) => {
        if (closeOnOverlayClick && event.target === event.currentTarget) {
            onClose();
        }
    };

    // Si el modal no está abierto, no renderizar nada
    if (!isOpen) return null;

    // Determinar clases CSS
    const modalClasses = [
        'modal',
        `modal-${size}`,
        className
    ].filter(Boolean).join(' ');

    const modalContent = (
        <div 
            className="modal-overlay"
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
        >
            <div 
                ref={modalRef}
                className={modalClasses}
                tabIndex="-1"
                {...props}
            >
                {/* Encabezado del modal */}
                {showHeader && (
                    <div className="modal-header">
                        {title && (
                            <h2 id="modal-title" className="modal-title">
                                {title}
                            </h2>
                        )}
                        {showCloseButton && (
                            <button
                                className="modal-close"
                                onClick={onClose}
                                aria-label="Cerrar modal"
                                disabled={isLoading}
                            >
                                ×
                            </button>
                        )}
                    </div>
                )}

                {/* Cuerpo del modal */}
                <div className="modal-body">
                    {children}
                </div>

                {/* Pie del modal */}
                {showFooter && (
                    <div className="modal-footer">
                        {footerContent ? (
                            footerContent
                        ) : (
                            <>
                                {onCancel && (
                                    <button
                                        className={`btn btn-${cancelVariant}`}
                                        onClick={onCancel}
                                        disabled={isLoading || disableCancel}
                                    >
                                        {cancelText}
                                    </button>
                                )}
                                {onConfirm && (
                                    <button
                                        className={`btn btn-${confirmVariant}`}
                                        onClick={onConfirm}
                                        disabled={isLoading || disableConfirm}
                                    >
                                        {isLoading ? (
                                            <>
                                                <span className="btn-spinner"></span>
                                                Procesando...
                                            </>
                                        ) : (
                                            confirmText
                                        )}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    // Renderizar en portal
    return ReactDOM.createPortal(
        modalContent,
        document.getElementById('modal-root') || document.body
    );
};

// Modal de confirmación
export const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirmar Acción",
    message,
    confirmText = "Sí, Continuar",
    cancelText = "Cancelar",
    type = "warning",
    ...props
}) => {
    const getIcon = () => {
        switch (type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'info': return 'ℹ️';
            case 'warning': return '⚠️';
            default: return '❓';
        }
    };

    const getConfirmVariant = () => {
        switch (type) {
            case 'success': return 'success';
            case 'error': return 'danger';
            case 'info': return 'info';
            case 'warning': return 'warning';
            default: return 'primary';
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            onConfirm={onConfirm}
            onCancel={onClose}
            confirmText={confirmText}
            cancelText={cancelText}
            confirmVariant={getConfirmVariant()}
            size="small"
            {...props}
        >
            <div className="confirm-modal-content">
                <div className="confirm-icon">{getIcon()}</div>
                <div className="confirm-message">
                    {message || '¿Estás seguro de realizar esta acción?'}
                </div>
            </div>
        </Modal>
    );
};

// Modal de alerta
export const AlertModal = ({
    isOpen,
    onClose,
    title = "Alerta",
    message,
    type = "info",
    buttonText = "Aceptar",
    ...props
}) => {
    const getIcon = () => {
        switch (type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'info': return 'ℹ️';
            case 'warning': return '⚠️';
            default: return '❓';
        }
    };

    const getButtonVariant = () => {
        switch (type) {
            case 'success': return 'success';
            case 'error': return 'danger';
            case 'info': return 'info';
            case 'warning': return 'warning';
            default: return 'primary';
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            onConfirm={onClose}
            confirmText={buttonText}
            confirmVariant={getButtonVariant()}
            showCancel={false}
            size="small"
            {...props}
        >
            <div className="alert-modal-content">
                <div className="alert-icon">{getIcon()}</div>
                <div className="alert-message">{message}</div>
            </div>
        </Modal>
    );
};

// Modal de formulario
export const FormModal = ({
    isOpen,
    onClose,
    title,
    onSubmit,
    submitText = "Guardar",
    cancelText = "Cancelar",
    children,
    initialValues,
    validationSchema,
    ...props
}) => {
    const handleSubmit = (event) => {
        event.preventDefault();
        if (onSubmit) {
            onSubmit(new FormData(event.target));
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            onConfirm={(e) => {
                e.preventDefault();
                const form = document.getElementById('modal-form');
                form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            }}
            onCancel={onClose}
            confirmText={submitText}
            cancelText={cancelText}
            showFooter={true}
            {...props}
        >
            <form id="modal-form" onSubmit={handleSubmit} className="modal-form">
                {children}
            </form>
        </Modal>
    );
};

export default Modal;