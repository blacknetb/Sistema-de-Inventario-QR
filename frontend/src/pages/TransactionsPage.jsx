import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { useNotification } from '../context/NotificationContext';
import '../assets/styles/pages/pages.css';

const TransactionsPage = () => {
  const { transactions, products, loading, error, fetchTransactions } = useInventory();
  const { showNotification } = useNotification();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fechas para filtros
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const last7Days = new Date(today);
  last7Days.setDate(last7Days.getDate() - 7);
  const last30Days = new Date(today);
  last30Days.setDate(last30Days.getDate() - 30);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Filtrar transacciones
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(transaction =>
        transaction.id.toLowerCase().includes(term) ||
        transaction.reference?.toLowerCase().includes(term) ||
        transaction.notes?.toLowerCase().includes(term) ||
        transaction.user?.name?.toLowerCase().includes(term)
      );
    }

    // Filtrar por tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === typeFilter);
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.status === statusFilter);
    }

    // Filtrar por rango de fechas
    if (dateRange !== 'all') {
      const filterDate = (() => {
        switch (dateRange) {
          case 'today': return today;
          case 'yesterday': return yesterday;
          case 'last7': return last7Days;
          case 'last30': return last30Days;
          case 'thismonth': return thisMonth;
          default: return null;
        }
      })();

      if (filterDate) {
        filtered = filtered.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= filterDate;
        });
      }
    }

    // Ordenar
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'amount':
          aValue = a.totalAmount;
          bValue = b.totalAmount;
          break;
        case 'reference':
          aValue = a.reference?.toLowerCase() || '';
          bValue = b.reference?.toLowerCase() || '';
          break;
        case 'user':
          aValue = a.user?.name?.toLowerCase() || '';
          bValue = b.user?.name?.toLowerCase() || '';
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }

      if (sortOrder === 'desc') {
        return aValue < bValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [transactions, searchTerm, typeFilter, statusFilter, dateRange, sortBy, sortOrder]);

  // Paginación
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = transactions.length;
    const sales = transactions.filter(t => t.type === 'sale').length;
    const purchases = transactions.filter(t => t.type === 'purchase').length;
    const adjustments = transactions.filter(t => t.type === 'adjustment').length;
    const totalAmount = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const pending = transactions.filter(t => t.status === 'pending').length;
    const completed = transactions.filter(t => t.status === 'completed').length;
    const cancelled = transactions.filter(t => t.status === 'cancelled').length;

    return { total, sales, purchases, adjustments, totalAmount, pending, completed, cancelled };
  }, [transactions]);

  // Efectos
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Handlers
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  const handleExport = () => {
    const csv = convertToCSV(filteredTransactions);
    downloadCSV(csv, 'transacciones.csv');
    showNotification('success', 'Exportación completada', 'Las transacciones se han exportado correctamente');
  };

  const handlePrint = (transaction = null) => {
    if (transaction) {
      // Imprimir transacción específica
      showNotification('info', 'Imprimir', `Preparando impresión de ${transaction.reference}`);
    } else {
      // Imprimir reporte general
      showNotification('info', 'Imprimir', 'Preparando reporte de transacciones');
    }
  };

  const handleStatusChange = async (transactionId, newStatus) => {
    try {
      // Aquí iría la llamada a la API para actualizar el estado
      showNotification('success', 'Estado actualizado', 'El estado de la transacción ha sido actualizado');
    } catch (error) {
      showNotification('error', 'Error', 'No se pudo actualizar el estado');
    }
  };

  // Funciones auxiliares
  const convertToCSV = (data) => {
    const headers = ['ID', 'Referencia', 'Tipo', 'Fecha', 'Usuario', 'Productos', 'Total', 'Estado', 'Notas'];
    const rows = data.map(transaction => [
      transaction.id,
      transaction.reference,
      transaction.type === 'sale' ? 'Venta' : transaction.type === 'purchase' ? 'Compra' : 'Ajuste',
      new Date(transaction.date).toLocaleDateString('es-ES'),
      transaction.user?.name || 'Sistema',
      transaction.items?.length || 0,
      transaction.totalAmount.toFixed(2),
      transaction.status === 'completed' ? 'Completado' : transaction.status === 'pending' ? 'Pendiente' : 'Cancelado',
      transaction.notes || ''
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'sale': return '💰';
      case 'purchase': return '🛒';
      case 'adjustment': return '📊';
      default: return '📄';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'sale': return 'Venta';
      case 'purchase': return 'Compra';
      case 'adjustment': return 'Ajuste';
      default: return 'Transacción';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'sale': return 'success';
      case 'purchase': return 'primary';
      case 'adjustment': return 'warning';
      default: return 'secondary';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="status-badge status-completed">Completado</span>;
      case 'pending':
        return <span className="status-badge status-pending">Pendiente</span>;
      case 'cancelled':
        return <span className="status-badge status-cancelled">Cancelado</span>;
      default:
        return <span className="status-badge">Desconocido</span>;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="transactions-page loading">
        <div className="loading-spinner"></div>
        <p>Cargando transacciones...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="transactions-page error">
        <div className="error-icon">⚠️</div>
        <h3>Error al cargar transacciones</h3>
        <p>{error}</p>
        <button onClick={fetchTransactions} className="retry-button">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="transactions-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">Transacciones</h1>
          <p className="page-subtitle">
            {stats.total} transacciones • {stats.completed} completadas • {stats.pending} pendientes
          </p>
        </div>
        
        <div className="header-right">
          <div className="header-actions">
            <button 
              className="filter-button"
              onClick={() => setShowFilterModal(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Filtros
            </button>
            <button className="export-button" onClick={handleExport}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Exportar
            </button>
            <button className="print-button" onClick={() => handlePrint()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M6 9V2H18V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 18H4C3.46957 18 2.96086 17.7893 2.58579 17.4142C2.21071 17.0391 2 16.5304 2 16V11C2 10.4696 2.21071 9.96086 2.58579 9.58579C2.96086 9.21071 3.46957 9 4 9H20C20.5304 9 21.0391 9.21071 21.4142 9.58579C21.7893 9.96086 22 10.4696 22 11V16C22 16.5304 21.7893 17.0391 21.4142 17.4142C21.0391 17.7893 20.5304 17.2 20 17.2H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18 14H6V22H18V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Imprimir
            </button>
            <Link to="/transactions/new" className="primary-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Nueva Transacción
            </Link>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="transactions-stats">
        <div className="stat-card">
          <div className="stat-icon total">📊</div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Transacciones</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon sales">💰</div>
          <div className="stat-content">
            <h3>{stats.sales}</h3>
            <p>Ventas</p>
            <span className="stat-trend positive">+12%</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon purchases">🛒</div>
          <div className="stat-content">
            <h3>{stats.purchases}</h3>
            <p>Compras</p>
            <span className="stat-trend positive">+8%</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon amount">💵</div>
          <div className="stat-content">
            <h3>{formatCurrency(stats.totalAmount)}</h3>
            <p>Valor Total</p>
            <span className="stat-trend positive">+15%</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon pending">⏳</div>
          <div className="stat-content">
            <h3>{stats.pending}</h3>
            <p>Pendientes</p>
            {stats.pending > 0 && (
              <span className="stat-alert">Requiere atención</span>
            )}
          </div>
        </div>
      </div>

      {/* Filtros rápidos */}
      <div className="quick-filters">
        <div className="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <input
            type="search"
            placeholder="Buscar transacciones..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>

        <div className="filter-tags">
          <button
            className={`filter-tag ${typeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTypeFilter('all')}
          >
            Todos los tipos
          </button>
          <button
            className={`filter-tag ${typeFilter === 'sale' ? 'active' : ''}`}
            onClick={() => setTypeFilter('sale')}
          >
            <span className="tag-icon">💰</span>
            Ventas
          </button>
          <button
            className={`filter-tag ${typeFilter === 'purchase' ? 'active' : ''}`}
            onClick={() => setTypeFilter('purchase')}
          >
            <span className="tag-icon">🛒</span>
            Compras
          </button>
          <button
            className={`filter-tag ${typeFilter === 'adjustment' ? 'active' : ''}`}
            onClick={() => setTypeFilter('adjustment')}
          >
            <span className="tag-icon">📊</span>
            Ajustes
          </button>
        </div>

        <div className="date-filters">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="date-select"
          >
            <option value="all">Todas las fechas</option>
            <option value="today">Hoy</option>
            <option value="yesterday">Ayer</option>
            <option value="last7">Últimos 7 días</option>
            <option value="last30">Últimos 30 días</option>
            <option value="thismonth">Este mes</option>
          </select>
        </div>
      </div>

      {/* Tabla de transacciones */}
      <div className="transactions-table-container">
        <table className="transactions-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('id')}>
                ID {sortBy === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('type')}>
                Tipo {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('reference')}>
                Referencia {sortBy === 'reference' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('date')}>
                Fecha {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Productos</th>
              <th onClick={() => handleSort('amount')}>
                Total {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Estado</th>
              <th>Usuario</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTransactions.length > 0 ? (
              paginatedTransactions.map(transaction => (
                <tr key={transaction.id} className={`transaction-row type-${getTypeColor(transaction.type)}`}>
                  <td>
                    <div className="transaction-id">{transaction.id}</div>
                  </td>
                  <td>
                    <div className="transaction-type">
                      <span className="type-icon">{getTypeIcon(transaction.type)}</span>
                      <span className="type-label">{getTypeLabel(transaction.type)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="transaction-reference">
                      {transaction.reference || 'Sin referencia'}
                      {transaction.notes && (
                        <div className="transaction-notes" title={transaction.notes}>
                          {transaction.notes.substring(0, 30)}...
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="transaction-date">{formatDate(transaction.date)}</div>
                  </td>
                  <td>
                    <div className="transaction-items">
                      {transaction.items?.length || 0} productos
                      {transaction.items?.slice(0, 2).map((item, index) => (
                        <div key={index} className="item-preview">
                          {item.productName || 'Producto'} × {item.quantity}
                        </div>
                      ))}
                      {transaction.items && transaction.items.length > 2 && (
                        <div className="more-items">+{transaction.items.length - 2} más</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className={`transaction-amount ${transaction.type === 'sale' ? 'sale' : transaction.type === 'purchase' ? 'purchase' : 'adjustment'}`}>
                      {transaction.type === 'sale' ? '+' : transaction.type === 'purchase' ? '-' : '±'}
                      {formatCurrency(transaction.totalAmount)}
                    </div>
                  </td>
                  <td>
                    <div className="transaction-status">
                      {getStatusBadge(transaction.status)}
                      {transaction.status === 'pending' && (
                        <select
                          className="status-select"
                          value={transaction.status}
                          onChange={(e) => handleStatusChange(transaction.id, e.target.value)}
                        >
                          <option value="pending">Pendiente</option>
                          <option value="completed">Completar</option>
                          <option value="cancelled">Cancelar</option>
                        </select>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="transaction-user">
                      <div className="user-avatar">
                        {transaction.user?.name?.charAt(0).toUpperCase() || 'S'}
                      </div>
                      <div className="user-info">
                        <div className="user-name">{transaction.user?.name || 'Sistema'}</div>
                        <div className="user-role">{transaction.user?.role || 'Usuario'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="transaction-actions">
                      <button
                        className="action-button view"
                        onClick={() => handleViewDetails(transaction)}
                        title="Ver detalles"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 9 12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        className="action-button print"
                        onClick={() => handlePrint(transaction)}
                        title="Imprimir"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M6 9V2H18V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M6 18H4C3.46957 18 2.96086 17.7893 2.58579 17.4142C2.21071 17.0391 2 16.5304 2 16V11C2 10.4696 2.21071 9.96086 2.58579 9.58579C2.96086 9.21071 3.46957 9 4 9H20C20.5304 9 21.0391 9.21071 21.4142 9.58579C21.7893 9.96086 22 10.4696 22 11V16C22 16.5304 21.7893 17.0391 21.4142 17.4142C21.0391 17.7893 20.5304 17.2 20 17.2H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18 14H6V22H18V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      {transaction.status === 'pending' && (
                        <button
                          className="action-button complete"
                          onClick={() => handleStatusChange(transaction.id, 'completed')}
                          title="Completar"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="empty-table">
                  <div className="empty-state">
                    <div className="empty-state-icon">📄</div>
                    <h3>No se encontraron transacciones</h3>
                    <p>Intenta con otros filtros o crea una nueva transacción.</p>
                    <Link to="/transactions/new" className="primary-button">
                      Nueva Transacción
                    </Link>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ← Anterior
          </button>
          
          <div className="pagination-pages">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => 
                page === 1 || 
                page === totalPages || 
                (page >= currentPage - 2 && page <= currentPage + 2)
              )
              .map((page, index, array) => (
                <React.Fragment key={page}>
                  {index > 0 && page - array[index - 1] > 1 && (
                    <span className="pagination-ellipsis">...</span>
                  )}
                  <button
                    className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                </React.Fragment>
              ))}
          </div>
          
          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* Modal de filtros avanzados */}
      {showFilterModal && (
        <div className="modal-overlay">
          <div className="modal filter-modal">
            <div className="modal-header">
              <h3>Filtros avanzados</h3>
              <button className="modal-close" onClick={() => setShowFilterModal(false)}>
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="filter-group">
                <label>Tipo de transacción</label>
                <div className="filter-options">
                  <label className="filter-option">
                    <input
                      type="radio"
                      name="type"
                      value="all"
                      checked={typeFilter === 'all'}
                      onChange={(e) => setTypeFilter(e.target.value)}
                    />
                    <span>Todos</span>
                  </label>
                  <label className="filter-option">
                    <input
                      type="radio"
                      name="type"
                      value="sale"
                      checked={typeFilter === 'sale'}
                      onChange={(e) => setTypeFilter(e.target.value)}
                    />
                    <span>Ventas</span>
                  </label>
                  <label className="filter-option">
                    <input
                      type="radio"
                      name="type"
                      value="purchase"
                      checked={typeFilter === 'purchase'}
                      onChange={(e) => setTypeFilter(e.target.value)}
                    />
                    <span>Compras</span>
                  </label>
                  <label className="filter-option">
                    <input
                      type="radio"
                      name="type"
                      value="adjustment"
                      checked={typeFilter === 'adjustment'}
                      onChange={(e) => setTypeFilter(e.target.value)}
                    />
                    <span>Ajustes</span>
                  </label>
                </div>
              </div>

              <div className="filter-group">
                <label>Estado</label>
                <div className="filter-options">
                  <label className="filter-option">
                    <input
                      type="radio"
                      name="status"
                      value="all"
                      checked={statusFilter === 'all'}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    />
                    <span>Todos</span>
                  </label>
                  <label className="filter-option">
                    <input
                      type="radio"
                      name="status"
                      value="completed"
                      checked={statusFilter === 'completed'}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    />
                    <span>Completados</span>
                  </label>
                  <label className="filter-option">
                    <input
                      type="radio"
                      name="status"
                      value="pending"
                      checked={statusFilter === 'pending'}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    />
                    <span>Pendientes</span>
                  </label>
                  <label className="filter-option">
                    <input
                      type="radio"
                      name="status"
                      value="cancelled"
                      checked={statusFilter === 'cancelled'}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    />
                    <span>Cancelados</span>
                  </label>
                </div>
              </div>

              <div className="filter-group">
                <label>Rango de fechas</label>
                <div className="date-range-inputs">
                  <div className="date-input">
                    <label>Desde</label>
                    <input type="date" className="date-picker" />
                  </div>
                  <div className="date-input">
                    <label>Hasta</label>
                    <input type="date" className="date-picker" />
                  </div>
                </div>
              </div>

              <div className="filter-group">
                <label>Monto mínimo</label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="amount-input"
                />
              </div>

              <div className="filter-group">
                <label>Monto máximo</label>
                <input
                  type="number"
                  placeholder="100000.00"
                  className="amount-input"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="secondary-button" onClick={() => {
                setTypeFilter('all');
                setStatusFilter('all');
                setDateRange('all');
                setShowFilterModal(false);
              }}>
                Limpiar filtros
              </button>
              <button className="primary-button" onClick={() => setShowFilterModal(false)}>
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalles de transacción */}
      {showDetailsModal && selectedTransaction && (
        <div className="modal-overlay">
          <div className="modal details-modal">
            <div className="modal-header">
              <h3>Detalles de transacción</h3>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="transaction-details">
                <div className="detail-row">
                  <span className="detail-label">ID:</span>
                  <span className="detail-value">{selectedTransaction.id}</span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Referencia:</span>
                  <span className="detail-value">{selectedTransaction.reference || 'N/A'}</span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Tipo:</span>
                  <span className="detail-value">
                    <span className={`type-badge type-${getTypeColor(selectedTransaction.type)}`}>
                      {getTypeIcon(selectedTransaction.type)} {getTypeLabel(selectedTransaction.type)}
                    </span>
                  </span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Fecha:</span>
                  <span className="detail-value">{formatDate(selectedTransaction.date)}</span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Estado:</span>
                  <span className="detail-value">{getStatusBadge(selectedTransaction.status)}</span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Usuario:</span>
                  <span className="detail-value">{selectedTransaction.user?.name || 'Sistema'}</span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Total:</span>
                  <span className="detail-value total-amount">
                    {formatCurrency(selectedTransaction.totalAmount)}
                  </span>
                </div>
                
                {selectedTransaction.notes && (
                  <div className="detail-row">
                    <span className="detail-label">Notas:</span>
                    <span className="detail-value notes">{selectedTransaction.notes}</span>
                  </div>
                )}
                
                <div className="detail-section">
                  <h4>Productos ({selectedTransaction.items?.length || 0})</h4>
                  <div className="items-list">
                    {selectedTransaction.items?.map((item, index) => (
                      <div key={index} className="item-row">
                        <div className="item-info">
                          <div className="item-name">{item.productName}</div>
                          <div className="item-sku">SKU: {item.productSku || 'N/A'}</div>
                        </div>
                        <div className="item-quantity">× {item.quantity}</div>
                        <div className="item-price">{formatCurrency(item.price)}</div>
                        <div className="item-total">{formatCurrency(item.total)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="secondary-button" onClick={() => handlePrint(selectedTransaction)}>
                Imprimir
              </button>
              {selectedTransaction.status === 'pending' && (
                <button className="primary-button" onClick={() => {
                  handleStatusChange(selectedTransaction.id, 'completed');
                  setShowDetailsModal(false);
                }}>
                  Completar transacción
                </button>
              )}
              <button className="secondary-button" onClick={() => setShowDetailsModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;