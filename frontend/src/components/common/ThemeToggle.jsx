import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/Common/common.css';

const ThemeToggle = ({
    defaultTheme = 'light',
    themes = ['light', 'dark', 'auto'],
    showLabels = true,
    size = 'medium',
    variant = 'default',
    className = '',
    onChange,
    storageKey = 'theme'
}) => {
    const [currentTheme, setCurrentTheme] = useState(() => {
        // Intentar obtener del localStorage
        const savedTheme = localStorage.getItem(storageKey);
        if (savedTheme && themes.includes(savedTheme)) {
            return savedTheme;
        }
        
        // Detectar tema del sistema
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (defaultTheme === 'auto') {
            return systemPrefersDark ? 'dark' : 'light';
        }
        
        return defaultTheme;
    });

    const [systemTheme, setSystemTheme] = useState(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        return mediaQuery.matches ? 'dark' : 'light';
    });

    const themeConfigs = {
        light: {
            label: 'Claro',
            icon: 'fas fa-sun',
            color: '#f59e0b'
        },
        dark: {
            label: 'Oscuro',
            icon: 'fas fa-moon',
            color: '#6366f1'
        },
        auto: {
            label: 'Automático',
            icon: 'fas fa-adjust',
            color: '#3b82f6'
        }
    };

    // Aplicar tema al documento
    const applyTheme = (theme) => {
        const root = document.documentElement;
        const body = document.body;
        
        // Remover clases anteriores
        body.classList.remove('theme-light', 'theme-dark');
        
        let effectiveTheme = theme;
        
        if (theme === 'auto') {
            effectiveTheme = systemTheme;
        }
        
        // Aplicar tema efectivo
        body.classList.add(`theme-${effectiveTheme}`);
        root.setAttribute('data-theme', effectiveTheme);
        
        // Actualizar meta tag para tema
        const themeColor = effectiveTheme === 'dark' ? '#1e293b' : '#ffffff';
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.content = themeColor;
        }
    };

    // Escuchar cambios en la preferencia del sistema
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleSystemThemeChange = (e) => {
            const newSystemTheme = e.matches ? 'dark' : 'light';
            setSystemTheme(newSystemTheme);
            
            if (currentTheme === 'auto') {
                applyTheme('auto');
            }
        };

        mediaQuery.addEventListener('change', handleSystemThemeChange);
        
        return () => {
            mediaQuery.removeEventListener('change', handleSystemThemeChange);
        };
    }, [currentTheme]);

    // Aplicar tema inicial y cuando cambia
    useEffect(() => {
        applyTheme(currentTheme);
        localStorage.setItem(storageKey, currentTheme);
        
        if (onChange) {
            onChange(currentTheme);
        }
    }, [currentTheme, onChange, storageKey]);

    const handleThemeChange = (theme) => {
        setCurrentTheme(theme);
    };

    const cycleTheme = () => {
        const currentIndex = themes.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        handleThemeChange(themes[nextIndex]);
    };

    const sizeClasses = {
        small: 'theme-toggle-sm',
        medium: 'theme-toggle-md',
        large: 'theme-toggle-lg'
    };

    const variantClasses = {
        default: 'theme-toggle-default',
        minimal: 'theme-toggle-minimal',
        pill: 'theme-toggle-pill'
    };

    const currentConfig = themeConfigs[currentTheme];

    return (
        <div className={`theme-toggle-container ${className}`}>
            {variant === 'default' ? (
                <div className={`theme-toggle ${sizeClasses[size]} ${variantClasses[variant]}`}>
                    {themes.map(theme => {
                        const config = themeConfigs[theme];
                        if (!config) return null;
                        
                        return (
                            <button
                                key={theme}
                                className={`theme-option ${currentTheme === theme ? 'active' : ''}`}
                                onClick={() => handleThemeChange(theme)}
                                aria-label={`Cambiar a tema ${config.label}`}
                                title={`Tema ${config.label}`}
                            >
                                <i className={config.icon} style={{ color: currentTheme === theme ? config.color : '' }}></i>
                                {showLabels && (
                                    <span className="theme-label">{config.label}</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            ) : (
                <button
                    className={`theme-toggle-single ${sizeClasses[size]} ${variantClasses[variant]} ${currentTheme === 'auto' ? 'theme-auto' : ''}`}
                    onClick={cycleTheme}
                    aria-label={`Cambiar tema. Actual: ${currentConfig.label}`}
                    title={`Tema actual: ${currentConfig.label}`}
                >
                    <i 
                        className={currentConfig.icon} 
                        style={{ color: currentConfig.color }}
                    ></i>
                    {showLabels && (
                        <span className="theme-label">{currentConfig.label}</span>
                    )}
                </button>
            )}
            
            {/* Información del tema */}
            <div className="theme-info">
                <div className="theme-status">
                    <span className="status-indicator">
                        <span 
                            className="status-dot" 
                            style={{ backgroundColor: currentConfig.color }}
                        ></span>
                        <span className="status-text">
                            Tema: {currentConfig.label}
                        </span>
                    </span>
                    
                    {currentTheme === 'auto' && (
                        <span className="system-theme">
                            <i className="fas fa-desktop"></i>
                            Sistema: {systemTheme === 'dark' ? 'Oscuro' : 'Claro'}
                        </span>
                    )}
                </div>
                
                <div className="theme-stats">
                    <span className="stat-item">
                        <i className="fas fa-eye"></i>
                        {systemTheme === 'dark' ? 'Modo nocturno' : 'Modo diurno'}
                    </span>
                    <span className="stat-item">
                        <i className="fas fa-palette"></i>
                        {themes.length} temas disponibles
                    </span>
                </div>
            </div>
        </div>
    );
};

ThemeToggle.propTypes = {
    defaultTheme: PropTypes.oneOf(['light', 'dark', 'auto']),
    themes: PropTypes.arrayOf(PropTypes.oneOf(['light', 'dark', 'auto'])),
    showLabels: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    variant: PropTypes.oneOf(['default', 'minimal', 'pill']),
    className: PropTypes.string,
    onChange: PropTypes.func,
    storageKey: PropTypes.string
};

export default ThemeToggle;