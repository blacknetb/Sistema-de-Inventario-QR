import React from 'react';
import '../../assets/styles/inventory/Inventory.css';

const EmptyState = ({ message, onReset }) => {
  return (
    <div className="empty-state-container">
      <div className="empty-state-content">
        <div className="empty-state-icon">📦</div>
        <h3 className="empty-state-title">Inventario Vacío</h3>
        <p className="empty-state-message">{message}</p>
        <div className="empty-state-actions">
          <button className="primary-action" onClick={onReset}>
            🔄 Limpiar Filtros
          </button>
          <button className="secondary-action">
            📚 Ver Tutorial
          </button>
        </div>
        <div className="empty-state-tips">
          <h4>Consejos:</h4>
          <ul>
            <li>Intenta usar términos de búsqueda más generales</li>
            <li>Verifica que los filtros estén configurados correctamente</li>
            <li>Agrega nuevos productos al inventario</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;