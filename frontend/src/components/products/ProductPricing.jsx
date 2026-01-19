import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../assets/styles/Products/products.CSS';

const ProductPricing = ({ productId }) => {
  const [pricing, setPricing] = useState({
    base_price: 0,
    discount_price: null,
    cost_price: 0,
    tax_rate: 0,
    margin: 0,
    profit: 0
  });
  const [priceHistory, setPriceHistory] = useState([]);
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchPricingData();
  }, [productId]);

  const fetchPricingData = async () => {
    try {
      const [pricingRes, historyRes, competitorsRes] = await Promise.all([
        axios.get(`/api/products/${productId}/pricing`),
        axios.get(`/api/products/${productId}/pricing/history`),
        axios.get(`/api/products/${productId}/pricing/competitors`)
      ]);
      
      setPricing(pricingRes.data);
      setPriceHistory(historyRes.data);
      setCompetitors(competitorsRes.data);
      setFormData(pricingRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching pricing data:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: parseFloat(e.target.value) || 0
    });
  };

  const handleSavePricing = async () => {
    try {
      await axios.put(`/api/products/${productId}/pricing`, formData);
      setPricing(formData);
      setEditing(false);
      fetchPricingData(); // Refrescar datos
      alert('Precios actualizados correctamente');
    } catch (error) {
      alert('Error al actualizar precios');
    }
  };

  const calculateWithTax = (price) => {
    return price * (1 + (pricing.tax_rate / 100));
  };

  const calculateMargin = (sellingPrice, cost) => {
    return ((sellingPrice - cost) / sellingPrice) * 100;
  };

  const calculateProfit = (sellingPrice, cost) => {
    return sellingPrice - cost;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getPricingStrategy = () => {
    const avgCompetitor = competitors.reduce((sum, c) => sum + c.price, 0) / competitors.length;
    const ourPrice = pricing.discount_price || pricing.base_price;
    
    if (ourPrice < avgCompetitor * 0.9) return 'competitive';
    if (ourPrice > avgCompetitor * 1.1) return 'premium';
    return 'market';
  };

  return (
    <div className="product-pricing-container">
      <div className="pricing-header">
        <h2>Gestión de Precios</h2>
        <div className="pricing-strategy">
          <span className={`strategy-badge ${getPricingStrategy()}`}>
            {getPricingStrategy() === 'competitive' ? 'Competitivo' :
             getPricingStrategy() === 'premium' ? 'Premium' : 'Mercado'}
          </span>
        </div>
      </div>

      <div className="pricing-overview">
        <div className="pricing-card main">
          <h3>Precio de Venta</h3>
          <div className="price-display">
            {pricing.discount_price ? (
              <>
                <span className="original-price">{formatCurrency(pricing.base_price)}</span>
                <span className="current-price">{formatCurrency(pricing.discount_price)}</span>
                <span className="discount-badge">
                  -{Math.round((1 - pricing.discount_price / pricing.base_price) * 100)}%
                </span>
              </>
            ) : (
              <span className="current-price">{formatCurrency(pricing.base_price)}</span>
            )}
          </div>
          <div className="price-with-tax">
            <small>Con impuestos: {formatCurrency(calculateWithTax(pricing.discount_price || pricing.base_price))}</small>
          </div>
        </div>

        <div className="pricing-card">
          <h3>Costo</h3>
          <div className="price-value">{formatCurrency(pricing.cost_price)}</div>
        </div>

        <div className="pricing-card">
          <h3>Margen</h3>
          <div className={`margin-value ${
            pricing.margin > 30 ? 'high' : 
            pricing.margin > 15 ? 'good' : 'low'
          }`}>
            {pricing.margin.toFixed(1)}%
          </div>
        </div>

        <div className="pricing-card">
          <h3>Utilidad</h3>
          <div className="profit-value">{formatCurrency(pricing.profit)}</div>
        </div>
      </div>

      {editing ? (
        <div className="pricing-edit-form">
          <h3>Editar Precios</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Precio Base:</label>
              <input
                type="number"
                name="base_price"
                value={formData.base_price}
                onChange={handleInputChange}
                step="0.01"
                min="0"
              />
            </div>
            
            <div className="form-group">
              <label>Precio con Descuento:</label>
              <input
                type="number"
                name="discount_price"
                value={formData.discount_price || ''}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                placeholder="Opcional"
              />
            </div>
            
            <div className="form-group">
              <label>Precio de Costo:</label>
              <input
                type="number"
                name="cost_price"
                value={formData.cost_price}
                onChange={handleInputChange}
                step="0.01"
                min="0"
              />
            </div>
            
            <div className="form-group">
              <label>Tasa de Impuesto (%):</label>
              <input
                type="number"
                name="tax_rate"
                value={formData.tax_rate}
                onChange={handleInputChange}
                step="0.1"
                min="0"
                max="100"
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button className="btn-secondary" onClick={() => setEditing(false)}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={handleSavePricing}>
              Guardar Cambios
            </button>
          </div>
        </div>
      ) : (
        <div className="pricing-actions">
          <button className="btn-primary" onClick={() => setEditing(true)}>
            Editar Precios
          </button>
          <button className="btn-secondary">
            Crear Promoción
          </button>
          <button className="btn-secondary">
            Exportar Reporte
          </button>
        </div>
      )}

      <div className="pricing-sections">
        <div className="pricing-section">
          <h3>Historial de Precios</h3>
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Precio Anterior</th>
                  <th>Precio Nuevo</th>
                  <th>Cambio</th>
                  <th>Motivo</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody>
                {priceHistory.map((record, index) => (
                  <tr key={index}>
                    <td>{new Date(record.date).toLocaleDateString()}</td>
                    <td>{formatCurrency(record.old_price)}</td>
                    <td>{formatCurrency(record.new_price)}</td>
                    <td className={`change-${record.change_type}`}>
                      {record.change_type === 'increase' ? '+' : '-'}
                      {Math.abs(((record.new_price - record.old_price) / record.old_price) * 100).toFixed(1)}%
                    </td>
                    <td>{record.reason}</td>
                    <td>{record.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pricing-section">
          <h3>Comparación con Competidores</h3>
          <div className="competitors-chart">
            <div className="chart-bars">
              {competitors.map((competitor, index) => (
                <div key={index} className="competitor-bar">
                  <div className="competitor-info">
                    <span className="competitor-name">{competitor.name}</span>
                    <span className="competitor-price">{formatCurrency(competitor.price)}</span>
                  </div>
                  <div className="bar-container">
                    <div 
                      className="price-bar"
                      style={{
                        width: `${(competitor.price / Math.max(...competitors.map(c => c.price), pricing.base_price)) * 100}%`
                      }}
                    ></div>
                  </div>
                  <div className="price-difference">
                    {((competitor.price - (pricing.discount_price || pricing.base_price)) > 0 ? '+' : '')}
                    {formatCurrency(competitor.price - (pricing.discount_price || pricing.base_price))}
                  </div>
                </div>
              ))}
            </div>
            <div className="our-price-marker">
              <div className="marker-line"></div>
              <div className="marker-label">
                Nuestro precio: {formatCurrency(pricing.discount_price || pricing.base_price)}
              </div>
            </div>
          </div>
        </div>

        <div className="pricing-section">
          <h3>Análisis de Rentabilidad</h3>
          <div className="profitability-grid">
            <div className="profitability-card">
              <h4>Punto de Equilibrio</h4>
              <div className="profitability-value">
                {Math.ceil(pricing.fixed_costs / (pricing.discount_price || pricing.base_price - pricing.variable_cost))}
              </div>
              <small>unidades para cubrir costos fijos</small>
            </div>
            
            <div className="profitability-card">
              <h4>ROI</h4>
              <div className="profitability-value">
                {((pricing.profit / pricing.investment) * 100).toFixed(1)}%
              </div>
              <small>Retorno sobre inversión</small>
            </div>
            
            <div className="profitability-card">
              <h4>Margen Objetivo</h4>
              <div className="profitability-value">
                {pricing.target_margin || 25}%
              </div>
              <small>Margen deseado</small>
            </div>
            
            <div className="profitability-card">
              <h4>Precio Sugerido</h4>
              <div className="profitability-value">
                {formatCurrency(pricing.cost_price * 1.3)}
              </div>
              <small>Basado en costo + 30%</small>
            </div>
          </div>
        </div>
      </div>

      <div className="pricing-recommendations">
        <h3>Recomendaciones de Precio</h3>
        <div className="recommendations-list">
          <div className="recommendation">
            <span className="rec-icon">📈</span>
            <div>
              <strong>Aumentar precio 5%</strong>
              <p>Tu precio está 15% por debajo del promedio del mercado</p>
            </div>
          </div>
          
          <div className="recommendation">
            <span className="rec-icon">💰</span>
            <div>
              <strong>Crear bundle</strong>
              <p>Productos complementarios podrían venderse juntos con 20% descuento</p>
            </div>
          </div>
          
          <div className="recommendation">
            <span className="rec-icon">🎯</span>
            <div>
              <strong>Precio psicológico</strong>
              <p>Cambiar ${pricing.base_price.toFixed(2)} por ${(pricing.base_price - 0.01).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPricing;