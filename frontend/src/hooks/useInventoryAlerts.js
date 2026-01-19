import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook para manejar alertas y notificaciones del inventario
 * @param {Array} items - Items del inventario
 * @param {Object} options - Opciones de configuración
 * @returns {Object} Funciones y estado de alertas
 */
const useInventoryAlerts = (items = [], options = {}) => {
  const {
    checkInterval = 60000, // 1 minuto
    enableSound = true,
    enableDesktopNotifications = false,
    lowStockThreshold = 5,
    reorderThreshold = 2,
    expiryWarningDays = 7,
    enableAutoCheck = true
  } = options;

  const [alerts, setAlerts] = useState([]);
  const [alertStats, setAlertStats] = useState({
    total: 0,
    critical: 0,
    warning: 0,
    info: 0,
    unread: 0
  });
  const [settings, setSettings] = useState({
    enableLowStockAlerts: true,
    enableOutOfStockAlerts: true,
    enableExpiryAlerts: true,
    enableValueAlerts: true,
    enableTheftAlerts: false,
    soundEnabled: enableSound,
    desktopNotifications: enableDesktopNotifications,
    autoCheck: enableAutoCheck
  });

  const alertId = useRef(0);
  const checkIntervalRef = useRef(null);
  const soundRef = useRef(null);

  // Inicializar sonido de alerta
  useEffect(() => {
    if (settings.soundEnabled && typeof window !== 'undefined') {
      try {
        // Crear un sonido simple de alerta (beep)
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.1;
        
        soundRef.current = { audioContext, oscillator, gainNode };
      } catch (error) {
        console.warn('No se pudo inicializar el audio:', error);
      }
    }
    
    return () => {
      if (soundRef.current) {
        soundRef.current.oscillator.stop();
        soundRef.current.audioContext.close();
      }
    };
  }, [settings.soundEnabled]);

  // Configurar notificaciones del navegador
  useEffect(() => {
    if (settings.desktopNotifications && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [settings.desktopNotifications]);

  // Verificar alertas automáticamente
  useEffect(() => {
    if (settings.autoCheck) {
      checkAllAlerts();
      
      checkIntervalRef.current = setInterval(() => {
        checkAllAlerts();
      }, checkInterval);
    }
    
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [settings.autoCheck, checkInterval, items]);

  // Agregar una nueva alerta
  const addAlert = useCallback((alert) => {
    const id = ++alertId.current;
    const timestamp = new Date().toISOString();
    
    const newAlert = {
      id,
      ...alert,
      timestamp,
      read: false,
      acknowledged: false,
      priority: alert.priority || 'medium'
    };

    setAlerts(prev => {
      // Evitar alertas duplicadas recientes
      const isDuplicate = prev.some(a => 
        a.type === newAlert.type && 
        a.itemId === newAlert.itemId && 
        new Date(timestamp) - new Date(a.timestamp) < 3600000 // 1 hora
      );
      
      if (isDuplicate) return prev;
      
      const updated = [newAlert, ...prev];
      
      // Mantener máximo 100 alertas
      if (updated.length > 100) {
        return updated.slice(0, 100);
      }
      
      return updated;
    });

    // Actualizar estadísticas
    updateAlertStats();

    // Reproducir sonido si es crítica
    if (newAlert.priority === 'critical' && settings.soundEnabled && soundRef.current) {
      playAlertSound();
    }

    // Notificación del navegador
    if (settings.desktopNotifications && Notification.permission === 'granted') {
      new Notification(newAlert.title || 'Alerta de Inventario', {
        body: newAlert.message,
        icon: '/favicon.ico',
        tag: 'inventory-alert'
      });
    }

    // Disparar evento personalizado
    const alertEvent = new CustomEvent('inventory-alert', {
      detail: newAlert
    });
    window.dispatchEvent(alertEvent);

    return id;
  }, [settings, playAlertSound, updateAlertStats]);

  // Reproducir sonido de alerta
  const playAlertSound = useCallback(() => {
    if (soundRef.current) {
      try {
        const { audioContext, oscillator, gainNode } = soundRef.current;
        
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }
        
        oscillator.start();
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        setTimeout(() => {
          oscillator.stop();
          // Reiniciar oscilador para próxima vez
          const newOscillator = audioContext.createOscillator();
          newOscillator.connect(gainNode);
          newOscillator.frequency.value = 800;
          newOscillator.type = 'sine';
          soundRef.current.oscillator = newOscillator;
        }, 500);
      } catch (error) {
        console.warn('Error reproduciendo sonido:', error);
      }
    }
  }, []);

  // Verificar alertas de stock bajo
  const checkLowStockAlerts = useCallback(() => {
    if (!settings.enableLowStockAlerts) return [];

    const lowStockItems = items.filter(item => 
      item.quantity > 0 && 
      item.quantity <= (item.minStock || lowStockThreshold) &&
      item.status !== 'Agotado'
    );

    const alertIds = [];

    lowStockItems.forEach(item => {
      const alertId = addAlert({
        type: 'low_stock',
        title: 'Stock Bajo',
        message: `${item.name} tiene stock bajo (${item.quantity} unidades). Stock mínimo: ${item.minStock || lowStockThreshold}`,
        itemId: item.id,
        itemName: item.name,
        priority: 'high',
        action: 'reorder',
        data: {
          currentQuantity: item.quantity,
          minStock: item.minStock || lowStockThreshold,
          suggestedReorder: item.maxStock ? item.maxStock - item.quantity : 10
        }
      });
      
      alertIds.push(alertId);
    });

    return alertIds;
  }, [items, settings.enableLowStockAlerts, lowStockThreshold, addAlert]);

  // Verificar alertas de stock agotado
  const checkOutOfStockAlerts = useCallback(() => {
    if (!settings.enableOutOfStockAlerts) return [];

    const outOfStockItems = items.filter(item => 
      item.quantity === 0 || item.status === 'Agotado'
    );

    const alertIds = [];

    outOfStockItems.forEach(item => {
      const alertId = addAlert({
        type: 'out_of_stock',
        title: 'Stock Agotado',
        message: `${item.name} se ha agotado. Es necesario reabastecer.`,
        itemId: item.id,
        itemName: item.name,
        priority: 'critical',
        action: 'reorder_urgent',
        data: {
          lastStockDate: item.lastUpdated,
          suggestedReorder: item.maxStock || 20
        }
      });
      
      alertIds.push(alertId);
    });

    return alertIds;
  }, [items, settings.enableOutOfStockAlerts, addAlert]);

  // Verificar alertas de expiración
  const checkExpiryAlerts = useCallback(() => {
    if (!settings.enableExpiryAlerts) return [];

    const today = new Date();
    const warningDate = new Date(today);
    warningDate.setDate(warningDate.getDate() + expiryWarningDays);

    const expiringItems = items.filter(item => {
      if (!item.expiryDate) return false;
      
      const expiryDate = new Date(item.expiryDate);
      return expiryDate <= warningDate && expiryDate >= today;
    });

    const expiredItems = items.filter(item => {
      if (!item.expiryDate) return false;
      
      const expiryDate = new Date(item.expiryDate);
      return expiryDate < today;
    });

    const alertIds = [];

    // Items por expirar
    expiringItems.forEach(item => {
      const expiryDate = new Date(item.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      
      const alertId = addAlert({
        type: 'expiry_warning',
        title: 'Producto por Expirar',
        message: `${item.name} expira en ${daysUntilExpiry} días (${expiryDate.toLocaleDateString()})`,
        itemId: item.id,
        itemName: item.name,
        priority: 'medium',
        action: 'check_expiry',
        data: {
          expiryDate: item.expiryDate,
          daysUntilExpiry,
          quantity: item.quantity
        }
      });
      
      alertIds.push(alertId);
    });

    // Items expirados
    expiredItems.forEach(item => {
      const expiryDate = new Date(item.expiryDate);
      
      const alertId = addAlert({
        type: 'expired',
        title: 'Producto Expirado',
        message: `${item.name} expiró el ${expiryDate.toLocaleDateString()}`,
        itemId: item.id,
        itemName: item.name,
        priority: 'critical',
        action: 'dispose',
        data: {
          expiryDate: item.expiryDate,
          quantity: item.quantity
        }
      });
      
      alertIds.push(alertId);
    });

    return alertIds;
  }, [items, settings.enableExpiryAlerts, expiryWarningDays, addAlert]);

  // Verificar alertas de valor
  const checkValueAlerts = useCallback(() => {
    if (!settings.enableValueAlerts) return [];

    const highValueItems = items.filter(item => {
      const itemValue = item.price * item.quantity;
      return itemValue > 10000; // Alerta para items con valor > $10,000
    });

    const alertIds = [];

    highValueItems.forEach(item => {
      const itemValue = item.price * item.quantity;
      
      const alertId = addAlert({
        type: 'high_value',
        title: 'Producto de Alto Valor',
        message: `${item.name} tiene un valor total de $${itemValue.toFixed(2)}`,
        itemId: item.id,
        itemName: item.name,
        priority: 'medium',
        action: 'secure',
        data: {
          value: itemValue,
          quantity: item.quantity,
          unitPrice: item.price
        }
      });
      
      alertIds.push(alertId);
    });

    return alertIds;
  }, [items, settings.enableValueAlerts, addAlert]);

  // Verificar alertas de robo/pérdida
  const checkTheftAlerts = useCallback(() => {
    if (!settings.enableTheftAlerts) return [];

    // Esta función simularía la detección de patrones sospechosos
    // En una implementación real, se integraría con un sistema de seguridad
    
    const suspiciousItems = items.filter(item => {
      // Simular detección de movimientos sospechosos
      // Por ejemplo, reducciones grandes de stock sin registro
      return item.quantity < (item.lastRecordedQuantity || item.quantity * 0.5);
    });

    const alertIds = [];

    suspiciousItems.forEach(item => {
      const alertId = addAlert({
        type: 'suspicious_activity',
        title: 'Actividad Sospechosa Detectada',
        message: `Se detectó una reducción inusual en el stock de ${item.name}`,
        itemId: item.id,
        itemName: item.name,
        priority: 'critical',
        action: 'investigate',
        data: {
          currentQuantity: item.quantity,
          lastRecordedQuantity: item.lastRecordedQuantity || item.quantity * 2,
          discrepancy: (item.lastRecordedQuantity || item.quantity * 2) - item.quantity
        }
      });
      
      alertIds.push(alertId);
    });

    return alertIds;
  }, [items, settings.enableTheftAlerts, addAlert]);

  // Verificar todas las alertas
  const checkAllAlerts = useCallback(() => {
    const alerts = [
      ...checkLowStockAlerts(),
      ...checkOutOfStockAlerts(),
      ...checkExpiryAlerts(),
      ...checkValueAlerts(),
      ...checkTheftAlerts()
    ];

    return alerts;
  }, [
    checkLowStockAlerts,
    checkOutOfStockAlerts,
    checkExpiryAlerts,
    checkValueAlerts,
    checkTheftAlerts
  ]);

  // Actualizar estadísticas de alertas
  const updateAlertStats = useCallback(() => {
    setAlertStats({
      total: alerts.length,
      critical: alerts.filter(a => a.priority === 'critical').length,
      warning: alerts.filter(a => a.priority === 'high').length,
      info: alerts.filter(a => a.priority === 'medium' || a.priority === 'low').length,
      unread: alerts.filter(a => !a.read).length
    });
  }, [alerts]);

  // Marcar alerta como leída
  const markAsRead = useCallback((id) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === id ? { ...alert, read: true } : alert
      )
    );
    
    updateAlertStats();
  }, [updateAlertStats]);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(() => {
    setAlerts(prev =>
      prev.map(alert => ({ ...alert, read: true }))
    );
    
    updateAlertStats();
  }, [updateAlertStats]);

  // Reconocer alerta (tomar acción)
  const acknowledgeAlert = useCallback((id, action = 'acknowledged') => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === id ? { 
          ...alert, 
          acknowledged: true,
          acknowledgedAt: new Date().toISOString(),
          acknowledgedAction: action 
        } : alert
      )
    );
    
    updateAlertStats();
  }, [updateAlertStats]);

  // Descartar alerta
  const dismissAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
    updateAlertStats();
  }, [updateAlertStats]);

  // Descartar todas las alertas
  const dismissAll = useCallback(() => {
    setAlerts([]);
    updateAlertStats();
  }, [updateAlertStats]);

  // Filtrar alertas
  const filterAlerts = useCallback((filter) => {
    switch(filter) {
      case 'unread':
        return alerts.filter(a => !a.read);
      case 'critical':
        return alerts.filter(a => a.priority === 'critical');
      case 'warning':
        return alerts.filter(a => a.priority === 'high');
      case 'stock':
        return alerts.filter(a => a.type.includes('stock'));
      case 'expiry':
        return alerts.filter(a => a.type.includes('expir'));
      case 'acknowledged':
        return alerts.filter(a => a.acknowledged);
      case 'unacknowledged':
        return alerts.filter(a => !a.acknowledged);
      default:
        return alerts;
    }
  }, [alerts]);

  // Obtener resumen de alertas
  const getAlertSummary = useCallback(() => {
    const summary = {
      byType: {},
      byPriority: {},
      byDay: {}
    };

    alerts.forEach(alert => {
      // Por tipo
      summary.byType[alert.type] = (summary.byType[alert.type] || 0) + 1;
      
      // Por prioridad
      summary.byPriority[alert.priority] = (summary.byPriority[alert.priority] || 0) + 1;
      
      // Por día
      const date = new Date(alert.timestamp).toLocaleDateString();
      summary.byDay[date] = (summary.byDay[date] || 0) + 1;
    });

    return summary;
  }, [alerts]);

  // Exportar alertas
  const exportAlerts = useCallback((format = 'json') => {
    const data = {
      exportedAt: new Date().toISOString(),
      total: alerts.length,
      alerts: alerts.map(a => ({
        ...a,
        timestamp: new Date(a.timestamp).toLocaleString()
      }))
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      const headers = ['ID', 'Tipo', 'Título', 'Mensaje', 'Prioridad', 'Fecha', 'Leído', 'Reconocido'];
      const rows = alerts.map(a => [
        a.id,
        a.type,
        `"${a.title}"`,
        `"${a.message}"`,
        a.priority,
        new Date(a.timestamp).toLocaleString(),
        a.read ? 'Sí' : 'No',
        a.acknowledged ? 'Sí' : 'No'
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      return csvContent;
    }

    return data;
  }, [alerts]);

  // Actualizar configuración
  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  }, []);

  // Forzar verificación de alertas
  const forceCheck = useCallback(() => {
    return checkAllAlerts();
  }, [checkAllAlerts]);

  return {
    // Estado
    alerts,
    alertStats,
    settings,
    
    // Setters
    setSettings: updateSettings,
    
    // Verificación de alertas
    checkLowStockAlerts,
    checkOutOfStockAlerts,
    checkExpiryAlerts,
    checkValueAlerts,
    checkTheftAlerts,
    checkAllAlerts,
    forceCheck,
    
    // Gestión de alertas
    addAlert,
    markAsRead,
    markAllAsRead,
    acknowledgeAlert,
    dismissAlert,
    dismissAll,
    
    // Utilidades
    filterAlerts,
    getAlertSummary,
    exportAlerts,
    updateAlertStats,
    
    // Información
    hasAlerts: alerts.length > 0,
    hasUnread: alertStats.unread > 0,
    hasCritical: alertStats.critical > 0,
    
    // Métodos de conveniencia
    getAlertById: (id) => alerts.find(a => a.id === id),
    getAlertsByType: (type) => alerts.filter(a => a.type === type),
    getRecentAlerts: (limit = 10) => alerts.slice(0, limit)
  };
};

export default useInventoryAlerts;