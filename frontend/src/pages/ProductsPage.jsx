import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { useNotification } from '../context/NotificationContext';
import '../assets/styles/pages/pages.css';

const ProductsPage = () => {
  const { products, categories, loading, error, fetchProducts, deleteProduct } = useInventory();
  const { showNotification } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Estados locales
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Filtrar y ordenar productos
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term) ||
        product.sku?.toLowerCase().includes(term)
      );
    }

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Ordenar
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [products, searchTerm, selectedCategory, sortBy, sortOrder]);

  // Paginación
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = products.length;
    const lowStock = products.filter(p => p.quantity <= p.minStock).length;
    const outOfStock = products.filter(p => p.quantity === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    
    return { total, lowStock, outOfStock, totalValue };
  }, [products]);

  // Efectos
  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const params = {};
    if (searchTerm) params.search = searchTerm;
    if (selectedCategory !== 'all') params.category = selectedCategory;
    setSearchParams(params);
  }, [searchTerm, selectedCategory]);

  // Handlers
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === paginatedProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(paginatedProducts.map(p => p.id));
    }
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteProduct(productToDelete.id);
      showNotification('success', 'Producto eliminado', 'El producto ha sido eliminado correctamente');
      setShowDeleteModal(false);
      setProductToDelete(null);
      setSelectedProducts(prev => prev.filter(id => id !== productToDelete.id));
    } catch (error) {
      showNotification('error', 'Error', 'No se pudo eliminar el producto');
    }
  };

  const handleExport = () => {
    // Simular exportación
    const exportData = selectedProducts.length > 0 
      ? products.filter(p => selectedProducts.includes(p.id))
      : products;
    
    const csv = convertToCSV(exportData);
    downloadCSV(csv, 'productos.csv');
    showNotification('success', 'Exportación completada', 'Los datos se han exportado correctamente');
  };

  const handleBulkUpdate = (field, value) => {
    // Aquí iría la lógica para actualizar múltiples productos
    showNotification('info', 'Función en desarrollo', 'La actualización masiva estará disponible pronto');
  };

  // Funciones auxiliares
  const convertToCSV = (data) => {
    const headers = ['ID', 'Nombre', 'Categoría', 'SKU', 'Cantidad', 'Precio', 'Stock Mínimo', 'Estado'];
    const rows = data.map(product => [
      product.id,
      product.name,
      product.category,
      product.sku || '',
      product.quantity,
      product.price,
      product.minStock || 0,
      product.quantity === 0 ? 'Agotado' : product.quantity <= product.minStock ? 'Bajo Stock' : 'Disponible'
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (product) => {
    if (product.quantity === 0) {
      return <span className="status-badge status-out">Agotado</span>;
    } else if (product.quantity <= (product.minStock || 5)) {
      return <span className="status-badge status-low">Bajo Stock</span>;
    } else {
      return <span className="status-badge status-available">Disponible</span>;
    }
  };

  if (loading) {
    return (
      <div className="products-page loading">
        <div className="loading-spinner"></div>
        <p>Cargando productos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="products-page error">
        <div className="error-icon">⚠️</div>
        <h3>Error al cargar productos</h3>
        <p>{error}</p>
        <button onClick={fetchProducts} className="retry-button">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="products-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">Productos</h1>
          <p className="page-subtitle">
            {stats.total} productos • {stats.lowStock} bajo stock • {stats.outOfStock} agotados
          </p>
        </div>
        
        <div className="header-right">
          <div className="view-toggle">
            <button
              className={`view-button ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Vista de cuadrícula"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
            <button
              className={`view-button ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Vista de lista"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M8 6H21M8 12H21M8 18H21M3 6H3.01M3 12H3.01M3 18H3.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          
          <Link to="/products/new" className="primary-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Nuevo Producto
          </Link>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="filters-section">
        <div className="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <input
            type="search"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>

        <div className="category-filter">
          <button
            className={`category-button ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => handleCategoryChange('all')}
          >
            Todas
          </button>
          {categories.map(category => (
            <button
              key={category}
              className={`category-button ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => handleCategoryChange(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="sort-filter">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="name">Nombre</option>
            <option value="price">Precio</option>
            <option value="quantity">Cantidad</option>
            <option value="createdAt">Fecha creación</option>
          </select>
          <button
            className="sort-order-button"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            title={sortOrder === 'asc' ? 'Orden ascendente' : 'Orden descendente'}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Acciones masivas */}
      {selectedProducts.length > 0 && (
        <div className="bulk-actions">
          <div className="bulk-info">
            <input
              type="checkbox"
              checked={selectedProducts.length === paginatedProducts.length}
              onChange={handleSelectAll}
              className="bulk-checkbox"
            />
            <span>{selectedProducts.length} productos seleccionados</span>
          </div>
          
          <div className="bulk-buttons">
            <button className="bulk-button" onClick={() => handleBulkUpdate('category', 'Nueva Categoría')}>
              Cambiar Categoría
            </button>
            <button className="bulk-button" onClick={() => handleBulkUpdate('price', 0)}>
              Actualizar Precio
            </button>
            <button className="bulk-button danger" onClick={handleExport}>
              Exportar Seleccionados
            </button>
            <button className="bulk-button danger" onClick={() => setSelectedProducts([])}>
              Deseleccionar Todo
            </button>
          </div>
        </div>
      )}

      {/* Contenido */}
      {viewMode === 'grid' ? (
        <div className="products-grid">
          {paginatedProducts.length > 0 ? (
            paginatedProducts.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-card-header">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.id)}
                    onChange={() => handleSelectProduct(product.id)}
                    className="product-checkbox"
                  />
                  {getStatusBadge(product)}
                  <div className="product-actions">
                    <Link to={`/products/${product.id}/edit`} className="action-button" title="Editar">
                      ✏️
                    </Link>
                    <button 
                      className="action-button danger" 
                      onClick={() => handleDeleteClick(product)}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div className="product-card-body">
                  <div className="product-image">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} />
                    ) : (
                      <div className="product-image-placeholder">
                        <span>📦</span>
                      </div>
                    )}
                    <div className="product-qr">
                      <span>QR</span>
                    </div>
                  </div>
                  
                  <div className="product-info">
                    <h3 className="product-name">
                      <Link to={`/products/${product.id}`}>{product.name}</Link>
                    </h3>
                    <p className="product-category">
                      <span className="category-badge">{product.category}</span>
                    </p>
                    <p className="product-description">
                      {product.description || 'Sin descripción'}
                    </p>
                    
                    <div className="product-stats">
                      <div className="product-stat">
                        <span className="stat-label">SKU:</span>
                        <span className="stat-value">{product.sku || 'N/A'}</span>
                      </div>
                      <div className="product-stat">
                        <span className="stat-label">Cantidad:</span>
                        <span className={`stat-value ${product.quantity <= product.minStock ? 'warning' : ''}`}>
                          {product.quantity}
                        </span>
                      </div>
                      <div className="product-stat">
                        <span className="stat-label">Precio:</span>
                        <span className="stat-value">${product.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="product-card-footer">
                  <div className="product-value">
                    Valor: <strong>${(product.price * product.quantity).toFixed(2)}</strong>
                  </div>
                  <Link to={`/products/${product.id}`} className="view-details-button">
                    Ver Detalles →
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <h3>No se encontraron productos</h3>
              <p>Intenta con otros términos de búsqueda o crea un nuevo producto.</p>
              <Link to="/products/new" className="primary-button">
                Crear Producto
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === paginatedProducts.length && paginatedProducts.length > 0}
                    onChange={handleSelectAll}
                    className="header-checkbox"
                  />
                </th>
                <th onClick={() => handleSort('name')}>
                  Producto {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('category')}>
                  Categoría {sortBy === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('quantity')}>
                  Cantidad {sortBy === 'quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('price')}>
                  Precio {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map(product => (
                  <tr key={product.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                      />
                    </td>
                    <td>
                      <div className="product-cell">
                        <div className="product-cell-image">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} />
                          ) : (
                            <span>📦</span>
                          )}
                        </div>
                        <div className="product-cell-info">
                          <Link to={`/products/${product.id}`} className="product-cell-name">
                            {product.name}
                          </Link>
                          <span className="product-cell-sku">{product.sku || 'Sin SKU'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="category-tag">{product.category}</span>
                    </td>
                    <td>
                      <span className={`quantity-cell ${product.quantity <= product.minStock ? 'warning' : ''}`}>
                        {product.quantity}
                        {product.minStock && product.quantity <= product.minStock && (
                          <span className="min-stock-indicator">min: {product.minStock}</span>
                        )}
                      </span>
                    </td>
                    <td>${product.price.toFixed(2)}</td>
                    <td>{getStatusBadge(product)}</td>
                    <td>
                      <div className="table-actions">
                        <Link to={`/products/${product.id}`} className="table-action" title="Ver">
                          👁️
                        </Link>
                        <Link to={`/products/${product.id}/edit`} className="table-action" title="Editar">
                          ✏️
                        </Link>
                        <button 
                          className="table-action danger" 
                          onClick={() => handleDeleteClick(product)}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="empty-table">
                    <div className="empty-state">
                      <div className="empty-state-icon">📦</div>
                      <h3>No se encontraron productos</h3>
                      <p>Intenta con otros términos de búsqueda.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ← Anterior
          </button>
          
          <div className="pagination-pages">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => 
                page === 1 || 
                page === totalPages || 
                (page >= currentPage - 2 && page <= currentPage + 2)
              )
              .map((page, index, array) => (
                <React.Fragment key={page}>
                  {index > 0 && page - array[index - 1] > 1 && (
                    <span className="pagination-ellipsis">...</span>
                  )}
                  <button
                    className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                </React.Fragment>
              ))}
          </div>
          
          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && productToDelete && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Confirmar eliminación</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <p>¿Estás seguro de que deseas eliminar el producto <strong>{productToDelete.name}</strong>?</p>
              <p className="warning-text">
                Esta acción no se puede deshacer y se eliminarán todos los datos asociados al producto.
              </p>
            </div>
            
            <div className="modal-footer">
              <button className="secondary-button" onClick={() => setShowDeleteModal(false)}>
                Cancelar
              </button>
              <button className="danger-button" onClick={handleDeleteConfirm}>
                Eliminar Producto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas rápidas */}
      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Productos</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon warning">⚠️</div>
          <div className="stat-content">
            <h3>{stats.lowStock}</h3>
            <p>Bajo Stock</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon danger">❌</div>
          <div className="stat-content">
            <h3>{stats.outOfStock}</h3>
            <p>Agotados</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon success">💰</div>
          <div className="stat-content">
            <h3>${stats.totalValue.toFixed(2)}</h3>
            <p>Valor Total</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;