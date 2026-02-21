import React, { useState } from 'react';
import styles from './Input.module.css';

const Input = ({
  type = 'text',
  label,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  readOnly = false,
  icon,
  iconPosition = 'left',
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === 'password' && showPassword ? 'text' : type;

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const inputClasses = [
    styles.input,
    error ? styles.error : '',
    icon ? styles.hasIcon : '',
    icon && iconPosition === 'left' ? styles.iconLeft : '',
    icon && iconPosition === 'right' ? styles.iconRight : '',
    type === 'password' ? styles.hasPasswordToggle : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.inputContainer}>
      {label && (
        <label htmlFor={name} className={styles.label}>
          {label}
          {required && <span className={styles.required}> *</span>}
        </label>
      )}
      
      <div className={styles.inputWrapper}>
        {icon && iconPosition === 'left' && (
          <span className={`${styles.icon} ${styles.leftIcon}`}>{icon}</span>
        )}
        
        <input
          id={name}
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          className={inputClasses}
          {...props}
        />
        
        {icon && iconPosition === 'right' && (
          <span className={`${styles.icon} ${styles.rightIcon}`}>{icon}</span>
        )}
        
        {type === 'password' && (
          <button
            type="button"
            className={styles.passwordToggle}
            onClick={handleTogglePassword}
            tabIndex="-1"
          >
            {showPassword ? 'Ocultar' : 'Mostrar'}
          </button>
        )}
      </div>
      
      {(error || helperText) && (
        <p className={`${styles.helperText} ${error ? styles.errorText : ''}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};

export default Input;