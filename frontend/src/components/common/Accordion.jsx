import React, { useState } from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/Common/common.css';

const Accordion = ({
    items,
    multiple = false,
    defaultOpen = [],
    variant = 'default',
    size = 'medium',
    className = '',
    itemClassName = '',
    headerClassName = '',
    contentClassName = ''
}) => {
    const [openItems, setOpenItems] = useState(defaultOpen);

    const toggleItem = (itemId) => {
        setOpenItems(prev => {
            if (multiple) {
                // Para múltiples: agregar o quitar
                return prev.includes(itemId) 
                    ? prev.filter(id => id !== itemId)
                    : [...prev, itemId];
            } else {
                // Para uno solo: cambiar al nuevo o cerrar si ya está abierto
                return prev.includes(itemId) ? [] : [itemId];
            }
        });
    };

    const isItemOpen = (itemId) => openItems.includes(itemId);

    const variantClasses = {
        default: 'accordion-default',
        bordered: 'accordion-bordered',
        shadow: 'accordion-shadow'
    };

    const sizeClasses = {
        small: 'accordion-sm',
        medium: 'accordion-md',
        large: 'accordion-lg'
    };

    return (
        <div className={`accordion ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
            {items.map((item) => {
                const isOpen = isItemOpen(item.id);
                const isDisabled = item.disabled;
                
                return (
                    <div
                        key={item.id}
                        className={`accordion-item ${isOpen ? 'open' : ''} ${isDisabled ? 'disabled' : ''} ${itemClassName}`}
                    >
                        <button
                            className={`accordion-header ${headerClassName}`}
                            onClick={() => !isDisabled && toggleItem(item.id)}
                            disabled={isDisabled}
                            aria-expanded={isOpen}
                            aria-controls={`accordion-content-${item.id}`}
                        >
                            <div className="accordion-header-content">
                                {item.icon && <i className={`accordion-icon ${item.icon}`}></i>}
                                <span className="accordion-title">{item.title}</span>
                                
                                {item.badge && (
                                    <span className="accordion-badge">{item.badge}</span>
                                )}
                            </div>
                            
                            <i className={`accordion-arrow fas fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
                        </button>
                        
                        <div
                            className={`accordion-content ${contentClassName}`}
                            id={`accordion-content-${item.id}`}
                            style={{ 
                                maxHeight: isOpen ? '1000px' : '0px',
                                opacity: isOpen ? 1 : 0
                            }}
                            aria-hidden={!isOpen}
                        >
                            <div className="accordion-content-inner">
                                {item.content}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

Accordion.propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        content: PropTypes.node.isRequired,
        icon: PropTypes.string,
        disabled: PropTypes.bool,
        badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    })).isRequired,
    multiple: PropTypes.bool,
    defaultOpen: PropTypes.arrayOf(PropTypes.string),
    variant: PropTypes.oneOf(['default', 'bordered', 'shadow']),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    className: PropTypes.string,
    itemClassName: PropTypes.string,
    headerClassName: PropTypes.string,
    contentClassName: PropTypes.string
};

export default Accordion;