import React from 'react';
import '../../assets/styles/inventory/Inventory.css';

const InventoryHeader = ({ title, onAddProduct, onExport, productCount }) => {
  const currentDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="inventory-header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="inventory-title">{title}</h1>
          <div className="header-subtitle">
            <span className="date-info">{currentDate}</span>
            <span className="product-count">{productCount} productos en inventario</span>
          </div>
        </div>
        
        <div className="header-right">
          <button className="header-btn export-btn" onClick={onExport}>
            <span className="btn-icon">📊</span>
            Exportar
          </button>
          <button className="header-btn add-btn" onClick={onAddProduct}>
            <span className="btn-icon">+</span>
            Agregar Producto
          </button>
        </div>
      </div>
      
      <div className="header-notification">
        <span className="notification-icon">ℹ️</span>
        <span className="notification-text">
          Mantén tu inventario actualizado para una gestión eficiente
        </span>
      </div>
    </header>
  );
};

export default InventoryHeader;