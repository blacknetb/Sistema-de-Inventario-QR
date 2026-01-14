import React, { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode.react';
import { qrService } from '../../services/qrService';
import { productService } from '../../services/productService';
import Button from '../common/Button';
import Card from '../common/Card';
import { useNotification } from '../../context/NotificationContext';
import {
  FiDownload,
  FiCopy,
  FiQrCode,
  FiPackage,
  FiCheckSquare,
  FiSquare,
  FiLock,
  FiShield,
  FiAlertCircle
} from 'react-icons/fi';
import './assets/styles/index.css';

const QR_CONFIG = {
  PREFIX: 'INV-',
  ERROR_LEVEL: 'H',
  SIZE: 256,
};

const createQRStructure = (product, customData = {}) => {
  if (!product?.id) {
    throw new Error('Producto inválido');
  }

  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const codeId = `INV-${timestamp}-${randomPart}`;

  return {
    code_id: codeId,
    product_id: product.id,
    sku: product.sku,
    product_name: product.name,
    generated_at: new Date().toISOString(),
    timestamp: timestamp,

    system_info: {
      version: '1.0',
      type: 'closed_qr',
      requires_validation: true,
    },

    product_data: {
      id: product.id,
      sku: product.sku,
      name: product.name,
      category_id: product.category_id,
      category_name: product.category_name,
      current_stock: product.current_stock || 0,
      unit: product.unit || 'unidad',
      price: product.price || 0,
    },

    custom: customData,
  };
};

const QRGenerator = () => {
  const { success, error, withLoadingNotification } = useNotification();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [bulkGenerating, setBulkGenerating] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getAll({
        limit: 50,
        include_stock: true,
      });

      if (response.success && response.data) {
        setProducts(response.data);
      } else {
        error('Error cargando productos');
      }
    } catch (err) {
      console.error('Error cargando productos:', err);
      error('No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const generateQR = useCallback(async () => {
    if (!selectedProduct) {
      error('Selecciona un producto primero');
      return;
    }

    try {
      setGenerating(true);

      const qrStructure = createQRStructure(selectedProduct, {
        generated_by: 'system',
        batch: 'single',
      });

      const response = await withLoadingNotification(
        qrService.generateQR(qrStructure),
        'Generando código QR...'
      );

      if (response.success && response.data) {
        setQrData({
          ...response.data,
          product: selectedProduct,
          display_code: qrStructure.code_id,
        });
        success('Código QR generado exitosamente');
      } else {
        error(response.message || 'Error generando QR');
      }
    } catch (err) {
      console.error('Error generando QR:', err);
      error('Error al generar código QR');
    } finally {
      setGenerating(false);
    }
  }, [selectedProduct, error, success, withLoadingNotification]);

  const toggleProductSelection = useCallback((productId) => {
    setSelectedProducts(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(productId)) {
        newSelection.delete(productId);
      } else {
        newSelection.add(productId);
      }
      return Array.from(newSelection);
    });
  }, []);

  const toggleAllProducts = useCallback(() => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  }, [selectedProducts.length, products]);

  const generateMultipleQR = async () => {
    if (selectedProducts.length === 0) {
      error('Selecciona al menos un producto');
      return;
    }

    try {
      setBulkGenerating(true);

      const selectedProductsData = products.filter(p => selectedProducts.includes(p.id));
      const qrPromises = selectedProductsData.map(product => {
        const qrStructure = createQRStructure(product, {
          generated_by: 'system',
          batch: 'bulk',
        });
        return qrService.generateQR(qrStructure);
      });

      const responses = await Promise.allSettled(qrPromises);

      const successful = responses.filter(r => r.status === 'fulfilled' && r.value?.success);
      const failed = responses.filter(r => r.status === 'rejected' || !r.value?.success);

      if (successful.length > 0) {
        success(`${successful.length} códigos QR generados exitosamente`);
      }

      if (failed.length > 0) {
        error(`${failed.length} códigos no pudieron generarse`);
      }

      setSelectedProducts([]);
    } catch (err) {
      console.error('Error generando múltiples QR:', err);
      error('Error generando códigos QR');
    } finally {
      setBulkGenerating(false);
    }
  };

  const downloadQR = useCallback(() => {
    if (!qrData) return;

    try {
      const canvas = document.getElementById('qr-canvas');
      if (!canvas) {
        error('No se pudo generar el QR');
        return;
      }

      const fileName = `QR-${selectedProduct?.sku || 'CODE'}-${Date.now()}.png`;
      canvas.toBlob((blob) => {
        if (!blob) {
          error('Error generando archivo');
          return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        success('QR descargado exitosamente');
      }, 'image/png', 1);
    } catch (err) {
      console.error('Error descargando QR:', err);
      error('Error descargando código QR');
    }
  }, [qrData, selectedProduct, success, error]);

  const copyQRCode = useCallback(async () => {
    if (!qrData?.code) return;

    try {
      await navigator.clipboard.writeText(qrData.code);
      success('Código copiado al portapapeles');
    } catch (err) {
      console.error('Error copiando código:', err);
      error(`Error copiando código: ${err.message || 'Error desconocido'}`);
    }
  }, [qrData, success, error]);

  return (
    <div className="qr-generator-container">
      <div className="qr-generator-left">
        <Card title="Generar QR">
          <div className="qr-generator-form">
            <div className="form-group">
              <label htmlFor="product" className="form-label">Producto</label>
              <select
                className="form-select"
                value={selectedProduct?.id || ''}
                onChange={(e) => {
                  const productId = e.target.value;
                  const product = products.find(p => p.id === productId);
                  setSelectedProduct(product);
                  setQrData(null);
                }}
                disabled={loading}
              >
                <option value="">Selecciona un producto</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
              {loading && (
                <div className="form-loading">Cargando...</div>
              )}
            </div>

            <div className="qr-info-box">
              <div className="qr-info-header">
                <FiShield className="qr-info-icon" />
                <span>QR Cerrado</span>
              </div>
              <p>
                Este código QR solo puede ser leído por el sistema de inventario.
              </p>
            </div>

            <Button
              variant="primary"
              fullWidth
              onClick={generateQR}
              loading={generating}
              disabled={!selectedProduct}
              startIcon={<FiLock />}
              className="btn-generate-qr"
            >
              Generar QR
            </Button>
          </div>
        </Card>

        {qrData && (
          <Card title="Información del QR">
            <div className="qr-info-details">
              <div>
                <div className="qr-info-label">Código</div>
                <div className="qr-info-code">
                  {qrData.display_code || qrData.code}
                </div>
              </div>

              <div>
                <div className="qr-info-label">Generado</div>
                <div className="qr-info-date">
                  {new Date(qrData.generated_at || qrData.created_at).toLocaleString()}
                </div>
              </div>

              <div>
                <div className="qr-info-label">Estado</div>
                <div className="qr-status-badge">
                  <FiShield /> Generado
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      <div className="qr-generator-right">
        <Card title="Vista Previa del QR">
          {qrData ? (
            <div className="qr-preview-content">
              <div className="qr-preview-alert">
                <div className="qr-preview-alert-content">
                  <FiAlertCircle className="qr-preview-alert-icon" />
                  <div>
                    <h4>Código QR Cerrado</h4>
                    <p>
                      Este QR contiene datos del sistema y requiere validación.
                    </p>
                  </div>
                </div>
              </div>

              <div className="qr-preview-display">
                <div className="qr-preview-wrapper">
                  <QRCode
                    id="qr-canvas"
                    value={qrData.code || qrData.encoded_string || ''}
                    size={QR_CONFIG.SIZE}
                    level={QR_CONFIG.ERROR_LEVEL}
                    includeMargin={true}
                    renderAs="canvas"
                    bgColor="#FFFFFF"
                    fgColor="#1E40AF"
                  />
                </div>
                <p className="qr-preview-description">
                  Código QR cerrado para el sistema de inventario.
                </p>
              </div>

              <div className="qr-preview-actions">
                <Button
                  variant="outline"
                  fullWidth
                  startIcon={<FiCopy />}
                  onClick={copyQRCode}
                  className="btn-copy-qr"
                >
                  Copiar Código
                </Button>

                <Button
                  variant="primary"
                  fullWidth
                  startIcon={<FiDownload />}
                  onClick={downloadQR}
                  className="btn-download-qr"
                >
                  Descargar QR
                </Button>
              </div>

              <div className="qr-preview-data">
                <h4>Datos del QR</h4>
                <div className="qr-preview-data-grid">
                  <div>
                    <div>Producto ID</div>
                    <div>{qrData.product?.id}</div>
                  </div>
                  <div>
                    <div>SKU</div>
                    <div>{qrData.product?.sku}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="qr-preview-empty">
              <div className="qr-preview-empty-icon">
                <FiLock />
              </div>
              <h3>Genera un código QR</h3>
              <p>
                Selecciona un producto para generar un código QR del sistema.
              </p>
            </div>
          )}
        </Card>

        <Card title="Generación Múltiple" className="qr-bulk-generator">
          <div className="qr-bulk-content">
            <p className="qr-bulk-description">
              Genera códigos QR para múltiples productos
            </p>

            <div className="qr-bulk-grid">
              <div className="qr-bulk-products">
                {products.length === 0 ? (
                  <div className="qr-bulk-empty">
                    {loading ? 'Cargando...' : 'No hay productos'}
                  </div>
                ) : (
                  <div className="qr-bulk-list">
                    <div className="qr-bulk-select-all">
                      <button
                        type="button"
                        onClick={toggleAllProducts}
                        className="qr-bulk-select-btn"
                      >
                        {selectedProducts.length === products.length ? (
                          <FiCheckSquare className="qr-checkbox-selected" />
                        ) : (
                          <FiSquare className="qr-checkbox-empty" />
                        )}
                        <span>
                          {selectedProducts.length === products.length
                            ? 'Deseleccionar Todos'
                            : 'Seleccionar Todos'}
                        </span>
                      </button>
                    </div>
                    {products.map((product) => (
                      <button
                        type="button"
                        key={product.id}
                        onClick={() => toggleProductSelection(product.id)}
                        className="qr-bulk-product-item"
                      >
                        <div className="qr-bulk-product-select">
                          {selectedProducts.includes(product.id) ? (
                            <FiCheckSquare className="qr-checkbox-selected" />
                          ) : (
                            <FiSquare className="qr-checkbox-empty" />
                          )}
                          <div className="qr-bulk-product-info">
                            <div className="qr-bulk-product-name">{product.name}</div>
                            <div className="qr-bulk-product-sku">{product.sku}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="qr-bulk-controls">
                <div className="qr-bulk-summary">
                  <h4>Resumen</h4>
                  <div className="qr-bulk-summary-details">
                    <p>Productos seleccionados: {selectedProducts.length}</p>
                    <p>Total productos: {products.length}</p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  fullWidth
                  startIcon={<FiLock />}
                  onClick={generateMultipleQR}
                  loading={bulkGenerating}
                  disabled={selectedProducts.length === 0}
                  className="btn-generate-bulk"
                >
                  Generar {selectedProducts.length} QR
                </Button>

                {selectedProducts.length > 0 && (
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => setSelectedProducts([])}
                    className="btn-clear-selection"
                  >
                    Limpiar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default QRGenerator;