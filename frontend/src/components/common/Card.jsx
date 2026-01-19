import React from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/Common/common.css';

const Card = ({
    children,
    title,
    subtitle,
    header,
    footer,
    variant = 'default',
    size = 'medium',
    hoverable = false,
    bordered = true,
    shadow = 'sm',
    className = '',
    headerClassName = '',
    bodyClassName = '',
    footerClassName = '',
    onClick,
    loading = false,
    disabled = false
}) => {
    const variantClasses = {
        default: 'card-default',
        primary: 'card-primary',
        success: 'card-success',
        warning: 'card-warning',
        danger: 'card-danger',
        info: 'card-info',
        dark: 'card-dark'
    };

    const sizeClasses = {
        small: 'card-sm',
        medium: 'card-md',
        large: 'card-lg'
    };

    const shadowClasses = {
        none: 'shadow-none',
        sm: 'shadow-sm',
        md: 'shadow-md',
        lg: 'shadow-lg',
        xl: 'shadow-xl'
    };

    const cardClasses = [
        'card',
        variantClasses[variant],
        sizeClasses[size],
        shadowClasses[shadow],
        hoverable ? 'card-hoverable' : '',
        bordered ? 'card-bordered' : '',
        loading ? 'card-loading' : '',
        disabled ? 'card-disabled' : '',
        className
    ].filter(Boolean).join(' ');

    const handleClick = (e) => {
        if (!disabled && onClick) {
            onClick(e);
        }
    };

    return (
        <div 
            className={cardClasses}
            onClick={handleClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick && !disabled ? 0 : undefined}
            aria-disabled={disabled}
        >
            {/* Loading overlay */}
            {loading && (
                <div className="card-loading-overlay">
                    <div className="card-spinner"></div>
                </div>
            )}

            {/* Header */}
            {(title || subtitle || header) && (
                <div className={`card-header ${headerClassName}`}>
                    {header || (
                        <>
                            {title && <h3 className="card-title">{title}</h3>}
                            {subtitle && <p className="card-subtitle">{subtitle}</p>}
                        </>
                    )}
                </div>
            )}

            {/* Body */}
            <div className={`card-body ${bodyClassName}`}>
                {children}
            </div>

            {/* Footer */}
            {footer && (
                <div className={`card-footer ${footerClassName}`}>
                    {footer}
                </div>
            )}
        </div>
    );
};

Card.propTypes = {
    children: PropTypes.node.isRequired,
    title: PropTypes.string,
    subtitle: PropTypes.string,
    header: PropTypes.node,
    footer: PropTypes.node,
    variant: PropTypes.oneOf(['default', 'primary', 'success', 'warning', 'danger', 'info', 'dark']),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    hoverable: PropTypes.bool,
    bordered: PropTypes.bool,
    shadow: PropTypes.oneOf(['none', 'sm', 'md', 'lg', 'xl']),
    className: PropTypes.string,
    headerClassName: PropTypes.string,
    bodyClassName: PropTypes.string,
    footerClassName: PropTypes.string,
    onClick: PropTypes.func,
    loading: PropTypes.bool,
    disabled: PropTypes.bool
};

// Card Components
export const CardHeader = ({ children, className = '' }) => (
    <div className={`card-header ${className}`}>{children}</div>
);

CardHeader.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};

export const CardBody = ({ children, className = '' }) => (
    <div className={`card-body ${className}`}>{children}</div>
);

CardBody.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};

export const CardFooter = ({ children, className = '' }) => (
    <div className={`card-footer ${className}`}>{children}</div>
);

CardFooter.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};

export default Card;
export { CardHeader, CardBody, CardFooter };