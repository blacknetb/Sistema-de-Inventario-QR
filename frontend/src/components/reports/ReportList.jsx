import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/reports.css';

const ReportList = ({ reports = [], onViewReport, onDeleteReport, onDownloadReport }) => {
  const [filteredReports, setFilteredReports] = useState(reports);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Tipos de reporte disponibles
  const reportTypes = [
    { id: 'all', label: 'Todos los tipos' },
    { id: 'inventory', label: 'Inventario', color: 'blue' },
    { id: 'sales', label: 'Ventas', color: 'green' },
    { id: 'purchases', label: 'Compras', color: 'orange' },
    { id: 'movements', label: 'Movimientos', color: 'purple' },
    { id: 'expired', label: 'Vencidos', color: 'red' },
    { id: 'low-stock', label: 'Stock Bajo', color: 'yellow' }
  ];

  // Filtros por fecha
  const dateFilters = [
    { id: 'all', label: 'Todas las fechas' },
    { id: 'today', label: 'Hoy' },
    { id: 'week', label: 'Esta semana' },
    { id: 'month', label: 'Este mes' },
    { id: 'year', label: 'Este año' }
  ];

  // Opciones de ordenamiento
  const sortOptions = [
    { id: 'date', label: 'Fecha' },
    { id: 'name', label: 'Nombre' },
    { id: 'type', label: 'Tipo' },
    { id: 'size', label: 'Tamaño' }
  ];

  useEffect(() => {
    let filtered = [...reports];

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(report => report.type === typeFilter);
    }

    // Filtro por fecha
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate;

      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        filtered = filtered.filter(report => {
          const reportDate = new Date(report.createdAt);
          return reportDate >= startDate;
        });
      }
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'size':
          aValue = a.size || 0;
          bValue = b.size || 0;
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredReports(filtered);
  }, [reports, searchTerm, typeFilter, dateFilter, sortBy, sortOrder]);

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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getReportIcon = (type) => {
    const icons = {
      inventory: '📦',
      sales: '💰',
      purchases: '🛒',
      movements: '📊',
      expired: '⚠️',
      'low-stock': '📉'
    };
    return icons[type] || '📄';
  };

  const getReportColor = (type) => {
    const typeObj = reportTypes.find(t => t.id === type);
    return typeObj ? typeObj.color : 'blue';
  };

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setDateFilter('all');
    setSortBy('date');
    setSortOrder('desc');
  };

  return (
    <div className="report-list-container">
      <div className="report-list-header">
        <h2 className="list-title">Reportes Generados</h2>
        <p className="list-subtitle">
          {reports.length} reportes encontrados • {filteredReports.length} filtrados
        </p>
      </div>

      <div className="report-filters">
        <div className="filter-group">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Buscar reportes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchTerm('')}
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-label">Tipo:</label>
          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            {reportTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Fecha:</label>
          <select
            className="filter-select"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            {dateFilters.map(filter => (
              <option key={filter.id} value={filter.id}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>

        <button className="clear-filters-btn" onClick={clearFilters}>
          Limpiar Filtros
        </button>
      </div>

      <div className="sort-controls">
        <div className="sort-options">
          <span className="sort-label">Ordenar por:</span>
          {sortOptions.map(option => (
            <button
              key={option.id}
              className={`sort-btn ${sortBy === option.id ? 'active' : ''}`}
              onClick={() => handleSortChange(option.id)}
            >
              {option.label}
              {sortBy === option.id && (
                <span className="sort-order">
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div className="no-reports-message">
          <div className="empty-state">
            <span className="empty-icon">📄</span>
            <h3>No se encontraron reportes</h3>
            <p>No hay reportes que coincidan con los filtros seleccionados</p>
          </div>
        </div>
      ) : (
        <div className="reports-grid">
          {filteredReports.map((report) => (
            <div key={report.id} className="report-card">
              <div className="report-card-header">
                <div className={`report-type-badge type-${getReportColor(report.type)}`}>
                  <span className="type-icon">{getReportIcon(report.type)}</span>
                  <span className="type-text">
                    {reportTypes.find(t => t.id === report.type)?.label || report.type}
                  </span>
                </div>
                <div className="report-actions-dropdown">
                  <button className="more-options-btn">⋯</button>
                  <div className="dropdown-menu">
                    <button
                      className="dropdown-item"
                      onClick={() => onViewReport && onViewReport(report)}
                    >
                      <span className="dropdown-icon">👁️</span>
                      Ver Detalles
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => onDownloadReport && onDownloadReport(report)}
                    >
                      <span className="dropdown-icon">📥</span>
                      Descargar
                    </button>
                    <button
                      className="dropdown-item delete"
                      onClick={() => onDeleteReport && onDeleteReport(report.id)}
                    >
                      <span className="dropdown-icon">🗑️</span>
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>

              <div className="report-card-body">
                <h3 className="report-name">{report.name}</h3>
                <p className="report-description">{report.description}</p>

                <div className="report-meta">
                  <div className="meta-item">
                    <span className="meta-icon">📅</span>
                    <span className="meta-text">{formatDate(report.createdAt)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">📄</span>
                    <span className="meta-text">{report.format?.toUpperCase() || 'PDF'}</span>
                  </div>
                  {report.size && (
                    <div className="meta-item">
                      <span className="meta-icon">📦</span>
                      <span className="meta-text">{formatFileSize(report.size)}</span>
                    </div>
                  )}
                </div>

                <div className="report-stats">
                  {report.stats && (
                    <>
                      {report.stats.records && (
                        <div className="stat-item">
                          <span className="stat-label">Registros:</span>
                          <span className="stat-value">{report.stats.records}</span>
                        </div>
                      )}
                      {report.stats.pages && (
                        <div className="stat-item">
                          <span className="stat-label">Páginas:</span>
                          <span className="stat-value">{report.stats.pages}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="report-card-footer">
                <button
                  className="card-action-btn view-btn"
                  onClick={() => onViewReport && onViewReport(report)}
                >
                  <span className="btn-icon">👁️</span>
                  Ver
                </button>
                <button
                  className="card-action-btn download-btn"
                  onClick={() => onDownloadReport && onDownloadReport(report)}
                >
                  <span className="btn-icon">📥</span>
                  Descargar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredReports.length > 0 && (
        <div className="list-footer">
          <div className="pagination-info">
            Mostrando {filteredReports.length} de {reports.length} reportes
          </div>
        </div>
      )}
    </div>
  );
};

ReportList.propTypes = {
  reports: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      type: PropTypes.string.isRequired,
      format: PropTypes.string,
      createdAt: PropTypes.string.isRequired,
      size: PropTypes.number,
      stats: PropTypes.shape({
        records: PropTypes.number,
        pages: PropTypes.number
      })
    })
  ),
  onViewReport: PropTypes.func,
  onDeleteReport: PropTypes.func,
  onDownloadReport: PropTypes.func
};

ReportList.defaultProps = {
  reports: []
};

export default ReportList;