import React from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/Common/common.css';

const Badge = ({
    children,
    variant = 'default',
    size = 'medium',
    rounded = false,
    pill = false,
    dot = false,
    showClose = false,
    onClose,
    className = '',
    style = {}
}) => {
    const variantClasses = {
        default: 'badge-default',
        primary: 'badge-primary',
        secondary: 'badge-secondary',
        success: 'badge-success',
        warning: 'badge-warning',
        danger: 'badge-danger',
        info: 'badge-info',
        light: 'badge-light',
        dark: 'badge-dark'
    };

    const sizeClasses = {
        small: 'badge-sm',
        medium: 'badge-md',
        large: 'badge-lg'
    };

    const badgeClasses = [
        'badge',
        variantClasses[variant],
        sizeClasses[size],
        rounded ? 'badge-rounded' : '',
        pill ? 'badge-pill' : '',
        dot ? 'badge-dot' : '',
        className
    ].filter(Boolean).join(' ');

    const handleClose = (e) => {
        e.stopPropagation();
        if (onClose) {
            onClose();
        }
    };

    return (
        <span className={badgeClasses} style={style}>
            {dot && <span className="badge-dot-indicator"></span>}
            <span className="badge-content">{children}</span>
            {showClose && (
                <button
                    className="badge-close"
                    onClick={handleClose}
                    aria-label="Eliminar"
                >
                    <i className="fas fa-times"></i>
                </button>
            )}
        </span>
    );
};

Badge.propTypes = {
    children: PropTypes.node.isRequired,
    variant: PropTypes.oneOf([
        'default', 'primary', 'secondary', 'success', 
        'warning', 'danger', 'info', 'light', 'dark'
    ]),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    rounded: PropTypes.bool,
    pill: PropTypes.bool,
    dot: PropTypes.bool,
    showClose: PropTypes.bool,
    onClose: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default Badge;