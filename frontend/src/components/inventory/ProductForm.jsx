import React, { useState, useEffect } from 'react';
import '../../assets/styles/inventory/Inventory.css';

const ProductForm = ({ isOpen, onClose, onSubmit, product, mode }) => {
  const initialFormState = {
    name: '',
    category: 'Electrónica',
    sku: '',
    description: '',
    quantity: 1,
    price: 0,
    cost: 0,
    supplier: '',
    status: 'in-stock',
    lowStockThreshold: 5,
    image: 'https://via.placeholder.com/300x200/3498db/FFFFFF?text=Producto'
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (mode === 'edit' && product) {
      setFormData(product);
    } else {
      setFormData(initialFormState);
    }
    setErrors({});
  }, [mode, product]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    let processedValue = value;
    if (type === 'number') {
      processedValue = value === '' ? '' : parseFloat(value);
    }
    
    setFormData({
      ...formData,
      [name]: processedValue
    });

    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del producto es requerido';
    }
    
    if (!formData.sku.trim()) {
      newErrors.sku = 'El SKU es requerido';
    }
    
    if (formData.quantity < 0) {
      newErrors.quantity = 'La cantidad no puede ser negativa';
    }
    
    if (formData.price < 0) {
      newErrors.price = 'El precio no puede ser negativo';
    }
    
    if (formData.cost < 0) {
      newErrors.cost = 'El costo no puede ser negativo';
    }
    
    if (formData.cost > formData.price && formData.price > 0) {
      newErrors.cost = 'El costo no puede ser mayor al precio';
    }
    
    if (!formData.supplier.trim()) {
      newErrors.supplier = 'El proveedor es requerido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    onSubmit(formData);
  };

  const generateSKU = () => {
    const prefix = formData.category.substring(0, 3).toUpperCase();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const sku = `${prefix}-${random}`;
    
    setFormData({
      ...formData,
      sku
    });
  };

  const handleClose = () => {
    setFormData(initialFormState);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="product-form-overlay">
      <div className="product-form-container">
        <div className="form-header">
          <h2>{mode === 'add' ? 'Agregar Nuevo Producto' : 'Editar Producto'}</h2>
          <button className="form-close" onClick={handleClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Información Básica</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">
                  Nombre del Producto *
                  {errors.name && <span className="error-message">{errors.name}</span>}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ej: Laptop Dell XPS 13"
                  className={errors.name ? 'error' : ''}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="sku">
                  SKU (Código) *
                  {errors.sku && <span className="error-message">{errors.sku}</span>}
                </label>
                <div className="sku-input-group">
                  <input
                    type="text"
                    id="sku"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    placeholder="Ej: LAP-DEL-XPS13"
                    className={errors.sku ? 'error' : ''}
                  />
                  <button type="button" className="generate-sku-btn" onClick={generateSKU}>
                    Generar
                  </button>
                </div>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Categoría</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="Electrónica">Electrónica</option>
                  <option value="Accesorios">Accesorios</option>
                  <option value="Oficina">Oficina</option>
                  <option value="Almacenamiento">Almacenamiento</option>
                  <option value="Redes">Redes</option>
                  <option value="Mobiliario">Mobiliario</option>
                  <option value="Herramientas">Herramientas</option>
                  <option value="Consumibles">Consumibles</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="status">Estado</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="in-stock">Disponible</option>
                  <option value="low-stock">Bajo Stock</option>
                  <option value="out-of-stock">Agotado</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Descripción</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Descripción detallada del producto..."
                rows="3"
              />
            </div>
          </div>
          
          <div className="form-section">
            <h3>Información de Stock y Precio</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="quantity">
                  Cantidad *
                  {errors.quantity && <span className="error-message">{errors.quantity}</span>}
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  className={errors.quantity ? 'error' : ''}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="lowStockThreshold">Límite de Stock Bajo</label>
                <input
                  type="number"
                  id="lowStockThreshold"
                  name="lowStockThreshold"
                  value={formData.lowStockThreshold}
                  onChange={handleChange}
                  min="1"
                  step="1"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">
                  Precio de Venta ($) *
                  {errors.price && <span className="error-message">{errors.price}</span>}
                </label>
                <div className="price-input">
                  <span className="currency">$</span>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className={errors.price ? 'error' : ''}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="cost">
                  Costo ($) *
                  {errors.cost && <span className="error-message">{errors.cost}</span>}
                </label>
                <div className="price-input">
                  <span className="currency">$</span>
                  <input
                    type="number"
                    id="cost"
                    name="cost"
                    value={formData.cost}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className={errors.cost ? 'error' : ''}
                  />
                </div>
              </div>
            </div>
            
            {formData.price > 0 && formData.cost > 0 && (
              <div className="profit-calculator">
                <div className="profit-item">
                  <span>Ganancia por unidad:</span>
                  <span className="profit-value">
                    ${(formData.price - formData.cost).toFixed(2)}
                  </span>
                </div>
                <div className="profit-item">
                  <span>Margen de ganancia:</span>
                  <span className="profit-value">
                    {((formData.price - formData.cost) / formData.cost * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="profit-item">
                  <span>Ganancia total:</span>
                  <span className="profit-value">
                    ${((formData.price - formData.cost) * formData.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <div className="form-section">
            <h3>Información Adicional</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="supplier">
                  Proveedor *
                  {errors.supplier && <span className="error-message">{errors.supplier}</span>}
                </label>
                <input
                  type="text"
                  id="supplier"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  placeholder="Ej: Dell Technologies"
                  className={errors.supplier ? 'error' : ''}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="image">URL de la Imagen</label>
                <input
                  type="text"
                  id="image"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>
            </div>
          </div>
          
          <div className="form-footer">
            <button type="button" className="btn-cancel" onClick={handleClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-submit">
              {mode === 'add' ? 'Agregar Producto' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;