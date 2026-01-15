import React, { useState, useEffect } from 'react';
import '../../assets/styles/qr.css';

/**
 * Componente QRCodeDisplay - Visualizador de códigos QR
 * Muestra códigos QR con opciones de personalización
 */
const QRCodeDisplay = ({ data, size = 200, color = '#000000', bgColor = '#FFFFFF', includeLogo = false, logoSize = 50 }) => {
    const [qrCode, setQrCode] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showInfo, setShowInfo] = useState(false);

    // Simular datos para el QR
    const qrContent = data?.customData || JSON.stringify({
        type: 'product',
        id: data?.productId || 'unknown',
        name: data?.productName || 'Producto sin nombre',
        sku: data?.sku || 'SKU-000',
        price: data?.price || 0,
        stock: data?.stock || 0,
        category: data?.category || 'General',
        timestamp: new Date().toISOString()
    }, null, 2);

    useEffect(() => {
        generateQRCode();
    }, [qrContent, size, color, bgColor, includeLogo, logoSize]);

    const generateQRCode = () => {
        setIsLoading(true);
        setError('');
        
        try {
            // En una aplicación real, aquí se generaría el QR con una librería
            // Por ahora, creamos una representación visual simulada
            
            const qrData = {
                content: qrContent,
                size: size,
                color: color,
                bgColor: bgColor,
                includeLogo: includeLogo,
                logoSize: logoSize,
                generatedAt: new Date().toISOString()
            };
            
            // Simular tiempo de generación
            setTimeout(() => {
                setQrCode(qrData);
                setIsLoading(false);
            }, 300);
            
        } catch (err) {
            setError('Error al generar el código QR');
            setIsLoading(false);
            console.error('QR Generation Error:', err);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(qrContent)
            .then(() => {
                alert('Contenido del QR copiado al portapapeles');
            })
            .catch(err => {
                console.error('Error al copiar:', err);
            });
    };

    const getQRInfo = () => {
        if (!qrCode) return null;
        
        try {
            const parsed = JSON.parse(qrCode.content);
            return {
                dataSize: qrCode.content.length,
                type: parsed.type || 'unknown',
                productName: parsed.name,
                sku: parsed.sku,
                timestamp: new Date(parsed.timestamp).toLocaleString()
            };
        } catch (err) {
            return {
                dataSize: qrCode.content.length,
                type: 'raw_text',
                timestamp: new Date(qrCode.generatedAt).toLocaleString()
            };
        }
    };

    const qrInfo = getQRInfo();

    return (
        <div className="qr-display-container">
            <div className="qr-display-header">
                <h3 className="display-title">Código QR</h3>
                <div className="display-actions">
                    <button 
                        className="action-btn"
                        onClick={generateQRCode}
                        title="Regenerar QR"
                    >
                        <i className="action-icon">🔄</i>
                    </button>
                    <button 
                        className="action-btn"
                        onClick={copyToClipboard}
                        title="Copiar contenido"
                    >
                        <i className="action-icon">📋</i>
                    </button>
                    <button 
                        className="action-btn"
                        onClick={() => setShowInfo(!showInfo)}
                        title={showInfo ? "Ocultar información" : "Mostrar información"}
                    >
                        <i className="action-icon">ℹ️</i>
                    </button>
                </div>
            </div>

            <div className="qr-display-content">
                {isLoading ? (
                    <div className="qr-loading">
                        <div className="loading-spinner"></div>
                        <p>Generando código QR...</p>
                    </div>
                ) : error ? (
                    <div className="qr-error">
                        <i className="error-icon">❌</i>
                        <p>{error}</p>
                        <button 
                            className="btn btn-secondary"
                            onClick={generateQRCode}
                        >
                            Reintentar
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="qr-preview" style={{ width: size, height: size }}>
                            <div 
                                className="qr-background"
                                style={{ 
                                    backgroundColor: bgColor,
                                    width: '100%',
                                    height: '100%',
                                    position: 'relative'
                                }}
                            >
                                {/* Simulación de patrón QR */}
                                <div className="qr-pattern">
                                    {/* Patrón de posición (esquinas) */}
                                    <div className="qr-position top-left"></div>
                                    <div className="qr-position top-right"></div>
                                    <div className="qr-position bottom-left"></div>
                                    
                                    {/* Patrón de alineación */}
                                    <div className="qr-alignment"></div>
                                    
                                    {/* Puntos de datos simulados */}
                                    {[...Array(64)].map((_, i) => {
                                        const row = Math.floor(i / 8);
                                        const col = i % 8;
                                        const shouldShow = Math.random() > 0.4;
                                        
                                        return shouldShow && (
                                            <div
                                                key={i}
                                                className="qr-data-point"
                                                style={{
                                                    position: 'absolute',
                                                    left: `${12.5 * col + 12.5}%`,
                                                    top: `${12.5 * row + 12.5}%`,
                                                    width: '12.5%',
                                                    height: '12.5%',
                                                    backgroundColor: color,
                                                    borderRadius: '2px'
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                                
                                {/* Logo centrado */}
                                {includeLogo && (
                                    <div 
                                        className="qr-logo-overlay"
                                        style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            width: `${logoSize}%`,
                                            height: `${logoSize}%`,
                                            backgroundColor: '#FFFFFF',
                                            borderRadius: '8px',
                                            border: `2px solid ${color}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <span className="logo-text" style={{ color: color, fontSize: '12px' }}>
                                            LOGO
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="qr-meta">
                            <div className="meta-item">
                                <span className="meta-label">Tamaño:</span>
                                <span className="meta-value">{size}px</span>
                            </div>
                            <div className="meta-item">
                                <span className="meta-label">Color:</span>
                                <span className="meta-value">
                                    <span 
                                        className="color-dot"
                                        style={{ backgroundColor: color }}
                                    ></span>
                                    {color}
                                </span>
                            </div>
                            <div className="meta-item">
                                <span className="meta-label">Contenido:</span>
                                <span className="meta-value">{qrInfo?.type}</span>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {showInfo && qrInfo && !isLoading && !error && (
                <div className="qr-info-panel">
                    <h4 className="info-panel-title">
                        <i className="info-icon">📊</i>
                        Información del Código
                    </h4>
                    
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-label">Tipo:</span>
                            <span className="info-value">{qrInfo.type}</span>
                        </div>
                        
                        {qrInfo.productName && (
                            <div className="info-item">
                                <span className="info-label">Producto:</span>
                                <span className="info-value">{qrInfo.productName}</span>
                            </div>
                        )}
                        
                        {qrInfo.sku && (
                            <div className="info-item">
                                <span className="info-label">SKU:</span>
                                <span className="info-value">{qrInfo.sku}</span>
                            </div>
                        )}
                        
                        <div className="info-item">
                            <span className="info-label">Tamaño datos:</span>
                            <span className="info-value">{qrInfo.dataSize} caracteres</span>
                        </div>
                        
                        <div className="info-item">
                            <span className="info-label">Generado:</span>
                            <span className="info-value">{qrInfo.timestamp}</span>
                        </div>
                        
                        <div className="info-item">
                            <span className="info-label">ID:</span>
                            <span className="info-value">{qrInfo.id || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <div className="qr-content-preview">
                        <h5 className="content-title">Contenido del QR:</h5>
                        <pre className="content-code">
                            {typeof qrContent === 'string' 
                                ? qrContent.length > 200 
                                    ? qrContent.substring(0, 200) + '...'
                                    : qrContent
                                : JSON.stringify(qrContent, null, 2)
                            }
                        </pre>
                    </div>
                </div>
            )}

            <div className="qr-actions">
                <button 
                    className="btn btn-primary"
                    onClick={generateQRCode}
                    disabled={isLoading}
                >
                    {isLoading ? 'Generando...' : 'Actualizar QR'}
                </button>
                
                <button 
                    className="btn btn-secondary"
                    onClick={copyToClipboard}
                    disabled={isLoading || error}
                >
                    <i className="btn-icon">📋</i>
                    Copiar Contenido
                </button>
            </div>
        </div>
    );
};

export default QRCodeDisplay;