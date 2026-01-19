import React, { useState } from 'react';
import ReportCharts from './ReportCharts';
import { formatCurrency, formatDate, calculateFinancialMetrics } from './ReportUtils';
import '../../assets/styles/Reports/reports.css';

const FinancialReport = ({ data, filters, stats }) => {
  const [timePeriod, setTimePeriod] = useState('month');
  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'profit', 'cashflow'
  
  // Datos financieros de ejemplo
  const financialData = generateFinancialData();
  const metrics = calculateFinancialMetrics(financialData, timePeriod);
  
  const timePeriods = [
    { id: 'week', label: 'Semanal' },
    { id: 'month', label: 'Mensual' },
    { id: 'quarter', label: 'Trimestral' },
    { id: 'year', label: 'Anual' }
  ];

  function generateFinancialData() {
    const today = new Date();
    const data = {
      revenue: [],
      expenses: [],
      profit: [],
      cashflow: []
    };
    
    // Generar datos para los últimos 30 días
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Ingresos aleatorios entre 1000 y 5000
      const revenue = Math.random() * 4000 + 1000;
      // Gastos aleatorios entre 500 y 3000
      const expenses = Math.random() * 2500 + 500;
      const profit = revenue - expenses;
      
      data.revenue.push({ date: dateStr, amount: revenue });
      data.expenses.push({ date: dateStr, amount: expenses });
      data.profit.push({ date: dateStr, amount: profit });
      data.cashflow.push({ date: dateStr, amount: profit * 0.8 }); // 80% del profit como cashflow
    }
    
    return data;
  }

  const chartData = {
    revenueVsExpenses: {
      labels: financialData.revenue.map(item => formatDate(item.date, 'short')),
      datasets: [
        {
          label: 'Ingresos',
          data: financialData.revenue.map(item => item.amount),
          borderColor: '#2ecc71',
          backgroundColor: 'rgba(46, 204, 113, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Gastos',
          data: financialData.expenses.map(item => item.amount),
          borderColor: '#e74c3c',
          backgroundColor: 'rgba(231, 76, 60, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    },
    profitMargin: {
      labels: financialData.profit.map(item => formatDate(item.date, 'short')),
      datasets: [
        {
          label: 'Margen de Ganancia',
          data: financialData.profit.map((item, index) => {
            const revenue = financialData.revenue[index].amount;
            return revenue > 0 ? (item.amount / revenue) * 100 : 0;
          }),
          borderColor: '#3498db',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    }
  };

  const expenseCategories = [
    { category: 'Inventario', amount: 12500, percentage: 45 },
    { category: 'Personal', amount: 7500, percentage: 27 },
    { category: 'Alquiler', amount: 3000, percentage: 11 },
    { category: 'Servicios', amount: 1500, percentage: 5 },
    { category: 'Marketing', amount: 2000, percentage: 7 },
    { category: 'Otros', amount: 1500, percentage: 5 }
  ];

  const revenueSources = [
    { source: 'Ventas en Tienda', amount: 18000, percentage: 65 },
    { source: 'Ventas Online', amount: 7000, percentage: 25 },
    { source: 'Servicios', amount: 2000, percentage: 7 },
    { source: 'Otros', amount: 1000, percentage: 3 }
  ];

  return (
    <div className="financial-report">
      <div className="report-header">
        <h2>Reporte Financiero</h2>
        <div className="header-actions">
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'overview' ? 'active' : ''}`}
              onClick={() => setViewMode('overview')}
            >
              📊 Resumen
            </button>
            <button 
              className={`view-btn ${viewMode === 'profit' ? 'active' : ''}`}
              onClick={() => setViewMode('profit')}
            >
              💰 Rentabilidad
            </button>
            <button 
              className={`view-btn ${viewMode === 'cashflow' ? 'active' : ''}`}
              onClick={() => setViewMode('cashflow')}
            >
              💸 Flujo de Caja
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

      <div className="financial-metrics">
        <div className="metric-card financial">
          <div className="metric-icon" style={{ backgroundColor: '#d5f4e6' }}>
            <span style={{ color: '#27ae60' }}>💰</span>
          </div>
          <div className="metric-content">
            <h3>{formatCurrency(metrics.totalRevenue)}</h3>
            <p>Ingresos Totales</p>
            <small>{metrics.revenueGrowth >= 0 ? '+' : ''}{(metrics.revenueGrowth * 100).toFixed(1)}% vs período anterior</small>
          </div>
        </div>
        
        <div className="metric-card financial">
          <div className="metric-icon" style={{ backgroundColor: '#fdeaea' }}>
            <span style={{ color: '#e74c3c' }}>📉</span>
          </div>
          <div className="metric-content">
            <h3>{formatCurrency(metrics.totalExpenses)}</h3>
            <p>Gastos Totales</p>
            <small>{metrics.expenseGrowth >= 0 ? '+' : ''}{(metrics.expenseGrowth * 100).toFixed(1)}% vs período anterior</small>
          </div>
        </div>
        
        <div className="metric-card financial">
          <div className="metric-icon" style={{ backgroundColor: '#e8f4fc' }}>
            <span style={{ color: '#3498db' }}>📈</span>
          </div>
          <div className="metric-content">
            <h3>{formatCurrency(metrics.netProfit)}</h3>
            <p>Ganancia Neta</p>
            <small>Margen: {(metrics.profitMargin * 100).toFixed(1)}%</small>
          </div>
        </div>
        
        <div className="metric-card financial">
          <div className="metric-icon" style={{ backgroundColor: '#fef5e7' }}>
            <span style={{ color: '#f39c12' }}>💸</span>
          </div>
          <div className="metric-content">
            <h3>{formatCurrency(metrics.cashflow)}</h3>
            <p>Flujo de Caja</p>
            <small>Operativo</small>
          </div>
        </div>
      </div>

      <div className="financial-charts">
        <div className="chart-row">
          <div className="chart-container large">
            <div className="chart-header">
              <h3>Ingresos vs Gastos</h3>
              <span className="chart-subtitle">Comparativa diaria</span>
            </div>
            <ReportCharts 
              type="line"
              data={chartData.revenueVsExpenses}
              options={{
                responsive: true,
                interaction: {
                  mode: 'index',
                  intersect: false
                },
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
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
              <h3>Margen de Ganancia</h3>
              <span className="chart-subtitle">Porcentaje diario</span>
            </div>
            <ReportCharts 
              type="line"
              data={chartData.profitMargin}
              options={{
                responsive: true,
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `Margen: ${context.raw.toFixed(1)}%`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return value + '%';
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className="financial-details">
        <div className="details-row">
          <div className="details-section">
            <h3>📊 Distribución de Gastos</h3>
            <div className="expense-breakdown">
              {expenseCategories.map(category => (
                <div key={category.category} className="expense-item">
                  <div className="expense-header">
                    <span className="expense-category">{category.category}</span>
                    <span className="expense-percentage">{category.percentage}%</span>
                  </div>
                  <div className="expense-bar">
                    <div 
                      className="expense-fill"
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                  <div className="expense-amount">
                    {formatCurrency(category.amount)}
                  </div>
                </div>
              ))}
              
              <div className="expense-total">
                <span>Total Gastos:</span>
                <strong>{formatCurrency(expenseCategories.reduce((sum, cat) => sum + cat.amount, 0))}</strong>
              </div>
            </div>
          </div>
          
          <div className="details-section">
            <h3>💰 Fuentes de Ingresos</h3>
            <div className="revenue-breakdown">
              {revenueSources.map(source => (
                <div key={source.source} className="revenue-item">
                  <div className="revenue-header">
                    <span className="revenue-source">{source.source}</span>
                    <span className="revenue-percentage">{source.percentage}%</span>
                  </div>
                  <div className="revenue-bar">
                    <div 
                      className="revenue-fill"
                      style={{ width: `${source.percentage}%` }}
                    ></div>
                  </div>
                  <div className="revenue-amount">
                    {formatCurrency(source.amount)}
                  </div>
                </div>
              ))}
              
              <div className="revenue-total">
                <span>Total Ingresos:</span>
                <strong>{formatCurrency(revenueSources.reduce((sum, src) => sum + src.amount, 0))}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="financial-ratios">
        <h3>📐 Indicadores Financieros Clave</h3>
        <div className="ratios-grid">
          <div className="ratio-card">
            <h4>Margen Bruto</h4>
            <div className="ratio-value">
              <span className="value">{(metrics.grossMargin * 100).toFixed(1)}%</span>
              <span className={`trend ${metrics.grossMargin >= 0.3 ? 'positive' : 'negative'}`}>
                {metrics.grossMargin >= 0.3 ? '✅ Saludable' : '⚠️ Mejorable'}
              </span>
            </div>
            <p className="ratio-desc">(Ingresos - Costo de Ventas) / Ingresos</p>
          </div>
          
          <div className="ratio-card">
            <h4>Margen Neto</h4>
            <div className="ratio-value">
              <span className="value">{(metrics.profitMargin * 100).toFixed(1)}%</span>
              <span className={`trend ${metrics.profitMargin >= 0.1 ? 'positive' : 'negative'}`}>
                {metrics.profitMargin >= 0.1 ? '✅ Bueno' : '⚠️ Bajo'}
              </span>
            </div>
            <p className="ratio-desc">Ganancia Neta / Ingresos Totales</p>
          </div>
          
          <div className="ratio-card">
            <h4>ROI</h4>
            <div className="ratio-value">
              <span className="value">{(metrics.roi * 100).toFixed(1)}%</span>
              <span className={`trend ${metrics.roi >= 0.15 ? 'positive' : 'negative'}`}>
                {metrics.roi >= 0.15 ? '✅ Excelente' : '⚠️ Regular'}
              </span>
            </div>
            <p className="ratio-desc">Retorno sobre la Inversión</p>
          </div>
          
          <div className="ratio-card">
            <h4>Razón Corriente</h4>
            <div className="ratio-value">
              <span className="value">{metrics.currentRatio.toFixed(2)}</span>
              <span className={`trend ${metrics.currentRatio >= 1.5 ? 'positive' : 'negative'}`}>
                {metrics.currentRatio >= 1.5 ? '✅ Seguro' : '⚠️ Riesgo'}
              </span>
            </div>
            <p className="ratio-desc">Activo Corriente / Pasivo Corriente</p>
          </div>
          
          <div className="ratio-card">
            <h4>Rotación de Inventario</h4>
            <div className="ratio-value">
              <span className="value">{metrics.inventoryTurnover.toFixed(2)}</span>
              <span className={`trend ${metrics.inventoryTurnover >= 4 ? 'positive' : 'negative'}`}>
                {metrics.inventoryTurnover >= 4 ? '✅ Eficiente' : '⚠️ Lento'}
              </span>
            </div>
            <p className="ratio-desc">Ventas / Inventario Promedio</p>
          </div>
          
          <div className="ratio-card">
            <h4>Días en Cuentas por Cobrar</h4>
            <div className="ratio-value">
              <span className="value">{metrics.daysReceivable.toFixed(0)} días</span>
              <span className={`trend ${metrics.daysReceivable <= 30 ? 'positive' : 'negative'}`}>
                {metrics.daysReceivable <= 30 ? '✅ Bueno' : '⚠️ Largo'}
              </span>
            </div>
            <p className="ratio-desc">Período promedio de cobro</p>
          </div>
        </div>
      </div>

      <div className="financial-projections">
        <h3>🔮 Proyecciones Financieras</h3>
        <div className="projections-grid">
          <div className="projection-card">
            <h4>Próximo Mes</h4>
            <div className="projection-details">
              <div className="projection-item">
                <span>Ingresos Proyectados:</span>
                <strong>{formatCurrency(metrics.totalRevenue * 1.1)}</strong>
              </div>
              <div className="projection-item">
                <span>Ganancias Proyectadas:</span>
                <strong>{formatCurrency(metrics.netProfit * 1.08)}</strong>
              </div>
              <div className="projection-item">
                <span>Crecimiento Esperado:</span>
                <strong className="positive">+10%</strong>
              </div>
            </div>
          </div>
          
          <div className="projection-card">
            <h4>Próximo Trimestre</h4>
            <div className="projection-details">
              <div className="projection-item">
                <span>Ingresos Proyectados:</span>
                <strong>{formatCurrency(metrics.totalRevenue * 3.3)}</strong>
              </div>
              <div className="projection-item">
                <span>Ganancias Proyectadas:</span>
                <strong>{formatCurrency(metrics.netProfit * 3.2)}</strong>
              </div>
              <div className="projection-item">
                <span>Crecimiento Esperado:</span>
                <strong className="positive">+12%</strong>
              </div>
            </div>
          </div>
          
          <div className="projection-card">
            <h4>Recomendaciones</h4>
            <div className="recommendations">
              <ul>
                <li>✅ Reducir gastos de inventario en 5%</li>
                <li>✅ Incrementar margen bruto al 35%</li>
                <li>⚠️ Mejorar rotación de inventario</li>
                <li>📈 Invertir en marketing digital</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="report-footer">
        <div className="footer-notes">
          <p><strong>Notas:</strong></p>
          <ul>
            <li>Todos los montos están en dólares (USD)</li>
            <li>Los ratios financieros se calculan con datos del período seleccionado</li>
            <li>Las proyecciones están basadas en tendencias históricas</li>
          </ul>
        </div>
        
        <div className="footer-stats">
          <div className="footer-stat">
            <span>Período analizado:</span>
            <strong>{timePeriods.find(p => p.id === timePeriod)?.label}</strong>
          </div>
          <div className="footer-stat">
            <span>Estado financiero:</span>
            <strong className={metrics.netProfit > 0 ? 'positive' : 'negative'}>
              {metrics.netProfit > 0 ? '✅ Rentable' : '⚠️ Pérdidas'}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialReport;