import React, { useState, useEffect } from 'react';
import CategoryCard from '../CategoryCard';
import CategoryForm from '../CategoryForm';
import styles from './CategoryList.module.css';

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: 'nombre',
    direction: 'asc'
  });

  // Cargar categorías
  useEffect(() => {
    fetchCategories();
  }, []);

  // Filtrar y ordenar categorías
  useEffect(() => {
    let result = [...categories];

    // Aplicar búsqueda
    if (searchTerm) {
      result = result.filter(category =>
        category.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar ordenamiento
    result.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'fechaCreacion' || sortConfig.key === 'fechaActualizacion') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    setFilteredCategories(result);
  }, [categories, searchTerm, sortConfig]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      // Simulación de llamada a API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Datos de ejemplo
      const mockCategories = [
        {
          id: 1,
          nombre: 'Electrónicos',
          descripcion: 'Productos electrónicos y gadgets',
          color: '#FF6B6B',
          icono: '📱',
          totalProductos: 45,
          fechaCreacion: '2024-01-15T10:30:00',
          fechaActualizacion: '2024-02-20T15:45:00',
          estado: 'activo'
        },
        {
          id: 2,
          nombre: 'Ropa',
          descripcion: 'Prendas de vestir y accesorios',
          color: '#4ECDC4',
          icono: '👕',
          totalProductos: 78,
          fechaCreacion: '2024-01-20T09:15:00',
          fechaActualizacion: '2024-02-18T11:30:00',
          estado: 'activo'
        },
        {
          id: 3,
          nombre: 'Hogar',
          descripcion: 'Artículos para el hogar y decoración',
          color: '#45B7D1',
          icono: '🏠',
          totalProductos: 32,
          fechaCreacion: '2024-02-01T14:20:00',
          fechaActualizacion: '2024-02-15T10:10:00',
          estado: 'activo'
        },
        {
          id: 4,
          nombre: 'Deportes',
          descripcion: 'Equipamiento deportivo y fitness',
          color: '#96CEB4',
          icono: '⚽',
          totalProductos: 23,
          fechaCreacion: '2024-02-10T16:45:00',
          fechaActualizacion: '2024-02-19T09:20:00',
          estado: 'inactivo'
        },
        {
          id: 5,
          nombre: 'Libros',
          descripcion: 'Libros, revistas y material educativo',
          color: '#FFEAA7',
          icono: '📚',
          totalProductos: 67,
          fechaCreacion: '2024-01-25T11:00:00',
          fechaActualizacion: '2024-02-17T13:40:00',
          estado: 'activo'
        }
      ];
      
      setCategories(mockCategories);
      setError(null);
    } catch (err) {
      setError('Error al cargar las categorías');
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setShowForm(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta categoría?')) {
      return;
    }

    try {
      // Simulación de eliminación
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCategories(prev => prev.filter(cat => cat.id !== id));
      setSelectedCategories(prev => prev.filter(catId => catId !== id));
    } catch (err) {
      alert('Error al eliminar la categoría');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCategories.length === 0) return;
    
    if (!window.confirm(`¿Eliminar ${selectedCategories.length} categorías seleccionadas?`)) {
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setCategories(prev => prev.filter(cat => !selectedCategories.includes(cat.id)));
      setSelectedCategories([]);
    } catch (err) {
      alert('Error al eliminar las categorías');
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedCategories(prev =>
      prev.includes(id)
        ? prev.filter(catId => catId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedCategories.length === filteredCategories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(filteredCategories.map(cat => cat.id));
    }
  };

  const handleSaveCategory = async (categoryData) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (editingCategory) {
        // Actualizar categoría existente
        setCategories(prev =>
          prev.map(cat =>
            cat.id === editingCategory.id
              ? {
                  ...cat,
                  ...categoryData,
                  fechaActualizacion: new Date().toISOString()
                }
              : cat
          )
        );
      } else {
        // Crear nueva categoría
        const newCategory = {
          id: Date.now(),
          ...categoryData,
          totalProductos: 0,
          fechaCreacion: new Date().toISOString(),
          fechaActualizacion: new Date().toISOString(),
          estado: 'activo'
        };
        setCategories(prev => [newCategory, ...prev]);
      }
      
      setShowForm(false);
      setEditingCategory(null);
    } catch (err) {
      alert('Error al guardar la categoría');
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleToggleStatus = async (id, newStatus) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setCategories(prev =>
        prev.map(cat =>
          cat.id === id
            ? { ...cat, estado: newStatus, fechaActualizacion: new Date().toISOString() }
            : cat
        )
      );
    } catch (error) {
      alert('Error al cambiar el estado');
    }
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  if (loading && categories.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Cargando categorías...</p>
      </div>
    );
  }

  return (
    <div className={styles.categoryListContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>Gestión de Categorías</h1>
          <p className={styles.totalCount}>
            Total: <span>{categories.length}</span> categorías
          </p>
        </div>
        
        <div className={styles.headerActions}>
          <button
            className={styles.addButton}
            onClick={handleAddCategory}
          >
            <span className={styles.buttonIcon}>+</span>
            Nueva Categoría
          </button>
          
          {selectedCategories.length > 0 && (
            <button
              className={styles.bulkDeleteButton}
              onClick={handleBulkDelete}
            >
              <span className={styles.buttonIcon}>🗑️</span>
              Eliminar ({selectedCategories.length})
            </button>
          )}
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className={styles.searchBar}>
        <div className={styles.searchInputWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Buscar categorías por nombre o descripción..."
            value={searchTerm}
            onChange={handleSearch}
            className={styles.searchInput}
          />
          {searchTerm && (
            <button
              className={styles.clearSearch}
              onClick={() => setSearchTerm('')}
            >
              ✕
            </button>
          )}
        </div>
        
        <div className={styles.filterOptions}>
          <select className={styles.filterSelect}>
            <option value="todos">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Controles de ordenamiento */}
      <div className={styles.sortControls}>
        <span className={styles.sortLabel}>Ordenar por:</span>
        <button
          className={`${styles.sortButton} ${sortConfig.key === 'nombre' ? styles.active : ''}`}
          onClick={() => handleSort('nombre')}
        >
          Nombre {getSortIcon('nombre')}
        </button>
        <button
          className={`${styles.sortButton} ${sortConfig.key === 'totalProductos' ? styles.active : ''}`}
          onClick={() => handleSort('totalProductos')}
        >
          Productos {getSortIcon('totalProductos')}
        </button>
        <button
          className={`${styles.sortButton} ${sortConfig.key === 'fechaCreacion' ? styles.active : ''}`}
          onClick={() => handleSort('fechaCreacion')}
        >
          Fecha {getSortIcon('fechaCreacion')}
        </button>
      </div>

      {/* Selector todo */}
      {filteredCategories.length > 0 && (
        <div className={styles.selectAllBar}>
          <label className={styles.selectAllLabel}>
            <input
              type="checkbox"
              checked={selectedCategories.length === filteredCategories.length}
              onChange={handleSelectAll}
            />
            <span>Seleccionar todos ({filteredCategories.length})</span>
          </label>
          <span className={styles.selectedCount}>
            {selectedCategories.length} seleccionados
          </span>
        </div>
      )}

      {/* Grid de categorías */}
      {error ? (
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
          <button onClick={fetchCategories} className={styles.retryButton}>
            Reintentar
          </button>
        </div>
      ) : (
        <>
          {filteredCategories.length === 0 ? (
            <div className={styles.emptyState}>
              {searchTerm ? (
                <>
                  <span className={styles.emptyIcon}>🔍</span>
                  <p>No se encontraron categorías para "{searchTerm}"</p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className={styles.clearSearchButton}
                  >
                    Limpiar búsqueda
                  </button>
                </>
              ) : (
                <>
                  <span className={styles.emptyIcon}>📁</span>
                  <p>No hay categorías disponibles</p>
                  <button
                    onClick={handleAddCategory}
                    className={styles.createButton}
                  >
                    Crear primera categoría
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className={styles.categoriesGrid}>
              {filteredCategories.map(category => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onEdit={handleEditCategory}
                  onDelete={handleDeleteCategory}
                  onToggleStatus={handleToggleStatus}
                  isSelected={selectedCategories.includes(category.id)}
                  onToggleSelect={handleToggleSelect}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal de formulario */}
      {showForm && (
        <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <CategoryForm
              category={editingCategory}
              onSave={handleSaveCategory}
              onCancel={() => {
                setShowForm(false);
                setEditingCategory(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryList;