import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * ✅ HOOK DE LOCALSTORAGE MEJORADO - COMPATIBLE CON BACKEND
 * Ahora incluye sincronización opcional con API REST
 */
const DEFAULT_CONFIG = {
  syncAcrossTabs: true,
  parseJSON: true,
  validate: null,
  defaultValue: null,
  syncWithAPI: false, // ✅ NUEVO: Sincronizar con API
  apiEndpoint: '/api/sync/local-storage', // Endpoint para sincronizar
  syncDebounce: 1000,
  onSyncError: null
};

/**
 * Hook principal para localStorage con sincronización API
 */
export const useLocalStorage = (key, initialValue, config = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const {
    syncAcrossTabs,
    parseJSON,
    validate,
    defaultValue,
    syncWithAPI,
    apiEndpoint,
    syncDebounce,
    onSyncError
  } = finalConfig;

  const [storedValue, setStoredValue] = useState(() => {
    try {
      if (typeof window === 'undefined') return initialValue;
      
      const item = window.localStorage.getItem(key);
      
      if (item === null) return initialValue;
      
      if (parseJSON) {
        const parsed = JSON.parse(item);
        
        if (validate && !validate(parsed)) {
          console.warn(`Valor inválido para la clave ${key}, usando valor por defecto`);
          return defaultValue !== undefined ? defaultValue : initialValue;
        }
        
        return parsed;
      }
      
      return item;
    } catch (error) {
      console.error(`Error leyendo localStorage key "${key}":`, error);
      return initialValue;
    }
  });
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const mountedRef = useRef(true);
  const isSettingRef = useRef(false);
  const syncTimeoutRef = useRef(null);

  /**
   * ✅ Sincronizar con API REST
   */
  const syncWithBackend = useCallback(async (value) => {
    if (!syncWithAPI || !mountedRef.current) return;
    
    try {
      setIsSyncing(true);
      setSyncError(null);
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          key,
          value,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          origin: window.location.origin
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error de sincronización: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`✅ LocalStorage sincronizado con backend: ${key}`, result);
      
    } catch (error) {
      console.error(`❌ Error sincronizando ${key} con backend:`, error);
      setSyncError(error.message);
      onSyncError?.(error, { key, value });
    } finally {
      if (mountedRef.current) {
        setIsSyncing(false);
      }
    }
  }, [syncWithAPI, apiEndpoint, key, onSyncError]);

  /**
   * ✅ Sincronización con debounce
   */
  const debouncedSync = useCallback((value) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(() => {
      syncWithBackend(value);
    }, syncDebounce);
  }, [syncDebounce, syncWithBackend]);

  /**
   * ✅ Obtener valor
   */
  const getValue = useCallback(() => {
    try {
      if (typeof window === 'undefined') return null;
      
      const item = window.localStorage.getItem(key);
      if (item === null) return null;
      
      return parseJSON ? JSON.parse(item) : item;
    } catch (error) {
      console.error(`Error obteniendo localStorage key "${key}":`, error);
      return null;
    }
  }, [key, parseJSON]);

  /**
   * ✅ Establecer valor con sincronización
   */
  const setValue = useCallback((value) => {
    try {
      if (!mountedRef.current) return false;
      
      isSettingRef.current = true;
      
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      if (validate && !validate(valueToStore)) {
        console.warn(`Valor inválido para la clave ${key}`);
        return false;
      }
      
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        const serialized = parseJSON 
          ? JSON.stringify(valueToStore) 
          : String(valueToStore);
        
        window.localStorage.setItem(key, serialized);
        
        // ✅ Sincronizar con backend si está habilitado
        if (syncWithAPI) {
          debouncedSync(valueToStore);
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Error estableciendo localStorage key "${key}":`, error);
      return false;
    } finally {
      isSettingRef.current = false;
    }
  }, [key, parseJSON, storedValue, validate, syncWithAPI, debouncedSync]);

  /**
   * ✅ Remover valor
   */
  const removeValue = useCallback(async () => {
    try {
      if (!mountedRef.current) return false;
      
      setStoredValue(defaultValue !== undefined ? defaultValue : initialValue);
      
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
        
        // ✅ Sincronizar eliminación con backend
        if (syncWithAPI) {
          await fetch(apiEndpoint, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: JSON.stringify({ key })
          });
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Error removiendo localStorage key "${key}":`, error);
      return false;
    }
  }, [key, defaultValue, initialValue, syncWithAPI, apiEndpoint]);

  /**
   * ✅ Cargar datos desde API
   */
  const loadFromBackend = useCallback(async () => {
    if (!syncWithAPI || !mountedRef.current) return null;
    
    try {
      setIsSyncing(true);
      
      const response = await fetch(`${apiEndpoint}?key=${encodeURIComponent(key)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error cargando datos: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.value) {
        setValue(data.value);
        return data.value;
      }
      
      return null;
    } catch (error) {
      console.error(`Error cargando ${key} desde backend:`, error);
      return null;
    } finally {
      if (mountedRef.current) {
        setIsSyncing(false);
      }
    }
  }, [key, syncWithAPI, apiEndpoint, setValue]);

  /**
   * ✅ Manejar evento storage
   */
  const handleStorageChange = useCallback((event) => {
    if (event.key === key && !isSettingRef.current && mountedRef.current) {
      try {
        const newValue = event.newValue;
        
        if (newValue === null) {
          setStoredValue(defaultValue !== undefined ? defaultValue : initialValue);
        } else {
          const parsedValue = parseJSON ? JSON.parse(newValue) : newValue;
          
          if (validate && !validate(parsedValue)) {
            console.warn(`Valor inválido recibido para la clave ${key}`);
            return;
          }
          
          setStoredValue(parsedValue);
          
          // ✅ Sincronizar con backend si cambia desde otra pestaña
          if (syncWithAPI && event.storageArea === localStorage) {
            debouncedSync(parsedValue);
          }
        }
      } catch (error) {
        console.error(`Error procesando cambio de localStorage key "${key}":`, error);
      }
    }
  }, [key, parseJSON, validate, defaultValue, initialValue, syncWithAPI, debouncedSync]);

  /**
   * ✅ Efectos
   */
  useEffect(() => {
    mountedRef.current = true;
    
    // ✅ Cargar datos iniciales desde backend si hay token
    if (syncWithAPI && localStorage.getItem('token')) {
      loadFromBackend();
    }
    
    if (syncAcrossTabs && typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
    }
    
    return () => {
      mountedRef.current = false;
      
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      
      if (syncAcrossTabs && typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
      }
    };
  }, [syncAcrossTabs, handleStorageChange, syncWithAPI, loadFromBackend]);

  return {
    // Valor
    value: storedValue,
    setValue,
    
    // Acciones
    removeValue,
    getValue,
    
    // Sincronización
    syncWithBackend,
    loadFromBackend,
    isSyncing,
    syncError,
    
    // Información
    hasKey: () => {
      try {
        if (typeof window === 'undefined') return false;
        return window.localStorage.getItem(key) !== null;
      } catch (error) {
        return false;
      }
    },
    
    // Utilidades
    clear: () => {
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.clear();
          setStoredValue(defaultValue !== undefined ? defaultValue : initialValue);
          return true;
        }
        return false;
      } catch (error) {
        return false;
      }
    },
    
    // Configuración
    key,
    config: finalConfig
  };
};