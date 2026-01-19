import React, { useRef } from 'react';
import './qr.css';

const QRPrintSheet = ({ qrItems, onClose, title = "Códigos QR", template = 'standard', itemsPerPage = 4 }) => {
  const printRef = useRef(null);

  const handlePrint = () => {
    const printContent = printRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Imprimir Códigos QR</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px;
              background: white;
            }
            .print-header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .print-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              page-break-inside: avoid;
            }
            .print-item {
              border: 1px solid #ddd;
              padding: 15px;
              text-align: center;
              page-break-inside: avoid;
            }
            .qr-code {
              max-width: 200px;
              margin: 0 auto 10px;
            }
            .item-name {
              font-weight: bold;
              margin-bottom: 5px;
              font-size: 14px;
            }
            .item-details {
              font-size: 12px;
              color: #666;
            }
            .page-break {
              page-break-after: always;
            }
            @media print {
              .no-print { display: none; }
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 100);
            }
          </script>
        </body>
      </html>
    `;
    
    window.print();
    
    setTimeout(() => {
      document.body.innerHTML = originalContent;
      window.location.reload();
    }, 100);
  };

  const handleDownloadPDF = () => {
    alert('La funcionalidad de descarga PDF está en desarrollo. Por ahora, use la opción de imprimir y seleccione "Guardar como PDF" en el diálogo de impresión.');
  };

  const renderTemplate = (item, index) => {
    switch (template) {
      case 'compact':
        return (
          <div key={item.id} className="print-item compact">
            <img src={item.qrCode} alt="QR Code" className="qr-image" />
            <div className="item-id">ID: {item.data.itemId}</div>
          </div>
        );
      
      case 'detailed':
        return (
          <div key={item.id} className="print-item detailed">
            <div className="print-header">
              <h4>{item.data.itemName}</h4>
              <div className="subtitle">Código QR de Inventario</div>
            </div>
            <img src={item.qrCode} alt="QR Code" className="qr-image" />
            <div className="print-details">
              <div className="detail-row">
                <span>ID:</span>
                <strong>{item.data.itemId}</strong>
              </div>
              <div className="detail-row">
                <span>Categoría:</span>
                <span>{item.data.category}</span>
              </div>
              <div className="detail-row">
                <span>Cantidad:</span>
                <span>{item.data.quantity} unidades</span>
              </div>
              <div className="detail-row">
                <span>Precio:</span>
                <span>${item.data.price.toFixed(2)}</span>
              </div>
              <div className="detail-row">
                <span>Ubicación:</span>
                <span>{item.data.location}</span>
              </div>
            </div>
          </div>
        );
      
      case 'label':
        return (
          <div key={item.id} className="print-item label">
            <div className="label-header">
              <div className="label-title">INVENTARIO</div>
              <div className="label-subtitle">Código QR</div>
            </div>
            <img src={item.qrCode} alt="QR Code" className="qr-image" />
            <div className="label-info">
              <div className="label-name">{item.data.itemName}</div>
              <div className="label-id">ID: {item.data.itemId}</div>
            </div>
            <div className="label-footer">
              <div className="label-date">
                {new Date(item.timestamp).toLocaleDateString()}
              </div>
            </div>
          </div>
        );
      
      default: // standard
        return (
          <div key={item.id} className="print-item standard">
            <div className="print-qr">
              <img src={item.qrCode} alt="QR Code" className="qr-image" />
            </div>
            <div className="print-info">
              <h5>{item.data.itemName}</h5>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">ID:</span>
                  <span className="value">{item.data.itemId}</span>
                </div>
                <div className="info-item">
                  <span className="label">Categoría:</span>
                  <span className="value">{item.data.category}</span>
                </div>
                <div className="info-item">
                  <span className="label">Cantidad:</span>
                  <span className="value">{item.data.quantity}</span>
                </div>
                <div className="info-item">
                  <span className="label">Precio:</span>
                  <span className="value">${item.data.price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  const pages = chunkArray(qrItems, itemsPerPage);

  return (
    <div className="qr-print-modal">
      <div className="print-modal-header">
        <h2>{title}</h2>
        <div className="print-actions">
          <button className="btn-print-action" onClick={handlePrint}>
            🖨️ Imprimir
          </button>
          <button className="btn-print-action" onClick={handleDownloadPDF}>
            📄 PDF
          </button>
          <button className="btn-close-print" onClick={onClose}>
            ×
          </button>
        </div>
      </div>

      <div className="print-modal-content">
        <div className="print-settings">
          <div className="setting-group">
            <label>Plantilla:</label>
            <select 
              className="form-control"
              value={template}
              onChange={(e) => {}}
              disabled
            >
              <option value="standard">Estándar</option>
              <option value="compact">Compacta</option>
              <option value="detailed">Detallada</option>
              <option value="label">Etiqueta</option>
            </select>
          </div>
          
          <div className="setting-group">
            <label>Elementos por página:</label>
            <select 
              className="form-control"
              value={itemsPerPage}
              onChange={(e) => {}}
              disabled
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="4">4</option>
              <option value="6">6</option>
              <option value="8">8</option>
            </select>
          </div>
          
          <div className="print-info">
            <p><strong>Total:</strong> {qrItems.length} códigos QR</p>
            <p><strong>Páginas:</strong> {pages.length}</p>
            <p><strong>Plantilla:</strong> {template}</p>
          </div>
        </div>

        <div ref={printRef} className="print-preview">
          {pages.map((page, pageIndex) => (
            <div key={pageIndex} className={`print-page ${template}`}>
              <div className="page-header">
                <h3>{title}</h3>
                <div className="page-subtitle">
                  Página {pageIndex + 1} de {pages.length} • {new Date().toLocaleDateString()}
                </div>
              </div>
              
              <div className={`print-grid grid-${template}`}>
                {page.map((item, itemIndex) => renderTemplate(item, itemIndex))}
              </div>
              
              <div className="page-footer">
                <div className="footer-text">
                  Sistema de Inventario • Generado el {new Date().toLocaleDateString()}
                </div>
              </div>
              
              {pageIndex < pages.length - 1 && (
                <div className="page-break"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="print-modal-footer">
        <div className="print-instructions">
          <p><strong>Instrucciones para imprimir:</strong></p>
          <ul>
            <li>Haz clic en "Imprimir" para abrir el diálogo de impresión</li>
            <li>En la configuración de impresión, selecciona "Diseño horizontal" si es necesario</li>
            <li>Ajusta los márgenes a "Mínimo" o "Ninguno" para mejor uso del espacio</li>
            <li>Para etiquetas adhesivas, usa papel de etiquetas A4</li>
          </ul>
        </div>
        
        <div className="footer-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={handlePrint}>
            Imprimir Ahora
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRPrintSheet;