import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/Common/common.css';

const Tooltip = ({
    children,
    content,
    position = 'top',
    delay = 200,
    disabled = false,
    className = '',
    maxWidth = 300,
    showArrow = true,
    interactive = false,
    trigger = 'hover'
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const tooltipRef = useRef(null);
    const triggerRef = useRef(null);
    const timeoutRef = useRef(null);

    const calculatePosition = () => {
        if (!triggerRef.current || !tooltipRef.current) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        
        let x = 0;
        let y = 0;

        switch (position) {
            case 'top':
                x = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
                y = triggerRect.top - tooltipRect.height - 8;
                break;
            case 'bottom':
                x = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
                y = triggerRect.bottom + 8;
                break;
            case 'left':
                x = triggerRect.left - tooltipRect.width - 8;
                y = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
                break;
            case 'right':
                x = triggerRect.right + 8;
                y = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
                break;
            case 'top-left':
                x = triggerRect.left;
                y = triggerRect.top - tooltipRect.height - 8;
                break;
            case 'top-right':
                x = triggerRect.right - tooltipRect.width;
                y = triggerRect.top - tooltipRect.height - 8;
                break;
            case 'bottom-left':
                x = triggerRect.left;
                y = triggerRect.bottom + 8;
                break;
            case 'bottom-right':
                x = triggerRect.right - tooltipRect.width;
                y = triggerRect.bottom + 8;
                break;
        }

        // Ajustar para que no salga de la pantalla
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (x < 10) x = 10;
        if (x + tooltipRect.width > viewportWidth - 10) {
            x = viewportWidth - tooltipRect.width - 10;
        }
        if (y < 10) y = 10;
        if (y + tooltipRect.height > viewportHeight - 10) {
            y = viewportHeight - tooltipRect.height - 10;
        }

        setCoords({ x, y });
    };

    const showTooltip = () => {
        if (disabled) return;
        
        timeoutRef.current = setTimeout(() => {
            setIsVisible(true);
            setTimeout(calculatePosition, 10);
        }, delay);
    };

    const hideTooltip = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsVisible(false);
    };

    // Configurar event listeners basados en trigger
    useEffect(() => {
        if (!triggerRef.current) return;

        const element = triggerRef.current;

        if (trigger === 'hover') {
            element.addEventListener('mouseenter', showTooltip);
            element.addEventListener('mouseleave', hideTooltip);
            
            if (interactive && tooltipRef.current) {
                tooltipRef.current.addEventListener('mouseenter', showTooltip);
                tooltipRef.current.addEventListener('mouseleave', hideTooltip);
            }
        } else if (trigger === 'click') {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isVisible) {
                    hideTooltip();
                } else {
                    showTooltip();
                }
            });
        } else if (trigger === 'focus') {
            element.addEventListener('focus', showTooltip);
            element.addEventListener('blur', hideTooltip);
        }

        // Cerrar al hacer clic fuera
        if (trigger === 'click') {
            const handleClickOutside = (e) => {
                if (
                    tooltipRef.current && 
                    !tooltipRef.current.contains(e.target) &&
                    element && 
                    !element.contains(e.target)
                ) {
                    hideTooltip();
                }
            };
            
            document.addEventListener('mousedown', handleClickOutside);
            
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }

        return () => {
            element.removeEventListener('mouseenter', showTooltip);
            element.removeEventListener('mouseleave', hideTooltip);
            element.removeEventListener('click', showTooltip);
            element.removeEventListener('focus', showTooltip);
            element.removeEventListener('blur', hideTooltip);
        };
    }, [trigger, interactive, isVisible, disabled]);

    // Recalcular posición en resize
    useEffect(() => {
        const handleResize = () => {
            if (isVisible) {
                calculatePosition();
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isVisible]);

    return (
        <>
            <div 
                ref={triggerRef}
                className={`tooltip-trigger ${className}`}
                aria-describedby={isVisible ? 'tooltip-content' : undefined}
            >
                {children}
            </div>

            {isVisible && (
                <div
                    ref={tooltipRef}
                    className={`tooltip ${position}`}
                    style={{
                        position: 'fixed',
                        left: `${coords.x}px`,
                        top: `${coords.y}px`,
                        maxWidth: `${maxWidth}px`,
                        zIndex: 9999
                    }}
                    role="tooltip"
                    id="tooltip-content"
                >
                    <div className="tooltip-content">
                        {typeof content === 'function' ? content() : content}
                    </div>
                    
                    {showArrow && (
                        <div className={`tooltip-arrow ${position}`} />
                    )}
                </div>
            )}
        </>
    );
};

Tooltip.propTypes = {
    children: PropTypes.node.isRequired,
    content: PropTypes.oneOfType([PropTypes.string, PropTypes.node, PropTypes.func]).isRequired,
    position: PropTypes.oneOf([
        'top', 'bottom', 'left', 'right',
        'top-left', 'top-right', 'bottom-left', 'bottom-right'
    ]),
    delay: PropTypes.number,
    disabled: PropTypes.bool,
    className: PropTypes.string,
    maxWidth: PropTypes.number,
    showArrow: PropTypes.bool,
    interactive: PropTypes.bool,
    trigger: PropTypes.oneOf(['hover', 'click', 'focus'])
};

export default Tooltip;