import React from 'react';
import './qr.css';

const QRCodeDisplay = ({ qrData, qrCode, itemData, onDownload, onPrint }) => {
  if (!qrData || !qrCode) return null;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getQRInfo = () => {
    const info = [];
    if (qrData.itemId) info.push(`ID: ${qrData.itemId}`);
    if (qrData.itemName) info.push(`Producto: ${qrData.itemName}`);
    if (qrData.category) info.push(`Categoría: ${qrData.category}`);
    if (qrData.quantity) info.push(`Cantidad: ${qrData.quantity}`);
    if (qrData.price) info.push(`Precio: ${formatPrice(qrData.price)}`);
    if (qrData.location) info.push(`Ubicación: ${qrData.location}`);
    if (qrData.generatedAt) info.push(`Generado: ${new Date(qrData.generatedAt).toLocaleDateString()}`);
    
    return info;
  };

  const handleCopyData = () => {
    const textToCopy = getQRInfo().join('\n');
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        alert('Datos copiados al portapapeles');
      })
      .catch(err => {
        console.error('Error copying text: ', err);
      });
  };

  return (
    <div className="qr-display-container">
      <div className="qr-display-header">
        <h3>Código QR Generado</h3>
        <div className="qr-actions">
          {onDownload && (
            <button className="btn-action" onClick={onDownload} title="Descargar QR">
              📥
            </button>
          )}
          {onPrint && (
            <button className="btn-action" onClick={onPrint} title="Imprimir">
              🖨️
            </button>
          )}
          <button className="btn-action" onClick={handleCopyData} title="Copiar datos">
            📋
          </button>
        </div>
      </div>

      <div className="qr-display-content">
        <div className="qr-code-wrapper">
          <img src={qrCode} alt="Código QR" className="qr-code-image" />
          <div className="qr-watermark">
            <span className="watermark-text">INVENTARIO</span>
          </div>
        </div>

        <div className="qr-details">
          <div className="details-header">
            <h4>Información del Producto</h4>
            <span className="qr-status active">✓ VÁLIDO</span>
          </div>
          
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">ID del Producto:</span>
              <span className="detail-value">{qrData.itemId}</span>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">Nombre:</span>
              <span className="detail-value highlight">{qrData.itemName}</span>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">Categoría:</span>
              <span className="detail-value category-badge">{qrData.category}</span>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">Cantidad en Stock:</span>
              <span className="detail-value">
                <span className={`quantity-indicator ${qrData.quantity > 10 ? 'high' : qrData.quantity > 0 ? 'medium' : 'low'}`}>
                  {qrData.quantity} unidades
                </span>
              </span>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">Precio Unitario:</span>
              <span className="detail-value price">{formatPrice(qrData.price)}</span>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">Valor Total:</span>
              <span className="detail-value total-price">
                {formatPrice(qrData.price * qrData.quantity)}
              </span>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">Ubicación:</span>
              <span className="detail-value location">
                📍 {qrData.location}
              </span>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">Generado el:</span>
              <span className="detail-value">
                {new Date(qrData.generatedAt || Date.now()).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="qr-instructions">
            <h5>Instrucciones:</h5>
            <ul>
              <li>Imprime este código QR y pégalo en el producto o su empaque</li>
              <li>Escanea el código para ver la información del producto</li>
              <li>Mantén el código limpio y legible</li>
              <li>Actualiza el código si cambia la información del producto</li>
            </ul>
          </div>

          <div className="qr-technical-info">
            <div className="tech-item">
              <span>Tipo de Datos:</span>
              <code>JSON</code>
            </div>
            <div className="tech-item">
              <span>Tamaño del QR:</span>
              <span>400x400 px</span>
            </div>
            <div className="tech-item">
              <span>Versión QR:</span>
              <span>7</span>
            </div>
          </div>
        </div>
      </div>

      <div className="qr-display-footer">
        <div className="footer-note">
          <p>Este código QR contiene información estructurada del producto para su gestión en inventario.</p>
        </div>
        <div className="footer-actions">
          <button className="btn-secondary" onClick={() => window.print()}>
            Imprimir Esta Página
          </button>
          <button className="btn-secondary" onClick={() => alert('Función de compartir en desarrollo')}>
            Compartir
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplay;