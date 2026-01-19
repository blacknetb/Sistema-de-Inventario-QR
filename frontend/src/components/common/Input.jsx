import React, { useState, forwardRef } from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/Common/common.css';

const Input = forwardRef(({
    type = 'text',
    value,
    defaultValue,
    onChange,
    placeholder,
    label,
    helperText,
    error,
    disabled = false,
    readOnly = false,
    required = false,
    size = 'medium',
    variant = 'default',
    fullWidth = false,
    icon,
    iconPosition = 'left',
    clearable = false,
    onClear,
    className = '',
    wrapperClassName = '',
    labelClassName = '',
    inputClassName = '',
    helperClassName = '',
    prefix,
    suffix,
    min,
    max,
    step,
    pattern,
    autoComplete,
    autoFocus,
    name,
    id,
    ...props
}, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [internalValue, setInternalValue] = useState(defaultValue || '');

    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;

    const handleChange = (e) => {
        if (!isControlled) {
            setInternalValue(e.target.value);
        }
        if (onChange) {
            onChange(e);
        }
    };

    const handleClear = () => {
        if (!isControlled) {
            setInternalValue('');
        }
        if (onChange) {
            const event = {
                target: { value: '', name },
                preventDefault: () => {},
                stopPropagation: () => {}
            };
            onChange(event);
        }
        if (onClear) {
            onClear();
        }
    };

    const sizeClasses = {
        small: 'input-sm',
        medium: 'input-md',
        large: 'input-lg'
    };

    const variantClasses = {
        default: 'input-default',
        filled: 'input-filled',
        outline: 'input-outline',
        underline: 'input-underline'
    };

    const wrapperClasses = [
        'input-wrapper',
        sizeClasses[size],
        variantClasses[variant],
        fullWidth ? 'input-full-width' : '',
        disabled ? 'input-disabled' : '',
        readOnly ? 'input-readonly' : '',
        error ? 'input-error' : '',
        isFocused ? 'input-focused' : '',
        wrapperClassName
    ].filter(Boolean).join(' ');

    const inputClasses = [
        'input',
        inputClassName
    ].filter(Boolean).join(' ');

    const renderIcon = () => {
        if (!icon) return null;
        
        const iconElement = typeof icon === 'string' 
            ? <i className={icon}></i>
            : icon;
        
        return (
            <span className={`input-icon ${iconPosition}`}>
                {iconElement}
            </span>
        );
    };

    return (
        <div className={`input-container ${className}`}>
            {/* Label */}
            {label && (
                <label 
                    htmlFor={id}
                    className={`input-label ${labelClassName} ${required ? 'required' : ''}`}
                >
                    {label}
                </label>
            )}

            {/* Input wrapper */}
            <div className={wrapperClasses}>
                {/* Prefix */}
                {prefix && (
                    <span className="input-prefix">{prefix}</span>
                )}

                {/* Icon left */}
                {icon && iconPosition === 'left' && renderIcon()}

                {/* Input */}
                <input
                    ref={ref}
                    type={type}
                    id={id}
                    name={name}
                    value={currentValue}
                    onChange={handleChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    readOnly={readOnly}
                    required={required}
                    min={min}
                    max={max}
                    step={step}
                    pattern={pattern}
                    autoComplete={autoComplete}
                    autoFocus={autoFocus}
                    className={inputClasses}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...props}
                />

                {/* Icon right */}
                {icon && iconPosition === 'right' && renderIcon()}

                {/* Clear button */}
                {clearable && currentValue && !disabled && !readOnly && (
                    <button
                        type="button"
                        className="input-clear"
                        onClick={handleClear}
                        aria-label="Limpiar"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                )}

                {/* Suffix */}
                {suffix && (
                    <span className="input-suffix">{suffix}</span>
                )}
            </div>

            {/* Helper text and error */}
            {(helperText || error) && (
                <div className={`input-helper ${helperClassName} ${error ? 'input-error-text' : ''}`}>
                    {error || helperText}
                </div>
            )}
        </div>
    );
});

Input.displayName = 'Input';

Input.propTypes = {
    type: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onChange: PropTypes.func,
    placeholder: PropTypes.string,
    label: PropTypes.string,
    helperText: PropTypes.string,
    error: PropTypes.string,
    disabled: PropTypes.bool,
    readOnly: PropTypes.bool,
    required: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    variant: PropTypes.oneOf(['default', 'filled', 'outline', 'underline']),
    fullWidth: PropTypes.bool,
    icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    iconPosition: PropTypes.oneOf(['left', 'right']),
    clearable: PropTypes.bool,
    onClear: PropTypes.func,
    className: PropTypes.string,
    wrapperClassName: PropTypes.string,
    labelClassName: PropTypes.string,
    inputClassName: PropTypes.string,
    helperClassName: PropTypes.string,
    prefix: PropTypes.node,
    suffix: PropTypes.node,
    min: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    max: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    step: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    pattern: PropTypes.string,
    autoComplete: PropTypes.string,
    autoFocus: PropTypes.bool,
    name: PropTypes.string,
    id: PropTypes.string
};

export default Input;