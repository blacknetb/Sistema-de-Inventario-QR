import React from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/Common/common.css';

const ProgressBar = ({
    value,
    max = 100,
    size = 'medium',
    variant = 'primary',
    showLabel = true,
    labelPosition = 'inside', // 'inside', 'outside', 'tooltip', 'none'
    striped = false,
    animated = false,
    borderRadius = 'default',
    className = '',
    labelClassName = '',
    barClassName = ''
}) => {
    // Validar valores
    const safeValue = Math.max(0, Math.min(value, max));
    const percentage = Math.round((safeValue / max) * 100);
    
    const sizeClasses = {
        small: 'progress-sm',
        medium: 'progress-md',
        large: 'progress-lg'
    };

    const variantClasses = {
        primary: 'progress-primary',
        secondary: 'progress-secondary',
        success: 'progress-success',
        warning: 'progress-warning',
        danger: 'progress-danger',
        info: 'progress-info'
    };

    const borderRadiusClasses = {
        none: 'progress-rounded-none',
        sm: 'progress-rounded-sm',
        default: 'progress-rounded',
        lg: 'progress-rounded-lg',
        full: 'progress-rounded-full'
    };

    const progressClasses = [
        'progress',
        sizeClasses[size],
        variantClasses[variant],
        borderRadiusClasses[borderRadius],
        striped ? 'progress-striped' : '',
        animated ? 'progress-animated' : '',
        className
    ].filter(Boolean).join(' ');

    const barClasses = [
        'progress-bar',
        barClassName
    ].filter(Boolean).join(' ');

    const getLabel = () => {
        if (!showLabel || labelPosition === 'none') return null;
        
        const label = `${safeValue}/${max} (${percentage}%)`;
        
        if (labelPosition === 'tooltip') {
            return (
                <div className="progress-tooltip">
                    {label}
                    <div className="progress-tooltip-text">{label}</div>
                </div>
            );
        }
        
        if (labelPosition === 'inside' && percentage >= 20) {
            return (
                <span className={`progress-label inside ${labelClassName}`}>
                    {label}
                </span>
            );
        }
        
        if (labelPosition === 'outside') {
            return (
                <span className={`progress-label outside ${labelClassName}`}>
                    {label}
                </span>
            );
        }
        
        return null;
    };

    return (
        <div className="progress-container">
            {labelPosition === 'outside' && getLabel()}
            
            <div className={progressClasses}>
                <div 
                    className={barClasses}
                    style={{ width: `${percentage}%` }}
                    role="progressbar"
                    aria-valuenow={safeValue}
                    aria-valuemin={0}
                    aria-valuemax={max}
                    aria-label={`Progreso: ${percentage}%`}
                >
                    {labelPosition === 'inside' && percentage >= 20 && getLabel()}
                </div>
                
                {labelPosition === 'tooltip' && getLabel()}
            </div>
            
            {labelPosition === 'outside' && (
                <div className="progress-info">
                    {getLabel()}
                </div>
            )}
            
            {/* Etiquetas de inicio y fin */}
            {labelPosition === 'outside' && (
                <div className="progress-labels">
                    <span className="progress-min">0</span>
                    <span className="progress-max">{max}</span>
                </div>
            )}
        </div>
    );
};

ProgressBar.propTypes = {
    value: PropTypes.number.isRequired,
    max: PropTypes.number,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'warning', 'danger', 'info']),
    showLabel: PropTypes.bool,
    labelPosition: PropTypes.oneOf(['inside', 'outside', 'tooltip', 'none']),
    striped: PropTypes.bool,
    animated: PropTypes.bool,
    borderRadius: PropTypes.oneOf(['none', 'sm', 'default', 'lg', 'full']),
    className: PropTypes.string,
    labelClassName: PropTypes.string,
    barClassName: PropTypes.string
};

export default ProgressBar;