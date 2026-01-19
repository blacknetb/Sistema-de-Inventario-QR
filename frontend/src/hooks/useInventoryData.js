import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para manejar datos del inventario con persistencia
 * @param {Object} options - Opciones de configuración
 * @returns {Object} Funciones y estado del inventario
 */
const useInventoryData = (options = {}) => {
  const {
    initialData = [],
    storageKey = 'inventory_items',
    autoSave = true,
    saveDelay = 1000
  } = options;

  // Estado principal
  const [items, setItems] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  // Cargar datos iniciales desde localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          setItems(parsed.items || []);
          setLastUpdated(parsed.lastUpdated);
        }
      } catch (err) {
        console.error('Error cargando datos del inventario:', err);
        setError('Error cargando datos guardados');
      }
    }
  }, [storageKey]);

  // Guardar automáticamente cuando cambian los items
  useEffect(() => {
    if (autoSave && isDirty) {
      const saveTimer = setTimeout(() => {
        saveToStorage();
        setIsDirty(false);
      }, saveDelay);

      return () => clearTimeout(saveTimer);
    }
  }, [items, autoSave, isDirty, saveDelay, storageKey]);

  // Guardar en localStorage
  const saveToStorage = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        const data = {
          items,
          lastUpdated: new Date().toISOString(),
          version: '1.0.0'
        };
        localStorage.setItem(storageKey, JSON.stringify(data));
        setLastUpdated(data.lastUpdated);
      } catch (err) {
        console.error('Error guardando datos del inventario:', err);
        setError('Error guardando datos');
      }
    }
  }, [items, storageKey]);

  // Operaciones CRUD
  const addItem = useCallback((newItem) => {
    setItems(prev => {
      const itemWithId = {
        ...newItem,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setIsDirty(true);
      return [...prev, itemWithId];
    });
    
    return { success: true, id: Date.now() };
  }, []);

  const updateItem = useCallback((id, updates) => {
    setItems(prev => {
      const updated = prev.map(item => 
        item.id === id 
          ? { 
              ...item, 
              ...updates, 
              updatedAt: new Date().toISOString() 
            } 
          : item
      );
      setIsDirty(updated !== prev);
      return updated;
    });
    
    return { success: true };
  }, []);

  const deleteItem = useCallback((id) => {
    setItems(prev => {
      const filtered = prev.filter(item => item.id !== id);
      setIsDirty(filtered.length !== prev.length);
      return filtered;
    });
    
    return { success: true };
  }, []);

  const deleteMultiple = useCallback((ids) => {
    setItems(prev => {
      const filtered = prev.filter(item => !ids.includes(item.id));
      setIsDirty(filtered.length !== prev.length);
      return filtered;
    });
    
    return { success: true, deleted: ids.length };
  }, []);

  const getItem = useCallback((id) => {
    return items.find(item => item.id === id);
  }, [items]);

  const clearAll = useCallback(() => {
    setItems([]);
    setIsDirty(true);
    setSelectedItem(null);
  }, []);

  const importItems = useCallback((importedItems) => {
    setItems(prev => {
      const newItems = Array.isArray(importedItems) 
        ? importedItems.map((item, index) => ({
            ...item,
            id: item.id || Date.now() + index,
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }))
        : [];
      
      setIsDirty(true);
      return [...prev, ...newItems];
    });
    
    return { success: true, count: importedItems.length };
  }, []);

  const exportItems = useCallback((format = 'json') => {
    const data = { items, lastUpdated, exportedAt: new Date().toISOString() };
    
    if (format === 'csv') {
      return convertToCSV(data.items);
    }
    
    return JSON.stringify(data, null, 2);
  }, [items, lastUpdated]);

  // Función auxiliar para convertir a CSV
  const convertToCSV = (data) => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escapar comas y comillas
          const escaped = ('' + value).replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  };

  // Operaciones por lotes
  const batchUpdate = useCallback((updates) => {
    setItems(prev => {
      const updated = prev.map(item => {
        const update = updates.find(u => u.id === item.id);
        return update 
          ? { 
              ...item, 
              ...update, 
              updatedAt: new Date().toISOString() 
            } 
          : item;
      });
      setIsDirty(true);
      return updated;
    });
    
    return { success: true };
  }, []);

  // Buscar items
  const searchItems = useCallback((searchTerm, fields = ['name', 'description', 'category', 'sku']) => {
    if (!searchTerm) return items;
    
    const term = searchTerm.toLowerCase();
    return items.filter(item => 
      fields.some(field => 
        item[field] && item[field].toString().toLowerCase().includes(term)
      )
    );
  }, [items]);

  // Refrescar datos
  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    
    // Simular carga de datos
    setTimeout(() => {
      try {
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            setItems(parsed.items || []);
            setLastUpdated(parsed.lastUpdated);
          }
        }
      } catch (err) {
        setError('Error refrescando datos');
      } finally {
        setLoading(false);
      }
    }, 500);
  }, [storageKey]);

  // Forzar guardado
  const forceSave = useCallback(() => {
    saveToStorage();
    setIsDirty(false);
  }, [saveToStorage]);

  return {
    // Estado
    items,
    loading,
    error,
    lastUpdated,
    selectedItem,
    isDirty,
    
    // Setters
    setItems,
    setSelectedItem,
    setError,
    
    // Operaciones CRUD
    addItem,
    updateItem,
    deleteItem,
    deleteMultiple,
    getItem,
    clearAll,
    
    // Import/Export
    importItems,
    exportItems,
    
    // Operaciones avanzadas
    batchUpdate,
    searchItems,
    refresh,
    forceSave,
    
    // Información
    totalItems: items.length,
    hasItems: items.length > 0,
    
    // Métodos de conveniencia
    getItemsByCategory: (category) => 
      items.filter(item => item.category === category),
    
    getLowStockItems: (threshold = 5) => 
      items.filter(item => item.quantity <= threshold && item.quantity > 0),
    
    getOutOfStockItems: () => 
      items.filter(item => item.quantity === 0),
    
    getItemsNeedingReorder: () => 
      items.filter(item => item.quantity <= item.minStock && item.quantity > 0)
  };
};

export default useInventoryData;