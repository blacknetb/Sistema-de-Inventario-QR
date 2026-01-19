import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para obtener y monitorear el tamaño de la ventana
 * @param {Object} options - Opciones de configuración
 * @returns {Object} Dimensiones de la ventana y funciones utilitarias
 */
const useWindowSize = (options = {}) => {
  const {
    throttleDelay = 100,
    includeScrollbar = true,
    initialWidth = typeof window !== 'undefined' ? window.innerWidth : 0,
    initialHeight = typeof window !== 'undefined' ? window.innerHeight : 0
  } = options;

  const [windowSize, setWindowSize] = useState({
    width: initialWidth,
    height: initialHeight,
    innerWidth: initialWidth,
    innerHeight: initialHeight,
    outerWidth: initialWidth,
    outerHeight: initialHeight
  });

  const [breakpoint, setBreakpoint] = useState('');
  const [orientation, setOrientation] = useState('landscape');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Breakpoints comunes
  const breakpoints = {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400
  };

  // Determinar breakpoint actual
  const determineBreakpoint = useCallback((width) => {
    if (width >= breakpoints.xxl) return 'xxl';
    if (width >= breakpoints.xl) return 'xl';
    if (width >= breakpoints.lg) return 'lg';
    if (width >= breakpoints.md) return 'md';
    if (width >= breakpoints.sm) return 'sm';
    return 'xs';
  }, [breakpoints]);

  // Determinar orientación
  const determineOrientation = useCallback((width, height) => {
    return width > height ? 'landscape' : 'portrait';
  }, []);

  // Determinar tipo de dispositivo
  const determineDeviceType = useCallback((width, currentBreakpoint) => {
    const mobile = width < breakpoints.md;
    const tablet = width >= breakpoints.md && width < breakpoints.lg;
    const desktop = width >= breakpoints.lg;
    
    setIsMobile(mobile);
    setIsTablet(tablet);
    setIsDesktop(desktop);
    
    return { mobile, tablet, desktop };
  }, [breakpoints]);

  // Manejar cambio de tamaño
  const handleResize = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = includeScrollbar ? window.innerWidth : document.documentElement.clientWidth;
    const height = includeScrollbar ? window.innerHeight : document.documentElement.clientHeight;
    
    const newBreakpoint = determineBreakpoint(width);
    const newOrientation = determineOrientation(width, height);
    
    setWindowSize({
      width,
      height,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight
    });
    
    setBreakpoint(newBreakpoint);
    setOrientation(newOrientation);
    determineDeviceType(width, newBreakpoint);
  }, [includeScrollbar, determineBreakpoint, determineOrientation, determineDeviceType]);

  // Throttle para el evento resize
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId = null;
    let lastCallTime = 0;

    const throttledResize = () => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallTime;

      if (timeSinceLastCall >= throttleDelay) {
        lastCallTime = now;
        handleResize();
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          lastCallTime = Date.now();
          handleResize();
        }, throttleDelay - timeSinceLastCall);
      }
    };

    // Llamada inicial
    handleResize();

    // Agregar event listener
    window.addEventListener('resize', throttledResize);
    window.addEventListener('orientationchange', throttledResize);

    // Limpiar event listeners
    return () => {
      window.removeEventListener('resize', throttledResize);
      window.removeEventListener('orientationchange', throttledResize);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [handleResize, throttleDelay]);

  // Verificar si está en un rango específico
  const isInRange = useCallback((min, max) => {
    const width = windowSize.width;
    return width >= min && width <= max;
  }, [windowSize.width]);

  // Verificar si es mayor que un breakpoint
  const isAbove = useCallback((bp) => {
    const width = windowSize.width;
    const bpValue = breakpoints[bp] || bp;
    return width >= bpValue;
  }, [windowSize.width, breakpoints]);

  // Verificar si es menor que un breakpoint
  const isBelow = useCallback((bp) => {
    const width = windowSize.width;
    const bpValue = breakpoints[bp] || bp;
    return width < bpValue;
  }, [windowSize.width, breakpoints]);

  // Obtener dimensiones disponibles (restar márgenes, padding, etc.)
  const getAvailableDimensions = useCallback((margins = { top: 0, right: 0, bottom: 0, left: 0 }) => {
    const { top = 0, right = 0, bottom = 0, left = 0 } = margins;
    
    return {
      width: Math.max(0, windowSize.width - left - right),
      height: Math.max(0, windowSize.height - top - bottom)
    };
  }, [windowSize]);

  // Calcular tamaño para grid o columnas
  const calculateGridSize = useCallback((columns, gutter = 16) => {
    const availableWidth = windowSize.width - (gutter * (columns - 1));
    const columnWidth = availableWidth / columns;
    
    return {
      columnWidth: Math.floor(columnWidth),
      columns,
      gutter,
      totalWidth: windowSize.width
    };
  }, [windowSize.width]);

  // Verificar si la ventana está en modo pantalla completa
  const isFullscreen = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    return (
      window.innerHeight === screen.height &&
      window.innerWidth === screen.width
    );
  }, []);

  // Obtener información del viewport
  const getViewportInfo = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    return {
      width: windowSize.width,
      height: windowSize.height,
      pixelRatio: window.devicePixelRatio || 1,
      colorDepth: screen.colorDepth,
      orientation,
      breakpoint,
      isMobile,
      isTablet,
      isDesktop,
      isLandscape: orientation === 'landscape',
      isPortrait: orientation === 'portrait',
      isFullscreen: isFullscreen(),
      screenWidth: screen.width,
      screenHeight: screen.height,
      availableWidth: screen.availWidth,
      availableHeight: screen.availHeight
    };
  }, [windowSize, orientation, breakpoint, isMobile, isTablet, isDesktop, isFullscreen]);

  // Forzar actualización manual
  const updateSize = useCallback(() => {
    handleResize();
  }, [handleResize]);

  return {
    // Dimensiones
    ...windowSize,
    
    // Información del dispositivo
    breakpoint,
    orientation,
    isMobile,
    isTablet,
    isDesktop,
    isLandscape: orientation === 'landscape',
    isPortrait: orientation === 'portrait',
    
    // Breakpoints
    breakpoints,
    
    // Funciones utilitarias
    isInRange,
    isAbove,
    isBelow,
    getAvailableDimensions,
    calculateGridSize,
    isFullscreen,
    getViewportInfo,
    updateSize,
    
    // Métodos de conveniencia
    isSmallScreen: isMobile,
    isMediumScreen: isTablet,
    isLargeScreen: isDesktop,
    
    // Alias comunes
    w: windowSize.width,
    h: windowSize.height,
    bp: breakpoint,
    
    // Información para responsive design
    responsiveInfo: {
      isXs: breakpoint === 'xs',
      isSm: breakpoint === 'sm',
      isMd: breakpoint === 'md',
      isLg: breakpoint === 'lg',
      isXl: breakpoint === 'xl',
      isXxl: breakpoint === 'xxl'
    }
  };
};

export default useWindowSize;