import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/Common/common.css';

const Dropdown = ({
    trigger,
    children,
    position = 'bottom-left',
    alignment = 'start',
    width = 200,
    maxHeight = 300,
    closeOnSelect = true,
    closeOnClickOutside = true,
    disabled = false,
    className = '',
    overlayClassName = '',
    triggerClassName = '',
    onOpen,
    onClose
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const triggerRef = useRef(null);

    const toggleDropdown = () => {
        if (disabled) return;
        
        const newState = !isOpen;
        setIsOpen(newState);
        
        if (newState && onOpen) onOpen();
        if (!newState && onClose) onClose();
    };

    const closeDropdown = () => {
        if (isOpen) {
            setIsOpen(false);
            if (onClose) onClose();
        }
    };

    // Cerrar al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                closeOnClickOutside &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                triggerRef.current &&
                !triggerRef.current.contains(event.target)
            ) {
                closeDropdown();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen, closeOnClickOutside]);

    // Cerrar con tecla ESC
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === 'Escape' && isOpen) {
                closeDropdown();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
        }

        return () => {
            document.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen]);

    // Calcular posición
    const getDropdownStyle = () => {
        if (!triggerRef.current || !dropdownRef.current) return {};

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const dropdownRect = dropdownRef.current.getBoundingClientRect();
        
        let top = 0;
        let left = 0;
        let transform = '';

        switch (position) {
            case 'bottom-left':
                top = triggerRect.bottom + 5;
                left = triggerRect.left;
                break;
            case 'bottom-right':
                top = triggerRect.bottom + 5;
                left = triggerRect.right - width;
                break;
            case 'bottom-center':
                top = triggerRect.bottom + 5;
                left = triggerRect.left + (triggerRect.width - width) / 2;
                break;
            case 'top-left':
                top = triggerRect.top - dropdownRect.height - 5;
                left = triggerRect.left;
                break;
            case 'top-right':
                top = triggerRect.top - dropdownRect.height - 5;
                left = triggerRect.right - width;
                break;
            case 'top-center':
                top = triggerRect.top - dropdownRect.height - 5;
                left = triggerRect.left + (triggerRect.width - width) / 2;
                break;
            case 'left':
                top = triggerRect.top;
                left = triggerRect.left - width - 5;
                break;
            case 'right':
                top = triggerRect.top;
                left = triggerRect.right + 5;
                break;
        }

        // Ajustar para que no salga de la pantalla
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (left + width > viewportWidth) {
            left = viewportWidth - width - 10;
        }
        if (left < 10) left = 10;

        if (top + dropdownRect.height > viewportHeight) {
            if (position.includes('bottom')) {
                top = triggerRect.top - dropdownRect.height - 5;
            }
        }
        if (top < 10) top = 10;

        return {
            position: 'fixed',
            top: `${top}px`,
            left: `${left}px`,
            width: `${width}px`,
            maxHeight: `${maxHeight}px`,
            zIndex: 9999
        };
    };

    // Clonar children para pasar props
    const renderChildren = () => {
        return React.Children.map(children, child => {
            if (React.isValidElement(child)) {
                return React.cloneElement(child, {
                    onClick: (e) => {
                        if (closeOnSelect) closeDropdown();
                        if (child.props.onClick) child.props.onClick(e);
                    }
                });
            }
            return child;
        });
    };

    return (
        <div className={`dropdown-wrapper ${className}`}>
            <div
                ref={triggerRef}
                className={`dropdown-trigger ${triggerClassName} ${disabled ? 'disabled' : ''}`}
                onClick={toggleDropdown}
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                {trigger}
            </div>

            {isOpen && (
                <>
                    <div className="dropdown-overlay" onClick={closeDropdown} />
                    
                    <div
                        ref={dropdownRef}
                        className={`dropdown-menu ${position} ${alignment} ${overlayClassName}`}
                        style={getDropdownStyle()}
                        role="menu"
                    >
                        <div className="dropdown-content">
                            {renderChildren()}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

Dropdown.propTypes = {
    trigger: PropTypes.node.isRequired,
    children: PropTypes.node.isRequired,
    position: PropTypes.oneOf([
        'bottom-left', 'bottom-right', 'bottom-center',
        'top-left', 'top-right', 'top-center',
        'left', 'right'
    ]),
    alignment: PropTypes.oneOf(['start', 'center', 'end']),
    width: PropTypes.number,
    maxHeight: PropTypes.number,
    closeOnSelect: PropTypes.bool,
    closeOnClickOutside: PropTypes.bool,
    disabled: PropTypes.bool,
    className: PropTypes.string,
    overlayClassName: PropTypes.string,
    triggerClassName: PropTypes.string,
    onOpen: PropTypes.func,
    onClose: PropTypes.func
};

// Dropdown Item Component
export const DropdownItem = ({ 
    children, 
    onClick, 
    disabled = false, 
    divider = false,
    className = '',
    icon,
    danger = false,
    ...props 
}) => {
    if (divider) {
        return <hr className="dropdown-divider" />;
    }

    return (
        <button
            className={`dropdown-item ${danger ? 'danger' : ''} ${disabled ? 'disabled' : ''} ${className}`}
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            {...props}
        >
            {icon && <i className={`dropdown-item-icon ${icon}`}></i>}
            <span className="dropdown-item-text">{children}</span>
        </button>
    );
};

DropdownItem.propTypes = {
    children: PropTypes.node.isRequired,
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
    divider: PropTypes.bool,
    className: PropTypes.string,
    icon: PropTypes.string,
    danger: PropTypes.bool
};

// Dropdown Header Component
export const DropdownHeader = ({ children, className = '' }) => (
    <div className={`dropdown-header ${className}`}>
        {children}
    </div>
);

DropdownHeader.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};

export default Dropdown;
export { DropdownItem, DropdownHeader };