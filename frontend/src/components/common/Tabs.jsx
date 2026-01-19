import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/Common/common.css';

const Tabs = ({
    tabs,
    defaultActiveTab = 0,
    onChange,
    variant = 'default',
    size = 'medium',
    fullWidth = false,
    disabled = false,
    className = '',
    tabClassName = '',
    contentClassName = ''
}) => {
    const [activeTab, setActiveTab] = useState(defaultActiveTab);

    useEffect(() => {
        setActiveTab(defaultActiveTab);
    }, [defaultActiveTab]);

    const handleTabClick = (index, tabId) => {
        if (disabled || tabs[index].disabled) return;
        
        setActiveTab(index);
        if (onChange) onChange(index, tabId);
    };

    const variantClasses = {
        default: 'tabs-default',
        pills: 'tabs-pills',
        underlined: 'tabs-underlined',
        cards: 'tabs-cards'
    };

    const sizeClasses = {
        small: 'tabs-sm',
        medium: 'tabs-md',
        large: 'tabs-lg'
    };

    return (
        <div className={`tabs-container ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'tabs-full-width' : ''} ${className}`}>
            {/* Tab headers */}
            <div className="tabs-header" role="tablist">
                {tabs.map((tab, index) => {
                    const isActive = activeTab === index;
                    const isDisabled = disabled || tab.disabled;
                    
                    return (
                        <button
                            key={tab.id || index}
                            className={`tab-header ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''} ${tabClassName}`}
                            onClick={() => handleTabClick(index, tab.id)}
                            disabled={isDisabled}
                            role="tab"
                            aria-selected={isActive}
                            aria-controls={`tabpanel-${tab.id || index}`}
                            id={`tab-${tab.id || index}`}
                        >
                            {tab.icon && <i className={`tab-icon ${tab.icon}`}></i>}
                            <span className="tab-label">{tab.label}</span>
                            
                            {tab.badge && (
                                <span className="tab-badge">{tab.badge}</span>
                            )}
                            
                            {tab.tooltip && (
                                <span className="tab-tooltip">{tab.tooltip}</span>
                            )}
                        </button>
                    );
                })}
                
                {/* Active tab indicator */}
                {variant === 'underlined' && (
                    <div className="tab-indicator" style={{
                        width: `${100 / tabs.length}%`,
                        transform: `translateX(${activeTab * 100}%)`
                    }} />
                )}
            </div>

            {/* Tab content */}
            <div className="tabs-content">
                {tabs.map((tab, index) => {
                    const isActive = activeTab === index;
                    
                    return (
                        <div
                            key={tab.id || index}
                            className={`tab-panel ${isActive ? 'active' : ''} ${contentClassName}`}
                            role="tabpanel"
                            id={`tabpanel-${tab.id || index}`}
                            aria-labelledby={`tab-${tab.id || index}`}
                            hidden={!isActive}
                        >
                            {tab.content}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

Tabs.propTypes = {
    tabs: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string.isRequired,
        content: PropTypes.node.isRequired,
        icon: PropTypes.string,
        disabled: PropTypes.bool,
        badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        tooltip: PropTypes.string
    })).isRequired,
    defaultActiveTab: PropTypes.number,
    onChange: PropTypes.func,
    variant: PropTypes.oneOf(['default', 'pills', 'underlined', 'cards']),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    fullWidth: PropTypes.bool,
    disabled: PropTypes.bool,
    className: PropTypes.string,
    tabClassName: PropTypes.string,
    contentClassName: PropTypes.string
};

export default Tabs;