import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../assets/styles/Products/products.CSS';

const ProductStock = ({ productId }) => {
  const [stock, setStock] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    quantity: '',
    type: 'entry',
    reason: '',
    reference: ''
  });

  useEffect(() => {
    fetchStockData();
    fetchMovementHistory();
  }, [productId]);

  const fetchStockData = async () => {
    try {
      const response = await axios.get(`/api/products/${productId}/stock`);
      setStock(response.data);
    } catch (error) {
      console.error('Error fetching stock:', error);
    }
  };

  const fetchMovementHistory = async () => {
    try {
      const response = await axios.get(`/api/products/${productId}/stock/movements`);
      setMovements(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching movements:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/products/${productId}/stock/update`, formData);
      alert('Stock actualizado correctamente');
      setFormData({ quantity: '', type: 'entry', reason: '', reference: '' });
      fetchStockData();
      fetchMovementHistory();
    } catch (error) {
      alert('Error al actualizar stock');
    }
  };

  const calculateStockValue = () => {
    return stock.reduce((total, item) => total + (item.quantity * item.unit_cost), 0);
  };

  return (
    <div className="product-stock-container">
      <div className="stock-header">
        <h2>Gestión de Stock</h2>
        <div className="stock-summary">
          <div className="summary-card">
            <h3>Stock Total</h3>
            <p className="stock-total">{stock.reduce((sum, item) => sum + item.quantity, 0)} unidades</p>
          </div>
          <div className="summary-card">
            <h3>Valor Total</h3>
            <p className="stock-value">${calculateStockValue().toFixed(2)}</p>
          </div>
          <div className="summary-card">
            <h3>Stock Mínimo</h3>
            <p className="stock-min">{stock.find(s => s.min_stock)?.min_stock || 0} unidades</p>
          </div>
        </div>
      </div>

      <div className="stock-management">
        <div className="update-stock-form">
          <h3>Actualizar Stock</h3>
          <form onSubmit={handleStockUpdate}>
            <div className="form-group">
              <label>Cantidad:</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min="1"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Tipo de Movimiento:</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
              >
                <option value="entry">Entrada</option>
                <option value="exit">Salida</option>
                <option value="adjustment">Ajuste</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Motivo:</label>
              <input
                type="text"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Referencia:</label>
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleInputChange}
                placeholder="Factura, orden, etc."
              />
            </div>
            
            <button type="submit" className="btn-primary">
              {formData.type === 'entry' ? 'Agregar Stock' : 
               formData.type === 'exit' ? 'Retirar Stock' : 'Ajustar Stock'}
            </button>
          </form>
        </div>

        <div className="stock-details">
          <h3>Detalle por Ubicación</h3>
          {stock.length > 0 ? (
            <table className="stock-table">
              <thead>
                <tr>
                  <th>Ubicación</th>
                  <th>Cantidad</th>
                  <th>Costo Unitario</th>
                  <th>Valor Total</th>
                  <th>Stock Mínimo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {stock.map((item, index) => (
                  <tr key={index}>
                    <td>{item.location}</td>
                    <td>{item.quantity}</td>
                    <td>${item.unit_cost?.toFixed(2) || '0.00'}</td>
                    <td>${(item.quantity * (item.unit_cost || 0)).toFixed(2)}</td>
                    <td>{item.min_stock || 'N/A'}</td>
                    <td>
                      <span className={`stock-status ${
                        item.quantity <= (item.min_stock || 0) ? 'low' : 
                        item.quantity > (item.min_stock || 0) * 2 ? 'high' : 'normal'
                      }`}>
                        {item.quantity <= (item.min_stock || 0) ? 'Bajo' : 
                         item.quantity > (item.min_stock || 0) * 2 ? 'Alto' : 'Normal'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No hay stock registrado</p>
          )}
        </div>
      </div>

      <div className="movement-history">
        <h3>Historial de Movimientos</h3>
        {loading ? (
          <p>Cargando movimientos...</p>
        ) : (
          <div className="movements-table-container">
            <table className="movements-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Motivo</th>
                  <th>Referencia</th>
                  <th>Usuario</th>
                  <th>Stock Actual</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement, index) => (
                  <tr key={index}>
                    <td>{new Date(movement.date).toLocaleDateString()}</td>
                    <td>
                      <span className={`movement-type ${movement.type}`}>
                        {movement.type === 'entry' ? 'Entrada' : 
                         movement.type === 'exit' ? 'Salida' : 'Ajuste'}
                      </span>
                    </td>
                    <td className={movement.type === 'entry' ? 'positive' : 'negative'}>
                      {movement.type === 'entry' ? '+' : '-'}{movement.quantity}
                    </td>
                    <td>{movement.reason}</td>
                    <td>{movement.reference || 'N/A'}</td>
                    <td>{movement.user || 'Sistema'}</td>
                    <td>{movement.current_stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="stock-alerts">
        <h3>Alertas de Stock</h3>
        {stock.filter(item => item.quantity <= (item.min_stock || 0)).length > 0 ? (
          <div className="alert-list">
            {stock
              .filter(item => item.quantity <= (item.min_stock || 0))
              .map((item, index) => (
                <div key={index} className="alert-item alert-warning">
                  <strong>{item.location}:</strong> Stock bajo ({item.quantity}/{item.min_stock})
                </div>
              ))
            }
          </div>
        ) : (
          <p className="alert-success">Todo el stock está en niveles adecuados</p>
        )}
      </div>
    </div>
  );
};

export default ProductStock;