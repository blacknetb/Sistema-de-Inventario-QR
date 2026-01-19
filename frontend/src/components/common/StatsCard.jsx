import React from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/Common/common.css';

const StatsCard = ({
    title,
    value,
    icon,
    variant = 'primary',
    size = 'medium',
    trend = null,
    trendLabel = null,
    subtitle = null,
    footer = null,
    loading = false,
    className = '',
    onClick = null,
    href = null
}) => {
    const variantClasses = {
        primary: 'statscard-primary',
        secondary: 'statscard-secondary',
        success: 'statscard-success',
        warning: 'statscard-warning',
        danger: 'statscard-danger',
        info: 'statscard-info',
        dark: 'statscard-dark',
        light: 'statscard-light'
    };

    const sizeClasses = {
        small: 'statscard-sm',
        medium: 'statscard-md',
        large: 'statscard-lg'
    };

    const getTrendIcon = () => {
        if (!trend) return null;
        
        if (trend > 0) {
            return <i className="fas fa-arrow-up trend-up"></i>;
        } else if (trend < 0) {
            return <i className="fas fa-arrow-down trend-down"></i>;
        } else {
            return <i className="fas fa-minus trend-neutral"></i>;
        }
    };

    const getTrendClass = () => {
        if (!trend) return '';
        
        if (trend > 0) return 'trend-up';
        if (trend < 0) return 'trend-down';
        return 'trend-neutral';
    };

    const cardClasses = [
        'statscard',
        variantClasses[variant],
        sizeClasses[size],
        onClick || href ? 'statscard-clickable' : '',
        loading ? 'statscard-loading' : '',
        className
    ].filter(Boolean).join(' ');

    const CardWrapper = ({ children }) => {
        if (href) {
            return (
                <a href={href} className={cardClasses}>
                    {children}
                </a>
            );
        }
        
        if (onClick) {
            return (
                <button className={cardClasses} onClick={onClick}>
                    {children}
                </button>
            );
        }
        
        return (
            <div className={cardClasses}>
                {children}
            </div>
        );
    };

    return (
        <CardWrapper>
            {loading && (
                <div className="statscard-loading-overlay">
                    <div className="statscard-spinner"></div>
                </div>
            )}

            {/* Header */}
            <div className="statscard-header">
                <div className="statscard-title">{title}</div>
                
                {icon && (
                    <div className="statscard-icon">
                        {typeof icon === 'string' 
                            ? <i className={icon}></i>
                            : icon
                        }
                    </div>
                )}
            </div>

            {/* Value */}
            <div className="statscard-value">
                {value}
            </div>

            {/* Subtitle and trend */}
            {(subtitle || trend !== null) && (
                <div className="statscard-info">
                    {subtitle && (
                        <div className="statscard-subtitle">
                            {subtitle}
                        </div>
                    )}
                    
                    {trend !== null && (
                        <div className={`statscard-trend ${getTrendClass()}`}>
                            {getTrendIcon()}
                            {trendLabel && (
                                <span className="statscard-trend-label">
                                    {trendLabel}
                                </span>
                            )}
                            {trend !== 0 && (
                                <span className="statscard-trend-value">
                                    {Math.abs(trend)}%
                                </span>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Footer */}
            {footer && (
                <div className="statscard-footer">
                    {footer}
                </div>
            )}
        </CardWrapper>
    );
};

StatsCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.node]).isRequired,
    icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'warning', 'danger', 'info', 'dark', 'light']),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    trend: PropTypes.number,
    trendLabel: PropTypes.string,
    subtitle: PropTypes.string,
    footer: PropTypes.node,
    loading: PropTypes.bool,
    className: PropTypes.string,
    onClick: PropTypes.func,
    href: PropTypes.string
};

// StatsCard Group Component
export const StatsCardGroup = ({ 
    children, 
    columns = 4,
    gap = 'md',
    className = ''
}) => {
    const gapClasses = {
        sm: 'statscard-group-gap-sm',
        md: 'statscard-group-gap-md',
        lg: 'statscard-group-gap-lg'
    };

    return (
        <div 
            className={`statscard-group ${gapClasses[gap]} ${className}`}
            style={{ '--statscard-columns': columns }}
        >
            {children}
        </div>
    );
};

StatsCardGroup.propTypes = {
    children: PropTypes.node.isRequired,
    columns: PropTypes.number,
    gap: PropTypes.oneOf(['sm', 'md', 'lg']),
    className: PropTypes.string
};

export default StatsCard;
export { StatsCardGroup };