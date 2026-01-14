import React, { forwardRef, useState, useCallback, useMemo, useRef, useEffect, useImperativeHandle } from 'react';
import { clsx } from 'clsx';
import "../../assets/styles/global.css";
import PropTypes from 'prop-types';

const Input = forwardRef(({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  defaultValue,
  onChange,
  onBlur,
  onFocus,
  error,
  helperText,
  disabled = false,
  required = false,
  readOnly = false,
  success = false,
  successMessage,
  className = '',
  containerClassName = '',
  labelClassName = '',
  inputClassName = '',
  startIcon,
  endIcon,
  clearable = false,
  showPasswordToggle = false,
  maxLength,
  min,
  max,
  step,
  pattern,
  patternErrorMessage,
  multiline = false,
  rows = 3,
  resize = 'vertical',
  form,
  autoComplete = 'off',
  autoFocus = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'aria-labelledby': ariaLabelledBy,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
  onKeyDown,
  onKeyUp,
  onKeyPress,
  onPaste,
  onCopy,
  onCut,
  loading = false,
  validateOnBlur = true,
  validateOnChange = false,
  debounce = 0,
  inputMode,
  lang,
  dir,
  customValidation,
  ...props
}, ref) => {
  // ✅ REF INTERNO PARA MANEJAR VALIDACIONES - CORREGIDO: Tipado mejorado
  const internalRef = useRef(null);
  const [internalValue, setInternalValue] = useState(
    value === undefined ? (defaultValue || '') : value
  );
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [isTouched, setIsTouched] = useState(false);
  const debounceTimeoutRef = useRef(null);

  // ✅ VALIDACIÓN DE INPUT - DEFINIDA ANTES DE SER USADA
  const validateInput = useCallback((element) => {
    if (!element) return { valid: false, message: 'Elemento no disponible' };

    const validity = element.validity;

    if (customValidation) {
      const customResult = customValidation(element.value);
      if (customResult?.error) {
        setValidationMessage(customResult.message);
        return { valid: false, message: customResult.message };
      }
    }

    if (validity?.valid) {
      setValidationMessage('');
      return { valid: true, message: '' };
    }

    let message = '';

    // Validaciones nativas del navegador
    if (validity.valueMissing) {
      message = 'Este campo es requerido';
    } else if (validity.typeMismatch) {
      if (type === 'email') {
        message = 'Por favor ingresa un email válido';
      } else if (type === 'url') {
        message = 'Por favor ingresa una URL válida';
      } else {
        message = 'Por favor ingresa un valor válido';
      }
    } else if (validity.patternMismatch) {
      message = patternErrorMessage || 'El formato no es válido';
    } else if (validity.tooLong) {
      message = `Máximo ${maxLength} caracteres`;
    } else if (validity.tooShort) {
      message = `Mínimo ${element.minLength} caracteres`;
    } else if (validity.rangeOverflow) {
      message = `El valor máximo es ${max}`;
    } else if (validity.rangeUnderflow) {
      message = `El valor mínimo es ${min}`;
    } else if (validity.stepMismatch) {
      message = `El valor debe ser múltiplo de ${step}`;
    } else if (element.validationMessage) {
      message = element.validationMessage;
    }

    setValidationMessage(message);
    return { valid: false, message };
  }, [maxLength, min, max, step, patternErrorMessage, customValidation, type]);

  // ✅ EXPOSICIÓN DE MÉTODOS AL PADRE - CORREGIDO: Métodos más robustos
  useImperativeHandle(ref, () => ({
    focus: () => internalRef.current?.focus(),
    blur: () => internalRef.current?.blur(),
    validate: () => validateInput(internalRef.current),
    clear: () => handleClear(),
    getValue: () => internalValue,
    setValue: (newValue) => {
      const event = {
        target: { name, value: newValue },
        currentTarget: internalRef.current,
      };
      setInternalValue(newValue);
      if (onChange) {
        onChange(event);
      }
    },
    getNativeElement: () => internalRef.current,
    setError: (message) => setValidationMessage(message || ''),
    clearError: () => setValidationMessage(''),
  }));

  // ✅ SINCRONIZAR VALUE EXTERNO - CORREGIDO: Dependencias mejoradas
  useEffect(() => {
    if (value !== undefined && value !== internalValue) {
      setInternalValue(value);
    }
  }, [value]);

  // ✅ MANEJO DE CAMBIOS CON DEBOUNCE - CORREGIDO: Cleanup mejorado
  const handleChangeWithDebounce = useCallback((e) => {
    const newValue = e.target.value;
    setInternalValue(newValue);

    // Limpiar timeout anterior
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Validación en tiempo real si está habilitada
    if (validateOnChange && internalRef.current) {
      validateInput(internalRef.current);
    }

    // Aplicar debounce si está configurado
    if (debounce > 0) {
      debounceTimeoutRef.current = setTimeout(() => {
        if (onChange) {
          onChange(e);
        }
      }, debounce);
    } else if (onChange) {
      onChange(e);
    }
  }, [debounce, onChange, validateOnChange, validateInput]);

  // ✅ DETERMINAR TYPE REAL - CORREGIDO: Lógica simplificada
  const inputType = useMemo(() => {
    if (showPasswordToggle && type === 'password') {
      return showPassword ? 'text' : 'password';
    }
    return type;
  }, [type, showPasswordToggle, showPassword]);

  // ✅ CLASES CSS OPTIMIZADAS - CORREGIDO: Clases más específicas
  const inputClasses = useMemo(() => clsx(
    'input-base',
    `input-type-${inputType}`,
    {
      'input-error': error || validationMessage,
      'input-success': success && !error && !validationMessage,
      'input-focused': isFocused && !error && !validationMessage && !success,
      'input-disabled': disabled,
      'input-readonly': readOnly,
      'input-with-start-icon': startIcon,
      'input-with-end-icon': endIcon || (showPasswordToggle && type === 'password') || (clearable && internalValue),
      'input-loading': loading,
      [`input-resize-${resize}`]: multiline,
    },
    inputClassName,
    className
  ), [error, validationMessage, success, isFocused, disabled, readOnly, startIcon, 
    endIcon, showPasswordToggle, type, clearable, internalValue, loading, multiline, 
    resize, inputType, inputClassName, className]);

  // ✅ MANEJO DE BLUR CON VALIDACIÓN - CORREGIDO: Orden de ejecución
  const handleBlur = useCallback((e) => {
    setIsFocused(false);
    setIsTouched(true);

    if (validateOnBlur) {
      validateInput(e.target);
    }

    if (onBlur) onBlur(e);
  }, [onBlur, validateOnBlur, validateInput]);

  // ✅ MANEJO DE LIMPIEZA - CORREGIDO: Evento mejorado
  const handleClear = useCallback(() => {
    if (disabled || readOnly) return;

    const event = {
      target: {
        name,
        value: '',
        type: inputType
      },
      currentTarget: internalRef.current,
    };

    setInternalValue('');
    setValidationMessage('');

    if (internalRef.current) {
      internalRef.current.focus();
    }

    if (onChange) {
      onChange(event);
    }
  }, [name, onChange, disabled, readOnly, inputType]);

  // ✅ TOGGLE DE CONTRASEÑA - CORREGIDO: Accesibilidad mejorada
  const togglePasswordVisibility = useCallback(() => {
    if (disabled || readOnly) return;
    setShowPassword(prev => !prev);
  }, [disabled, readOnly]);

  // ✅ FOCUS MANAGEMENT - CORREGIDO: Manejo de estados
  const handleFocus = useCallback((e) => {
    if (disabled || readOnly) return;
    setIsFocused(true);
    if (onFocus) onFocus(e);
  }, [onFocus, disabled, readOnly]);

  // ✅ RENDERIZADO DE ICONOS - CORREGIDO: Accesibilidad mejorada
  const renderStartIcon = useMemo(() => {
    if (!startIcon) return null;

    return (
      <div 
        className="input-start-icon" 
        aria-hidden="true"
        role="presentation"
      >
        {loading ? (
          <div className="input-loading-spinner" aria-label="Cargando..."></div>
        ) : (
          startIcon
        )}
      </div>
    );
  }, [startIcon, loading]);

  const renderEndIcon = useMemo(() => {
    if (loading) {
      return (
        <div className="input-end-icon" aria-hidden="true">
          <div className="input-loading-spinner" role="status" aria-label="Cargando..." />
        </div>
      );
    }

    if (clearable && internalValue && !disabled && !readOnly) {
      return (
        <button
          type="button"
          onClick={handleClear}
          className="input-clear-button"
          tabIndex={-1}
          aria-label="Limpiar campo"
          disabled={disabled || readOnly}
          title="Limpiar campo"
        >
          <svg className="input-clear-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      );
    }

    if (showPasswordToggle && type === 'password') {
      return (
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="input-password-toggle"
          tabIndex={-1}
          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          disabled={disabled || readOnly}
          title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {showPassword ? (
            <svg className="input-password-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="input-password-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      );
    }

    if (endIcon) {
      return (
        <div className="input-end-icon" aria-hidden="true">
          {endIcon}
        </div>
      );
    }

    return null;
  }, [loading, clearable, internalValue, disabled, readOnly, showPasswordToggle,
    type, showPassword, endIcon, handleClear, togglePasswordVisibility]);

  // ✅ CONTADOR DE CARACTERES - CORREGIDO: Lógica mejorada
  const characterCounter = useMemo(() => {
    if (!maxLength) return null;

    const currentLength = String(internalValue || '').length;
    const isNearLimit = currentLength > maxLength * 0.9;
    const isOverLimit = currentLength > maxLength;

    return (
      <div
        className={clsx(
          'input-character-counter',
          {
            'input-character-counter-warning': isNearLimit && !isOverLimit,
            'input-character-counter-error': isOverLimit,
            'input-character-counter-normal': !isNearLimit && !isOverLimit,
          }
        )}
        aria-live="polite"
        aria-label={`${currentLength} de ${maxLength} caracteres utilizados`}
        role="status"
      >
        {currentLength} / {maxLength}
      </div>
    );
  }, [maxLength, internalValue]);

  // ✅ MENSAJES DE VALIDACIÓN - CORREGIDO: Lógica de visualización
  const errorMessage = error || validationMessage;
  const showErrorMessage = useMemo(() =>
    errorMessage && (isTouched || error),
    [errorMessage, isTouched, error]
  );

  const showSuccessMessage = useMemo(() =>
    success && successMessage && !errorMessage,
    [success, successMessage, errorMessage]
  );

  // ✅ CLEANUP DE TIMEOUT - CORREGIDO: Efecto de limpieza
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // ✅ COMPONENTE DE INPUT - CORREGIDO: Props mejorados
  const InputComponent = multiline ? 'textarea' : 'input';

  return (
    <div className={clsx('input-container', containerClassName)}>
      {/* ✅ LABEL CON ACCESIBILIDAD - CORREGIDO: Mejor estructura */}
      {label && (
        <div className="input-label-container">
          <label
            htmlFor={name}
            className={clsx(
              "input-label",
              {
                'input-label-error': showErrorMessage,
                'input-label-success': showSuccessMessage,
                'input-label-disabled': disabled,
                'input-label-required': required,
                'input-label-focused': isFocused,
              },
              labelClassName
            )}
            aria-hidden={disabled ? "true" : undefined}
          >
            {label}
            {required && (
              <span className="input-required-indicator" aria-hidden="true">*</span>
            )}
          </label>
          {required && (
            <span className="sr-only">Campo requerido</span>
          )}
        </div>
      )}

      {/* ✅ CONTENEDOR DE INPUT - CORREGIDO: Atributos data mejorados */}
      <div 
        className="input-wrapper" 
        data-disabled={disabled} 
        data-readonly={readOnly}
        data-focused={isFocused}
        data-error={!!showErrorMessage}
        data-success={!!showSuccessMessage}
      >
        {renderStartIcon}

        <InputComponent
          ref={internalRef}
          id={name}
          name={name}
          type={inputType}
          value={value !== undefined ? value : internalValue}
          defaultValue={defaultValue}
          onChange={handleChangeWithDebounce}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onKeyPress={onKeyPress}
          onPaste={onPaste}
          onCopy={onCopy}
          onCut={onCut}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          readOnly={readOnly}
          maxLength={maxLength}
          min={min}
          max={max}
          step={step}
          pattern={pattern}
          rows={multiline ? rows : undefined}
          form={form}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          inputMode={inputMode}
          lang={lang}
          dir={dir}
          className={inputClasses}
          aria-label={ariaLabel || label || `Campo ${name}`}
          aria-describedby={
            [
              ariaDescribedBy,
              showErrorMessage ? `${name}-error` : null,
              showSuccessMessage ? `${name}-success` : null,
              helperText ? `${name}-helper` : null,
              maxLength ? `${name}-counter` : null
            ].filter(Boolean).join(' ') || undefined
          }
          aria-labelledby={ariaLabelledBy}
          aria-invalid={ariaInvalid || (showErrorMessage ? 'true' : 'false')}
          aria-required={ariaRequired || required}
          aria-disabled={disabled}
          aria-readonly={readOnly}
          aria-busy={loading}
          data-testid={`input-${name}`}
          {...props}
        />

        {renderEndIcon}
      </div>

      {/* ✅ CONTADOR DE CARACTERES - CORREGIDO: Accesibilidad */}
      {characterCounter && (
        <div 
          id={`${name}-counter`} 
          className="sr-only"
          aria-live="polite"
        >
          {characterCounter.props['aria-label']}
        </div>
      )}

      {/* ✅ MENSAJES DE FEEDBACK - CORREGIDO: Estructura semántica */}
      {showErrorMessage && (
        <div
          id={`${name}-error`}
          className="input-error-message"
          role="alert"
          aria-live="polite"
        >
          <svg
            className="input-error-icon"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
            focusable="false"
          >
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {showSuccessMessage && (
        <div
          id={`${name}-success`}
          className="input-success-message"
          role="status"
          aria-live="polite"
        >
          <svg
            className="input-success-icon"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
            focusable="false"
          >
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {helperText && !showErrorMessage && !showSuccessMessage && (
        <p
          id={`${name}-helper`}
          className="input-helper-text"
        >
          {helperText}
        </p>
      )}
    </div>
  );
});

// ✅ PROP TYPES MEJORADOS - CORREGIDO: Validaciones más completas
Input.propTypes = {
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  name: PropTypes.string.isRequired,
  type: PropTypes.oneOf([
    'text', 'password', 'email', 'number', 'tel', 'url', 'search',
    'date', 'time', 'datetime-local', 'month', 'week', 'color', 'range'
  ]),
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
  error: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  helperText: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  readOnly: PropTypes.bool,
  success: PropTypes.bool,
  successMessage: PropTypes.string,
  className: PropTypes.string,
  containerClassName: PropTypes.string,
  labelClassName: PropTypes.string,
  inputClassName: PropTypes.string,
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  clearable: PropTypes.bool,
  showPasswordToggle: PropTypes.bool,
  maxLength: PropTypes.number,
  min: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  max: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  step: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  pattern: PropTypes.string,
  patternErrorMessage: PropTypes.string,
  multiline: PropTypes.bool,
  rows: PropTypes.number,
  resize: PropTypes.oneOf(['none', 'vertical', 'horizontal', 'both']),
  form: PropTypes.string,
  autoComplete: PropTypes.string,
  autoFocus: PropTypes.bool,
  'aria-label': PropTypes.string,
  'aria-describedby': PropTypes.string,
  'aria-labelledby': PropTypes.string,
  'aria-invalid': PropTypes.bool,
  'aria-required': PropTypes.bool,
  onKeyDown: PropTypes.func,
  onKeyUp: PropTypes.func,
  onKeyPress: PropTypes.func,
  onPaste: PropTypes.func,
  onCopy: PropTypes.func,
  onCut: PropTypes.func,
  loading: PropTypes.bool,
  validateOnBlur: PropTypes.bool,
  validateOnChange: PropTypes.bool,
  debounce: PropTypes.number,
  inputMode: PropTypes.oneOf([
    'none', 'text', 'decimal', 'numeric', 'tel', 'search', 'email', 'url'
  ]),
  lang: PropTypes.string,
  dir: PropTypes.oneOf(['ltr', 'rtl', 'auto']),
  customValidation: PropTypes.func,
};

Input.defaultProps = {
  type: 'text',
  disabled: false,
  required: false,
  readOnly: false,
  success: false,
  clearable: false,
  showPasswordToggle: false,
  multiline: false,
  rows: 3,
  resize: 'vertical',
  autoComplete: 'off',
  autoFocus: false,
  loading: false,
  validateOnBlur: true,
  validateOnChange: false,
  debounce: 0,
  dir: 'ltr',
};

Input.displayName = 'Input';

// ✅ COMPONENTE INPUTGROUP - CORREGIDO: Props y accesibilidad
const InputGroup = forwardRef(({
  children,
  label,
  error,
  className,
  role = 'group',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  orientation = 'horizontal',
  ...props
}, ref) => {
  const childrenArray = React.Children.toArray(children).filter(child =>
    React.isValidElement(child)
  );

  const groupId = useRef(`input-group-${Math.random().toString(36).substr(2, 9)}`).current;

  return (
    <div
      ref={ref}
      className={clsx(
        'input-group-container',
        `input-group-${orientation}`,
        className
      )}
      role={role}
      aria-label={ariaLabel || label}
      aria-describedby={ariaDescribedBy}
      aria-labelledby={label ? `${groupId}-label` : undefined}
      aria-invalid={error ? 'true' : 'false'}
      {...props}
    >
      {label && (
        <label
          id={`${groupId}-label`}
          className="input-group-label"
          htmlFor={childrenArray[0]?.props?.name}
        >
          {label}
        </label>
      )}
      <div className="input-group-wrapper">
        {childrenArray.map((child, index) => {
          const isFirst = index === 0;
          const isLast = index === childrenArray.length - 1;
          const isMiddle = !isFirst && !isLast;

          return React.cloneElement(child, {
            key: child.key || `${groupId}-child-${index}`,
            className: clsx(
              child.props.className,
              'input-group-item',
              isFirst && 'input-group-first',
              isLast && 'input-group-last',
              isMiddle && 'input-group-middle',
              orientation === 'horizontal' && 'input-group-horizontal',
              orientation === 'vertical' && 'input-group-vertical'
            ),
            'aria-describedby': [
              child.props['aria-describedby'],
              error ? `${groupId}-error` : null
            ].filter(Boolean).join(' ') || undefined,
          });
        })}
      </div>
      {error && (
        <p
          id={`${groupId}-error`}
          className="input-group-error"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
});

InputGroup.displayName = 'InputGroup';

InputGroup.propTypes = {
  children: PropTypes.node.isRequired,
  label: PropTypes.string,
  error: PropTypes.string,
  className: PropTypes.string,
  role: PropTypes.string,
  'aria-label': PropTypes.string,
  'aria-describedby': PropTypes.string,
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
};

Input.Group = InputGroup;

export default Input;