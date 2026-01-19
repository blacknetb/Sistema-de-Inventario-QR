import React, { useState, useEffect, useRef, forwardRef } from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/Common/common.css';

const DatePicker = forwardRef(({
    value,
    defaultValue,
    onChange,
    placeholder = 'Seleccionar fecha',
    label,
    helperText,
    error,
    disabled = false,
    required = false,
    size = 'medium',
    variant = 'default',
    fullWidth = false,
    format = 'DD/MM/YYYY',
    minDate,
    maxDate,
    showClearButton = true,
    showTodayButton = true,
    locale = 'es',
    className = '',
    wrapperClassName = '',
    labelClassName = '',
    inputClassName = '',
    helperClassName = '',
    name,
    id,
    ...props
}, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(defaultValue || null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [view, setView] = useState('days'); // 'days', 'months', 'years'
    
    const datepickerRef = useRef(null);
    const inputRef = useRef(null);

    const isControlled = value !== undefined;
    const currentDate = isControlled ? value : selectedDate;

    // Configuración de locale
    const localeConfig = {
        es: {
            days: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'],
            months: [
                'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
            ],
            monthsShort: [
                'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
            ],
            today: 'Hoy',
            clear: 'Limpiar'
        }
    };

    const config = localeConfig[locale] || localeConfig.es;

    // Formatear fecha
    const formatDate = (date) => {
        if (!date) return '';
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        return format
            .replace('DD', day)
            .replace('MM', month)
            .replace('YYYY', year);
    };

    // Parsear fecha
    const parseDate = (str) => {
        if (!str) return null;
        
        const parts = str.split(/[/\-.]/);
        if (parts.length !== 3) return null;
        
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        
        if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
        
        const date = new Date(year, month, day);
        if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
            return null;
        }
        
        return date;
    };

    // Obtener días del mes
    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    // Generar matriz de días
    const generateDaysMatrix = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = getDaysInMonth(year, month);
        
        const matrix = [];
        let week = [];
        
        // Días del mes anterior
        const firstDayOfWeek = firstDay.getDay();
        const prevMonthDays = getDaysInMonth(year, month - 1);
        
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            week.push({
                date: new Date(year, month - 1, prevMonthDays - i),
                isCurrentMonth: false,
                isToday: false,
                isSelected: false,
                isDisabled: false
            });
        }
        
        // Días del mes actual
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday = date.getTime() === today.getTime();
            const isSelected = currentDate && date.getTime() === currentDate.getTime();
            const isDisabled = 
                (minDate && date < minDate) || 
                (maxDate && date > maxDate);
            
            week.push({
                date,
                isCurrentMonth: true,
                isToday,
                isSelected,
                isDisabled
            });
            
            if (week.length === 7) {
                matrix.push(week);
                week = [];
            }
        }
        
        // Días del mes siguiente
        let nextDay = 1;
        while (week.length < 7) {
            const date = new Date(year, month + 1, nextDay);
            week.push({
                date,
                isCurrentMonth: false,
                isToday: false,
                isSelected: false,
                isDisabled: false
            });
            nextDay++;
        }
        
        if (week.length > 0) {
            matrix.push(week);
        }
        
        return matrix;
    };

    // Manejar selección de fecha
    const handleDateSelect = (date) => {
        if (!isControlled) {
            setSelectedDate(date);
        }
        
        if (onChange) {
            const event = {
                target: {
                    value: date,
                    name,
                    type: 'date'
                }
            };
            onChange(event);
        }
        
        setIsOpen(false);
    };

    // Manejar cambio de mes
    const handleMonthChange = (increment) => {
        const newMonth = new Date(currentMonth);
        if (view === 'days') {
            newMonth.setMonth(newMonth.getMonth() + increment);
            setCurrentMonth(newMonth);
        } else if (view === 'months') {
            newMonth.setFullYear(newMonth.getFullYear() + increment);
            setCurrentMonth(newMonth);
        } else if (view === 'years') {
            newMonth.setFullYear(newMonth.getFullYear() + (increment * 12));
            setCurrentMonth(newMonth);
        }
    };

    // Manejar cambio de vista
    const handleViewChange = (newView) => {
        setView(newView);
    };

    // Limpiar fecha
    const handleClear = () => {
        if (!isControlled) {
            setSelectedDate(null);
        }
        
        if (onChange) {
            const event = {
                target: {
                    value: null,
                    name,
                    type: 'date'
                }
            };
            onChange(event);
        }
    };

    // Seleccionar hoy
    const handleToday = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        handleDateSelect(today);
    };

    // Cerrar al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (datepickerRef.current && !datepickerRef.current.contains(event.target)) {
                setIsOpen(false);
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
        small: 'datepicker-sm',
        medium: 'datepicker-md',
        large: 'datepicker-lg'
    };

    const variantClasses = {
        default: 'datepicker-default',
        filled: 'datepicker-filled',
        outline: 'datepicker-outline'
    };

    const wrapperClasses = [
        'datepicker-wrapper',
        sizeClasses[size],
        variantClasses[variant],
        fullWidth ? 'datepicker-full-width' : '',
        disabled ? 'datepicker-disabled' : '',
        error ? 'datepicker-error' : '',
        isOpen ? 'datepicker-open' : '',
        wrapperClassName
    ].filter(Boolean).join(' ');

    const inputClasses = [
        'datepicker-input',
        inputClassName
    ].filter(Boolean).join(' ');

    const daysMatrix = generateDaysMatrix();

    return (
        <div className={`datepicker-container ${className}`} ref={datepickerRef}>
            {/* Label */}
            {label && (
                <label 
                    htmlFor={id}
                    className={`datepicker-label ${labelClassName} ${required ? 'required' : ''}`}
                >
                    {label}
                </label>
            )}

            {/* Input wrapper */}
            <div className={wrapperClasses}>
                {/* Input */}
                <input
                    ref={inputRef}
                    type="text"
                    id={id}
                    name={name}
                    value={currentDate ? formatDate(currentDate) : ''}
                    onChange={(e) => {
                        const date = parseDate(e.target.value);
                        if (date) {
                            handleDateSelect(date);
                        }
                    }}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    className={inputClasses}
                    onClick={() => !disabled && setIsOpen(true)}
                    readOnly
                    {...props}
                />

                {/* Iconos */}
                <div className="datepicker-icons">
                    {showClearButton && currentDate && !disabled && (
                        <button
                            className="datepicker-clear"
                            onClick={handleClear}
                            aria-label="Limpiar fecha"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    )}
                    
                    <div className="datepicker-calendar-icon">
                        <i className="fas fa-calendar"></i>
                    </div>
                </div>

                {/* Calendario */}
                {isOpen && !disabled && (
                    <div className="datepicker-dropdown">
                        {/* Header del calendario */}
                        <div className="datepicker-header">
                            <button
                                className="datepicker-nav prev"
                                onClick={() => handleMonthChange(-1)}
                                aria-label="Mes anterior"
                            >
                                <i className="fas fa-chevron-left"></i>
                            </button>
                            
                            <div className="datepicker-current-view">
                                {view === 'days' && (
                                    <>
                                        <button
                                            className="datepicker-month-btn"
                                            onClick={() => handleViewChange('months')}
                                        >
                                            {config.months[currentMonth.getMonth()]}
                                        </button>
                                        <button
                                            className="datepicker-year-btn"
                                            onClick={() => handleViewChange('years')}
                                        >
                                            {currentMonth.getFullYear()}
                                        </button>
                                    </>
                                )}
                                {view === 'months' && (
                                    <button
                                        className="datepicker-year-btn"
                                        onClick={() => handleViewChange('years')}
                                    >
                                        {currentMonth.getFullYear()}
                                    </button>
                                )}
                                {view === 'years' && (
                                    <span className="datepicker-year-range">
                                        {currentMonth.getFullYear() - 6} - {currentMonth.getFullYear() + 5}
                                    </span>
                                )}
                            </div>
                            
                            <button
                                className="datepicker-nav next"
                                onClick={() => handleMonthChange(1)}
                                aria-label="Mes siguiente"
                            >
                                <i className="fas fa-chevron-right"></i>
                            </button>
                        </div>

                        {/* Contenido del calendario */}
                        <div className="datepicker-content">
                            {view === 'days' && (
                                <>
                                    {/* Días de la semana */}
                                    <div className="datepicker-weekdays">
                                        {config.days.map((day, index) => (
                                            <div key={index} className="datepicker-weekday">
                                                {day}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Días del mes */}
                                    <div className="datepicker-days">
                                        {daysMatrix.map((week, weekIndex) => (
                                            <div key={weekIndex} className="datepicker-week">
                                                {week.map((day, dayIndex) => (
                                                    <button
                                                        key={dayIndex}
                                                        className={`datepicker-day 
                                                            ${day.isCurrentMonth ? 'current-month' : 'other-month'}
                                                            ${day.isToday ? 'today' : ''}
                                                            ${day.isSelected ? 'selected' : ''}
                                                            ${day.isDisabled ? 'disabled' : ''}`}
                                                        onClick={() => !day.isDisabled && handleDateSelect(day.date)}
                                                        disabled={day.isDisabled}
                                                        aria-label={`${day.date.getDate()} de ${config.months[day.date.getMonth()]} de ${day.date.getFullYear()}`}
                                                    >
                                                        {day.date.getDate()}
                                                    </button>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {view === 'months' && (
                                <div className="datepicker-months">
                                    {config.monthsShort.map((month, index) => {
                                        const date = new Date(currentMonth.getFullYear(), index, 1);
                                        const isSelected = currentDate && 
                                            currentDate.getMonth() === index && 
                                            currentDate.getFullYear() === currentMonth.getFullYear();
                                        const isDisabled = 
                                            (minDate && date < minDate) || 
                                            (maxDate && date > maxDate);
                                        
                                        return (
                                            <button
                                                key={index}
                                                className={`datepicker-month ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                                                onClick={() => {
                                                    if (!isDisabled) {
                                                        const newDate = new Date(currentMonth);
                                                        newDate.setMonth(index);
                                                        setCurrentMonth(newDate);
                                                        setView('days');
                                                    }
                                                }}
                                                disabled={isDisabled}
                                            >
                                                {month}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {view === 'years' && (
                                <div className="datepicker-years">
                                    {Array.from({ length: 12 }, (_, i) => {
                                        const year = currentMonth.getFullYear() - 6 + i;
                                        const date = new Date(year, 0, 1);
                                        const isSelected = currentDate && currentDate.getFullYear() === year;
                                        const isDisabled = 
                                            (minDate && date < minDate) || 
                                            (maxDate && date > maxDate);
                                        
                                        return (
                                            <button
                                                key={year}
                                                className={`datepicker-year ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                                                onClick={() => {
                                                    if (!isDisabled) {
                                                        const newDate = new Date(currentMonth);
                                                        newDate.setFullYear(year);
                                                        setCurrentMonth(newDate);
                                                        setView('months');
                                                    }
                                                }}
                                                disabled={isDisabled}
                                            >
                                                {year}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer del calendario */}
                        <div className="datepicker-footer">
                            {showTodayButton && (
                                <button
                                    className="datepicker-today-btn"
                                    onClick={handleToday}
                                >
                                    {config.today}
                                </button>
                            )}
                            
                            {showClearButton && currentDate && (
                                <button
                                    className="datepicker-clear-btn"
                                    onClick={handleClear}
                                >
                                    {config.clear}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Helper text and error */}
            {(helperText || error) && (
                <div className={`datepicker-helper ${helperClassName} ${error ? 'datepicker-error-text' : ''}`}>
                    {error || helperText}
                </div>
            )}
        </div>
    );
});

DatePicker.displayName = 'DatePicker';

DatePicker.propTypes = {
    value: PropTypes.instanceOf(Date),
    defaultValue: PropTypes.instanceOf(Date),
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
    format: PropTypes.string,
    minDate: PropTypes.instanceOf(Date),
    maxDate: PropTypes.instanceOf(Date),
    showClearButton: PropTypes.bool,
    showTodayButton: PropTypes.bool,
    locale: PropTypes.string,
    className: PropTypes.string,
    wrapperClassName: PropTypes.string,
    labelClassName: PropTypes.string,
    inputClassName: PropTypes.string,
    helperClassName: PropTypes.string,
    name: PropTypes.string,
    id: PropTypes.string
};

export default DatePicker;