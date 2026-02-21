import { useState, useEffect, useCallback } from 'react';

export const useLocalStorage = (key, initialValue) => {
  // Función para obtener el valor inicial
  const getInitialValue = useCallback(() => {
    try {
      const item = localStorage.getItem(key);
      
      if (item !== null) {
        return JSON.parse(item);
      }
      
      // Si es una función, ejecutarla para obtener el valor inicial
      if (typeof initialValue === 'function') {
        return initialValue();
      }
      
      return initialValue;
    } catch (error) {
      console.error(`Error al leer ${key} de localStorage:`, error);
      
      if (typeof initialValue === 'function') {
        return initialValue();
      }
      
      return initialValue;
    }
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState(getInitialValue);

  // Función para actualizar el valor
  const setValue = useCallback((value) => {
    try {
      // Permitir que value sea una función
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error al guardar ${key} en localStorage:`, error);
    }
  }, [key, storedValue]);

  // Función para eliminar el valor
  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setStoredValue(undefined);
    } catch (error) {
      console.error(`Error al eliminar ${key} de localStorage:`, error);
    }
  }, [key]);

  // Sincronizar con cambios en localStorage de otras pestañas
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === key) {
        if (event.newValue === null) {
          setStoredValue(undefined);
        } else {
          try {
            setStoredValue(JSON.parse(event.newValue));
          } catch (error) {
            console.error(`Error al parsear ${key} de localStorage:`, error);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue, removeValue];
};

// Hook específico para objetos
export const useLocalStorageObject = (key, initialValue = {}) => {
  const [storedValue, setStoredValue] = useLocalStorage(key, initialValue);

  const updateObject = useCallback((updates) => {
    setStoredValue(prev => ({
      ...prev,
      ...(typeof updates === 'function' ? updates(prev) : updates)
    }));
  }, [setStoredValue]);

  const clearObject = useCallback(() => {
    setStoredValue({});
  }, [setStoredValue]);

  return [storedValue, updateObject, clearObject];
};

// Hook específico para arrays
export const useLocalStorageArray = (key, initialValue = []) => {
  const [storedValue, setStoredValue] = useLocalStorage(key, initialValue);

  const addItem = useCallback((item) => {
    setStoredValue(prev => [...prev, item]);
  }, [setStoredValue]);

  const removeItem = useCallback((indexOrPredicate) => {
    setStoredValue(prev => {
      if (typeof indexOrPredicate === 'function') {
        return prev.filter((item, index) => !indexOrPredicate(item, index));
      }
      return prev.filter((_, index) => index !== indexOrPredicate);
    });
  }, [setStoredValue]);

  const updateItem = useCallback((index, updates) => {
    setStoredValue(prev => {
      const newArray = [...prev];
      newArray[index] = typeof updates === 'function' 
        ? updates(newArray[index]) 
        : { ...newArray[index], ...updates };
      return newArray;
    });
  }, [setStoredValue]);

  const clearArray = useCallback(() => {
    setStoredValue([]);
  }, [setStoredValue]);

  return [storedValue, { addItem, removeItem, updateItem, clearArray }];
};

export default useLocalStorage;