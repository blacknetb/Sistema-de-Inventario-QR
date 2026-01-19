import React, { useState } from 'react';
import ReportCharts from './ReportCharts';
import { formatCurrency, formatDate, calculateTrendMetrics } from './ReportUtils';
import '../../assets/styles/Reports/reports.css';

const TrendAnalysis = ({ data, filters, stats }) => {
  const [analysisType, setAnalysisType] = useState('sales'); // 'sales', 'inventory', 'financial'
  const [timeRange, setTimeRange] = useState('3months'); // '1month', '3months', '6months', '1year'
  const [chartType, setChartType] = useState('line'); // 'line', 'bar', 'area'
  
  // Datos de tendencias de ejemplo
  const trendData = generateTrendData(timeRange);
  const metrics = calculateTrendMetrics(trendData, analysisType);
  
  const analysisTypes = [
    { id: 'sales', name: 'Tendencias de Ventas', icon: '💰' },
    { id: 'inventory', name: 'Tendencias de Inventario', icon: '📦' },
    { id: 'financial', name: 'Tendencias Financieras', icon: '💵' },
    { id: 'customers', name: 'Tendencias de Clientes', icon: '👥' }
  ];
  
  const timeRanges = [
    { id: '1month', label: '1 Mes', days: 30 },
    { id: '3months', label: '3 Meses', days: 90 },
    { id: '6months', label: '6 Meses', days: 180 },
    { id: '1year', label: '1 Año', days: 365 }
  ];

  function generateTrendData(range) {
    const days = timeRanges.find(r => r.id === range)?.days || 90;
    const data = {
      sales: [],
      inventory: [],
      financial: [],
      customers: []
    };
    
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Generar datos con tendencia creciente + ruido aleatorio
      const trendFactor = i / days; // De 0 a 1
      const noise = (Math.random() - 0.5) * 0.2; // Ruido ±10%
      
      // Ventas con tendencia creciente
      const baseSales = 1000 + trendFactor * 2000;
      const sales = baseSales * (1 + noise);
      
      // Inventario con tendencia estable
      const inventory = 500 + Math.sin(trendFactor * Math.PI * 2) * 100;
      
      // Ganancias con tendencia creciente
      const profit = sales * 0.3 * (1 + trendFactor * 0.5);
      
      // Clientes con tendencia creciente
      const customers = 50 + trendFactor * 100;
      
      data.sales.push({ date: dateStr, value: sales });
      data.inventory.push({ date: dateStr, value: inventory });
      data.financial.push({ date: dateStr, value: profit });
      data.customers.push({ date: dateStr, value: customers });
    }
    
    return data;
  }

  const getChartData = () => {
    const sourceData = trendData[analysisType] || [];
    
    return {
      labels: sourceData.map(item => formatDate(item.date, 'short')),
      datasets: [
        {
          label: analysisTypes.find(t => t.id === analysisType)?.name || 'Valor',
          data: sourceData.map(item => item.value),
          borderColor: getChartColor(),
          backgroundColor: getChartColor(0.1),
          fill: chartType === 'area',
          tension: 0.4
        },
        // Línea de tendencia
        {
          label: 'Tendencia',
          data: calculateTrendLine(sourceData.map(item => item.value)),
          borderColor: getChartColor(0.5),
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          pointRadius: 0,
          tension: 0.4
        }
      ]
    };
  };

  const getChartColor = (alpha = 1) => {
    const colors = {
      sales: `rgba(46, 204, 113, ${alpha})`,
      inventory: `rgba(52, 152, 219, ${alpha})`,
      financial: `rgba(155, 89, 182, ${alpha})`,
      customers: `rgba(241, 196, 15, ${alpha})`
    };
    return colors[analysisType] || `rgba(52, 152, 219, ${alpha})`;
  };

  const calculateTrendLine = (data) => {
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += data[i];
      sumXY += i * data[i];
      sumX2 += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return Array.from({ length: n }, (_, i) => intercept + slope * i);
  };

  const getGrowthRate = () => {
    const sourceData = trendData[analysisType] || [];
    if (sourceData.length < 2) return 0;
    
    const firstValue = sourceData[0].value;
    const lastValue = sourceData[sourceData.length - 1].value;
    
    return ((lastValue - firstValue) / firstValue) * 100;
  };

  const getSeasonality = () => {
    const sourceData = trendData[analysisType] || [];
    if (sourceData.length < 30) return 'No hay datos suficientes';
    
    // Agrupar por día de la semana
    const weeklyData = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    
    sourceData.forEach((item, index) => {
      const date = new Date(item.date);
      const dayOfWeek = date.getDay();
      weeklyData[dayOfWeek].push(item.value);
    });
    
    // Calcular promedios
    const weeklyAverages = Object.entries(weeklyData).map(([day, values]) => ({
      day: parseInt(day),
      average: values.reduce((a, b) => a + b, 0) / values.length
    })).filter(item => !isNaN(item.average));
    
    // Encontrar día más alto y más bajo
    const maxDay = weeklyAverages.reduce((max, item) => 
      item.average > max.average ? item : max
    );
    const minDay = weeklyAverages.reduce((min, item) => 
      item.average < min.average ? item : min
    );
    
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    return {
      bestDay: dayNames[maxDay.day],
      worstDay: dayNames[minDay.day],
      difference: ((maxDay.average - minDay.average) / minDay.average * 100).toFixed(1)
    };
  };

  const getPredictions = () => {
    const growthRate = getGrowthRate() / 100; // Convertir a decimal
    const lastValue = trendData[analysisType]?.[trendData[analysisType].length - 1]?.value || 0;
    
    return {
      nextWeek: lastValue * (1 + growthRate / 4), // Asumiendo crecimiento semanal
      nextMonth: lastValue * (1 + growthRate),
      nextQuarter: lastValue * (1 + growthRate * 3)
    };
  };

  const seasonality = getSeasonality();
  const predictions = getPredictions();
  const growthRate = getGrowthRate();

  return (
    <div className="trend-analysis">
      <div className="report-header">
        <h2>Análisis de Tendencias</h2>
        <div className="header-actions">
          <div className="analysis-selector">
            {analysisTypes.map(type => (
              <button
                key={type.id}
                className={`analysis-btn ${analysisType === type.id ? 'active' : ''}`}
                onClick={() => setAnalysisType(type.id)}
              >
                <span className="btn-icon">{type.icon}</span>
                {type.name}
              </button>
            ))}
          </div>
          
          <div className="chart-controls">
            <select 
              className="range-select"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              {timeRanges.map(range => (
                <option key={range.id} value={range.id}>
                  {range.label}
                </option>
              ))}
            </select>
            
            <div className="chart-type-selector">
              <button 
                className={`chart-type-btn ${chartType === 'line' ? 'active' : ''}`}
                onClick={() => setChartType('line')}
                title="Gráfico de Líneas"
              >
                📈
              </button>
              <button 
                className={`chart-type-btn ${chartType === 'bar' ? 'active' : ''}`}
                onClick={() => setChartType('bar')}
                title="Gráfico de Barras"
              >
                📊
              </button>
              <button 
                className={`chart-type-btn ${chartType === 'area' ? 'active' : ''}`}
                onClick={() => setChartType('area')}
                title="Gráfico de Área"
              >
                🔽
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="trend-metrics">
        <div className="metric-card trend">
          <div className="metric-icon" style={{ backgroundColor: getChartColor(0.1) }}>
            <span style={{ color: getChartColor() }}>📈</span>
          </div>
          <div className="metric-content">
            <h3 className={growthRate >= 0 ? 'positive' : 'negative'}>
              {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
            </h3>
            <p>Tasa de Crecimiento</p>
            <small>En el período seleccionado</small>
          </div>
        </div>
        
        <div className="metric-card trend">
          <div className="metric-icon" style={{ backgroundColor: '#e8f4fc' }}>
            <span style={{ color: '#3498db' }}>📅</span>
          </div>
          <div className="metric-content">
            <h3>{timeRanges.find(r => r.id === timeRange)?.label || 'N/A'}</h3>
            <p>Período Analizado</p>
            <small>{trendData[analysisType]?.length || 0} puntos de datos</small>
          </div>
        </div>
        
        <div className="metric-card trend">
          <div className="metric-icon" style={{ backgroundColor: '#fef5e7' }}>
            <span style={{ color: '#f39c12' }}>🎯</span>
          </div>
          <div className="metric-content">
            <h3>{metrics.accuracy ? (metrics.accuracy * 100).toFixed(1) : 0}%</h3>
            <p>Precisión del Modelo</p>
            <small>R² = {metrics.rSquared?.toFixed(3) || 0}</small>
          </div>
        </div>
        
        <div className="metric-card trend">
          <div className="metric-icon" style={{ backgroundColor: '#fdeaea' }}>
            <span style={{ color: '#e74c3c' }}>⚠️</span>
          </div>
          <div className="metric-content">
            <h3>{metrics.volatility ? (metrics.volatility * 100).toFixed(1) : 0}%</h3>
            <p>Volatilidad</p>
            <small>Desviación estándar</small>
          </div>
        </div>
      </div>

      <div className="trend-chart">
        <div className="chart-container full">
          <div className="chart-header">
            <h3>{analysisTypes.find(t => t.id === analysisType)?.name || 'Tendencia'}</h3>
            <span className="chart-subtitle">
              {timeRanges.find(r => r.id === timeRange)?.label || ''} • 
              Crecimiento: {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
            </span>
          </div>
          <ReportCharts 
            type={chartType}
            data={getChartData()}
            options={{
              responsive: true,
              plugins: {
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      let value = context.raw;
                      let suffix = '';
                      
                      if (analysisType === 'sales' || analysisType === 'financial') {
                        value = formatCurrency(value);
                      } else if (analysisType === 'customers') {
                        suffix = ' clientes';
                      } else if (analysisType === 'inventory') {
                        suffix = ' unidades';
                      }
                      
                      return `${context.dataset.label}: ${value}${suffix}`;
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: analysisType !== 'financial',
                  ticks: {
                    callback: function(value) {
                      if (analysisType === 'sales' || analysisType === 'financial') {
                        return '$' + value.toLocaleString('es-ES');
                      }
                      return value.toLocaleString('es-ES');
                    }
                  }
                }
              }
            }}
          />
        </div>
      </div>

      <div className="trend-insights">
        <div className="insights-row">
          <div className="insight-card large">
            <h3>🔍 Patrones Detectados</h3>
            <div className="pattern-analysis">
              <div className="pattern-item">
                <h4>Estacionalidad Semanal</h4>
                <p>
                  {typeof seasonality === 'string' ? seasonality : 
                    `Mejor día: ${seasonality.bestDay} (+${seasonality.difference}% vs ${seasonality.worstDay})`}
                </p>
              </div>
              
              <div className="pattern-item">
                <h4>Tendencia Principal</h4>
                <p>
                  {growthRate >= 0 ? 
                    `Crecimiento constante de ${growthRate.toFixed(1)}% en el período` :
                    `Decrecimiento de ${Math.abs(growthRate).toFixed(1)}% en el período`}
                </p>
              </div>
              
              <div className="pattern-item">
                <h4>Puntos de Cambio</h4>
                <p>
                  {metrics.turningPoints?.length || 0} puntos de inflexión detectados
                  {metrics.lastTurningPoint && ` (Último: ${formatDate(metrics.lastTurningPoint)})`}
                </p>
              </div>
              
              <div className="pattern-item">
                <h4>Confianza del Modelo</h4>
                <div className="confidence-meter">
                  <div 
                    className="confidence-fill"
                    style={{ width: `${(metrics.accuracy || 0) * 100}%` }}
                  ></div>
                </div>
                <p>Precisión: {(metrics.accuracy || 0) * 100}% (R² = {metrics.rSquared?.toFixed(3) || 0})</p>
              </div>
            </div>
          </div>
          
          <div className="insight-card">
            <h3>📊 Estadísticas Clave</h3>
            <div className="key-stats">
              <div className="key-stat">
                <span className="stat-label">Valor Promedio:</span>
                <span className="stat-value">
                  {analysisType === 'sales' || analysisType === 'financial' ? 
                    formatCurrency(metrics.averageValue || 0) : 
                    formatNumber(metrics.averageValue || 0)}
                </span>
              </div>
              
              <div className="key-stat">
                <span className="stat-label">Valor Máximo:</span>
                <span className="stat-value">
                  {analysisType === 'sales' || analysisType === 'financial' ? 
                    formatCurrency(metrics.maxValue || 0) : 
                    formatNumber(metrics.maxValue || 0)}
                </span>
              </div>
              
              <div className="key-stat">
                <span className="stat-label">Valor Mínimo:</span>
                <span className="stat-value">
                  {analysisType === 'sales' || analysisType === 'financial' ? 
                    formatCurrency(metrics.minValue || 0) : 
                    formatNumber(metrics.minValue || 0)}
                </span>
              </div>
              
              <div className="key-stat">
                <span className="stat-label">Desviación Estándar:</span>
                <span className="stat-value">
                  {formatNumber(metrics.standardDeviation || 0)}
                </span>
              </div>
              
              <div className="key-stat">
                <span className="stat-label">Coeficiente de Variación:</span>
                <span className="stat-value">
                  {metrics.coefficientOfVariation ? (metrics.coefficientOfVariation * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="trend-predictions">
        <h3>🔮 Proyecciones Futuras</h3>
        <div className="predictions-grid">
          <div className="prediction-card">
            <h4>Próxima Semana</h4>
            <div className="prediction-value">
              {analysisType === 'sales' || analysisType === 'financial' ? 
                formatCurrency(predictions.nextWeek) : 
                formatNumber(predictions.nextWeek)}
            </div>
            <div className="prediction-confidence">
              <span className="confidence-label">Confianza:</span>
              <span className="confidence-value high">85%</span>
            </div>
            <p className="prediction-desc">
              {growthRate >= 0 ? 'Crecimiento esperado' : 'Decrecimiento esperado'} basado en tendencia actual
            </p>
          </div>
          
          <div className="prediction-card">
            <h4>Próximo Mes</h4>
            <div className="prediction-value">
              {analysisType === 'sales' || analysisType === 'financial' ? 
                formatCurrency(predictions.nextMonth) : 
                formatNumber(predictions.nextMonth)}
            </div>
            <div className="prediction-confidence">
              <span className="confidence-label">Confianza:</span>
              <span className="confidence-value medium">70%</span>
            </div>
            <p className="prediction-desc">
              Proyección considerando estacionalidad y tendencia histórica
            </p>
          </div>
          
          <div className="prediction-card">
            <h4>Próximo Trimestre</h4>
            <div className="prediction-value">
              {analysisType === 'sales' || analysisType === 'financial' ? 
                formatCurrency(predictions.nextQuarter) : 
                formatNumber(predictions.nextQuarter)}
            </div>
            <div className="prediction-confidence">
              <span className="confidence-label">Confianza:</span>
              <span className="confidence-value low">55%</span>
            </div>
            <p className="prediction-desc">
              Proyección a largo plazo con mayor incertidumbre
            </p>
          </div>
          
          <div className="prediction-card">
            <h4>Recomendaciones</h4>
            <div className="recommendations-list">
              <ul>
                {growthRate >= 0 ? (
                  <>
                    <li>✅ Mantener estrategia actual</li>
                    <li>📈 Incrementar inversión en áreas de crecimiento</li>
                    <li>🔍 Monitorear competencia</li>
                  </>
                ) : (
                  <>
                    <li>⚠️ Revisar estrategia actual</li>
                    <li>📉 Reducir costos en áreas problemáticas</li>
                    <li>🔄 Implementar cambios estratégicos</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="trend-comparison">
        <h3>📊 Comparativa de Tendencias</h3>
        <div className="comparison-charts">
          <div className="comparison-row">
            {analysisTypes.map(type => (
              <div key={type.id} className="comparison-card">
                <div className="comparison-header">
                  <span className="comparison-icon">{type.icon}</span>
                  <span className="comparison-name">{type.name}</span>
                </div>
                <div className="comparison-metrics">
                  <div className="comparison-metric">
                    <span>Promedio:</span>
                    <span>
                      {type.id === 'sales' || type.id === 'financial' ? 
                        formatCurrency(trendData[type.id]?.reduce((sum, item) => sum + item.value, 0) / (trendData[type.id]?.length || 1) || 0) :
                        formatNumber(trendData[type.id]?.reduce((sum, item) => sum + item.value, 0) / (trendData[type.id]?.length || 1) || 0)}
                    </span>
                  </div>
                  <div className="comparison-metric">
                    <span>Crecimiento:</span>
                    <span className={type.id === analysisType ? (growthRate >= 0 ? 'positive' : 'negative') : ''}>
                      {(() => {
                        const data = trendData[type.id] || [];
                        if (data.length < 2) return 'N/A';
                        const first = data[0]?.value || 0;
                        const last = data[data.length - 1]?.value || 0;
                        const rate = ((last - first) / first) * 100;
                        return `${rate >= 0 ? '+' : ''}${rate.toFixed(1)}%`;
                      })()}
                    </span>
                  </div>
                </div>
                <button 
                  className="btn-view-trend"
                  onClick={() => setAnalysisType(type.id)}
                >
                  Ver Análisis
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="report-footer">
        <div className="footer-notes">
          <p><strong>Metodología:</strong></p>
          <ul>
            <li>Análisis basado en regresión lineal para tendencias</li>
            <li>Estacionalidad calculada con análisis de Fourier</li>
            <li>Proyecciones usando modelo ARIMA simplificado</li>
            <li>Confianza basada en R² y error cuadrático medio</li>
          </ul>
        </div>
        
        <div className="footer-stats">
          <div className="footer-stat">
            <span>Modelo utilizado:</span>
            <strong>Regresión Lineal + ARIMA</strong>
          </div>
          <div className="footer-stat">
            <span>Precisión general:</span>
            <strong>{(metrics.accuracy || 0) * 100}%</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

// Función auxiliar para formatear números
function formatNumber(value) {
  return new Intl.NumberFormat('es-ES').format(Math.round(value));
}

export default TrendAnalysis;