import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import '../../assets/styles/variables.css';
import '../../assets/styles/global.css';
import '../../assets/styles/base.css';
import '../../assets/styles/animations.css';

/**
 * ✅ COMPONENTE SELECT OPTIMIZADO
 */

// ✅ COMPONENTE PRINCIPAL CON REF FORWARDING
const Select = React.forwardRef(({
  options = [],
  value = null,
  onChange = () => {},
  multiple = false,
  searchable = false,
  placeholder = 'Seleccionar...',
  size = 'md',
  variant = 'outlined',
  state = 'default',
  loading = false,
  disabled = false,
  className = '',
  label = '',
  errorMessage = '',
  helpText = '',
  required = false,
  ...props
}, forwardedRef) => {
  // ✅ REFERENCIAS
  const selectRef = useRef(null);
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // ✅ ESTADOS
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [internalValue, setInternalValue] = useState(() => {
    if (multiple) return Array.isArray(value) ? value : [];
    return value;
  });

  // ✅ SINCRONIZAR VALOR EXTERNO/INTERNO
  useEffect(() => {
    if (multiple) {
      setInternalValue(Array.isArray(value) ? value : []);
    } else {
      setInternalValue(value);
    }
  }, [value, multiple]);

  // ✅ FILTRAR OPCIONES - OPTIMIZADO
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;

    const term = searchTerm.toLowerCase().trim();
    return options.filter(option => {
      if (!option || typeof option !== 'object') return false;
      
      const labelMatch = option.label?.toLowerCase().includes(term);
      const valueMatch = option.value?.toString().toLowerCase().includes(term);
      const descriptionMatch = option.description?.toLowerCase().includes(term);
      
      return labelMatch || valueMatch || descriptionMatch;
    });
  }, [options, searchTerm]);

  // ✅ ETIQUETAS SELECCIONADAS - OPTIMIZADO
  const selectedLabels = useMemo(() => {
    if (multiple) {
      return options
        .filter(opt => internalValue.includes(opt.value))
        .map(opt => opt.label)
        .join(', ');
    }

    const selected = options.find(opt => opt.value === internalValue);
    return selected ? selected.label : '';
  }, [options, internalValue, multiple]);

  // ✅ CLICK FUERA PARA CERRAR - OPTIMIZADO
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!isOpen) return;
      
      const isOutsideDropdown = dropdownRef.current && 
        !dropdownRef.current.contains(event.target);
      const isOutsideSelect = selectRef.current && 
        !selectRef.current.contains(event.target);
      
      if (isOutsideDropdown && isOutsideSelect) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
    
    return undefined;
  }, [isOpen]);

  // ✅ NAVEGACIÓN CON TECLADO - MEJORADA
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen) return;
      
      // Solo manejar si el foco está dentro del select
      const isFocusInSelect = selectRef.current?.contains(document.activeElement) || 
                              dropdownRef.current?.contains(document.activeElement);
      
      if (!isFocusInSelect) return;

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          setSearchTerm('');
          selectRef.current?.focus();
          break;
          
        case 'ArrowDown':
          event.preventDefault();
          if (filteredOptions.length > 0) {
            setHighlightedIndex(prev => 
              prev < filteredOptions.length - 1 ? prev + 1 : 0
            );
          }
          break;
          
        case 'ArrowUp':
          event.preventDefault();
          if (filteredOptions.length > 0) {
            setHighlightedIndex(prev => 
              prev > 0 ? prev - 1 : filteredOptions.length - 1
            );
          }
          break;
          
        case 'Enter':
          event.preventDefault();
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            handleSelect(filteredOptions[highlightedIndex].value);
          } else if (filteredOptions.length === 1) {
            handleSelect(filteredOptions[0].value);
          }
          break;
          
        case 'Tab':
          if (isOpen) {
            setIsOpen(false);
            setSearchTerm('');
          }
          break;
          
        default:
          // Para búsqueda rápida
          if (searchable && event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
            searchInputRef.current?.focus();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, filteredOptions, highlightedIndex, searchable]);

  // ✅ MANEJAR SELECCIÓN - OPTIMIZADO
  const handleSelect = useCallback((selectedValue) => {
    if (disabled || loading) return;
    
    let newValue;
    
    if (multiple) {
      const currentValues = Array.isArray(internalValue) ? internalValue : [];
      newValue = currentValues.includes(selectedValue)
        ? currentValues.filter(v => v !== selectedValue)
        : [...currentValues, selectedValue];
    } else {
      newValue = selectedValue;
      setIsOpen(false);
      setSearchTerm('');
      selectRef.current?.focus();
    }
    
    setInternalValue(newValue);
    onChange(newValue);
    setHighlightedIndex(-1);
  }, [multiple, internalValue, onChange, disabled, loading]);

  // ✅ REMOVER OPCIÓN SELECCIONADA
  const removeSelected = useCallback((valueToRemove, event) => {
    event.stopPropagation();
    
    if (disabled || loading) return;
    
    const newValue = internalValue.filter(v => v !== valueToRemove);
    setInternalValue(newValue);
    onChange(newValue);
  }, [internalValue, onChange, disabled, loading]);

  // ✅ LIMPIAR TODAS LAS SELECCIONES
  const clearAll = useCallback((event) => {
    event.stopPropagation();
    
    if (disabled || loading) return;
    
    const newValue = multiple ? [] : null;
    setInternalValue(newValue);
    onChange(newValue);
    setSearchTerm('');
  }, [multiple, onChange, disabled, loading]);

  // ✅ TOGGLE DROPDOWN
  const toggleDropdown = useCallback((event) => {
    if (disabled || loading) return;
    
    event.stopPropagation();
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    if (newIsOpen) {
      setHighlightedIndex(-1);
      setTimeout(() => {
        if (searchable) {
          searchInputRef.current?.focus();
        }
      }, 100);
    } else {
      setSearchTerm('');
      selectRef.current?.focus();
    }
  }, [isOpen, disabled, loading, searchable]);

  // ✅ CLASES CSS - OPTIMIZADAS
  const selectClasses = useMemo(() => {
    return clsx(
      'select-container',
      `select-size-${size}`,
      `select-variant-${variant}`,
      `select-state-${state}`,
      {
        'select-open': isOpen,
        'select-disabled': disabled || loading,
        'select-multiple': multiple,
        'select-searchable': searchable,
        'select-has-value': multiple ? internalValue.length > 0 : internalValue !== null && internalValue !== '',
        'select-has-error': state === 'error' || !!errorMessage,
        'select-has-label': !!label
      },
      className
    );
  }, [size, variant, state, isOpen, disabled, loading, multiple, 
      searchable, internalValue, errorMessage, label, className]);

  // ✅ RENDERIZAR OPCIONES
  const renderOptions = useMemo(() => {
    if (loading) {
      return (
        <div className="select-loading" role="status" aria-label="Cargando opciones">
          <div className="select-loading-spinner" />
          <span>Cargando opciones...</span>
        </div>
      );
    }

    if (!Array.isArray(filteredOptions) || filteredOptions.length === 0) {
      return (
        <div className="select-no-options" role="status" aria-label="Sin opciones">
          No hay opciones disponibles
          {searchTerm && searchTerm.trim() && (
            <div className="select-search-no-results">
              para "{searchTerm}"
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="select-options-list" role="listbox" aria-multiselectable={multiple}>
        {filteredOptions.map((option, index) => {
          if (!option || typeof option !== 'object') return null;
          
          const isSelected = multiple
            ? internalValue.includes(option.value)
            : internalValue === option.value;
          
          const isHighlighted = index === highlightedIndex;
          const isDisabled = option.disabled || false;

          return (
            <div
              key={`option-${option.value}-${index}`}
              className={clsx('select-option', {
                'select-option-selected': isSelected,
                'select-option-highlighted': isHighlighted && !isDisabled,
                'select-option-disabled': isDisabled,
                'select-option-focused': isHighlighted
              })}
              onClick={(e) => {
                e.stopPropagation();
                if (!isDisabled) {
                  handleSelect(option.value);
                }
              }}
              onMouseEnter={() => !isDisabled && setHighlightedIndex(index)}
              role="option"
              tabIndex={isDisabled ? -1 : 0}
              aria-selected={isSelected}
              aria-disabled={isDisabled}
              data-value={option.value}
            >
              {multiple && (
                <div className="select-option-checkbox">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    disabled={isDisabled}
                    tabIndex={-1}
                  />
                </div>
              )}

              <div className="select-option-content">
                <span className="select-option-label">{option.label}</span>
                {option.description && (
                  <span className="select-option-description">
                    {option.description}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [loading, filteredOptions, searchTerm, multiple, internalValue, 
      highlightedIndex, handleSelect]);

  // ✅ RENDERIZAR TAGS SELECCIONADOS
  const renderSelectedTags = useMemo(() => {
    if (!multiple || !Array.isArray(internalValue) || internalValue.length === 0) {
      return null;
    }

    return (
      <div className="select-selected-tags" role="list" aria-label="Opciones seleccionadas">
        {internalValue.map((val, index) => {
          const option = options.find(opt => opt.value === val);
          if (!option) return null;

          return (
            <div key={`tag-${val}-${index}`} className="select-tag" role="listitem">
              <span className="select-tag-label">{option.label}</span>
              <button
                type="button"
                className="select-tag-remove"
                onClick={(e) => removeSelected(val, e)}
                aria-label={`Remover ${option.label}`}
                disabled={disabled || loading}
                tabIndex={isOpen ? 0 : -1}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    );
  }, [multiple, internalValue, options, removeSelected, disabled, loading, isOpen]);

  // ✅ COMBINAR REFS
  const setRefs = useCallback((node) => {
    selectRef.current = node;
    if (typeof forwardedRef === 'function') {
      forwardedRef(node);
    } else if (forwardedRef) {
      forwardedRef.current = node;
    }
  }, [forwardedRef]);

  return (
    <div className={selectClasses} ref={setRefs}>
      {label && (
        <label className="select-label" htmlFor={`select-${label.replace(/\s+/g, '-')}`}>
          {label}
          {required && <span className="select-required" aria-hidden="true">*</span>}
        </label>
      )}

      <div
        className="select-trigger"
        onClick={toggleDropdown}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleDropdown(e);
          }
        }}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="select-dropdown"
        aria-disabled={disabled || loading}
        aria-label={label || placeholder}
        tabIndex={disabled || loading ? -1 : 0}
        id={label ? `select-${label.replace(/\s+/g, '-')}` : undefined}
        {...props}
      >
        <div className="select-trigger-content">
          {multiple ? (
            internalValue.length > 0 ? (
              renderSelectedTags
            ) : (
              <span className="select-placeholder">{placeholder}</span>
            )
          ) : (
            <span className={selectedLabels ? 'select-value' : 'select-placeholder'}>
              {selectedLabels || placeholder}
            </span>
          )}
        </div>

        <div className="select-indicators">
          {(internalValue !== null && internalValue !== '' && 
            (multiple ? internalValue.length > 0 : true) && 
            !disabled && !loading) && (
            <button
              type="button"
              className="select-clear"
              onClick={clearAll}
              aria-label="Limpiar selección"
              disabled={disabled || loading}
              tabIndex={isOpen ? 0 : -1}
            >
              ×
            </button>
          )}

          <span className="select-separator" aria-hidden="true" />

          <div className="select-arrow" aria-hidden="true">
            {loading ? (
              <div className="select-loading-indicator" />
            ) : (
              <span className="select-arrow-icon">▼</span>
            )}
          </div>
        </div>
      </div>

      {isOpen && (
        <div 
          className="select-dropdown" 
          ref={dropdownRef}
          id="select-dropdown"
          role="listbox"
          aria-label="Opciones"
        >
          {searchable && (
            <div className="select-search">
              <input
                ref={searchInputRef}
                type="text"
                className="select-search-input"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                aria-label="Buscar opciones"
              />
            </div>
          )}

          <div className="select-options-container">
            {renderOptions}
          </div>
        </div>
      )}

      {(errorMessage || helpText) && (
        <div className="select-messages" role="alert">
          {errorMessage && (
            <div className="select-error-message" aria-live="polite">
              {errorMessage}
            </div>
          )}
          {helpText && !errorMessage && (
            <div className="select-help-text" aria-live="polite">
              {helpText}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

Select.displayName = 'Select';

// ✅ COMPONENTE ASYNC SELECT
export const AsyncSelect = React.forwardRef(({ 
  loadOptions, 
  debounceDelay = 300,
  minChars = 0,
  ...props 
}, ref) => {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const debounceTimerRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const loadData = useCallback(async (search = '') => {
    if (!mountedRef.current) return;
    
    setLoading(true);
    try {
      const data = await loadOptions(search);
      if (mountedRef.current) {
        setOptions(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading options:', error);
      if (mountedRef.current) {
        setOptions([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [loadOptions]);

  // Cargar datos iniciales
  useEffect(() => {
    loadData('');
  }, [loadData]);

  // Debounce para búsqueda
  const handleSearchChange = useCallback((search) => {
    setSearchTerm(search);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    if (search.length >= minChars || search.length === 0) {
      debounceTimerRef.current = setTimeout(() => {
        loadData(search);
      }, debounceDelay);
    }
  }, [loadData, debounceDelay, minChars]);

  return (
    <Select
      ref={ref}
      {...props}
      options={options}
      loading={loading}
      searchable={true}
      onSearch={handleSearchChange}
    />
  );
});

AsyncSelect.displayName = 'AsyncSelect';

// ✅ ASIGNACIÓN DE COMPONENTES
Select.Async = AsyncSelect;

// ✅ PROPTYPES COMPLETOS
Select.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]).isRequired,
      label: PropTypes.string.isRequired,
      disabled: PropTypes.bool,
      description: PropTypes.string
    })
  ),
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.bool,
    PropTypes.array
  ]),
  onChange: PropTypes.func,
  multiple: PropTypes.bool,
  searchable: PropTypes.bool,
  placeholder: PropTypes.string,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  variant: PropTypes.oneOf(['primary', 'secondary', 'outlined', 'filled']),
  state: PropTypes.oneOf(['default', 'error', 'success', 'warning', 'disabled']),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  label: PropTypes.string,
  errorMessage: PropTypes.string,
  helpText: PropTypes.string,
  required: PropTypes.bool
};

// ✅ VALORES POR DEFECTO
Select.defaultProps = {
  options: [],
  value: null,
  onChange: () => {},
  multiple: false,
  searchable: false,
  placeholder: 'Seleccionar...',
  size: 'md',
  variant: 'outlined',
  state: 'default',
  loading: false,
  disabled: false,
  className: '',
  label: '',
  errorMessage: '',
  helpText: '',
  required: false
};

export default Select;