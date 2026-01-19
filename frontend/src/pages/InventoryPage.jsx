import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../assets/styles/pages/pages.css';

const InventoryPage = () => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Datos de ejemplo
    const mockInventory = [
      { id: 1, name: 'Laptop Dell XPS 13', category: 'Electrónica', quantity: 15, price: 1299.99, status: 'disponible' },
      { id: 2, name: 'Mouse Inalámbrico', category: 'Accesorios', quantity: 42, price: 29.99, status: 'disponible' },
      { id: 3, name: 'Monitor 24" Samsung', category: 'Electrónica', quantity: 8, price: 199.99, status: 'bajo-stock' },
      { id: 4, name: 'Teclado Mecánico', category: 'Accesorios', quantity: 0, price: 89.99, status: 'agotado' },
      { id: 5, name: 'Impresora HP LaserJet', category: 'Oficina', quantity: 5, price: 349.99, status: 'disponible' },
      { id: 6, name: 'Cargador USB-C', category: 'Electrónica', quantity: 27, price: 19.99, status: 'disponible' },
      { id: 7, name: 'Disco Duro Externo 1TB', category: 'Almacenamiento', quantity: 12, price: 79.99, status: 'disponible' },
      { id: 8, name: 'Router Wi-Fi 6', category: 'Redes', quantity: 3, price: 149.99, status: 'bajo-stock' },
      { id: 9, name: 'Tablet Samsung Galaxy Tab', category: 'Electrónica', quantity: 7, price: 299.99, status: 'disponible' },
      { id: 10, name: 'Auriculares Bluetooth', category: 'Accesorios', quantity: 23, price: 49.99, status: 'disponible' },
    ];

    setInventory(mockInventory);
    setFilteredInventory(mockInventory);
    setLoading(false);
  }, []);

  useEffect(() => {
    let result = inventory;

    // Aplicar filtro de búsqueda
    if (searchTerm) {
      result = result.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar filtro de estado
    if (filter !== 'all') {
      result = result.filter(item => item.status === filter);
    }

    setFilteredInventory(result);
  }, [searchTerm, filter, inventory]);

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      setInventory(inventory.filter(item => item.id !== id));
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'disponible': return <span className="badge badge-success">Disponible</span>;
      case 'bajo-stock': return <span className="badge badge-warning">Bajo Stock</span>;
      case 'agotado': return <span className="badge badge-danger">Agotado</span>;
      default: return <span className="badge badge-info">Desconocido</span>;
    }
  };

  if (loading) {
    return (
      <div className="page-container loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando inventario...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventario</h1>
          <p className="page-subtitle">Gestión completa de productos</p>
        </div>
        <Link to="/inventory/add" className="btn btn-primary">
          <span className="btn-icon">+</span> Nuevo Producto
        </Link>
      </div>

      <div className="search-container">
        <div className="search-row">
          <div className="form-group search-input">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Todos ({inventory.length})
            </button>
            <button 
              className={`filter-btn ${filter === 'disponible' ? 'active' : ''}`}
              onClick={() => setFilter('disponible')}
            >
              Disponible ({inventory.filter(i => i.status === 'disponible').length})
            </button>
            <button 
              className={`filter-btn ${filter === 'bajo-stock' ? 'active' : ''}`}
              onClick={() => setFilter('bajo-stock')}
            >
              Bajo Stock ({inventory.filter(i => i.status === 'bajo-stock').length})
            </button>
            <button 
              className={`filter-btn ${filter === 'agotado' ? 'active' : ''}`}
              onClick={() => setFilter('agotado')}
            >
              Agotado ({inventory.filter(i => i.status === 'agotado').length})
            </button>
          </div>
        </div>
      </div>

      <div className="page-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Cantidad</th>
                <th>Precio Unitario</th>
                <th>Valor Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length > 0 ? (
                filteredInventory.map(item => (
                  <tr key={item.id}>
                    <td>#{item.id.toString().padStart(4, '0')}</td>
                    <td>
                      <strong>{item.name}</strong>
                      <br />
                      <small style={{ color: '#95a5a6' }}>SKU: SKU{item.id.toString().padStart(6, '0')}</small>
                    </td>
                    <td>{item.category}</td>
                    <td>{item.quantity}</td>
                    <td>${item.price.toFixed(2)}</td>
                    <td>${(item.quantity * item.price).toFixed(2)}</td>
                    <td>{getStatusBadge(item.status)}</td>
                    <td>
                      <div className="inventory-actions">
                        <Link to={`/inventory/edit/${item.id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                          Editar
                        </Link>
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                          onClick={() => handleDelete(item.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                    <p>No se encontraron productos</p>
                    <Link to="/inventory/add" className="btn btn-primary mt-2">
                      Agregar primer producto
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
          <div>
            Mostrando {filteredInventory.length} de {inventory.length} productos
          </div>
          <div className="inventory-actions">
            <button className="btn btn-outline">
              <span className="btn-icon">📥</span> Importar
            </button>
            <button className="btn btn-outline">
              <span className="btn-icon">📤</span> Exportar
            </button>
            <button className="btn btn-primary" onClick={() => window.print()}>
              <span className="btn-icon">🖨️</span> Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;