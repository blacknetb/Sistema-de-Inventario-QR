import React, { useState } from 'react';
import '../../assets/styles/Dashboard/Dashboard.css';

const InventoryTable = ({ items, onDelete, onUpdate, loading }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedItems = [...items].sort((a, b) => {
    if (sortConfig.direction === 'ascending') {
      return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
    } else {
      return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
    }
  });

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const handleSave = () => {
    onUpdate(editForm);
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Disponible': return 'status-available';
      case 'Bajo Stock': return 'status-low';
      case 'Agotado': return 'status-out';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="inventory-table loading">
        <div className="loading-spinner"></div>
        <p>Cargando inventario...</p>
      </div>
    );
  }

  return (
    <div className="inventory-table-container">
      <div className="table-header">
        <h2>Inventario de Productos</h2>
        <span className="table-count">{items.length} productos</span>
      </div>
      
      <div className="table-responsive">
        <table className="inventory-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('id')}>ID {sortConfig.key === 'id' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}</th>
              <th onClick={() => handleSort('name')}>Nombre {sortConfig.key === 'name' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}</th>
              <th onClick={() => handleSort('category')}>Categoría {sortConfig.key === 'category' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}</th>
              <th onClick={() => handleSort('quantity')}>Cantidad {sortConfig.key === 'quantity' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}</th>
              <th onClick={() => handleSort('price')}>Precio {sortConfig.key === 'price' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.length > 0 ? (
              sortedItems.map(item => (
                <tr key={item.id}>
                  {editingId === item.id ? (
                    <>
                      <td>{item.id}</td>
                      <td><input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} /></td>
                      <td>
                        <select value={editForm.category} onChange={(e) => setEditForm({...editForm, category: e.target.value})}>
                          <option value="Electrónica">Electrónica</option>
                          <option value="Accesorios">Accesorios</option>
                          <option value="Oficina">Oficina</option>
                          <option value="Almacenamiento">Almacenamiento</option>
                          <option value="Redes">Redes</option>
                        </select>
                      </td>
                      <td><input type="number" value={editForm.quantity} onChange={(e) => setEditForm({...editForm, quantity: parseInt(e.target.value)})} /></td>
                      <td><input type="number" step="0.01" value={editForm.price} onChange={(e) => setEditForm({...editForm, price: parseFloat(e.target.value)})} /></td>
                      <td>
                        <select value={editForm.status} onChange={(e) => setEditForm({...editForm, status: e.target.value})}>
                          <option value="Disponible">Disponible</option>
                          <option value="Bajo Stock">Bajo Stock</option>
                          <option value="Agotado">Agotado</option>
                        </select>
                      </td>
                      <td className="actions-cell">
                        <button className="btn-save" onClick={handleSave}>Guardar</button>
                        <button className="btn-cancel" onClick={handleCancel}>Cancelar</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>#{item.id}</td>
                      <td>{item.name}</td>
                      <td><span className="category-badge">{item.category}</span></td>
                      <td>{item.quantity}</td>
                      <td>${item.price.toFixed(2)}</td>
                      <td>
                        <span className={`status-badge ${getStatusClass(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button className="btn-edit" onClick={() => handleEdit(item)}>Editar</button>
                        <button className="btn-delete" onClick={() => onDelete(item.id)}>Eliminar</button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data">
                  No hay productos en el inventario
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryTable;