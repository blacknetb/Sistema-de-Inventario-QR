import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../assets/styles/Products/products.CSS';

const ProductComparison = () => {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedProducts.length >= 2) {
      fetchComparisonData();
    } else {
      setComparisonData([]);
    }
  }, [selectedProducts]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchComparisonData = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/products/compare', {
        productIds: selectedProducts.map(p => p.id)
      });
      setComparisonData(response.data);
    } catch (error) {
      console.error('Error fetching comparison data:', error);
    }
    setLoading(false);
  };

  const handleProductSelect = (product) => {
    if (selectedProducts.some(p => p.id === product.id)) {
      // Si ya está seleccionado, lo removemos
      setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
    } else if (selectedProducts.length < 4) {
      // Solo permitimos comparar hasta 4 productos
      setSelectedProducts([...selectedProducts, product]);
    } else {
      alert('Máximo 4 productos para comparar');
    }
  };

  const removeProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const clearSelection = () => {
    setSelectedProducts([]);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const renderComparisonRow = (label, key, formatter = (val) => val) => {
    return (
      <tr>
        <td className="attribute-label">{label}</td>
        {comparisonData.map((product, index) => (
          <td key={index} className="attribute-value">
            {formatter(product[key])}
          </td>
        ))}
      </tr>
    );
  };

  const getBestValue = (key, comparator = 'max') => {
    if (comparisonData.length === 0) return -1;
    
    const values = comparisonData.map(p => {
      const val = p[key];
      return typeof val === 'number' ? val : 0;
    });
    
    if (comparator === 'max') {
      return Math.max(...values);
    } else {
      return Math.min(...values);
    }
  };

  return (
    <div className="product-comparison-container">
      <div className="comparison-header">
        <h2>Comparador de Productos</h2>
        <p className="comparison-subtitle">
          Selecciona 2 a 4 productos para comparar características y precios
        </p>
      </div>

      <div className="comparison-selection">
        <div className="selection-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="category-filter"
          >
            <option value="all">Todas las categorías</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="selected-products">
          <h3>Productos seleccionados ({selectedProducts.length}/4)</h3>
          <div className="selected-list">
            {selectedProducts.map(product => (
              <div key={product.id} className="selected-item">
                <img 
                  src={product.image || '/placeholder.jpg'} 
                  alt={product.name}
                  className="selected-image"
                />
                <div className="selected-info">
                  <h4>{product.name}</h4>
                  <span className="selected-sku">{product.sku}</span>
                </div>
                <button 
                  className="remove-btn"
                  onClick={() => removeProduct(product.id)}
                >
                  ×
                </button>
              </div>
            ))}
            
            {selectedProducts.length > 0 && (
              <button className="clear-btn" onClick={clearSelection}>
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="products-grid">
        {filteredProducts.map(product => (
          <div 
            key={product.id}
            className={`product-card ${
              selectedProducts.some(p => p.id === product.id) ? 'selected' : ''
            }`}
            onClick={() => handleProductSelect(product)}
          >
            <div className="product-card-image">
              <img src={product.image || '/placeholder.jpg'} alt={product.name} />
              {selectedProducts.some(p => p.id === product.id) && (
                <div className="selected-badge">✓</div>
              )}
            </div>
            
            <div className="product-card-info">
              <h4>{product.name}</h4>
              <p className="product-category">{product.category_name}</p>
              
              <div className="product-price">
                {product.discount_price ? (
                  <>
                    <span className="original-price">${product.price}</span>
                    <span className="current-price">${product.discount_price}</span>
                  </>
                ) : (
                  <span className="current-price">${product.price}</span>
                )}
              </div>
              
              <div className="product-stock">
                <span className={`stock-status ${product.stock_status}`}>
                  {product.stock_status === 'in_stock' ? 'En Stock' : 
                   product.stock_status === 'low_stock' ? 'Stock Bajo' : 'Agotado'}
                </span>
                <span className="stock-quantity">{product.stock} unidades</span>
              </div>
              
              <div className="product-rating">
                <div className="stars">
                  {'★'.repeat(Math.floor(product.rating || 0))}
                  {'☆'.repeat(5 - Math.floor(product.rating || 0))}
                </div>
                <span>({product.review_count || 0})</span>
              </div>
            </div>
            
            <button 
              className={`select-btn ${
                selectedProducts.some(p => p.id === product.id) ? 'selected' : ''
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleProductSelect(product);
              }}
            >
              {selectedProducts.some(p => p.id === product.id) ? 'Quitar' : 'Comparar'}
            </button>
          </div>
        ))}
      </div>

      {selectedProducts.length >= 2 && (
        <div className="comparison-results">
          <div className="results-header">
            <h3>Comparación Detallada</h3>
            {loading && <span className="loading-text">Cargando...</span>}
          </div>
          
          <div className="comparison-table-container">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Característica</th>
                  {comparisonData.map((product, index) => (
                    <th key={index}>
                      <div className="comparison-product-header">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="comparison-image"
                        />
                        <div>
                          <h4>{product.name}</h4>
                          <span className="comparison-sku">{product.sku}</span>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              
              <tbody>
                {renderComparisonRow('Precio', 'price', (val) => `$${val.toFixed(2)}`)}
                {renderComparisonRow('Precio con descuento', 'discount_price', (val) => 
                  val ? `$${val.toFixed(2)}` : '-'
                )}
                {renderComparisonRow('Stock disponible', 'stock', (val) => val + ' unidades')}
                {renderComparisonRow('Estado', 'status', (val) => 
                  val === 'in_stock' ? 'En Stock' : 
                  val === 'low_stock' ? 'Stock Bajo' : 'Agotado'
                )}
                {renderComparisonRow('Categoría', 'category_name')}
                {renderComparisonRow('Marca', 'brand')}
                {renderComparisonRow('SKU', 'sku')}
                {renderComparisonRow('Calificación', 'rating', (val) => 
                  `${val.toFixed(1)}/5`
                )}
                {renderComparisonRow('Reseñas', 'review_count')}
                {renderComparisonRow('Peso', 'weight', (val) => 
                  val ? `${val} kg` : '-'
                )}
                {renderComparisonRow('Dimensiones', 'dimensions', (val) => 
                  val ? `${val} cm` : '-'
                )}
                
                <tr className="separator">
                  <td colSpan={comparisonData.length + 1}>
                    <strong>Especificaciones Técnicas</strong>
                  </td>
                </tr>
                
                {comparisonData[0]?.specifications?.map((spec, index) => (
                  <tr key={index}>
                    <td className="attribute-label">{spec.name}</td>
                    {comparisonData.map((product, pIndex) => (
                      <td key={pIndex} className="attribute-value">
                        {product.specifications?.[index]?.value || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="comparison-summary">
            <h4>Resumen de Comparación</h4>
            <div className="summary-cards">
              <div className="summary-card">
                <h5>Mejor Precio</h5>
                <div className="summary-value">
                  ${getBestValue('discount_price' || 'price', 'min').toFixed(2)}
                </div>
                <small>Más económico</small>
              </div>
              
              <div className="summary-card">
                <h5>Mejor Calificado</h5>
                <div className="summary-value">
                  {getBestValue('rating', 'max').toFixed(1)}/5
                </div>
                <small>Mayor rating</small>
              </div>
              
              <div className="summary-card">
                <h5>Mayor Stock</h5>
                <div className="summary-value">
                  {getBestValue('stock', 'max')} unidades
                </div>
                <small>Disponibilidad</small>
              </div>
              
              <div className="summary-card">
                <h5>Mejor Valoración</h5>
                <div className="summary-value">
                  {getBestValue('review_count', 'max')} reseñas
                </div>
                <small>Más opiniones</small>
              </div>
            </div>
          </div>
          
          <div className="comparison-recommendation">
            <h4>Nuestra Recomendación</h4>
            <div className="recommendation-content">
              <div className="recommendation-product">
                {comparisonData.length > 0 && (() => {
                  const bestProduct = comparisonData.reduce((best, current) => {
                    const bestScore = (best.rating * 0.4) + 
                                    (1 / (best.discount_price || best.price) * 0.3) + 
                                    (best.review_count * 0.3);
                    const currentScore = (current.rating * 0.4) + 
                                       (1 / (current.discount_price || current.price) * 0.3) + 
                                       (current.review_count * 0.3);
                    return currentScore > bestScore ? current : best;
                  });
                  
                  return (
                    <>
                      <img src={bestProduct.image} alt={bestProduct.name} />
                      <div>
                        <h5>{bestProduct.name}</h5>
                        <p>Basado en calificación, precio y número de reseñas</p>
                        <div className="recommendation-reasons">
                          <span>⭐ {bestProduct.rating}/5</span>
                          <span>💰 ${bestProduct.discount_price || bestProduct.price}</span>
                          <span>💬 {bestProduct.review_count} reseñas</span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
          
          <div className="comparison-actions">
            <button className="btn-primary">
              Exportar Comparación (PDF)
            </button>
            <button className="btn-secondary">
              Compartir Comparación
            </button>
            <button className="btn-secondary">
              Imprimir
            </button>
          </div>
        </div>
      )}
      
      {selectedProducts.length === 1 && (
        <div className="comparison-prompt">
          <p>Selecciona al menos un producto más para comparar</p>
        </div>
      )}
    </div>
  );
};

export default ProductComparison;