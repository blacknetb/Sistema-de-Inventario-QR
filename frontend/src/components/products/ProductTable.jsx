import React from 'react';
import '../../assets/styles/Products/products.CSS';

const ProductTable = ({
  products,
  selectedProducts,
  onSelectProduct,
  onSelectAll,
  onEdit,
  onDelete,
  onQuickView,
  sortConfig,
  onSort
}) => {
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    onSort({ key, direction });
  };

  const getStockStatusBadge = (stock, minStock) => {
    if (stock <= 0) {
      return <span className="badge badge-danger">Agotado</span>;
    } else if (stock <= minStock) {
      return <span className="badge badge-warning">Bajo Stock</span>;
    } else {
      return <span className="badge badge-success">Disponible</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-success">Activo</span>;
      case 'inactive':
        return <span className="badge badge-secondary">Inactivo</span>;
      case 'draft':
        return <span className="badge badge-info">Borrador</span>;
      default:
        return <span className="badge badge-light">{status}</span>;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="product-table-container">
      <div className="table-responsive">
        <table className="product-table">
          <thead>
            <tr>
              <th className="checkbox-column">
                <input
                  type="checkbox"
                  checked={selectedProducts.length === products.length && products.length > 0}
                  onChange={onSelectAll}
                  aria-label="Seleccionar todos los productos"
                />
              </th>
              <th onClick={() => handleSort('sku')}>
                SKU
                {sortConfig.key === 'sku' && (
                  <span className="sort-icon">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('name')}>
                Producto
                {sortConfig.key === 'name' && (
                  <span className="sort-icon">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('category')}>
                Categoría
                {sortConfig.key === 'category' && (
                  <span className="sort-icon">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('stock')}>
                Stock
                {sortConfig.key === 'stock' && (
                  <span className="sort-icon">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('price')}>
                Precio
                {sortConfig.key === 'price' && (
                  <span className="sort-icon">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th>Estado</th>
              <th onClick={() => handleSort('createdAt')}>
                Fecha
                {sortConfig.key === 'createdAt' && (
                  <span className="sort-icon">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th className="actions-column">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} className={selectedProducts.includes(product.id) ? 'selected' : ''}>
                <td className="checkbox-column">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.id)}
                    onChange={() => onSelectProduct(product.id)}
                    aria-label={`Seleccionar ${product.name}`}
                  />
                </td>
                <td>
                  <div className="sku-cell">
                    <strong>{product.sku}</strong>
                    {product.barcode && (
                      <small className="barcode">Cód: {product.barcode}</small>
                    )}
                  </div>
                </td>
                <td>
                  <div className="product-cell">
                    <div className="product-image">
                      <img 
                        src={product.mainImage || product.images?.[0] || 'https://via.placeholder.com/50x50/ccc/fff?text=No+Image'} 
                        alt={product.name}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/50x50/ccc/fff?text=No+Image';
                        }}
                      />
                    </div>
                    <div className="product-info">
                      <div className="product-name">{product.name}</div>
                      <div className="product-brand">{product.brand}</div>
                      {product.variants?.length > 0 && (
                        <div className="product-variants">
                          <span className="variants-count">
                            {product.variants.length} variante{product.variants.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="category-cell">
                    <span className="category-badge">{product.category}</span>
                    {product.subcategory && (
                      <small className="subcategory">{product.subcategory}</small>
                    )}
                  </div>
                </td>
                <td>
                  <div className="stock-cell">
                    <div className="stock-value">
                      <span className="stock-amount">{product.stock}</span>
                      <span className="stock-unit">{product.unit}</span>
                    </div>
                    <div className="stock-status">
                      {getStockStatusBadge(product.stock, product.minStock)}
                    </div>
                    <div className="stock-limits">
                      Mín: {product.minStock} | Máx: {product.maxStock || '∞'}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="price-cell">
                    <div className="price-main">{formatCurrency(product.price)}</div>
                    {product.salePrice && product.salePrice < product.price && (
                      <div className="price-sale">
                        <del>{formatCurrency(product.price)}</del>
                        <strong>{formatCurrency(product.salePrice)}</strong>
                      </div>
                    )}
                    <div className="price-cost">
                      Costo: {formatCurrency(product.cost)}
                    </div>
                    {product.cost > 0 && (
                      <div className="price-margin">
                        Margen: {((product.price - product.cost) / product.cost * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="status-cell">
                    {getStatusBadge(product.status)}
                    {product.rating > 0 && (
                      <div className="product-rating">
                        <span className="rating-stars">
                          {'★'.repeat(Math.floor(product.rating))}
                          {'☆'.repeat(5 - Math.floor(product.rating))}
                        </span>
                        <span className="rating-value">{product.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="date-cell">
                    <div className="date-created">
                      Creado: {product.createdAt}
                    </div>
                    <div className="date-updated">
                      Actualizado: {product.updatedAt}
                    </div>
                  </div>
                </td>
                <td className="actions-column">
                  <div className="table-actions">
                    <button
                      className="action-btn view-btn"
                      onClick={() => onQuickView(product)}
                      title="Vista rápida"
                    >
                      👁️
                    </button>
                    <button
                      className="action-btn edit-btn"
                      onClick={() => onEdit(product)}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => onDelete(product.id)}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                    <div className="action-dropdown">
                      <button className="action-btn more-btn" title="Más acciones">
                        ⋮
                      </button>
                      <div className="dropdown-menu">
                        <button className="dropdown-item">
                          <span className="dropdown-icon">📊</span>
                          Ver estadísticas
                        </button>
                        <button className="dropdown-item">
                          <span className="dropdown-icon">📋</span>
                          Duplicar
                        </button>
                        <button className="dropdown-item">
                          <span className="dropdown-icon">📤</span>
                          Exportar
                        </button>
                        <button className="dropdown-item">
                          <span className="dropdown-icon">🏷️</span>
                          Etiquetar
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {products.length === 0 && (
        <div className="table-empty">
          <div className="empty-icon">📋</div>
          <p>No hay productos para mostrar</p>
        </div>
      )}
    </div>
  );
};

export default ProductTable;