import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * ✅ HOOK DE DEBOUNCE Y THROTTLE MEJORADO - VERSIÓN CORREGIDA
 * Correcciones aplicadas:
 * 1. Eliminados memory leaks en timers
 * 2. Mejor manejo de cleanup
 * 3. Simplificación de lógica compleja
 * 4. Optimización de rendimiento
 */

// ✅ Configuración por defecto optimizada
const DEBOUNCE_DEFAULT_OPTIONS = {
  leading: false,
  trailing: true,
  maxWait: 0
};

const THROTTLE_DEFAULT_OPTIONS = {
  leading: true,
  trailing: true
};

/**
 * ✅ Hook para debounce de valores - VERSIÓN CORREGIDA
 */
export const useDebounce = (value, delay = 500, options = {}) => {
  const {
    leading,
    trailing,
    maxWait
  } = { ...DEBOUNCE_DEFAULT_OPTIONS, ...options };

  const [debouncedValue, setDebouncedValue] = useState(value);
  const timerRef = useRef(null);
  const maxTimerRef = useRef(null);
  const leadingCalledRef = useRef(false);
  const valueRef = useRef(value);
  const mountedRef = useRef(true);

  /**
   * ✅ MEJORA CORREGIDA: Cancelación con cleanup seguro
   */
  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
    leadingCalledRef.current = false;
  }, []);

  /**
   * ✅ Flush inmediato
   */
  const flush = useCallback(() => {
    cancel();
    if (mountedRef.current) {
      setDebouncedValue(valueRef.current);
      leadingCalledRef.current = false;
    }
  }, [cancel]);

  /**
   * ✅ MEJORA CORREGIDA: Efecto principal optimizado
   */
  useEffect(() => {
    mountedRef.current = true;
    valueRef.current = value;
    
    // ✅ Leading edge: ejecutar inmediatamente en el primer cambio
    if (leading && !leadingCalledRef.current) {
      setDebouncedValue(value);
      leadingCalledRef.current = true;
    }
    
    // ✅ Cancelar timers anteriores
    cancel();
    
    // ✅ Max wait timer
    if (maxWait > 0 && trailing) {
      maxTimerRef.current = setTimeout(() => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        if (mountedRef.current) {
          setDebouncedValue(valueRef.current);
          leadingCalledRef.current = false;
        }
      }, maxWait);
    }
    
    // ✅ Trailing edge: ejecutar después del delay
    if (trailing) {
      timerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setDebouncedValue(valueRef.current);
          leadingCalledRef.current = false;
        }
        
        if (maxTimerRef.current) {
          clearTimeout(maxTimerRef.current);
          maxTimerRef.current = null;
        }
      }, delay);
    }
    
    return () => {
      mountedRef.current = false;
      cancel();
    };
  }, [value, delay, leading, trailing, maxWait, cancel]);

  return {
    value: debouncedValue,
    cancel,
    flush,
    isPending: !!timerRef.current,
    originalValue: value
  };
};

/**
 * ✅ Hook para debounce de funciones - VERSIÓN CORREGIDA
 */
export const useDebouncedCallback = (callback, delay = 500, options = {}) => {
  const {
    leading,
    trailing,
    maxWait
  } = { ...DEBOUNCE_DEFAULT_OPTIONS, ...options };

  const callbackRef = useRef(callback);
  const timerRef = useRef(null);
  const maxTimerRef = useRef(null);
  const lastArgsRef = useRef([]);
  const lastThisRef = useRef();
  const mountedRef = useRef(true);

  // ✅ Actualizar callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  /**
   * ✅ MEJORA CORREGIDA: Cancelación segura
   */
  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
    lastArgsRef.current = [];
    lastThisRef.current = undefined;
  }, []);

  /**
   * ✅ Flush inmediato
   */
  const flush = useCallback(() => {
    cancel();
    if (lastArgsRef.current.length > 0) {
      callbackRef.current.apply(lastThisRef.current, lastArgsRef.current);
      lastArgsRef.current = [];
      lastThisRef.current = undefined;
    }
  }, [cancel]);

  /**
   * ✅ MEJORA CORREGIDA: Función debounced principal simplificada
   */
  const debounced = useCallback(function(...args) {
    if (!mountedRef.current) return;
    
    lastArgsRef.current = args;
    lastThisRef.current = this;
    
    const executeCallback = () => {
      if (mountedRef.current) {
        callbackRef.current.apply(lastThisRef.current, lastArgsRef.current);
        lastArgsRef.current = [];
        lastThisRef.current = undefined;
      }
    };
    
    // ✅ Cancelar timers anteriores
    cancel();
    
    // ✅ Max wait timer
    if (maxWait > 0 && trailing) {
      maxTimerRef.current = setTimeout(() => {
        executeCallback();
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      }, maxWait);
    }
    
    // ✅ Leading edge
    if (leading) {
      executeCallback();
    }
    
    // ✅ Trailing edge
    if (trailing) {
      timerRef.current = setTimeout(() => {
        executeCallback();
        if (maxTimerRef.current) {
          clearTimeout(maxTimerRef.current);
          maxTimerRef.current = null;
        }
      }, delay);
    }
  }, [delay, leading, trailing, maxWait, cancel]);

  // ✅ Agregar métodos a la función debounced
  Object.assign(debounced, {
    cancel,
    flush,
    isPending: () => !!timerRef.current
  });

  // ✅ Cleanup
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      cancel();
    };
  }, [cancel]);

  return debounced;
};

/**
 * ✅ Hook para throttle - VERSIÓN CORREGIDA
 */
export const useThrottle = (value, delay = 500, options = {}) => {
  const {
    leading,
    trailing
  } = { ...THROTTLE_DEFAULT_OPTIONS, ...options };

  const [throttledValue, setThrottledValue] = useState(value);
  const timerRef = useRef(null);
  const lastExecRef = useRef(0);
  const valueRef = useRef(value);
  const mountedRef = useRef(true);

  /**
   * ✅ Cancelación
   */
  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /**
   * ✅ Flush inmediato
   */
  const flush = useCallback(() => {
    cancel();
    if (mountedRef.current) {
      setThrottledValue(valueRef.current);
      lastExecRef.current = Date.now();
    }
  }, [cancel]);

  /**
   * ✅ MEJORA CORREGIDA: Efecto principal simplificado
   */
  useEffect(() => {
    mountedRef.current = true;
    valueRef.current = value;
    
    const now = Date.now();
    const timeSinceLastExec = now - lastExecRef.current;
    
    // ✅ Si ha pasado suficiente tiempo desde la última ejecución
    if (timeSinceLastExec >= delay) {
      if (leading && mountedRef.current) {
        setThrottledValue(value);
        lastExecRef.current = now;
      }
      
      // Cancelar timer anterior
      cancel();
      
      // Configurar timer para trailing
      if (trailing) {
        timerRef.current = setTimeout(() => {
          if (mountedRef.current) {
            setThrottledValue(valueRef.current);
            lastExecRef.current = Date.now();
          }
        }, delay);
      }
    } else if (trailing && !timerRef.current) {
      // Configurar timer para trailing si no hay uno
      const timeLeft = delay - timeSinceLastExec;
      timerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setThrottledValue(valueRef.current);
          lastExecRef.current = Date.now();
          timerRef.current = null;
        }
      }, timeLeft);
    }
    
    return () => {
      mountedRef.current = false;
      cancel();
    };
  }, [value, delay, leading, trailing, cancel]);

  return {
    value: throttledValue,
    cancel,
    flush,
    isPending: !!timerRef.current,
    lastExecution: lastExecRef.current,
    timeSinceLastExecution: Date.now() - lastExecRef.current
  };
};

/**
 * ✅ Hook para búsqueda con debounce mejorado - VERSIÓN CORREGIDA
 */
export const useDebouncedSearch = (searchFunction, delay = 500, options = {}) => {
  const {
    minLength = 0,
    immediate = false,
    initialResults = null,
    keepPreviousResults = true
  } = options;

  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState(initialResults);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const cacheRef = useRef(new Map());
  const mountedRef = useRef(true);

  /**
   * ✅ MEJORA CORREGIDA: Debounce optimizado
   */
  const debouncedSearchTerm = useDebounce(searchTerm, delay, {
    leading: immediate,
    trailing: true
  });

  /**
   * ✅ MEJORA CORREGIDA: Función de búsqueda con caché simplificada
   */
  const performSearch = useCallback(async (term) => {
    if (!mountedRef.current) return;
    
    // ✅ Validar longitud mínima
    if (minLength > 0 && term.length < minLength) {
      setResults(keepPreviousResults ? results : null);
      setLoading(false);
      setError(null);
      return;
    }
    
    // ✅ Verificar caché
    if (cacheRef.current.has(term)) {
      const cachedResult = cacheRef.current.get(term);
      setResults(cachedResult);
      setLoading(false);
      setError(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await searchFunction(term);
      
      if (!mountedRef.current) return;
      
      setResults(result);
      
      // ✅ Actualizar caché
      cacheRef.current.set(term, result);
      
      // ✅ Agregar a historial
      if (term && result) {
        setHistory(prev => {
          const newHistory = prev.filter(item => item.term !== term);
          newHistory.unshift({
            term,
            results: result,
            timestamp: Date.now(),
            resultCount: Array.isArray(result) ? result.length : 1
          });
          
          // Limitar historial
          if (newHistory.length > 20) {
            newHistory.pop();
          }
          
          return newHistory;
        });
      }
    } catch (err) {
      if (!mountedRef.current) return;
      
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Error en la búsqueda';
      
      setError(errorMessage);
      console.error('Search error:', err);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [minLength, searchFunction, keepPreviousResults, results]);

  /**
   * ✅ MEJORA CORREGIDA: Efecto para búsqueda debounced
   */
  useEffect(() => {
    if (debouncedSearchTerm.value !== undefined && mountedRef.current) {
      performSearch(debouncedSearchTerm.value);
    }
  }, [debouncedSearchTerm.value, performSearch]);

  /**
   * ✅ Buscar inmediatamente
   */
  const searchImmediately = useCallback((term) => {
    setSearchTerm(term);
    debouncedSearchTerm.flush();
  }, [debouncedSearchTerm]);

  /**
   * ✅ Limpiar búsqueda
   */
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setResults(keepPreviousResults ? results : null);
    setError(null);
    debouncedSearchTerm.cancel();
  }, [debouncedSearchTerm, keepPreviousResults, results]);

  /**
   * ✅ Usar item del historial
   */
  const useHistoryItem = useCallback((index) => {
    if (history[index]) {
      const { term, results: historyResults } = history[index];
      setSearchTerm(term);
      setResults(historyResults);
      setLoading(false);
      setError(null);
      return true;
    }
    return false;
  }, [history]);

  /**
   * ✅ Limpiar historial
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    cacheRef.current.clear();
  }, []);

  /**
   * ✅ Limpiar caché
   */
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  /**
   * ✅ Obtener sugerencias del historial
   */
  const getSuggestions = useCallback((maxSuggestions = 5) => {
    if (!searchTerm.trim()) return [];
    
    const searchLower = searchTerm.toLowerCase();
    return history
      .filter(item => 
        item.term.toLowerCase().includes(searchLower) && 
        item.term !== searchTerm
      )
      .slice(0, maxSuggestions)
      .map(item => item.term);
  }, [history, searchTerm]);

  // ✅ Cleanup
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      debouncedSearchTerm.cancel();
    };
  }, [debouncedSearchTerm]);

  return {
    // Estado
    searchTerm,
    setSearchTerm,
    results,
    loading,
    error,
    history,
    
    // Acciones
    searchImmediately,
    clearSearch,
    useHistoryItem,
    clearHistory,
    clearCache,
    getSuggestions,
    
    // Información
    isSearching: loading,
    hasResults: results !== null,
    isEmpty: searchTerm.length >= minLength && results === null && !loading && !error,
    debouncedValue: debouncedSearchTerm.value,
    suggestionCount: getSuggestions().length,
    
    // Métodos del debounce
    cancelDebounce: debouncedSearchTerm.cancel,
    flushDebounce: debouncedSearchTerm.flush,
    isDebouncePending: debouncedSearchTerm.isPending,
    
    // Cache info
    cacheSize: cacheRef.current.size,
    hasCache: cacheRef.current.size > 0
  };
};