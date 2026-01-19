const localStorageService = {
  // Obtener item del localStorage
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error obteniendo ${key} del localStorage:`, error);
      return defaultValue;
    }
  },

  // Guardar item en localStorage
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error guardando ${key} en localStorage:`, error);
      return false;
    }
  },

  // Eliminar item del localStorage
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error eliminando ${key} del localStorage:`, error);
      return false;
    }
  },

  // Limpiar todo el localStorage
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error limpiando localStorage:', error);
      return false;
    }
  },

  // Obtener múltiples items
  getMultiple: (keys) => {
    return keys.reduce((obj, key) => {
      obj[key] = localStorageService.get(key);
      return obj;
    }, {});
  },

  // Guardar múltiples items
  setMultiple: (items) => {
    return Object.entries(items).map(([key, value]) => 
      localStorageService.set(key, value)
    ).every(result => result === true);
  },

  // Verificar si una clave existe
  exists: (key) => {
    return localStorage.getItem(key) !== null;
  },

  // Obtener todas las claves
  getAllKeys: () => {
    return Object.keys(localStorage);
  },

  // Obtener datos de inventario con validación
  getInventoryData: () => {
    const data = localStorageService.get('inventory_items');
    
    if (!data || !Array.isArray(data)) {
      return [];
    }
    
    // Validar estructura de datos
    return data.filter(item => 
      item && 
      typeof item === 'object' && 
      item.id && 
      item.name && 
      typeof item.quantity === 'number'
    );
  },

  // Guardar datos de inventario con backup
  setInventoryData: (data) => {
    if (!Array.isArray(data)) {
      console.error('Los datos de inventario deben ser un array');
      return false;
    }
    
    // Crear backup antes de guardar
    const backup = localStorageService.get('inventory_items_backup') || [];
    if (backup.length > 10) {
      backup.shift(); // Mantener solo los últimos 10 backups
    }
    
    backup.push({
      timestamp: new Date().toISOString(),
      data: localStorageService.get('inventory_items') || []
    });
    
    localStorageService.set('inventory_items_backup', backup);
    
    // Guardar nuevos datos
    return localStorageService.set('inventory_items', data);
  },

  // Restaurar desde backup
  restoreBackup: (backupIndex = 0) => {
    try {
      const backups = localStorageService.get('inventory_items_backup') || [];
      
      if (backupIndex >= backups.length) {
        throw new Error('Índice de backup inválido');
      }
      
      const backup = backups[backupIndex];
      const restored = localStorageService.set('inventory_items', backup.data);
      
      if (restored) {
        // Crear notificación del restore
        const notification = {
          id: `restore_${Date.now()}`,
          type: 'info',
          title: 'Backup Restaurado',
          message: `Inventario restaurado desde ${new Date(backup.timestamp).toLocaleString()}`,
          createdAt: new Date().toISOString(),
          read: false
        };
        
        const notifications = localStorageService.get('notifications') || [];
        notifications.unshift(notification);
        localStorageService.set('notifications', notifications);
      }
      
      return restored;
    } catch (error) {
      console.error('Error restaurando backup:', error);
      return false;
    }
  },

  // Exportar datos a archivo
  exportData: (key, filename = 'data.json') => {
    try {
      const data = localStorageService.get(key);
      if (!data) {
        throw new Error('No hay datos para exportar');
      }
      
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const downloadUrl = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      
      return true;
    } catch (error) {
      console.error('Error exportando datos:', error);
      return false;
    }
  },

  // Importar datos desde archivo
  importData: (key, file) => {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result);
            const success = localStorageService.set(key, data);
            
            if (success) {
              resolve({
                success: true,
                message: 'Datos importados exitosamente',
                count: Array.isArray(data) ? data.length : 1
              });
            } else {
              reject(new Error('Error guardando datos importados'));
            }
          } catch (parseError) {
            reject(new Error('El archivo no contiene JSON válido'));
          }
        };
        
        reader.onerror = () => {
          reject(new Error('Error leyendo el archivo'));
        };
        
        reader.readAsText(file);
      } catch (error) {
        reject(error);
      }
    });
  }
};

export default localStorageService;