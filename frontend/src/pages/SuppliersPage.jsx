import React, { useState, useEffect } from 'react';
import '../assets/styles/pages/pages.css';

const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    rating: 5,
    productsSupplied: []
  });

  useEffect(() => {
    // Datos de ejemplo
    const mockSuppliers = [
      { 
        id: 1, 
        name: 'TecnoImport S.A.', 
        contactPerson: 'Juan Rodríguez', 
        email: 'contacto@tecnoimport.com', 
        phone: '+1 234 567 8900', 
        address: 'Av. Tecnológica 123, Ciudad', 
        website: 'www.tecnoimport.com',
        rating: 4.5,
        productsSupplied: ['Laptops', 'Monitores', 'Tablets'],
        productCount: 25,
        totalOrders: 48
      },
      { 
        id: 2, 
        name: 'CompuParts Inc.', 
        contactPerson: 'María González', 
        email: 'ventas@compuparts.com', 
        phone: '+1 987 654 3210', 
        address: 'Calle Componentes 456, Zona Industrial', 
        website: 'www.compuparts.com',
        rating: 4.2,
        productsSupplied: ['Componentes', 'Accesorios', 'Periféricos'],
        productCount: 42,
        totalOrders: 72
      },
      { 
        id: 3, 
        name: 'OfficeTech Solutions', 
        contactPerson: 'Carlos Martínez', 
        email: 'info@officetech.com', 
        phone: '+1 555 123 4567', 
        address: 'Plaza Oficina 789, Centro', 
        website: 'www.officetech.com',
        rating: 4.8,
        productsSupplied: ['Muebles', 'Suministros', 'Equipos'],
        productCount: 18,
        totalOrders: 35
      },
      { 
        id: 4, 
        name: 'RedNet Corporación', 
        contactPerson: 'Ana López', 
        email: 'soporte@rednet.com', 
        phone: '+1 333 444 5555', 
        address: 'Boulevard Red 101, Parque Tecnológico', 
        website: 'www.rednet.com',
        rating: 4.0,
        productsSupplied: ['Equipos de Red', 'Conectividad', 'Servidores'],
        productCount: 15,
        totalOrders: 29
      },
    ];

    setTimeout(() => {
      setSuppliers(mockSuppliers);
      setLoading(false);
    }, 1000);
  }, []);

  const handleAddSupplier = () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('El nombre y email son requeridos');
      return;
    }

    const newSupplier = {
      id: suppliers.length > 0 ? Math.max(...suppliers.map(s => s.id)) + 1 : 1,
      ...formData,
      productCount: 0,
      totalOrders: 0
    };

    if (editingSupplier) {
      setSuppliers(suppliers.map(sup => 
        sup.id === editingSupplier.id ? { ...newSupplier, id: editingSupplier.id } : sup
      ));
      setEditingSupplier(null);
    } else {
      setSuppliers([...suppliers, newSupplier]);
    }

    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      rating: 5,
      productsSupplied: []
    });
    setShowAddModal(false);
  };

  const handleEditSupplier = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      website: supplier.website,
      rating: supplier.rating,
      productsSupplied: [...supplier.productsSupplied]
    });
    setShowAddModal(true);
  };

  const handleDeleteSupplier = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este proveedor?')) {
      setSuppliers(suppliers.filter(sup => sup.id !== id));
    }
  };

  const handleCancel = () => {
    setShowAddModal(false);
    setEditingSupplier(null);
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      rating: 5,
      productsSupplied: []
    });
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ color: i <= rating ? '#f39c12' : '#ddd', fontSize: '1.2rem' }}>
          ★
        </span>
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="page-container loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando proveedores...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Proveedores</h1>
          <p className="page-subtitle">Gestión de proveedores del inventario</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <span className="btn-icon">+</span> Nuevo Proveedor
        </button>
      </div>

      <div className="page-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Proveedor</th>
                <th>Contacto</th>
                <th>Productos Suministrados</th>
                <th>Calificación</th>
                <th>Estadísticas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(supplier => (
                <tr key={supplier.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div className="supplier-logo">
                        {supplier.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong>{supplier.name}</strong>
                        <br />
                        <small style={{ color: '#95a5a6' }}>{supplier.website}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>{supplier.contactPerson}</div>
                    <div style={{ color: '#3498db' }}>{supplier.email}</div>
                    <div style={{ color: '#7f8c8d' }}>{supplier.phone}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {supplier.productsSupplied.map((product, index) => (
                        <span key={index} className="badge badge-info" style={{ fontSize: '0.8rem' }}>
                          {product}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div>{renderStars(supplier.rating)}</div>
                      <span style={{ fontWeight: 'bold' }}>{supplier.rating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#3498db' }}>
                          {supplier.productCount}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>Productos</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#27ae60' }}>
                          {supplier.totalOrders}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>Órdenes</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                        onClick={() => handleEditSupplier(supplier)}
                      >
                        Editar
                      </button>
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                        onClick={() => handleDeleteSupplier(supplier.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para agregar/editar proveedor */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>{editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
              <button className="modal-close" onClick={handleCancel}>×</button>
            </div>
            
            <div style={{ padding: '25px' }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nombre del Proveedor *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ej: TecnoImport S.A."
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Persona de Contacto</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                    placeholder="Ej: Juan Rodríguez"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="contacto@empresa.com"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Dirección</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Dirección completa"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Sitio Web</label>
                  <input
                    type="url"
                    className="form-control"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    placeholder="www.empresa.com"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Calificación</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="0.5"
                      value={formData.rating}
                      onChange={(e) => setFormData({...formData, rating: parseFloat(e.target.value)})}
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontWeight: 'bold', minWidth: '40px' }}>{formData.rating.toFixed(1)}</span>
                    <div>{renderStars(formData.rating)}</div>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-primary" onClick={handleAddSupplier}>
                  {editingSupplier ? 'Guardar Cambios' : 'Crear Proveedor'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersPage;