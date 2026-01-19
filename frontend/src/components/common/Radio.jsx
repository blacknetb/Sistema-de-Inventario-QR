import React, { forwardRef, useState } from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/Common/common.css';

const Radio = forwardRef(({
    checked,
    defaultChecked = false,
    onChange,
    label,
    helperText,
    error,
    disabled = false,
    required = false,
    size = 'medium',
    variant = 'primary',
    className = '',
    wrapperClassName = '',
    labelClassName = '',
    radioClassName = '',
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
        small: 'radio-sm',
        medium: 'radio-md',
        large: 'radio-lg'
    };

    const variantClasses = {
        primary: 'radio-primary',
        secondary: 'radio-secondary',
        success: 'radio-success',
        warning: 'radio-warning',
        danger: 'radio-danger',
        info: 'radio-info'
    };

    const wrapperClasses = [
        'radio-wrapper',
        sizeClasses[size],
        disabled ? 'radio-disabled' : '',
        error ? 'radio-error' : '',
        wrapperClassName
    ].filter(Boolean).join(' ');

    const radioClasses = [
        'radio',
        variantClasses[variant],
        currentChecked ? 'radio-checked' : '',
        radioClassName
    ].filter(Boolean).join(' ');

    return (
        <div className={`radio-container ${className}`}>
            <div className={wrapperClasses}>
                {/* Radio input */}
                <input
                    ref={ref}
                    type="radio"
                    id={id}
                    name={name}
                    checked={currentChecked}
                    onChange={handleChange}
                    disabled={disabled}
                    required={required}
                    value={value}
                    className="radio-input"
                    aria-invalid={!!error}
                    {...props}
                />

                {/* Custom radio */}
                <span className={radioClasses}>
                    {currentChecked && (
                        <span className="radio-dot"></span>
                    )}
                </span>

                {/* Label */}
                {label && (
                    <label 
                        htmlFor={id}
                        className={`radio-label ${labelClassName} ${required ? 'required' : ''}`}
                    >
                        {label}
                    </label>
                )}
            </div>

            {/* Helper text and error */}
            {(helperText || error) && (
                <div className={`radio-helper ${helperClassName} ${error ? 'radio-error-text' : ''}`}>
                    {error || helperText}
                </div>
            )}
        </div>
    );
});

Radio.displayName = 'Radio';

Radio.propTypes = {
    checked: PropTypes.bool,
    defaultChecked: PropTypes.bool,
    onChange: PropTypes.func,
    label: PropTypes.string,
    helperText: PropTypes.string,
    error: PropTypes.string,
    disabled: PropTypes.bool,
    required: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'warning', 'danger', 'info']),
    className: PropTypes.string,
    wrapperClassName: PropTypes.string,
    labelClassName: PropTypes.string,
    radioClassName: PropTypes.string,
    helperClassName: PropTypes.string,
    name: PropTypes.string,
    id: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

// Radio Group Component
export const RadioGroup = ({
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
    const [selectedValue, setSelectedValue] = useState(defaultValue || '');

    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : selectedValue;

    const handleRadioChange = (optionValue) => {
        if (!isControlled) {
            setSelectedValue(optionValue);
        }

        if (onChange) {
            const event = {
                target: {
                    value: optionValue,
                    name,
                    type: 'radio'
                }
            };
            onChange(event);
        }
    };

    return (
        <div className={`radio-group-container ${className}`}>
            {/* Group label */}
            {label && (
                <label 
                    className={`radio-group-label ${labelClassName} ${required ? 'required' : ''}`}
                >
                    {label}
                </label>
            )}

            {/* Radios */}
            <div className={`radio-group ${groupClassName} ${direction}`}>
                {options.map((option, index) => {
                    const isChecked = String(currentValue) === String(option.value);
                    
                    return (
                        <Radio
                            key={option.value}
                            checked={isChecked}
                            onChange={() => handleRadioChange(option.value)}
                            label={option.label}
                            disabled={disabled || option.disabled}
                            size={size}
                            variant={variant}
                            name={name || id}
                            id={`${id || name}_${option.value}`}
                            value={option.value}
                        />
                    );
                })}
            </div>

            {/* Helper text and error */}
            {(helperText || error) && (
                <div className={`radio-group-helper ${helperClassName} ${error ? 'radio-error-text' : ''}`}>
                    {error || helperText}
                </div>
            )}
        </div>
    );
};

RadioGroup.propTypes = {
    options: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        label: PropTypes.string.isRequired,
        disabled: PropTypes.bool
    })).isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
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

export default Radio;
export { RadioGroup };