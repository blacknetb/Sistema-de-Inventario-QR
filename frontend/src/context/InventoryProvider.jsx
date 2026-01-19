import React from 'react';
import { InventoryContextProvider } from './InventoryContext';

/**
 * Proveedor principal del inventario
 * Este componente envuelve la aplicación y proporciona el contexto del inventario
 */
const InventoryProvider = ({ children }) => {
  return (
    <InventoryContextProvider>
      {children}
    </InventoryContextProvider>
  );
};

export default InventoryProvider;