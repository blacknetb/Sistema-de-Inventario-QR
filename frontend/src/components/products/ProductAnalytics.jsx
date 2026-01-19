import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import '../../assets/styles/Products/products.CSS';

const ProductAnalytics = ({ productId }) => {
  const [analytics, setAnalytics] = useState({
    overview: {},
    salesData: [],
    trafficData: [],
    conversionData: [],
    inventoryData: [],
    revenueData: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedChart, setSelectedChart] = useState('sales');

  const chartRefs = {
    sales: useRef(null),
    traffic: useRef(null),
    conversion: useRef(null)
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [productId, timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      const response = await axios.get(`/api/products/${productId}/analytics`, {
        params: { range: timeRange }
      });
      setAnalytics(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  const exportChart = (chartName) => {
    // Lógica para exportar gráfico
    console.log(`Exporting ${chartName} chart`);
  };

  const calculateGrowth = (current, previous) => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const renderChart = () => {
    switch (selectedChart) {
      case 'sales':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.salesData} ref={chartRefs.sales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="units" stroke="#8884d8" name="Unidades" />
              <Line type="monotone" dataKey="revenue" stroke="#82ca9d" name="Ingresos" />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'traffic':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.trafficData} ref={chartRefs.traffic}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="source" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="visits" fill="#8884d8" name="Visitas" />
              <Bar dataKey="conversions" fill="#82ca9d" name="Conversiones" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'conversion':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart ref={chartRefs.conversion}>
              <Pie
                data={analytics.conversionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.conversionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <p>Cargando análisis...</p>
      </div>
    );
  }

  return (
    <div className="product-analytics-container">
      <div className="analytics-header">
        <div>
          <h2>Análisis del Producto</h2>
          <p className="analytics-subtitle">
            Período: {timeRange === '7d' ? 'Últimos 7 días' : 
                     timeRange === '30d' ? 'Últimos 30 días' : 
                     timeRange === '90d' ? 'Últimos 90 días' : 'Último año'}
          </p>
        </div>
        
        <div className="time-range-selector">
          <button 
            className={timeRange === '7d' ? 'active' : ''}
            onClick={() => setTimeRange('7d')}
          >
            7D
          </button>
          <button 
            className={timeRange === '30d' ? 'active' : ''}
            onClick={() => setTimeRange('30d')}
          >
            30D
          </button>
          <button 
            className={timeRange === '90d' ? 'active' : ''}
            onClick={() => setTimeRange('90d')}
          >
            90D
          </button>
          <button 
            className={timeRange === '1y' ? 'active' : ''}
            onClick={() => setTimeRange('1y')}
          >
            1A
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <h3>Ventas Totales</h3>
          <div className="kpi-value">{formatNumber(analytics.overview.total_sales)}</div>
          <div className={`kpi-change ${
            calculateGrowth(analytics.overview.current_sales, analytics.overview.previous_sales) >= 0 ? 'positive' : 'negative'
          }`}>
            {calculateGrowth(analytics.overview.current_sales, analytics.overview.previous_sales).toFixed(1)}%
          </div>
          <small>vs. período anterior</small>
        </div>
        
        <div className="kpi-card">
          <h3>Ingresos</h3>
          <div className="kpi-value">${formatNumber(analytics.overview.revenue)}</div>
          <div className={`kpi-change ${
            calculateGrowth(analytics.overview.current_revenue, analytics.overview.previous_revenue) >= 0 ? 'positive' : 'negative'
          }`}>
            {calculateGrowth(analytics.overview.current_revenue, analytics.overview.previous_revenue).toFixed(1)}%
          </div>
          <small>vs. período anterior</small>
        </div>
        
        <div className="kpi-card">
          <h3>Tasa de Conversión</h3>
          <div className="kpi-value">{analytics.overview.conversion_rate?.toFixed(1)}%</div>
          <div className={`kpi-change ${
            calculateGrowth(analytics.overview.current_conversion, analytics.overview.previous_conversion) >= 0 ? 'positive' : 'negative'
          }`}>
            {calculateGrowth(analytics.overview.current_conversion, analytics.overview.previous_conversion).toFixed(1)}%
          </div>
          <small>vs. período anterior</small>
        </div>
        
        <div className="kpi-card">
          <h3>Inventario Rotación</h3>
          <div className="kpi-value">{analytics.overview.inventory_turnover?.toFixed(1)}</div>
          <div className="kpi-subtext">veces por período</div>
        </div>
      </div>

      <div className="charts-section">
        <div className="charts-header">
          <div className="chart-selector">
            <button 
              className={selectedChart === 'sales' ? 'active' : ''}
              onClick={() => setSelectedChart('sales')}
            >
              Ventas
            </button>
            <button 
              className={selectedChart === 'traffic' ? 'active' : ''}
              onClick={() => setSelectedChart('traffic')}
            >
              Tráfico
            </button>
            <button 
              className={selectedChart === 'conversion' ? 'active' : ''}
              onClick={() => setSelectedChart('conversion')}
            >
              Conversión
            </button>
          </div>
          
          <button 
            className="export-btn"
            onClick={() => exportChart(selectedChart)}
          >
            Exportar Gráfico
          </button>
        </div>
        
        <div className="chart-container">
          {renderChart()}
        </div>
      </div>

      <div className="analytics-details">
        <div className="detail-section">
          <h3>Desempeño por Canal</h3>
          <div className="channel-performance">
            {analytics.trafficData?.map((channel, index) => (
              <div key={index} className="channel-row">
                <div className="channel-info">
                  <span className="channel-name">{channel.source}</span>
                  <span className="channel-visits">{channel.visits} visitas</span>
                </div>
                <div className="channel-stats">
                  <div className="conversion-rate">
                    {(channel.conversions / channel.visits * 100).toFixed(1)}% conversión
                  </div>
                  <div className="revenue">${channel.revenue?.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="detail-section">
          <h3>Patrones de Venta</h3>
          <div className="sales-patterns">
            <div className="pattern-card">
              <h4>Mejor Día</h4>
              <div className="pattern-value">{analytics.overview.best_day}</div>
              <small>{analytics.overview.best_day_sales} unidades</small>
            </div>
            
            <div className="pattern-card">
              <h4>Peak Horario</h4>
              <div className="pattern-value">{analytics.overview.peak_hour}</div>
              <small>Mayor actividad</small>
            </div>
            
            <div className="pattern-card">
              <h4>Carrito Promedio</h4>
              <div className="pattern-value">${analytics.overview.avg_cart?.toFixed(2)}</div>
              <small>Por transacción</small>
            </div>
            
            <div className="pattern-card">
              <h4>Tiempo en Página</h4>
              <div className="pattern-value">{analytics.overview.avg_time_on_page?.toFixed(0)}s</div>
              <small>Promedio</small>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h3>Análisis Predictivo</h3>
          <div className="predictive-analysis">
            <div className="prediction-card">
              <h4>Demanda Esperada</h4>
              <div className="prediction-value">{analytics.overview.predicted_demand}</div>
              <small>próximos 30 días</small>
              <div className="prediction-confidence">
                Confianza: {analytics.overview.prediction_confidence?.toFixed(0)}%
              </div>
            </div>
            
            <div className="prediction-card">
              <h4>Stock Óptimo</h4>
              <div className="prediction-value">{analytics.overview.optimal_stock}</div>
              <small>unidades recomendadas</small>
              <div className="stock-recommendation">
                {analytics.overview.current_stock < analytics.overview.optimal_stock ? 
                  '⚠️ Necesita reposición' : '✅ Stock adecuado'}
              </div>
            </div>
            
            <div className="prediction-card">
              <h4>Precio Sugerido</h4>
              <div className="prediction-value">${analytics.overview.suggested_price?.toFixed(2)}</div>
              <small>para maximizar ganancias</small>
              <div className="price-impact">
                Impacto estimado: +{analytics.overview.price_impact?.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="analytics-actions">
        <button className="btn-primary">
          Generar Reporte Completo
        </button>
        <button className="btn-secondary">
          Configurar Alertas
        </button>
        <button className="btn-secondary">
          Comparar con Competencia
        </button>
      </div>
    </div>
  );
};

export default ProductAnalytics;