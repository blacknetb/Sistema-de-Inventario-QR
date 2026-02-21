import React, { useState, useEffect } from 'react';
import SupplierCard from '../SupplierCard';
import SupplierForm from '../SupplierForm';
import styles from './SupplierList.module.css';

const SupplierList = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [filterStatus, setFilterStatus] = useState('todos');
  const [sortConfig, setSortConfig] = useState({
    key: 'nombre',
    direction: 'asc'
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    filterAndSortSuppliers();
  }, [suppliers, searchTerm, filterStatus, sortConfig]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockSuppliers = [
        {
          id: 1,
          nombre: 'Distribuidora ABC',
          contacto: 'Juan Pérez',
          email: 'juan@abc.com',
          telefono: '555-0101',
          direccion: 'Av. Principal 123',
          ciudad: 'Ciudad de México',
          estado: 'activo',
          productos: 45,
          calificacion: 4.5,
          fechaRegistro: '2024-01-15'
        },
        {
          id: 2,
          nombre: 'Proveedores XYZ',
          contacto: 'María García',
          email: 'maria@xyz.com',
          telefono: '555-0102',
          direccion: 'Calle Secundaria 456',
          ciudad: 'Guadalajara',
          estado: 'activo',
          productos: 32,
          calificacion: 4.8,
          fechaRegistro: '2024-01-20'
        },
        {
          id: 3,
          nombre: 'Importaciones Global',
          contacto: 'Carlos López',
          email: 'carlos@global.com',
          telefono: '555-0103',
          direccion: 'Blvd. Internacional 789',
          ciudad: 'Monterrey',
          estado: 'inactivo',
          productos: 12,
          calificacion: 3.9,
          fechaRegistro: '2024-02-01'
        }
      ];
      
      setSuppliers(mockSuppliers);
      setError(null);
    } catch (err) {
      setError('Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortSuppliers = () => {
    let result = [...suppliers];

    if (searchTerm) {
      result = result.filter(supplier =>
        supplier.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.contacto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'todos') {
      result = result.filter(supplier => supplier.estado === filterStatus);
    }

    result.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    setFilteredSuppliers(result);
  };

  const handleAddSupplier = () => {
    setEditingSupplier(null);
    setShowForm(true);
  };

  const handleEditSupplier = (supplier) => {
    setEditingSupplier(supplier);
    setShowForm(true);
  };

  const handleDeleteSupplier = async (id) => {
    if (!window.confirm('¿Eliminar proveedor?')) return;
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setSuppliers(prev => prev.filter(s => s.id !== id));
      setSelectedSuppliers(prev => prev.filter(sId => sId !== id));
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSuppliers.length === 0) return;
    
    if (!window.confirm(`¿Eliminar ${selectedSuppliers.length} proveedores?`)) return;
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setSuppliers(prev => prev.filter(s => !selectedSuppliers.includes(s.id)));
      setSelectedSuppliers([]);
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedSuppliers(prev =>
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedSuppliers.length === filteredSuppliers.length) {
      setSelectedSuppliers([]);
    } else {
      setSelectedSuppliers(filteredSuppliers.map(s => s.id));
    }
  };

  const handleSaveSupplier = async (supplierData) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (editingSupplier) {
        setSuppliers(prev =>
          prev.map(s =>
            s.id === editingSupplier.id
              ? { ...s, ...supplierData, fechaActualizacion: new Date().toISOString() }
              : s
          )
        );
      } else {
        const newSupplier = {
          id: Date.now(),
          ...supplierData,
          productos: 0,
          fechaRegistro: new Date().toISOString()
        };
        setSuppliers(prev => [newSupplier, ...prev]);
      }
      
      setShowForm(false);
      setEditingSupplier(null);
    } catch (err) {
      alert('Error al guardar');
    }
  };

  const handleToggleStatus = async (id, newStatus) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setSuppliers(prev =>
        prev.map(s =>
          s.id === id ? { ...s, estado: newStatus } : s
        )
      );
    } catch (err) {
      alert('Error al cambiar estado');
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  if (loading && suppliers.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Cargando proveedores...</p>
      </div>
    );
  }

  return (
    <div className={styles.supplierListContainer}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>Gestión de Proveedores</h1>
          <p className={styles.totalCount}>
            Total: <span>{suppliers.length}</span> proveedores
          </p>
        </div>
        
        <div className={styles.headerActions}>
          <button className={styles.addButton} onClick={handleAddSupplier}>
            <span>+</span> Nuevo Proveedor
          </button>
          
          {selectedSuppliers.length > 0 && (
            <button className={styles.bulkDeleteButton} onClick={handleBulkDelete}>
              <span>🗑️</span> Eliminar ({selectedSuppliers.length})
            </button>
          )}
        </div>
      </div>

      <div className={styles.filtersBar}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Buscar por nombre, contacto o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          {searchTerm && (
            <button className={styles.clearSearch} onClick={() => setSearchTerm('')}>
              ✕
            </button>
          )}
        </div>

        <select
          className={styles.statusFilter}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="todos">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
      </div>

      <div className={styles.sortControls}>
        <span className={styles.sortLabel}>Ordenar por:</span>
        <button
          className={`${styles.sortButton} ${sortConfig.key === 'nombre' ? styles.active : ''}`}
          onClick={() => handleSort('nombre')}
        >
          Nombre {getSortIcon('nombre')}
        </button>
        <button
          className={`${styles.sortButton} ${sortConfig.key === 'productos' ? styles.active : ''}`}
          onClick={() => handleSort('productos')}
        >
          Productos {getSortIcon('productos')}
        </button>
        <button
          className={`${styles.sortButton} ${sortConfig.key === 'calificacion' ? styles.active : ''}`}
          onClick={() => handleSort('calificacion')}
        >
          Calificación {getSortIcon('calificacion')}
        </button>
      </div>

      {filteredSuppliers.length > 0 && (
        <div className={styles.selectAllBar}>
          <label className={styles.selectAllLabel}>
            <input
              type="checkbox"
              checked={selectedSuppliers.length === filteredSuppliers.length}
              onChange={handleSelectAll}
            />
            <span>Seleccionar todos ({filteredSuppliers.length})</span>
          </label>
          <span className={styles.selectedCount}>
            {selectedSuppliers.length} seleccionados
          </span>
        </div>
      )}

      {error ? (
        <div className={styles.errorContainer}>
          <p>{error}</p>
          <button onClick={fetchSuppliers} className={styles.retryButton}>
            Reintentar
          </button>
        </div>
      ) : (
        <>
          {filteredSuppliers.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>
                {searchTerm ? '🔍' : '🏢'}
              </span>
              <p>
                {searchTerm
                  ? `No hay resultados para "${searchTerm}"`
                  : 'No hay proveedores disponibles'}
              </p>
              {searchTerm ? (
                <button onClick={() => setSearchTerm('')} className={styles.clearButton}>
                  Limpiar búsqueda
                </button>
              ) : (
                <button onClick={handleAddSupplier} className={styles.createButton}>
                  Agregar proveedor
                </button>
              )}
            </div>
          ) : (
            <div className={styles.suppliersGrid}>
              {filteredSuppliers.map(supplier => (
                <SupplierCard
                  key={supplier.id}
                  supplier={supplier}
                  onEdit={handleEditSupplier}
                  onDelete={handleDeleteSupplier}
                  onToggleStatus={handleToggleStatus}
                  isSelected={selectedSuppliers.includes(supplier.id)}
                  onToggleSelect={handleToggleSelect}
                />
              ))}
            </div>
          )}
        </>
      )}

      {showForm && (
        <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <SupplierForm
              supplier={editingSupplier}
              onSave={handleSaveSupplier}
              onCancel={() => {
                setShowForm(false);
                setEditingSupplier(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierList;