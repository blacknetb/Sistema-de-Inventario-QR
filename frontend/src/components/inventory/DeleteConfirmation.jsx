import React from 'react';
import '../../assets/styles/inventory/Inventory.css';

const DeleteConfirmation = ({ isOpen, onClose, onConfirm, productName }) => {
  if (!isOpen) return null;

  return (
    <div className="delete-confirmation-overlay">
      <div className="delete-confirmation-container">
        <div className="confirmation-icon">🗑️</div>
        
        <h3 className="confirmation-title">Confirmar Eliminación</h3>
        
        <p className="confirmation-message">
          ¿Estás seguro de que deseas eliminar el producto 
          <strong> "{productName}"</strong> del inventario?
        </p>
        
        <p className="confirmation-warning">
          ⚠️ Esta acción no se puede deshacer. Todos los datos del producto se perderán permanentemente.
        </p>
        
        <div className="confirmation-actions">
          <button className="cancel-btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="confirm-btn" onClick={onConfirm}>
            Sí, Eliminar Producto
          </button>
        </div>
        
        <div className="confirmation-tip">
          💡 Consejo: Considera marcar el producto como "inactivo" en lugar de eliminarlo para mantener un historial.
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation;