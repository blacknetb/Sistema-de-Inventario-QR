import React from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/Common/common.css';

const ErrorMessage = ({ 
    title = 'Error',
    message,
    type = 'error',
    showIcon = true,
    showRetry = false,
    retryText = 'Reintentar',
    onRetry,
    showDetails = false,
    details = null,
    className = ''
}) => {
    const typeClasses = {
        error: 'error-danger',
        warning: 'error-warning',
        info: 'error-info',
        success: 'error-success'
    };

    const typeIcons = {
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle',
        success: 'fas fa-check-circle'
    };

    const typeColors = {
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
        success: '#10b981'
    };

    const [showDetail, setShowDetail] = React.useState(false);

    return (
        <div className={`error-container ${typeClasses[type]} ${className}`}>
            <div className="error-header">
                <div className="error-icon-title">
                    {showIcon && (
                        <div 
                            className="error-icon"
                            style={{ color: typeColors[type] }}
                        >
                            <i className={typeIcons[type]}></i>
                        </div>
                    )}
                    <div className="error-content">
                        <h3 className="error-title">{title}</h3>
                        <p className="error-message">{message}</p>
                    </div>
                </div>
                
                <div className="error-actions">
                    {showRetry && onRetry && (
                        <button
                            className="btn btn-sm btn-outline"
                            onClick={onRetry}
                        >
                            <i className="fas fa-redo"></i>
                            {retryText}
                        </button>
                    )}
                    
                    {showDetails && details && (
                        <button
                            className="btn btn-sm btn-outline"
                            onClick={() => setShowDetail(!showDetail)}
                        >
                            <i className={`fas fa-chevron-${showDetail ? 'up' : 'down'}`}></i>
                            {showDetail ? 'Ocultar detalles' : 'Ver detalles'}
                        </button>
                    )}
                </div>
            </div>
            
            {showDetail && details && (
                <div className="error-details">
                    <pre className="error-details-content">
                        {typeof details === 'string' ? details : JSON.stringify(details, null, 2)}
                    </pre>
                    <button
                        className="btn-copy-details"
                        onClick={() => {
                            navigator.clipboard.writeText(
                                typeof details === 'string' ? details : JSON.stringify(details, null, 2)
                            );
                            alert('Detalles copiados al portapapeles');
                        }}
                    >
                        <i className="fas fa-copy"></i>
                        Copiar detalles
                    </button>
                </div>
            )}
            
            {type === 'error' && (
                <div className="error-suggestions">
                    <h4>Sugerencias:</h4>
                    <ul>
                        <li>Verifica tu conexión a internet</li>
                        <li>Recarga la página</li>
                        <li>Intenta más tarde</li>
                        <li>Contacta al soporte técnico</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

ErrorMessage.propTypes = {
    title: PropTypes.string,
    message: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['error', 'warning', 'info', 'success']),
    showIcon: PropTypes.bool,
    showRetry: PropTypes.bool,
    retryText: PropTypes.string,
    onRetry: PropTypes.func,
    showDetails: PropTypes.bool,
    details: PropTypes.any,
    className: PropTypes.string
};

export default ErrorMessage;