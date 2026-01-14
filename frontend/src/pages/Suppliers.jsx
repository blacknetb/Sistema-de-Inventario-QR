import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNotification } from '../context/NotificationContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import ExportButton from '../components/common/ExportButton';
import logger from '../utils/logger';
import api from '../utils/api';

// ✅ Componente Modal para Proveedor
const SupplierModal = ({ supplier, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    contactPerson: supplier?.contactPerson || '',
    email: supplier?.email || '',
    phone: supplier?.phone || '',
    address: supplier?.address || '',
    city: supplier?.city || '',
    country: supplier?.country || 'México',
    taxId: supplier?.taxId || '',
    website: supplier?.website || '',
    rating: supplier?.rating || 5,
    status: supplier?.status || 'active',
    notes: supplier?.notes || ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.email.trim()) newErrors.email = 'El email es requerido';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email inválido';
    
    // Simplificar la expresión regular para teléfono
    if (formData.phone && !/^[\d\s+\-()]{10,20}$/.test(formData.phone)) {
      newErrors.phone = 'Teléfono inválido';
    }
    
    if (formData.rating < 0 || formData.rating > 5) {
      newErrors.rating = 'La calificación debe estar entre 0 y 5';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await onSave(formData, supplier?._id);
    } catch (error) {
      console.error('Error saving supplier:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rating' ? parseFloat(value) || 0 : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const buttonText = supplier ? 'Actualizar' : 'Crear';
  const submittingText = supplier ? 'Actualizando...' : 'Creando...';

  return (
    <Modal
      title={supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
      onClose={onClose}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="supplier-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">Nombre *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'error' : ''}
              disabled={submitting}
              placeholder="Nombre del proveedor"
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="contactPerson">Persona de Contacto</label>
            <input
              type="text"
              id="contactPerson"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              disabled={submitting}
              placeholder="Nombre del contacto"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              disabled={submitting}
              placeholder="correo@proveedor.com"
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Teléfono</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={errors.phone ? 'error' : ''}
              disabled={submitting}
              placeholder="+52 123 456 7890"
            />
            {errors.phone && <span className="error-message">{errors.phone}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="address">Dirección</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            disabled={submitting}
            placeholder="Calle, número, colonia"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="city">Ciudad</label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              disabled={submitting}
              placeholder="Ciudad"
            />
          </div>

          <div className="form-group">
            <label htmlFor="country">País</label>
            <input
              type="text"
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              disabled={submitting}
              placeholder="País"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="taxId">RFC / Identificación Fiscal</label>
            <input
              type="text"
              id="taxId"
              name="taxId"
              value={formData.taxId}
              onChange={handleChange}
              disabled={submitting}
              placeholder="RFC o identificación fiscal"
            />
          </div>

          <div className="form-group">
            <label htmlFor="website">Sitio Web</label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              disabled={submitting}
              placeholder="https://www.proveedor.com"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="rating">Calificación (0-5)</label>
            <input
              type="number"
              id="rating"
              name="rating"
              value={formData.rating}
              onChange={handleChange}
              min="0"
              max="5"
              step="0.1"
              className={errors.rating ? 'error' : ''}
              disabled={submitting}
            />
            {errors.rating && <span className="error-message">{errors.rating}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="status">Estado</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled={submitting}
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notas</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            disabled={submitting}
            placeholder="Notas adicionales sobre el proveedor..."
          />
        </div>

        <div className="modal-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
          >
            {submitting ? submittingText : buttonText}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

SupplierModal.propTypes = {
  supplier: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    contactPerson: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    address: PropTypes.string,
    city: PropTypes.string,
    country: PropTypes.string,
    taxId: PropTypes.string,
    website: PropTypes.string,
    rating: PropTypes.number,
    status: PropTypes.oneOf(['active', 'inactive']),
    notes: PropTypes.string
  }),
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

// ✅ Componente principal de proveedores
const Suppliers = () => {
  const { showNotification } = useNotification();

  // ✅ Estados optimizados
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    productsCount: 0
  });

  // ✅ Cargar proveedores
  const loadSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/suppliers');
      
      if (response.success) {
        setSuppliers(response.data);
        setFilteredSuppliers(response.data);
        
        // Calcular estadísticas
        const statsData = {
          total: response.data.length,
          active: response.data.filter(s => s.status === 'active').length,
          inactive: response.data.filter(s => s.status === 'inactive').length,
          productsCount: response.data.reduce((sum, s) => sum + (s.productsCount || 0), 0)
        };
        setStats(statsData);
      } else {
        showNotification(response.message || 'Error cargando proveedores', 'error');
      }
    } catch (error) {
      logger.error('Error cargando proveedores:', error);
      showNotification('Error cargando proveedores', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // ✅ Efecto para cargar proveedores iniciales
  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  // ✅ Aplicar filtros
  useEffect(() => {
    let filtered = [...suppliers];

    // Filtrar por estado
    if (activeFilter !== 'all') {
      filtered = filtered.filter(s => s.status === activeFilter);
    }

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.name?.toLowerCase().includes(term) ||
        s.email?.toLowerCase().includes(term) ||
        s.phone?.toLowerCase().includes(term) ||
        s.contactPerson?.toLowerCase().includes(term)
      );
    }

    setFilteredSuppliers(filtered);
    setCurrentPage(1); // Resetear a primera página al filtrar
  }, [suppliers, activeFilter, searchTerm]);

  // ✅ Paginación
  const paginatedSuppliers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSuppliers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSuppliers, currentPage, itemsPerPage]);

  // ✅ Manejar crear/actualizar proveedor
  const handleSaveSupplier = useCallback(async (supplierData, supplierId = null) => {
    try {
      const method = supplierId ? 'put' : 'post';
      const url = supplierId ? `/suppliers/${supplierId}` : '/suppliers';
      
      const response = await api[method](url, supplierData);
      
      if (response.success) {
        showNotification(
          supplierId ? 'Proveedor actualizado exitosamente' : 'Proveedor creado exitosamente',
          'success'
        );
        setShowModal(false);
        setSelectedSupplier(null);
        loadSuppliers();
      } else {
        showNotification(response.message || 'Error guardando proveedor', 'error');
      }
    } catch (error) {
      logger.error('Error guardando proveedor:', error);
      showNotification('Error guardando proveedor', 'error');
    }
  }, [showNotification, loadSuppliers]);

  // ✅ Manejar eliminar proveedor
  const handleDeleteSupplier = useCallback(async () => {
    if (!selectedSupplier) return;

    try {
      const response = await api.delete(`/suppliers/${selectedSupplier._id}`);
      
      if (response.success) {
        showNotification('Proveedor eliminado exitosamente', 'success');
        setShowDeleteConfirm(false);
        setSelectedSupplier(null);
        loadSuppliers();
      } else {
        showNotification(response.message || 'Error eliminando proveedor', 'error');
      }
    } catch (error) {
      logger.error('Error eliminando proveedor:', error);
      showNotification('Error eliminando proveedor', 'error');
    }
  }, [selectedSupplier, showNotification, loadSuppliers]);

  // ✅ Exportar proveedores
  const handleExport = useCallback(async (format) => {
    try {
      setLoading(true);
      
      const response = await api.get(`/suppliers/export?format=${format}`, {
        responseType: 'blob'
      });

      if (response) {
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `proveedores-${new Date().toISOString().split('T')[0]}.${format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        showNotification(`Proveedores exportados en formato ${format.toUpperCase()}`, 'success');
      }
    } catch (error) {
      logger.error('Error exportando proveedores:', error);
      showNotification('Error exportando proveedores', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // ✅ Columnas de la tabla
  const columns = useMemo(() => [
    { key: 'name', label: 'Nombre', sortable: true },
    { key: 'contactPerson', label: 'Contacto', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'phone', label: 'Teléfono', sortable: true },
    { key: 'productsCount', label: 'Productos', sortable: true, align: 'center' },
    { key: 'rating', label: 'Calificación', sortable: true, render: (value) => (
      <div className="rating-stars">
        {'★'.repeat(Math.floor(value || 0))}
        {'☆'.repeat(5 - Math.floor(value || 0))}
        <span className="rating-value"> ({value?.toFixed(1) || '0.0'})</span>
      </div>
    )},
    { key: 'status', label: 'Estado', sortable: true, render: (value) => (
      <span className={`supplier-status status-${value}`}>
        {value === 'active' ? 'Activo' : 'Inactivo'}
      </span>
    )}
  ], []);

  // ✅ Estadísticas
  const statCards = useMemo(() => [
    { id: 'total', title: 'Total Proveedores', value: stats.total, icon: '🏢', color: 'primary' },
    { id: 'active', title: 'Activos', value: stats.active, icon: '✅', color: 'success' },
    { id: 'inactive', title: 'Inactivos', value: stats.inactive, icon: '⏸️', color: 'warning' },
    { id: 'products', title: 'Productos', value: stats.productsCount, icon: '📦', color: 'info' }
  ], [stats]);

  // ✅ Filtros de estado
  const statusFilters = useMemo(() => [
    { value: 'all', label: 'Todos', count: suppliers.length },
    { value: 'active', label: 'Activos', count: stats.active },
    { value: 'inactive', label: 'Inactivos', count: stats.inactive }
  ], [suppliers, stats]);

  if (loading && suppliers.length === 0) {
    return (
      <div className="suppliers-container">
        <div className="suppliers-loading">
          <LoadingSpinner />
          <p>Cargando proveedores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="suppliers-container">
      <div className="suppliers-header">
        <h1>Proveedores</h1>
        <div className="suppliers-actions">
          <Button
            variant="primary"
            onClick={() => setShowModal(true)}
            icon="➕"
          >
            Nuevo Proveedor
          </Button>
          <ExportButton
            onExport={handleExport}
            formats={['csv', 'excel', 'pdf']}
            disabled={loading || suppliers.length === 0}
          />
        </div>
      </div>

      {/* ✅ Estadísticas */}
      <div className="suppliers-stats">
        {statCards.map((stat) => (
          <Card key={stat.id} className={`stat-card stat-card-${stat.color}`}>
            <div className="stat-content">
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-info">
                <h4>{stat.title}</h4>
                <p className="stat-value">{stat.value.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ✅ Filtros y controles */}
      <div className="suppliers-controls">
        <div className="filters-section">
          <div className="status-filters">
            {statusFilters.map(filter => (
              <button
                key={filter.value}
                className={`status-filter ${activeFilter === filter.value ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter.value)}
              >
                <span className="filter-label">{filter.label}</span>
                <span className="filter-count">{filter.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="search-section">
          <input
            type="text"
            placeholder="Buscar proveedores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-results">
            {filteredSuppliers.length} proveedores encontrados
          </span>
        </div>
      </div>

      {/* ✅ Tabla de proveedores */}
      <div className="suppliers-table-container">
        <DataTable
          columns={columns}
          data={paginatedSuppliers}
          onRowClick={(supplier) => {
            setSelectedSupplier(supplier);
            setShowModal(true);
          }}
          actions={[
            {
              label: 'Editar',
              onClick: (supplier) => {
                setSelectedSupplier(supplier);
                setShowModal(true);
              },
              icon: '✏️'
            },
            {
              label: 'Eliminar',
              onClick: (supplier) => {
                setSelectedSupplier(supplier);
                setShowDeleteConfirm(true);
              },
              icon: '🗑️',
              variant: 'danger'
            }
          ]}
          pagination={{
            currentPage,
            totalItems: filteredSuppliers.length,
            itemsPerPage,
            onPageChange: setCurrentPage
          }}
          emptyMessage="No se encontraron proveedores"
        />
      </div>

      {/* ✅ Modal para crear/editar proveedor */}
      {showModal && (
        <SupplierModal
          supplier={selectedSupplier}
          onClose={() => {
            setShowModal(false);
            setSelectedSupplier(null);
          }}
          onSave={handleSaveSupplier}
        />
      )}

      {/* ✅ Modal de confirmación para eliminar */}
      {showDeleteConfirm && selectedSupplier && (
        <Modal
          title="Confirmar Eliminación"
          onClose={() => setShowDeleteConfirm(false)}
          size="sm"
        >
          <div className="delete-confirmation">
            <p>¿Estás seguro de eliminar el proveedor <strong>{selectedSupplier.name}</strong>?</p>
            <p className="warning-text">Esta acción no se puede deshacer.</p>
            
            <div className="modal-actions">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteSupplier}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Suppliers;