import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import '../assets/styles/context.css';

const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
};

const THEME_COLORS = {
  light: {
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    primaryActive: '#1d4ed8',
    background: '#ffffff',
    surface: '#f8fafc',
    surfaceHover: '#f1f5f9',
    text: '#1e293b',
    textSecondary: '#64748b',
    textDisabled: '#94a3b8',
    border: '#e2e8f0',
    borderHover: '#cbd5e1',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  },
  dark: {
    primary: '#60a5fa',
    primaryHover: '#3b82f6',
    primaryActive: '#2563eb',
    background: '#0f172a',
    surface: '#1e293b',
    surfaceHover: '#334155',
    text: '#f1f5f9',
    textSecondary: '#cbd5e1',
    textDisabled: '#64748b',
    border: '#334155',
    borderHover: '#475569',
    success: '#34d399',
    error: '#f87171',
    warning: '#fbbf24',
    info: '#60a5fa'
  }
};

const isClient = typeof window !== 'undefined';

const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    if (!isClient) return initialValue;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error leyendo localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (isClient) {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error estableciendo localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
};

const ThemeContext = createContext({
  theme: THEMES.LIGHT,
  themePreference: THEMES.AUTO,
  isDarkMode: false,
  colors: THEME_COLORS.light,
  THEMES,
  toggleTheme: () => {},
  setThemeMode: () => {},
  useSystemTheme: () => {},
  useTimeBasedTheme: () => {},
  getColors: () => THEME_COLORS.light,
  isDark: () => false
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error(
      'useTheme debe ser usado dentro de ThemeProvider. ' +
      'Asegúrate de que tu aplicación esté envuelta en <ThemeProvider>.'
    );
  }
  
  return context;
};

export const useThemeColors = () => {
  const theme = useTheme();
  return theme.colors;
};

export const useIsDarkMode = () => {
  const theme = useTheme();
  return theme.isDarkMode;
};

export const ThemeProvider = ({ children, defaultTheme = THEMES.AUTO }) => {
  const [themePreference, setThemePreference] = useLocalStorage('themePreference', defaultTheme);
  const [actualTheme, setActualTheme] = useState(THEMES.LIGHT);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [colors, setColors] = useState(THEME_COLORS.light);
  const [isInitialized, setIsInitialized] = useState(false);

  const getActualTheme = useCallback((preference) => {
    if (!isClient) return THEMES.LIGHT;
    
    if (preference === THEMES.AUTO) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? THEMES.DARK : THEMES.LIGHT;
    }
    
    return preference;
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    try {
      const savedPreference = localStorage.getItem('themePreference');
      if (!savedPreference) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = getActualTheme(THEMES.AUTO);
        setActualTheme(initialTheme);
        setIsDarkMode(initialTheme === THEMES.DARK);
        setColors(THEME_COLORS[initialTheme] || THEME_COLORS.light);
      }
      setIsInitialized(true);
    } catch (error) {
      console.warn('Error inicializando tema:', error);
      setIsInitialized(true);
    }
  }, [getActualTheme]);

  useEffect(() => {
    if (!isClient || !isInitialized) return;
    
    try {
      const theme = getActualTheme(themePreference);
      const themeColors = THEME_COLORS[theme] || THEME_COLORS.light;
      
      setActualTheme(theme);
      setIsDarkMode(theme === THEMES.DARK);
      setColors(themeColors);
      
      const root = document.documentElement;
      
      root.classList.remove(THEMES.LIGHT, THEMES.DARK);
      root.classList.add(theme);
      root.setAttribute('data-theme', theme);
      
      Object.entries(themeColors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value);
      });
      
      root.style.setProperty('--theme-transition', 'all 0.3s ease-in-out');
      
      updateThemeColor(themeColors.primary);
      localStorage.setItem('currentTheme', theme);
      
      const event = new CustomEvent('themechange', { detail: theme });
      window.dispatchEvent(event);
      
    } catch (error) {
      console.error('Error aplicando tema:', error);
    }
  }, [themePreference, getActualTheme, isInitialized]);

  const updateThemeColor = useCallback((color) => {
    if (!isClient) return;
    
    try {
      let metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.name = 'theme-color';
        document.head.appendChild(metaThemeColor);
      }
      metaThemeColor.setAttribute('content', color);
      
      let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (!appleMeta) {
        appleMeta = document.createElement('meta');
        appleMeta.name = 'apple-mobile-web-app-status-bar-style';
        document.head.appendChild(appleMeta);
      }
      appleMeta.setAttribute('content', isDarkMode ? 'black-translucent' : 'default');
      
    } catch (error) {
      console.warn('Error actualizando meta theme-color:', error);
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!isClient) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      if (themePreference === THEMES.AUTO) {
        const newTheme = e.matches ? THEMES.DARK : THEMES.LIGHT;
        setActualTheme(newTheme);
        setIsDarkMode(newTheme === THEMES.DARK);
        setColors(THEME_COLORS[newTheme]);
        
        const event = new CustomEvent('themechange', { detail: newTheme });
        window.dispatchEvent(event);
      }
    };
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
    
    return undefined;
  }, [themePreference]);

  const toggleTheme = useCallback(() => {
    if (themePreference === THEMES.AUTO) {
      const newTheme = actualTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
      setThemePreference(newTheme);
    } else {
      const newTheme = themePreference === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
      setThemePreference(newTheme);
    }
  }, [themePreference, actualTheme, setThemePreference]);

  const setThemeMode = useCallback((mode) => {
    if ([THEMES.LIGHT, THEMES.DARK, THEMES.AUTO].includes(mode)) {
      setThemePreference(mode);
      return true;
    }
    
    console.warn(`Modo de tema inválido: ${mode}. Use ${THEMES.LIGHT}, ${THEMES.DARK} o ${THEMES.AUTO}`);
    return false;
  }, [setThemePreference]);

  const useSystemTheme = useCallback(() => {
    setThemePreference(THEMES.AUTO);
  }, [setThemePreference]);

  const useTimeBasedTheme = useCallback(() => {
    if (!isClient) return;
    
    const hour = new Date().getHours();
    const isNightTime = hour >= 18 || hour < 6;
    setThemePreference(isNightTime ? THEMES.DARK : THEMES.LIGHT);
  }, [setThemePreference]);

  const getColors = useCallback(() => colors, [colors]);

  const isDark = useCallback(() => isDarkMode, [isDarkMode]);

  const value = useMemo(() => ({
    theme: actualTheme,
    themePreference,
    isDarkMode,
    colors,
    THEMES,
    toggleTheme,
    setThemeMode,
    useSystemTheme,
    useTimeBasedTheme,
    getColors,
    isDark
  }), [
    actualTheme,
    themePreference,
    isDarkMode,
    colors,
    toggleTheme,
    setThemeMode,
    useSystemTheme,
    useTimeBasedTheme,
    getColors,
    isDark
  ]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
  defaultTheme: PropTypes.oneOf([THEMES.LIGHT, THEMES.DARK, THEMES.AUTO])
};

ThemeProvider.defaultProps = {
  defaultTheme: THEMES.AUTO
};