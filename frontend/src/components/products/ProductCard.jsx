import React, { useState } from 'react';
import '../../assets/styles/products.css';

/**
 * Componente ProductCard - Tarjeta individual de producto
 * Muestra información resumida del producto con acciones rápidas
 */
const ProductCard = ({ product, onEdit, onDelete, onAddToCart, onViewDetail }) => {
    const [showActions, setShowActions] = useState(false);
    const [quantity, setQuantity] = useState(1);

    const getStatusBadge = () => {
        switch (product.status) {
            case 'available':
                return <span className="status-badge available">Disponible</span>;
            case 'low-stock':
                return <span className="status-badge low-stock">Stock Bajo</span>;
            case 'out-of-stock':
                return <span className="status-badge out-of-stock">Agotado</span>;
            default:
                return <span className="status-badge">Desconocido</span>;
        }
    };

    const getStockClass = () => {
        if (product.stock <= 0) return 'stock-empty';
        if (product.stock <= (product.minStock || 5)) return 'stock-low';
        return 'stock-normal';
    };

    const handleAddToCart = () => {
        if (onAddToCart) {
            onAddToCart(product, quantity);
            setQuantity(1);
        }
    };

    const handleQuantityChange = (e) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value >= 1 && value <= product.stock) {
            setQuantity(value);
        }
    };

    const incrementQuantity = () => {
        if (quantity < product.stock) {
            setQuantity(quantity + 1);
        }
    };

    const decrementQuantity = () => {
        if (quantity > 1) {
            setQuantity(quantity - 1);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(price);
    };

    return (
        <div className="product-card">
            <div className="card-header">
                <div className="product-image">
                    <div className="image-placeholder">
                        {product.image ? (
                            <img src={product.image} alt={product.name} className="product-img" />
                        ) : (
                            <div className="image-fallback">
                                <i className="image-icon">📦</i>
                            </div>
                        )}
                    </div>
                    {product.stock <= (product.minStock || 5) && product.stock > 0 && (
                        <div className="stock-alert">
                            <i className="alert-icon">⚠️</i>
                            <span>Stock bajo</span>
                        </div>
                    )}
                </div>
                
                <div className="product-status">
                    {getStatusBadge()}
                    <button 
                        className="card-menu-btn"
                        onClick={() => setShowActions(!showActions)}
                        aria-label="Menú de acciones"
                    >
                        ⋮
                    </button>
                    
                    {showActions && (
                        <div className="card-actions-menu">
                            <button 
                                className="action-item"
                                onClick={() => {
                                    setShowActions(false);
                                    if (onViewDetail) onViewDetail(product);
                                }}
                            >
                                <i className="action-icon">👁️</i>
                                <span>Ver Detalles</span>
                            </button>
                            <button 
                                className="action-item"
                                onClick={() => {
                                    setShowActions(false);
                                    if (onEdit) onEdit(product);
                                }}
                            >
                                <i className="action-icon">✏️</i>
                                <span>Editar</span>
                            </button>
                            <button 
                                className="action-item delete"
                                onClick={() => {
                                    setShowActions(false);
                                    if (onDelete) onDelete(product);
                                }}
                            >
                                <i className="action-icon">🗑️</i>
                                <span>Eliminar</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="card-body">
                <div className="product-info">
                    <h3 className="product-name" title={product.name}>
                        {product.name}
                    </h3>
                    <p className="product-description">
                        {product.description ? 
                            (product.description.length > 80 
                                ? `${product.description.substring(0, 80)}...` 
                                : product.description)
                            : 'Sin descripción disponible'
                        }
                    </p>
                    
                    <div className="product-meta">
                        <div className="meta-item">
                            <span className="meta-label">SKU:</span>
                            <span className="meta-value">{product.sku}</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">Categoría:</span>
                            <span className="meta-value">{product.category}</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">Proveedor:</span>
                            <span className="meta-value" title={product.supplier}>
                                {product.supplier.length > 15 
                                    ? `${product.supplier.substring(0, 15)}...` 
                                    : product.supplier}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className="product-pricing">
                    <div className="price-section">
                        <span className="price-label">Precio:</span>
                        <span className="price-value">{formatPrice(product.price)}</span>
                    </div>
                    
                    {product.cost && (
                        <div className="cost-section">
                            <span className="cost-label">Costo:</span>
                            <span className="cost-value">{formatPrice(product.cost)}</span>
                            <span className="margin-badge">
                                Margen: {((product.price - product.cost) / product.cost * 100).toFixed(1)}%
                            </span>
                        </div>
                    )}
                </div>
                
                <div className="product-stock">
                    <div className="stock-section">
                        <span className="stock-label">Stock:</span>
                        <div className="stock-info">
                            <span className={`stock-value ${getStockClass()}`}>
                                {product.stock} unidades
                            </span>
                            {product.minStock && (
                                <span className="min-stock">
                                    Mín: {product.minStock}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <div className="stock-progress">
                        <div 
                            className="progress-bar"
                            style={{ 
                                width: `${Math.min((product.stock / (product.minStock * 3 || 30)) * 100, 100)}%`,
                                backgroundColor: getStockClass() === 'stock-low' ? '#f39c12' : 
                                               getStockClass() === 'stock-empty' ? '#e74c3c' : '#27ae60'
                            }}
                        ></div>
                    </div>
                </div>
            </div>
            
            <div className="card-footer">
                <div className="quantity-controls">
                    <button 
                        className="quantity-btn"
                        onClick={decrementQuantity}
                        disabled={quantity <= 1 || product.stock <= 0}
                    >
                        −
                    </button>
                    <input
                        type="number"
                        className="quantity-input"
                        value={quantity}
                        onChange={handleQuantityChange}
                        min="1"
                        max={product.stock}
                    />
                    <button 
                        className="quantity-btn"
                        onClick={incrementQuantity}
                        disabled={quantity >= product.stock || product.stock <= 0}
                    >
                        +
                    </button>
                </div>
                
                <div className="card-actions">
                    <button 
                        className="btn btn-secondary"
                        onClick={() => onViewDetail && onViewDetail(product)}
                    >
                        <i className="btn-icon">👁️</i>
                        <span>Detalles</span>
                    </button>
                    
                    <button 
                        className="btn btn-primary"
                        onClick={handleAddToCart}
                        disabled={product.stock <= 0}
                    >
                        <i className="btn-icon">🛒</i>
                        <span>Agregar</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;