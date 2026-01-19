import React from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/Common/common.css';

const LoadingSpinner = ({ 
    size = 'medium',
    color = 'primary',
    text = 'Cargando...',
    fullscreen = false,
    overlay = true,
    className = ''
}) => {
    const sizeClasses = {
        small: 'spinner-sm',
        medium: 'spinner-md',
        large: 'spinner-lg',
        xlarge: 'spinner-xl'
    };

    const colorClasses = {
        primary: 'spinner-primary',
        secondary: 'spinner-secondary',
        success: 'spinner-success',
        warning: 'spinner-warning',
        danger: 'spinner-danger',
        info: 'spinner-info',
        light: 'spinner-light',
        dark: 'spinner-dark'
    };

    if (fullscreen) {
        return (
            <div className="loading-fullscreen">
                <div className="loading-content">
                    <div className={`spinner ${sizeClasses[size]} ${colorClasses[color]}`}></div>
                    {text && <p className="loading-text">{text}</p>}
                </div>
            </div>
        );
    }

    if (overlay) {
        return (
            <div className="loading-overlay">
                <div className="loading-content">
                    <div className={`spinner ${sizeClasses[size]} ${colorClasses[color]}`}></div>
                    {text && <p className="loading-text">{text}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className={`loading-inline ${className}`}>
            <div className={`spinner ${sizeClasses[size]} ${colorClasses[color]}`}></div>
            {text && <p className="loading-text">{text}</p>}
        </div>
    );
};

LoadingSpinner.propTypes = {
    size: PropTypes.oneOf(['small', 'medium', 'large', 'xlarge']),
    color: PropTypes.oneOf(['primary', 'secondary', 'success', 'warning', 'danger', 'info', 'light', 'dark']),
    text: PropTypes.string,
    fullscreen: PropTypes.bool,
    overlay: PropTypes.bool,
    className: PropTypes.string
};

export default LoadingSpinner;