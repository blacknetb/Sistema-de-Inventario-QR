import React, { useState } from 'react';
import ProductImages from './ProductImages';
import ProductVariants from './ProductVariants';
import ProductReviews from './ProductReviews';
import ProductAnalytics from './ProductAnalytics';
import '../../assets/styles/Products/products.CSS';

const ProductDetail = ({ product, onClose, onEdit }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const calculateProfit = () => {
    const profit = product.price - product.cost;
    const margin = product.cost > 0 ? (profit / product.cost * 100) : 0;
    return { profit, margin };
  };

  const getStockStatus = (stock, minStock) => {
    if (stock <= 0) return { label: 'Agotado', color: '#e74c3c', icon: '❌' };
    if (stock <= minStock) return { label: 'Bajo Stock', color: '#f39c12', icon: '⚠️' };
    return { label: 'Disponible', color: '#2ecc71', icon: '✅' };
  };

  const { profit, margin } = calculateProfit();
  const stockStatus = getStockStatus(product.stock, product.minStock);
  const hasSale = product.salePrice && product.salePrice < product.price;

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: '📊' },
    { id: 'specs', label: 'Especificaciones', icon: '📋' },
    { id: 'variants', label: 'Variantes', icon: '🔄' },
    { id: 'reviews', label: 'Reseñas', icon: '⭐' },
    { id: 'analytics', label: 'Analíticas', icon: '📈' },
    { id: 'history', label: 'Historial', icon: '📅' }
  ];

  return (
    <div className="product-detail">
      <div className="detail-header">
        <div className="header-left">
          <button className="back-btn" onClick={onClose}>
            ← Volver
          </button>
          <h1>{product.name}</h1>
          <div className="product-meta">
            <span className="sku">SKU: {product.sku}</span>
            <span className="category">{product.category}</span>
            <span className="brand">{product.brand}</span>
          </div>
        </div>
        <div className="header-right">
          <button className="btn-secondary" onClick={onClose}>
            Cerrar
          </button>
          <button className="btn-primary" onClick={onEdit}>
            ✏️ Editar
          </button>
        </div>
      </div>

      <div className="detail-content">
        <div className="sidebar">
          <div className="product-images">
            <ProductImages 
              images={product.images}
              onImagesChange={() => {}}
              readonly={true}
            />
          </div>

          <div className="quick-stats">
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <div className="stat-value">{formatCurrency(product.price)}</div>
                <div className="stat-label">Precio de venta</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-content">
                <div className="stat-value">{product.stock}</div>
                <div className="stat-label">Stock actual</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <div className="stat-value">{formatCurrency(profit)}</div>
                <div className="stat-label">Ganancia por unidad</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ color: stockStatus.color }}>
                {stockStatus.icon}
              </div>
              <div className="stat-content">
                <div 
                  className="stat-value" 
                  style={{ color: stockStatus.color }}
                >
                  {stockStatus.label}
                </div>
                <div className="stat-label">Estado del stock</div>
              </div>
            </div>
          </div>

          <div className="supplier-info">
            <h3>Información del Proveedor</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Proveedor:</span>
                <span className="info-value">{product.supplier}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Código de barras:</span>
                <span className="info-value">{product.barcode}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Unidad:</span>
                <span className="info-value">{product.unit}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Peso:</span>
                <span className="info-value">{product.weight} kg</span>
              </div>
              <div className="info-item">
                <span className="info-label">Dimensiones:</span>
                <span className="info-value">{product.dimensions}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="main-content">
          <div className="detail-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="tab-content">
            {activeTab === 'overview' && (
              <div className="overview-tab">
                <div className="section">
                  <h3>Descripción del Producto</h3>
                  <p className="description">{product.description}</p>
                </div>

                <div className="section">
                  <h3>Precios y Costos</h3>
                  <div className="price-grid">
                    <div className="price-item">
                      <span className="price-label">Costo:</span>
                      <span className="price-value">{formatCurrency(product.cost)}</span>
                    </div>
                    <div className="price-item">
                      <span className="price-label">Precio regular:</span>
                      <span className="price-value">{formatCurrency(product.price)}</span>
                    </div>
                    {hasSale && (
                      <div className="price-item">
                        <span className="price-label">Precio de oferta:</span>
                        <span className="price-value sale">{formatCurrency(product.salePrice)}</span>
                      </div>
                    )}
                    <div className="price-item">
                      <span className="price-label">IVA ({product.taxRate}%):</span>
                      <span className="price-value">{formatCurrency(product.price * product.taxRate / 100)}</span>
                    </div>
                    <div className="price-item highlight">
                      <span className="price-label">Ganancia:</span>
                      <span className="price-value profit">{formatCurrency(profit)}</span>
                    </div>
                    <div className="price-item highlight">
                      <span className="price-label">Margen:</span>
                      <span className="price-value margin">{margin.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div className="section">
                  <h3>Gestión de Stock</h3>
                  <div className="stock-grid">
                    <div className="stock-item">
                      <span className="stock-label">Stock actual:</span>
                      <span className="stock-value">{product.stock} {product.unit}</span>
                    </div>
                    <div className="stock-item">
                      <span className="stock-label">Stock mínimo:</span>
                      <span className="stock-value">{product.minStock} {product.unit}</span>
                    </div>
                    <div className="stock-item">
                      <span className="stock-label">Stock máximo:</span>
                      <span className="stock-value">{product.maxStock || '∞'} {product.unit}</span>
                    </div>
                    <div className="stock-item">
                      <span className="stock-label">Valor del stock:</span>
                      <span className="stock-value">{formatCurrency(product.price * product.stock)}</span>
                    </div>
                    <div className="stock-item">
                      <span className="stock-label">Estado:</span>
                      <span 
                        className="stock-status-badge"
                        style={{ 
                          backgroundColor: stockStatus.color + '20', 
                          color: stockStatus.color 
                        }}
                      >
                        {stockStatus.label}
                      </span>
                    </div>
                  </div>
                </div>

                {product.features?.length > 0 && (
                  <div className="section">
                    <h3>Características Principales</h3>
                    <ul className="features-list">
                      {product.features.map((feature, index) => (
                        <li key={index}>
                          <span className="feature-icon">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {product.tags?.length > 0 && (
                  <div className="section">
                    <h3>Etiquetas</h3>
                    <div className="tags-container">
                      {product.tags.map((tag, index) => (
                        <span key={index} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="specs-tab">
                <h3>Especificaciones Técnicas</h3>
                {Object.keys(product.specifications || {}).length > 0 ? (
                  <div className="specs-grid">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="spec-item">
                        <span className="spec-label">{key}:</span>
                        <span className="spec-value">{value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-specs">No hay especificaciones técnicas definidas.</p>
                )}
              </div>
            )}

            {activeTab === 'variants' && (
              <div className="variants-tab">
                <ProductVariants
                  variants={product.variants}
                  onVariantsChange={() => {}}
                  readonly={true}
                />
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="reviews-tab">
                <ProductReviews
                  productId={product.id}
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                />
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="analytics-tab">
                <ProductAnalytics
                  stats={{
                    total: 1,
                    inStock: product.stock > 0 ? 1 : 0,
                    lowStock: product.stock <= product.minStock ? 1 : 0,
                    outOfStock: product.stock <= 0 ? 1 : 0,
                    totalValue: product.price * product.stock
                  }}
                />
                <div className="sales-analytics">
                  <h3>Análisis de Ventas</h3>
                  <p>Esta sección mostraría datos históricos de ventas del producto.</p>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="history-tab">
                <h3>Historial del Producto</h3>
                <div className="history-list">
                  <div className="history-item">
                    <div className="history-icon">📅</div>
                    <div className="history-content">
                      <div className="history-title">Producto creado</div>
                      <div className="history-date">{product.createdAt}</div>
                      <div className="history-user">por {product.createdBy}</div>
                    </div>
                  </div>
                  <div className="history-item">
                    <div className="history-icon">✏️</div>
                    <div className="history-content">
                      <div className="history-title">Última actualización</div>
                      <div className="history-date">{product.updatedAt}</div>
                      <div className="history-user">por {product.updatedBy}</div>
                    </div>
                  </div>
                  <div className="history-item">
                    <div className="history-icon">📦</div>
                    <div className="history-content">
                      <div className="history-title">Último ajuste de stock</div>
                      <div className="history-date">2024-03-15</div>
                      <div className="history-details">+5 unidades agregadas</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;