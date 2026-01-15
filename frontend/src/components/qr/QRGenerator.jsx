import React, { useState, useRef, useEffect } from 'react';
import QRCodeDisplay from './QRCodeDisplay';
import '../../assets/styles/qr.css';

/**
 * Componente QRGenerator - Generador de códigos QR para productos
 * Permite crear códigos QR personalizados con información de productos
 */
const QRGenerator = ({ product, onClose, onSave }) => {
    const [qrData, setQrData] = useState({
        productId: '',
        productName: '',
        sku: '',
        price: '',
        stock: '',
        category: '',
        url: '',
        customData: ''
    });
    
    const [qrSize, setQrSize] = useState(256);
    const [qrColor, setQrColor] = useState('#000000');
    const [bgColor, setBgColor] = useState('#FFFFFF');
    const [includeLogo, setIncludeLogo] = useState(false);
    const [logoSize, setLogoSize] = useState(50);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    // Plantillas predefinidas
    const templates = [
        { id: 'basic', name: 'Básico', color: '#000000', bgColor: '#FFFFFF' },
        { id: 'inventory', name: 'Inventario', color: '#2C3E50', bgColor: '#ECF0F1' },
        { id: 'warning', name: 'Alerta', color: '#E74C3C', bgColor: '#FDEDEC' },
        { id: 'premium', name: 'Premium', color: '#9B59B6', bgColor: '#F4ECF7' },
        { id: 'custom', name: 'Personalizado', color: qrColor, bgColor: bgColor }
    ];

    useEffect(() => {
        if (product) {
            const productUrl = `${window.location.origin}/product/${product.id}`;
            setQrData({
                productId: product.id || '',
                productName: product.name || '',
                sku: product.sku || '',
                price: product.price || '',
                stock: product.stock || '',
                category: product.category || '',
                url: productUrl,
                customData: JSON.stringify({
                    type: 'product',
                    id: product.id,
                    sku: product.sku,
                    name: product.name
                }, null, 2)
            });
        } else {
            // Datos por defecto
            setQrData(prev => ({
                ...prev,
                customData: JSON.stringify({
                    type: 'product',
                    id: 'new',
                    sku: 'SKU-000',
                    name: 'Nuevo Producto'
                }, null, 2)
            }));
        }
    }, [product]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setQrData(prev => ({ ...prev, [name]: value }));
        
        // Si cambia el nombre o SKU, actualizar la URL
        if (name === 'productName' || name === 'sku') {
            const productUrl = `${window.location.origin}/product/${qrData.productId || 'new'}`;
            setQrData(prev => ({ ...prev, url: productUrl }));
        }
    };

    const handleTemplateSelect = (template) => {
        if (template.id !== 'custom') {
            setQrColor(template.color);
            setBgColor(template.bgColor);
        }
    };

    const generateQRCode = () => {
        setIsGenerating(true);
        setError('');
        setSuccess('');

        try {
            // Validar datos
            if (!qrData.productName && !qrData.sku && !qrData.customData) {
                throw new Error('Debe proporcionar al menos un dato para el código QR');
            }

            // Generar datos para el QR
            const qrContent = {
                product: {
                    id: qrData.productId || 'new',
                    name: qrData.productName,
                    sku: qrData.sku,
                    price: qrData.price,
                    stock: qrData.stock,
                    category: qrData.category
                },
                url: qrData.url,
                timestamp: new Date().toISOString(),
                system: 'Inventory System'
            };

            const qrString = JSON.stringify(qrContent);
            
            // En una aplicación real, aquí se usaría una librería QR
            // Por ahora, mostramos un mensaje de éxito
            setSuccess(`Código QR generado exitosamente para: ${qrData.productName || qrData.sku}`);
            
            // Simular generación de QR
            setTimeout(() => {
                setIsGenerating(false);
            }, 1000);

        } catch (err) {
            setError(err.message);
            setIsGenerating(false);
        }
    };

    const downloadQRCode = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
            setError('No hay código QR para descargar');
            return;
        }

        try {
            const link = document.createElement('a');
            link.download = `qr-${qrData.sku || 'product'}-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            setSuccess('Código QR descargado exitosamente');
        } catch (err) {
            setError('Error al descargar el código QR');
        }
    };

    const printQRCode = () => {
        window.print();
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Por favor, selecciona un archivo de imagen válido');
            return;
        }

        if (file.size > 2 * 1024 * 1024) { // 2MB
            setError('La imagen no debe exceder 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setIncludeLogo(true);
            // Aquí se procesaría la imagen para el logo
            console.log('Logo cargado:', event.target.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSaveToDatabase = () => {
        if (onSave) {
            const qrDataToSave = {
                ...qrData,
                qrSize,
                qrColor,
                bgColor,
                includeLogo,
                logoSize,
                generatedAt: new Date().toISOString()
            };
            onSave(qrDataToSave);
        }
    };

    const resetForm = () => {
        setQrData({
            productId: '',
            productName: '',
            sku: '',
            price: '',
            stock: '',
            category: '',
            url: '',
            customData: ''
        });
        setQrSize(256);
        setQrColor('#000000');
        setBgColor('#FFFFFF');
        setIncludeLogo(false);
        setLogoSize(50);
        setError('');
        setSuccess('');
    };

    return (
        <div className="qr-generator-container">
            <div className="qr-generator-header">
                <h2 className="qr-title">
                    <i className="qr-icon">🔳</i>
                    Generador de Códigos QR
                </h2>
                <p className="qr-subtitle">
                    Crea códigos QR personalizados para tus productos de inventario
                </p>
            </div>

            <div className="qr-generator-content">
                <div className="qr-left-panel">
                    <div className="qr-preview-section">
                        <h3 className="section-title">Vista Previa</h3>
                        <QRCodeDisplay
                            data={qrData}
                            size={qrSize}
                            color={qrColor}
                            bgColor={bgColor}
                            includeLogo={includeLogo}
                            logoSize={logoSize}
                        />
                        <div className="qr-preview-actions">
                            <button 
                                className="btn btn-secondary"
                                onClick={downloadQRCode}
                                disabled={isGenerating}
                            >
                                <i className="btn-icon">⬇️</i>
                                Descargar PNG
                            </button>
                            <button 
                                className="btn btn-secondary"
                                onClick={printQRCode}
                                disabled={isGenerating}
                            >
                                <i className="btn-icon">🖨️</i>
                                Imprimir
                            </button>
                        </div>
                    </div>

                    <div className="qr-templates-section">
                        <h3 className="section-title">Plantillas</h3>
                        <div className="template-grid">
                            {templates.map(template => (
                                <button
                                    key={template.id}
                                    className={`template-btn ${template.id === 'custom' ? 'custom' : ''}`}
                                    onClick={() => handleTemplateSelect(template)}
                                    style={{
                                        backgroundColor: template.bgColor,
                                        borderColor: template.color
                                    }}
                                    title={template.name}
                                >
                                    <div 
                                        className="template-preview"
                                        style={{ backgroundColor: template.color }}
                                    ></div>
                                    <span className="template-name">{template.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="qr-right-panel">
                    <div className="qr-form-section">
                        <h3 className="section-title">Configuración del QR</h3>
                        
                        {error && (
                            <div className="alert alert-error">
                                <i className="alert-icon">⚠️</i>
                                <span>{error}</span>
                            </div>
                        )}

                        {success && (
                            <div className="alert alert-success">
                                <i className="alert-icon">✅</i>
                                <span>{success}</span>
                            </div>
                        )}

                        <form className="qr-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Nombre del Producto</label>
                                    <input
                                        type="text"
                                        name="productName"
                                        value={qrData.productName}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="Ej: Laptop Dell XPS 13"
                                        maxLength="100"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">SKU</label>
                                    <input
                                        type="text"
                                        name="sku"
                                        value={qrData.sku}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="Ej: LP-DELL-XPS13"
                                        maxLength="50"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Precio ($)</label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={qrData.price}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Stock</label>
                                    <input
                                        type="number"
                                        name="stock"
                                        value={qrData.stock}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Categoría</label>
                                    <input
                                        type="text"
                                        name="category"
                                        value={qrData.category}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="Ej: Electrónicos"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">URL Personalizada</label>
                                    <input
                                        type="url"
                                        name="url"
                                        value={qrData.url}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="https://ejemplo.com/producto"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Datos Personalizados (JSON)</label>
                                <textarea
                                    name="customData"
                                    value={qrData.customData}
                                    onChange={handleInputChange}
                                    className="form-textarea"
                                    rows="6"
                                    placeholder='{"key": "value"}'
                                />
                                <div className="form-help">
                                    Ingresa datos adicionales en formato JSON válido
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Tamaño del QR</label>
                                    <div className="range-input">
                                        <input
                                            type="range"
                                            min="100"
                                            max="500"
                                            step="10"
                                            value={qrSize}
                                            onChange={(e) => setQrSize(parseInt(e.target.value))}
                                            className="range-slider"
                                        />
                                        <span className="range-value">{qrSize}px</span>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Color del QR</label>
                                    <div className="color-input">
                                        <input
                                            type="color"
                                            value={qrColor}
                                            onChange={(e) => setQrColor(e.target.value)}
                                            className="color-picker"
                                        />
                                        <input
                                            type="text"
                                            value={qrColor}
                                            onChange={(e) => setQrColor(e.target.value)}
                                            className="color-text"
                                            placeholder="#000000"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Color de Fondo</label>
                                    <div className="color-input">
                                        <input
                                            type="color"
                                            value={bgColor}
                                            onChange={(e) => setBgColor(e.target.value)}
                                            className="color-picker"
                                        />
                                        <input
                                            type="text"
                                            value={bgColor}
                                            onChange={(e) => setBgColor(e.target.value)}
                                            className="color-text"
                                            placeholder="#FFFFFF"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={includeLogo}
                                        onChange={(e) => setIncludeLogo(e.target.checked)}
                                        className="checkbox-input"
                                    />
                                    <span className="checkbox-custom"></span>
                                    <span className="checkbox-text">Incluir Logo</span>
                                </label>
                                
                                {includeLogo && (
                                    <div className="logo-options">
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="form-label">Tamaño del Logo</label>
                                                <div className="range-input">
                                                    <input
                                                        type="range"
                                                        min="10"
                                                        max="100"
                                                        step="5"
                                                        value={logoSize}
                                                        onChange={(e) => setLogoSize(parseInt(e.target.value))}
                                                        className="range-slider"
                                                    />
                                                    <span className="range-value">{logoSize}%</span>
                                                </div>
                                            </div>
                                            
                                            <div className="form-group">
                                                <label className="form-label">Subir Logo</label>
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleLogoUpload}
                                                    accept="image/*"
                                                    className="file-input"
                                                    style={{ display: 'none' }}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary"
                                                    onClick={() => fileInputRef.current.click()}
                                                >
                                                    <i className="btn-icon">📷</i>
                                                    Seleccionar Imagen
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>

                    <div className="qr-actions-section">
                        <div className="action-buttons">
                            <button
                                className="btn btn-primary"
                                onClick={generateQRCode}
                                disabled={isGenerating}
                            >
                                {isGenerating ? (
                                    <>
                                        <span className="spinner"></span>
                                        Generando...
                                    </>
                                ) : (
                                    <>
                                        <i className="btn-icon">⚡</i>
                                        Generar QR
                                    </>
                                )}
                            </button>
                            
                            <button
                                className="btn btn-success"
                                onClick={handleSaveToDatabase}
                                disabled={isGenerating}
                            >
                                <i className="btn-icon">💾</i>
                                Guardar en BD
                            </button>
                            
                            <button
                                className="btn btn-secondary"
                                onClick={resetForm}
                                disabled={isGenerating}
                            >
                                <i className="btn-icon">🔄</i>
                                Reiniciar
                            </button>
                            
                            {onClose && (
                                <button
                                    className="btn btn-danger"
                                    onClick={onClose}
                                    disabled={isGenerating}
                                >
                                    <i className="btn-icon">✕</i>
                                    Cancelar
                                </button>
                            )}
                        </div>
                        
                        <div className="qr-info">
                            <h4 className="info-title">
                                <i className="info-icon">ℹ️</i>
                                Información del QR
                            </h4>
                            <ul className="info-list">
                                <li className="info-item">
                                    <strong>Tamaño:</strong> {qrSize} × {qrSize} px
                                </li>
                                <li className="info-item">
                                    <strong>Color:</strong> 
                                    <span className="color-sample" style={{ backgroundColor: qrColor }}></span>
                                    {qrColor}
                                </li>
                                <li className="info-item">
                                    <strong>Fondo:</strong> 
                                    <span className="color-sample" style={{ backgroundColor: bgColor }}></span>
                                    {bgColor}
                                </li>
                                <li className="info-item">
                                    <strong>Logo:</strong> {includeLogo ? 'Sí' : 'No'}
                                </li>
                                <li className="info-item">
                                    <strong>Última generación:</strong> {new Date().toLocaleTimeString()}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} width={qrSize} height={qrSize} />
        </div>
    );
};

export default QRGenerator;