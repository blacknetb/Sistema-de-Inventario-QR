import React from 'react';
import '../../assets/styles/inventory/Inventory.css';

const ProductCard = ({ product, onEdit, onDelete }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'in-stock': return '#10b981';
      case 'low-stock': return '#f59e0b';
      case 'out-of-stock': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'in-stock': return 'Disponible';
      case 'low-stock': return 'Bajo Stock';
      case 'out-of-stock': return 'Agotado';
      default: return 'Desconocido';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Electrónica': '#3b82f6',
      'Accesorios': '#8b5cf6',
      'Oficina': '#10b981',
      'Almacenamiento': '#f59e0b',
      'Redes': '#ef4444',
      'Mobiliario': '#ec4899',
    };
    return colors[category] || '#6b7280';
  };

  const profit = (product.price - product.cost) * product.quantity;
  const profitMargin = ((product.price - product.cost) / product.cost * 100).toFixed(1);

  return (
    <div className="product-card">
      <div className="product-image">
        <img src={product.image} alt={product.name} />
        <div className="product-badge" style={{ backgroundColor: getCategoryColor(product.category) }}>
          {product.category}
        </div>
      </div>
      
      <div className="product-content">
        <div className="product-header">
          <h4 className="product-name">{product.name}</h4>
          <span className="product-sku">{product.sku}</span>
        </div>
        
        <p className="product-description">{product.description}</p>
        
        <div className="product-stats">
          <div className="stat-item">
            <span className="stat-label">Cantidad:</span>
            <span className="stat-value">{product.quantity} unidades</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Precio:</span>
            <span className="stat-value">${product.price.toFixed(2)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Costo:</span>
            <span className="stat-value">${product.cost.toFixed(2)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Valor Total:</span>
            <span className="stat-value">${(product.price * product.quantity).toFixed(2)}</span>
          </div>
        </div>
        
        <div className="product-meta">
          <div className="meta-item">
            <span className="meta-label">Proveedor:</span>
            <span className="meta-value">{product.supplier}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Actualizado:</span>
            <span className="meta-value">{product.lastUpdated}</span>
          </div>
        </div>
        
        <div className="product-footer">
          <div className="product-status">
            <span 
              className="status-indicator"
              style={{ 
                backgroundColor: getStatusColor(product.status),
                color: 'white'
              }}
            >
              {getStatusText(product.status)}
            </span>
            {product.status === 'low-stock' && (
              <span className="stock-warning">
                ⚠️ Límite: {product.lowStockThreshold}
              </span>
            )}
          </div>
          
          <div className="profit-info">
            <span className="profit-amount">Ganancia: ${profit.toFixed(2)}</span>
            <span className="profit-margin">({profitMargin}%)</span>
          </div>
        </div>
        
        <div className="product-actions">
          <button 
            className="action-btn edit-btn"
            onClick={() => onEdit(product)}
          >
            ✏️ Editar
          </button>
          <button 
            className="action-btn delete-btn"
            onClick={() => onDelete(product)}
          >
            🗑️ Eliminar
          </button>
          <button className="action-btn details-btn">
            🔍 Detalles
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;