import React, { useState } from 'react';
import ReportCharts from './ReportCharts';
import { formatCurrency, formatDate, calculateInventoryMetrics } from './ReportUtils';
import '../../assets/styles/Reports/reports.css';

const InventoryReport = ({ data, filters, stats }) => {
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'chart'
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  const metrics = calculateInventoryMetrics(data);
  
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    if (sortField === 'price' || sortField === 'totalValue') {
      aValue = parseFloat(aValue);
      bValue = parseFloat(bValue);
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { class: 'out-of-stock', label: 'Agotado' };
    if (quantity <= 5) return { class: 'low-stock', label: 'Bajo Stock' };
    if (quantity <= 10) return { class: 'medium-stock', label: 'Stock Medio' };
    return { class: 'high-stock', label: 'Stock Alto' };
  };

  const chartData = {
    stockLevels: {
      labels: ['Agotado', 'Bajo Stock', 'Stock Medio', 'Stock Alto'],
      datasets: [
        {
          label: 'Productos por Nivel de Stock',
          data: [
            data.filter(item => item.quantity === 0).length,
            data.filter(item => item.quantity > 0 && item.quantity <= 5).length,
            data.filter(item => item.quantity > 5 && item.quantity <= 10).length,
            data.filter(item => item.quantity > 10).length
          ],
          backgroundColor: ['#e74c3c', '#f39c12', '#3498db', '#2ecc71']
        }
      ]
    },
    categoryDistribution: {
      labels: Object.keys(metrics.categoryValue || {}),
      datasets: [
        {
          label: 'Valor por Categoría ($)',
          data: Object.values(metrics.categoryValue || {}),
          backgroundColor: [
            '#3498db', '#2ecc71', '#e74c3c', '#f39c12', 
            '#9b59b6', '#1abc9c', '#34495e', '#e67e22'
          ]
        }
      ]
    }
  };

  return (
    <div className="inventory-report">
      <div className="report-header">
        <h2>Reporte de Inventario Completo</h2>
        <div className="header-actions">
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              📋 Tabla
            </button>
            <button 
              className={`view-btn ${viewMode === 'chart' ? 'active' : ''}`}
              onClick={() => setViewMode('chart')}
            >
              📊 Gráficos
            </button>
          </div>
          
          <div className="report-summary">
            <div className="summary-item">
              <span className="summary-label">Valor Total:</span>
              <span className="summary-value highlight">
                {formatCurrency(metrics.totalValue)}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Productos:</span>
              <span className="summary-value">{data.length}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Stock Promedio:</span>
              <span className="summary-value">{metrics.averageStock?.toFixed(1) || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="report-metrics">
        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: '#e8f4fc' }}>
            <span style={{ color: '#3498db' }}>📦</span>
          </div>
          <div className="metric-content">
            <h3>{metrics.totalItems || 0}</h3>
            <p>Productos Totales</p>
            <small>{metrics.categoriesCount || 0} categorías</small>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: '#d5f4e6' }}>
            <span style={{ color: '#27ae60' }}>💰</span>
          </div>
          <div className="metric-content">
            <h3>{formatCurrency(metrics.totalValue)}</h3>
            <p>Valor del Inventario</p>
            <small>Promedio: {formatCurrency(metrics.averageValue)}</small>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: '#fef5e7' }}>
            <span style={{ color: '#f39c12' }}>⚠️</span>
          </div>
          <div className="metric-content">
            <h3>{metrics.lowStockItems || 0}</h3>
            <p>Productos Bajo Stock</p>
            <small>{metrics.outOfStock || 0} agotados</small>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: '#fdeaea' }}>
            <span style={{ color: '#e74c3c' }}>🔄</span>
          </div>
          <div className="metric-content">
            <h3>{metrics.turnoverRate ? metrics.turnoverRate.toFixed(2) : 0}</h3>
            <p>Rotación de Inventario</p>
            <small>Por mes</small>
          </div>
        </div>
      </div>

      {viewMode === 'chart' ? (
        <div className="chart-view">
          <div className="chart-row">
            <div className="chart-container">
              <h3>Distribución de Niveles de Stock</h3>
              <ReportCharts 
                type="pie"
                data={chartData.stockLevels}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            </div>
            
            <div className="chart-container">
              <h3>Valor por Categoría</h3>
              <ReportCharts 
                type="bar"
                data={chartData.categoryDistribution}
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
          </div>
          
          <div className="chart-insights">
            <h3>🔍 Insights del Inventario</h3>
            <div className="insights-grid">
              <div className="insight-card">
                <h4>Top Categorías por Valor</h4>
                <ul>
                  {Object.entries(metrics.categoryValue || {})
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([category, value]) => (
                      <li key={category}>
                        <span className="category-name">{category}</span>
                        <span className="category-value">{formatCurrency(value)}</span>
                      </li>
                    ))}
                </ul>
              </div>
              
              <div className="insight-card">
                <h4>Productos Bajo Stock</h4>
                <ul>
                  {data
                    .filter(item => item.quantity <= 5 && item.quantity > 0)
                    .slice(0, 5)
                    .map(item => (
                      <li key={item.id}>
                        <span className="product-name">{item.name}</span>
                        <span className="product-stock">{item.quantity} unidades</span>
                      </li>
                    ))}
                </ul>
              </div>
              
              <div className="insight-card">
                <h4>Productos Más Valiosos</h4>
                <ul>
                  {data
                    .sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity))
                    .slice(0, 3)
                    .map(item => (
                      <li key={item.id}>
                        <span className="product-name">{item.name}</span>
                        <span className="product-value">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="table-view">
          <div className="table-responsive">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('id')}>
                    ID {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('name')}>
                    Producto {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('category')}>
                    Categoría {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('quantity')}>
                    Stock {sortField === 'quantity' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('price')}>
                    Precio {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('totalValue')}>
                    Valor Total {sortField === 'totalValue' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Estado</th>
                  <th>Última Actualización</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map(item => {
                  const stockStatus = getStockStatus(item.quantity);
                  const totalValue = item.price * item.quantity;
                  
                  return (
                    <tr key={item.id}>
                      <td className="cell-id">#{item.id}</td>
                      <td className="cell-product">
                        <strong>{item.name}</strong>
                        {item.description && (
                          <small>{item.description.substring(0, 50)}...</small>
                        )}
                      </td>
                      <td>
                        <span className="category-badge">{item.category}</span>
                      </td>
                      <td>
                        <div className="stock-cell">
                          <span className="stock-quantity">{item.quantity}</span>
                          <div className="stock-bar">
                            <div 
                              className={`stock-fill ${stockStatus.class}`}
                              style={{ width: `${Math.min(item.quantity, 20) * 5}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="cell-price">{formatCurrency(item.price)}</td>
                      <td className="cell-total">
                        <strong>{formatCurrency(totalValue)}</strong>
                      </td>
                      <td>
                        <span className={`status-badge ${stockStatus.class}`}>
                          {stockStatus.label}
                        </span>
                      </td>
                      <td className="cell-date">
                        {item.lastUpdated ? formatDate(item.lastUpdated) : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {data.length === 0 && (
            <div className="empty-table">
              <p>No hay datos de inventario para mostrar con los filtros actuales.</p>
            </div>
          )}
        </div>
      )}

      <div className="report-footer">
        <div className="footer-notes">
          <p><strong>Notas:</strong></p>
          <ul>
            <li>El valor total se calcula como Precio × Cantidad</li>
            <li>Bajo Stock: menos de 5 unidades</li>
            <li>Stock Medio: 5-10 unidades</li>
            <li>Stock Alto: más de 10 unidades</li>
          </ul>
        </div>
        
        <div className="footer-stats">
          <div className="footer-stat">
            <span>Productos analizados:</span>
            <strong>{data.length}</strong>
          </div>
          <div className="footer-stat">
            <span>Fecha de generación:</span>
            <strong>{new Date().toLocaleDateString('es-ES')}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryReport;