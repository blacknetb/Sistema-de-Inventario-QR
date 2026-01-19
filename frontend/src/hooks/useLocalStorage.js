import { useState, useEffect } from 'react';

/**
 * Hook para manejar localStorage de forma segura
 * @param {string} key - Clave para almacenar en localStorage
 * @param {any} initialValue - Valor inicial
 * @returns {Array} [valor, función para actualizar]
 */
const useLocalStorage = (key, initialValue) => {
  // Estado para almacenar nuestro valor
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      // Obtener del localStorage
      const item = window.localStorage.getItem(key);
      // Parsear o retornar initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error leyendo localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Función para actualizar el valor
  const setValue = (value) => {
    try {
      // Permitir que value sea una función
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Guardar en estado
      setStoredValue(valueToStore);
      
      // Guardar en localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error guardando en localStorage key "${key}":`, error);
    }
  };

  // Limpiar localStorage
  const clearValue = () => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
        setStoredValue(initialValue);
      }
    } catch (error) {
      console.error(`Error limpiando localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, clearValue];
};

// Hook específico para preferencias del usuario
export const useUserPreferences = () => {
  const [preferences, setPreferences, clearPreferences] = useLocalStorage('inventory_preferences', {
    theme: 'light',
    language: 'es',
    itemsPerPage: 10,
    defaultSort: 'name_asc',
    showImages: true,
    currency: 'USD',
    dateFormat: 'DD/MM/YYYY',
    notifications: true,
    autoSave: true,
    compactView: false
  });

  const updatePreference = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetPreferences = () => {
    clearPreferences();
  };

  return {
    preferences,
    updatePreference,
    resetPreferences,
    setPreferences
  };
};

// Hook específico para datos del inventario en localStorage
export const useInventoryStorage = () => {
  const [inventoryData, setInventoryData, clearInventoryData] = useLocalStorage('inventory_data', {
    items: [],
    lastUpdated: null,
    version: '1.0.0'
  });

  const saveItems = (items) => {
    setInventoryData({
      items,
      lastUpdated: new Date().toISOString(),
      version: '1.0.0'
    });
  };

  const addItem = (item) => {
    const newItems = [...inventoryData.items, item];
    saveItems(newItems);
  };

  const updateItem = (id, updates) => {
    const newItems = inventoryData.items.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    saveItems(newItems);
  };

  const deleteItem = (id) => {
    const newItems = inventoryData.items.filter(item => item.id !== id);
    saveItems(newItems);
  };

  const clearAll = () => {
    clearInventoryData();
  };

  const importData = (data) => {
    if (Array.isArray(data)) {
      saveItems(data);
    } else if (data.items && Array.isArray(data.items)) {
      saveItems(data.items);
    }
  };

  const exportData = () => {
    return {
      ...inventoryData,
      exportedAt: new Date().toISOString()
    };
  };

  return {
    items: inventoryData.items,
    lastUpdated: inventoryData.lastUpdated,
    saveItems,
    addItem,
    updateItem,
    deleteItem,
    clearAll,
    importData,
    exportData,
    hasData: inventoryData.items.length > 0
  };
};

export default useLocalStorage;