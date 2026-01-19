import React, { useState } from 'react';
import '../../assets/styles/Dashboard/Dashboard.css';

const AddItemModal = ({ isOpen, onClose, onAddItem }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Electrónica',
    quantity: 1,
    price: 0,
    status: 'Disponible'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'quantity' || name === 'price' ? parseFloat(value) : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Por favor ingresa un nombre para el producto');
      return;
    }
    
    onAddItem(formData);
    setFormData({
      name: '',
      category: 'Electrónica',
      quantity: 1,
      price: 0,
      status: 'Disponible'
    });
    onClose();
  };

  const handleClose = () => {
    setFormData({
      name: '',
      category: 'Electrónica',
      quantity: 1,
      price: 0,
      status: 'Disponible'
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Agregar Nuevo Producto</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nombre del Producto *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Laptop Dell XPS 13"
              required
            />
          </div>
          
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
              <option value="Muebles">Muebles</option>
              <option value="Herramientas">Herramientas</option>
            </select>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="quantity">Cantidad</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="0"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="price">Precio Unitario ($)</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="status">Estado</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="Disponible">Disponible</option>
              <option value="Bajo Stock">Bajo Stock</option>
              <option value="Agotado">Agotado</option>
            </select>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={handleClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-submit">
              Agregar Producto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;