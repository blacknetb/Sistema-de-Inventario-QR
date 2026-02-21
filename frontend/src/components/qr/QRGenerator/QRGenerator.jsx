import React, { useState } from 'react';
import QRDisplay from '../QRDisplay';
import styles from './QRGenerator.module.css';

const QRGenerator = ({ onGenerate, productData }) => {
  const [qrData, setQrData] = useState({
    productId: productData?.id || '',
    productName: productData?.nombre || '',
    price: productData?.precio || '',
    sku: productData?.sku || '',
    size: 200,
    format: 'png',
    foreground: '#000000',
    background: '#ffffff',
    includeLogo: true
  });

  const [generatedQR, setGeneratedQR] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setQrData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const generateQRData = () => {
    const data = {
      id: qrData.productId,
      name: qrData.productName,
      sku: qrData.sku,
      price: qrData.price,
      timestamp: new Date().toISOString(),
      url: `${window.location.origin}/product/${qrData.productId}`
    };
    
    return JSON.stringify(data);
  };

  const handleGenerate = () => {
    if (!qrData.productId || !qrData.productName) {
      setError('El ID y nombre del producto son requeridos');
      return;
    }

    setError(null);
    const data = generateQRData();
    setGeneratedQR(data);
    
    if (onGenerate) {
      onGenerate(data);
    }
  };

  const handleDownload = () => {
    // Simular descarga
    alert('Descargando código QR...');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.qrGeneratorContainer}>
      <div className={styles.header}>
        <h2>Generador de Códigos QR</h2>
        <p>Crea códigos QR personalizados para tus productos</p>
      </div>

      <div className={styles.content}>
        <div className={styles.formSection}>
          <h3>Datos del Producto</h3>
          
          <div className={styles.formGroup}>
            <label htmlFor="productId">ID del Producto *</label>
            <input
              type="text"
              id="productId"
              name="productId"
              value={qrData.productId}
              onChange={handleChange}
              placeholder="Ej: PROD-001"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="productName">Nombre del Producto *</label>
            <input
              type="text"
              id="productName"
              name="productName"
              value={qrData.productName}
              onChange={handleChange}
              placeholder="Ej: Smartphone X"
              className={styles.input}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="sku">SKU</label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={qrData.sku}
                onChange={handleChange}
                placeholder="SKU-123"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="price">Precio</label>
              <input
                type="number"
                id="price"
                name="price"
                value={qrData.price}
                onChange={handleChange}
                placeholder="0.00"
                className={styles.input}
              />
            </div>
          </div>

          <h3 style={{ marginTop: 30 }}>Configuración Visual</h3>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="foreground">Color del código</label>
              <input
                type="color"
                id="foreground"
                name="foreground"
                value={qrData.foreground}
                onChange={handleChange}
                className={styles.colorInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="background">Color de fondo</label>
              <input
                type="color"
                id="background"
                name="background"
                value={qrData.background}
                onChange={handleChange}
                className={styles.colorInput}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="size">Tamaño (px)</label>
              <select
                id="size"
                name="size"
                value={qrData.size}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="150">150 x 150</option>
                <option value="200">200 x 200</option>
                <option value="250">250 x 250</option>
                <option value="300">300 x 300</option>
                <option value="400">400 x 400</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="format">Formato</label>
              <select
                id="format"
                name="format"
                value={qrData.format}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
                <option value="svg">SVG</option>
              </select>
            </div>
          </div>

          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="includeLogo"
                checked={qrData.includeLogo}
                onChange={handleChange}
              />
              <span>Incluir logo de la empresa</span>
            </label>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <button 
            className={styles.generateButton}
            onClick={handleGenerate}
          >
            Generar Código QR
          </button>
        </div>

        <div className={styles.previewSection}>
          <h3>Vista Previa</h3>
          
          {generatedQR ? (
            <>
              <div className={styles.qrPreview}>
                <QRDisplay 
                  data={generatedQR}
                  size={qrData.size}
                  foreground={qrData.foreground}
                  background={qrData.background}
                  includeLogo={qrData.includeLogo}
                />
              </div>

              <div className={styles.previewActions}>
                <button 
                  className={styles.actionButton}
                  onClick={handleDownload}
                >
                  ⬇️ Descargar
                </button>
                <button 
                  className={styles.actionButton}
                  onClick={handlePrint}
                >
                  🖨️ Imprimir
                </button>
                <button 
                  className={styles.actionButton}
                  onClick={() => setGeneratedQR(null)}
                >
                  🔄 Nuevo
                </button>
              </div>

              <div className={styles.infoBox}>
                <h4>Información incluida:</h4>
                <ul>
                  <li>ID: {qrData.productId}</li>
                  <li>Producto: {qrData.productName}</li>
                  {qrData.sku && <li>SKU: {qrData.sku}</li>}
                  {qrData.price && <li>Precio: ${qrData.price}</li>}
                  <li>URL: /product/{qrData.productId}</li>
                </ul>
              </div>
            </>
          ) : (
            <div className={styles.emptyPreview}>
              <span className={styles.previewIcon}>📱</span>
              <p>Completa los datos y genera un código QR para ver la vista previa</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRGenerator;