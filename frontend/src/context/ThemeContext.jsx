import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import logger from '../utils/logger';

// Crear el contexto
const ThemeContext = createContext();

// Hook personalizado para usar el contexto
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de un ThemeProvider');
  }
  return context;
};

// Proveedor del tema
export const ThemeProvider = ({ children }) => {
  // Estado para el tema actual
  const [theme, setTheme] = useState(() => {
    try {
      // Intentar obtener el tema guardado en localStorage
      const savedTheme = localStorage.getItem('inventario_qr_theme');
      
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'auto') {
        return savedTheme;
      }
      
      // Si no hay tema guardado, usar 'auto' por defecto
      return 'auto';
    } catch (error) {
      logger.warn('Error al leer el tema del localStorage:', error);
      return 'auto';
    }
  });

  // Estado para el tema efectivo (light/dark)
  const [effectiveTheme, setEffectiveTheme] = useState('light');

  // Estado para indicar si el sistema está listo
  const [isInitialized, setIsInitialized] = useState(false);

  // Detectar preferencia del sistema
  const detectSystemTheme = useCallback(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }, []);

  // Aplicar el tema al documento
  const applyTheme = useCallback((newTheme) => {
    try {
      const html = document.documentElement;
      
      // Determinar el tema efectivo
      let themeToApply = newTheme;
      if (newTheme === 'auto') {
        themeToApply = detectSystemTheme();
      }

      // Aplicar clases y atributos
      html.classList.remove('light', 'dark');
      html.classList.add(themeToApply);
      html.setAttribute('data-theme', themeToApply);
      html.style.colorScheme = themeToApply;

      // Actualizar estado efectivo
      setEffectiveTheme(themeToApply);

      // Emitir evento personalizado
      window.dispatchEvent(new CustomEvent('theme-change', { 
        detail: { theme: newTheme, effectiveTheme: themeToApply }
      }));

      logger.info(`Tema aplicado: ${newTheme} (efectivo: ${themeToApply})`);
      return themeToApply;
    } catch (error) {
      logger.error('Error al aplicar el tema:', error);
      return 'light';
    }
  }, [detectSystemTheme]);

  // Cambiar tema
  const toggleTheme = useCallback((newTheme = null) => {
    try {
      let nextTheme;
      
      if (newTheme) {
        // Si se especifica un tema específico
        nextTheme = newTheme;
      } else {
        // Alternar entre temas
        const themes = ['light', 'dark', 'auto'];
        const currentIndex = themes.indexOf(theme);
        nextTheme = themes[(currentIndex + 1) % themes.length];
      }

      // Actualizar estado
      setTheme(nextTheme);

      // Guardar en localStorage
      localStorage.setItem('inventario_qr_theme', nextTheme);

      // Aplicar tema
      applyTheme(nextTheme);

      logger.info(`Tema cambiado a: ${nextTheme}`);
    } catch (error) {
      logger.error('Error al cambiar el tema:', error);
    }
  }, [theme, applyTheme]);

  // Inicializar tema
  useEffect(() => {
    const initializeTheme = () => {
      try {
        // Aplicar tema inicial
        applyTheme(theme);
        
        // Configurar listener para cambios en la preferencia del sistema
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleSystemThemeChange = (e) => {
          if (theme === 'auto') {
            const newSystemTheme = e.matches ? 'dark' : 'light';
            applyTheme('auto');
            logger.info(`Preferencia del sistema cambiada a: ${newSystemTheme}`);
          }
        };

        // Añadir listener
        mediaQuery.addEventListener('change', handleSystemThemeChange);
        
        // Marcar como inicializado
        setIsInitialized(true);
        
        logger.info('Tema inicializado correctamente');

        return () => {
          mediaQuery.removeEventListener('change', handleSystemThemeChange);
        };
      } catch (error) {
        logger.error('Error al inicializar el tema:', error);
        setIsInitialized(false);
      }
    };

    initializeTheme();
  }, [theme, applyTheme]);

  // Proporcionar información del tema
  const themeInfo = useMemo(() => {
    const availableThemes = [
      { id: 'light', name: 'Claro', icon: '☀️', description: 'Tema claro' },
      { id: 'dark', name: 'Oscuro', icon: '🌙', description: 'Tema oscuro' },
      { id: 'auto', name: 'Automático', icon: '⚙️', description: 'Según sistema' }
    ];

    const currentThemeConfig = availableThemes.find(t => t.id === theme) || availableThemes[0];
    const isDarkMode = effectiveTheme === 'dark';

    return {
      theme,
      effectiveTheme,
      isDarkMode,
      availableThemes,
      currentTheme: currentThemeConfig,
      isInitialized
    };
  }, [theme, effectiveTheme, isInitialized]);

  // Valor del contexto
  const contextValue = useMemo(() => ({
    ...themeInfo,
    toggleTheme,
    setTheme: toggleTheme,
    isThemeInitialized: isInitialized
  }), [themeInfo, toggleTheme, isInitialized]);

  // Renderizar proveedor
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Componente para cambiar tema rápido
export const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme, isDarkMode, isInitialized } = useTheme();

  if (!isInitialized) {
    return (
      <button 
        className={`theme-toggle loading ${className}`}
        disabled
        aria-label="Cargando tema..."
      >
        <span className="theme-toggle-icon">⏳</span>
      </button>
    );
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return '☀️';
      case 'dark': return '🌙';
      case 'auto': return isDarkMode ? '🌙' : '☀️';
      default: return '⚙️';
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light': return 'Cambiar a oscuro';
      case 'dark': return 'Cambiar a automático';
      case 'auto': return 'Cambiar a claro';
      default: return 'Cambiar tema';
    }
  };

  return (
    <button
      className={`theme-toggle ${className}`}
      onClick={() => toggleTheme()}
      aria-label={getThemeLabel()}
      title={getThemeLabel()}
    >
      <span className="theme-toggle-icon">{getThemeIcon()}</span>
      <span className="theme-toggle-label sr-only">{getThemeLabel()}</span>
    </button>
  );
};

// Componente para detectar y aplicar tema basado en clase CSS
export const ThemeDetector = () => {
  const { effectiveTheme } = useTheme();

  // Añadir clase al body para facilitar estilos específicos
  useEffect(() => {
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${effectiveTheme}`);
  }, [effectiveTheme]);

  return null;
};

export default ThemeContext;