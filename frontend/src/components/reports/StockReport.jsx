import React, { useState } from 'react';
import ReportCharts from './ReportCharts';
import { formatCurrency, formatDate, calculateStockMetrics } from './ReportUtils';
import '../../assets/styles/Reports/reports.css';

const StockReport = ({ data, filters, stats }) => {
  const [viewMode, setViewMode] = useState('levels'); // 'levels', 'movements', 'alerts'
  const [alertThreshold, setAlertThreshold] = useState(5);
  
  const metrics = calculateStockMetrics(data, alertThreshold);
  
  const getStockStatus = (quantity) => {
    if (quantity === 0) return { class: 'critical', label: 'Agotado', priority: 1 };
    if (quantity <= alertThreshold) return { class: 'warning', label: 'Bajo Stock', priority: 2 };
    if (quantity <= alertThreshold * 2) return { class: 'medium', label: 'Stock Medio', priority: 3 };
    return { class: 'good', label: 'Stock Alto', priority: 4 };
  };

  const sortedData = [...data].sort((a, b) => {
    const aStatus = getStockStatus(a.quantity);
    const bStatus = getStockStatus(b.quantity);
    
    if (aStatus.priority !== bStatus.priority) {
      return aStatus.priority - bStatus.priority;
    }
    
    return a.quantity - b.quantity;
  });

  const chartData = {
    stockStatus: {
      labels: ['Crítico (0)', `Bajo (≤${alertThreshold})`, 'Medio', 'Alto'],
      datasets: [
        {
          label: 'Productos por Nivel de Stock',
          data: [
            data.filter(item => item.quantity === 0).length,
            data.filter(item => item.quantity > 0 && item.quantity <= alertThreshold).length,
            data.filter(item => item.quantity > alertThreshold && item.quantity <= alertThreshold * 2).length,
            data.filter(item => item.quantity > alertThreshold * 2).length
          ],
          backgroundColor: ['#e74c3c', '#f39c12', '#3498db', '#2ecc71']
        }
      ]
    },
    categoryStock: {
      labels: Object.keys(metrics.categoryStock || {}),
      datasets: [
        {
          label: 'Stock por Categoría (unidades)',
          data: Object.values(metrics.categoryStock || {}),
          backgroundColor: '#3498db'
        }
      ]
    }
  };

  const stockMovements = [
    { id: 1, productId: 1, productName: 'Laptop Dell XPS 13', type: 'venta', quantity: -1, date: '2024-01-15', user: 'Vendedor 1' },
    { id: 2, productId: 2, productName: 'Mouse Inalámbrico', type: 'compra', quantity: 10, date: '2024-01-14', user: 'Admin' },
    { id: 3, productId: 3, productName: 'Monitor 24" Samsung', type: 'ajuste', quantity: -2, date: '2024-01-13', user: 'Sistema' },
    { id: 4, productId: 4, productName: 'Teclado Mecánico', type: 'venta', quantity: -1, date: '2024-01-12', user: 'Vendedor 2' },
    { id: 5, productId: 5, productName: 'Impresora HP LaserJet', type: 'compra', quantity: 5, date: '2024-01-11', user: 'Admin' }
  ];

  const generateReplenishmentSuggestions = () => {
    const suggestions = [];
    
    data.forEach(item => {
      const status = getStockStatus(item.quantity);
      if (status.priority <= 2) { // Crítico o bajo stock
        const suggestedOrder = Math.max(
          Math.ceil(item.averageMonthlySales || 10) * 2 - item.quantity,
          10
        );
        
        suggestions.push({
          productId: item.id,
          productName: item.name,
          currentStock: item.quantity,
          suggestedOrder: suggestedOrder,
          estimatedCost: suggestedOrder * item.price,
          urgency: status.priority === 1 ? 'Alta' : 'Media'
        });
      }
    });
    
    return suggestions.sort((a, b) => {
      if (a.urgency === b.urgency) {
        return b.estimatedCost - a.estimatedCost;
      }
      return a.urgency === 'Alta' ? -1 : 1;
    }).slice(0, 10);
  };

  return (
    <div className="stock-report">
      <div className="report-header">
        <h2>Reporte de Niveles de Stock</h2>
        <div className="header-actions">
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'levels' ? 'active' : ''}`}
              onClick={() => setViewMode('levels')}
            >
              📊 Niveles
            </button>
            <button 
              className={`view-btn ${viewMode === 'movements' ? 'active' : ''}`}
              onClick={() => setViewMode('movements')}
            >
              📈 Movimientos
            </button>
            <button 
              className={`view-btn ${viewMode === 'alerts' ? 'active' : ''}`}
              onClick={() => setViewMode('alerts')}
            >
              ⚠️ Alertas
            </button>
          </div>
          
          <div className="threshold-selector">
            <span>Umbral de alerta:</span>
            <div className="threshold-control">
              <input 
                type="range" 
                min="1" 
                max="20" 
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(parseInt(e.target.value))}
                className="threshold-slider"
              />
              <span className="threshold-value">{alertThreshold} unidades</span>
            </div>
          </div>
        </div>
      </div>

      <div className="stock-metrics">
        <div className="metric-card stock">
          <div className="metric-icon" style={{ backgroundColor: '#fdeaea' }}>
            <span style={{ color: '#e74c3c' }}>🔄</span>
          </div>
          <div className="metric-content">
            <h3>{metrics.turnoverRate ? metrics.turnoverRate.toFixed(2) : 0}</h3>
            <p>Rotación de Stock</p>
            <small>Por mes</small>
          </div>
        </div>
        
        <div className="metric-card stock">
          <div className="metric-icon" style={{ backgroundColor: '#e8f4fc' }}>
            <span style={{ color: '#3498db' }}>⏱️</span>
          </div>
          <div className="metric-content">
            <h3>{metrics.averageDaysInStock ? metrics.averageDaysInStock.toFixed(1) : 0}</h3>
            <p>Días en Stock</p>
            <small>Promedio</small>
          </div>
        </div>
        
        <div className="metric-card stock">
          <div className="metric-icon" style={{ backgroundColor: '#fef5e7' }}>
            <span style={{ color: '#f39c12' }}>⚠️</span>
          </div>
          <div className="metric-content">
            <h3>{metrics.lowStockItems || 0}</h3>
            <p>Productos Bajo Stock</p>
            <small>{metrics.outOfStock || 0} agotados</small>
          </div>
        </div>
        
        <div className="metric-card stock">
          <div className="metric-icon" style={{ backgroundColor: '#d5f4e6' }}>
            <span style={{ color: '#27ae60' }}>💰</span>
          </div>
          <div className="metric-content">
            <h3>{metrics.stockValue ? formatCurrency(metrics.stockValue) : '$0'}</h3>
            <p>Valor del Stock</p>
            <small>{metrics.totalItems || 0} productos</small>
          </div>
        </div>
      </div>

      {viewMode === 'levels' && (
        <>
          <div className="stock-charts">
            <div className="chart-row">
              <div className="chart-container">
                <div className="chart-header">
                  <h3>Distribución de Niveles de Stock</h3>
                  <span className="chart-subtitle">Umbral: {alertThreshold} unidades</span>
                </div>
                <ReportCharts 
                  type="pie"
                  data={chartData.stockStatus}
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
                <div className="chart-header">
                  <h3>Stock por Categoría</h3>
                  <span className="chart-subtitle">Total de unidades</span>
                </div>
                <ReportCharts 
                  type="bar"
                  data={chartData.categoryStock}
                  options={{
                    responsive: true,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return value.toLocaleString('es-ES') + ' uds';
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="stock-levels-table">
            <h3>📋 Niveles de Stock por Producto</h3>
            <div className="table-responsive">
              <table className="stock-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Stock Actual</th>
                    <th>Stock Mínimo</th>
                    <th>Stock Máximo</th>
                    <th>Stock Ideal</th>
                    <th>Estado</th>
                    <th>Último Movimiento</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map(item => {
                    const status = getStockStatus(item.quantity);
                    const minStock = item.minStock || alertThreshold;
                    const maxStock = item.maxStock || alertThreshold * 4;
                    const idealStock = Math.ceil((minStock + maxStock) / 2);
                    
                    return (
                      <tr key={item.id}>
                        <td className="cell-product">
                          <strong>{item.name}</strong>
                          <small>ID: #{item.id}</small>
                        </td>
                        <td>
                          <span className="category-badge">{item.category}</span>
                        </td>
                        <td>
                          <div className="stock-cell">
                            <span className="stock-quantity">{item.quantity}</span>
                            <div className="stock-bar">
                              <div 
                                className={`stock-fill ${status.class}`}
                                style={{ 
                                  width: `${Math.min((item.quantity / maxStock) * 100, 100)}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="cell-min">{minStock}</td>
                        <td className="cell-max">{maxStock}</td>
                        <td className="cell-ideal">{idealStock}</td>
                        <td>
                          <span className={`status-badge ${status.class}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="cell-date">
                          {item.lastMovement ? formatDate(item.lastMovement) : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {viewMode === 'movements' && (
        <div className="stock-movements">
          <h3>📈 Historial de Movimientos de Stock</h3>
          <div className="movements-timeline">
            {stockMovements.map(movement => (
              <div key={movement.id} className="movement-item">
                <div className="movement-icon">
                  {movement.type === 'venta' ? '🛒' : 
                   movement.type === 'compra' ? '📦' : '🔄'}
                </div>
                <div className="movement-details">
                  <div className="movement-header">
                    <h4>{movement.productName}</h4>
                    <span className="movement-date">{formatDate(movement.date)}</span>
                  </div>
                  <div className="movement-info">
                    <span className={`movement-type ${movement.type}`}>
                      {movement.type.toUpperCase()}
                    </span>
                    <span className={`movement-quantity ${movement.quantity > 0 ? 'positive' : 'negative'}`}>
                      {movement.quantity > 0 ? '+' : ''}{movement.quantity} unidades
                    </span>
                    <span className="movement-user">
                      Por: {movement.user}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="movement-stats">
            <div className="stat-card">
              <h4>Movimientos por Tipo</h4>
              <div className="type-stats">
                <div className="type-stat">
                  <span className="type-label">Ventas</span>
                  <span className="type-count">12</span>
                </div>
                <div className="type-stat">
                  <span className="type-label">Compras</span>
                  <span className="type-count">8</span>
                </div>
                <div className="type-stat">
                  <span className="type-label">Ajustes</span>
                  <span className="type-count">5</span>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <h4>Tasa de Rotación</h4>
              <div className="turnover-chart">
                <div className="turnover-bar">
                  <div 
                    className="turnover-fill"
                    style={{ width: `${Math.min(metrics.turnoverRate * 10, 100)}%` }}
                  ></div>
                </div>
                <div className="turnover-info">
                  <span>{metrics.turnoverRate ? metrics.turnoverRate.toFixed(2) : 0}</span>
                  <small>rotaciones por mes</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'alerts' && (
        <div className="stock-alerts">
          <div className="alerts-section">
            <h3>⚠️ Alertas de Stock Crítico</h3>
            <div className="critical-alerts">
              {data
                .filter(item => item.quantity === 0)
                .map(item => (
                  <div key={item.id} className="alert-item critical">
                    <div className="alert-icon">🚨</div>
                    <div className="alert-content">
                      <h4>{item.name}</h4>
                      <p>Producto completamente agotado. Necesita reposición inmediata.</p>
                      <div className="alert-details">
                        <span><strong>Categoría:</strong> {item.category}</span>
                        <span><strong>Último stock:</strong> {item.lastStock || 0}</span>
                        <span><strong>Días agotado:</strong> {item.daysOutOfStock || 5}</span>
                      </div>
                    </div>
                    <div className="alert-actions">
                      <button className="btn-alert">Ordenar Ahora</button>
                      <button className="btn-alert-secondary">Posponer</button>
                    </div>
                  </div>
                ))}
              
              {data.filter(item => item.quantity === 0).length === 0 && (
                <div className="no-alerts">
                  <p>✅ No hay productos completamente agotados.</p>
                </div>
              )}
            </div>
          </div>

          <div className="alerts-section">
            <h3>📉 Productos Bajo Stock</h3>
            <div className="warning-alerts">
              {data
                .filter(item => item.quantity > 0 && item.quantity <= alertThreshold)
                .map(item => (
                  <div key={item.id} className="alert-item warning">
                    <div className="alert-icon">⚠️</div>
                    <div className="alert-content">
                      <h4>{item.name}</h4>
                      <p>Stock bajo: {item.quantity} unidades (umbral: {alertThreshold})</p>
                      <div className="alert-details">
                        <span><strong>Stock actual:</strong> {item.quantity} unidades</span>
                        <span><strong>Stock ideal:</strong> {Math.ceil(alertThreshold * 2)} unidades</span>
                        <span><strong>Ventas mensuales:</strong> {item.averageMonthlySales || 10}</span>
                      </div>
                    </div>
                    <div className="alert-actions">
                      <button className="btn-alert">Planificar Pedido</button>
                    </div>
                  </div>
                ))}
              
              {data.filter(item => item.quantity > 0 && item.quantity <= alertThreshold).length === 0 && (
                <div className="no-alerts">
                  <p>✅ No hay productos bajo el umbral de stock.</p>
                </div>
              )}
            </div>
          </div>

          <div className="alerts-section">
            <h3>📋 Sugerencias de Reposición</h3>
            <div className="suggestions-table">
              <div className="table-header">
                <span className="col-product">Producto</span>
                <span className="col-current">Stock Actual</span>
                <span className="col-suggested">Cantidad Sugerida</span>
                <span className="col-cost">Costo Estimado</span>
                <span className="col-urgency">Urgencia</span>
                <span className="col-action">Acción</span>
              </div>
              
              <div className="table-body">
                {generateReplenishmentSuggestions().map(suggestion => (
                  <div key={suggestion.productId} className="suggestion-row">
                    <span className="col-product">{suggestion.productName}</span>
                    <span className="col-current">
                      <span className={`stock-badge ${suggestion.currentStock === 0 ? 'critical' : 'warning'}`}>
                        {suggestion.currentStock} unidades
                      </span>
                    </span>
                    <span className="col-suggested">{suggestion.suggestedOrder} unidades</span>
                    <span className="col-cost">{formatCurrency(suggestion.estimatedCost)}</span>
                    <span className="col-urgency">
                      <span className={`urgency-badge ${suggestion.urgency.toLowerCase()}`}>
                        {suggestion.urgency}
                      </span>
                    </span>
                    <span className="col-action">
                      <button className="btn-suggestion">Generar Orden</button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="report-footer">
        <div className="footer-notes">
          <p><strong>Indicadores:</strong></p>
          <ul>
            <li><span className="status-indicator critical"></span> Crítico: Stock agotado</li>
            <li><span className="status-indicator warning"></span> Advertencia: Stock ≤ {alertThreshold} unidades</li>
            <li><span className="status-indicator good"></span> Óptimo: Stock suficiente</li>
          </ul>
        </div>
        
        <div className="footer-stats">
          <div className="footer-stat">
            <span>Productos monitoreados:</span>
            <strong>{data.length}</strong>
          </div>
          <div className="footer-stat">
            <span>Umbral de alerta:</span>
            <strong>{alertThreshold} unidades</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockReport;