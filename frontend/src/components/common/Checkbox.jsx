import React, { forwardRef, useState } from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/Common/common.css';

const Checkbox = forwardRef(({
    checked,
    defaultChecked = false,
    onChange,
    label,
    helperText,
    error,
    disabled = false,
    required = false,
    indeterminate = false,
    size = 'medium',
    variant = 'primary',
    className = '',
    wrapperClassName = '',
    labelClassName = '',
    checkboxClassName = '',
    helperClassName = '',
    name,
    id,
    value,
    ...props
}, ref) => {
    const [isChecked, setIsChecked] = useState(defaultChecked);

    const isControlled = checked !== undefined;
    const currentChecked = isControlled ? checked : isChecked;

    const handleChange = (e) => {
        if (disabled) return;

        const newChecked = e.target.checked;
        
        if (!isControlled) {
            setIsChecked(newChecked);
        }
        
        if (onChange) {
            onChange(e);
        }
    };

    const sizeClasses = {
        small: 'checkbox-sm',
        medium: 'checkbox-md',
        large: 'checkbox-lg'
    };

    const variantClasses = {
        primary: 'checkbox-primary',
        secondary: 'checkbox-secondary',
        success: 'checkbox-success',
        warning: 'checkbox-warning',
        danger: 'checkbox-danger',
        info: 'checkbox-info'
    };

    const wrapperClasses = [
        'checkbox-wrapper',
        sizeClasses[size],
        disabled ? 'checkbox-disabled' : '',
        error ? 'checkbox-error' : '',
        wrapperClassName
    ].filter(Boolean).join(' ');

    const checkboxClasses = [
        'checkbox',
        variantClasses[variant],
        currentChecked ? 'checkbox-checked' : '',
        indeterminate ? 'checkbox-indeterminate' : '',
        checkboxClassName
    ].filter(Boolean).join(' ');

    return (
        <div className={`checkbox-container ${className}`}>
            <div className={wrapperClasses}>
                {/* Checkbox input */}
                <input
                    ref={ref}
                    type="checkbox"
                    id={id}
                    name={name}
                    checked={currentChecked}
                    onChange={handleChange}
                    disabled={disabled}
                    required={required}
                    value={value}
                    className="checkbox-input"
                    aria-invalid={!!error}
                    {...props}
                />

                {/* Custom checkbox */}
                <span className={checkboxClasses}>
                    {currentChecked && !indeterminate && (
                        <i className="fas fa-check checkbox-icon"></i>
                    )}
                    {indeterminate && (
                        <i className="fas fa-minus checkbox-icon"></i>
                    )}
                </span>

                {/* Label */}
                {label && (
                    <label 
                        htmlFor={id}
                        className={`checkbox-label ${labelClassName} ${required ? 'required' : ''}`}
                    >
                        {label}
                    </label>
                )}
            </div>

            {/* Helper text and error */}
            {(helperText || error) && (
                <div className={`checkbox-helper ${helperClassName} ${error ? 'checkbox-error-text' : ''}`}>
                    {error || helperText}
                </div>
            )}
        </div>
    );
});

Checkbox.displayName = 'Checkbox';

Checkbox.propTypes = {
    checked: PropTypes.bool,
    defaultChecked: PropTypes.bool,
    onChange: PropTypes.func,
    label: PropTypes.string,
    helperText: PropTypes.string,
    error: PropTypes.string,
    disabled: PropTypes.bool,
    required: PropTypes.bool,
    indeterminate: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'warning', 'danger', 'info']),
    className: PropTypes.string,
    wrapperClassName: PropTypes.string,
    labelClassName: PropTypes.string,
    checkboxClassName: PropTypes.string,
    helperClassName: PropTypes.string,
    name: PropTypes.string,
    id: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

// Checkbox Group Component
export const CheckboxGroup = ({
    options,
    value,
    defaultValue,
    onChange,
    label,
    helperText,
    error,
    disabled = false,
    required = false,
    size = 'medium',
    variant = 'primary',
    direction = 'vertical',
    className = '',
    labelClassName = '',
    groupClassName = '',
    helperClassName = '',
    name,
    id
}) => {
    const [selectedValues, setSelectedValues] = useState(defaultValue || []);

    const isControlled = value !== undefined;
    const currentValues = isControlled ? value : selectedValues;

    const handleCheckboxChange = (optionValue, isChecked) => {
        let newValues;
        
        if (isChecked) {
            newValues = [...currentValues, optionValue];
        } else {
            newValues = currentValues.filter(val => val !== optionValue);
        }

        if (!isControlled) {
            setSelectedValues(newValues);
        }

        if (onChange) {
            const event = {
                target: {
                    value: newValues,
                    name,
                    type: 'checkbox-group'
                }
            };
            onChange(event);
        }
    };

    return (
        <div className={`checkbox-group-container ${className}`}>
            {/* Group label */}
            {label && (
                <label 
                    className={`checkbox-group-label ${labelClassName} ${required ? 'required' : ''}`}
                >
                    {label}
                </label>
            )}

            {/* Checkboxes */}
            <div className={`checkbox-group ${groupClassName} ${direction}`}>
                {options.map((option, index) => {
                    const isChecked = currentValues.includes(option.value);
                    
                    return (
                        <Checkbox
                            key={option.value}
                            checked={isChecked}
                            onChange={(e) => handleCheckboxChange(option.value, e.target.checked)}
                            label={option.label}
                            disabled={disabled || option.disabled}
                            size={size}
                            variant={variant}
                            name={`${name || id}[${index}]`}
                            id={`${id || name}_${option.value}`}
                            value={option.value}
                        />
                    );
                })}
            </div>

            {/* Helper text and error */}
            {(helperText || error) && (
                <div className={`checkbox-group-helper ${helperClassName} ${error ? 'checkbox-error-text' : ''}`}>
                    {error || helperText}
                </div>
            )}
        </div>
    );
};

CheckboxGroup.propTypes = {
    options: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        label: PropTypes.string.isRequired,
        disabled: PropTypes.bool
    })).isRequired,
    value: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    defaultValue: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    onChange: PropTypes.func,
    label: PropTypes.string,
    helperText: PropTypes.string,
    error: PropTypes.string,
    disabled: PropTypes.bool,
    required: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'warning', 'danger', 'info']),
    direction: PropTypes.oneOf(['vertical', 'horizontal']),
    className: PropTypes.string,
    labelClassName: PropTypes.string,
    groupClassName: PropTypes.string,
    helperClassName: PropTypes.string,
    name: PropTypes.string,
    id: PropTypes.string
};

export default Checkbox;
export { CheckboxGroup };