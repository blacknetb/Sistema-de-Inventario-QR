import React, { useState, useEffect, useRef } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useNotification } from '../context/NotificationContext';
import '../assets/styles/pages/pages.css';

const QRManagement = () => {
  const { products, categories, loading, error, fetchProducts } = useInventory();
  const { showNotification } = useNotification();
  
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [qrType, setQrType] = useState('product'); // 'product', 'inventory', 'custom'
  const [qrSize, setQrSize] = useState(200);
  const [qrColor, setQrColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [qrData, setQrData] = useState('');
  const [customData, setCustomData] = useState('');
  const [generatedQRCodes, setGeneratedQRCodes] = useState([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState(null);
  const [batchSize, setBatchSize] = useState(1);
  const [includeLogo, setIncludeLogo] = useState(false);
  const [logoSize, setLogoSize] = useState(40);
  const [printLayout, setPrintLayout] = useState('single'); // 'single', 'sheet'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const canvasRef = useRef(null);
  const qrContainerRef = useRef(null);

  // Cargar productos y códigos QR guardados
  useEffect(() => {
    fetchProducts();
    loadSavedQRCodes();
  }, []);

  // Cargar códigos QR guardados
  const loadSavedQRCodes = () => {
    const saved = localStorage.getItem('generatedQRCodes');
    if (saved) {
      try {
        setGeneratedQRCodes(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved QR codes:', error);
      }
    }
  };

  // Guardar códigos QR
  const saveQRCodes = () => {
    localStorage.setItem('generatedQRCodes', JSON.stringify(generatedQRCodes));
  };

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchTerm === '' || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Generar datos para QR
  const generateQRData = (product) => {
    switch (qrType) {
      case 'product':
        return JSON.stringify({
          type: 'product',
          id: product.id,
          sku: product.sku,
          name: product.name,
          timestamp: new Date().toISOString()
        }, null, 2);
      
      case 'inventory':
        return JSON.stringify({
          type: 'inventory',
          productId: product.id,
          productName: product.name,
          currentQuantity: product.quantity,
          lastUpdated: new Date().toISOString()
        }, null, 2);
      
      case 'custom':
        return customData || `Producto: ${product.name} (ID: ${product.id})`;
      
      default:
        return product.id;
    }
  };

  // Generar código QR
  const generateQRCode = async (product = null, data = null) => {
    try {
      let qrDataToUse = data || qrData;
      let productInfo = product;
      
      // Si no hay producto específico, usar los seleccionados o datos personalizados
      if (!product && selectedProducts.length > 0) {
        // Generar en lote
        for (const productId of selectedProducts) {
          const prod = products.find(p => p.id === productId);
          if (prod) {
            await generateSingleQR(prod);
          }
        }
        return;
      } else if (!product && !data) {
        qrDataToUse = customData || 'QR Personalizado';
      }

      if (product) {
        qrDataToUse = generateQRData(product);
      }

      await generateSingleQR(productInfo, qrDataToUse);
      
    } catch (error) {
      console.error('Error generating QR code:', error);
      showNotification('error', 'Error', 'No se pudo generar el código QR');
    }
  };

  // Generar un solo código QR
  const generateSingleQR = async (product, data) => {
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Limpiar canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Configurar tamaño
      canvas.width = qrSize;
      canvas.height = qrSize;
      
      // Fondo
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Aquí iría la lógica real de generación de QR
      // Por ahora, simulamos con un cuadro y texto
      ctx.fillStyle = qrColor;
      ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);
      
      // Texto del QR
      ctx.fillStyle = bgColor;
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('QR', canvas.width / 2, canvas.height / 2 + 7);
      
      // Si hay logo
      if (includeLogo && product?.imageUrl) {
        const logo = new Image();
        logo.crossOrigin = 'anonymous';
        logo.onload = () => {
          const logoX = (canvas.width - logoSize) / 2;
          const logoY = (canvas.height - logoSize) / 2;
          
          ctx.save();
          ctx.beginPath();
          ctx.arc(logoX + logoSize/2, logoY + logoSize/2, logoSize/2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          
          ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
          ctx.restore();
          
          saveGeneratedQR(canvas, product, data);
        };
        logo.src = product.imageUrl;
      } else {
        saveGeneratedQR(canvas, product, data);
      }
      
    } catch (error) {
      throw error;
    }
  };

  // Guardar QR generado
  const saveGeneratedQR = (canvas, product, data) => {
    const qrDataUrl = canvas.toDataURL('image/png');
    
    const qrCode = {
      id: Date.now(),
      dataUrl: qrDataUrl,
      data: data || qrData,
      product: product ? {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category
      } : null,
      type: qrType,
      size: qrSize,
      colors: { qrColor, bgColor },
      timestamp: new Date().toISOString(),
      metadata: {
        includeLogo,
        logoSize,
        batchId: Date.now().toString()
      }
    };
    
    setGeneratedQRCodes(prev => [qrCode, ...prev]);
    saveQRCodes();
    
    showNotification('success', 'QR Generado', 
      product ? `QR creado para ${product.name}` : 'QR personalizado creado');
  };

  // Descargar QR
  const downloadQR = (qrCode, index = null) => {
    const link = document.createElement('a');
    link.download = qrCode.product 
      ? `QR_${qrCode.product.name.replace(/\s+/g, '_')}_${qrCode.id}.png`
      : `QR_${qrCode.id}.png`;
    link.href = qrCode.dataUrl;
    link.click();
  };

  // Descargar lote
  const downloadBatch = () => {
    if (generatedQRCodes.length === 0) return;
    
    const zip = require('jszip')();
    const folder = zip.folder('qr_codes');
    
    generatedQRCodes.forEach((qr, index) => {
      const dataUrl = qr.dataUrl;
      const base64Data = dataUrl.split(',')[1];
      const filename = qr.product 
        ? `QR_${qr.product.name.replace(/\s+/g, '_')}_${qr.id}.png`
        : `QR_${qr.id}.png`;
      
      folder.file(filename, base64Data, { base64: true });
    });
    
    zip.generateAsync({ type: 'blob' })
      .then(content => {
        const link = document.createElement('a');
        link.download = 'qr_codes.zip';
        link.href = URL.createObjectURL(content);
        link.click();
        URL.revokeObjectURL(link.href);
        
        showNotification('success', 'Descarga completada', 
          `${generatedQRCodes.length} códigos QR descargados`);
      })
      .catch(error => {
        console.error('Error creating zip:', error);
        showNotification('error', 'Error', 'No se pudo crear el archivo ZIP');
      });
  };

  // Imprimir QR
  const printQR = (qrCode = null) => {
    if (qrCode) {
      // Imprimir QR específico
      setSelectedQRCode(qrCode);
      setShowQRModal(true);
    } else {
      // Imprimir todos
      showNotification('info', 'Imprimir', 'Preparando impresión de códigos QR...');
      setTimeout(() => {
        window.print();
      }, 500);
    }
  };

  // Eliminar QR
  const deleteQR = (id) => {
    setGeneratedQRCodes(prev => prev.filter(qr => qr.id !== id));
    saveQRCodes();
    showNotification('info', 'QR Eliminado', 'El código QR ha sido eliminado');
  };

  // Copiar datos QR
  const copyQRData = (data) => {
    navigator.clipboard.writeText(data).then(() => {
      showNotification('success', 'Copiado', 'Datos QR copiados al portapapeles');
    }).catch(err => {
      showNotification('error', 'Error', 'No se pudo copiar al portapapeles');
    });
  };

  // Seleccionar/deseleccionar producto
  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Seleccionar todos los productos filtrados
  const selectAllFiltered = () => {
    const allFilteredIds = filteredProducts.map(p => p.id);
    if (selectedProducts.length === allFilteredIds.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(allFilteredIds);
    }
  };

  // Generar hoja de impresión
  const generatePrintSheet = () => {
    // Esta función generaría una hoja con múltiples QR para imprimir
    showNotification('info', 'Hoja de impresión', 'Generando hoja con códigos QR...');
  };

  if (loading) {
    return (
      <div className="qr-management loading">
        <div className="loading-spinner"></div>
        <p>Cargando productos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="qr-management error">
        <div className="error-icon">⚠️</div>
        <h3>Error al cargar productos</h3>
        <p>{error}</p>
        <button onClick={fetchProducts} className="retry-button">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="qr-management">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">Gestión de Códigos QR</h1>
          <p className="page-subtitle">
            Genera y gestiona códigos QR para productos y más
          </p>
        </div>
        
        <div className="header-right">
          <button 
            className="primary-button"
            onClick={() => generateQRCode()}
            disabled={!customData && selectedProducts.length === 0}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Generar QR
          </button>
          
          <button 
            className="secondary-button"
            onClick={downloadBatch}
            disabled={generatedQRCodes.length === 0}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Descargar Lote
          </button>
          
          <button 
            className="secondary-button"
            onClick={() => printQR()}
            disabled={generatedQRCodes.length === 0}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 9V2H18V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 18H4C3.46957 18 2.96086 17.7893 2.58579 17.4142C2.21071 17.0391 2 16.5304 2 16V11C2 10.4696 2.21071 9.96086 2.58579 9.58579C2.96086 9.21071 3.46957 9 4 9H20C20.5304 9 21.0391 9.21071 21.4142 9.58579C21.7893 9.96086 22 10.4696 22 11V16C22 16.5304 21.7893 17.0391 21.4142 17.4142C21.0391 17.7893 20.5304 17.2 20 17.2H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 14H6V22H18V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Imprimir
          </button>
        </div>
      </div>

      {/* Contenedor principal */}
      <div className="qr-container">
        {/* Panel izquierdo: Configuración */}
        <div className="config-panel">
          <div className="config-section">
            <h3 className="section-title">
              <span className="section-icon">⚙️</span>
              Configuración QR
            </h3>
            
            <div className="form-group">
              <label>Tipo de QR</label>
              <div className="qr-type-selector">
                <button
                  className={`type-button ${qrType === 'product' ? 'active' : ''}`}
                  onClick={() => setQrType('product')}
                >
                  <span className="type-icon">📦</span>
                  Producto
                </button>
                <button
                  className={`type-button ${qrType === 'inventory' ? 'active' : ''}`}
                  onClick={() => setQrType('inventory')}
                >
                  <span className="type-icon">📋</span>
                  Inventario
                </button>
                <button
                  className={`type-button ${qrType === 'custom' ? 'active' : ''}`}
                  onClick={() => setQrType('custom')}
                >
                  <span className="type-icon">🔲</span>
                  Personalizado
                </button>
              </div>
            </div>

            {qrType === 'custom' && (
              <div className="form-group">
                <label>Datos personalizados</label>
                <textarea
                  value={customData}
                  onChange={(e) => setCustomData(e.target.value)}
                  placeholder="Ingresa los datos para el código QR..."
                  className="custom-data-input"
                  rows={4}
                />
              </div>
            )}

            <div className="form-group">
              <label>Tamaño del QR</label>
              <div className="size-controls">
                <input
                  type="range"
                  min="100"
                  max="500"
                  step="50"
                  value={qrSize}
                  onChange={(e) => setQrSize(parseInt(e.target.value))}
                  className="size-slider"
                />
                <div className="size-value">{qrSize}px</div>
              </div>
            </div>

            <div className="form-group">
              <label>Colores</label>
              <div className="color-controls">
                <div className="color-input">
                  <label>Color QR</label>
                  <input
                    type="color"
                    value={qrColor}
                    onChange={(e) => setQrColor(e.target.value)}
                    className="color-picker"
                  />
                  <span className="color-value">{qrColor}</span>
                </div>
                <div className="color-input">
                  <label>Fondo</label>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="color-picker"
                  />
                  <span className="color-value">{bgColor}</span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={includeLogo}
                  onChange={(e) => setIncludeLogo(e.target.checked)}
                  className="checkbox"
                />
                <span>Incluir logo del producto</span>
              </label>
              
              {includeLogo && (
                <div className="logo-size-control">
                  <label>Tamaño del logo</label>
                  <div className="size-controls">
                    <input
                      type="range"
                      min="20"
                      max="100"
                      step="10"
                      value={logoSize}
                      onChange={(e) => setLogoSize(parseInt(e.target.value))}
                      className="size-slider"
                    />
                    <div className="size-value">{logoSize}px</div>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Tamaño del lote</label>
              <select
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value))}
                className="batch-select"
              >
                <option value={1}>1 QR</option>
                <option value={5}>5 QR</option>
                <option value={10}>10 QR</option>
                <option value={25}>25 QR</option>
                <option value={50}>50 QR</option>
              </select>
            </div>

            <div className="form-group">
              <label>Diseño de impresión</label>
              <div className="print-layout-selector">
                <button
                  className={`layout-button ${printLayout === 'single' ? 'active' : ''}`}
                  onClick={() => setPrintLayout('single')}
                >
                  <span className="layout-icon">🖨️</span>
                  Individual
                </button>
                <button
                  className={`layout-button ${printLayout === 'sheet' ? 'active' : ''}`}
                  onClick={() => setPrintLayout('sheet')}
                >
                  <span className="layout-icon">📄</span>
                  Hoja completa
                </button>
              </div>
            </div>

            <div className="preview-section">
              <h4>Vista previa</h4>
              <div className="qr-preview" ref={qrContainerRef}>
                <canvas ref={canvasRef} className="qr-canvas" />
                <div className="preview-info">
                  <p>Tamaño: {qrSize}px × {qrSize}px</p>
                  <p>Colores: QR {qrColor} / Fondo {bgColor}</p>
                  {includeLogo && <p>Logo: {logoSize}px</p>}
                </div>
              </div>
              
              <button 
                className="preview-button"
                onClick={() => generateQRCode()}
                disabled={!customData && selectedProducts.length === 0}
              >
                Generar vista previa
              </button>
            </div>
          </div>
        </div>

        {/* Panel derecho: Productos y QR generados */}
        <div className="content-panel">
          {/* Lista de productos */}
          <div className="products-section">
            <div className="section-header">
              <h3 className="section-title">
                <span className="section-icon">📦</span>
                Productos
                <span className="count-badge">{filteredProducts.length}</span>
              </h3>
              
              <div className="section-controls">
                <div className="search-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <input
                    type="search"
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="category-select"
                >
                  <option value="all">Todas las categorías</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="products-actions">
              <button
                className="select-all-button"
                onClick={selectAllFiltered}
              >
                <input
                  type="checkbox"
                  checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                  onChange={selectAllFiltered}
                  className="select-all-checkbox"
                />
                <span>
                  {selectedProducts.length === filteredProducts.length && filteredProducts.length > 0
                    ? 'Deseleccionar todos'
                    : 'Seleccionar todos'}
                </span>
              </button>
              
              <div className="selected-count">
                {selectedProducts.length} productos seleccionados
              </div>
              
              <button
                className="generate-batch-button"
                onClick={() => generateQRCode()}
                disabled={selectedProducts.length === 0}
              >
                Generar QR para seleccionados
              </button>
            </div>

            <div className="products-list">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <div 
                    key={product.id} 
                    className={`product-item ${selectedProducts.includes(product.id) ? 'selected' : ''}`}
                    onClick={() => toggleProductSelection(product.id)}
                  >
                    <div className="product-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="product-check"
                      />
                    </div>
                    
                    <div className="product-info">
                      <div className="product-name">{product.name}</div>
                      <div className="product-details">
                        <span className="product-sku">SKU: {product.sku || 'N/A'}</span>
                        <span className="product-category">{product.category}</span>
                        <span className="product-quantity">Stock: {product.quantity}</span>
                      </div>
                    </div>
                    
                    <div className="product-actions">
                      <button
                        className="generate-single-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          generateQRCode(product);
                        }}
                        title="Generar QR individual"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      
                      <button
                        className="view-product-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Navegar al producto
                          window.open(`/products/${product.id}`, '_blank');
                        }}
                        title="Ver producto"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 9 12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-products">
                  <div className="empty-icon">📦</div>
                  <p>No se encontraron productos</p>
                  <p className="empty-hint">Intenta con otros términos de búsqueda</p>
                </div>
              )}
            </div>
          </div>

          {/* QR Generados */}
          <div className="generated-section">
            <div className="section-header">
              <h3 className="section-title">
                <span className="section-icon">🔲</span>
                QR Generados
                <span className="count-badge">{generatedQRCodes.length}</span>
              </h3>
              
              <div className="section-actions">
                <button
                  className="clear-all-button"
                  onClick={() => {
                    if (window.confirm('¿Eliminar todos los códigos QR generados?')) {
                      setGeneratedQRCodes([]);
                      localStorage.removeItem('generatedQRCodes');
                      showNotification('info', 'Limpiado', 'Todos los QR han sido eliminados');
                    }
                  }}
                  disabled={generatedQRCodes.length === 0}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 6V4C8 3.46957 8.21071 3 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 3 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Limpiar todo
                </button>
              </div>
            </div>

            <div className="generated-grid">
              {generatedQRCodes.length > 0 ? (
                generatedQRCodes.map((qr, index) => (
                  <div key={qr.id} className="qr-card">
                    <div className="qr-image-container">
                      <img 
                        src={qr.dataUrl} 
                        alt={`QR Code ${index + 1}`}
                        className="qr-image"
                      />
                      <div className="qr-overlay">
                        <button
                          className="overlay-button view"
                          onClick={() => {
                            setSelectedQRCode(qr);
                            setShowQRModal(true);
                          }}
                          title="Ver detalles"
                        >
                          👁️
                        </button>
                        <button
                          className="overlay-button download"
                          onClick={() => downloadQR(qr, index)}
                          title="Descargar"
                        >
                          ⬇️
                        </button>
                        <button
                          className="overlay-button print"
                          onClick={() => printQR(qr)}
                          title="Imprimir"
                        >
                          🖨️
                        </button>
                        <button
                          className="overlay-button delete"
                          onClick={() => deleteQR(qr.id)}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    <div className="qr-info">
                      <div className="qr-title">
                        {qr.product ? qr.product.name : 'QR Personalizado'}
                      </div>
                      
                      <div className="qr-details">
                        <div className="qr-type">
                          <span className="type-badge type-{qr.type}">
                            {qr.type === 'product' ? '📦 Producto' : 
                             qr.type === 'inventory' ? '📋 Inventario' : '🔲 Personalizado'}
                          </span>
                        </div>
                        
                        <div className="qr-size">{qr.size}px</div>
                        
                        <div className="qr-time">
                          {new Date(qr.timestamp).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      
                      <div className="qr-actions">
                        <button
                          className="action-button copy"
                          onClick={() => copyQRData(qr.data)}
                          title="Copiar datos"
                        >
                          📋
                        </button>
                        <button
                          className="action-button regenerate"
                          onClick={() => {
                            if (qr.product) {
                              const product = products.find(p => p.id === qr.product.id);
                              if (product) generateQRCode(product, qr.data);
                            } else {
                              generateQRCode(null, qr.data);
                            }
                          }}
                          title="Regenerar"
                        >
                          🔄
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-generated">
                  <div className="empty-icon">🔲</div>
                  <p>No hay códigos QR generados</p>
                  <p className="empty-hint">Selecciona productos y genera códigos QR</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de vista de QR */}
      {showQRModal && selectedQRCode && (
        <div className="modal-overlay">
          <div className="modal qr-modal">
            <div className="modal-header">
              <h3>Detalles del código QR</h3>
              <button className="modal-close" onClick={() => setShowQRModal(false)}>
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="qr-detail-view">
                <div className="qr-large">
                  <img 
                    src={selectedQRCode.dataUrl} 
                    alt="QR Code"
                    className="qr-detail-image"
                  />
                </div>
                
                <div className="qr-detail-info">
                  <div className="detail-section">
                    <h4>Información del QR</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">ID:</span>
                        <span className="detail-value">{selectedQRCode.id}</span>
                      </div>
                      
                      <div className="detail-item">
                        <span className="detail-label">Tipo:</span>
                        <span className="detail-value">
                          <span className={`type-badge type-${selectedQRCode.type}`}>
                            {selectedQRCode.type}
                          </span>
                        </span>
                      </div>
                      
                      <div className="detail-item">
                        <span className="detail-label">Tamaño:</span>
                        <span className="detail-value">{selectedQRCode.size}px</span>
                      </div>
                      
                      <div className="detail-item">
                        <span className="detail-label">Generado:</span>
                        <span className="detail-value">
                          {new Date(selectedQRCode.timestamp).toLocaleString('es-ES')}
                        </span>
                      </div>
                      
                      {selectedQRCode.product && (
                        <>
                          <div className="detail-item">
                            <span className="detail-label">Producto:</span>
                            <span className="detail-value">{selectedQRCode.product.name}</span>
                          </div>
                          
                          <div className="detail-item">
                            <span className="detail-label">SKU:</span>
                            <span className="detail-value">{selectedQRCode.product.sku || 'N/A'}</span>
                          </div>
                          
                          <div className="detail-item">
                            <span className="detail-label">Categoría:</span>
                            <span className="detail-value">{selectedQRCode.product.category}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="detail-section">
                    <h4>Configuración</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Color QR:</span>
                        <div className="color-display">
                          <div 
                            className="color-sample" 
                            style={{ backgroundColor: selectedQRCode.colors.qrColor }}
                          />
                          <span>{selectedQRCode.colors.qrColor}</span>
                        </div>
                      </div>
                      
                      <div className="detail-item">
                        <span className="detail-label">Color fondo:</span>
                        <div className="color-display">
                          <div 
                            className="color-sample" 
                            style={{ backgroundColor: selectedQRCode.colors.bgColor }}
                          />
                          <span>{selectedQRCode.colors.bgColor}</span>
                        </div>
                      </div>
                      
                      {selectedQRCode.metadata.includeLogo && (
                        <div className="detail-item">
                          <span className="detail-label">Logo:</span>
                          <span className="detail-value">Incluido ({selectedQRCode.metadata.logoSize}px)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="detail-section">
                    <h4>Datos del QR</h4>
                    <div className="qr-data-preview">
                      <pre>{selectedQRCode.data}</pre>
                    </div>
                    <button
                      className="copy-data-button"
                      onClick={() => copyQRData(selectedQRCode.data)}
                    >
                      📋 Copiar datos
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="secondary-button"
                onClick={() => downloadQR(selectedQRCode)}
              >
                Descargar
              </button>
              <button 
                className="secondary-button"
                onClick={() => printQR(selectedQRCode)}
              >
                Imprimir
              </button>
              <button 
                className="primary-button"
                onClick={() => {
                  if (selectedQRCode.product) {
                    const product = products.find(p => p.id === selectedQRCode.product.id);
                    if (product) generateQRCode(product, selectedQRCode.data);
                  } else {
                    generateQRCode(null, selectedQRCode.data);
                  }
                  setShowQRModal(false);
                }}
              >
                Regenerar
              </button>
              <button 
                className="secondary-button"
                onClick={() => setShowQRModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Canvas oculto para generación */}
      <canvas ref={canvasRef} className="hidden-canvas" />

      {/* Información de ayuda */}
      <div className="help-section">
        <h4>💡 Consejos para códigos QR</h4>
        <div className="help-tips">
          <div className="tip">
            <span className="tip-icon">🎯</span>
            <div className="tip-content">
              <strong>Tamaño adecuado</strong>
              <p>Usa tamaños entre 200-300px para buena legibilidad</p>
            </div>
          </div>
          
          <div className="tip">
            <span className="tip-icon">🎨</span>
            <div className="tip-content">
              <strong>Contraste de colores</strong>
              <p>Asegura buen contraste entre QR y fondo</p>
            </div>
          </div>
          
          <div className="tip">
            <span className="tip-icon">📄</span>
            <div className="tip-content">
              <strong>Hoja de impresión</strong>
              <p>Usa el diseño de hoja para imprimir múltiples QR</p>
            </div>
          </div>
          
          <div className="tip">
            <span className="tip-icon">🔗</span>
            <div className="tip-content">
              <strong>Datos incluidos</strong>
              <p>Los QR de producto incluyen ID, SKU y nombre</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRManagement;