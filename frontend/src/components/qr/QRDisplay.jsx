import React, { useState, useRef, useMemo, useCallback } from 'react';
import QRCode from 'qrcode.react';
import Card from '../common/Card';
import PropTypes from 'prop-types';
import Button from '../common/Button';
import { 
  FiDownload, 
  FiCopy, 
  FiPrinter, 
  FiShare2, 
  FiCheck, 
  FiShield,
  FiLock,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import { useNotification } from '../../context/NotificationContext';
import './assets/styles/index.css';

// ✅ Componente SensitiveInfo optimizado con React.memo
const SensitiveInfo = React.memo(({ label, value, hidden = false }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="sensitive-info">
      <span className="sensitive-info-label">{label}</span>
      <div className="sensitive-info-value">
        {hidden ? (
          <>
            {visible ? (
              <span className="sensitive-info-visible">{value}</span>
            ) : (
              <span className="sensitive-info-hidden">••••••••</span>
            )}
            <button
              type="button"
              onClick={() => setVisible(!visible)}
              className="sensitive-info-toggle"
              aria-label={visible ? 'Ocultar información' : 'Mostrar información'}
            >
              {visible ? <FiEyeOff size={14} /> : <FiEye size={14} />}
            </button>
          </>
        ) : (
          <span className="sensitive-info-plain">{value}</span>
        )}
      </div>
    </div>
  );
});

SensitiveInfo.displayName = 'SensitiveInfo';

const QRDisplay = ({ qrData, product, onDownload, onCopy }) => {
  const { success } = useNotification();
  const [copied, setCopied] = useState(false);
  const [showRawData, setShowRawData] = useState(false);
  const printContentRef = useRef(null);

  // ✅ Validación robusta de qrData
  const isClosedQR = useMemo(() => {
    if (!qrData) return false;
    return qrData.is_closed === true || 
           qrData.security?.is_closed === true ||
           qrData.raw_data?.security?.is_closed === true;
  }, [qrData]);

  // ✅ Función optimizada para obtener contenido QR
  const getQRContent = useMemo(() => {
    if (!qrData) return '';
    
    if (isClosedQR && qrData.encoded_string) {
      return qrData.encoded_string;
    }
    
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    
    return JSON.stringify({
      product_id: product?.id || qrData.product_id,
      sku: product?.sku || qrData.sku,
      name: product?.name || qrData.name,
      qr_code: qrData.code || qrData.id,
      generated_at: qrData.generated_at || qrData.created_at || new Date().toISOString(),
      product_url: product?.id ? `${baseUrl}/products/${product.id}` : '',
      timestamp: Date.now()
    });
  }, [qrData, product, isClosedQR]);

  // ✅ Función para copiar código con mejor manejo de errores
  const handleCopy = useCallback(async () => {
    try {
      let textToCopy = '';
      
      if (isClosedQR) {
        textToCopy = qrData?.display_code || qrData?.code || qrData?.id || '';
      } else {
        textToCopy = qrData?.code || qrData?.id || '';
      }
      
      if (!textToCopy) {
        throw new Error('No hay código para copiar');
      }
      
      await navigator.clipboard.writeText(textToCopy);
      success('Código copiado al portapapeles');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      if (onCopy) onCopy(textToCopy);
    } catch (err) {
      console.error('Error al copiar:', err);
      success('Error al copiar el código');
    }
  }, [qrData, isClosedQR, success, onCopy]);

  // ✅ Función de impresión
  const handlePrint = useCallback(() => {
    if (!printContentRef.current) {
      console.error('Contenido de impresión no encontrado');
      return;
    }

    if (typeof window === 'undefined') return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      success('Por favor, permite ventanas emergentes para imprimir');
      return;
    }
    
    const qrType = isClosedQR ? 'CERRADO' : 'ABIERTO';
    const productName = product?.name || 'Producto';
    const productSku = product?.sku || 'N/A';
    const displayCode = isClosedQR ? (qrData.display_code || qrData.code) : qrData?.code;
    const currentDate = new Date().toLocaleString();
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Código QR ${qrType} - ${productName}</title>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: 'Segoe UI', system-ui, sans-serif; 
            margin: 0; 
            padding: 20px; 
            color: #333;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .container { 
            max-width: 400px; 
            margin: 0 auto; 
            padding: 20px;
            border: 2px solid ${isClosedQR ? '#2563eb' : '#10b981'};
            border-radius: 8px;
            position: relative;
          }
          .qr-type-badge {
            position: absolute;
            top: -12px;
            left: 50%;
            transform: translateX(-50%);
            background: ${isClosedQR ? '#2563eb' : '#10b981'};
            color: white;
            padding: 4px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .header { 
            margin-bottom: 20px; 
            text-align: center;
            border-bottom: 2px solid #e5e7eb; 
            padding-bottom: 15px;
          }
          h1 { 
            margin: 0; 
            color: #1f2937; 
            font-size: 20px; 
            font-weight: 700;
          }
          h2 { 
            margin: 8px 0 0; 
            color: #6b7280; 
            font-size: 14px;
            font-weight: 400;
          }
          .qr-container { 
            margin: 20px 0; 
            text-align: center;
          }
          .qr-code { 
            display: inline-block;
            padding: 10px;
            background: white;
            border-radius: 4px;
            border: 1px solid #e5e7eb;
          }
          .info { 
            margin: 20px 0; 
            background: #f9fafb;
            padding: 15px;
            border-radius: 6px;
            font-size: 14px;
          }
          .info-row { 
            margin-bottom: 10px; 
            display: flex;
            justify-content: space-between;
            padding-bottom: 8px;
            border-bottom: 1px dashed #d1d5db;
          }
          .info-row:last-child { 
            border-bottom: none; 
            margin-bottom: 0;
          }
          .label { 
            font-weight: 600; 
            color: #6b7280; 
          }
          .value { 
            color: #1f2937; 
            text-align: right;
            max-width: 200px;
            word-break: break-all;
          }
          .footer { 
            margin-top: 20px; 
            padding-top: 15px; 
            border-top: 1px solid #e5e7eb; 
            color: #9ca3af; 
            font-size: 11px;
            text-align: center;
          }
          .security-note {
            background: ${isClosedQR ? '#dbeafe' : '#d1fae5'};
            border: 1px solid ${isClosedQR ? '#93c5fd' : '#a7f3d0'};
            padding: 10px;
            border-radius: 6px;
            margin: 15px 0;
            font-size: 12px;
          }
          @media print { 
            body { margin: 0; padding: 0; }
            .container { border: none; max-width: none; }
            @page { margin: 0.5cm; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="qr-type-badge">QR ${qrType}</div>
          <div class="header">
            <h1>Código QR ${isClosedQR ? 'Cerrado' : 'Abierto'}</h1>
            <h2>${productName}</h2>
          </div>
          
          <div class="qr-container">
            <div class="qr-code">
              ${printContentRef.current.innerHTML}
            </div>
          </div>
          
          ${isClosedQR ? `
          <div class="security-note">
            <strong>🔒 CÓDIGO QR CERRADO</strong><br>
            Este código solo puede ser leído por el sistema de inventario oficial.
          </div>
          ` : ''}
          
          <div class="info">
            <div class="info-row">
              <span class="label">SKU:</span>
              <span class="value">${productSku}</span>
            </div>
            <div class="info-row">
              <span class="label">Código:</span>
              <span class="value">${displayCode || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Generado:</span>
              <span class="value">${currentDate}</span>
            </div>
            ${product?.current_stock !== undefined ? `
            <div class="info-row">
              <span class="label">Stock:</span>
              <span class="value">${product.current_stock} ${product?.unit || 'unidad'}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <p><strong>Sistema de Inventario</strong> • ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
        
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
    `);
    
    printWindow.document.close();
  }, [qrData, product, isClosedQR, success]);

  // ✅ Función de compartir mejorada
  const handleShare = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    const shareData = {
      title: `Código QR ${isClosedQR ? 'Cerrado' : ''} - ${product?.name || 'Producto'}`,
      text: `Código QR ${isClosedQR ? 'cerrado' : 'abierto'} para ${product?.name || 'producto'}`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          await navigator.clipboard.writeText(window.location.href);
          success('URL copiada al portapapeles');
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        success('URL copiada al portapapeles');
      } catch (err) {
        console.error('Error copiando URL:', err);
      }
    }
  }, [product, isClosedQR, success]);

  // ✅ Función de descarga optimizada
  const handleDownload = useCallback(() => {
    if (onDownload) {
      onDownload(qrData);
      return;
    }

    try {
      const canvas = document.getElementById('qr-canvas');
      if (!canvas) {
        throw new Error('Canvas no encontrado');
      }

      const fileName = `${isClosedQR ? 'INVQR-' : 'QR-'}${product?.sku || 'CODE'}-${Date.now()}.png`;
      
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Error generando blob');
        }
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        success('QR descargado exitosamente');
      }, 'image/png', 1.0);
    } catch (err) {
      console.error('Error descargando QR:', err);
      success('Error al descargar QR');
    }
  }, [qrData, product, isClosedQR, onDownload, success]);

  if (!qrData) {
    return (
      <Card title="Código QR">
        <div className="qr-display-empty">
          No hay datos de código QR disponibles
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title={
        <div className="qr-display-header">
          <div className="qr-display-title">
            {isClosedQR ? (
              <FiLock className="qr-icon-closed" />
            ) : (
              <FiShield className="qr-icon-open" />
            )}
            <span>Código QR {isClosedQR ? 'Cerrado' : 'Generado'}</span>
          </div>
          {isClosedQR && (
            <span className="qr-badge-closed">
              Cerrado
            </span>
          )}
        </div>
      }
      className="qr-display-card"
    >
      <div className="qr-display-content">
        {isClosedQR && (
          <div className="qr-info-banner">
            <div className="qr-info-content">
              <FiShield className="qr-info-icon" />
              <div>
                <h4>🔒 Código QR Cerrado</h4>
                <p>
                  Este código QR solo puede ser leído y validado por el sistema de inventario oficial.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="qr-preview-container">
          <div 
            ref={printContentRef}
            className={`qr-code-wrapper ${isClosedQR ? 'qr-closed' : 'qr-open'}`}
          >
            <QRCode
              id="qr-canvas"
              value={getQRContent}
              size={256}
              level="H"
              includeMargin={true}
              renderAs="svg"
              bgColor="#FFFFFF"
              fgColor={isClosedQR ? "#1E40AF" : "#000000"}
              imageSettings={isClosedQR ? {
                src: '/assets/logo-shield.png',
                height: 40,
                width: 40,
                excavate: true,
              } : undefined}
            />
          </div>
          
          <div className="qr-preview-info">
            <div className="qr-product-name">{product?.name || 'Producto'}</div>
            <div className="qr-product-sku">{product?.sku || 'Sin SKU'}</div>
            <div className={`qr-code-display ${isClosedQR ? 'qr-code-closed' : 'qr-code-open'}`}>
              {isClosedQR ? (qrData.display_code || qrData.code) : qrData?.code}
            </div>
          </div>
        </div>

        <div className="qr-actions-grid">
          <Button
            variant="outline"
            fullWidth
            size="small"
            startIcon={<FiDownload size={16} />}
            onClick={handleDownload}
            title="Descargar imagen PNG"
            className={isClosedQR ? 'btn-qr-closed' : ''}
          >
            Descargar
          </Button>
          
          <Button
            variant="outline"
            fullWidth
            size="small"
            startIcon={copied ? <FiCheck size={16} /> : <FiCopy size={16} />}
            onClick={handleCopy}
            className={`${copied ? 'btn-copied' : ''} ${isClosedQR ? 'btn-qr-closed' : ''}`}
            title={copied ? '¡Copiado!' : 'Copiar código'}
          >
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
          
          <Button
            variant="outline"
            fullWidth
            size="small"
            startIcon={<FiPrinter size={16} />}
            onClick={handlePrint}
            title="Imprimir código QR"
            className={isClosedQR ? 'btn-qr-closed' : ''}
          >
            Imprimir
          </Button>
          
          <Button
            variant="outline"
            fullWidth
            size="small"
            startIcon={<FiShare2 size={16} />}
            onClick={handleShare}
            title="Compartir código QR"
            className={isClosedQR ? 'btn-qr-closed' : ''}
          >
            Compartir
          </Button>
        </div>

        <div className={`qr-details-container ${isClosedQR ? 'qr-details-closed' : 'qr-details-open'}`}>
          <div className="qr-details-header">
            <h4>Información del QR</h4>
            {isClosedQR && (
              <button
                type="button"
                onClick={() => setShowRawData(!showRawData)}
                className="qr-raw-data-toggle"
              >
                {showRawData ? <FiEyeOff className="icon" /> : <FiEye className="icon" />}
                {showRawData ? 'Ocultar' : 'Ver datos'}
              </button>
            )}
          </div>
          
          <div className="qr-details-list">
            <SensitiveInfo 
              label="Producto:" 
              value={product?.name || 'No disponible'} 
            />
            
            <SensitiveInfo 
              label="SKU:" 
              value={product?.sku || 'No disponible'} 
            />
            
            <SensitiveInfo 
              label="Código:" 
              value={isClosedQR ? (qrData.display_code || qrData.code) : qrData?.code} 
              hidden={isClosedQR}
            />
            
            <SensitiveInfo 
              label="Tipo:" 
              value={isClosedQR ? 'Cerrado' : 'Abierto'} 
            />
            
            <SensitiveInfo 
              label="Generado:" 
              value={new Date(qrData.created_at || qrData.generated_at || Date.now()).toLocaleString()} 
            />
            
            {product?.current_stock !== undefined && (
              <SensitiveInfo 
                label="Stock:" 
                value={`${product.current_stock} ${product?.unit || 'unidad'}`} 
              />
            )}
          </div>
        </div>

        {isClosedQR && showRawData && qrData.raw_data && (
          <div className="qr-raw-data">
            <h4>Datos del QR Cerrado</h4>
            <div className="qr-raw-data-content">
              <pre>
                {JSON.stringify(qrData.raw_data, null, 2)}
              </pre>
            </div>
            <p className="qr-raw-data-note">
              Datos encriptados dentro del código QR. Solo visibles con autorización.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

const Grid = ({ qrCodes = [], products = [], onDownload, onCopy }) => {
  const { success } = useNotification();
  const [copiedCodes, setCopiedCodes] = useState({});

  const handleCopy = useCallback(
    async (code, displayCode) => {
      try {
        await navigator.clipboard.writeText(displayCode || code);
        success('Código copiado');

        setCopiedCodes(prev => ({ ...prev, [code]: true }));
        setTimeout(() => {
          setCopiedCodes(prev => ({ ...prev, [code]: false }));
        }, 2000);

        if (onCopy) onCopy(code);
      } catch (err) {
        console.error('Error copiando:', err);
      }
    },
    [success, onCopy]
  );

  if (!qrCodes || qrCodes.length === 0) {
    return (
      <div className="qr-grid-empty">
        <div className="qr-grid-empty-icon">
          <FiLock />
        </div>
        <h3>No hay códigos QR</h3>
        <p>Genera códigos QR para verlos aquí</p>
      </div>
    );
  }

  return (
    <div className="qr-grid">
      {qrCodes.map((qr, index) => {
        const product = products?.find(p => p.id === qr.product_id) || qr.product;
        const isClosedQR = qr.is_closed === true || qr.security?.is_closed === true;
        const displayCode = isClosedQR ? qr.display_code : qr.code;
        const isCopied = copiedCodes[qr.code];

        return (
          <div
            key={qr.id || index}
            className={`qr-grid-item ${isClosedQR ? 'qr-grid-item-closed' : 'qr-grid-item-open'}`}
          >
            <div className="qr-grid-item-content">
              <div className={`qr-grid-badge ${isClosedQR ? 'qr-grid-badge-closed' : 'qr-grid-badge-open'}`}>
                {isClosedQR ? 'Cerrado' : 'Abierto'}
              </div>

              <div className={`qr-grid-code ${isClosedQR ? 'qr-grid-code-closed' : 'qr-grid-code-open'}`}>
                <QRCode
                  value={isClosedQR ? (qr.encoded_string || qr.code) : qr.code}
                  size={120}
                  level="H"
                  includeMargin={true}
                  bgColor="#FFFFFF"
                  fgColor={isClosedQR ? '#1E40AF' : '#000000'}
                />
              </div>

              <div className="qr-grid-info">
                <div className="qr-grid-product-name">
                  {product?.name || 'Sin nombre'}
                </div>
                <div className="qr-grid-product-sku">{product?.sku || 'N/A'}</div>
                <div className="qr-grid-code-display">
                  {displayCode?.substring(0, 20)}...
                </div>

                {product && (
                  <div className="qr-grid-stock">
                    Stock: {product.current_stock || '0'} {product.unit || 'unidad'}
                  </div>
                )}
              </div>

              <div className="qr-grid-actions">
                <button
                  onClick={() => onDownload?.(qr)}
                  title="Descargar QR"
                  className="qr-grid-action-btn"
                >
                  <FiDownload size={16} />
                </button>

                <button
                  onClick={() => handleCopy(qr.code, displayCode)}
                  className={`qr-grid-action-btn ${isCopied ? 'qr-grid-action-copied' : ''}`}
                  title={isCopied ? 'Copiado' : 'Copiar código'}
                >
                  {isCopied ? <FiCheck size={16} /> : <FiCopy size={16} />}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

Grid.propTypes = {
  qrCodes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      code: PropTypes.string.isRequired,
      display_code: PropTypes.string,
      encoded_string: PropTypes.string,
      product_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      product: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
        sku: PropTypes.string,
        current_stock: PropTypes.number,
        unit: PropTypes.string,
      }),
      is_closed: PropTypes.bool,
      security: PropTypes.shape({
        is_closed: PropTypes.bool,
      }),
    })
  ).isRequired,
  products: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      sku: PropTypes.string,
      current_stock: PropTypes.number,
      unit: PropTypes.string,
    })
  ),
  onDownload: PropTypes.func,
  onCopy: PropTypes.func,
};

Grid.defaultProps = {
  products: [],
  onDownload: null,
  onCopy: null,
};

QRDisplay.Grid = React.memo(Grid);
QRDisplay.Grid.displayName = 'QRDisplayGrid';

export default QRDisplay;