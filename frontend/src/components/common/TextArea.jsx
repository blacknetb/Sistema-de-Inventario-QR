import React, { forwardRef, useState } from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/Common/common.css';

const TextArea = forwardRef(({
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
    rows = 4,
    maxLength,
    showCount = false,
    autoSize = false,
    size = 'medium',
    variant = 'default',
    fullWidth = false,
    className = '',
    wrapperClassName = '',
    labelClassName = '',
    textareaClassName = '',
    helperClassName = '',
    name,
    id,
    ...props
}, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [internalValue, setInternalValue] = useState(defaultValue || '');

    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;
    const characterCount = String(currentValue).length;

    const handleChange = (e) => {
        if (!isControlled) {
            setInternalValue(e.target.value);
        }
        if (onChange) {
            onChange(e);
        }
    };

    const sizeClasses = {
        small: 'textarea-sm',
        medium: 'textarea-md',
        large: 'textarea-lg'
    };

    const variantClasses = {
        default: 'textarea-default',
        filled: 'textarea-filled',
        outline: 'textarea-outline'
    };

    const wrapperClasses = [
        'textarea-wrapper',
        sizeClasses[size],
        variantClasses[variant],
        fullWidth ? 'textarea-full-width' : '',
        disabled ? 'textarea-disabled' : '',
        readOnly ? 'textarea-readonly' : '',
        error ? 'textarea-error' : '',
        isFocused ? 'textarea-focused' : '',
        wrapperClassName
    ].filter(Boolean).join(' ');

    const textareaClasses = [
        'textarea',
        textareaClassName
    ].filter(Boolean).join(' ');

    return (
        <div className={`textarea-container ${className}`}>
            {/* Label */}
            {label && (
                <div className="textarea-label-row">
                    <label 
                        htmlFor={id}
                        className={`textarea-label ${labelClassName} ${required ? 'required' : ''}`}
                    >
                        {label}
                    </label>
                    
                    {showCount && maxLength && (
                        <span className="textarea-count">
                            {characterCount}/{maxLength}
                        </span>
                    )}
                </div>
            )}

            {/* TextArea wrapper */}
            <div className={wrapperClasses}>
                <textarea
                    ref={ref}
                    id={id}
                    name={name}
                    value={currentValue}
                    onChange={handleChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    readOnly={readOnly}
                    required={required}
                    rows={rows}
                    maxLength={maxLength}
                    className={textareaClasses}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    style={autoSize ? { 
                        height: 'auto',
                        minHeight: `${rows * 1.5}em`,
                        resize: 'none'
                    } : {}}
                    {...props}
                />
            </div>

            {/* Helper text and error */}
            {(helperText || error) && (
                <div className={`textarea-helper ${helperClassName} ${error ? 'textarea-error-text' : ''}`}>
                    {error || helperText}
                </div>
            )}

            {/* Contador de caracteres (si no hay label) */}
            {showCount && maxLength && !label && (
                <div className="textarea-count-footer">
                    <span className="textarea-count">
                        {characterCount}/{maxLength}
                    </span>
                </div>
            )}
        </div>
    );
});

TextArea.displayName = 'TextArea';

TextArea.propTypes = {
    value: PropTypes.string,
    defaultValue: PropTypes.string,
    onChange: PropTypes.func,
    placeholder: PropTypes.string,
    label: PropTypes.string,
    helperText: PropTypes.string,
    error: PropTypes.string,
    disabled: PropTypes.bool,
    readOnly: PropTypes.bool,
    required: PropTypes.bool,
    rows: PropTypes.number,
    maxLength: PropTypes.number,
    showCount: PropTypes.bool,
    autoSize: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    variant: PropTypes.oneOf(['default', 'filled', 'outline']),
    fullWidth: PropTypes.bool,
    className: PropTypes.string,
    wrapperClassName: PropTypes.string,
    labelClassName: PropTypes.string,
    textareaClassName: PropTypes.string,
    helperClassName: PropTypes.string,
    name: PropTypes.string,
    id: PropTypes.string
};

export default TextArea;