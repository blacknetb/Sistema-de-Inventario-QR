import React, { createContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  const [accentColor, setAccentColor] = useState(() => {
    const savedAccent = localStorage.getItem('accentColor');
    return savedAccent || 'blue';
  });

  const [fontSize, setFontSize] = useState(() => {
    const savedSize = localStorage.getItem('fontSize');
    return savedSize || 'medium';
  });

  const [animations, setAnimations] = useState(() => {
    const savedAnimations = localStorage.getItem('animations');
    return savedAnimations !== 'false';
  });

  const [compactMode, setCompactMode] = useState(() => {
    const savedCompact = localStorage.getItem('compactMode');
    return savedCompact === 'true';
  });

  // Aplicar tema al documento
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accentColor);
    localStorage.setItem('accentColor', accentColor);
  }, [accentColor]);

  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize);
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    document.documentElement.setAttribute('data-animations', animations);
    localStorage.setItem('animations', animations);
  }, [animations]);

  useEffect(() => {
    document.documentElement.setAttribute('data-compact', compactMode);
    localStorage.setItem('compactMode', compactMode);
  }, [compactMode]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setThemeMode = (mode) => {
    if (['light', 'dark', 'system'].includes(mode)) {
      setTheme(mode);
    }
  };

  const setAccent = (color) => {
    const validColors = ['blue', 'green', 'red', 'purple', 'orange', 'teal'];
    if (validColors.includes(color)) {
      setAccentColor(color);
    }
  };

  const setSize = (size) => {
    if (['small', 'medium', 'large'].includes(size)) {
      setFontSize(size);
    }
  };

  const toggleAnimations = () => {
    setAnimations(prev => !prev);
  };

  const toggleCompactMode = () => {
    setCompactMode(prev => !prev);
  };

  const resetToDefaults = () => {
    setTheme('light');
    setAccentColor('blue');
    setFontSize('medium');
    setAnimations(true);
    setCompactMode(false);
  };

  // Definir variables CSS para el tema
  useEffect(() => {
    const root = document.documentElement;
    
    // Colores del tema
    if (theme === 'dark') {
      root.style.setProperty('--bg-primary', '#1a1a1a');
      root.style.setProperty('--bg-secondary', '#2d2d2d');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#b3b3b3');
      root.style.setProperty('--border-color', '#404040');
      root.style.setProperty('--hover-bg', '#3d3d3d');
    } else {
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--bg-secondary', '#f9fafb');
      root.style.setProperty('--text-primary', '#111827');
      root.style.setProperty('--text-secondary', '#6b7280');
      root.style.setProperty('--border-color', '#e5e7eb');
      root.style.setProperty('--hover-bg', '#f3f4f6');
    }

    // Color de acento
    const accentColors = {
      blue: '#2563eb',
      green: '#10b981',
      red: '#ef4444',
      purple: '#8b5cf6',
      orange: '#f59e0b',
      teal: '#14b8a6'
    };
    
    root.style.setProperty('--accent-color', accentColors[accentColor] || accentColors.blue);

    // Tamaño de fuente
    const fontSizes = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    
    root.style.setProperty('--base-font-size', fontSizes[fontSize] || fontSizes.medium);

    // Animaciones
    if (!animations) {
      root.style.setProperty('--animation-speed', '0s');
    } else {
      root.style.setProperty('--animation-speed', '0.3s');
    }

    // Modo compacto
    if (compactMode) {
      root.style.setProperty('--spacing-unit', '4px');
    } else {
      root.style.setProperty('--spacing-unit', '8px');
    }
  }, [theme, accentColor, fontSize, animations, compactMode]);

  const value = {
    // Estado
    theme,
    accentColor,
    fontSize,
    animations,
    compactMode,
    
    // Métodos
    toggleTheme,
    setThemeMode,
    setAccent,
    setSize,
    toggleAnimations,
    toggleCompactMode,
    resetToDefaults,
    
    // Utilidades
    isDark: theme === 'dark',
    isLight: theme === 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;