import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNotification } from '../context/NotificationContext';
import { useInventory } from '../context/InventoryContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import DateRangePicker from '../components/common/DateRangePicker';
import ExportButton from '../components/common/ExportButton';
import logger from '../utils/logger';
import api from '../utils/api';

// ✅ Funciones helper reutilizables
const getTransactionTypeLabel = (type) => {
  switch(type) {
    case 'purchase': return 'Compra';
    case 'sale': return 'Venta';
    case 'adjustment': return 'Ajuste';
    case 'transfer': return 'Transferencia';
    default: return type;
  }
};

const getTransactionStatusLabel = (status) => {
  switch(status) {
    case 'completed': return 'Completada';
    case 'pending': return 'Pendiente';
    case 'void': return 'Anulada';
    default: return status;
  }
};

// ✅ Componente Modal de Detalles
const TransactionDetailsModal = ({ transaction, onClose, onVoid }) => {
  if (!transaction) return null;

  return (
    <Modal
      title={`Transacción ${transaction.reference || ''}`}
      onClose={onClose}
      size="lg"
    >
      <div className="transaction-details">
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Referencia:</span>
            <span className="detail-value">{transaction.reference || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Fecha:</span>
            <span className="detail-value">
              {transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : 'N/A'}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Tipo:</span>
            <span className={`detail-value transaction-type type-${transaction.type || ''}`}>
              {getTransactionTypeLabel(transaction.type)}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Estado:</span>
            <span className={`detail-value transaction-status status-${transaction.status || ''}`}>
              {getTransactionStatusLabel(transaction.status)}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Usuario:</span>
            <span className="detail-value">{transaction.userName || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Producto:</span>
            <span className="detail-value">{transaction.productName || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Cantidad:</span>
            <span className="detail-value">{transaction.quantity || 0}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Precio Unitario:</span>
            <span className="detail-value">
              ${transaction.unitPrice ? parseFloat(transaction.unitPrice).toFixed(2) : '0.00'}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Total:</span>
            <span className="detail-value total-amount">
              ${transaction.total ? parseFloat(transaction.total).toFixed(2) : '0.00'}
            </span>
          </div>
        </div>

        {transaction.notes && (
          <div className="notes-section">
            <h4>Notas</h4>
            <p className="transaction-notes">{transaction.notes}</p>
          </div>
        )}

        {transaction.items && transaction.items.length > 0 && (
          <div className="items-section">
            <h4>Items de la Transacción</h4>
            <table className="items-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio Unit.</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {transaction.items.map((item, index) => (
                  <tr key={item._id || `item-${index}`}>
                    <td>{item.productName || 'N/A'}</td>
                    <td>{item.quantity || 0}</td>
                    <td>${item.unitPrice ? parseFloat(item.unitPrice).toFixed(2) : '0.00'}</td>
                    <td>${item.subtotal ? parseFloat(item.subtotal).toFixed(2) : '0.00'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="modal-actions">
          {transaction.status === 'completed' && (
            <Button
              variant="danger"
              onClick={onVoid}
            >
              Anular Transacción
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

TransactionDetailsModal.propTypes = {
  transaction: PropTypes.shape({
    reference: PropTypes.string,
    createdAt: PropTypes.string,
    type: PropTypes.string,
    status: PropTypes.string,
    userName: PropTypes.string,
    productName: PropTypes.string,
    quantity: PropTypes.number,
    unitPrice: PropTypes.number,
    total: PropTypes.number,
    notes: PropTypes.string,
    items: PropTypes.arrayOf(PropTypes.shape({
      _id: PropTypes.string,
      productId: PropTypes.string,
      productName: PropTypes.string,
      quantity: PropTypes.number,
      unitPrice: PropTypes.number,
      subtotal: PropTypes.number
    }))
  }),
  onClose: PropTypes.func.isRequired,
  onVoid: PropTypes.func.isRequired
};

// ✅ Componente Modal para Nueva Transacción
const NewTransactionModal = ({ products = [], onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    type: 'purchase',
    productId: '',
    quantity: 1,
    unitPrice: 0,
    notes: '',
    reference: `TRX-${Date.now()}`
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // ✅ Actualizar precio cuando se selecciona producto
  useEffect(() => {
    if (formData.productId && products.length > 0) {
      const product = products.find(p => p._id === formData.productId);
      if (product) {
        setSelectedProduct(product);
        setFormData(prev => ({
          ...prev,
          unitPrice: product.price || 0
        }));
      }
    }
  }, [formData.productId, products]);

  // ✅ Calcular total
  const total = useMemo(() => {
    return formData.quantity * formData.unitPrice;
  }, [formData.quantity, formData.unitPrice]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.productId) newErrors.productId = 'Selecciona un producto';
    if (formData.quantity <= 0) newErrors.quantity = 'La cantidad debe ser mayor a 0';
    if (formData.unitPrice <= 0) newErrors.unitPrice = 'El precio debe ser mayor a 0';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const transactionData = {
        ...formData,
        total,
        productName: selectedProduct?.name
      };

      await onSubmit(transactionData);
    } catch (error) {
      console.error('Error submitting transaction:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'unitPrice' ? parseFloat(value) || 0 : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <Modal
      title="Nueva Transacción"
      onClose={onClose}
      size="md"
    >
      <form onSubmit={handleSubmit} className="transaction-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="type">Tipo *</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              disabled={submitting}
            >
              <option value="purchase">Compra</option>
              <option value="sale">Venta</option>
              <option value="adjustment">Ajuste</option>
              <option value="transfer">Transferencia</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="reference">Referencia</label>
            <input
              type="text"
              id="reference"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              disabled
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="productId">Producto *</label>
          <select
            id="productId"
            name="productId"
            value={formData.productId}
            onChange={handleChange}
            className={errors.productId ? 'error' : ''}
            disabled={submitting}
          >
            <option value="">Seleccionar producto</option>
            {products.map(product => (
              <option key={product._id} value={product._id}>
                {product.name} ({product.sku})
              </option>
            ))}
          </select>
          {errors.productId && <span className="error-message">{errors.productId}</span>}
        </div>

        {selectedProduct && (
          <div className="product-info">
            <p>
              <strong>Stock disponible:</strong> {selectedProduct.stock || 0}
            </p>
            <p>
              <strong>Categoría:</strong> {selectedProduct.category?.name || 'Sin categoría'}
            </p>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="quantity">Cantidad *</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="0.01"
              step="0.01"
              className={errors.quantity ? 'error' : ''}
              disabled={submitting}
            />
            {errors.quantity && <span className="error-message">{errors.quantity}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="unitPrice">Precio Unitario *</label>
            <input
              type="number"
              id="unitPrice"
              name="unitPrice"
              value={formData.unitPrice}
              onChange={handleChange}
              min="0"
              step="0.01"
              className={errors.unitPrice ? 'error' : ''}
              disabled={submitting}
            />
            {errors.unitPrice && <span className="error-message">{errors.unitPrice}</span>}
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
            placeholder="Notas adicionales sobre la transacción..."
          />
        </div>

        <div className="transaction-summary">
          <h4>Resumen</h4>
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span>Total:</span>
            <span className="total-amount">${total.toFixed(2)}</span>
          </div>
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
            {submitting ? 'Procesando...' : 'Crear Transacción'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

NewTransactionModal.propTypes = {
  products: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    sku: PropTypes.string,
    price: PropTypes.number,
    stock: PropTypes.number,
    category: PropTypes.shape({
      name: PropTypes.string
    })
  })),
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

// ✅ Componente principal de transacciones
const Transactions = () => {
  const { showNotification } = useNotification();
  const { products } = useInventory();

  // ✅ Estados optimizados
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Hace 30 días
    end: new Date()
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  // ✅ Cargar transacciones
  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString()
      });

      const response = await api.get(`/transactions?${params}`);
      
      if (response.success) {
        setTransactions(response.data);
        setFilteredTransactions(response.data);
      } else {
        showNotification(response.message || 'Error cargando transacciones', 'error');
      }
    } catch (error) {
      logger.error('Error cargando transacciones:', error);
      showNotification('Error cargando transacciones', 'error');
    } finally {
      setLoading(false);
    }
  }, [dateRange, showNotification]);

  // ✅ Efecto para cargar transacciones iniciales
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // ✅ Aplicar filtros
  useEffect(() => {
    let filtered = [...transactions];

    // Filtrar por tipo
    if (activeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === activeFilter);
    }

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.productName?.toLowerCase().includes(term) ||
        t.reference?.toLowerCase().includes(term) ||
        t.notes?.toLowerCase().includes(term) ||
        t.userName?.toLowerCase().includes(term)
      );
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1); // Resetear a primera página al filtrar
  }, [transactions, activeFilter, searchTerm]);

  // ✅ Calcular estadísticas
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTransactions = transactions.filter(t => 
      new Date(t.createdAt) >= today
    );
    
    const totalAmount = transactions.reduce((sum, t) => sum + (t.total || 0), 0);
    const todayAmount = todayTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
    
    const typeCounts = transactions.reduce((acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1;
      return acc;
    }, {});

    return {
      total: transactions.length,
      today: todayTransactions.length,
      totalAmount,
      todayAmount,
      typeCounts
    };
  }, [transactions]);

  // ✅ Paginación
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  // ✅ Manejar nueva transacción
  const handleNewTransaction = useCallback(async (transactionData) => {
    try {
      const response = await api.post('/transactions', transactionData);
      
      if (response.success) {
        showNotification('Transacción creada exitosamente', 'success');
        setShowNewModal(false);
        loadTransactions();
      } else {
        showNotification(response.message || 'Error creando transacción', 'error');
      }
    } catch (error) {
      logger.error('Error creando transacción:', error);
      showNotification('Error creando transacción', 'error');
    }
  }, [showNotification, loadTransactions]);

  // ✅ Manejar anulación de transacción
  const handleVoidTransaction = useCallback(async (transactionId) => {
    if (!window.confirm('¿Estás seguro de anular esta transacción? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await api.put(`/transactions/${transactionId}/void`);
      
      if (response.success) {
        showNotification('Transacción anulada exitosamente', 'success');
        loadTransactions();
      } else {
        showNotification(response.message || 'Error anulando transacción', 'error');
      }
    } catch (error) {
      logger.error('Error anulando transacción:', error);
      showNotification('Error anulando transacción', 'error');
    }
  }, [showNotification, loadTransactions]);

  // ✅ Exportar transacciones
  const handleExport = useCallback(async (format) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        format,
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString()
      });

      const response = await api.get(`/transactions/export?${params}`, {
        responseType: 'blob'
      });

      if (response) {
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `transacciones-${new Date().toISOString().split('T')[0]}.${format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        showNotification(`Transacciones exportadas en formato ${format.toUpperCase()}`, 'success');
      }
    } catch (error) {
      logger.error('Error exportando transacciones:', error);
      showNotification('Error exportando transacciones', 'error');
    } finally {
      setLoading(false);
    }
  }, [dateRange, showNotification]);

  // ✅ Columnas de la tabla
  const columns = useMemo(() => [
    { key: 'date', label: 'Fecha', sortable: true, render: (value) => new Date(value).toLocaleDateString() },
    { key: 'reference', label: 'Referencia', sortable: true },
    { key: 'productName', label: 'Producto', sortable: true },
    { 
      key: 'type', 
      label: 'Tipo', 
      sortable: true, 
      render: (value) => (
        <span className={`transaction-type type-${value}`}>
          {getTransactionTypeLabel(value)}
        </span>
      )
    },
    { key: 'quantity', label: 'Cantidad', sortable: true, align: 'right' },
    { 
      key: 'unitPrice', 
      label: 'Precio Unit.', 
      sortable: true, 
      align: 'right', 
      render: (value) => `$${parseFloat(value).toFixed(2)}` 
    },
    { 
      key: 'total', 
      label: 'Total', 
      sortable: true, 
      align: 'right', 
      render: (value) => `$${parseFloat(value).toFixed(2)}` 
    },
    { 
      key: 'status', 
      label: 'Estado', 
      sortable: true, 
      render: (value) => (
        <span className={`transaction-status status-${value}`}>
          {getTransactionStatusLabel(value)}
        </span>
      )
    }
  ], []);

  // ✅ Tipos de transacción
  const transactionTypes = useMemo(() => [
    { value: 'all', label: 'Todas', count: transactions.length },
    { value: 'purchase', label: 'Compras', count: stats.typeCounts.purchase || 0 },
    { value: 'sale', label: 'Ventas', count: stats.typeCounts.sale || 0 },
    { value: 'adjustment', label: 'Ajustes', count: stats.typeCounts.adjustment || 0 },
    { value: 'transfer', label: 'Transferencias', count: stats.typeCounts.transfer || 0 }
  ], [transactions, stats.typeCounts]);

  // ✅ Estadísticas del dashboard
  const statCards = useMemo(() => [
    { id: 'total-transactions', title: 'Total Transacciones', value: stats.total, icon: '📊', color: 'primary', change: '+12%' },
    { id: 'today', title: 'Hoy', value: stats.today, icon: '📅', color: 'success', change: '+5%' },
    { id: 'total-amount', title: 'Monto Total', value: `$${stats.totalAmount.toFixed(2)}`, icon: '💰', color: 'info', change: '+8%' },
    { id: 'today-amount', title: 'Monto Hoy', value: `$${stats.todayAmount.toFixed(2)}`, icon: '💵', color: 'warning', change: '+15%' }
  ], [stats]);

  if (loading && transactions.length === 0) {
    return (
      <div className="transactions-container">
        <div className="transactions-loading">
          <LoadingSpinner />
          <p>Cargando transacciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transactions-container">
      <div className="transactions-header">
        <h1>Transacciones</h1>
        <div className="transactions-actions">
          <Button
            variant="primary"
            onClick={() => setShowNewModal(true)}
            icon="➕"
          >
            Nueva Transacción
          </Button>
          <ExportButton
            onExport={handleExport}
            formats={['csv', 'excel', 'pdf']}
            disabled={loading || transactions.length === 0}
          />
        </div>
      </div>

      {/* ✅ Estadísticas rápidas */}
      <div className="transactions-stats">
        {statCards.map((stat) => (
          <Card key={stat.id} className={`stat-card stat-card-${stat.color}`}>
            <div className="stat-content">
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-info">
                <h4>{stat.title}</h4>
                <p className="stat-value">{stat.value}</p>
                {stat.change && (
                  <span className={`stat-change ${stat.change.startsWith('+') ? 'positive' : 'negative'}`}>
                    {stat.change}
                  </span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ✅ Filtros y controles */}
      <div className="transactions-controls">
        <div className="filters-section">
          <div className="type-filters">
            {transactionTypes.map(type => (
              <button
                key={type.value}
                className={`type-filter ${activeFilter === type.value ? 'active' : ''}`}
                onClick={() => setActiveFilter(type.value)}
              >
                <span className="filter-label">{type.label}</span>
                <span className="filter-count">{type.count}</span>
              </button>
            ))}
          </div>

          <div className="date-range-section">
            <DateRangePicker
              startDate={dateRange.start}
              endDate={dateRange.end}
              onChange={(start, end) => setDateRange({ start, end })}
            />
          </div>
        </div>

        <div className="search-section">
          <input
            type="text"
            placeholder="Buscar transacciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-results">
            {filteredTransactions.length} transacciones encontradas
          </span>
        </div>
      </div>

      {/* ✅ Tabla de transacciones */}
      <div className="transactions-table-container">
        <DataTable
          columns={columns}
          data={paginatedTransactions}
          onRowClick={(transaction) => {
            setSelectedTransaction(transaction);
            setShowDetailsModal(true);
          }}
          actions={[
            {
              label: 'Detalles',
              onClick: (transaction) => {
                setSelectedTransaction(transaction);
                setShowDetailsModal(true);
              },
              icon: '👁️'
            },
            {
              label: 'Anular',
              onClick: (transaction) => handleVoidTransaction(transaction._id),
              icon: '❌',
              variant: 'danger',
              show: (transaction) => transaction.status === 'completed'
            }
          ]}
          pagination={{
            currentPage,
            totalItems: filteredTransactions.length,
            itemsPerPage,
            onPageChange: setCurrentPage
          }}
          emptyMessage="No se encontraron transacciones"
        />
      </div>

      {/* ✅ Modal de detalles */}
      {showDetailsModal && selectedTransaction && (
        <TransactionDetailsModal
          transaction={selectedTransaction}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedTransaction(null);
          }}
          onVoid={() => {
            handleVoidTransaction(selectedTransaction._id);
            setShowDetailsModal(false);
            setSelectedTransaction(null);
          }}
        />
      )}

      {/* ✅ Modal para nueva transacción */}
      {showNewModal && (
        <NewTransactionModal
          products={products}
          onClose={() => setShowNewModal(false)}
          onSubmit={handleNewTransaction}
        />
      )}
    </div>
  );
};

export default Transactions;