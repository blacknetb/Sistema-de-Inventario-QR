import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * ✅ HOOK DE TEMA MEJORADO - VERSIÓN CORREGIDA
 * Correcciones aplicadas:
 * 1. Compatibilidad con estilos CSS proporcionados
 * 2. Eliminada modificación directa de style.transition
 * 3. Mejor manejo de clases CSS
 * 4. Compatibilidad con variables.css del proyecto
 */

// ✅ Temas soportados
const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

// ✅ Clases CSS compatibles con el proyecto
const THEME_CLASSES = {
  [THEMES.LIGHT]: 'theme-light',
  [THEMES.DARK]: 'theme-dark'
};

// ✅ Atributos data para compatibilidad
const THEME_ATTRIBUTES = {
  [THEMES.LIGHT]: 'light',
  [THEMES.DARK]: 'dark'
};

// ✅ Configuración por defecto
const DEFAULT_CONFIG = {
  storageKey: 'app_theme',
  detectSystem: true,
  transitionDuration: 300,
  persist: true,
  useCSSVariables: true // Compatible con variables.css
};

/**
 * ✅ Hook principal de tema - VERSIÓN CORREGIDA
 */
export const useTheme = (config = {}) => {
  // ✅ Configuración estable
  const finalConfig = useRef({ ...DEFAULT_CONFIG, ...config }).current;
  
  const {
    storageKey,
    detectSystem,
    transitionDuration,
    persist,
    useCSSVariables
  } = finalConfig;

  // ✅ Estado con detección inicial inteligente
  const [theme, setTheme] = useState(() => {
    if (persist && typeof window !== 'undefined') {
      try {
        const savedTheme = localStorage.getItem(storageKey);
        if (savedTheme && Object.values(THEMES).includes(savedTheme)) {
          return savedTheme;
        }
      } catch (error) {
        console.warn('Error loading theme from storage:', error);
      }
    }
    
    // ✅ Detección del sistema
    if (detectSystem && typeof window !== 'undefined') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return systemPrefersDark ? THEMES.DARK : THEMES.LIGHT;
    }
    
    return THEMES.LIGHT;
  });
  
  const [resolvedTheme, setResolvedTheme] = useState(() => {
    if (typeof window === 'undefined') return THEMES.LIGHT;
    
    return theme === THEMES.SYSTEM 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? THEMES.DARK : THEMES.LIGHT)
      : theme;
  });
  
  const [isTransitioning, setIsTransitioning] = useState(false);
  const mountedRef = useRef(true);
  const mediaQueryRef = useRef(null);
  const transitionTimeoutRef = useRef(null);

  /**
   * ✅ MEJORA CORREGIDA: Aplicar tema con clases CSS (sin modificar style.transition)
   */
  const applyTheme = useCallback((newTheme, shouldTransition = true) => {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    const oldThemeClass = THEME_CLASSES[resolvedTheme];
    const newThemeClass = THEME_CLASSES[newTheme];
    const oldThemeAttr = THEME_ATTRIBUTES[resolvedTheme];
    const newThemeAttr = THEME_ATTRIBUTES[newTheme];
    
    // ✅ Limpiar timeout anterior
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    
    // ✅ Aplicar transición con clases CSS
    if (shouldTransition && transitionDuration > 0) {
      setIsTransitioning(true);
      
      // ✅ Agregar clase de transición
      root.classList.add('theme-transitioning');
      
      // ✅ Configurar duración de transición
      root.style.setProperty('--theme-transition-duration', `${transitionDuration}ms`);
      
      // ✅ Remover clase anterior después de un breve delay
      if (oldThemeClass) {
        root.classList.remove(oldThemeClass);
      }
      if (oldThemeAttr) {
        root.removeAttribute('data-theme');
      }
      
      // ✅ Timeout para aplicar nueva clase
      transitionTimeoutRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        
        // ✅ Aplicar nueva clase
        if (newThemeClass) {
          root.classList.add(newThemeClass);
        }
        
        // ✅ Actualizar atributo data-theme
        root.setAttribute('data-theme', newThemeAttr || newTheme);
        
        // ✅ Actualizar meta tag para PWA
        updateThemeMeta(newTheme);
        
        // ✅ Remover clase de transición
        root.classList.remove('theme-transitioning');
        
        setIsTransitioning(false);
        transitionTimeoutRef.current = null;
      }, 50); // Pequeño delay para permitir que el DOM se actualice
    } else {
      // ✅ Sin transición
      if (oldThemeClass) {
        root.classList.remove(oldThemeClass);
      }
      if (newThemeClass) {
        root.classList.add(newThemeClass);
      }
      
      root.setAttribute('data-theme', newThemeAttr || newTheme);
      updateThemeMeta(newTheme);
    }
  }, [resolvedTheme, transitionDuration]);

  /**
   * ✅ Actualizar meta tag de tema
   */
  const updateThemeMeta = useCallback((theme) => {
    if (typeof document === 'undefined') return;
    
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const colors = {
        [THEMES.LIGHT]: '#ffffff',
        [THEMES.DARK]: '#1a1a1a'
      };
      metaThemeColor.setAttribute('content', colors[theme] || colors[THEMES.LIGHT]);
    }
  }, []);

  /**
   * ✅ Cambiar tema
   */
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
    const newResolvedTheme = newTheme;
    
    setTheme(newTheme);
    setResolvedTheme(newResolvedTheme);
    applyTheme(newResolvedTheme, true);
    
    // ✅ Persistir
    if (persist && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, newTheme);
      } catch (error) {
        console.warn('Error saving theme to storage:', error);
      }
    }
  }, [resolvedTheme, applyTheme, persist, storageKey]);

  /**
   * ✅ Establecer tema específico
   */
  const setThemeDirect = useCallback((newTheme, options = {}) => {
    const { shouldTransition = true } = options;
    
    if (!Object.values(THEMES).includes(newTheme)) {
      console.warn(`Invalid theme: ${newTheme}`);
      return;
    }
    
    const newResolvedTheme = newTheme === THEMES.SYSTEM 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? THEMES.DARK : THEMES.LIGHT)
      : newTheme;
    
    setTheme(newTheme);
    setResolvedTheme(newResolvedTheme);
    applyTheme(newResolvedTheme, shouldTransition);
    
    // ✅ Persistir
    if (persist && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, newTheme);
      } catch (error) {
        console.warn('Error saving theme to storage:', error);
      }
    }
  }, [applyTheme, persist, storageKey]);

  /**
   * ✅ Restablecer tema al del sistema
   */
  const resetToSystem = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const systemTheme = systemPrefersDark ? THEMES.DARK : THEMES.LIGHT;
    
    setTheme(THEMES.SYSTEM);
    setResolvedTheme(systemTheme);
    applyTheme(systemTheme, true);
    
    // ✅ Persistir
    if (persist && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, THEMES.SYSTEM);
      } catch (error) {
        console.warn('Error saving theme to storage:', error);
      }
    }
  }, [applyTheme, persist, storageKey]);

  /**
   * ✅ Escuchar cambios en las preferencias del sistema
   */
  const handleSystemPreferenceChange = useCallback((event) => {
    if (theme === THEMES.SYSTEM && mountedRef.current) {
      const newResolvedTheme = event.matches ? THEMES.DARK : THEMES.LIGHT;
      setResolvedTheme(newResolvedTheme);
      applyTheme(newResolvedTheme, true);
    }
  }, [theme, applyTheme]);

  /**
   * ✅ Obtener color del tema para estilos dinámicos
   */
  const getThemeColor = useCallback((lightColor, darkColor) => {
    return resolvedTheme === THEMES.DARK ? darkColor : lightColor;
  }, [resolvedTheme]);

  /**
   * ✅ Verificar si el tema actual es oscuro
   */
  const isDark = useCallback(() => {
    return resolvedTheme === THEMES.DARK;
  }, [resolvedTheme]);

  /**
   * ✅ Verificar si el tema actual es claro
   */
  const isLight = useCallback(() => {
    return resolvedTheme === THEMES.LIGHT;
  }, [resolvedTheme]);

  /**
   * ✅ Verificar si está usando tema del sistema
   */
  const isSystem = useCallback(() => {
    return theme === THEMES.SYSTEM;
  }, [theme]);

  /**
   * ✅ Obtener tema del sistema
   */
  const getSystemTheme = useCallback(() => {
    if (typeof window === 'undefined') return THEMES.LIGHT;
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? THEMES.DARK 
      : THEMES.LIGHT;
  }, []);

  /**
   * ✅ MEJORA CORREGIDA: Aplicar tema inicial seguro
   */
  useEffect(() => {
    mountedRef.current = true;
    
    // ✅ Aplicar tema actual
    applyTheme(resolvedTheme, false);
    
    // ✅ Configurar listener para cambios en preferencias del sistema
    if (detectSystem && typeof window !== 'undefined') {
      mediaQueryRef.current = window.matchMedia('(prefers-color-scheme: dark)');
      
      // ✅ Usar addEventListener en lugar de addListener para compatibilidad moderna
      const handler = (event) => handleSystemPreferenceChange(event);
      mediaQueryRef.current.addEventListener('change', handler);
      
      return () => {
        mountedRef.current = false;
        
        // ✅ Limpiar timeout
        if (transitionTimeoutRef.current) {
          clearTimeout(transitionTimeoutRef.current);
        }
        
        // ✅ Limpiar listener
        if (mediaQueryRef.current) {
          mediaQueryRef.current.removeEventListener('change', handler);
        }
      };
    }
    
    return () => {
      mountedRef.current = false;
      
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [applyTheme, detectSystem, handleSystemPreferenceChange, resolvedTheme]);

  return {
    // Estado
    theme,
    resolvedTheme,
    isTransitioning,
    
    // Acciones
    toggleTheme,
    setTheme: setThemeDirect,
    resetToSystem,
    
    // Verificaciones
    isDark,
    isLight,
    isSystem,
    getSystemTheme,
    
    // Utilidades
    getThemeColor,
    themes: THEMES,
    
    // Información
    isDarkTheme: resolvedTheme === THEMES.DARK,
    isLightTheme: resolvedTheme === THEMES.LIGHT,
    isSystemTheme: theme === THEMES.SYSTEM,
    
    // Configuración
    config: finalConfig
  };
};