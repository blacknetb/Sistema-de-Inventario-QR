import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/Common/common.css';

const Toast = ({
    id,
    message,
    type = 'info',
    title,
    duration = 5000,
    onClose,
    showCloseButton = true,
    showIcon = true,
    position = 'top-right',
    actionText,
    onAction,
    className = ''
}) => {
    const [isVisible, setIsVisible] = useState(true);
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        if (duration > 0) {
            const interval = 50;
            const totalSteps = duration / interval;
            const stepDecrement = 100 / totalSteps;
            
            const timer = setInterval(() => {
                setProgress(prev => {
                    const newProgress = prev - stepDecrement;
                    if (newProgress <= 0) {
                        clearInterval(timer);
                        handleClose();
                        return 0;
                    }
                    return newProgress;
                });
            }, interval);

            return () => clearInterval(timer);
        }
    }, [duration]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            if (onClose) onClose(id);
        }, 300);
    };

    const handleAction = () => {
        if (onAction) onAction();
        handleClose();
    };

    if (!isVisible) return null;

    const typeConfigs = {
        success: {
            icon: 'fas fa-check-circle',
            color: '#10b981',
            bgColor: '#d1fae5',
            borderColor: '#a7f3d0'
        },
        error: {
            icon: 'fas fa-times-circle',
            color: '#ef4444',
            bgColor: '#fee2e2',
            borderColor: '#fecaca'
        },
        warning: {
            icon: 'fas fa-exclamation-triangle',
            color: '#f59e0b',
            bgColor: '#fef3c7',
            borderColor: '#fde68a'
        },
        info: {
            icon: 'fas fa-info-circle',
            color: '#3b82f6',
            bgColor: '#dbeafe',
            borderColor: '#bfdbfe'
        }
    };

    const config = typeConfigs[type];
    const positionClass = `toast-${position}`;

    return (
        <div className={`toast ${positionClass} ${className}`}>
            <div 
                className="toast-content"
                style={{
                    backgroundColor: config.bgColor,
                    borderLeftColor: config.color,
                    border: `1px solid ${config.borderColor}`
                }}
            >
                {/* Icono y contenido */}
                <div className="toast-body">
                    {showIcon && (
                        <div 
                            className="toast-icon"
                            style={{ color: config.color }}
                        >
                            <i className={config.icon}></i>
                        </div>
                    )}
                    
                    <div className="toast-message-container">
                        {title && (
                            <h4 className="toast-title">{title}</h4>
                        )}
                        <p className="toast-message">{message}</p>
                    </div>
                    
                    {/* Acciones */}
                    <div className="toast-actions">
                        {actionText && onAction && (
                            <button
                                className="toast-action-btn"
                                onClick={handleAction}
                                style={{ color: config.color }}
                            >
                                {actionText}
                            </button>
                        )}
                        
                        {showCloseButton && (
                            <button
                                className="toast-close"
                                onClick={handleClose}
                                aria-label="Cerrar notificación"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        )}
                    </div>
                </div>

                {/* Barra de progreso */}
                {duration > 0 && (
                    <div className="toast-progress-container">
                        <div 
                            className="toast-progress-bar"
                            style={{
                                width: `${progress}%`,
                                backgroundColor: config.color
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

Toast.propTypes = {
    id: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
    title: PropTypes.string,
    duration: PropTypes.number,
    onClose: PropTypes.func.isRequired,
    showCloseButton: PropTypes.bool,
    showIcon: PropTypes.bool,
    position: PropTypes.oneOf([
        'top-right', 'top-left', 'top-center',
        'bottom-right', 'bottom-left', 'bottom-center'
    ]),
    actionText: PropTypes.string,
    onAction: PropTypes.func,
    className: PropTypes.string
};

export default Toast;

// Toast Container Component
export const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    id={toast.id}
                    message={toast.message}
                    type={toast.type}
                    title={toast.title}
                    duration={toast.duration}
                    onClose={removeToast}
                    showCloseButton={toast.showCloseButton}
                    showIcon={toast.showIcon}
                    position={toast.position}
                    actionText={toast.actionText}
                    onAction={toast.onAction}
                    className={toast.className}
                />
            ))}
        </div>
    );
};

ToastContainer.propTypes = {
    toasts: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        message: PropTypes.string.isRequired,
        type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
        title: PropTypes.string,
        duration: PropTypes.number,
        showCloseButton: PropTypes.bool,
        showIcon: PropTypes.bool,
        position: PropTypes.string,
        actionText: PropTypes.string,
        onAction: PropTypes.func,
        className: PropTypes.string
    })).isRequired,
    removeToast: PropTypes.func.isRequired
};