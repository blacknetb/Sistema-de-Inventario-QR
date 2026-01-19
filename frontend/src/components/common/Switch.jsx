import React, { forwardRef, useState } from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/Common/common.css';

const Switch = forwardRef(({
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
    switchClassName = '',
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
        small: 'switch-sm',
        medium: 'switch-md',
        large: 'switch-lg'
    };

    const variantClasses = {
        primary: 'switch-primary',
        secondary: 'switch-secondary',
        success: 'switch-success',
        warning: 'switch-warning',
        danger: 'switch-danger',
        info: 'switch-info'
    };

    const wrapperClasses = [
        'switch-wrapper',
        sizeClasses[size],
        disabled ? 'switch-disabled' : '',
        error ? 'switch-error' : '',
        wrapperClassName
    ].filter(Boolean).join(' ');

    const switchClasses = [
        'switch',
        variantClasses[variant],
        currentChecked ? 'switch-checked' : '',
        switchClassName
    ].filter(Boolean).join(' ');

    return (
        <div className={`switch-container ${className}`}>
            <div className={wrapperClasses}>
                {/* Switch input */}
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
                    className="switch-input"
                    aria-invalid={!!error}
                    role="switch"
                    aria-checked={currentChecked}
                    {...props}
                />

                {/* Custom switch */}
                <span className={switchClasses}>
                    <span className="switch-slider"></span>
                    <span className="switch-thumb"></span>
                </span>

                {/* Label */}
                {label && (
                    <label 
                        htmlFor={id}
                        className={`switch-label ${labelClassName} ${required ? 'required' : ''}`}
                    >
                        {label}
                    </label>
                )}
            </div>

            {/* Helper text and error */}
            {(helperText || error) && (
                <div className={`switch-helper ${helperClassName} ${error ? 'switch-error-text' : ''}`}>
                    {error || helperText}
                </div>
            )}
        </div>
    );
});

Switch.displayName = 'Switch';

Switch.propTypes = {
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
    switchClassName: PropTypes.string,
    helperClassName: PropTypes.string,
    name: PropTypes.string,
    id: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default Switch;