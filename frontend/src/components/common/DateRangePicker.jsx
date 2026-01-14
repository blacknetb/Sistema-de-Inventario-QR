import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  FiCalendar, 
  FiChevronLeft, 
  FiChevronRight, 
  FiX,
  FiCheck,
  FiClock,
  FiRefreshCw
} from 'react-icons/fi';
import { useNotification } from '../../context/NotificationContext';

const DateRangePicker = ({ 
  value = { startDate: null, endDate: null },
  onChange,
  placeholder = "Seleccionar rango de fechas",
  minDate = null,
  maxDate = null,
  presets = [],
  disabled = false,
  format = 'DD/MM/YYYY',
  showTime = false,
  className = '',
  size = 'medium',
  variant = 'outline',
  allowClear = true,
  autoApply = false
}) => {
  const { success } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [tempRange, setTempRange] = useState(value);
  const [hoveredDate, setHoveredDate] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeValues, setTimeValues] = useState({
    startHour: '00',
    startMinute: '00',
    endHour: '23',
    endMinute: '59'
  });

  const pickerRef = useRef(null);
  const inputRef = useRef(null);

  // Preajustes comunes
  const defaultPresets = presets.length > 0 ? presets : [
    { label: 'Hoy', getValue: () => {
      const today = new Date();
      return { startDate: today, endDate: today };
    }},
    { label: 'Ayer', getValue: () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return { startDate: yesterday, endDate: yesterday };
    }},
    { label: 'Últimos 7 días', getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      return { startDate: start, endDate: end };
    }},
    { label: 'Últimos 30 días', getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 29);
      return { startDate: start, endDate: end };
    }},
    { label: 'Este mes', getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: start, endDate: end };
    }},
    { label: 'Mes anterior', getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: start, endDate: end };
    }}
  ];

  // Formatear fecha según formato especificado
  const formatDate = useCallback((date) => {
    if (!date) return '';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    switch (format) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'DD-MM-YYYY':
        return `${day}-${month}-${year}`;
      default:
        return `${day}/${month}/${year}`;
    }
  }, [format]);

  // Formatear hora
  const formatTime = useCallback((date) => {
    if (!date) return '00:00';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }, []);

  // Formatear rango para display
  const formatRange = useCallback(() => {
    if (!value.startDate || !value.endDate) {
      return placeholder;
    }
    
    const startStr = formatDate(value.startDate);
    const endStr = formatDate(value.endDate);
    
    if (showTime && value.startDate && value.endDate) {
      const startTime = formatTime(value.startDate);
      const endTime = formatTime(value.endDate);
      return `${startStr} ${startTime} - ${endStr} ${endTime}`;
    }
    
    return `${startStr} - ${endStr}`;
  }, [value, formatDate, formatTime, showTime, placeholder]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowTimePicker(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Inicializar valores de tiempo
  useEffect(() => {
    if (showTime && value.startDate && value.endDate) {
      setTimeValues({
        startHour: value.startDate.getHours().toString().padStart(2, '0'),
        startMinute: value.startDate.getMinutes().toString().padStart(2, '0'),
        endHour: value.endDate.getHours().toString().padStart(2, '0'),
        endMinute: value.endDate.getMinutes().toString().padStart(2, '0')
      });
    }
  }, [showTime, value.startDate, value.endDate]);

  // Funciones de navegación del calendario
  const prevMonth = () => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const nextMonth = () => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const goToToday = () => {
    setViewDate(new Date());
  };

  // Obtener días del mes
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Obtener primer día del mes
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  // Generar matriz de días del calendario
  const generateCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Días del mes anterior
    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const date = new Date(year, month - 1, day);
      date.setHours(0, 0, 0, 0);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false
      });
    }
    
    // Días del mes actual
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      date.setHours(0, 0, 0, 0);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime()
      });
    }
    
    // Días del próximo mes
    const totalCells = 42; // 6 semanas * 7 días
    const remainingDays = totalCells - days.length;
    
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      date.setHours(0, 0, 0, 0);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false
      });
    }
    
    return days;
  };

  // Verificar si una fecha está en el rango
  const isDateInRange = (date) => {
    if (!tempRange.startDate || !tempRange.endDate) return false;
    
    const start = new Date(tempRange.startDate);
    const end = new Date(tempRange.endDate);
    const check = new Date(date);
    
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    check.setHours(0, 0, 0, 0);
    
    return check >= start && check <= end;
  };

  // Verificar si una fecha es el inicio o fin del rango
  const isRangeEdge = (date) => {
    if (!tempRange.startDate || !tempRange.endDate) return false;
    
    const start = new Date(tempRange.startDate);
    const end = new Date(tempRange.endDate);
    const check = new Date(date);
    
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    check.setHours(0, 0, 0, 0);
    
    return check.getTime() === start.getTime() || check.getTime() === end.getTime();
  };

  // Manejar clic en fecha
  const handleDateClick = (date) => {
    const normalizedDate = new Date(date);
    
    if (showTimePicker) {
      normalizedDate.setHours(
        parseInt(timeValues.startHour),
        parseInt(timeValues.startMinute)
      );
    } else {
      normalizedDate.setHours(0, 0, 0, 0);
    }
    
    if (!tempRange.startDate || (tempRange.startDate && tempRange.endDate)) {
      // Primer clic o reset
      setTempRange({
        startDate: normalizedDate,
        endDate: null
      });
      setIsSelecting(true);
    } else if (tempRange.startDate && !tempRange.endDate) {
      // Segundo clic - completar rango
      let start = new Date(tempRange.startDate);
      let end = new Date(normalizedDate);
      
      // Asegurar que start sea anterior a end
      if (end < start) {
        [start, end] = [end, start];
      }
      
      if (showTimePicker) {
        end.setHours(
          parseInt(timeValues.endHour),
          parseInt(timeValues.endMinute)
        );
      }
      
      const newRange = { startDate: start, endDate: end };
      setTempRange(newRange);
      setIsSelecting(false);
      
      if (autoApply) {
        handleApply(newRange);
      }
    }
    
    setHoveredDate(normalizedDate);
  };

  // Manejar hover en fechas durante selección
  const handleDateHover = (date) => {
    if (isSelecting && tempRange.startDate && !tempRange.endDate) {
      setHoveredDate(date);
    }
  };

  // Aplicar selección
  const handleApply = (range = null) => {
    const finalRange = range || tempRange;
    
    if (finalRange.startDate && finalRange.endDate) {
      onChange(finalRange);
      setIsOpen(false);
      setShowTimePicker(false);
      success('Rango de fechas aplicado');
    } else {
      success('Selecciona un rango completo');
    }
  };

  // Limpiar selección
  const handleClear = () => {
    setTempRange({ startDate: null, endDate: null });
    onChange({ startDate: null, endDate: null });
    setIsSelecting(false);
    setHoveredDate(null);
    success('Rango de fechas limpiado');
  };

  // Aplicar preajuste
  const handlePreset = (preset) => {
    const presetRange = preset.getValue();
    setTempRange(presetRange);
    
    if (autoApply) {
      handleApply(presetRange);
    } else {
      setViewDate(presetRange.startDate || new Date());
    }
  };

  // Manejar cambio de hora
  const handleTimeChange = (field, value) => {
    setTimeValues(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Actualizar fechas temporales con nueva hora
    if (tempRange.startDate) {
      const newStart = new Date(tempRange.startDate);
      newStart.setHours(parseInt(timeValues.startHour), parseInt(timeValues.startMinute));
      setTempRange(prev => ({ ...prev, startDate: newStart }));
    }
    
    if (tempRange.endDate) {
      const newEnd = new Date(tempRange.endDate);
      newEnd.setHours(parseInt(timeValues.endHour), parseInt(timeValues.endMinute));
      setTempRange(prev => ({ ...prev, endDate: newEnd }));
    }
  };

  // Generar opciones de hora/minuto
  const generateTimeOptions = (type) => {
    const options = [];
    const max = type === 'hour' ? 23 : 59;
    
    for (let i = 0; i <= max; i++) {
      const value = i.toString().padStart(2, '0');
      options.push(
        <option key={i} value={value}>
          {value}
        </option>
      );
    }
    
    return options;
  };

  // Nombres de los meses
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Nombres de los días
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Clases dinámicas
  const getInputClasses = () => {
    const base = 'date-range-input';
    const sizeClass = `date-range-input-${size}`;
    const variantClass = `date-range-input-${variant}`;
    const disabledClass = disabled ? 'date-range-input-disabled' : '';
    
    return `${base} ${sizeClass} ${variantClass} ${disabledClass} ${className}`.trim();
  };

  const getButtonClasses = (type = 'primary') => {
    const base = 'date-range-button';
    const typeClass = `date-range-button-${type}`;
    return `${base} ${typeClass}`.trim();
  };

  return (
    <div className="date-range-picker-container">
      <div 
        ref={inputRef}
        className={getInputClasses()}
        onClick={() => !disabled && setIsOpen(true)}
      >
        <FiCalendar className="date-range-icon" />
        <span className="date-range-display">
          {formatRange()}
        </span>
        {value.startDate && value.endDate && allowClear && (
          <button
            type="button"
            className="date-range-clear"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            disabled={disabled}
            title="Limpiar selección"
          >
            <FiX />
          </button>
        )}
      </div>

      {isOpen && !disabled && (
        <div ref={pickerRef} className="date-range-picker">
          <div className="date-range-picker-content">
            {/* Panel izquierdo - Preajustes */}
            <div className="date-range-presets">
              <div className="date-range-presets-header">
                <h4>Preajustes</h4>
              </div>
              <div className="date-range-presets-list">
                {defaultPresets.map((preset, index) => (
                  <button
                    key={index}
                    type="button"
                    className="date-range-preset-item"
                    onClick={() => handlePreset(preset)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              
              {/* Selector de hora si está habilitado */}
              {showTime && (
                <div className="date-range-time-selector">
                  <div className="date-range-time-header">
                    <FiClock />
                    <span>Configurar horas</span>
                    <button
                      type="button"
                      className="date-range-time-toggle"
                      onClick={() => setShowTimePicker(!showTimePicker)}
                    >
                      {showTimePicker ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  
                  {showTimePicker && (
                    <div className="date-range-time-controls">
                      <div className="date-range-time-group">
                        <label>Hora inicio:</label>
                        <div className="date-range-time-inputs">
                          <select
                            value={timeValues.startHour}
                            onChange={(e) => handleTimeChange('startHour', e.target.value)}
                            className="date-range-time-select"
                          >
                            {generateTimeOptions('hour')}
                          </select>
                          <span>:</span>
                          <select
                            value={timeValues.startMinute}
                            onChange={(e) => handleTimeChange('startMinute', e.target.value)}
                            className="date-range-time-select"
                          >
                            {generateTimeOptions('minute')}
                          </select>
                        </div>
                      </div>
                      
                      <div className="date-range-time-group">
                        <label>Hora fin:</label>
                        <div className="date-range-time-inputs">
                          <select
                            value={timeValues.endHour}
                            onChange={(e) => handleTimeChange('endHour', e.target.value)}
                            className="date-range-time-select"
                          >
                            {generateTimeOptions('hour')}
                          </select>
                          <span>:</span>
                          <select
                            value={timeValues.endMinute}
                            onChange={(e) => handleTimeChange('endMinute', e.target.value)}
                            className="date-range-time-select"
                          >
                            {generateTimeOptions('minute')}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Panel derecho - Calendario */}
            <div className="date-range-calendar">
              {/* Encabezado del calendario */}
              <div className="date-range-calendar-header">
                <button
                  type="button"
                  className="date-range-nav-button"
                  onClick={prevMonth}
                  title="Mes anterior"
                >
                  <FiChevronLeft />
                </button>
                
                <div className="date-range-month-display">
                  <span className="date-range-month">
                    {monthNames[viewDate.getMonth()]}
                  </span>
                  <span className="date-range-year">
                    {viewDate.getFullYear()}
                  </span>
                </div>
                
                <button
                  type="button"
                  className="date-range-nav-button"
                  onClick={nextMonth}
                  title="Mes siguiente"
                >
                  <FiChevronRight />
                </button>
                
                <button
                  type="button"
                  className="date-range-today-button"
                  onClick={goToToday}
                  title="Ir a hoy"
                >
                  <FiRefreshCw />
                  Hoy
                </button>
              </div>

              {/* Días de la semana */}
              <div className="date-range-week-days">
                {dayNames.map(day => (
                  <div key={day} className="date-range-week-day">
                    {day}
                  </div>
                ))}
              </div>

              {/* Días del mes */}
              <div className="date-range-days-grid">
                {generateCalendarDays().map((day, index) => {
                  const isInRange = isDateInRange(day.date);
                  const isEdge = isRangeEdge(day.date);
                  const isDisabled = 
                    (minDate && day.date < new Date(minDate)) ||
                    (maxDate && day.date > new Date(maxDate));
                  
                  // Determinar si está en rango hover
                  let isInHoverRange = false;
                  if (isSelecting && tempRange.startDate && hoveredDate) {
                    const start = new Date(tempRange.startDate);
                    const hover = new Date(hoveredDate);
                    const current = new Date(day.date);
                    
                    start.setHours(0, 0, 0, 0);
                    hover.setHours(0, 0, 0, 0);
                    current.setHours(0, 0, 0, 0);
                    
                    const rangeStart = start < hover ? start : hover;
                    const rangeEnd = start < hover ? hover : start;
                    
                    isInHoverRange = current >= rangeStart && current <= rangeEnd;
                  }
                  
                  const dayClasses = [
                    'date-range-day',
                    day.isCurrentMonth ? '' : 'date-range-day-other-month',
                    day.isToday ? 'date-range-day-today' : '',
                    isInRange ? 'date-range-day-in-range' : '',
                    isEdge ? 'date-range-day-edge' : '',
                    isInHoverRange && !isEdge ? 'date-range-day-hover-range' : '',
                    isDisabled ? 'date-range-day-disabled' : ''
                  ].filter(Boolean).join(' ');
                  
                  return (
                    <button
                      key={index}
                      type="button"
                      className={dayClasses}
                      onClick={() => !isDisabled && handleDateClick(day.date)}
                      onMouseEnter={() => !isDisabled && handleDateHover(day.date)}
                      disabled={isDisabled}
                      title={isDisabled ? 'Fecha no disponible' : formatDate(day.date)}
                    >
                      {day.date.getDate()}
                    </button>
                  );
                })}
              </div>

              {/* Rango seleccionado display */}
              <div className="date-range-selection-display">
                <div className="date-range-selection-item">
                  <span className="date-range-selection-label">Desde:</span>
                  <span className="date-range-selection-value">
                    {tempRange.startDate ? (
                      <>
                        {formatDate(tempRange.startDate)}
                        {showTime && ` ${formatTime(tempRange.startDate)}`}
                      </>
                    ) : '--/--/----'}
                  </span>
                </div>
                <div className="date-range-selection-item">
                  <span className="date-range-selection-label">Hasta:</span>
                  <span className="date-range-selection-value">
                    {tempRange.endDate ? (
                      <>
                        {formatDate(tempRange.endDate)}
                        {showTime && ` ${formatTime(tempRange.endDate)}`}
                      </>
                    ) : '--/--/----'}
                  </span>
                </div>
              </div>

              {/* Acciones */}
              <div className="date-range-actions">
                {allowClear && (
                  <button
                    type="button"
                    className={getButtonClasses('secondary')}
                    onClick={handleClear}
                    disabled={!tempRange.startDate && !tempRange.endDate}
                  >
                    <FiX />
                    Limpiar
                  </button>
                )}
                
                <button
                  type="button"
                  className={getButtonClasses('primary')}
                  onClick={() => handleApply()}
                  disabled={!tempRange.startDate || !tempRange.endDate}
                >
                  <FiCheck />
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

DateRangePicker.propTypes = {
  value: PropTypes.shape({
    startDate: PropTypes.instanceOf(Date),
    endDate: PropTypes.instanceOf(Date)
  }),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  minDate: PropTypes.instanceOf(Date),
  maxDate: PropTypes.instanceOf(Date),
  presets: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    getValue: PropTypes.func.isRequired
  })),
  disabled: PropTypes.bool,
  format: PropTypes.oneOf(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY']),
  showTime: PropTypes.bool,
  className: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['outline', 'filled', 'ghost']),
  allowClear: PropTypes.bool,
  autoApply: PropTypes.bool
};

DateRangePicker.defaultProps = {
  value: { startDate: null, endDate: null },
  placeholder: "Seleccionar rango de fechas",
  disabled: false,
  format: 'DD/MM/YYYY',
  showTime: false,
  size: 'medium',
  variant: 'outline',
  allowClear: true,
  autoApply: false
};

export default DateRangePicker;