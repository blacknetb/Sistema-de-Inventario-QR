import React, { useState, useEffect } from 'react';
import '../../assets/styles/qr.css';

/**
 * Componente QRBatchGenerator - Generador masivo de códigos QR
 * Permite generar múltiples códigos QR en lote
 */
const QRBatchGenerator = ({ products, onGenerateComplete, onClose }) => {
    const [batchData, setBatchData] = useState([]);
    const [generationSettings, setGenerationSettings] = useState({
        size: 200,
        color: '#000000',
        bgColor: '#FFFFFF',
        includeLogo: false,
        includeProductInfo: true,
        format: 'png',
        quality: 'high',
        namingConvention: 'sku',
        outputFormat: 'zip',
        addWatermark: false
    });
    
    const [generationStatus, setGenerationStatus] = useState({
        total: 0,
        completed: 0,
        failed: 0,
        isGenerating: false,
        progress: 0,
        estimatedTime: 0
    });
    
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [generatedFiles, setGeneratedFiles] = useState([]);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

    // Productos de ejemplo si no se proporcionan
    const sampleProducts = [
        { id: 1, name: 'Laptop Dell XPS 13', sku: 'LP-DELL-XPS13', stock: 25, category: 'Electrónicos' },
        { id: 2, name: 'iPhone 15 Pro', sku: 'PH-APPLE-IP15', stock: 42, category: 'Electrónicos' },
        { id: 3, name: 'Silla Ergonómica', sku: 'CH-ERGON-001', stock: 3, category: 'Oficina' },
        { id: 4, name: 'Monitor 27" 4K', sku: 'MON-SAMS-27', stock: 15, category: 'Electrónicos' },
        { id: 5, name: 'Teclado Mecánico', sku: 'KB-MECH-001', stock: 32, category: 'Periféricos' },
        { id: 6, name: 'Mouse Inalámbrico', sku: 'MS-WIRE-001', stock: 48, category: 'Periféricos' },
        { id: 7, name: 'Router WiFi 6', sku: 'RT-TPL-AC1200', stock: 12, category: 'Redes' },
        { id: 8, name: 'Disco SSD 1TB', sku: 'SSD-SAMS-1TB', stock: 27, category: 'Almacenamiento' }
    ];

    const productsData = products?.length > 0 ? products : sampleProducts;

    useEffect(() => {
        // Seleccionar todos los productos por defecto
        setSelectedProducts(productsData.map(p => p.id));
        updateBatchData();
    }, [productsData]);

    const updateBatchData = () => {
        const selected = productsData.filter(p => selectedProducts.includes(p.id));
        const batch = selected.map(product => ({
            id: product.id,
            product,
            settings: generationSettings,
            status: 'pending',
            fileUrl: null,
            error: null
        }));
        
        setBatchData(batch);
        setGenerationStatus(prev => ({
            ...prev,
            total: batch.length,
            completed: 0,
            failed: 0
        }));
    };

    const handleProductToggle = (productId) => {
        setSelectedProducts(prev => {
            if (prev.includes(productId)) {
                return prev.filter(id => id !== productId);
            } else {
                return [...prev, productId];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectedProducts.length === productsData.length) {
            setSelectedProducts([]);
        } else {
            setSelectedProducts(productsData.map(p => p.id));
        }
    };

    const generateBatch = async () => {
        if (selectedProducts.length === 0) {
            alert('Selecciona al menos un producto');
            return;
        }

        setGenerationStatus({
            total: selectedProducts.length,
            completed: 0,
            failed: 0,
            isGenerating: true,
            progress: 0,
            estimatedTime: selectedProducts.length * 0.5 // Estimado en segundos
        });

        const generated = [];
        
        // Simular generación de QR en lote
        for (let i = 0; i < selectedProducts.length; i++) {
            const productId = selectedProducts[i];
            const product = productsData.find(p => p.id === productId);
            
            if (!product) continue;
            
            try {
                // Simular tiempo de generación
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Crear objeto de archivo simulado
                const fileData = {
                    id: `${product.sku}-${Date.now()}`,
                    name: `${product.sku}.${generationSettings.format}`,
                    product: product,
                    size: Math.floor(Math.random() * 50000) + 10000, // Tamaño aleatorio entre 10-60KB
                    type: `image/${generationSettings.format}`,
                    url: `data:image/${generationSettings.format};base64,simulated`,
                    generatedAt: new Date().toISOString()
                };
                
                generated.push(fileData);
                
                // Actualizar estado
                setGenerationStatus(prev => ({
                    ...prev,
                    completed: i + 1,
                    progress: Math.round(((i + 1) / selectedProducts.length) * 100),
                    estimatedTime: Math.max(0, prev.estimatedTime - 0.5)
                }));
                
                // Actualizar batchData
                setBatchData(prev => prev.map(item => 
                    item.id === productId 
                        ? { ...item, status: 'completed', fileUrl: fileData.url }
                        : item
                ));
                
            } catch (error) {
                console.error(`Error generando QR para ${product.sku}:`, error);
                
                setGenerationStatus(prev => ({
                    ...prev,
                    failed: prev.failed + 1,
                    completed: prev.completed + 1,
                    progress: Math.round(((i + 1) / selectedProducts.length) * 100)
                }));
                
                setBatchData(prev => prev.map(item => 
                    item.id === productId 
                        ? { ...item, status: 'failed', error: error.message }
                        : item
                ));
            }
        }
        
        setGeneratedFiles(generated);
        setGenerationStatus(prev => ({ ...prev, isGenerating: false }));
        
        if (onGenerateComplete) {
            onGenerateComplete({
                total: selectedProducts.length,
                successful: generated.length,
                failed: selectedProducts.length - generated.length,
                files: generated
            });
        }
    };

    const downloadBatch = () => {
        if (generatedFiles.length === 0) {
            alert('No hay archivos generados para descargar');
            return;
        }

        // En una aplicación real, aquí se crearía un archivo ZIP con todos los QRs
        // Por ahora, simulamos la descarga
        
        const zipName = `qr-batch-${Date.now()}.zip`;
        alert(`Descargando ${generatedFiles.length} archivos como ${zipName}`);
        
        // Simular descarga
        const link = document.createElement('a');
        link.href = '#';
        link.download = zipName;
        link.click();
    };

    const handlePreview = (index) => {
        setCurrentPreviewIndex(index);
        setIsPreviewMode(true);
    };

    const getFileName = (product) => {
        switch (generationSettings.namingConvention) {
            case 'sku':
                return `${product.sku}`;
            case 'name':
                return `${product.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
            case 'sku-name':
                return `${product.sku}_${product.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
            case 'id':
                return `product_${product.id}`;
            default:
                return product.sku;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return '#28a745';
            case 'failed': return '#dc3545';
            case 'generating': return '#ffc107';
            default: return '#6c757d';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return '✅';
            case 'failed': return '❌';
            case 'generating': return '🔄';
            default: return '⏳';
        }
    };

    return (
        <div className="qr-batch-generator-container">
            <div className="batch-header">
                <h2 className="batch-title">
                    <i className="batch-icon">🏭</i>
                    Generador Masivo de QR
                </h2>
                <p className="batch-subtitle">
                    Genera múltiples códigos QR para productos seleccionados
                </p>
            </div>

            <div className="batch-content">
                <div className="batch-left">
                    <div className="products-section">
                        <div className="section-header">
                            <h3 className="section-title">
                                <i className="section-icon">📦</i>
                                Productos para Generar
                            </h3>
                            <button
                                className="btn btn-text"
                                onClick={handleSelectAll}
                            >
                                {selectedProducts.length === productsData.length 
                                    ? 'Deseleccionar Todos' 
                                    : 'Seleccionar Todos'
                                }
                            </button>
                        </div>
                        
                        <div className="products-list">
                            {productsData.map(product => (
                                <div 
                                    key={product.id}
                                    className={`product-select-item ${selectedProducts.includes(product.id) ? 'selected' : ''}`}
                                    onClick={() => handleProductToggle(product.id)}
                                >
                                    <div className="product-select-checkbox">
                                        <div className={`checkbox ${selectedProducts.includes(product.id) ? 'checked' : ''}`}>
                                            {selectedProducts.includes(product.id) && '✓'}
                                        </div>
                                    </div>
                                    <div className="product-select-info">
                                        <span className="product-name">{product.name}</span>
                                        <span className="product-sku">{product.sku}</span>
                                        <span className="product-category">{product.category}</span>
                                    </div>
                                    <div className="product-select-stock">
                                        <span className="stock-badge">{product.stock}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="selection-summary">
                            <div className="summary-item">
                                <span className="summary-label">Seleccionados:</span>
                                <span className="summary-value">{selectedProducts.length}</span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">Disponibles:</span>
                                <span className="summary-value">{productsData.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="settings-section">
                        <h3 className="section-title">
                            <i className="section-icon">⚙️</i>
                            Configuración de Generación
                        </h3>
                        
                        <div className="settings-grid">
                            <div className="setting-group">
                                <label className="setting-label">Tamaño del QR</label>
                                <select
                                    value={generationSettings.size}
                                    onChange={(e) => setGenerationSettings(prev => ({
                                        ...prev,
                                        size: parseInt(e.target.value)
                                    }))}
                                    className="setting-select"
                                >
                                    <option value="100">100px</option>
                                    <option value="150">150px</option>
                                    <option value="200">200px</option>
                                    <option value="250">250px</option>
                                    <option value="300">300px</option>
                                </select>
                            </div>
                            
                            <div className="setting-group">
                                <label className="setting-label">Color</label>
                                <div className="color-input">
                                    <input
                                        type="color"
                                        value={generationSettings.color}
                                        onChange={(e) => setGenerationSettings(prev => ({
                                            ...prev,
                                            color: e.target.value
                                        }))}
                                        className="color-picker"
                                    />
                                    <input
                                        type="text"
                                        value={generationSettings.color}
                                        onChange={(e) => setGenerationSettings(prev => ({
                                            ...prev,
                                            color: e.target.value
                                        }))}
                                        className="color-text"
                                    />
                                </div>
                            </div>
                            
                            <div className="setting-group">
                                <label className="setting-label">Fondo</label>
                                <div className="color-input">
                                    <input
                                        type="color"
                                        value={generationSettings.bgColor}
                                        onChange={(e) => setGenerationSettings(prev => ({
                                            ...prev,
                                            bgColor: e.target.value
                                        }))}
                                        className="color-picker"
                                    />
                                    <input
                                        type="text"
                                        value={generationSettings.bgColor}
                                        onChange={(e) => setGenerationSettings(prev => ({
                                            ...prev,
                                            bgColor: e.target.value
                                        }))}
                                        className="color-text"
                                    />
                                </div>
                            </div>
                            
                            <div className="setting-group">
                                <label className="setting-label">Formato</label>
                                <select
                                    value={generationSettings.format}
                                    onChange={(e) => setGenerationSettings(prev => ({
                                        ...prev,
                                        format: e.target.value
                                    }))}
                                    className="setting-select"
                                >
                                    <option value="png">PNG</option>
                                    <option value="jpg">JPG</option>
                                    <option value="svg">SVG</option>
                                </select>
                            </div>
                            
                            <div className="setting-group">
                                <label className="setting-label">Convención de nombres</label>
                                <select
                                    value={generationSettings.namingConvention}
                                    onChange={(e) => setGenerationSettings(prev => ({
                                        ...prev,
                                        namingConvention: e.target.value
                                    }))}
                                    className="setting-select"
                                >
                                    <option value="sku">SKU</option>
                                    <option value="name">Nombre</option>
                                    <option value="sku-name">SKU_Nombre</option>
                                    <option value="id">ID_Producto</option>
                                </select>
                            </div>
                            
                            <div className="setting-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={generationSettings.includeProductInfo}
                                        onChange={(e) => setGenerationSettings(prev => ({
                                            ...prev,
                                            includeProductInfo: e.target.checked
                                        }))}
                                        className="checkbox-input"
                                    />
                                    <span className="checkbox-custom"></span>
                                    <span className="checkbox-text">Incluir información del producto</span>
                                </label>
                            </div>
                            
                            <div className="setting-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={generationSettings.addWatermark}
                                        onChange={(e) => setGenerationSettings(prev => ({
                                            ...prev,
                                            addWatermark: e.target.checked
                                        }))}
                                        className="checkbox-input"
                                    />
                                    <span className="checkbox-custom"></span>
                                    <span className="checkbox-text">Agregar marca de agua</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="batch-right">
                    <div className="generation-section">
                        <div className="generation-header">
                            <h3 className="section-title">
                                <i className="section-icon">⚡</i>
                                Proceso de Generación
                            </h3>
                            
                            <div className="generation-stats">
                                <div className="stat-item">
                                    <span className="stat-label">Total:</span>
                                    <span className="stat-value">{generationStatus.total}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Completados:</span>
                                    <span className="stat-value success">{generationStatus.completed}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Fallados:</span>
                                    <span className="stat-value danger">{generationStatus.failed}</span>
                                </div>
                            </div>
                        </div>
                        
                        {generationStatus.isGenerating && (
                            <div className="generation-progress">
                                <div className="progress-bar-container">
                                    <div 
                                        className="progress-bar"
                                        style={{ width: `${generationStatus.progress}%` }}
                                    ></div>
                                </div>
                                <div className="progress-info">
                                    <span className="progress-text">
                                        Generando {generationStatus.completed} de {generationStatus.total}...
                                    </span>
                                    <span className="progress-percent">{generationStatus.progress}%</span>
                                </div>
                                <div className="progress-time">
                                    <i className="time-icon">⏱️</i>
                                    <span>Tiempo estimado: {generationStatus.estimatedTime.toFixed(1)}s</span>
                                </div>
                            </div>
                        )}
                        
                        <div className="batch-list">
                            <div className="batch-list-header">
                                <span className="header-col">Producto</span>
                                <span className="header-col">SKU</span>
                                <span className="header-col">Estado</span>
                                <span className="header-col">Acciones</span>
                            </div>
                            
                            <div className="batch-list-content">
                                {batchData.map((item, index) => (
                                    <div key={item.id} className="batch-item">
                                        <div className="batch-col">
                                            <span className="product-name">
                                                {item.product.name.length > 20 
                                                    ? item.product.name.substring(0, 20) + '...' 
                                                    : item.product.name
                                                }
                                            </span>
                                        </div>
                                        <div className="batch-col">
                                            <span className="product-sku">{item.product.sku}</span>
                                        </div>
                                        <div className="batch-col">
                                            <span 
                                                className="status-badge"
                                                style={{ 
                                                    backgroundColor: getStatusColor(item.status),
                                                    color: 'white'
                                                }}
                                            >
                                                <i className="status-icon">{getStatusIcon(item.status)}</i>
                                                {item.status === 'completed' && 'Listo'}
                                                {item.status === 'failed' && 'Falló'}
                                                {item.status === 'generating' && 'Generando'}
                                                {item.status === 'pending' && 'Pendiente'}
                                            </span>
                                        </div>
                                        <div className="batch-col">
                                            <div className="action-buttons">
                                                <button
                                                    className="action-btn"
                                                    onClick={() => handlePreview(index)}
                                                    disabled={item.status !== 'completed'}
                                                    title="Vista previa"
                                                >
                                                    <i className="action-icon">👁️</i>
                                                </button>
                                                <button
                                                    className="action-btn"
                                                    disabled={item.status !== 'completed'}
                                                    title="Descargar individual"
                                                >
                                                    <i className="action-icon">⬇️</i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="results-section">
                        <h3 className="section-title">
                            <i className="section-icon">📊</i>
                            Resultados
                        </h3>
                        
                        {generatedFiles.length > 0 ? (
                            <div className="results-content">
                                <div className="results-summary">
                                    <div className="summary-card success">
                                        <div className="summary-icon">✅</div>
                                        <div className="summary-info">
                                            <div className="summary-value">{generatedFiles.length}</div>
                                            <div className="summary-label">QRs generados</div>
                                        </div>
                                    </div>
                                    
                                    <div className="summary-card info">
                                        <div className="summary-icon">📦</div>
                                        <div className="summary-info">
                                            <div className="summary-value">
                                                {(generatedFiles.reduce((acc, file) => acc + file.size, 0) / 1024).toFixed(1)} KB
                                            </div>
                                            <div className="summary-label">Tamaño total</div>
                                        </div>
                                    </div>
                                    
                                    <div className="summary-card warning">
                                        <div className="summary-icon">⚠️</div>
                                        <div className="summary-info">
                                            <div className="summary-value">{generationStatus.failed}</div>
                                            <div className="summary-label">Fallidos</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="file-list">
                                    <h4 className="file-list-title">Archivos Generados</h4>
                                    {generatedFiles.slice(0, 5).map(file => (
                                        <div key={file.id} className="file-item">
                                            <i className="file-icon">📄</i>
                                            <div className="file-info">
                                                <span className="file-name">{file.name}</span>
                                                <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {generatedFiles.length > 5 && (
                                        <div className="more-files">
                                            + {generatedFiles.length - 5} archivos más
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="no-results">
                                <i className="no-results-icon">📭</i>
                                <p>No hay archivos generados aún</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="batch-footer">
                <div className="footer-actions">
                    <button
                        className="btn btn-primary"
                        onClick={generateBatch}
                        disabled={generationStatus.isGenerating || selectedProducts.length === 0}
                    >
                        {generationStatus.isGenerating ? (
                            <>
                                <span className="spinner"></span>
                                Generando...
                            </>
                        ) : (
                            <>
                                <i className="btn-icon">⚡</i>
                                Generar Lote
                            </>
                        )}
                    </button>
                    
                    <button
                        className="btn btn-success"
                        onClick={downloadBatch}
                        disabled={generatedFiles.length === 0}
                    >
                        <i className="btn-icon">📦</i>
                        Descargar Todo
                    </button>
                    
                    <button
                        className="btn btn-secondary"
                        onClick={updateBatchData}
                        disabled={generationStatus.isGenerating}
                    >
                        <i className="btn-icon">🔄</i>
                        Actualizar Lista
                    </button>
                    
                    {onClose && (
                        <button
                            className="btn btn-danger"
                            onClick={onClose}
                            disabled={generationStatus.isGenerating}
                        >
                            <i className="btn-icon">✕</i>
                            Cancelar
                        </button>
                    )}
                </div>
                
                <div className="footer-info">
                    <div className="info-item">
                        <i className="info-icon">💡</i>
                        <span>
                            <strong>Consejo:</strong> Los archivos se pueden descargar individualmente o en un paquete ZIP
                        </span>
                    </div>
                </div>
            </div>

            {isPreviewMode && generatedFiles[currentPreviewIndex] && (
                <div className="preview-modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title">
                                Vista Previa: {generatedFiles[currentPreviewIndex].product.name}
                            </h3>
                            <button
                                className="modal-close"
                                onClick={() => setIsPreviewMode(false)}
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="preview-qr-display">
                                <div 
                                    className="qr-preview-box"
                                    style={{
                                        width: generationSettings.size,
                                        height: generationSettings.size,
                                        backgroundColor: generationSettings.bgColor,
                                        border: `1px solid ${generationSettings.color}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ 
                                            fontSize: '24px', 
                                            color: generationSettings.color,
                                            marginBottom: '8px'
                                        }}>
                                            QR
                                        </div>
                                        <div style={{ 
                                            fontSize: '12px', 
                                            color: generationSettings.color 
                                        }}>
                                            {generatedFiles[currentPreviewIndex].product.sku}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="preview-info">
                                <div className="info-item">
                                    <span className="info-label">Nombre:</span>
                                    <span className="info-value">{generatedFiles[currentPreviewIndex].name}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Producto:</span>
                                    <span className="info-value">{generatedFiles[currentPreviewIndex].product.name}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">SKU:</span>
                                    <span className="info-value">{generatedFiles[currentPreviewIndex].product.sku}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Tamaño:</span>
                                    <span className="info-value">
                                        {(generatedFiles[currentPreviewIndex].size / 1024).toFixed(1)} KB
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Generado:</span>
                                    <span className="info-value">
                                        {new Date(generatedFiles[currentPreviewIndex].generatedAt).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setCurrentPreviewIndex(prev => 
                                    prev > 0 ? prev - 1 : generatedFiles.length - 1
                                )}
                            >
                                ← Anterior
                            </button>
                            
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    // Descargar archivo individual
                                    alert(`Descargando ${generatedFiles[currentPreviewIndex].name}`);
                                }}
                            >
                                Descargar
                            </button>
                            
                            <button
                                className="btn btn-secondary"
                                onClick={() => setCurrentPreviewIndex(prev => 
                                    prev < generatedFiles.length - 1 ? prev + 1 : 0
                                )}
                            >
                                Siguiente →
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QRBatchGenerator;