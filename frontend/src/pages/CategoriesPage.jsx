import React, { useState, useEffect } from 'react';
import '../assets/styles/pages/pages.css';

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📦'
  });

  useEffect(() => {
    // Datos de ejemplo
    const mockCategories = [
      { id: 1, name: 'Electrónica', description: 'Dispositivos electrónicos y computadoras', icon: '💻', productCount: 45, totalValue: 25000 },
      { id: 2, name: 'Accesorios', description: 'Periféricos y accesorios para computadoras', icon: '🖱️', productCount: 32, totalValue: 8500 },
      { id: 3, name: 'Oficina', description: 'Equipos y suministros de oficina', icon: '🖨️', productCount: 28, totalValue: 12000 },
      { id: 4, name: 'Almacenamiento', description: 'Discos duros y dispositivos de almacenamiento', icon: '💾', productCount: 15, totalValue: 4500 },
      { id: 5, name: 'Redes', description: 'Equipos de red y conectividad', icon: '🌐', productCount: 12, totalValue: 6800 },
      { id: 6, name: 'Muebles', description: 'Mobiliario para oficina', icon: '🪑', productCount: 8, totalValue: 15000 },
      { id: 7, name: 'Herramientas', description: 'Herramientas y equipo técnico', icon: '🔧', productCount: 18, totalValue: 7500 },
      { id: 8, name: 'Software', description: 'Licencias y programas de software', icon: '💿', productCount: 23, totalValue: 32000 },
    ];

    setTimeout(() => {
      setCategories(mockCategories);
      setLoading(false);
    }, 1000);
  }, []);

  const iconOptions = [
    '📦', '💻', '🖱️', '🖨️', '💾', '🌐', '🪑', '🔧', '💿', '📱',
    '⌚', '🎧', '📷', '🔌', '💡', '🔋', '🧰', '📺', '🎮', '🖥️'
  ];

  const handleAddCategory = () => {
    if (!formData.name.trim()) {
      alert('El nombre de la categoría es requerido');
      return;
    }

    const newCategory = {
      id: categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1,
      ...formData,
      productCount: 0,
      totalValue: 0
    };

    if (editingCategory) {
      setCategories(categories.map(cat => 
        cat.id === editingCategory.id ? { ...newCategory, id: editingCategory.id } : cat
      ));
      setEditingCategory(null);
    } else {
      setCategories([...categories, newCategory]);
    }

    setFormData({ name: '', description: '', icon: '📦' });
    setShowAddModal(false);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      icon: category.icon
    });
    setShowAddModal(true);
  };

  const handleDeleteCategory = (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta categoría? Los productos de esta categoría quedarán sin categoría.')) {
      setCategories(categories.filter(cat => cat.id !== id));
    }
  };

  const handleCancel = () => {
    setShowAddModal(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', icon: '📦' });
  };

  if (loading) {
    return (
      <div className="page-container loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando categorías...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Categorías</h1>
          <p className="page-subtitle">Gestión de categorías de productos</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <span className="btn-icon">+</span> Nueva Categoría
        </button>
      </div>

      <div className="categories-grid">
        {categories.map(category => (
          <div className="category-card" key={category.id}>
            <div className="category-icon">{category.icon}</div>
            <div className="category-name">{category.name}</div>
            <p style={{ fontSize: '0.9rem', color: '#7f8c8d', marginBottom: '15px' }}>
              {category.description}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#3498db' }}>
                  {category.productCount}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>Productos</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#27ae60' }}>
                  ${category.totalValue.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>Valor Total</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '8px' }}
                onClick={() => handleEditCategory(category)}
              >
                Editar
              </button>
              <button 
                className="btn btn-danger" 
                style={{ flex: 1, padding: '8px' }}
                onClick={() => handleDeleteCategory(category.id)}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal para agregar/editar categoría */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
              <button className="modal-close" onClick={handleCancel}>×</button>
            </div>
            
            <div style={{ padding: '25px' }}>
              <div className="form-group">
                <label className="form-label">Nombre de la Categoría *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ej: Electrónica"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-control"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="3"
                  placeholder="Descripción de la categoría..."
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Icono</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                  {iconOptions.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      className={`btn ${formData.icon === icon ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '1.5rem', padding: '10px' }}
                      onClick={() => setFormData({...formData, icon})}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-primary" onClick={handleAddCategory}>
                  {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;