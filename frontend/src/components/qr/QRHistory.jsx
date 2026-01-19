import React, { useState, useEffect } from 'react';
import QRItemCard from './QRItemCard';
import { downloadQRCode, exportHistoryToCSV } from './QRUtils';
import './qr.css';

const QRHistory = () => {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    filterAndSortHistory();
  }, [history, filter, searchTerm, sortBy]);

  const loadHistory = () => {
    try {
      const savedHistory = localStorage.getItem('qrHistory');
      const batchHistory = localStorage.getItem('qrBatchHistory');
      
      let allHistory = [];
      
      if (savedHistory) {
        const singleHistory = JSON.parse(savedHistory);
        allHistory = [...allHistory, ...singleHistory];
      }
      
      if (batchHistory) {
        const batchItems = JSON.parse(batchHistory);
        allHistory = [...allHistory, ...batchItems];
      }
      
      // Ordenar por timestamp
      allHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      setHistory(allHistory);
      setFilteredHistory(allHistory);
    } catch (error) {
      console.error('Error loading history:', error);
      setHistory([]);
      setFilteredHistory([]);
    }
  };

  const filterAndSortHistory = () => {
    let filtered = [...history];

    // Aplicar filtro por tipo
    if (filter !== 'all') {
      filtered = filtered.filter(item => {
        if (filter === 'single') return !item.type || item.type === 'single';
        if (filter === 'batch') return item.type === 'batch';
        return true;
      });
    }

    // Aplicar búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.data.itemName.toLowerCase().includes(term) ||
        item.data.category.toLowerCase().includes(term) ||
        item.data.itemId.toString().includes(term)
      );
    }

    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.timestamp) - new Date(a.timestamp);
      } else if (sortBy === 'oldest') {
        return new Date(a.timestamp) - new Date(b.timestamp);
      } else if (sortBy === 'name') {
        return a.data.itemName.localeCompare(b.data.itemName);
      } else if (sortBy === 'category') {
        return a.data.category.localeCompare(b.data.category);
      }
      return 0;
    });

    setFilteredHistory(filtered);
  };

  const handleSelectItem = (id) => {
    setSelectedItems(prev => {
      if (prev.includes(id)) {
        return prev.filter(itemId => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredHistory.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredHistory.map(item => item.id));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) {
      alert('Por favor selecciona elementos para eliminar');
      return;
    }

    if (!window.confirm(`¿Estás seguro de querer eliminar ${selectedItems.length} elementos del historial?`)) {
      return;
    }

    // Filtrar elementos no seleccionados
    const updatedHistory = history.filter(item => !selectedItems.includes(item.id));
    
    // Separar elementos individuales y por lote
    const singleItems = updatedHistory.filter(item => !item.type || item.type === 'single');
    const batchItems = updatedHistory.filter(item => item.type === 'batch');
    
    // Guardar en localStorage
    localStorage.setItem('qrHistory', JSON.stringify(singleItems));
    localStorage.setItem('qrBatchHistory', JSON.stringify(batchItems));
    
    // Actualizar estado
    setHistory(updatedHistory);
    setSelectedItems([]);
  };

  const handleClearAll = () => {
    if (history.length === 0) {
      alert('El historial ya está vacío');
      return;
    }

    if (!window.confirm('¿Estás seguro de querer borrar todo el historial?')) {
      return;
    }

    localStorage.removeItem('qrHistory');
    localStorage.removeItem('qrBatchHistory');
    setHistory([]);
    setFilteredHistory([]);
    setSelectedItems([]);
  };

  const handleDownloadSelected = () => {
    if (selectedItems.length === 0) {
      alert('Por favor selecciona elementos para descargar');
      return;
    }

    selectedItems.forEach(itemId => {
      const item = history.find(h => h.id === itemId);
      if (item) {
        downloadQRCode(item.qrCode, `${item.data.itemName}-qr.png`);
      }
    });
  };

  const handleExportCSV = () => {
    if (history.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    exportHistoryToCSV(filteredHistory);
  };

  const getStats = () => {
    const total = history.length;
    const single = history.filter(item => !item.type || item.type === 'single').length;
    const batch = history.filter(item => item.type === 'batch').length;
    
    return { total, single, batch };
  };

  const stats = getStats();

  return (
    <div className="qr-history-container">
      <div className="history-header">
        <h1>Historial de Códigos QR</h1>
        <div className="history-stats">
          <div className="stat-card">
            <span className="stat-label">Total</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Individuales</span>
            <span className="stat-value">{stats.single}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Por Lote</span>
            <span className="stat-value">{stats.batch}</span>
          </div>
        </div>
      </div>

      <div className="history-controls">
        <div className="controls-left">
          <div className="search-box">
            <input
              type="text"
              placeholder="Buscar por nombre, categoría o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>

          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Todos
            </button>
            <button 
              className={`filter-btn ${filter === 'single' ? 'active' : ''}`}
              onClick={() => setFilter('single')}
            >
              Individuales
            </button>
            <button 
              className={`filter-btn ${filter === 'batch' ? 'active' : ''}`}
              onClick={() => setFilter('batch')}
            >
              Por Lote
            </button>
          </div>
        </div>

        <div className="controls-right">
          <select 
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Más reciente</option>
            <option value="oldest">Más antiguo</option>
            <option value="name">Por nombre</option>
            <option value="category">Por categoría</option>
          </select>

          <button 
            className="btn-export"
            onClick={handleExportCSV}
            disabled={history.length === 0}
          >
            Exportar CSV
          </button>
        </div>
      </div>

      {selectedItems.length > 0 && (
        <div className="selection-bar">
          <div className="selection-info">
            <span>{selectedItems.length} elementos seleccionados</span>
          </div>
          <div className="selection-actions">
            <button className="btn-action-small" onClick={handleDownloadSelected}>
              Descargar Seleccionados
            </button>
            <button className="btn-action-small delete" onClick={handleDeleteSelected}>
              Eliminar Seleccionados
            </button>
            <button className="btn-action-small" onClick={() => setSelectedItems([])}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="history-content">
        {filteredHistory.length > 0 ? (
          <div className="history-grid">
            <div className="grid-header">
              <div className="header-checkbox">
                <input 
                  type="checkbox"
                  checked={selectedItems.length === filteredHistory.length && filteredHistory.length > 0}
                  onChange={handleSelectAll}
                />
              </div>
              <div className="header-column">Producto</div>
              <div className="header-column">Categoría</div>
              <div className="header-column">Fecha</div>
              <div className="header-column">Tipo</div>
              <div className="header-column">Acciones</div>
            </div>

            <div className="history-items">
              {filteredHistory.map(item => (
                <div key={item.id} className="history-item-row">
                  <div className="cell-checkbox">
                    <input 
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                    />
                  </div>
                  <div className="cell-product">
                    <div className="product-info">
                      <strong>{item.data.itemName}</strong>
                      <small>ID: {item.data.itemId}</small>
                    </div>
                  </div>
                  <div className="cell-category">
                    <span className="category-tag">{item.data.category}</span>
                  </div>
                  <div className="cell-date">
                    {new Date(item.timestamp).toLocaleDateString()}
                    <br />
                    <small>{new Date(item.timestamp).toLocaleTimeString()}</small>
                  </div>
                  <div className="cell-type">
                    <span className={`type-badge ${item.type === 'batch' ? 'batch' : 'single'}`}>
                      {item.type === 'batch' ? 'Lote' : 'Individual'}
                    </span>
                  </div>
                  <div className="cell-actions">
                    <button 
                      className="action-btn view"
                      onClick={() => {
                        // Aquí podrías abrir un modal con el QR
                        const newWindow = window.open();
                        newWindow.document.write(`
                          <html>
                            <head><title>QR: ${item.data.itemName}</title></head>
                            <body style="display: flex; justify-content: center; align-items: center; height: 100vh;">
                              <img src="${item.qrCode}" alt="QR Code" style="max-width: 80%;">
                            </body>
                          </html>
                        `);
                      }}
                      title="Ver QR"
                    >
                      👁️
                    </button>
                    <button 
                      className="action-btn download"
                      onClick={() => downloadQRCode(item.qrCode, `${item.data.itemName}-qr.png`)}
                      title="Descargar QR"
                    >
                      📥
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => {
                        if (window.confirm('¿Eliminar este QR del historial?')) {
                          handleDeleteSelected([item.id]);
                        }
                      }}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-history">
            <div className="empty-icon">📭</div>
            <h3>No hay códigos QR en el historial</h3>
            <p>Los códigos QR que generes aparecerán aquí</p>
            <div className="empty-actions">
              <button className="btn-primary" onClick={loadHistory}>
                Recargar
              </button>
              <button 
                className="btn-secondary" 
                onClick={handleClearAll}
                disabled={history.length === 0}
              >
                Limpiar Todo
              </button>
            </div>
          </div>
        )}
      </div>

      {filteredHistory.length > 0 && (
        <div className="history-footer">
          <div className="pagination-info">
            Mostrando {filteredHistory.length} de {history.length} elementos
          </div>
          <div className="bulk-actions">
            <button 
              className="btn-bulk-delete"
              onClick={handleClearAll}
              disabled={history.length === 0}
            >
              Limpiar Todo el Historial
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRHistory;