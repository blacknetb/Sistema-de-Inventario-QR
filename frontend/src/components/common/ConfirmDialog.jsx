import React from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/Common/common.css';

const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirmar acción',
    message = '¿Estás seguro de que deseas continuar?',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'warning',
    showIcon = true,
    isLoading = false,
    confirmButtonVariant = 'danger',
    size = 'medium',
    className = ''
}) => {
    if (!isOpen) return null;

    const typeConfigs = {
        warning: {
            icon: 'fas fa-exclamation-triangle',
            color: '#f59e0b',
            bgColor: '#fef3c7'
        },
        danger: {
            icon: 'fas fa-exclamation-circle',
            color: '#ef4444',
            bgColor: '#fee2e2'
        },
        info: {
            icon: 'fas fa-info-circle',
            color: '#3b82f6',
            bgColor: '#dbeafe'
        },
        success: {
            icon: 'fas fa-check-circle',
            color: '#10b981',
            bgColor: '#d1fae5'
        },
        question: {
            icon: 'fas fa-question-circle',
            color: '#8b5cf6',
            bgColor: '#ede9fe'
        }
    };

    const confirmButtonClasses = {
        primary: 'btn-primary',
        success: 'btn-success',
        warning: 'btn-warning',
        danger: 'btn-danger',
        info: 'btn-info'
    };

    const config = typeConfigs[type];
    const sizeClass = size === 'small' ? 'confirm-sm' : size === 'large' ? 'confirm-lg' : '';

    return (
        <>
            <div className="confirm-overlay" onClick={!isLoading ? onClose : undefined} />
            
            <div className={`confirm-dialog ${sizeClass} ${className}`}>
                <div className="confirm-content">
                    {/* Header */}
                    <div className="confirm-header">
                        {showIcon && (
                            <div 
                                className="confirm-icon"
                                style={{ 
                                    backgroundColor: config.bgColor,
                                    color: config.color
                                }}
                            >
                                <i className={config.icon}></i>
                            </div>
                        )}
                        
                        <div className="confirm-title-section">
                            <h3 className="confirm-title">{title}</h3>
                            <button
                                className="confirm-close"
                                onClick={onClose}
                                disabled={isLoading}
                                aria-label="Cerrar"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="confirm-body">
                        <p className="confirm-message">{message}</p>
                        
                        {/* Detalles adicionales */}
                        {type === 'danger' && (
                            <div className="confirm-warning">
                                <i className="fas fa-exclamation"></i>
                                <span>Esta acción no se puede deshacer</span>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="confirm-footer">
                        <button
                            className="btn btn-outline"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            {cancelText}
                        </button>
                        
                        <button
                            className={`btn ${confirmButtonClasses[confirmButtonVariant]}`}
                            onClick={onConfirm}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <div className="spinner-small"></div>
                                    Procesando...
                                </>
                            ) : (
                                confirmText
                            )}
                        </button>
                    </div>

                    {/* Nota adicional */}
                    <div className="confirm-note">
                        <small>
                            <i className="fas fa-lightbulb"></i>
                            Presiona <kbd>Esc</kbd> para cancelar
                        </small>
                    </div>
                </div>
            </div>
        </>
    );
};

ConfirmDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    title: PropTypes.string,
    message: PropTypes.string,
    confirmText: PropTypes.string,
    cancelText: PropTypes.string,
    type: PropTypes.oneOf(['warning', 'danger', 'info', 'success', 'question']),
    showIcon: PropTypes.bool,
    isLoading: PropTypes.bool,
    confirmButtonVariant: PropTypes.oneOf(['primary', 'success', 'warning', 'danger', 'info']),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    className: PropTypes.string
};

export default ConfirmDialog;