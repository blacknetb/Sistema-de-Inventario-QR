import React, { useState } from 'react';
import './qr.css';

const QRItemCard = ({ qrItem, itemData, showScanInfo = false, onDownload, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const data = qrItem?.data || itemData;
  const qrCode = qrItem?.qrCode;
  
  if (!data) return null;

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else if (qrCode) {
      const link = document.createElement('a');
      link.href = qrCode;
      link.download = `${data.itemName}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleCopyData = () => {
    const textToCopy = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        alert('Datos copiados al portapapeles');
      })
      .catch(err => {
        console.error('Error copying text:', err);
      });
  };

  return (
    <div className={`qr-item-card ${isExpanded ? 'expanded' : ''}`}>
      <div className="card-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="header-left">
          {qrCode && (
            <div className="qr-preview">
              <img src={qrCode} alt="QR Code" className="qr-thumbnail" />
            </div>
          )}
          <div className="item-info">
            <h4 className="item-name">{data.itemName}</h4>
            <div className="item-meta">
              <span className="meta-item">
                <strong>ID:</strong> {data.itemId}
              </span>
              <span className="meta-item">
                <strong>Categoría:</strong> {data.category}
              </span>
              {showScanInfo && data.scanDate && (
                <span className="meta-item">
                  <strong>Escaneado:</strong> {data.scanDate} {data.scanTime}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="header-right">
          <div className="item-status">
            <span className={`stock-badge ${data.quantity > 10 ? 'high' : data.quantity > 0 ? 'medium' : 'low'}`}>
              {data.quantity} en stock
            </span>
          </div>
          <div className="item-actions">
            <button 
              className="action-btn expand"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              title={isExpanded ? "Contraer" : "Expandir"}
            >
              {isExpanded ? '▲' : '▼'}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="card-content">
          <div className="content-grid">
            <div className="grid-column">
              <div className="detail-group">
                <h5>Información del Producto</h5>
                <div className="detail-item">
                  <span className="detail-label">Nombre Completo:</span>
                  <span className="detail-value">{data.itemName}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Categoría:</span>
                  <span className="detail-value category-tag">{data.category}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Cantidad:</span>
                  <span className="detail-value">
                    <span className={`quantity-display ${data.quantity > 10 ? 'high' : data.quantity > 0 ? 'medium' : 'low'}`}>
                      {data.quantity} unidades
                    </span>
                  </span>
                </div>
              </div>

              <div className="detail-group">
                <h5>Información Financiera</h5>
                <div className="detail-item">
                  <span className="detail-label">Precio Unitario:</span>
                  <span className="detail-value price">{formatPrice(data.price)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Valor Total:</span>
                  <span className="detail-value total-price">
                    {formatPrice(data.price * data.quantity)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid-column">
              <div className="detail-group">
                <h5>Ubicación y Fecha</h5>
                <div className="detail-item">
                  <span className="detail-label">Ubicación:</span>
                  <span className="detail-value location">
                    📍 {data.location || 'No especificada'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Generado el:</span>
                  <span className="detail-value">
                    {formatDate(qrItem?.timestamp || data.generatedAt)}
                    {formatTime(qrItem?.timestamp || data.generatedAt) && ` a las ${formatTime(qrItem?.timestamp || data.generatedAt)}`}
                  </span>
                </div>
                {showScanInfo && (
                  <div className="detail-item">
                    <span className="detail-label">Último Escaneo:</span>
                    <span className="detail-value scan-info">
                      {data.scanDate} {data.scanTime}
                    </span>
                  </div>
                )}
              </div>

              {qrCode && (
                <div className="detail-group">
                  <h5>Código QR</h5>
                  <div className="qr-display">
                    <img src={qrCode} alt="Código QR" className="qr-expanded" />
                    <div className="qr-actions">
                      <button className="btn-small" onClick={handleDownload}>
                        Descargar QR
                      </button>
                      <button className="btn-small" onClick={handleCopyData}>
                        Copiar Datos
                      </button>
                      {onDelete && (
                        <button className="btn-small delete" onClick={onDelete}>
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {data.description && (
            <div className="description-section">
              <h5>Descripción:</h5>
              <p>{data.description}</p>
            </div>
          )}

          <div className="technical-info">
            <div className="tech-item">
              <span>ID Único:</span>
              <code>{qrItem?.id || data.itemId}</code>
            </div>
            <div className="tech-item">
              <span>Tipo de Datos:</span>
              <code>JSON</code>
            </div>
            <div className="tech-item">
              <span>Versión QR:</span>
              <span>7</span>
            </div>
          </div>
        </div>
      )}

      <div className="card-footer">
        <div className="footer-actions">
          {qrCode && (
            <button className="footer-btn" onClick={handleDownload}>
              <span className="btn-icon">📥</span>
              Descargar
            </button>
          )}
          <button className="footer-btn" onClick={handleCopyData}>
            <span className="btn-icon">📋</span>
            Copiar Datos
          </button>
          <button 
            className="footer-btn" 
            onClick={() => window.print()}
          >
            <span className="btn-icon">🖨️</span>
            Imprimir
          </button>
        </div>
        <div className="footer-meta">
          <span className="meta-text">
            {showScanInfo ? 'Escaneado' : 'Generado'} el {formatDate(qrItem?.timestamp || data.generatedAt)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default QRItemCard;