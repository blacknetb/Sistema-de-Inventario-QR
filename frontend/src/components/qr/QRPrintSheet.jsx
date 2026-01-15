import React, { useState, useEffect } from 'react';
import '../../assets/styles/qr.css';

/**
 * Componente QRPrintSheet - Hoja de impresión para códigos QR
 * Permite organizar múltiples códigos QR en una hoja para impresión
 */
const QRPrintSheet = ({ products = [], onPrintComplete, onClose }) => {
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [printSettings, setPrintSettings] = useState({
        pageSize: 'A4',
        orientation: 'portrait',
        columns: 3,
        rows: 8,
        showLabels: true,
        labelPosition: 'bottom',
        showBorders: true,
        margin: 10,
        paperType: 'standard',
        quality: 'high'
    });
    
    const [previewData, setPreviewData] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);

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

    const productsData = products.length > 0 ? products : sampleProducts;

    useEffect(() => {
        // Seleccionar todos los productos por defecto
        setSelectedProducts(productsData.map(p => p.id));
        generatePreview();
    }, [productsData, printSettings]);

    const generatePreview = () => {
        setIsGenerating(true);
        
        // Calcular productos por página
        const itemsPerPage = printSettings.columns * printSettings.rows;
        const selectedItems = productsData.filter(p => selectedProducts.includes(p.id));
        const pages = Math.ceil(selectedItems.length / itemsPerPage);
        
        setTotalPages(pages);
        
        // Generar datos para la página actual
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageItems = selectedItems.slice(startIndex, endIndex);
        
        // Crear matriz para la vista previa
        const preview = [];
        for (let row = 0; row < printSettings.rows; row++) {
            const rowItems = [];
            for (let col = 0; col < printSettings.columns; col++) {
                const index = row * printSettings.columns + col;
                rowItems.push(index < pageItems.length ? pageItems[index] : null);
            }
            preview.push(rowItems);
        }
        
        setPreviewData(preview);
        
        // Simular tiempo de generación
        setTimeout(() => {
            setIsGenerating(false);
        }, 500);
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

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Por favor, permite las ventanas emergentes para imprimir');
            return;
        }

        const printContent = generatePrintHTML();
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Impresión de Códigos QR</title>
                <style>
                    body {
                        margin: 0;
                        padding: ${printSettings.margin}mm;
                        font-family: Arial, sans-serif;
                    }
                    
                    .print-sheet {
                        display: grid;
                        grid-template-columns: repeat(${printSettings.columns}, 1fr);
                        grid-template-rows: repeat(${printSettings.rows}, 1fr);
                        gap: 2mm;
                        width: 100%;
                        height: 100vh;
                    }
                    
                    .qr-cell {
                        border: ${printSettings.showBorders ? '1px dashed #ccc' : 'none'};
                        padding: 2mm;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                        page-break-inside: avoid;
                    }
                    
                    .qr-label {
                        margin-top: 2mm;
                        font-size: 10px;
                        font-weight: bold;
                    }
                    
                    .qr-sku {
                        font-size: 8px;
                        color: #666;
                    }
                    
                    .qr-footer {
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        text-align: center;
                        font-size: 8px;
                        color: #999;
                        padding: 2mm;
                        border-top: 1px solid #eee;
                    }
                    
                    @media print {
                        .no-print {
                            display: none !important;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="print-sheet">
                    ${printContent}
                </div>
                <div class="qr-footer no-print">
                    Generado el ${new Date().toLocaleDateString()} - Sistema de Inventarios
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(() => window.close(), 1000);
                    };
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        
        if (onPrintComplete) {
            onPrintComplete({
                count: selectedProducts.length,
                pages: totalPages,
                settings: printSettings
            });
        }
    };

    const generatePrintHTML = () => {
        const itemsPerPage = printSettings.columns * printSettings.rows;
        const selectedItems = productsData.filter(p => selectedProducts.includes(p.id));
        
        let html = '';
        
        for (let i = 0; i < itemsPerPage; i++) {
            const product = selectedItems[i] || null;
            
            html += `
                <div class="qr-cell">
                    ${product ? `
                        <div style="width: 50mm; height: 50mm; background: #f0f0f0; display: flex; align-items: center; justify-content: center;">
                            <div style="text-align: center;">
                                <div style="font-size: 20px; margin-bottom: 5px;">QR</div>
                                <div style="font-size: 10px; color: #666;">${product.sku}</div>
                            </div>
                        </div>
                        ${printSettings.showLabels ? `
                            <div class="qr-label">
                                ${product.name}
                                <div class="qr-sku">${product.sku}</div>
                            </div>
                        ` : ''}
                    ` : `
                        <div style="color: #ccc; font-size: 12px;">Vacío</div>
                    `}
                </div>
            `;
        }
        
        return html;
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            generatePreview();
        }
    };

    const getPageSizeInfo = () => {
        const sizes = {
            'A4': { width: '210mm', height: '297mm' },
            'Letter': { width: '216mm', height: '279mm' },
            'Legal': { width: '216mm', height: '356mm' },
            'A5': { width: '148mm', height: '210mm' }
        };
        
        return sizes[printSettings.pageSize] || sizes.A4;
    };

    return (
        <div className="qr-print-sheet-container">
            <div className="print-header">
                <h2 className="print-title">
                    <i className="print-icon">🖨️</i>
                    Hoja de Impresión QR
                </h2>
                <p className="print-subtitle">
                    Organiza y prepara códigos QR para impresión
                </p>
            </div>

            <div className="print-content">
                <div className="print-left">
                    <div className="products-selection">
                        <div className="selection-header">
                            <h3 className="section-title">
                                <i className="section-icon">📦</i>
                                Seleccionar Productos
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
                                    className={`product-item ${selectedProducts.includes(product.id) ? 'selected' : ''}`}
                                    onClick={() => handleProductToggle(product.id)}
                                >
                                    <div className="product-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedProducts.includes(product.id)}
                                            onChange={() => {}}
                                        />
                                    </div>
                                    <div className="product-info">
                                        <span className="product-name">{product.name}</span>
                                        <span className="product-sku">{product.sku}</span>
                                    </div>
                                    <div className="product-stock">
                                        <span className="stock-badge">{product.stock}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="selection-summary">
                            <div className="summary-item">
                                <span className="summary-label">Productos seleccionados:</span>
                                <span className="summary-value">{selectedProducts.length}</span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">Hojas requeridas:</span>
                                <span className="summary-value">{totalPages}</span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">QRs por hoja:</span>
                                <span className="summary-value">
                                    {printSettings.columns * printSettings.rows}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="print-settings">
                        <h3 className="section-title">
                            <i className="section-icon">⚙️</i>
                            Configuración de Impresión
                        </h3>
                        
                        <div className="settings-grid">
                            <div className="setting-group">
                                <label className="setting-label">Tamaño de hoja</label>
                                <select
                                    value={printSettings.pageSize}
                                    onChange={(e) => setPrintSettings(prev => ({
                                        ...prev,
                                        pageSize: e.target.value
                                    }))}
                                    className="setting-select"
                                >
                                    <option value="A4">A4 (210 × 297 mm)</option>
                                    <option value="Letter">Letter (216 × 279 mm)</option>
                                    <option value="Legal">Legal (216 × 356 mm)</option>
                                    <option value="A5">A5 (148 × 210 mm)</option>
                                </select>
                            </div>
                            
                            <div className="setting-group">
                                <label className="setting-label">Orientación</label>
                                <div className="orientation-options">
                                    <button
                                        className={`orientation-btn ${printSettings.orientation === 'portrait' ? 'active' : ''}`}
                                        onClick={() => setPrintSettings(prev => ({
                                            ...prev,
                                            orientation: 'portrait'
                                        }))}
                                    >
                                        <i className="btn-icon">📄</i>
                                        Vertical
                                    </button>
                                    <button
                                        className={`orientation-btn ${printSettings.orientation === 'landscape' ? 'active' : ''}`}
                                        onClick={() => setPrintSettings(prev => ({
                                            ...prev,
                                            orientation: 'landscape'
                                        }))}
                                    >
                                        <i className="btn-icon">📄</i>
                                        Horizontal
                                    </button>
                                </div>
                            </div>
                            
                            <div className="setting-group">
                                <label className="setting-label">Columnas</label>
                                <div className="range-control">
                                    <input
                                        type="range"
                                        min="1"
                                        max="6"
                                        value={printSettings.columns}
                                        onChange={(e) => setPrintSettings(prev => ({
                                            ...prev,
                                            columns: parseInt(e.target.value)
                                        }))}
                                        className="range-slider"
                                    />
                                    <span className="range-value">{printSettings.columns}</span>
                                </div>
                            </div>
                            
                            <div className="setting-group">
                                <label className="setting-label">Filas</label>
                                <div className="range-control">
                                    <input
                                        type="range"
                                        min="1"
                                        max="12"
                                        value={printSettings.rows}
                                        onChange={(e) => setPrintSettings(prev => ({
                                            ...prev,
                                            rows: parseInt(e.target.value)
                                        }))}
                                        className="range-slider"
                                    />
                                    <span className="range-value">{printSettings.rows}</span>
                                </div>
                            </div>
                            
                            <div className="setting-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={printSettings.showLabels}
                                        onChange={(e) => setPrintSettings(prev => ({
                                            ...prev,
                                            showLabels: e.target.checked
                                        }))}
                                        className="checkbox-input"
                                    />
                                    <span className="checkbox-custom"></span>
                                    <span className="checkbox-text">Mostrar etiquetas</span>
                                </label>
                            </div>
                            
                            <div className="setting-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={printSettings.showBorders}
                                        onChange={(e) => setPrintSettings(prev => ({
                                            ...prev,
                                            showBorders: e.target.checked
                                        }))}
                                        className="checkbox-input"
                                    />
                                    <span className="checkbox-custom"></span>
                                    <span className="checkbox-text">Mostrar bordes</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="print-right">
                    <div className="print-preview">
                        <div className="preview-header">
                            <h3 className="section-title">
                                <i className="section-icon">👁️</i>
                                Vista Previa de Impresión
                            </h3>
                            
                            <div className="preview-controls">
                                <button
                                    className="preview-btn"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage <= 1 || isGenerating}
                                >
                                    ←
                                </button>
                                
                                <span className="page-info">
                                    Página {currentPage} de {totalPages}
                                </span>
                                
                                <button
                                    className="preview-btn"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage >= totalPages || isGenerating}
                                >
                                    →
                                </button>
                            </div>
                        </div>
                        
                        {isGenerating ? (
                            <div className="preview-loading">
                                <div className="loading-spinner"></div>
                                <p>Generando vista previa...</p>
                            </div>
                        ) : (
                            <div className="preview-content">
                                <div 
                                    className="preview-sheet"
                                    style={{
                                        width: printSettings.orientation === 'portrait' ? '210mm' : '297mm',
                                        height: printSettings.orientation === 'portrait' ? '297mm' : '210mm',
                                        margin: '0 auto',
                                        backgroundColor: '#fff',
                                        border: '1px solid #ddd',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <div 
                                        className="preview-grid"
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: `repeat(${printSettings.columns}, 1fr)`,
                                            gridTemplateRows: `repeat(${printSettings.rows}, 1fr)`,
                                            gap: '4mm',
                                            padding: `${printSettings.margin}mm`,
                                            height: '100%',
                                            boxSizing: 'border-box'
                                        }}
                                    >
                                        {previewData.map((row, rowIndex) => (
                                            row.map((product, colIndex) => (
                                                <div
                                                    key={`${rowIndex}-${colIndex}`}
                                                    className="preview-cell"
                                                    style={{
                                                        border: printSettings.showBorders ? '1px dashed #e0e0e0' : 'none',
                                                        padding: '2mm',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        textAlign: 'center',
                                                        backgroundColor: product ? '#f8f9fa' : '#fff'
                                                    }}
                                                >
                                                    {product ? (
                                                        <>
                                                            <div 
                                                                className="preview-qr"
                                                                style={{
                                                                    width: '40mm',
                                                                    height: '40mm',
                                                                    backgroundColor: '#e9ecef',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    marginBottom: printSettings.showLabels ? '2mm' : '0'
                                                                }}
                                                            >
                                                                <div style={{ textAlign: 'center' }}>
                                                                    <div style={{ fontSize: '14px', marginBottom: '2px' }}>QR</div>
                                                                    <div style={{ fontSize: '8px', color: '#6c757d' }}>{product.sku}</div>
                                                                </div>
                                                            </div>
                                                            
                                                            {printSettings.showLabels && (
                                                                <div className="preview-label">
                                                                    <div style={{ 
                                                                        fontSize: '8px', 
                                                                        fontWeight: 'bold',
                                                                        marginBottom: '1px'
                                                                    }}>
                                                                        {product.name.length > 20 
                                                                            ? product.name.substring(0, 20) + '...' 
                                                                            : product.name
                                                                        }
                                                                    </div>
                                                                    <div style={{ fontSize: '7px', color: '#6c757d' }}>
                                                                        {product.sku}
                                                                    </div>
                                                                    <div style={{ fontSize: '7px', color: '#28a745' }}>
                                                                        Stock: {product.stock}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div style={{ color: '#dee2e6', fontSize: '10px' }}>
                                                            Vacío
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ))}
                                    </div>
                                    
                                    <div 
                                        className="preview-footer"
                                        style={{
                                            position: 'absolute',
                                            bottom: '4mm',
                                            left: '4mm',
                                            right: '4mm',
                                            fontSize: '6px',
                                            color: '#adb5bd',
                                            textAlign: 'center',
                                            borderTop: '1px solid #e9ecef',
                                            paddingTop: '2mm'
                                        }}
                                    >
                                        Página {currentPage} • Generado el {new Date().toLocaleDateString()} • Sistema de Inventarios
                                    </div>
                                </div>
                                
                                <div className="preview-info">
                                    <div className="info-item">
                                        <span className="info-label">Tamaño de hoja:</span>
                                        <span className="info-value">{printSettings.pageSize}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Orientación:</span>
                                        <span className="info-value">
                                            {printSettings.orientation === 'portrait' ? 'Vertical' : 'Horizontal'}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Diseño:</span>
                                        <span className="info-value">
                                            {printSettings.columns} × {printSettings.rows}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Productos visibles:</span>
                                        <span className="info-value">
                                            {Math.min(selectedProducts.length, printSettings.columns * printSettings.rows)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="print-actions">
                        <button
                            className="btn btn-secondary"
                            onClick={generatePreview}
                            disabled={isGenerating || selectedProducts.length === 0}
                        >
                            <i className="btn-icon">🔄</i>
                            Actualizar Vista Previa
                        </button>
                        
                        <button
                            className="btn btn-primary"
                            onClick={handlePrint}
                            disabled={isGenerating || selectedProducts.length === 0}
                        >
                            <i className="btn-icon">🖨️</i>
                            Imprimir
                        </button>
                        
                        <button
                            className="btn btn-success"
                            onClick={() => {
                                // Exportar configuración
                                const exportData = {
                                    products: productsData.filter(p => selectedProducts.includes(p.id)),
                                    settings: printSettings,
                                    exportDate: new Date().toISOString()
                                };
                                
                                const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                                    type: 'application/json'
                                });
                                
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `qr-print-config-${Date.now()}.json`;
                                a.click();
                                URL.revokeObjectURL(url);
                            }}
                            disabled={isGenerating || selectedProducts.length === 0}
                        >
                            <i className="btn-icon">💾</i>
                            Exportar Config
                        </button>
                        
                        {onClose && (
                            <button
                                className="btn btn-danger"
                                onClick={onClose}
                            >
                                <i className="btn-icon">✕</i>
                                Cerrar
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="print-footer">
                <div className="footer-info">
                    <div className="info-item">
                        <i className="info-icon">ℹ️</i>
                        <span>
                            <strong>Consejo:</strong> Usa papel adhesivo para crear etiquetas QR
                        </span>
                    </div>
                    <div className="info-item">
                        <i className="info-icon">📄</i>
                        <span>
                            Total de productos: {productsData.length}
                        </span>
                    </div>
                </div>
                
                <div className="print-summary">
                    <div className="summary-item">
                        <span className="summary-label">QRs a imprimir:</span>
                        <span className="summary-value highlight">{selectedProducts.length}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Hojas de papel:</span>
                        <span className="summary-value highlight">{totalPages}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Tiempo estimado:</span>
                        <span className="summary-value">
                            {(totalPages * 0.5).toFixed(1)} minutos
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QRPrintSheet;