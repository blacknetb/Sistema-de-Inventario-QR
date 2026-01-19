import React, { useState } from 'react';
import ReportCharts from './ReportCharts';
import { formatCurrency, formatNumber, calculateCategoryMetrics } from './ReportUtils';
import '../../assets/styles/Reports/reports.css';

const CategoryReport = ({ data, filters, stats }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('value');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const metrics = calculateCategoryMetrics(data);
  const categories = Object.keys(metrics.categoryData || {});
  
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getCategoryData = () => {
    let categoryArray = Object.entries(metrics.categoryData || {}).map(([name, data]) => ({
      name,
      ...data
    }));
    
    if (selectedCategory !== 'all') {
      categoryArray = categoryArray.filter(cat => cat.name === selectedCategory);
    }
    
    // Aplicar ordenamiento
    categoryArray.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return categoryArray;
  };

  const categoryList = getCategoryData();
  
  const chartData = {
    categoryValue: {
      labels: categoryList.map(cat => cat.name),
      datasets: [
        {
          label: 'Valor del Inventario',
          data: categoryList.map(cat => cat.totalValue),
          backgroundColor: '#3498db'
        }
      ]
    },
    categoryItems: {
      labels: categoryList.map(cat => cat.name),
      datasets: [
        {
          label: 'Número de Productos',
          data: categoryList.map(cat => cat.itemCount),
          backgroundColor: '#2ecc71'
        }
      ]
    }
  };

  const getTopProductsByCategory = (categoryName) => {
    const categoryProducts = data.filter(item => item.category === categoryName);
    return categoryProducts
      .sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity))
      .slice(0, 5);
  };

  const getCategoryPerformance = (category) => {
    const data = metrics.categoryData[category];
    if (!data) return { class: 'neutral', label: 'Estable' };
    
    const avgValuePerItem = data.totalValue / data.itemCount;
    const overallAvgValue = metrics.totalValue / metrics.totalItems;
    
    if (avgValuePerItem > overallAvgValue * 1.2) {
      return { class: 'excellent', label: 'Excelente' };
    } else if (avgValuePerItem > overallAvgValue * 0.8) {
      return { class: 'good', label: 'Buena' };
    } else {
      return { class: 'poor', label: 'Mejorable' };
    }
  };

  return (
    <div className="category-report">
      <div className="report-header">
        <h2>Reporte por Categorías</h2>
        <div className="header-actions">
          <div className="category-selector">
            <span>Categoría:</span>
            <select 
              className="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">Todas las categorías</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          <div className="sort-selector">
            <span>Ordenar por:</span>
            <select 
              className="sort-select"
              value={sortBy}
              onChange={(e) => handleSort(e.target.value)}
            >
              <option value="name">Nombre</option>
              <option value="itemCount">Número de Productos</option>
              <option value="totalValue">Valor Total</option>
              <option value="averageValue">Valor Promedio</option>
              <option value="stockValue">Valor en Stock</option>
            </select>
            <button 
              className="sort-order"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      <div className="category-metrics">
        <div className="metric-card category">
          <div className="metric-icon" style={{ backgroundColor: '#e8f4fc' }}>
            <span style={{ color: '#3498db' }}>🏷️</span>
          </div>
          <div className="metric-content">
            <h3>{metrics.categoryCount || 0}</h3>
            <p>Categorías Activas</p>
            <small>{metrics.totalItems || 0} productos totales</small>
          </div>
        </div>
        
        <div className="metric-card category">
          <div className="metric-icon" style={{ backgroundColor: '#d5f4e6' }}>
            <span style={{ color: '#27ae60' }}>💰</span>
          </div>
          <div className="metric-content">
            <h3>{formatCurrency(metrics.totalValue)}</h3>
            <p>Valor Total Inventario</p>
            <small>{formatCurrency(metrics.averageValue)} por producto</small>
          </div>
        </div>
        
        <div className="metric-card category">
          <div className="metric-icon" style={{ backgroundColor: '#fef5e7' }}>
            <span style={{ color: '#f39c12' }}>📊</span>
          </div>
          <div className="metric-content">
            <h3>{metrics.topCategory?.name || 'N/A'}</h3>
            <p>Categoría Líder</p>
            <small>{formatCurrency(metrics.topCategory?.totalValue || 0)} valor</small>
          </div>
        </div>
        
        <div className="metric-card category">
          <div className="metric-icon" style={{ backgroundColor: '#fdeaea' }}>
            <span style={{ color: '#e74c3c' }}>📉</span>
          </div>
          <div className="metric-content">
            <h3>{metrics.lowestCategory?.name || 'N/A'}</h3>
            <p>Categoría Menor Valor</p>
            <small>{formatCurrency(metrics.lowestCategory?.totalValue || 0)} valor</small>
          </div>
        </div>
      </div>

      <div className="category-charts">
        <div className="chart-row">
          <div className="chart-container">
            <div className="chart-header">
              <h3>Valor por Categoría</h3>
              <span className="chart-subtitle">Distribución del inventario</span>
            </div>
            <ReportCharts 
              type="bar"
              data={chartData.categoryValue}
              options={{
                responsive: true,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return '$' + value.toLocaleString('es-ES');
                      }
                    }
                  }
                }
              }}
            />
          </div>
          
          <div className="chart-container">
            <div className="chart-header">
              <h3>Productos por Categoría</h3>
              <span className="chart-subtitle">Cantidad de items</span>
            </div>
            <ReportCharts 
              type="bar"
              data={chartData.categoryItems}
              options={{
                responsive: true,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return formatNumber(value);
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className="category-table">
        <h3>📋 Detalle por Categoría</h3>
        <div className="table-responsive">
          <table className="categories-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')}>
                  Categoría {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('itemCount')}>
                  Productos {sortBy === 'itemCount' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('totalStock')}>
                  Stock Total {sortBy === 'totalStock' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('totalValue')}>
                  Valor Total {sortBy === 'totalValue' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('averageValue')}>
                  Valor Promedio {sortBy === 'averageValue' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('stockValue')}>
                  Valor Stock {sortBy === 'stockValue' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Rendimiento</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categoryList.map(category => {
                const performance = getCategoryPerformance(category.name);
                
                return (
                  <tr key={category.name}>
                    <td className="cell-category">
                      <strong>{category.name}</strong>
                      <small>{category.description || 'Sin descripción'}</small>
                    </td>
                    <td className="cell-count">
                      <span className="count-badge">{category.itemCount}</span>
                    </td>
                    <td className="cell-stock">
                      <div className="stock-summary">
                        <span className="stock-total">{category.totalStock}</span>
                        <div className="stock-breakdown">
                          <span className="stock-low">
                            {category.lowStockItems || 0} bajo
                          </span>
                          <span className="stock-out">
                            {category.outOfStockItems || 0} agotado
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="cell-value">
                      <strong>{formatCurrency(category.totalValue)}</strong>
                      <small>{((category.totalValue / metrics.totalValue) * 100).toFixed(1)}% del total</small>
                    </td>
                    <td className="cell-average">
                      {formatCurrency(category.averageValue)}
                    </td>
                    <td className="cell-stock-value">
                      {formatCurrency(category.stockValue)}
                    </td>
                    <td>
                      <span className={`performance-badge ${performance.class}`}>
                        {performance.label}
                      </span>
                    </td>
                    <td className="cell-actions">
                      <button 
                        className="btn-category-action"
                        onClick={() => setSelectedCategory(category.name)}
                      >
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCategory !== 'all' && (
        <div className="category-detail">
          <div className="detail-header">
            <h3>📁 Detalle: {selectedCategory}</h3>
            <button 
              className="btn-back"
              onClick={() => setSelectedCategory('all')}
            >
              ← Volver a todas
            </button>
          </div>
          
          <div className="detail-content">
            <div className="detail-metrics">
              <div className="detail-metric">
                <span className="metric-label">Productos en esta categoría:</span>
                <span className="metric-value">
                  {metrics.categoryData[selectedCategory]?.itemCount || 0}
                </span>
              </div>
              <div className="detail-metric">
                <span className="metric-label">Valor total:</span>
                <span className="metric-value">
                  {formatCurrency(metrics.categoryData[selectedCategory]?.totalValue || 0)}
                </span>
              </div>
              <div className="detail-metric">
                <span className="metric-label">Stock total:</span>
                <span className="metric-value">
                  {metrics.categoryData[selectedCategory]?.totalStock || 0} unidades
                </span>
              </div>
              <div className="detail-metric">
                <span className="metric-label">Productos bajo stock:</span>
                <span className="metric-value warning">
                  {metrics.categoryData[selectedCategory]?.lowStockItems || 0}
                </span>
              </div>
            </div>
            
            <div className="detail-products">
              <h4>🏆 Productos Destacados</h4>
              <div className="top-products-grid">
                {getTopProductsByCategory(selectedCategory).map(product => (
                  <div key={product.id} className="product-card">
                    <div className="product-header">
                      <h5>{product.name}</h5>
                      <span className="product-id">ID: #{product.id}</span>
                    </div>
                    <div className="product-details">
                      <div className="product-stat">
                        <span className="stat-label">Stock:</span>
                        <span className={`stat-value ${product.quantity <= 5 ? 'warning' : 'good'}`}>
                          {product.quantity} unidades
                        </span>
                      </div>
                      <div className="product-stat">
                        <span className="stat-label">Precio:</span>
                        <span className="stat-value">{formatCurrency(product.price)}</span>
                      </div>
                      <div className="product-stat">
                        <span className="stat-label">Valor total:</span>
                        <span className="stat-value highlight">
                          {formatCurrency(product.price * product.quantity)}
                        </span>
                      </div>
                    </div>
                    <div className="product-status">
                      <span className={`status-badge ${
                        product.quantity === 0 ? 'critical' : 
                        product.quantity <= 5 ? 'warning' : 'good'
                      }`}>
                        {product.quantity === 0 ? 'Agotado' : 
                         product.quantity <= 5 ? 'Bajo Stock' : 'Disponible'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="category-insights">
              <h4>💡 Insights de Categoría</h4>
              <div className="insights-grid">
                <div className="insight-card">
                  <h5>Oportunidades</h5>
                  <ul>
                    <li>Productos con mayor margen de ganancia</li>
                    <li>Categorías con crecimiento potencial</li>
                    <li>Espacios para nuevos productos</li>
                  </ul>
                </div>
                
                <div className="insight-card">
                  <h5>Riesgos</h5>
                  <ul>
                    <li>Productos con bajo stock</li>
                    <li>Items con baja rotación</li>
                    <li>Categorías con decrecimiento</li>
                  </ul>
                </div>
                
                <div className="insight-card">
                  <h5>Recomendaciones</h5>
                  <ul>
                    <li>Reabastecer productos bajo stock</li>
                    <li>Promocionar categorías con buen rendimiento</li>
                    <li>Revisar precios de categorías con bajo margen</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="category-analysis">
        <h3>📈 Análisis de Categorías</h3>
        <div className="analysis-grid">
          <div className="analysis-card">
            <h4>Categorías Más Valiosas</h4>
            <div className="analysis-list">
              {Object.entries(metrics.categoryData || {})
                .sort((a, b) => b[1].totalValue - a[1].totalValue)
                .slice(0, 3)
                .map(([category, data]) => (
                  <div key={category} className="analysis-item">
                    <span className="item-name">{category}</span>
                    <div className="item-bar">
                      <div 
                        className="bar-fill"
                        style={{ 
                          width: `${(data.totalValue / metrics.totalValue) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="item-value">{formatCurrency(data.totalValue)}</span>
                  </div>
                ))}
            </div>
          </div>
          
          <div className="analysis-card">
            <h4>Categorías con Más Productos</h4>
            <div className="analysis-list">
              {Object.entries(metrics.categoryData || {})
                .sort((a, b) => b[1].itemCount - a[1].itemCount)
                .slice(0, 3)
                .map(([category, data]) => (
                  <div key={category} className="analysis-item">
                    <span className="item-name">{category}</span>
                    <div className="item-bar">
                      <div 
                        className="bar-fill"
                        style={{ 
                          width: `${(data.itemCount / metrics.totalItems) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="item-value">{data.itemCount} productos</span>
                  </div>
                ))}
            </div>
          </div>
          
          <div className="analysis-card">
            <h4>Categorías a Monitorear</h4>
            <div className="analysis-list">
              {Object.entries(metrics.categoryData || {})
                .filter(([_, data]) => data.lowStockItems > 0 || data.outOfStockItems > 0)
                .sort((a, b) => (b[1].lowStockItems + b[1].outOfStockItems) - 
                               (a[1].lowStockItems + a[1].outOfStockItems))
                .slice(0, 3)
                .map(([category, data]) => (
                  <div key={category} className="analysis-item warning">
                    <span className="item-name">{category}</span>
                    <div className="item-stats">
                      <span className="stat">{data.lowStockItems} bajo stock</span>
                      <span className="stat">{data.outOfStockItems} agotados</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      <div className="report-footer">
        <div className="footer-notes">
          <p><strong>Interpretación:</strong></p>
          <ul>
            <li><strong>Excelente:</strong> Valor promedio {">"}20% del promedio general</li>
            <li><strong>Buena:</strong> Valor promedio dentro del rango normal</li>
            <li><strong>Mejorable:</strong> Valor promedio {"<"} 80% del promedio general</li>
          </ul>
        </div>
        
        <div className="footer-stats">
          <div className="footer-stat">
            <span>Categorías analizadas:</span>
            <strong>{categoryList.length}</strong>
          </div>
          <div className="footer-stat">
            <span>Categoría principal:</span>
            <strong>{metrics.topCategory?.name || 'N/A'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryReport;