import React from 'react';
import ProductCard from './ProductCard';
import '../../assets/styles/inventory/Inventory.css';

const ProductList = ({ products, onEdit, onDelete }) => {
  if (products.length === 0) {
    return null;
  }

  return (
    <div className="product-list-container">
      <div className="product-list-header">
        <h3>Productos en Inventario</h3>
        <span className="view-toggle">
          <button className="view-btn active">📊 Vista Grid</button>
          <button className="view-btn">📋 Vista Tabla</button>
        </span>
      </div>
      
      <div className="product-grid">
        {products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductList;