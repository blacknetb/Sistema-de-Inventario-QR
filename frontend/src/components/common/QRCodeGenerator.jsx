import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/Common/common.css';

const QRCodeGenerator = ({
    value = '',
    size = 200,
    level = 'M', // L, M, Q, H
    includeMargin = false,
    bgColor = '#ffffff',
    fgColor = '#000000',
    title = 'Código QR',
    showDownload = true,
    showPrint = true,
    showCopy = false,
    className = '',
    onGenerate
}) => {
    const [qrValue, setQrValue] = useState(value);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [qrDataUrl, setQrDataUrl] = useState('');
    
    const canvasRef = useRef(null);

    // Generar QR
    const generateQR = async () => {
        if (!qrValue.trim()) {
            setError('Por favor ingresa un valor para generar el QR');
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            // Usar API externa para generar QR (ejemplo con qrcode.js)
            // En un proyecto real, usarías una librería como qrcode.react
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrValue)}&size=${size}x${size}&margin=${includeMargin ? 10 : 0}&color=${fgColor.replace('#', '')}&bgcolor=${bgColor.replace('#', '')}&qzone=1&format=svg`;
            
            setQrDataUrl(qrCodeUrl);
            
            if (onGenerate) {
                onGenerate(qrValue);
            }
        } catch (err) {
            setError('Error al generar el código QR');
            console.error('QR Generation Error:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    // Descargar QR
    const downloadQR = () => {
        if (!qrDataUrl) return;
        
        const link = document.createElement('a');
        link.href = qrDataUrl;
        link.download = `qr-code-${Date.now()}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Imprimir QR
    const printQR = () => {
        if (!qrDataUrl) return;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Imprimir Código QR</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            text-align: center; 
                            padding: 20px;
                        }
                        .print-container { 
                            max-width: 800px; 
                            margin: 0 auto;
                        }
                        .qr-image { 
                            max-width: 100%; 
                            height: auto;
                            margin: 20px 0;
                        }
                        .qr-info {
                            margin: 20px 0;
                            padding: 15px;
                            background: #f5f5f5;
                            border-radius: 5px;
                        }
                    </style>
                </head>
                <body>
                    <div class="print-container">
                        <h1>${title}</h1>
                        <div class="qr-info">
                            <p><strong>Valor:</strong> ${qrValue}</p>
                            <p><strong>Tamaño:</strong> ${size}px</p>
                            <p><strong>Generado:</strong> ${new Date().toLocaleString()}</p>
                        </div>
                        <img src="${qrDataUrl}" class="qr-image" alt="Código QR" />
                        <p>${document.title} - ${window.location.hostname}</p>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };

    // Copiar valor del QR
    const copyQRValue = async () => {
        try {
            await navigator.clipboard.writeText(qrValue);
            alert('Valor del QR copiado al portapapeles');
        } catch (err) {
            alert('Error al copiar el valor');
        }
    };

    // Efecto para generar QR cuando cambia el valor
    useEffect(() => {
        if (value && value.trim()) {
            generateQR();
        }
    }, [size, level, includeMargin, bgColor, fgColor]);

    return (
        <div className={`qrcode-generator ${className}`}>
            <div className="qrcode-header">
                <h3>{title}</h3>
                <div className="qrcode-controls">
                    {showDownload && (
                        <button
                            className="btn btn-sm btn-outline"
                            onClick={downloadQR}
                            disabled={!qrDataUrl || isGenerating}
                            title="Descargar QR"
                        >
                            <i className="fas fa-download"></i>
                        </button>
                    )}
                    
                    {showPrint && (
                        <button
                            className="btn btn-sm btn-outline"
                            onClick={printQR}
                            disabled={!qrDataUrl || isGenerating}
                            title="Imprimir QR"
                        >
                            <i className="fas fa-print"></i>
                        </button>
                    )}
                    
                    {showCopy && (
                        <button
                            className="btn btn-sm btn-outline"
                            onClick={copyQRValue}
                            disabled={!qrValue}
                            title="Copiar valor"
                        >
                            <i className="fas fa-copy"></i>
                        </button>
                    )}
                </div>
            </div>

            <div className="qrcode-content">
                {/* Input para valor del QR */}
                <div className="qrcode-input-section">
                    <div className="form-group">
                        <label>Texto o URL para el código QR</label>
                        <div className="input-group">
                            <input
                                type="text"
                                value={qrValue}
                                onChange={(e) => setQrValue(e.target.value)}
                                placeholder="Ingresa texto, URL, o cualquier dato..."
                                className="form-control"
                                disabled={isGenerating}
                            />
                            <button
                                className="btn btn-primary"
                                onClick={generateQR}
                                disabled={isGenerating}
                            >
                                {isGenerating ? (
                                    <>
                                        <span className="spinner-small"></span>
                                        Generando...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-qrcode"></i>
                                        Generar QR
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Controles avanzados */}
                    <div className="qrcode-settings">
                        <div className="setting-group">
                            <label>Tamaño: {size}px</label>
                            <input
                                type="range"
                                min="100"
                                max="500"
                                step="50"
                                value={size}
                                onChange={(e) => {
                                    const newSize = parseInt(e.target.value);
                                    // Actualizar size
                                }}
                                disabled={isGenerating}
                            />
                        </div>

                        <div className="setting-group">
                            <label>Color de fondo</label>
                            <input
                                type="color"
                                value={bgColor}
                                onChange={(e) => {
                                    // Actualizar bgColor
                                }}
                                disabled={isGenerating}
                            />
                        </div>

                        <div className="setting-group">
                            <label>Color del código</label>
                            <input
                                type="color"
                                value={fgColor}
                                onChange={(e) => {
                                    // Actualizar fgColor
                                }}
                                disabled={isGenerating}
                            />
                        </div>
                    </div>
                </div>

                {/* Vista previa del QR */}
                <div className="qrcode-preview-section">
                    {error && (
                        <div className="qrcode-error alert alert-danger">
                            <i className="fas fa-exclamation-circle"></i>
                            {error}
                        </div>
                    )}

                    {isGenerating ? (
                        <div className="qrcode-loading">
                            <div className="spinner"></div>
                            <p>Generando código QR...</p>
                        </div>
                    ) : qrDataUrl ? (
                        <div className="qrcode-preview">
                            <div className="qr-code-image">
                                <img 
                                    src={qrDataUrl} 
                                    alt="Código QR" 
                                    style={{ 
                                        width: `${size}px`, 
                                        height: `${size}px`,
                                        backgroundColor: bgColor
                                    }}
                                />
                            </div>
                            
                            <div className="qr-code-info">
                                <h4>Información del QR</h4>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <span className="info-label">Tamaño:</span>
                                        <span className="info-value">{size}px</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Calidad:</span>
                                        <span className="info-value">{level}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Contenido:</span>
                                        <span className="info-value truncate">{qrValue}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Caracteres:</span>
                                        <span className="info-value">{qrValue.length}</span>
                                    </div>
                                </div>
                                
                                <div className="qr-code-actions">
                                    <button
                                        className="btn btn-sm btn-outline"
                                        onClick={() => {
                                            const newWindow = window.open(qrDataUrl, '_blank');
                                            newWindow.focus();
                                        }}
                                    >
                                        <i className="fas fa-external-link-alt"></i>
                                        Ver en grande
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="qrcode-empty">
                            <i className="fas fa-qrcode"></i>
                            <h4>Genera tu código QR</h4>
                            <p>Ingresa un texto o URL y haz clic en "Generar QR"</p>
                        </div>
                    )}
                </div>

                {/* Información adicional */}
                <div className="qrcode-info-section">
                    <h4>¿Para qué sirve?</h4>
                    <div className="qrcode-uses">
                        <div className="use-item">
                            <i className="fas fa-link"></i>
                            <span>Compartir URLs</span>
                        </div>
                        <div className="use-item">
                            <i className="fas fa-id-card"></i>
                            <span>Información de contacto</span>
                        </div>
                        <div className="use-item">
                            <i className="fas fa-wifi"></i>
                            <span>Credenciales WiFi</span>
                        </div>
                        <div className="use-item">
                            <i className="fas fa-barcode"></i>
                            <span>Identificación de productos</span>
                        </div>
                    </div>
                    
                    <div className="qrcode-tips">
                        <h5>Consejos:</h5>
                        <ul>
                            <li>Usa URLs cortas para mejores resultados</li>
                            <li>Verifica que el código sea legible antes de imprimir</li>
                            <li>Prueba el código con diferentes lectores QR</li>
                        </ul>
                    </div>
                </div>
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
};

QRCodeGenerator.propTypes = {
    value: PropTypes.string,
    size: PropTypes.number,
    level: PropTypes.oneOf(['L', 'M', 'Q', 'H']),
    includeMargin: PropTypes.bool,
    bgColor: PropTypes.string,
    fgColor: PropTypes.string,
    title: PropTypes.string,
    showDownload: PropTypes.bool,
    showPrint: PropTypes.bool,
    showCopy: PropTypes.bool,
    className: PropTypes.string,
    onGenerate: PropTypes.func
};

export default QRCodeGenerator;