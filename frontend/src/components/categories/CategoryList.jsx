import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import CategoryForm from './CategoryForm';
import categoryService from '../../services/categoryService';
import '../../assets/styles/Categories.css';

/**
 * ✅ MODAL DE FORMULARIO OPTIMIZADO
 */
const CategoryFormModal = ({ category, onSubmit, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = useCallback(async (formData) => {
    setIsSubmitting(true);
    try {
      const response = category?.id
        ? await categoryService.update(category.id, formData)
        : await categoryService.create(formData);

      if (response.success) {
        onSubmit(response.data);
        onClose();
      } else {
        throw new Error(response.message || 'Error al guardar la categoría');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [category, onSubmit, onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="modal-close"
          aria-label="Cerrar"
          disabled={isSubmitting}
        >
          ✕
        </button>

        <h2 className="modal-title">
          {category ? 'Editar Categoría' : 'Nueva Categoría'}
        </h2>

        <CategoryForm
          category={category}
          onSubmit={handleFormSubmit}
          onCancel={onClose}
          loading={isSubmitting}
          showInfo={!!category}
        />
      </div>
    </div>
  );
};

/**
 * ✅ COMPONENTE PRINCIPAL CATEGORY LIST OPTIMIZADO
 */
const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [viewMode, setViewMode] = useState('table');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1
  });
  const [notifications, setNotifications] = useState({
    error: '',
    success: ''
  });

  const notificationTimeoutRef = useRef(null);

  const loadCategories = useCallback(async (abortController) => {
    setLoading(true);
    setNotifications(prev => ({ ...prev, error: '' }));

    try {
      const response = await categoryService.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm
      }, abortController?.signal);

      if (response.success) {
        setCategories(response.data || []);
        setPagination(prev => ({
          ...prev,
          totalItems: response.pagination?.total || response.data?.length || 0,
          totalPages: response.pagination?.pages || 1
        }));
      } else {
        throw new Error(response.message || 'Error al cargar las categorías');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error loading categories:', error);
        setNotifications(prev => ({
          ...prev,
          error: error.message || 'Error de conexión con el servidor'
        }));
        setCategories([]);
        setPagination(prev => ({
          ...prev,
          totalItems: 0,
          totalPages: 1
        }));
      }
    } finally {
      if (!abortController?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [pagination.page, pagination.limit, searchTerm]);

  useEffect(() => {
    const abortController = new AbortController();
    loadCategories(abortController);

    return () => {
      abortController.abort();
    };
  }, [loadCategories]);

  const showNotification = useCallback((type, message, duration = 3000) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    setNotifications(prev => ({ ...prev, [type]: message }));
    
    if (duration > 0) {
      notificationTimeoutRef.current = setTimeout(() => {
        setNotifications(prev => ({ ...prev, [type]: '' }));
      }, duration);
    }
  }, []);

  const handleCreate = () => {
    setSelectedCategory(null);
    setIsFormOpen(true);
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setIsFormOpen(true);
  };

  const handleDelete = async (category) => {
    if (category.product_count > 0) {
      showNotification('error', 
        `No se puede eliminar "${category.name}" porque tiene ${category.product_count} producto(s) asociado(s)`
      );
      return;
    }

    if (!window.confirm(`¿Estás seguro de eliminar la categoría "${category.name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await categoryService.delete(category.id);

      if (response.success) {
        showNotification('success', 'Categoría eliminada exitosamente');
        loadCategories();
        const newSelected = new Set(selectedRows);
        newSelected.delete(category.id);
        setSelectedRows(newSelected);
      } else {
        throw new Error(response.message || 'Error al eliminar la categoría');
      }
    } catch (error) {
      showNotification('error', error.message || 'Error al eliminar la categoría');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) return;

    const categoriesWithProducts = categories.filter(cat =>
      selectedRows.has(cat.id) && cat.product_count > 0
    );

    if (categoriesWithProducts.length > 0) {
      showNotification('error', 
        `${categoriesWithProducts.length} categoría(s) tienen productos y no pueden ser eliminadas`
      );
      return;
    }

    if (!window.confirm(`¿Estás seguro de eliminar ${selectedRows.size} categoría(s)?`)) {
      return;
    }

    try {
      setLoading(true);
      const promises = Array.from(selectedRows).map(id => categoryService.delete(id));
      const results = await Promise.allSettled(promises);

      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length === 0) {
        showNotification('success', `${selectedRows.size} categoría(s) eliminada(s) exitosamente`);
        loadCategories();
        setSelectedRows(new Set());
      } else {
        throw new Error(`${failed.length} categoría(s) no pudieron ser eliminadas`);
      }
    } catch (error) {
      showNotification('error', error.message || 'Error al eliminar las categorías');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = useCallback(async () => {
    setIsFormOpen(false);
    showNotification('success',
      selectedCategory
        ? 'Categoría actualizada exitosamente'
        : 'Categoría creada exitosamente'
    );
    await loadCategories();
  }, [selectedCategory, showNotification, loadCategories]);

  const handleRefresh = () => {
    loadCategories();
    showNotification('success', 'Lista de categorías actualizada');
  };

  const handleExport = () => {
    if (categories.length === 0) {
      showNotification('error', 'No hay datos para exportar');
      return;
    }

    try {
      const csvContent = [
        ['ID', 'Nombre', 'Descripción', 'Productos', 'Creada', 'Actualizada'],
        ...categories.map(cat => [
          cat.id,
          cat.name,
          cat.description || '',
          cat.product_count || 0,
          cat.created_at ? new Date(cat.created_at).toLocaleDateString('es-ES') : '',
          cat.updated_at ? new Date(cat.updated_at).toLocaleDateString('es-ES') : ''
        ])
      ].map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `categorias_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showNotification('success', 'Categorías exportadas exitosamente');
    } catch (error) {
      console.error('Error exporting categories:', error);
      showNotification('error', 'Error al exportar las categorías');
    }
  };

  const stats = useMemo(() => {
    const total = categories.length;
    const withProducts = categories.filter(c => c.product_count > 0).length;
    const withoutProducts = categories.filter(c => c.product_count === 0).length;
    const totalProducts = categories.reduce((sum, c) => sum + (c.product_count || 0), 0);

    return {
      total,
      withProducts,
      withoutProducts,
      avgProducts: total > 0 ? (totalProducts / total).toFixed(1) : '0.0',
      usagePercentage: total > 0 ? ((withProducts / total) * 100).toFixed(1) : '0.0'
    };
  }, [categories]);

  const toggleSelectAll = useCallback((checked) => {
    if (checked) {
      setSelectedRows(new Set(categories.map(cat => cat.id)));
    } else {
      setSelectedRows(new Set());
    }
  }, [categories]);

  const toggleSelectRow = useCallback((id, checked) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
  }, [selectedRows]);

  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  }, [pagination.totalPages]);

  const handleLimitChange = useCallback((newLimit) => {
    setPagination(prev => ({ ...prev, limit: parseInt(newLimit, 10), page: 1 }));
  }, []);

  const renderGridView = () => (
    <div className="grid-view">
      {categories.map((category) => (
        <div key={category.id} className="category-card">
          <div className="card-header">
            <h3 className="card-title">{category.name}</h3>
            <span className="card-id">ID: {category.id}</span>
          </div>

          <p className="card-description">
            {category.description || 'Sin descripción'}
          </p>

          <div className="card-stats">
            <div className="stat-item">
              <span className="stat-icon-small">📦</span>
              <span className={`stat-count ${category.product_count > 0 ? 'stat-count-active' : ''}`}>
                {category.product_count} productos
              </span>
            </div>

            <div className="card-date">
              {category.created_at ? new Date(category.created_at).toLocaleDateString('es-ES') : '—'}
            </div>
          </div>

          <div className="card-actions">
            <button
              type="button"
              onClick={() => handleEdit(category)}
              className="btn btn-outline btn-small"
              disabled={loading}
              aria-label={`Editar categoría ${category.name}`}
            >
              <span className="btn-icon-small">✏️</span>
              Editar
            </button>
            <button
              type="button"
              onClick={() => handleDelete(category)}
              disabled={loading || category.product_count > 0}
              className="btn btn-danger btn-small"
              title={category.product_count > 0 ? 'No se puede eliminar (tiene productos)' : ''}
              aria-label={`Eliminar categoría ${category.name}`}
            >
              <span className="btn-icon-small">🗑️</span>
              Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTableView = () => (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th className="select-column">
              <input
                type="checkbox"
                className="select-checkbox"
                checked={selectedRows.size === categories.length && categories.length > 0}
                onChange={(e) => toggleSelectAll(e.target.checked)}
                disabled={categories.length === 0 || loading}
                aria-label="Seleccionar todas las categorías"
              />
            </th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Productos</th>
            <th>Creada</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {categories.length === 0 ? (
            <tr>
              <td colSpan="6" className="empty-state">
                {loading ? (
                  'Cargando...'
                ) : searchTerm ? (
                  `No se encontraron categorías con "${searchTerm}"`
                ) : (
                  "No hay categorías registradas. ¡Crea tu primera categoría!"
                )}
              </td>
            </tr>
          ) : (
            categories.map((category) => (
              <tr key={category.id} className={selectedRows.has(category.id) ? 'row-selected' : ''}>
                <td className="select-column">
                  <input
                    type="checkbox"
                    className="select-checkbox"
                    checked={selectedRows.has(category.id)}
                    onChange={(e) => toggleSelectRow(category.id, e.target.checked)}
                    disabled={loading}
                    aria-label={`Seleccionar categoría ${category.name}`}
                  />
                </td>
                <td>
                  <div className="category-name">
                    {category.name}
                    <div className="category-id">ID: {category.id}</div>
                  </div>
                </td>
                <td>
                  <div className="category-description" title={category.description}>
                    {category.description || '—'}
                  </div>
                </td>
                <td>
                  <div className="product-count">
                    <div className={`product-indicator ${category.product_count > 0 ? 'has-products' : 'no-products'}`}></div>
                    <span className={category.product_count > 0 ? 'count-active' : ''}>
                      {category.product_count}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="date-cell">
                    {category.created_at ? new Date(category.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : '—'}
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      type="button"
                      onClick={() => handleEdit(category)}
                      className="btn-action btn-edit"
                      title="Editar categoría"
                      disabled={loading}
                      aria-label={`Editar categoría ${category.name}`}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(category)}
                      disabled={loading || category.product_count > 0}
                      className="btn-action btn-delete"
                      title={category.product_count > 0 ? 'No se puede eliminar (tiene productos)' : 'Eliminar categoría'}
                      aria-label={`Eliminar categoría ${category.name}`}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="category-list-container">
      <div className="category-header">
        <div className="header-info">
          <h1 className="page-title">Categorías</h1>
          <p className="page-subtitle">
            Organiza tus productos por categorías ({pagination.totalItems} en total)
          </p>
        </div>

        <div className="header-actions">
          {selectedRows.size > 0 && (
            <button
              type="button"
              onClick={handleBulkDelete}
              className="btn btn-danger"
              disabled={loading || Array.from(selectedRows).some(id =>
                categories.find(c => c.id === id)?.product_count > 0
              )}
              title={Array.from(selectedRows).some(id =>
                categories.find(c => c.id === id)?.product_count > 0
              ) ? 'Algunas categorías seleccionadas tienen productos' : ''}
              aria-label={`Eliminar ${selectedRows.size} categorías seleccionadas`}
            >
              <span className="btn-icon">🗑️</span>
              Eliminar ({selectedRows.size})
            </button>
          )}

          <button
            type="button"
            onClick={handleRefresh}
            className="btn btn-outline"
            title="Recargar lista"
            disabled={loading}
            aria-label="Actualizar lista"
          >
            <span className="btn-icon">🔄</span>
            Actualizar
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={loading || categories.length === 0}
            className="btn btn-outline"
            aria-label="Exportar categorías"
          >
            <span className="btn-icon">📥</span>
            Exportar
          </button>

          <button
            type="button"
            onClick={handleCreate}
            className="btn btn-primary"
            disabled={loading}
            aria-label="Crear nueva categoría"
          >
            <span className="btn-icon">➕</span>
            Nueva Categoría
          </button>
        </div>
      </div>

      {notifications.error && (
        <div className="alert alert-error" role="alert">
          <span className="alert-icon">⚠️</span>
          {notifications.error}
        </div>
      )}

      {notifications.success && (
        <div className="alert alert-success" role="status">
          <span className="alert-icon">✅</span>
          {notifications.success}
        </div>
      )}

      <div className="filters-container">
        <div className="filters-grid">
          <div className="filter-group">
            <label htmlFor="search-categories" className="filter-label">
              Buscar categorías
            </label>
            <div className="search-container">
              <input
                id="search-categories"
                type="text"
                className="search-input"
                placeholder="Buscar por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                disabled={loading}
                aria-label="Buscar categorías"
              />
              <span className="search-icon">🔍</span>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="search-clear"
                  aria-label="Limpiar búsqueda"
                  disabled={loading}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="filter-group">
            <label htmlFor="view-mode" className="filter-label">
              Ver como
            </label>
            <select
              id="view-mode"
              className="filter-select"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              disabled={loading}
              aria-label="Modo de vista"
            >
              <option value="table">Tabla</option>
              <option value="grid">Cuadrícula</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="items-per-page" className="filter-label">
              Mostrar
            </label>
            <select
              id="items-per-page"
              className="filter-select"
              value={pagination.limit}
              onChange={(e) => handleLimitChange(e.target.value)}
              disabled={loading}
              aria-label="Elementos por página"
            >
              <option value="10">10 por página</option>
              <option value="25">25 por página</option>
              <option value="50">50 por página</option>
              <option value="100">100 por página</option>
            </select>
          </div>
        </div>
      </div>

      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-content">
            <p className="stat-label">Total Categorías</p>
            <p className="stat-value">{stats.total}</p>
          </div>
          <div className="stat-icon">
            <span className="icon-emoji">📊</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <p className="stat-label">Con Productos</p>
            <p className="stat-value stat-success">{stats.withProducts}</p>
            <p className="stat-percentage">
              {stats.usagePercentage}%
            </p>
          </div>
          <div className="stat-icon">
            <span className="icon-emoji">📦</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <p className="stat-label">Sin Productos</p>
            <p className="stat-value stat-warning">{stats.withoutProducts}</p>
            <p className="stat-percentage">
              {stats.total > 0 ? (100 - parseFloat(stats.usagePercentage)).toFixed(1) : '0'}%
            </p>
          </div>
          <div className="stat-icon">
            <span className="icon-emoji">⚠️</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <p className="stat-label">Promedio</p>
            <p className="stat-value stat-info">{stats.avgProducts}</p>
            <p className="stat-subtext">productos por categoría</p>
          </div>
          <div className="stat-icon">
            <span className="icon-emoji">📈</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner" aria-label="Cargando"></div>
          <p>Cargando categorías...</p>
        </div>
      ) : viewMode === 'grid' ? renderGridView() : renderTableView()}

      {categories.length > 0 && pagination.totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Mostrando {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.totalItems)} a {Math.min(pagination.page * pagination.limit, pagination.totalItems)} de {pagination.totalItems} categorías
          </div>
          <div className="pagination-controls">
            <button
              type="button"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1 || loading}
              className="pagination-btn"
              aria-label="Página anterior"
            >
              ← Anterior
            </button>

            <div className="pagination-pages">
              {(() => {
                const pages = [];
                let startPage = Math.max(1, pagination.page - 2);
                let endPage = Math.min(pagination.totalPages, pagination.page + 2);

                if (endPage - startPage < 4) {
                  if (startPage === 1) {
                    endPage = Math.min(pagination.totalPages, startPage + 4);
                  } else if (endPage === pagination.totalPages) {
                    startPage = Math.max(1, endPage - 4);
                  }
                }

                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      type="button"
                      onClick={() => handlePageChange(i)}
                      className={`pagination-page ${pagination.page === i ? 'active' : ''}`}
                      disabled={loading}
                      aria-label={`Página ${i}`}
                      aria-current={pagination.page === i ? 'page' : undefined}
                    >
                      {i}
                    </button>
                  );
                }

                return pages;
              })()}
            </div>

            <button
              type="button"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages || loading}
              className="pagination-btn"
              aria-label="Página siguiente"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {isFormOpen && (
        <CategoryFormModal
          category={selectedCategory}
          onSubmit={handleFormSubmit}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
};

export default CategoryList;