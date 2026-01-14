import React, { useState, useRef, useEffect, useCallback } from 'react';
import QRCode from 'qrcode.react';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import {
  FiDownload,
  FiSettings,
  FiCheck,
  FiX,
  FiImage,
  FiFile,
  FiFileText,
  FiShield,
  FiLock,
  FiAlertCircle
} from 'react-icons/fi';
import { useNotification } from '../../context/NotificationContext';
import './assets/styles/index.css';

const generateFileName = (product, format, isClosed = false) => {
  const timestamp = Date.now();
  const prefix = isClosed ? 'QR-CERRADO' : 'QR';
  const sku = product?.sku ? `${product.sku}-` : '';
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  return `${prefix}-${sku}${date}-${timestamp}.${format}`.replace(/[^a-zA-Z0-9.-]/g, '_');
};

const getDefaultSettings = (product, isClosed) => ({
  size: isClosed ? 300 : 256,
  level: 'H',
  margin: 2,
  includeLogo: isClosed,
  includeText: true,
  text: isClosed ? `QR Cerrado - ${product?.name || 'Producto'}` : product?.name || 'QR Code',
  fileName: generateFileName(product, 'png', isClosed),
  format: 'png',
  quality: 1.0,
});

const QRDownload = ({ qrCode, product, defaultFileName, isClosedQR = false }) => {
  const { success, error } = useNotification();
  const [settings, setSettings] = useState(() =>
    getDefaultSettings(product, isClosedQR)
  );

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const qrContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (settings.includeLogo && isClosedQR && !logoPreview) {
      const systemLogo = '/assets/logo-shield.png';
      setLogoPreview(systemLogo);
    }
  }, [settings.includeLogo, isClosedQR, logoPreview]);

  const handleSettingChange = useCallback((field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleLogoUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      error('Selecciona un archivo de imagen válido');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      error('El archivo es demasiado grande. Máximo 2MB');
      return;
    }

    setLogoFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  }, [error]);

  const removeLogo = useCallback(() => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const downloadPNG = useCallback(async () => {
    try {
      setGenerating(true);

      const canvas = document.getElementById('qr-canvas-download');
      if (!canvas) {
        throw new Error('Canvas no encontrado');
      }

      const fileName = generateFileName(product, 'png', isClosedQR);

      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Error generando imagen');
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
      }, 'image/png', settings.quality);

    } catch (err) {
      console.error('Error descargando PNG:', err);
      error('Error al descargar QR');
    } finally {
      setGenerating(false);
    }
  }, [product, isClosedQR, settings.quality, success, error]);

  const downloadSVG = useCallback(() => {
    try {
      const svgElement = document.getElementById('qr-svg-download');
      if (!svgElement) {
        throw new Error('SVG no encontrado');
      }

      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      const fileName = generateFileName(product, 'svg', isClosedQR);
      const a = document.createElement('a');
      a.href = svgUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(svgUrl);

      success('SVG descargado exitosamente');
    } catch (err) {
      console.error('Error descargando SVG:', err);
      error('Error al descargar SVG');
    }
  }, [product, isClosedQR, success, error]);

  const downloadTXT = useCallback(() => {
    try {
      const txtData = `
Código QR ${isClosedQR ? 'Cerrado' : 'Abierto'}
===========================================
Producto: ${product?.name || 'N/A'}
SKU: ${product?.sku || 'N/A'}
Código QR: ${qrCode?.code || qrCode?.id || 'N/A'}
Generado: ${new Date().toLocaleString()}
${isClosedQR ? 'Tipo: QR Cerrado (Sistema Privado)' : 'Tipo: QR Abierto'}
${qrCode?.raw_data?.code_id ? `ID QR: ${qrCode.raw_data.code_id}` : ''}
===========================================
Sistema de Inventario QR
${new Date().toISOString()}
      `.trim();

      const txtBlob = new Blob([txtData], { type: 'text/plain;charset=utf-8' });
      const txtUrl = URL.createObjectURL(txtBlob);

      const fileName = generateFileName(product, 'txt', isClosedQR);
      const a = document.createElement('a');
      a.href = txtUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(txtUrl);

      success('Archivo TXT descargado exitosamente');
    } catch (err) {
      console.error('Error descargando TXT:', err);
      error('Error al descargar TXT');
    }
  }, [product, qrCode, isClosedQR, success, error]);

  const renderQRCode = () => {
    const qrValue = isClosedQR ? (qrCode?.encoded_string || qrCode?.code) : qrCode?.code;

    return (
      <div className="qr-download-preview" ref={qrContainerRef}>
        <div className={`qr-download-wrapper ${isClosedQR ? 'qr-download-closed' : 'qr-download-open'}`}>
          {isClosedQR && (
            <div className="qr-download-badge">
              <FiLock /> CERRADO
            </div>
          )}

          <QRCode
            id="qr-canvas-download"
            value={qrValue}
            size={settings.size}
            level={settings.level}
            includeMargin={true}
            marginSize={settings.margin}
            renderAs="canvas"
            bgColor="#FFFFFF"
            fgColor={isClosedQR ? "#1E40AF" : "#000000"}
          />

          <svg
            id="qr-svg-download"
            className="qr-download-svg"
            width={settings.size}
            height={settings.size}
          >
            <QRCode
              value={qrValue}
              size={settings.size}
              level={settings.level}
              includeMargin={true}
              marginSize={settings.margin}
              renderAs="svg"
              bgColor="#FFFFFF"
              fgColor={isClosedQR ? "#1E40AF" : "#000000"}
            />
          </svg>

          {settings.includeLogo && logoPreview && (
            <div className="qr-download-logo">
              <img
                src={logoPreview}
                alt="Logo"
                className="qr-download-logo-image"
              />
            </div>
          )}
        </div>

        {settings.includeText && (
          <div className="qr-download-text">
            <div className="qr-download-text-title">{settings.text}</div>
            {product?.sku && (
              <div className="qr-download-sku">
                {product.sku}
              </div>
            )}
            <div className="qr-download-code">
              {isClosedQR ? (qrCode?.display_code || qrCode?.code) : qrCode?.code}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleDownload = useCallback(() => {
    switch (settings.format) {
      case 'png':
        downloadPNG();
        break;
      case 'svg':
        downloadSVG();
        break;
      case 'txt':
        downloadTXT();
        break;
      default:
        downloadPNG();
    }
  }, [settings.format, downloadPNG, downloadSVG, downloadTXT]);

  return (
    <div className="qr-download-container">
      <div className="qr-download-settings">
        <Card
          title={
            <div className="qr-download-settings-title">
              <FiSettings />
              Configuración
            </div>
          }
          className="qr-download-settings-card"
        >
          <div className="qr-download-settings-content">
            {isClosedQR && (
              <div className="qr-download-notice">
                <div className="qr-download-notice-content">
                  <FiShield className="qr-download-notice-icon" />
                  <div className="qr-download-notice-text">
                    <strong>QR Cerrado</strong>
                    <p>Contiene datos encriptados del sistema.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="qr-download-format">
              <label className="qr-download-label">Formato</label>
              <div className="qr-download-format-buttons">
                {[
                  { value: 'png', label: 'PNG', icon: <FiImage /> },
                  { value: 'svg', label: 'SVG', icon: <FiFile /> },
                  { value: 'txt', label: 'TXT', icon: <FiFileText /> },
                ].map((format) => (
                  <button
                    key={format.value}
                    type="button"
                    onClick={() => handleSettingChange('format', format.value)}
                    className={`qr-download-format-btn ${settings.format === format.value ? 'qr-download-format-active' : ''}`}
                    disabled={generating}
                  >
                    {format.icon}
                    {format.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="qr-download-filename">
              <Input
                label="Nombre del archivo"
                value={settings.fileName}
                onChange={(e) => handleSettingChange('fileName', e.target.value)}
                placeholder="qr-code.png"
                disabled={generating}
              />
            </div>

            <div className="qr-download-size">
              <label className="qr-download-label">Tamaño del QR</label>
              <div className="qr-download-size-control">
                <input
                  type="range"
                  min="128"
                  max="512"
                  step="32"
                  value={settings.size}
                  onChange={(e) => handleSettingChange('size', parseInt(e.target.value))}
                  className="qr-download-slider"
                  disabled={generating}
                />
                <span className="qr-download-size-value">{settings.size}px</span>
              </div>
            </div>

            <div className="qr-download-logo-settings">
              <label htmlFor="logo" className="qr-download-label">Logo</label>
              <div className="qr-download-logo-controls">
                <div className="qr-download-logo-toggle">
                  <span>Incluir logo</span>
                  <button
                    type="button"
                    onClick={() => handleSettingChange('includeLogo', !settings.includeLogo)}
                    className={`qr-download-toggle ${settings.includeLogo ? 'qr-download-toggle-active' : ''}`}
                    disabled={generating}
                  >
                    <span className="qr-download-toggle-slider"></span>
                  </button>
                </div>

                {settings.includeLogo && (
                  <div className="qr-download-logo-upload">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="qr-download-file-input"
                      disabled={generating}
                    />

                    {logoPreview && (
                      <div className="qr-download-logo-preview">
                        <div className="qr-download-logo-preview-label">Vista previa:</div>
                        <div className="qr-download-logo-image-container">
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="qr-download-logo-preview-image"
                          />
                          <button
                            type="button"
                            onClick={removeLogo}
                            className="qr-download-logo-remove"
                            disabled={generating}
                          >
                            <FiX />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                setSettings(getDefaultSettings(product, isClosedQR));
                removeLogo();
              }}
              startIcon={<FiX />}
              disabled={generating}
              className="btn-reset-settings"
            >
              Restablecer
            </Button>
          </div>
        </Card>
      </div>

      <div className="qr-download-preview-panel">
        <Card
          title={
            <div className="qr-download-preview-header">
              <div className="qr-download-preview-title">
                <FiDownload />
                Vista Previa
              </div>
              {generating && (
                <span className="qr-download-generating">
                  Generando...
                </span>
              )}
            </div>
          }
        >
          <div className="qr-download-preview-content">
            <div className="qr-download-preview-display">
              {renderQRCode()}
            </div>

            <div className="qr-download-action">
              <Button
                variant="primary"
                size="medium"
                startIcon={<FiDownload />}
                onClick={handleDownload}
                className="btn-download-qr-file"
                loading={generating}
                disabled={generating}
              >
                {generating ? 'Generando...' : `Descargar ${settings.format.toUpperCase()}`}
              </Button>
            </div>

            <div className="qr-download-file-info">
              <h4>Detalles del Archivo</h4>
              <div className="qr-download-file-details">
                <div className="qr-download-file-detail">
                  <div>Nombre:</div>
                  <div>{settings.fileName}</div>
                </div>

                <div className="qr-download-file-detail">
                  <div>Formato:</div>
                  <div>{settings.format.toUpperCase()}</div>
                </div>

                <div className="qr-download-file-detail">
                  <div>Tamaño:</div>
                  <div>{settings.size}px</div>
                </div>

                <div className="qr-download-file-detail">
                  <div>Calidad:</div>
                  <div>Alta</div>
                </div>
              </div>
            </div>

            <div className={`qr-download-recommendations ${isClosedQR ? 'qr-download-recommendations-closed' : ''}`}>
              <div className="qr-download-recommendations-content">
                {isClosedQR ? (
                  <FiShield className="qr-download-recommendations-icon" />
                ) : (
                  <FiAlertCircle className="qr-download-recommendations-icon" />
                )}
                <div>
                  <h4>Recomendaciones</h4>
                  <ul className="qr-download-recommendations-list">
                    {isClosedQR ? (
                      <>
                        <li>• Almacene en ubicaciones seguras</li>
                        <li>• Solo comparta con personal autorizado</li>
                        <li>• No modifique el código QR</li>
                      </>
                    ) : (
                      <>
                        <li>• QR estándar, puede ser leído por cualquier escáner</li>
                        <li>• PNG para impresión, SVG para calidad</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default QRDownload;