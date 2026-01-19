import React from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/Common/common.css';

const EmptyState = ({
    icon = 'fas fa-inbox',
    title = 'No hay datos',
    description = 'No se encontraron registros para mostrar.',
    actionText = null,
    actionIcon = null,
    onAction = null,
    secondaryActionText = null,
    secondaryActionIcon = null,
    onSecondaryAction = null,
    size = 'medium',
    type = 'default',
    className = ''
}) => {
    const sizeClasses = {
        small: 'empty-state-sm',
        medium: 'empty-state-md',
        large: 'empty-state-lg'
    };

    const typeClasses = {
        default: 'empty-state-default',
        success: 'empty-state-success',
        warning: 'empty-state-warning',
        info: 'empty-state-info',
        error: 'empty-state-error'
    };

    const typeIcons = {
        default: 'fas fa-inbox',
        success: 'fas fa-check-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle',
        error: 'fas fa-times-circle'
    };

    const typeColors = {
        default: '#6b7280',
        success: '#10b981',
        warning: '#f59e0b',
        info: '#3b82f6',
        error: '#ef4444'
    };

    return (
        <div className={`empty-state ${sizeClasses[size]} ${typeClasses[type]} ${className}`}>
            <div 
                className="empty-state-icon"
                style={{ color: typeColors[type] }}
            >
                <i className={icon || typeIcons[type]}></i>
            </div>
            
            <div className="empty-state-content">
                <h3 className="empty-state-title">{title}</h3>
                <p className="empty-state-description">{description}</p>
            </div>
            
            {(actionText || secondaryActionText) && (
                <div className="empty-state-actions">
                    {actionText && onAction && (
                        <button
                            className="btn btn-primary"
                            onClick={onAction}
                        >
                            {actionIcon && <i className={actionIcon}></i>}
                            {actionText}
                        </button>
                    )}
                    
                    {secondaryActionText && onSecondaryAction && (
                        <button
                            className="btn btn-outline"
                            onClick={onSecondaryAction}
                        >
                            {secondaryActionIcon && <i className={secondaryActionIcon}></i>}
                            {secondaryActionText}
                        </button>
                    )}
                </div>
            )}
            
            {/* Sugerencias basadas en el tipo */}
            {type === 'default' && (
                <div className="empty-state-suggestions">
                    <h4>Puedes:</h4>
                    <ul>
                        <li>Agregar nuevos registros</li>
                        <li>Verificar los filtros aplicados</li>
                        <li>Importar datos desde un archivo</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

EmptyState.propTypes = {
    icon: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    actionText: PropTypes.string,
    actionIcon: PropTypes.string,
    onAction: PropTypes.func,
    secondaryActionText: PropTypes.string,
    secondaryActionIcon: PropTypes.string,
    onSecondaryAction: PropTypes.func,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    type: PropTypes.oneOf(['default', 'success', 'warning', 'info', 'error']),
    className: PropTypes.string
};

export default EmptyState;