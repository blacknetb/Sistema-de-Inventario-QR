import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../assets/styles/pages/pages.css';

const EditItemPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Electrónica',
    description: '',
    quantity: 0,
    price: 0,
    cost: 0,
    supplier: '',
    location: '',
    minStock: 5,
    maxStock: 100,
    status: 'disponible',
    createdAt: '',
    lastUpdated: ''
  });

  const [errors, setErrors] = useState({});
  const [history, setHistory] = useState([]);

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

  useEffect(() => {
    // Simular carga de datos del producto
    const mockProduct = {
      id: parseInt(id),
      name: 'Laptop Dell XPS 13',
      sku: 'ELP-4587',
      category: 'Electrónica',
      description: 'Laptop ultradelgada con procesador Intel i7, 16GB RAM, 512GB SSD',
      quantity: 15,
      price: 1299.99,
      cost: 950.00,
      supplier: 'Proveedor A',
      location: 'Almacén Principal',
      minStock: 5,
      maxStock: 50,
      status: 'disponible',
      createdAt: '2024-01-15',
      lastUpdated: '2024-03-10'
    };

    const mockHistory = [
      { id: 1, date: '2024-03-10 14:30', action: 'Actualización de stock', user: 'admin', details: 'Cantidad: 10 → 15' },
      { id: 2, date: '2024-02-28 09:15', action: 'Cambio de precio', user: 'admin', details: 'Precio: $1199.99 → $1299.99' },
      { id: 3, date: '2024-01-20 11:45', action: 'Transferencia', user: 'juan.perez', details: 'Ubicación: Sucursal Norte → Almacén Principal' },
      { id: 4, date: '2024-01-15 08:00', action: 'Producto creado', user: 'admin', details: 'Producto agregado al sistema' },
    ];

    setTimeout(() => {
      setFormData(mockProduct);
      setHistory(mockHistory);
      setLoading(false);
    }, 1000);
  }, [id]);

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

    // Aquí iría la lógica para actualizar el producto
    console.log('Producto actualizado:', formData);
    
    // Mostrar mensaje de éxito
    alert('Producto actualizado exitosamente');
    
    // Redirigir al inventario
    navigate('/inventory');
  };

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) {
      // Aquí iría la lógica para eliminar el producto
      alert('Producto eliminado exitosamente');
      navigate('/inventory');
    }
  };

  const handleCancel = () => {
    navigate('/inventory');
  };

  const handleAddStock = () => {
    const amount = prompt('Ingrese la cantidad a agregar:');
    if (amount && !isNaN(amount) && parseInt(amount) > 0) {
      setFormData({
        ...formData,
        quantity: formData.quantity + parseInt(amount)
      });
      alert(`${amount} unidades agregadas al stock`);
    }
  };

  const handleRemoveStock = () => {
    const amount = prompt('Ingrese la cantidad a retirar:');
    if (amount && !isNaN(amount) && parseInt(amount) > 0) {
      if (parseInt(amount) > formData.quantity) {
        alert('No hay suficiente stock disponible');
        return;
      }
      setFormData({
        ...formData,
        quantity: formData.quantity - parseInt(amount)
      });
      alert(`${amount} unidades retiradas del stock`);
    }
  };

  if (loading) {
    return (
      <div className="page-container loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando información del producto...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Editar Producto</h1>
          <p className="page-subtitle">ID: #{id.toString().padStart(4, '0')} | SKU: {formData.sku}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-danger" onClick={handleDelete}>
            Eliminar
          </button>
          <button className="btn btn-secondary" onClick={handleCancel}>
            Cancelar
          </button>
        </div>
      </div>

      <div className="row">
        <div className="col-2">
          <div className="page-card">
            <form onSubmit={handleSubmit}>
              <h3 className="section-title">Información del Producto</h3>
              
              <div className="form-group">
                <label className="form-label">Nombre del Producto *</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  value={formData.name}
                  onChange={handleChange}
                />
                {errors.name && <div className="alert alert-danger" style={{ marginTop: '5px', padding: '8px' }}>{errors.name}</div>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">SKU</label>
                  <input
                    type="text"
                    name="sku"
                    className="form-control"
                    value={formData.sku}
                    onChange={handleChange}
                    readOnly
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Categoría</label>
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
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea
                  name="description"
                  className="form-control"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                />
              </div>

              <h3 className="section-title">Stock y Precios</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Cantidad Actual</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="number"
                      name="quantity"
                      className="form-control"
                      value={formData.quantity}
                      onChange={handleChange}
                      min="0"
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <button type="button" className="btn btn-success" style={{ padding: '5px 10px' }} onClick={handleAddStock}>
                        +
                      </button>
                      <button type="button" className="btn btn-warning" style={{ padding: '5px 10px' }} onClick={handleRemoveStock}>
                        -
                      </button>
                    </div>
                  </div>
                  {errors.quantity && <div className="alert alert-danger" style={{ marginTop: '5px', padding: '8px' }}>{errors.quantity}</div>}
                </div>
                
                <div className="form-group">
                  <label className="form-label">Precio de Venta ($)</label>
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

              <div className="form-group">
                <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                  <button type="submit" className="btn btn-primary">
                    <span className="btn-icon">✓</span> Guardar Cambios
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="col">
          <div className="page-card">
            <h3 className="section-title">Historial de Cambios</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Acción</th>
                    <th>Usuario</th>
                    <th>Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(record => (
                    <tr key={record.id}>
                      <td>{record.date}</td>
                      <td><span className="badge badge-info">{record.action}</span></td>
                      <td>{record.user}</td>
                      <td>{record.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="page-card">
            <h3 className="section-title">Información Adicional</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <h4>Estadísticas</h4>
                <div style={{ marginTop: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span>Valor Total:</span>
                    <strong>${(formData.quantity * formData.price).toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span>Margen de Ganancia:</span>
                    <strong>{formData.cost > 0 ? (((formData.price - formData.cost) / formData.cost * 100).toFixed(1) + '%') : 'N/A'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span>Estado Stock:</span>
                    {formData.quantity === 0 ? (
                      <span className="badge badge-danger">Agotado</span>
                    ) : formData.quantity <= formData.minStock ? (
                      <span className="badge badge-warning">Bajo Stock</span>
                    ) : (
                      <span className="badge badge-success">Normal</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h4>Información del Sistema</h4>
                <div style={{ marginTop: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span>Creado:</span>
                    <span>{formData.createdAt}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span>Última Actualización:</span>
                    <span>{formData.lastUpdated}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span>Proveedor:</span>
                    <span>{formData.supplier || 'No asignado'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span>Ubicación:</span>
                    <span>{formData.location || 'No asignada'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditItemPage;