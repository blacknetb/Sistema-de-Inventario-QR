import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/styles/pages/pages.css';

const AddItemPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Electrónica',
    description: '',
    quantity: 1,
    price: 0,
    cost: 0,
    supplier: '',
    location: '',
    minStock: 5,
    maxStock: 100,
    status: 'disponible'
  });

  const [errors, setErrors] = useState({});

  const categories = [
    'Electrónica',
    'Accesorios',
    'Oficina',
    'Almacenamiento',
    'Redes',
    'Muebles',
    'Herramientas',
    'Software',
    'Consumibles'
  ];

  const suppliers = [
    'Proveedor A',
    'Proveedor B',
    'Proveedor C',
    'Proveedor D',
    'Directo de Fábrica'
  ];

  const locations = [
    'Almacén Principal',
    'Sucursal Norte',
    'Sucursal Sur',
    'Bodega Externa',
    'Exhibición'
  ];

  const generateSKU = () => {
    const categoryCode = formData.category.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${categoryCode}-${randomNum}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'quantity' || name === 'price' || name === 'cost' || name === 'minStock' || name === 'maxStock' 
        ? parseFloat(value) || 0 
        : value
    });

    // Limpiar error si existe
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

    if (formData.quantity < 0) {
      newErrors.quantity = 'La cantidad no puede ser negativa';
    }

    if (formData.price < 0) {
      newErrors.price = 'El precio no puede ser negativo';
    }

    if (formData.cost < 0) {
      newErrors.cost = 'El costo no puede ser negativo';
    }

    if (formData.maxStock <= formData.minStock) {
      newErrors.maxStock = 'El stock máximo debe ser mayor al mínimo';
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Aquí iría la lógica para guardar el producto
    console.log('Producto a guardar:', formData);
    
    // Mostrar mensaje de éxito
    alert('Producto agregado exitosamente');
    
    // Redirigir al inventario
    navigate('/inventory');
  };

  const handleGenerateSKU = () => {
    setFormData({
      ...formData,
      sku: generateSKU()
    });
  };

  const handleCancel = () => {
    if (window.confirm('¿Estás seguro de cancelar? Los cambios no guardados se perderán.')) {
      navigate('/inventory');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Agregar Producto</h1>
          <p className="page-subtitle">Complete los datos del nuevo producto</p>
        </div>
        <div>
          <button className="btn btn-secondary" onClick={handleCancel}>
            Cancelar
          </button>
        </div>
      </div>

      <div className="page-card form-container">
        <form onSubmit={handleSubmit}>
          <div className="alert alert-info">
            <span>⚠️</span>
            <span>Los campos marcados con * son obligatorios</span>
          </div>

          <h3 className="section-title">Información Básica</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nombre del Producto *</label>
              <input
                type="text"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej: Laptop Dell XPS 13"
              />
              {errors.name && <div className="alert alert-danger" style={{ marginTop: '5px', padding: '8px' }}>{errors.name}</div>}
            </div>
            
            <div className="form-group">
              <label className="form-label">SKU (Código)</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  name="sku"
                  className="form-control"
                  value={formData.sku}
                  onChange={handleChange}
                  placeholder="Ej: ELP-1234"
                  readOnly
                />
                <button type="button" className="btn btn-secondary" onClick={handleGenerateSKU}>
                  Generar
                </button>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Categoría *</label>
              <select
                name="category"
                className="form-control"
                value={formData.category}
                onChange={handleChange}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Proveedor</label>
              <select
                name="supplier"
                className="form-control"
                value={formData.supplier}
                onChange={handleChange}
              >
                <option value="">Seleccionar proveedor</option>
                {suppliers.map(sup => (
                  <option key={sup} value={sup}>{sup}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea
              name="description"
              className="form-control"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Descripción detallada del producto..."
            />
          </div>

          <h3 className="section-title">Stock y Precios</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Cantidad *</label>
              <input
                type="number"
                name="quantity"
                className="form-control"
                value={formData.quantity}
                onChange={handleChange}
                min="0"
              />
              {errors.quantity && <div className="alert alert-danger" style={{ marginTop: '5px', padding: '8px' }}>{errors.quantity}</div>}
            </div>
            
            <div className="form-group">
              <label className="form-label">Precio de Venta ($) *</label>
              <input
                type="number"
                name="price"
                className="form-control"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
              {errors.price && <div className="alert alert-danger" style={{ marginTop: '5px', padding: '8px' }}>{errors.price}</div>}
            </div>
            
            <div className="form-group">
              <label className="form-label">Costo Unitario ($)</label>
              <input
                type="number"
                name="cost"
                className="form-control"
                value={formData.cost}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
              {errors.cost && <div className="alert alert-danger" style={{ marginTop: '5px', padding: '8px' }}>{errors.cost}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Stock Mínimo</label>
              <input
                type="number"
                name="minStock"
                className="form-control"
                value={formData.minStock}
                onChange={handleChange}
                min="0"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Stock Máximo</label>
              <input
                type="number"
                name="maxStock"
                className="form-control"
                value={formData.maxStock}
                onChange={handleChange}
                min="0"
              />
              {errors.maxStock && <div className="alert alert-danger" style={{ marginTop: '5px', padding: '8px' }}>{errors.maxStock}</div>}
            </div>
          </div>

          <h3 className="section-title">Ubicación y Estado</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Ubicación</label>
              <select
                name="location"
                className="form-control"
                value={formData.location}
                onChange={handleChange}
              >
                <option value="">Seleccionar ubicación</option>
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Estado</label>
              <select
                name="status"
                className="form-control"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="disponible">Disponible</option>
                <option value="bajo-stock">Bajo Stock</option>
                <option value="agotado">Agotado</option>
                <option value="reservado">Reservado</option>
                <option value="descontinuado">Descontinuado</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
              <button type="submit" className="btn btn-primary">
                <span className="btn-icon">✓</span> Guardar Producto
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancelar
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setFormData({
                name: '',
                sku: '',
                category: 'Electrónica',
                description: '',
                quantity: 1,
                price: 0,
                cost: 0,
                supplier: '',
                location: '',
                minStock: 5,
                maxStock: 100,
                status: 'disponible'
              })}>
                Limpiar Formulario
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemPage;