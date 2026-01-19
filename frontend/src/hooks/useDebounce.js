import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook para debounce de valores
 * @param {any} value - Valor a debounce
 * @param {number} delay - Retardo en milisegundos
 * @returns {any} Valor debounced
 */
const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Establecer nuevo timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpiar timeout al desmontar
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  // Cancelar debounce manualmente
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Forzar actualización inmediata
  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setDebouncedValue(value);
  }, [value]);

  return {
    value: debouncedValue,
    cancel,
    flush,
    isPending: timeoutRef.current !== null
  };
};

/**
 * Hook para debounce de función
 * @param {Function} func - Función a debounce
 * @param {number} delay - Retardo en milisegundos
 * @param {Array} deps - Dependencias de la función
 * @returns {Function} Función debounced
 */
export const useDebouncedCallback = (func, delay = 500, deps = []) => {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(func);

  // Actualizar referencia de callback cuando cambia
  useEffect(() => {
    callbackRef.current = func;
  }, [func, ...deps]);

  const debouncedFunction = useCallback((...args) => {
    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Establecer nuevo timeout
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]);

  // Cancelar debounce manualmente
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Forzar ejecución inmediata
  const flush = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    callbackRef.current(...args);
  }, []);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    callback: debouncedFunction,
    cancel,
    flush,
    isPending: timeoutRef.current !== null
  };
};

/**
 * Hook para throttle de función
 * @param {Function} func - Función a throttle
 * @param {number} limit - Límite en milisegundos
 * @param {Array} deps - Dependencias de la función
 * @returns {Function} Función throttled
 */
export const useThrottle = (func, limit = 500, deps = []) => {
  const lastRun = useRef(Date.now());
  const timeoutRef = useRef(null);
  const callbackRef = useRef(func);

  // Actualizar referencia de callback cuando cambia
  useEffect(() => {
    callbackRef.current = func;
  }, [func, ...deps]);

  const throttledFunction = useCallback((...args) => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRun.current;

    // Si ha pasado suficiente tiempo, ejecutar inmediatamente
    if (timeSinceLastRun >= limit) {
      lastRun.current = now;
      callbackRef.current(...args);
    } else {
      // Limpiar timeout anterior
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Programar ejecución para cuando pase el tiempo límite
      timeoutRef.current = setTimeout(() => {
        lastRun.current = Date.now();
        callbackRef.current(...args);
      }, limit - timeSinceLastRun);
    }
  }, [limit]);

  // Cancelar throttle manualmente
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Forzar ejecución inmediata
  const flush = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    lastRun.current = Date.now();
    callbackRef.current(...args);
  }, []);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    callback: throttledFunction,
    cancel,
    flush,
    isPending: timeoutRef.current !== null
  };
};

/**
 * Hook para debounce de búsqueda en inventario
 * @param {Function} searchFunction - Función de búsqueda
 * @param {number} delay - Retardo en milisegundos
 * @returns {Object} Funciones y estado de búsqueda debounced
 */
export const useDebouncedSearch = (searchFunction, delay = 300) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);
  
  const { value: debouncedSearchTerm, isPending } = useDebounce(searchTerm, delay);
  
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchTerm.trim()) {
        setResults([]);
        return;
      }
      
      setIsSearching(true);
      try {
        const searchResults = await searchFunction(debouncedSearchTerm);
        setResults(searchResults);
      } catch (error) {
        console.error('Error en búsqueda:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };
    
    performSearch();
  }, [debouncedSearchTerm, searchFunction]);
  
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
  }, []);
  
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setResults([]);
  }, []);
  
  return {
    searchTerm,
    debouncedSearchTerm,
    handleSearch,
    clearSearch,
    results,
    isSearching,
    isPending,
    hasResults: results.length > 0
  };
};

export default useDebounce;