import React, { useState } from 'react';
import ReportCharts from './ReportCharts';
import { formatCurrency, formatDate, calculateSalesMetrics } from './ReportUtils';
import '../../assets/styles/Reports/reports.css';

const SalesReport = ({ data, filters, stats }) => {
  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'daily', 'products'
  const [timePeriod, setTimePeriod] = useState('month');

  // Datos de ventas de ejemplo si no hay datos reales
  const salesData = data.length > 0 ? data : generateSampleSalesData();
  const metrics = calculateSalesMetrics(salesData, timePeriod);
  
  const timePeriods = [
    { id: 'week', label: 'Última Semana' },
    { id: 'month', label: 'Último Mes' },
    { id: 'quarter', label: 'Último Trimestre' },
    { id: 'year', label: 'Último Año' }
  ];

  const getTopProducts = (limit = 5) => {
    const productSales = {};
    
    salesData.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.productName,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.price * item.quantity;
      });
    });
    
    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  };

  const chartData = {
    dailySales: {
      labels: metrics.dailySales?.map(day => day.date) || [],
      datasets: [
        {
          label: 'Ventas Diarias ($)',
          data: metrics.dailySales?.map(day => day.total) || [],
          borderColor: '#3498db',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    },
    categorySales: {
      labels: metrics.categorySales?.map(cat => cat.category) || [],
      datasets: [
        {
          label: 'Ventas por Categoría ($)',
          data: metrics.categorySales?.map(cat => cat.total) || [],
          backgroundColor: [
            '#3498db', '#2ecc71', '#e74c3c', '#f39c12', 
            '#9b59b6', '#1abc9c', '#34495e', '#e67e22'
          ]
        }
      ]
    }
  };

  function generateSampleSalesData() {
    const sampleData = [];
    const products = [
      { id: 1, name: 'Laptop Dell XPS 13', category: 'Electrónica', price: 1299.99 },
      { id: 2, name: 'Mouse Inalámbrico', category: 'Accesorios', price: 29.99 },
      { id: 3, name: 'Monitor 24" Samsung', category: 'Electrónica', price: 199.99 },
      { id: 4, name: 'Teclado Mecánico', category: 'Accesorios', price: 89.99 },
      { id: 5, name: 'Impresora HP LaserJet', category: 'Oficina', price: 349.99 }
    ];
    
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      const numItems = Math.floor(Math.random() * 3) + 1;
      const items = [];
      let total = 0;
      
      for (let j = 0; j < numItems; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const itemTotal = product.price * quantity;
        
        items.push({
          productId: product.id,
          productName: product.name,
          category: product.category,
          quantity: quantity,
          price: product.price,
          total: itemTotal
        });
        
        total += itemTotal;
      }
      
      sampleData.push({
        id: `SALE-${1000 + i}`,
        date: date.toISOString().split('T')[0],
        time: `${Math.floor(Math.random() * 12) + 1}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')} ${Math.random() > 0.5 ? 'PM' : 'AM'}`,
        customerId: `CUST-${Math.floor(Math.random() * 100) + 1}`,
        customerName: ['Juan Pérez', 'María García', 'Carlos López', 'Ana Martínez'][Math.floor(Math.random() * 4)],
        items: items,
        total: total,
        paymentMethod: ['Efectivo', 'Tarjeta', 'Transferencia'][Math.floor(Math.random() * 3)],
        status: 'Completada'
      });
    }
    
    return sampleData;
  }

  return (
    <div className="sales-report">
      <div className="report-header">
        <h2>Reporte de Ventas</h2>
        <div className="header-actions">
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'overview' ? 'active' : ''}`}
              onClick={() => setViewMode('overview')}
            >
              📊 Resumen
            </button>
            <button 
              className={`view-btn ${viewMode === 'daily' ? 'active' : ''}`}
              onClick={() => setViewMode('daily')}
            >
              📅 Diario
            </button>
            <button 
              className={`view-btn ${viewMode === 'products' ? 'active' : ''}`}
              onClick={() => setViewMode('products')}
            >
              🛍️ Productos
            </button>
          </div>
          
          <div className="time-period-selector">
            <span>Período:</span>
            <select 
              className="period-select"
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
            >
              {timePeriods.map(period => (
                <option key={period.id} value={period.id}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="sales-metrics">
        <div className="metric-card sales">
          <div className="metric-icon" style={{ backgroundColor: '#e8f4fc' }}>
            <span style={{ color: '#3498db' }}>💰</span>
          </div>
          <div className="metric-content">
            <h3>{formatCurrency(metrics.totalRevenue)}</h3>
            <p>Ingresos Totales</p>
            <small>{metrics.totalSales} ventas</small>
          </div>
        </div>
        
        <div className="metric-card sales">
          <div className="metric-icon" style={{ backgroundColor: '#d5f4e6' }}>
            <span style={{ color: '#27ae60' }}>📈</span>
          </div>
          <div className="metric-content">
            <h3>{formatCurrency(metrics.averageSale)}</h3>
            <p>Ticket Promedio</p>
            <small>{metrics.totalItems} productos vendidos</small>
          </div>
        </div>
        
        <div className="metric-card sales">
          <div className="metric-icon" style={{ backgroundColor: '#fef5e7' }}>
            <span style={{ color: '#f39c12' }}>👥</span>
          </div>
          <div className="metric-content">
            <h3>{metrics.uniqueCustomers}</h3>
            <p>Clientes Únicos</p>
            <small>{metrics.repeatCustomers} clientes recurrentes</small>
          </div>
        </div>
        
        <div className="metric-card sales">
          <div className="metric-icon" style={{ backgroundColor: '#fdeaea' }}>
            <span style={{ color: '#e74c3c' }}>📊</span>
          </div>
          <div className="metric-content">
            <h3>{metrics.conversionRate ? (metrics.conversionRate * 100).toFixed(1) : 0}%</h3>
            <p>Tasa de Conversión</p>
            <small>{metrics.totalVisitors || 0} visitantes</small>
          </div>
        </div>
      </div>

      <div className="sales-charts">
        <div className="chart-row">
          <div className="chart-container large">
            <div className="chart-header">
              <h3>Tendencia de Ventas</h3>
              <span className="chart-subtitle">Período: {timePeriods.find(p => p.id === timePeriod)?.label}</span>
            </div>
            <ReportCharts 
              type="line"
              data={chartData.dailySales}
              options={{
                responsive: true,
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `Ventas: ${formatCurrency(context.raw)}`;
                      }
                    }
                  }
                },
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
              <h3>Ventas por Categoría</h3>
              <span className="chart-subtitle">Distribución porcentual</span>
            </div>
            <ReportCharts 
              type="doughnut"
              data={chartData.categorySales}
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
        </div>
      </div>

      <div className="sales-details">
        <div className="details-section">
          <h3>🏆 Productos Más Vendidos</h3>
          <div className="top-products">
            {getTopProducts().map((product, index) => (
              <div key={index} className="top-product">
                <div className="product-rank">
                  <span className="rank-number">{index + 1}</span>
                </div>
                <div className="product-info">
                  <h4>{product.name}</h4>
                  <div className="product-stats">
                    <span className="stat">
                      <strong>{product.quantity}</strong> unidades
                    </span>
                    <span className="stat">
                      <strong>{formatCurrency(product.revenue)}</strong> ingresos
                    </span>
                  </div>
                </div>
                <div className="product-revenue">
                  <span className="revenue-label">Ingresos:</span>
                  <span className="revenue-value">{formatCurrency(product.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="details-section">
          <h3>📋 Últimas Ventas</h3>
          <div className="recent-sales">
            <div className="sales-table-header">
              <span className="col-id">ID Venta</span>
              <span className="col-date">Fecha</span>
              <span className="col-customer">Cliente</span>
              <span className="col-items">Productos</span>
              <span className="col-total">Total</span>
              <span className="col-status">Estado</span>
            </div>
            
            <div className="sales-table-body">
              {salesData.slice(0, 10).map(sale => (
                <div key={sale.id} className="sale-row">
                  <span className="col-id">{sale.id}</span>
                  <span className="col-date">
                    {formatDate(sale.date)}
                    <small>{sale.time}</small>
                  </span>
                  <span className="col-customer">
                    <strong>{sale.customerName}</strong>
                    <small>{sale.customerId}</small>
                  </span>
                  <span className="col-items">
                    {sale.items.length} productos
                    <small>{sale.items.map(i => i.productName.substring(0, 15)).join(', ')}...</small>
                  </span>
                  <span className="col-total">
                    <strong>{formatCurrency(sale.total)}</strong>
                  </span>
                  <span className="col-status">
                    <span className={`status-badge ${sale.status === 'Completada' ? 'completed' : 'pending'}`}>
                      {sale.status}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="sales-insights">
        <h3>💡 Insights de Ventas</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <h4>📅 Mejor Día de Ventas</h4>
            <p>
              {metrics.bestDay ? 
                `${formatDate(metrics.bestDay.date)} con ${formatCurrency(metrics.bestDay.total)} en ventas` : 
                'No hay datos suficientes'}
            </p>
          </div>
          
          <div className="insight-card">
            <h4>🕒 Hora Pico</h4>
            <p>
              {metrics.peakHour ? 
                `Entre las ${metrics.peakHour}:00 y ${parseInt(metrics.peakHour) + 1}:00 horas` : 
                'No hay datos suficientes'}
            </p>
          </div>
          
          <div className="insight-card">
            <h4>💳 Método de Pago Más Usado</h4>
            <p>
              {metrics.topPaymentMethod ? 
                `${metrics.topPaymentMethod} (${metrics.paymentMethodStats?.[metrics.topPaymentMethod] || 0} ventas)` : 
                'No hay datos suficientes'}
            </p>
          </div>
          
          <div className="insight-card">
            <h4>🎯 Producto Estrella</h4>
            <p>
              {getTopProducts(1)[0]?.name || 'No hay datos suficientes'}
            </p>
          </div>
        </div>
      </div>

      <div className="report-footer">
        <div className="footer-notes">
          <p><strong>Definiciones:</strong></p>
          <ul>
            <li><strong>Ticket Promedio:</strong> Ingreso total ÷ Número de ventas</li>
            <li><strong>Tasa de Conversión:</strong> Ventas ÷ Visitantes × 100</li>
            <li><strong>Cliente Recurrente:</strong> Cliente con más de 1 compra en el período</li>
          </ul>
        </div>
        
        <div className="footer-stats">
          <div className="footer-stat">
            <span>Período analizado:</span>
            <strong>{timePeriods.find(p => p.id === timePeriod)?.label}</strong>
          </div>
          <div className="footer-stat">
            <span>Ventas analizadas:</span>
            <strong>{salesData.length}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesReport;