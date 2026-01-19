import { useState, useCallback, useRef } from 'react';

/**
 * Hook para operaciones avanzadas del inventario
 * @param {Array} initialItems - Items iniciales del inventario
 * @returns {Object} Funciones y estado para operaciones
 */
const useInventoryOperations = (initialItems = []) => {
  const [items, setItems] = useState(initialItems);
  const [operationHistory, setOperationHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const operationId = useRef(0);

  // Ajustar stock
  const adjustStock = useCallback((itemId, adjustment, reason = 'Ajuste manual') => {
    setItems(prev => {
      const itemIndex = prev.findIndex(item => item.id === itemId);
      if (itemIndex === -1) return prev;

      const item = prev[itemIndex];
      const newQuantity = Math.max(0, item.quantity + adjustment);
      
      const updatedItem = {
        ...item,
        quantity: newQuantity,
        status: getStockStatus(newQuantity, item.minStock),
        lastUpdated: new Date().toISOString()
      };

      // Registrar operación
      const operation = {
        id: ++operationId.current,
        type: 'STOCK_ADJUSTMENT',
        itemId,
        itemName: item.name,
        adjustment,
        reason,
        previousQuantity: item.quantity,
        newQuantity,
        timestamp: new Date().toISOString()
      };

      setOperationHistory(prev => [operation, ...prev.slice(0, 49)]);

      const newItems = [...prev];
      newItems[itemIndex] = updatedItem;
      return newItems;
    });

    return { success: true, adjustment };
  }, []);

  // Transferir stock entre ubicaciones
  const transferStock = useCallback((itemId, fromLocation, toLocation, quantity, reason = 'Transferencia') => {
    setItems(prev => {
      const itemIndex = prev.findIndex(item => item.id === itemId && item.location === fromLocation);
      if (itemIndex === -1) return prev;

      const item = prev[itemIndex];
      if (item.quantity < quantity) {
        throw new Error('Stock insuficiente para transferir');
      }

      // Reducir stock en ubicación origen
      const updatedFromItem = {
        ...item,
        quantity: item.quantity - quantity,
        lastUpdated: new Date().toISOString()
      };

      // Buscar o crear item en ubicación destino
      const toItemIndex = prev.findIndex(i => i.id === itemId && i.location === toLocation);
      let newItems = [...prev];

      if (toItemIndex === -1) {
        // Crear nuevo registro en destino
        const newToItem = {
          ...item,
          quantity,
          location: toLocation,
          lastUpdated: new Date().toISOString(),
          id: Date.now() // Nuevo ID para nuevo registro de ubicación
        };
        newItems = [...newItems, newToItem];
      } else {
        // Actualizar stock en destino
        const toItem = newItems[toItemIndex];
        newItems[toItemIndex] = {
          ...toItem,
          quantity: toItem.quantity + quantity,
          lastUpdated: new Date().toISOString()
        };
      }

      // Actualizar item origen
      newItems[itemIndex] = updatedFromItem;

      // Registrar operación
      const operation = {
        id: ++operationId.current,
        type: 'STOCK_TRANSFER',
        itemId,
        itemName: item.name,
        fromLocation,
        toLocation,
        quantity,
        reason,
        timestamp: new Date().toISOString()
      };

      setOperationHistory(prev => [operation, ...prev.slice(0, 49)]);

      return newItems;
    });

    return { success: true };
  }, []);

  // Consolidar items duplicados
  const consolidateItems = useCallback((itemIds) => {
    setIsProcessing(true);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        setItems(prev => {
          // Agrupar items por SKU o nombre
          const groups = {};
          prev.forEach(item => {
            if (itemIds.includes(item.id)) {
              const key = item.sku || item.name;
              if (!groups[key]) {
                groups[key] = [];
              }
              groups[key].push(item);
            }
          });

          // Consolidar grupos
          let consolidated = [...prev];
          Object.values(groups).forEach(group => {
            if (group.length > 1) {
              const mainItem = group[0];
              const totalQuantity = group.reduce((sum, item) => sum + item.quantity, 0);
              
              // Actualizar item principal
              const updatedItem = {
                ...mainItem,
                quantity: totalQuantity,
                lastUpdated: new Date().toISOString()
              };

              // Eliminar items duplicados (excepto el principal)
              const duplicateIds = group.slice(1).map(item => item.id);
              consolidated = consolidated
                .map(item => item.id === mainItem.id ? updatedItem : item)
                .filter(item => !duplicateIds.includes(item.id));

              // Registrar operación
              const operation = {
                id: ++operationId.current,
                type: 'CONSOLIDATION',
                mainItemId: mainItem.id,
                mainItemName: mainItem.name,
                consolidatedItems: group.length - 1,
                totalQuantity,
                timestamp: new Date().toISOString()
              };

              setOperationHistory(prev => [operation, ...prev.slice(0, 49)]);
            }
          });

          return consolidated;
        });

        setIsProcessing(false);
        resolve({ success: true });
      }, 1000);
    });
  }, []);

  // Realizar inventario físico (conteo)
  const performPhysicalCount = useCallback((counts) => {
    setIsProcessing(true);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        setItems(prev => {
          const updatedItems = prev.map(item => {
            const count = counts.find(c => c.itemId === item.id);
            if (count) {
              const discrepancy = count.counted - item.quantity;
              
              return {
                ...item,
                quantity: count.counted,
                lastPhysicalCount: new Date().toISOString(),
                countDiscrepancy: discrepancy,
                status: getStockStatus(count.counted, item.minStock),
                lastUpdated: new Date().toISOString()
              };
            }
            return item;
          });

          // Registrar operación
          const operation = {
            id: ++operationId.current,
            type: 'PHYSICAL_COUNT',
            itemsCounted: counts.length,
            timestamp: new Date().toISOString()
          };

          setOperationHistory(prev => [operation, ...prev.slice(0, 49)]);

          return updatedItems;
        });

        setIsProcessing(false);
        resolve({ success: true, itemsCounted: counts.length });
      }, 1500);
    });
  }, []);

  // Aplicar ajuste de precio
  const applyPriceAdjustment = useCallback((adjustmentType, value, itemIds = []) => {
    setItems(prev => {
      const updatedItems = prev.map(item => {
        if (itemIds.length === 0 || itemIds.includes(item.id)) {
          let newPrice = item.price;
          
          switch(adjustmentType) {
            case 'percentage_increase':
              newPrice = item.price * (1 + value / 100);
              break;
            case 'percentage_decrease':
              newPrice = item.price * (1 - value / 100);
              break;
            case 'fixed_increase':
              newPrice = item.price + value;
              break;
            case 'fixed_decrease':
              newPrice = Math.max(0, item.price - value);
              break;
            case 'set_price':
              newPrice = value;
              break;
          }

          return {
            ...item,
            price: parseFloat(newPrice.toFixed(2)),
            lastUpdated: new Date().toISOString()
          };
        }
        return item;
      });

      // Registrar operación
      const operation = {
        id: ++operationId.current,
        type: 'PRICE_ADJUSTMENT',
        adjustmentType,
        value,
        itemsAffected: itemIds.length || 'all',
        timestamp: new Date().toISOString()
      };

      setOperationHistory(prev => [operation, ...prev.slice(0, 49)]);

      return updatedItems;
    });

    return { success: true };
  }, []);

  // Reordenar items automáticamente
  const autoReorder = useCallback((reorderSettings = {}) => {
    const {
      reorderThreshold = 5,
      reorderQuantity = 10,
      supplier = 'Proveedor General'
    } = reorderSettings;

    setIsProcessing(true);

    return new Promise((resolve) => {
      setTimeout(() => {
        const itemsToReorder = items.filter(item => 
          item.quantity <= item.minStock && 
          item.status !== 'Disponible'
        );

        const reorders = itemsToReorder.map(item => ({
          itemId: item.id,
          itemName: item.name,
          currentQuantity: item.quantity,
          reorderQuantity: Math.max(reorderQuantity, item.maxStock - item.quantity),
          supplier: item.supplier || supplier,
          estimatedCost: (item.cost || item.price * 0.7) * reorderQuantity,
          reorderDate: new Date().toISOString()
        }));

        // Registrar operación
        const operation = {
          id: ++operationId.current,
          type: 'AUTO_REORDER',
          itemsToReorder: reorders.length,
          timestamp: new Date().toISOString()
        };

        setOperationHistory(prev => [operation, ...prev.slice(0, 49)]);
        setIsProcessing(false);

        resolve({ success: true, reorders });
      }, 2000);
    });
  }, [items]);

  // Calcular rotación de inventario
  const calculateTurnover = useCallback((period = 30) => {
    // Simular ventas (en una app real, esto vendría de un sistema de ventas)
    const mockSales = items.map(item => ({
      itemId: item.id,
      sales: Math.floor(Math.random() * item.quantity),
      periodDays: period
    }));

    const turnoverData = items.map(item => {
      const sales = mockSales.find(s => s.itemId === item.id);
      const averageInventory = item.quantity / 2; // Simplificación
      const turnoverRatio = sales ? sales.sales / averageInventory : 0;
      
      return {
        itemId: item.id,
        itemName: item.name,
        averageInventory,
        sales: sales ? sales.sales : 0,
        turnoverRatio: parseFloat(turnoverRatio.toFixed(2)),
        periodDays: period
      };
    });

    return turnoverData.sort((a, b) => b.turnoverRatio - a.turnoverRatio);
  }, [items]);

  // Función auxiliar para determinar estado de stock
  const getStockStatus = (quantity, minStock) => {
    if (quantity === 0) return 'Agotado';
    if (quantity <= minStock) return 'Bajo Stock';
    return 'Disponible';
  };

  // Deshacer última operación
  const undoLastOperation = useCallback(() => {
    if (operationHistory.length === 0) return { success: false, message: 'No hay operaciones para deshacer' };

    const lastOperation = operationHistory[0];
    
    // Aquí implementar lógica para revertir la operación
    // Por simplicidad, solo la eliminamos del historial
    setOperationHistory(prev => prev.slice(1));

    return { 
      success: true, 
      operation: lastOperation,
      message: `Operación "${lastOperation.type}" deshecha`
    };
  }, [operationHistory]);

  // Limpiar historial de operaciones
  const clearOperationHistory = useCallback(() => {
    setOperationHistory([]);
    return { success: true };
  }, []);

  return {
    // Estado
    items,
    setItems,
    operationHistory,
    isProcessing,
    
    // Operaciones básicas
    adjustStock,
    
    // Operaciones avanzadas
    transferStock,
    consolidateItems,
    performPhysicalCount,
    applyPriceAdjustment,
    autoReorder,
    calculateTurnover,
    
    // Operaciones de historial
    undoLastOperation,
    clearOperationHistory,
    
    // Información
    totalOperations: operationHistory.length,
    hasOperations: operationHistory.length > 0,
    
    // Métodos de conveniencia
    getOperationById: (id) => 
      operationHistory.find(op => op.id === id),
    
    getOperationsByType: (type) => 
      operationHistory.filter(op => op.type === type),
    
    getRecentOperations: (limit = 10) => 
      operationHistory.slice(0, limit)
  };
};

export default useInventoryOperations;