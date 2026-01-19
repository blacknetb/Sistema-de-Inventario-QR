import React, { useState } from 'react';
import '../../assets/styles/Products/products.CSS';

const ProductVariants = ({ variants = [], onVariantsChange, readonly = false }) => {
  const [editingVariant, setEditingVariant] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    sku: '',
    price: '',
    cost: '',
    stock: '',
    weight: '',
    attributes: {}
  });

  const attributeTypes = [
    { id: 'color', name: 'Color', type: 'color', options: ['Rojo', 'Azul', 'Verde', 'Negro', 'Blanco', 'Gris'] },
    { id: 'size', name: 'Tamaño', type: 'text', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
    { id: 'material', name: 'Material', type: 'text', options: ['Algodón', 'Poliéster', 'Cuero', 'Metal', 'Plástico'] },
    { id: 'storage', name: 'Almacenamiento', type: 'text', options: ['64GB', '128GB', '256GB', '512GB', '1TB'] },
    { id: 'ram', name: 'RAM', type: 'text', options: ['4GB', '8GB', '16GB', '32GB', '64GB'] }
  ];

  const handleAddVariant = () => {
    if (!formData.name.trim() || !formData.sku.trim()) return;

    const newVariant = {
      id: editingVariant?.id || `VAR-${String(variants.length + 1).padStart(3, '0')}`,
      name: formData.name,
      sku: formData.sku,
      price: parseFloat(formData.price) || 0,
      cost: parseFloat(formData.cost) || 0,
      stock: parseInt(formData.stock) || 0,
      weight: parseFloat(formData.weight) || 0,
      attributes: formData.attributes
    };

    if (editingVariant) {
      onVariantsChange(variants.map(v => v.id === editingVariant.id ? newVariant : v));
      setEditingVariant(null);
    } else {
      onVariantsChange([...variants, newVariant]);
    }

    setFormData({
      id: '',
      name: '',
      sku: '',
      price: '',
      cost: '',
      stock: '',
      weight: '',
      attributes: {}
    });
    setShowForm(false);
  };

  const handleEditVariant = (variant) => {
    setEditingVariant(variant);
    setFormData({
      id: variant.id,
      name: variant.name,
      sku: variant.sku,
      price: variant.price,
      cost: variant.cost || '',
      stock: variant.stock,
      weight: variant.weight || '',
      attributes: variant.attributes || {}
    });
    setShowForm(true);
  };

  const handleDeleteVariant = (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta variante?')) {
      onVariantsChange(variants.filter(v => v.id !== id));
    }
  };

  const handleAttributeChange = (attributeId, value) => {
    setFormData(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [attributeId]: value
      }
    }));
  };

  const generateSKU = () => {
    const baseSKU = 'VAR';
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    setFormData(prev => ({ ...prev, sku: `${baseSKU}-${random}` }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStockStatus = (stock) => {
    if (stock <= 0) return { label: 'Agotado', color: '#e74c3c' };
    if (stock <= 10) return { label: 'Bajo Stock', color: '#f39c12' };
    return { label: 'Disponible', color: '#2ecc71' };
  };

  const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  const totalValue = variants.reduce((sum, v) => sum + (v.price * (v.stock || 0)), 0);

  return (
    <div className="product-variants">
      <div className="variants-header">
        <h3>Variantes del Producto</h3>
        {!readonly && (
          <button className="btn-primary" onClick={() => { setShowForm(true); setEditingVariant(null); }}>
            <span className="btn-icon">+</span>
            Agregar Variante
          </button>
        )}
      </div>

      {variants.length > 0 && (
        <div className="variants-summary">
          <div className="summary-card">
            <div className="summary-icon">📊</div>
            <div className="summary-content">
              <div className="summary-value">{variants.length}</div>
              <div className="summary-label">Variantes</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">📦</div>
            <div className="summary-content">
              <div className="summary-value">{totalStock}</div>
              <div className="summary-label">Stock total</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">💰</div>
            <div className="summary-content">
              <div className="summary-value">{formatCurrency(totalValue)}</div>
              <div className="summary-label">Valor total</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">⚖️</div>
            <div className="summary-content">
              <div className="summary-value">
                {variants.reduce((sum, v) => sum + (v.weight || 0), 0).toFixed(2)} kg
              </div>
              <div className="summary-label">Peso total</div>
            </div>
          </div>
        </div>
      )}

      {showForm && !readonly && (
        <div className="variant-form-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingVariant ? 'Editar Variante' : 'Nueva Variante'}</h3>
              <button className="close-btn" onClick={() => { setShowForm(false); setEditingVariant(null); }}>×</button>
            </div>
            
            <div className="form-content">
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre de la variante *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ej: 16GB RAM/512GB SSD"
                  />
                </div>
                
                <div className="form-group">
                  <label>SKU *</label>
                  <div className="input-with-action">
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      placeholder="Ej: VAR-001"
                    />
                    <button type="button" className="action-btn" onClick={generateSKU}>
                      Generar
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Precio ($)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                
                <div className="form-group">
                  <label>Costo ($)</label>
                  <input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({...formData, cost: e.target.value})}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Stock</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    placeholder="0"
                    min="0"
                  />
                </div>
                
                <div className="form-group">
                  <label>Peso (kg)</label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: e.target.value})}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
              
              <div className="form-section">
                <h4>Atributos de la Variante</h4>
                <div className="attributes-grid">
                  {attributeTypes.map(attr => (
                    <div key={attr.id} className="attribute-group">
                      <label>{attr.name}</label>
                      <div className="attribute-options">
                        {attr.options.map(option => (
                          <button
                            key={option}
                            type="button"
                            className={`attribute-option ${formData.attributes[attr.id] === option ? 'selected' : ''}`}
                            onClick={() => handleAttributeChange(attr.id, option)}
                          >
                            {attr.type === 'color' ? (
                              <span className="color-dot" style={{ backgroundColor: option.toLowerCase() }}></span>
                            ) : null}
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => { setShowForm(false); setEditingVariant(null); }}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleAddVariant}>
                {editingVariant ? 'Actualizar' : 'Agregar'} Variante
              </button>
            </div>
          </div>
        </div>
      )}

      {variants.length === 0 ? (
        <div className="no-variants">
          <div className="no-variants-icon">🔄</div>
          <h4>No hay variantes definidas</h4>
          <p>Agrega variantes para este producto (tamaños, colores, especificaciones, etc.)</p>
          {!readonly && (
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              Agregar Primera Variante
            </button>
          )}
        </div>
      ) : (
        <div className="variants-table">
          <div className="table-responsive">
            <table className="variants-table-content">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Nombre</th>
                  <th>Atributos</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Peso</th>
                  {!readonly && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {variants.map(variant => {
                  const stockStatus = getStockStatus(variant.stock);
                  return (
                    <tr key={variant.id}>
                      <td>
                        <div className="variant-sku">
                          <strong>{variant.sku}</strong>
                        </div>
                      </td>
                      <td>
                        <div className="variant-name">{variant.name}</div>
                      </td>
                      <td>
                        <div className="variant-attributes">
                          {Object.entries(variant.attributes || {}).map(([key, value]) => (
                            <span key={key} className="attribute-tag">
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="variant-price">
                          <span className="price-value">{formatCurrency(variant.price)}</span>
                          {variant.cost > 0 && (
                            <span className="cost-value">
                              Costo: {formatCurrency(variant.cost)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="variant-stock">
                          <span className="stock-value">{variant.stock}</span>
                          <span 
                            className="stock-status-badge"
                            style={{ backgroundColor: stockStatus.color + '20', color: stockStatus.color }}
                          >
                            {stockStatus.label}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="variant-weight">
                          {variant.weight ? `${variant.weight} kg` : '-'}
                        </div>
                      </td>
                      {!readonly && (
                        <td>
                          <div className="variant-actions">
                            <button className="action-btn edit-btn" onClick={() => handleEditVariant(variant)}>
                              ✏️
                            </button>
                            <button className="action-btn delete-btn" onClick={() => handleDeleteVariant(variant.id)}>
                              🗑️
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductVariants;