import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/Common/common.css';

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'medium',
    showCloseButton = true,
    showFooter = true,
    primaryButtonText = 'Guardar',
    secondaryButtonText = 'Cancelar',
    onPrimaryClick,
    onSecondaryClick,
    isLoading = false,
    primaryButtonDisabled = false,
    primaryButtonVariant = 'primary',
    hidePrimaryButton = false,
    hideSecondaryButton = false,
    closeOnOverlayClick = true,
    closeOnEsc = true,
    className = ''
}) => {
    const modalRef = useRef(null);

    // Manejar tecla ESC
    useEffect(() => {
        const handleEsc = (event) => {
            if (closeOnEsc && event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden'; // Prevenir scroll
        }

        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, closeOnEsc, onClose]);

    // Manejar clic fuera del modal
    const handleOverlayClick = (e) => {
        if (closeOnOverlayClick && modalRef.current && !modalRef.current.contains(e.target)) {
            onClose();
        }
    };

    if (!isOpen) return null;

    const sizeClasses = {
        small: 'modal-sm',
        medium: 'modal-md',
        large: 'modal-lg',
        xlarge: 'modal-xl',
        fullscreen: 'modal-fullscreen'
    };

    const primaryButtonClasses = {
        primary: 'btn-primary',
        success: 'btn-success',
        warning: 'btn-warning',
        danger: 'btn-danger',
        info: 'btn-info'
    };

    return (
        <>
            <div className="modal-overlay" onClick={handleOverlayClick} />
            
            <div className={`modal ${sizeClasses[size]} ${className}`}>
                <div className="modal-content" ref={modalRef}>
                    {/* Header del modal */}
                    <div className="modal-header">
                        {title && <h3 className="modal-title">{title}</h3>}
                        
                        {showCloseButton && (
                            <button
                                className="modal-close"
                                onClick={onClose}
                                disabled={isLoading}
                                aria-label="Cerrar modal"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        )}
                    </div>

                    {/* Cuerpo del modal */}
                    <div className="modal-body">
                        {children}
                    </div>

                    {/* Footer del modal */}
                    {showFooter && (
                        <div className="modal-footer">
                            <div className="modal-footer-left">
                                <button
                                    className="btn btn-outline"
                                    onClick={onSecondaryClick || onClose}
                                    disabled={isLoading}
                                    style={{ display: hideSecondaryButton ? 'none' : 'inline-flex' }}
                                >
                                    {secondaryButtonText}
                                </button>
                            </div>
                            
                            <div className="modal-footer-right">
                                {!hidePrimaryButton && (
                                    <button
                                        className={`btn ${primaryButtonClasses[primaryButtonVariant]}`}
                                        onClick={onPrimaryClick}
                                        disabled={primaryButtonDisabled || isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="spinner-small"></div>
                                                Procesando...
                                            </>
                                        ) : (
                                            primaryButtonText
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

Modal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    title: PropTypes.string,
    children: PropTypes.node.isRequired,
    size: PropTypes.oneOf(['small', 'medium', 'large', 'xlarge', 'fullscreen']),
    showCloseButton: PropTypes.bool,
    showFooter: PropTypes.bool,
    primaryButtonText: PropTypes.string,
    secondaryButtonText: PropTypes.string,
    onPrimaryClick: PropTypes.func,
    onSecondaryClick: PropTypes.func,
    isLoading: PropTypes.bool,
    primaryButtonDisabled: PropTypes.bool,
    primaryButtonVariant: PropTypes.oneOf(['primary', 'success', 'warning', 'danger', 'info']),
    hidePrimaryButton: PropTypes.bool,
    hideSecondaryButton: PropTypes.bool,
    closeOnOverlayClick: PropTypes.bool,
    closeOnEsc: PropTypes.bool,
    className: PropTypes.string
};

export default Modal;