import React from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/Common/common.css';

const Button = ({
    children,
    variant = 'primary',
    size = 'medium',
    type = 'button',
    disabled = false,
    loading = false,
    fullWidth = false,
    rounded = false,
    outlined = false,
    icon,
    iconPosition = 'left',
    onClick,
    href,
    target,
    rel,
    className = '',
    style = {},
    ...props
}) => {
    const variantClasses = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        success: 'btn-success',
        warning: 'btn-warning',
        danger: 'btn-danger',
        info: 'btn-info',
        light: 'btn-light',
        dark: 'btn-dark',
        link: 'btn-link',
        ghost: 'btn-ghost'
    };

    const sizeClasses = {
        small: 'btn-sm',
        medium: 'btn-md',
        large: 'btn-lg'
    };

    const buttonClasses = [
        'btn',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'btn-full-width' : '',
        rounded ? 'btn-rounded' : '',
        outlined ? 'btn-outlined' : '',
        loading ? 'btn-loading' : '',
        disabled ? 'btn-disabled' : '',
        className
    ].filter(Boolean).join(' ');

    const handleClick = (e) => {
        if (!disabled && !loading && onClick) {
            onClick(e);
        }
    };

    const renderIcon = () => {
        if (!icon) return null;
        
        const iconElement = typeof icon === 'string' 
            ? <i className={icon}></i>
            : icon;
        
        return (
            <span className={`btn-icon ${iconPosition}`}>
                {iconElement}
            </span>
        );
    };

    const renderContent = () => (
        <>
            {loading && (
                <span className="btn-spinner">
                    <div className="spinner-small"></div>
                </span>
            )}
            
            {iconPosition === 'left' && renderIcon()}
            
            <span className="btn-text">{children}</span>
            
            {iconPosition === 'right' && renderIcon()}
        </>
    );

    // Si es un enlace
    if (href && !disabled) {
        return (
            <a
                href={href}
                target={target}
                rel={rel}
                className={buttonClasses}
                style={style}
                onClick={handleClick}
                {...props}
            >
                {renderContent()}
            </a>
        );
    }

    // Si es un botón normal
    return (
        <button
            type={type}
            className={buttonClasses}
            style={style}
            onClick={handleClick}
            disabled={disabled || loading}
            {...props}
        >
            {renderContent()}
        </button>
    );
};

Button.propTypes = {
    children: PropTypes.node.isRequired,
    variant: PropTypes.oneOf([
        'primary', 'secondary', 'success', 'warning', 
        'danger', 'info', 'light', 'dark', 'link', 'ghost'
    ]),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    type: PropTypes.oneOf(['button', 'submit', 'reset']),
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    fullWidth: PropTypes.bool,
    rounded: PropTypes.bool,
    outlined: PropTypes.bool,
    icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    iconPosition: PropTypes.oneOf(['left', 'right']),
    onClick: PropTypes.func,
    href: PropTypes.string,
    target: PropTypes.string,
    rel: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object
};

// Button Group Component
export const ButtonGroup = ({ 
    children, 
    vertical = false,
    size = 'medium',
    className = ''
}) => {
    const directionClass = vertical ? 'btn-group-vertical' : 'btn-group-horizontal';
    const sizeClass = `btn-group-${size}`;
    
    return (
        <div className={`btn-group ${directionClass} ${sizeClass} ${className}`}>
            {children}
        </div>
    );
};

ButtonGroup.propTypes = {
    children: PropTypes.node.isRequired,
    vertical: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    className: PropTypes.string
};

export default Button;
export { ButtonGroup };