import React, { useState, useEffect, useRef, forwardRef } from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/Common/common.css';

const Select = forwardRef(({
    options,
    value,
    defaultValue,
    onChange,
    placeholder = 'Seleccionar...',
    label,
    helperText,
    error,
    disabled = false,
    required = false,
    size = 'medium',
    variant = 'default',
    fullWidth = false,
    multiple = false,
    searchable = false,
    clearable = false,
    loading = false,
    className = '',
    wrapperClassName = '',
    labelClassName = '',
    selectClassName = '',
    helperClassName = '',
    name,
    id,
    ...props
}, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedValues, setSelectedValues] = useState(
        multiple 
            ? (value || defaultValue || []).map(val => String(val))
            : value || defaultValue || ''
    );
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    
    const selectRef = useRef(null);
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);

    const isControlled = value !== undefined;
    const currentValue = isControlled 
        ? multiple ? value.map(val => String(val)) : String(value)
        : selectedValues;

    // Filtrar opciones basadas en búsqueda
    const filteredOptions = searchable && searchQuery
        ? options.filter(option =>
            option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (option.value && String(option.value).toLowerCase().includes(searchQuery.toLowerCase()))
        )
        : options;

    // Encontrar opciones seleccionadas
    const getSelectedOptions = () => {
        if (multiple) {
            return options.filter(option => currentValue.includes(String(option.value)));
        } else {
            return options.find(option => String(option.value) === currentValue);
        }
    };

    const selectedOptions = getSelectedOptions();

    const handleToggle = () => {
        if (disabled || loading) return;
        
        const newState = !isOpen;
        setIsOpen(newState);
        
        if (newState && searchable && searchInputRef.current) {
            setTimeout(() => searchInputRef.current.focus(), 0);
        }
    };

    const handleSelect = (option) => {
        if (disabled || option.disabled) return;

        if (multiple) {
            const newValues = currentValue.includes(String(option.value))
                ? currentValue.filter(val => val !== String(option.value))
                : [...currentValue, String(option.value)];
            
            if (!isControlled) {
                setSelectedValues(newValues);
            }
            
            if (onChange) {
                const event = {
                    target: { 
                        value: newValues, 
                        name,
                        type: 'select'
                    }
                };
                onChange(event);
            }
        } else {
            if (!isControlled) {
                setSelectedValues(String(option.value));
            }
            
            if (onChange) {
                const event = {
                    target: { 
                        value: option.value, 
                        name,
                        type: 'select'
                    }
                };
                onChange(event);
            }
            
            setIsOpen(false);
            setSearchQuery('');
        }
    };

    const handleClear = (e) => {
        e.stopPropagation();
        
        if (multiple) {
            if (!isControlled) {
                setSelectedValues([]);
            }
            if (onChange) {
                const event = {
                    target: { 
                        value: [], 
                        name,
                        type: 'select'
                    }
                };
                onChange(event);
            }
        } else {
            if (!isControlled) {
                setSelectedValues('');
            }
            if (onChange) {
                const event = {
                    target: { 
                        value: '', 
                        name,
                        type: 'select'
                    }
                };
                onChange(event);
            }
        }
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setHighlightedIndex(-1);
    };

    const handleKeyDown = (e) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleToggle();
            }
            return;
        }

        switch (e.key) {
            case 'Escape':
                setIsOpen(false);
                break;
            case 'Enter':
                if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
                    handleSelect(filteredOptions[highlightedIndex]);
                }
                break;
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev => 
                    prev < filteredOptions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
                break;
            case 'Tab':
                setIsOpen(false);
                break;
        }
    };

    // Cerrar al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                selectRef.current &&
                !selectRef.current.contains(event.target) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const sizeClasses = {
        small: 'select-sm',
        medium: 'select-md',
        large: 'select-lg'
    };

    const variantClasses = {
        default: 'select-default',
        filled: 'select-filled',
        outline: 'select-outline'
    };

    const wrapperClasses = [
        'select-wrapper',
        sizeClasses[size],
        variantClasses[variant],
        fullWidth ? 'select-full-width' : '',
        disabled ? 'select-disabled' : '',
        error ? 'select-error' : '',
        isOpen ? 'select-open' : '',
        wrapperClassName
    ].filter(Boolean).join(' ');

    const selectClasses = [
        'select',
        selectClassName
    ].filter(Boolean).join(' ');

    // Renderizar valor seleccionado
    const renderSelectedValue = () => {
        if (multiple && selectedOptions.length > 0) {
            return (
                <div className="select-multiple-values">
                    {selectedOptions.slice(0, 3).map((option, index) => (
                        <span key={index} className="select-tag">
                            {option.label}
                            {selectedOptions.length > 3 && index === 2 && (
                                <span className="select-more">+{selectedOptions.length - 3}</span>
                            )}
                        </span>
                    ))}
                </div>
            );
        }

        if (!multiple && selectedOptions) {
            return (
                <span className="select-selected-value">
                    {selectedOptions.label}
                </span>
            );
        }

        return (
            <span className="select-placeholder">
                {placeholder}
            </span>
        );
    };

    return (
        <div className={`select-container ${className}`} ref={selectRef}>
            {/* Label */}
            {label && (
                <label 
                    htmlFor={id}
                    className={`select-label ${labelClassName} ${required ? 'required' : ''}`}
                >
                    {label}
                </label>
            )}

            {/* Select wrapper */}
            <div 
                className={wrapperClasses}
                onClick={handleToggle}
                onKeyDown={handleKeyDown}
                tabIndex={disabled ? undefined : 0}
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-disabled={disabled}
            >
                <div className="select-value">
                    {renderSelectedValue()}
                </div>

                {/* Iconos */}
                <div className="select-icons">
                    {clearable && 
                     ((multiple && selectedOptions.length > 0) || (!multiple && selectedOptions)) && 
                     !disabled && (
                        <button
                            className="select-clear"
                            onClick={handleClear}
                            aria-label="Limpiar selección"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    )}
                    
                    <div className="select-arrow">
                        {loading ? (
                            <div className="select-spinner"></div>
                        ) : (
                            <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
                        )}
                    </div>
                </div>

                {/* Dropdown */}
                {isOpen && (
                    <div 
                        className="select-dropdown"
                        ref={dropdownRef}
                        role="listbox"
                    >
                        {/* Búsqueda */}
                        {searchable && (
                            <div className="select-search">
                                <i className="fas fa-search"></i>
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    placeholder="Buscar..."
                                    className="select-search-input"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                {searchQuery && (
                                    <button
                                        className="select-search-clear"
                                        onClick={() => setSearchQuery('')}
                                        aria-label="Limpiar búsqueda"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Lista de opciones */}
                        <div className="select-options">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option, index) => {
                                    const isSelected = multiple
                                        ? currentValue.includes(String(option.value))
                                        : String(currentValue) === String(option.value);
                                    
                                    const isHighlighted = index === highlightedIndex;

                                    return (
                                        <div
                                            key={option.value}
                                            className={`select-option 
                                                ${isSelected ? 'selected' : ''} 
                                                ${isHighlighted ? 'highlighted' : ''}
                                                ${option.disabled ? 'disabled' : ''}`}
                                            onClick={() => handleSelect(option)}
                                            role="option"
                                            aria-selected={isSelected}
                                            aria-disabled={option.disabled}
                                        >
                                            {option.icon && (
                                                <i className={`select-option-icon ${option.icon}`}></i>
                                            )}
                                            
                                            <span className="select-option-label">
                                                {option.label}
                                            </span>
                                            
                                            {option.description && (
                                                <span className="select-option-description">
                                                    {option.description}
                                                </span>
                                            )}
                                            
                                            {isSelected && (
                                                <i className="select-option-check fas fa-check"></i>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="select-no-results">
                                    <i className="fas fa-search"></i>
                                    <p>No se encontraron resultados</p>
                                    {searchQuery && (
                                        <button
                                            className="select-clear-search"
                                            onClick={() => setSearchQuery('')}
                                        >
                                            Limpiar búsqueda
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Info de selección múltiple */}
                        {multiple && selectedOptions.length > 0 && (
                            <div className="select-selected-info">
                                <span>
                                    {selectedOptions.length} seleccionados
                                </span>
                                <button
                                    className="select-clear-all"
                                    onClick={handleClear}
                                >
                                    Limpiar todos
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Input oculto para formularios */}
                <input
                    ref={ref}
                    type="hidden"
                    name={name}
                    value={multiple ? currentValue.join(',') : currentValue}
                    id={id}
                    {...props}
                />
            </div>

            {/* Helper text and error */}
            {(helperText || error) && (
                <div className={`select-helper ${helperClassName} ${error ? 'select-error-text' : ''}`}>
                    {error || helperText}
                </div>
            )}
        </div>
    );
});

Select.displayName = 'Select';

Select.propTypes = {
    options: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        label: PropTypes.string.isRequired,
        icon: PropTypes.string,
        description: PropTypes.string,
        disabled: PropTypes.bool
    })).isRequired,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))
    ]),
    defaultValue: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))
    ]),
    onChange: PropTypes.func,
    placeholder: PropTypes.string,
    label: PropTypes.string,
    helperText: PropTypes.string,
    error: PropTypes.string,
    disabled: PropTypes.bool,
    required: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    variant: PropTypes.oneOf(['default', 'filled', 'outline']),
    fullWidth: PropTypes.bool,
    multiple: PropTypes.bool,
    searchable: PropTypes.bool,
    clearable: PropTypes.bool,
    loading: PropTypes.bool,
    className: PropTypes.string,
    wrapperClassName: PropTypes.string,
    labelClassName: PropTypes.string,
    selectClassName: PropTypes.string,
    helperClassName: PropTypes.string,
    name: PropTypes.string,
    id: PropTypes.string
};

export default Select;