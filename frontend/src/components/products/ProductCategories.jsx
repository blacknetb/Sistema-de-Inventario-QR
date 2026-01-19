import React, { useState } from 'react';
import '../../assets/styles/Products/products.CSS';

const ProductCategories = () => {
  const [categories, setCategories] = useState([
    { id: 1, name: 'Electrónica', description: 'Dispositivos electrónicos y gadgets', productCount: 45, icon: '💻', color: '#3498db', status: 'active' },
    { id: 2, name: 'Accesorios', description: 'Periféricos y complementos', productCount: 32, icon: '🖱️', color: '#9b59b6', status: 'active' },
    { id: 3, name: 'Oficina', description: 'Equipos y suministros de oficina', productCount: 28, icon: '🏢', color: '#2ecc71', status: 'active' },
    { id: 4, name: 'Almacenamiento', description: 'Discos duros y unidades de almacenamiento', productCount: 15, icon: '💾', color: '#f39c12', status: 'active' },
    { id: 5, name: 'Redes', description: 'Equipos de red y conectividad', productCount: 12, icon: '🌐', color: '#e74c3c', status: 'active' },
    { id: 6, name: 'Mobiliario', description: 'Muebles y accesorios de oficina', productCount: 8, icon: '🪑', color: '#1abc9c', status: 'inactive' },
    { id: 7, name: 'Herramientas', description: 'Herramientas y equipos técnicos', productCount: 5, icon: '🛠️', color: '#34495e', status: 'active' },
    { id: 8, name: 'Consumibles', description: 'Materiales consumibles y repuestos', productCount: 23, icon: '📄', color: '#7f8c8d', status: 'active' }
  ]);

  const [editingCategory, setEditingCategory] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📦',
    color: '#3498db',
    status: 'active'
  });

  const icons = ['💻', '🖱️', '🏢', '💾', '🌐', '🪑', '🛠️', '📄', '📦', '📱', '🎧', '🖨️', '🔌', '💡', '🔧', '📊'];
  const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#7f8c8d'];

  const handleAddCategory = () => {
    if (!formData.name.trim()) return;

    const newCategory = {
      id: categories.length + 1,
      ...formData,
      productCount: 0
    };

    if (editingCategory) {
      setCategories(categories.map(cat => 
        cat.id === editingCategory.id ? { ...cat, ...formData } : cat
      ));
      setEditingCategory(null);
    } else {
      setCategories([...categories, newCategory]);
    }

    setFormData({
      name: '',
      description: '',
      icon: '📦',
      color: '#3498db',
      status: 'active'
    });
    setShowForm(false);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color,
      status: category.status
    });
    setShowForm(true);
  };

  const handleDeleteCategory = (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta categoría? Los productos en esta categoría se moverán a "Sin categoría".')) {
      setCategories(categories.filter(cat => cat.id !== id));
    }
  };

  const toggleStatus = (id) => {
    setCategories(categories.map(cat => 
      cat.id === id ? { ...cat, status: cat.status === 'active' ? 'inactive' : 'active' } : cat
    ));
  };

  const totalProducts = categories.reduce((sum, cat) => sum + cat.productCount, 0);

  return (
    <div className="product-categories">
      <div className="categories-header">
        <div className="header-left">
          <h2>Gestión de Categorías</h2>
          <p className="subtitle">Organiza tus productos en categorías</p>
        </div>
        <div className="header-right">
          <button className="btn-primary" onClick={() => { setShowForm(true); setEditingCategory(null); }}>
            <span className="btn-icon">+</span>
            Nueva Categoría
          </button>
        </div>
      </div>

      <div className="categories-stats">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{categories.length}</div>
            <div className="stat-label">Categorías</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-value">{totalProducts}</div>
            <div className="stat-label">Productos totales</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{categories.filter(c => c.status === 'active').length}</div>
            <div className="stat-label">Categorías activas</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-value">{(totalProducts / categories.length).toFixed(1)}</div>
            <div className="stat-label">Promedio por categoría</div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="category-form-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
              <button className="close-btn" onClick={() => { setShowForm(false); setEditingCategory(null); }}>×</button>
            </div>
            
            <div className="form-content">
              <div className="form-group">
                <label>Nombre de la categoría *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ej: Electrónica"
                />
              </div>
              
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descripción de la categoría..."
                  rows="3"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Icono</label>
                  <div className="icon-selector">
                    <div className="current-icon" style={{ backgroundColor: formData.color + '20' }}>
                      {formData.icon}
                    </div>
                    <div className="icon-grid">
                      {icons.map((icon, index) => (
                        <button
                          key={index}
                          className={`icon-option ${formData.icon === icon ? 'selected' : ''}`}
                          onClick={() => setFormData({...formData, icon})}
                          style={{ backgroundColor: formData.color + '20' }}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Color</label>
                  <div className="color-selector">
                    {colors.map((color, index) => (
                      <button
                        key={index}
                        className={`color-option ${formData.color === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({...formData, color})}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="form-group">
                <label>Estado</label>
                <div className="status-toggle">
                  <button
                    className={`status-btn ${formData.status === 'active' ? 'active' : ''}`}
                    onClick={() => setFormData({...formData, status: 'active'})}
                  >
                    <span className="status-dot active"></span>
                    Activo
                  </button>
                  <button
                    className={`status-btn ${formData.status === 'inactive' ? 'active' : ''}`}
                    onClick={() => setFormData({...formData, status: 'inactive'})}
                  >
                    <span className="status-dot inactive"></span>
                    Inactivo
                  </button>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => { setShowForm(false); setEditingCategory(null); }}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleAddCategory}>
                {editingCategory ? 'Actualizar' : 'Crear'} Categoría
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="categories-grid">
        {categories.map(category => (
          <div key={category.id} className="category-card">
            <div className="card-header" style={{ backgroundColor: category.color + '20' }}>
              <div className="category-icon" style={{ color: category.color }}>
                {category.icon}
              </div>
              <div className="category-status">
                <button 
                  className={`status-toggle-btn ${category.status === 'active' ? 'active' : 'inactive'}`}
                  onClick={() => toggleStatus(category.id)}
                  title={category.status === 'active' ? 'Desactivar' : 'Activar'}
                >
                  <span className="status-dot"></span>
                </button>
              </div>
            </div>
            
            <div className="card-body">
              <h3 className="category-name">{category.name}</h3>
              <p className="category-description">{category.description}</p>
              
              <div className="category-stats">
                <div className="stat-item">
                  <span className="stat-label">Productos:</span>
                  <span className="stat-value">{category.productCount}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Estado:</span>
                  <span className={`status-badge ${category.status}`}>
                    {category.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="card-footer">
              <button className="action-btn edit-btn" onClick={() => handleEditCategory(category)}>
                <span className="btn-icon">✏️</span>
                Editar
              </button>
              <button className="action-btn delete-btn" onClick={() => handleDeleteCategory(category.id)}>
                <span className="btn-icon">🗑️</span>
                Eliminar
              </button>
              <button className="action-btn view-btn" onClick={() => console.log(`View products in ${category.name}`)}>
                <span className="btn-icon">👁️</span>
                Ver
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductCategories;