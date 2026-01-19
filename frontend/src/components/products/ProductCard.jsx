import React, { useState } from 'react';
import '../../assets/styles/Products/products.CSS';

const ProductCard = ({ product, selected, onSelect, onEdit, onDelete, onQuickView }) => {
  const [showActions, setShowActions] = useState(false);

  const getStockStatus = (stock, minStock) => {
    if (stock <= 0) return { label: 'Agotado', color: '#e74c3c', class: 'out-of-stock' };
    if (stock <= minStock) return { label: 'Bajo Stock', color: '#f39c12', class: 'low-stock' };
    return { label: 'Disponible', color: '#2ecc71', class: 'in-stock' };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const stockStatus = getStockStatus(product.stock, product.minStock);
  const hasSale = product.salePrice && product.salePrice < product.price;
  const profitMargin = product.cost > 0 ? ((product.price - product.cost) / product.cost * 100).toFixed(1) : 0;

  return (
    <div className={`product-card ${selected ? 'selected' : ''} ${stockStatus.class}`}>
      <div className="card-header">
        <div className="card-select">
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelect}
            aria-label={`Seleccionar ${product.name}`}
          />
        </div>
        
        <div className="card-sku">
          <span className="sku-label">{product.sku}</span>
          {product.barcode && (
            <span className="barcode">📋 {product.barcode}</span>
          )}
        </div>
        
        <div className="card-actions">
          <button
            className="action-btn quick-view-btn"
            onClick={onQuickView}
            title="Vista rápida"
          >
            👁️
          </button>
          <div className="more-actions">
            <button
              className="action-btn more-btn"
              onClick={() => setShowActions(!showActions)}
              title="Más acciones"
            >
              ⋮
            </button>
            {showActions && (
              <div className="actions-menu">
                <button className="menu-item" onClick={onEdit}>
                  <span className="menu-icon">✏️</span>
                  Editar
                </button>
                <button className="menu-item" onClick={onDelete}>
                  <span className="menu-icon">🗑️</span>
                  Eliminar
                </button>
                <button className="menu-item">
                  <span className="menu-icon">📊</span>
                  Estadísticas
                </button>
                <button className="menu-item">
                  <span className="menu-icon">📋</span>
                  Duplicar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card-image" onClick={onQuickView}>
        <img 
          src={product.mainImage || product.images?.[0] || 'https://via.placeholder.com/300x200/ccc/fff?text=Sin+Imagen'} 
          alt={product.name}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x200/ccc/fff?text=Sin+Imagen';
          }}
        />
        <div className="image-overlay">
          <span className="overlay-text">Ver detalles</span>
        </div>
        {hasSale && (
          <div className="sale-badge">
            <span className="sale-text">OFERTA</span>
          </div>
        )}
      </div>

      <div className="card-body">
        <div className="product-category">
          <span className="category-badge">{product.category}</span>
          {product.subcategory && (
            <span className="subcategory">{product.subcategory}</span>
          )}
        </div>

        <h3 className="product-name" title={product.name}>
          {product.name}
        </h3>

        <p className="product-description">
          {product.description.length > 100 
            ? `${product.description.substring(0, 100)}...` 
            : product.description}
        </p>

        <div className="product-brand">
          <span className="brand-label">Marca:</span>
          <span className="brand-value">{product.brand || 'Sin marca'}</span>
        </div>

        {product.variants?.length > 0 && (
          <div className="product-variants">
            <span className="variants-label">
              {product.variants.length} variante{product.variants.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      <div className="card-footer">
        <div className="price-section">
          <div className="price-main">
            {hasSale ? (
              <>
                <del className="original-price">{formatCurrency(product.price)}</del>
                <span className="sale-price">{formatCurrency(product.salePrice)}</span>
              </>
            ) : (
              <span className="regular-price">{formatCurrency(product.price)}</span>
            )}
          </div>
          <div className="price-details">
            <span className="cost">Costo: {formatCurrency(product.cost)}</span>
            <span className="margin">Margen: {profitMargin}%</span>
          </div>
        </div>

        <div className="stock-section">
          <div className="stock-info">
            <div className="stock-amount">
              <span className="amount">{product.stock}</span>
              <span className="unit">{product.unit}</span>
            </div>
            <div 
              className="stock-status"
              style={{ backgroundColor: stockStatus.color + '20', color: stockStatus.color }}
            >
              {stockStatus.label}
            </div>
          </div>
          <div className="stock-limits">
            <span>Mín: {product.minStock}</span>
            <span>Máx: {product.maxStock || '∞'}</span>
          </div>
        </div>

        <div className="rating-section">
          {product.rating > 0 ? (
            <>
              <div className="rating-stars">
                {'★'.repeat(Math.floor(product.rating))}
                {'☆'.repeat(5 - Math.floor(product.rating))}
              </div>
              <div className="rating-value">
                {product.rating.toFixed(1)} ({product.reviewCount})
              </div>
            </>
          ) : (
            <div className="no-rating">Sin calificaciones</div>
          )}
        </div>
      </div>

      <div className="card-tags">
        {product.tags?.slice(0, 3).map((tag, index) => (
          <span key={index} className="tag">
            {tag}
          </span>
        ))}
        {product.tags?.length > 3 && (
          <span className="tag-more">+{product.tags.length - 3}</span>
        )}
      </div>
    </div>
  );
};

export default ProductCard;