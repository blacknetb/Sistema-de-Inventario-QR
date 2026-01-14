import React, { useMemo, useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import '../../assets/styles/variables.css';
import '../../assets/styles/global.css';
import '../../assets/styles/base.css';
import '../../assets/styles/animations.css';

/**
 * ✅ COMPONENTE PROGRESS BAR OPTIMIZADO
 */

// ✅ COMPONENTE PRINCIPAL CON REF FORWARDING
const ProgressBar = React.forwardRef(({
  value = 0,
  max = 100,
  type = 'linear',
  variant = 'primary',
  size = 'md',
  showValue = false,
  label = '',
  animated = true,
  striped = false,
  indeterminate = false,
  thickness = 4,
  className = '',
  ...props
}, ref) => {
  
  // ✅ REFERENCIAS Y ESTADOS
  const animationRef = useRef(null);
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // ✅ PORCENTAJE NORMALIZADO CON VALIDACIÓN
  const normalizedValue = useMemo(() => {
    if (max <= 0) {
      console.warn('ProgressBar: max debe ser mayor que 0');
      return 0;
    }
    
    let val = value;
    if (typeof value !== 'number' || isNaN(value)) {
      console.warn('ProgressBar: value debe ser un número válido');
      val = 0;
    }
    
    // Limitar valor entre 0 y max
    val = Math.max(0, Math.min(val, max));
    return (val / max) * 100;
  }, [value, max]);
  
  // ✅ ANIMACIÓN SUAVE CON requestAnimationFrame
  useEffect(() => {
    if (!animated) {
      setAnimatedValue(normalizedValue);
      return;
    }
    
    // Cancelar animación previa
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    setIsAnimating(true);
    const startTime = Date.now();
    const startValue = animatedValue;
    const endValue = normalizedValue;
    const duration = 300; // ms
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function: easeOutCubic
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easeOutCubic;
      
      setAnimatedValue(currentValue);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      setIsAnimating(false);
    };
  }, [normalizedValue, animated, animatedValue]);
  
  // ✅ CLASES CSS OPTIMIZADAS
  const progressClasses = useMemo(() => {
    return clsx(
      'progress',
      `progress-${type}`,
      `progress-variant-${variant}`,
      `progress-size-${size}`,
      {
        'progress-striped': striped,
        'progress-animated': striped && animated && !indeterminate,
        'progress-indeterminate': indeterminate,
        'progress-show-value': showValue,
        'progress-has-label': !!label,
        'progress-animating': isAnimating
      },
      className
    );
  }, [type, variant, size, striped, animated, indeterminate, showValue, label, isAnimating, className]);
  
  // ✅ PROGRESS BAR LINEAL
  const renderLinearProgress = () => {
    const displayValue = animated ? animatedValue : normalizedValue;
    
    return (
      <div 
        className={progressClasses}
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `Progreso: ${Math.round(value)}%`}
        ref={ref}
        {...props}
      >
        <div className="progress-track">
          <div 
            className="progress-bar"
            style={{
              width: `${displayValue}%`,
              transition: animated && !isAnimating ? 'width 0.3s ease-out' : 'none'
            }}
          >
            {striped && <div className="progress-stripes" />}
            {indeterminate && <div className="progress-indeterminate-bar" />}
          </div>
        </div>
        
        {(showValue || label) && (
          <div className="progress-info">
            {label && <span className="progress-label">{label}</span>}
            {showValue && (
              <span className="progress-value">
                {Math.round(value)}%
              </span>
            )}
          </div>
        )}
      </div>
    );
  };
  
  // ✅ PROGRESS BAR CIRCULAR
  const renderCircularProgress = () => {
    const displayValue = animated ? animatedValue : normalizedValue;
    const radius = 50 - thickness / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (displayValue / 100) * circumference;
    
    return (
      <div 
        className={progressClasses}
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `Progreso: ${Math.round(value)}%`}
        ref={ref}
        style={{
          '--progress-thickness': `${thickness}px`,
          '--progress-radius': `${radius}px`,
          '--progress-circumference': `${circumference}px`
        }}
        {...props}
      >
        <svg 
          className="progress-circular-svg" 
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <circle
            className="progress-circular-track"
            cx="50"
            cy="50"
            r={radius}
            strokeWidth={thickness}
            fill="none"
          />
          
          <circle
            className="progress-circular-bar"
            cx="50"
            cy="50"
            r={radius}
            strokeWidth={thickness}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: animated && !isAnimating ? 'stroke-dashoffset 0.3s ease-out' : 'none'
            }}
          />
        </svg>
        
        {(showValue || label) && (
          <div className="progress-circular-info">
            {showValue && (
              <span className="progress-circular-value">
                {Math.round(value)}%
              </span>
            )}
            {label && <span className="progress-circular-label">{label}</span>}
          </div>
        )}
      </div>
    );
  };
  
  // ✅ PROGRESS BAR DASHBOARD
  const renderDashboardProgress = () => {
    const displayValue = animated ? animatedValue : normalizedValue;
    const radius = 50 - thickness / 2;
    const circumference = Math.PI * radius;
    const strokeDashoffset = circumference - (displayValue / 100) * circumference;
    
    return (
      <div 
        className={progressClasses}
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `Progreso: ${Math.round(value)}%`}
        ref={ref}
        style={{
          '--progress-thickness': `${thickness}px`,
          '--progress-radius': `${radius}px`,
          '--progress-circumference': `${circumference}px`
        }}
        {...props}
      >
        <svg 
          className="progress-dashboard-svg" 
          viewBox="0 0 100 50"
          aria-hidden="true"
        >
          <path
            className="progress-dashboard-track"
            d={`M ${thickness/2} 50 A ${radius} ${radius} 0 0 1 ${100 - thickness/2} 50`}
            strokeWidth={thickness}
            fill="none"
          />
          
          <path
            className="progress-dashboard-bar"
            d={`M ${thickness/2} 50 A ${radius} ${radius} 0 0 1 ${100 - thickness/2} 50`}
            strokeWidth={thickness}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: animated && !isAnimating ? 'stroke-dashoffset 0.3s ease-out' : 'none'
            }}
          />
        </svg>
        
        {(showValue || label) && (
          <div className="progress-dashboard-info">
            {showValue && (
              <span className="progress-dashboard-value">
                {Math.round(value)}%
              </span>
            )}
            {label && <span className="progress-dashboard-label">{label}</span>}
          </div>
        )}
      </div>
    );
  };
  
  // ✅ RENDER CONDICIONAL
  switch (type) {
    case 'circular':
      return renderCircularProgress();
    case 'dashboard':
      return renderDashboardProgress();
    case 'linear':
    default:
      return renderLinearProgress();
  }
});

ProgressBar.displayName = 'ProgressBar';

// ✅ COMPONENTES ESPECIALIZADOS MEMOIZADOS
export const LinearProgress = React.memo((props) => (
  <ProgressBar type="linear" {...props} />
));

LinearProgress.displayName = 'LinearProgress';

export const CircularProgress = React.memo((props) => (
  <ProgressBar type="circular" {...props} />
));

CircularProgress.displayName = 'CircularProgress';

export const DashboardProgress = React.memo((props) => (
  <ProgressBar type="dashboard" {...props} />
));

DashboardProgress.displayName = 'DashboardProgress';

// ✅ ASIGNACIÓN DE COMPONENTES
ProgressBar.Linear = LinearProgress;
ProgressBar.Circular = CircularProgress;
ProgressBar.Dashboard = DashboardProgress;

// ✅ PROPTYPES COMPLETOS
ProgressBar.propTypes = {
  value: PropTypes.number,
  max: PropTypes.number,
  type: PropTypes.oneOf(['linear', 'circular', 'dashboard']),
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'warning', 'error', 'info']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  showValue: PropTypes.bool,
  label: PropTypes.string,
  animated: PropTypes.bool,
  striped: PropTypes.bool,
  indeterminate: PropTypes.bool,
  thickness: PropTypes.number,
  className: PropTypes.string
};

// ✅ VALORES POR DEFECTO
ProgressBar.defaultProps = {
  value: 0,
  max: 100,
  type: 'linear',
  variant: 'primary',
  size: 'md',
  showValue: false,
  label: '',
  animated: true,
  striped: false,
  indeterminate: false,
  thickness: 4,
  className: ''
};

export default ProgressBar;