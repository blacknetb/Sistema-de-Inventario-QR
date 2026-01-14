import React, { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types'; // ✅ CORREGIDO: Importación faltante
import {
  Download, FileText, FileSpreadsheet,
  Printer, Mail, X, Check, Settings,
  FilePieChart, FileBarChart, FileImage,
  AlertCircle, Info, Clock, Zap,
  CloudUpload, Share2, Link,
  ChevronUp, ChevronDown, Shield, Eye,
  Upload, Cloud, Save, Copy
} from 'lucide-react';
import './assets/styles/index.css';


const ExportOptions = ({
  data,
  reportType = 'general',
  fileName = 'reporte',
  onClose,
  onExport,
  customOptions = {},
  exportConfig = {}
}) => {
  // ✅ Estados iniciales con valores por defecto seguros
  const [exportFormat, setExportFormat] = useState(exportConfig.format || 'pdf');
  const [includeCharts, setIncludeCharts] = useState(exportConfig.includeCharts ?? true);
  const [includeFilters, setIncludeFilters] = useState(exportConfig.includeFilters ?? true);
  const [emailRecipient, setEmailRecipient] = useState(exportConfig.emailRecipient || '');
  const [emailSubject, setEmailSubject] = useState(exportConfig.emailSubject || '');
  const [emailMessage, setEmailMessage] = useState(exportConfig.emailMessage || '');
  const [pageSize, setPageSize] = useState(exportConfig.pageSize || 'A4');
  const [orientation, setOrientation] = useState(exportConfig.orientation || 'portrait');
  const [compression, setCompression] = useState(exportConfig.compression || 'normal');
  const [exportMode, setExportMode] = useState(exportConfig.exportMode || 'download');
  const [isExporting, setIsExporting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [quality, setQuality] = useState(exportConfig.quality || 'high');
  const [watermark, setWatermark] = useState(exportConfig.watermark || false);
  const [passwordProtect, setPasswordProtect] = useState(exportConfig.passwordProtect || false);
  const [exportPassword, setExportPassword] = useState(exportConfig.exportPassword || '');
  const [cloudService, setCloudService] = useState(exportConfig.cloudService || '');
  const [makePublic, setMakePublic] = useState(exportConfig.makePublic || false);
  const [includeAttachments, setIncludeAttachments] = useState(exportConfig.includeAttachments ?? true);
  const [sendCopy, setSendCopy] = useState(exportConfig.sendCopy || false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // ✅ Referencia para cleanup de timeouts
  const timeoutRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // ✅ Cleanup de efectos
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // ✅ Opciones de exportación memoizadas
  const exportOptions = useMemo(() => [
    {
      id: 'pdf',
      label: 'PDF',
      icon: FileText,
      description: 'Documento optimizado para impresión',
      color: 'export-option-pdf',
      formats: ['A4', 'Letter', 'Legal'],
      features: ['Incluir gráficos', 'Incluir filtros aplicados', 'Marcas de agua']
    },
    {
      id: 'excel',
      label: 'Excel',
      icon: FileSpreadsheet,
      description: 'Hoja de cálculo editable',
      color: 'export-option-excel',
      formats: ['XLSX', 'CSV'],
      features: ['Datos tabulares', 'Fórmulas', 'Filtros de Excel']
    },
    {
      id: 'csv',
      label: 'CSV',
      icon: FileBarChart,
      description: 'Datos planos para análisis',
      color: 'export-option-csv',
      formats: ['CSV'],
      features: ['Compatible con cualquier software', 'Ligero', 'Fácil de procesar']
    },
    {
      id: 'print',
      label: 'Impresión',
      icon: Printer,
      description: 'Vista previa para impresión',
      color: 'export-option-print',
      features: ['Optimizado para impresora', 'Ajuste automático', 'Encabezados y pies']
    },
    {
      id: 'image',
      label: 'Imagen',
      icon: FileImage,
      description: 'Captura del reporte',
      color: 'export-option-image',
      formats: ['PNG', 'JPEG', 'SVG'],
      features: ['Alta resolución', 'Transparencia', 'Fácil de compartir']
    },
    ...(customOptions.additionalFormats || [])
  ], [customOptions]);

  // ✅ Configuraciones memoizadas
  const pageSizes = useMemo(() => [
    { id: 'A4', label: 'A4 (210 × 297 mm)', icon: '📄' },
    { id: 'Letter', label: 'Carta (216 × 279 mm)', icon: '📝' },
    { id: 'Legal', label: 'Oficio (216 × 356 mm)', icon: '📑' },
    { id: 'A3', label: 'A3 (297 × 420 mm)', icon: '📜' }
  ], []);

  const compressionLevels = useMemo(() => [
    { id: 'high', label: 'Alta compresión', description: 'Archivo pequeño, calidad media', icon: '📦' },
    { id: 'normal', label: 'Compresión normal', description: 'Balance entre tamaño y calidad', icon: '⚖️' },
    { id: 'low', label: 'Baja compresión', description: 'Archivo grande, máxima calidad', icon: '🎨' }
  ], []);

  const qualityLevels = useMemo(() => [
    { id: 'low', label: 'Baja', description: 'Para vista rápida', size: 'Pequeño' },
    { id: 'medium', label: 'Media', description: 'Balance calidad/tamaño', size: 'Mediano' },
    { id: 'high', label: 'Alta', description: 'Máxima calidad', size: 'Grande' },
    { id: 'ultra', label: 'Ultra', description: 'Calidad profesional', size: 'Muy grande' }
  ], []);

  const cloudServices = useMemo(() => [
    { id: 'google-drive', label: 'Google Drive', icon: '📁' },
    { id: 'dropbox', label: 'Dropbox', icon: '💾' },
    { id: 'onedrive', label: 'OneDrive', icon: '☁️' },
    { id: 'share-link', label: 'Enlace compartido', icon: '🔗' }
  ], []);

  // ✅ Obtener opción actual
  const getCurrentOption = useCallback(() => {
    return exportOptions.find(option => option.id === exportFormat) || exportOptions[0];
  }, [exportFormat, exportOptions]);

  // ✅ Validación de email
  const isValidEmail = useCallback((email) => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }, []);

  // ✅ Validación de contraseña
  const isValidPassword = useCallback((password) => {
    return password && password.length >= 4 && password.length <= 32;
  }, []);

  // ✅ Validar formulario
  const validateForm = useCallback(() => {
    setErrorMessage('');
    setSuccessMessage('');

    if (exportMode === 'email') {
      if (!emailRecipient.trim()) {
        setErrorMessage('Por favor, ingresa una dirección de correo electrónico');
        return false;
      }
      if (!isValidEmail(emailRecipient)) {
        setErrorMessage('Por favor, ingresa una dirección de correo electrónico válida');
        return false;
      }
    }

    if (passwordProtect && exportPassword) {
      if (!isValidPassword(exportPassword)) {
        setErrorMessage('La contraseña debe tener entre 4 y 32 caracteres');
        return false;
      }
    }

    if (exportMode === 'cloud' && !cloudService) {
      setErrorMessage('Por favor, selecciona un servicio en la nube');
      return false;
    }

    if (!data || (Array.isArray(data) && data.length === 0) || (typeof data === 'object' && Object.keys(data).length === 0)) {
      setErrorMessage('No hay datos para exportar');
      return false;
    }

    return true;
  }, [exportMode, emailRecipient, passwordProtect, exportPassword, cloudService, isValidEmail, isValidPassword, data]);

  // ✅ Manejar exportación
  const handleExport = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsExporting(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Configuración de exportación compatible con backend
    const exportConfigData = {
      format: exportFormat,
      includeCharts,
      includeFilters,
      pageSize,
      orientation,
      compression,
      quality,
      watermark,
      password: passwordProtect ? exportPassword : undefined,
      fileName: `${fileName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}`,
      reportType,
      timestamp: new Date().toISOString(),
      dataSize: data ? JSON.stringify(data).length : 0,
      exportMode,
      metadata: {
        generatedBy: 'Sistema de Inventario',
        version: '1.0.0'
      },
      ...(customOptions.exportConfig || {})
    };

    // Configuración específica por modo
    if (exportMode === 'email') {
      exportConfigData.email = {
        recipient: emailRecipient,
        subject: emailSubject || `${fileName} - ${new Date().toLocaleDateString()}`,
        message: emailMessage,
        includeAttachments,
        sendCopy,
        cc: customOptions.cc || '',
        bcc: customOptions.bcc || ''
      };
    }

    if (exportMode === 'cloud') {
      exportConfigData.cloud = {
        service: cloudService,
        makePublic,
        folder: customOptions.cloudFolder || '/exports'
      };
    }

    try {
      await simulateExportWithProgress();

      if (onExport && typeof onExport === 'function') {
        await onExport(exportConfigData);
      }

      setSuccessMessage(`✅ Reporte exportado exitosamente en formato ${exportFormat.toUpperCase()}`);

      timeoutRef.current = setTimeout(() => {
        if (onClose && typeof onClose === 'function') {
          onClose();
        }
      }, 2000);

    } catch (error) {
      console.error('❌ Error al exportar:', error);
      setErrorMessage(`Error al exportar el reporte: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsExporting(false);
    }
  }, [
    validateForm, exportFormat, includeCharts, includeFilters, pageSize,
    orientation, compression, quality, watermark, passwordProtect, exportPassword,
    fileName, reportType, data, customOptions, exportMode, emailRecipient,
    emailSubject, emailMessage, includeAttachments, sendCopy, cloudService,
    makePublic, onExport, onClose
  ]);

  // ✅ Simular progreso
  const simulateExportWithProgress = useCallback(() => {
    return new Promise((resolve) => {
      const totalTime = exportMode === 'cloud' ? 2000 : 1500;
      const interval = 100;
      let elapsed = 0;

      progressIntervalRef.current = setInterval(() => {
        elapsed += interval;
        if (elapsed >= totalTime) {
          clearInterval(progressIntervalRef.current);
          resolve();
        }
      }, interval);
    });
  }, [exportMode]);

  // ✅ Renderizar opciones específicas
  const renderFormatOptions = useCallback(() => {
    if (exportFormat === 'pdf') {
      return (
        <div className="space-y-6">
          <div>
            <label className="form-label">
              Tamaño de página
            </label>
            <div className="grid grid-cols-2 gap-3">
              {pageSizes.map((size) => (
                <button
                  key={size.id}
                  type="button"
                  onClick={() => setPageSize(size.id)}
                  className={`export-size-button ${pageSize === size.id ? 'export-size-button-active' : ''}`}
                  aria-pressed={pageSize === size.id}
                >
                  <span>{size.label}</span>
                  <span className="export-size-icon" aria-hidden="true">{size.icon}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="form-label">
                Orientación
              </label>
              <div className="export-orientation-container">
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`export-orientation-button ${orientation === 'portrait' ? 'export-orientation-button-active' : ''}`}
                  aria-pressed={orientation === 'portrait'}
                >
                  <div className="export-orientation-icon">
                    <div className="export-orientation-icon-portrait"></div>
                  </div>
                  <span>Vertical</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`export-orientation-button ${orientation === 'landscape' ? 'export-orientation-button-active' : ''}`}
                  aria-pressed={orientation === 'landscape'}
                >
                  <div className="export-orientation-icon">
                    <div className="export-orientation-icon-landscape"></div>
                  </div>
                  <span>Horizontal</span>
                </button>
              </div>
            </div>
          </div>

          <div className="export-advanced-section">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="export-advanced-toggle"
              aria-expanded={showAdvanced}
            >
              <Settings className="export-advanced-icon" />
              Opciones avanzadas
              {showAdvanced ? (
                <ChevronUp className="export-advanced-chevron" />
              ) : (
                <ChevronDown className="export-advanced-chevron" />
              )}
            </button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="export-advanced-content"
                >
                  <div className="export-advanced-option">
                    <div>
                      <div className="export-advanced-label">Marca de agua</div>
                      <div className="export-advanced-description">Agrega marca de agua al documento</div>
                    </div>
                    <label className="export-toggle-switch">
                      <input
                        type="checkbox"
                        checked={watermark}
                        onChange={(e) => setWatermark(e.target.checked)}
                        className="export-toggle-input"
                      />
                      <span className="export-toggle-slider"></span>
                    </label>
                  </div>

                  <div className="export-advanced-option">
                    <div>
                      <div className="export-advanced-label">Proteger con contraseña</div>
                      <div className="export-advanced-description">Añade seguridad al documento</div>
                    </div>
                    <label className="export-toggle-switch">
                      <input
                        type="checkbox"
                        checked={passwordProtect}
                        onChange={(e) => setPasswordProtect(e.target.checked)}
                        className="export-toggle-input"
                      />
                      <span className="export-toggle-slider"></span>
                    </label>
                  </div>

                  {passwordProtect && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="export-password-section"
                    >
                      <label className="form-label">
                        Contraseña
                      </label>
                      <input
                        type="password"
                        value={exportPassword}
                        onChange={(e) => setExportPassword(e.target.value)}
                        placeholder="Ingresa una contraseña segura"
                        className="form-input"
                        minLength="4"
                        maxLength="32"
                      />
                      <p className="form-hint">
                        Mínimo 4 caracteres, máximo 32. Esta contraseña será necesaria para abrir el documento.
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      );
    }

    if (exportFormat === 'image') {
      return (
        <div className="space-y-6">
          <div>
            <label className="form-label">
              Calidad de imagen
            </label>
            <div className="grid grid-cols-2 gap-3">
              {qualityLevels.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setQuality(level.id)}
                  className={`export-quality-button ${quality === level.id ? 'export-quality-button-active' : ''}`}
                  aria-pressed={quality === level.id}
                >
                  <div className="export-quality-label">{level.label}</div>
                  <div className="export-quality-description">{level.description}</div>
                  <div className="export-quality-size">Tamaño: {level.size}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label">
              Nivel de compresión
            </label>
            <div className="export-compression-options">
              {compressionLevels.map((level) => (
                <label key={level.id} className="export-compression-option">
                  <input
                    type="radio"
                    name="compression"
                    checked={compression === level.id}
                    onChange={() => setCompression(level.id)}
                    className="export-compression-radio"
                  />
                  <div className="export-compression-content">
                    <span className="export-compression-icon" aria-hidden="true">{level.icon}</span>
                    <div>
                      <div className="export-compression-label">{level.label}</div>
                      <div className="export-compression-description">{level.description}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (exportFormat === 'excel') {
      return (
        <div className="space-y-4">
          <div className="export-info-box">
            <div className="export-info-content">
              <Info className="export-info-icon" />
              <div className="export-info-text">
                <p className="export-info-title">Información de exportación Excel</p>
                <p>El archivo incluirá todas las hojas de cálculo con fórmulas y formato aplicado.</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  }, [
    exportFormat, pageSizes, pageSize, orientation,
    showAdvanced, watermark, passwordProtect, exportPassword,
    qualityLevels, quality, compressionLevels, compression
  ]);

  // ✅ Renderizar formulario de email
  const renderEmailForm = useCallback(() => {
    if (exportMode !== 'email') return null;

    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="export-email-form"
      >
        <div>
          <label htmlFor="email-recipient" className="form-label required">
            Correo electrónico del destinatario
          </label>
          <input
            id="email-recipient"
            type="email"
            value={emailRecipient}
            onChange={(e) => setEmailRecipient(e.target.value)}
            placeholder="ejemplo@correo.com"
            className={`form-input ${emailRecipient && !isValidEmail(emailRecipient) ? 'form-input-error' : ''}`}
            required
          />
          {emailRecipient && !isValidEmail(emailRecipient) && (
            <p className="form-error">Por favor ingresa un email válido</p>
          )}
        </div>

        <div>
          <label htmlFor="email-subject" className="form-label">
            Asunto del correo
          </label>
          <input
            id="email-subject"
            type="text"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            placeholder={`${fileName} - ${new Date().toLocaleDateString()}`}
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor="email-message" className="form-label">
            Mensaje adicional
          </label>
          <textarea
            id="email-message"
            value={emailMessage}
            onChange={(e) => setEmailMessage(e.target.value)}
            placeholder="Agrega un mensaje personalizado para el destinatario..."
            rows="4"
            className="form-textarea"
          />
        </div>

        <div className="export-checkbox-group">
          <label className="export-checkbox-label">
            <input
              type="checkbox"
              id="include-attachments"
              checked={includeAttachments}
              onChange={(e) => setIncludeAttachments(e.target.checked)}
              className="export-checkbox"
            />
            <span className="export-checkbox-text">Incluir archivo adjunto</span>
          </label>

          <label className="export-checkbox-label">
            <input
              type="checkbox"
              id="send-copy"
              checked={sendCopy}
              onChange={(e) => setSendCopy(e.target.checked)}
              className="export-checkbox"
            />
            <span className="export-checkbox-text">Enviar copia a mí</span>
          </label>
        </div>
      </motion.div>
    );
  }, [exportMode, emailRecipient, emailSubject, emailMessage, includeAttachments, sendCopy, fileName, isValidEmail]);

  // ✅ Renderizar opciones de nube
  const renderCloudOptions = useCallback(() => {
    if (exportMode !== 'cloud') return null;

    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="export-cloud-form"
      >
        <div>
          <label className="form-label">
            Servicio en la nube
          </label>
          <div className="grid grid-cols-2 gap-3">
            {cloudServices.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => setCloudService(service.id)}
                className={`export-cloud-button ${cloudService === service.id ? 'export-cloud-button-active' : ''}`}
              >
                <span className="export-cloud-icon" aria-hidden="true">{service.icon}</span>
                <span>{service.label}</span>
              </button>
            ))}
          </div>
        </div>

        {cloudService && (
          <div>
            <label className="export-checkbox-label">
              <input
                type="checkbox"
                checked={makePublic}
                onChange={(e) => setMakePublic(e.target.checked)}
                className="export-checkbox"
              />
              <span className="export-checkbox-text">
                Hacer público (enlace accesible)
              </span>
            </label>
            {makePublic && (
              <p className="export-cloud-warning">
                ⚠️ Cualquier persona con el enlace podrá acceder al archivo.
              </p>
            )}
          </div>
        )}
      </motion.div>
    );
  }, [exportMode, cloudService, cloudServices, makePublic]);

  // ✅ Estimar tamaño del archivo
  const estimateFileSize = useMemo(() => {
    if (!data) return 'Calculando...';

    const baseSize = JSON.stringify(data).length;
    let estimatedSize = baseSize;

    if (exportFormat === 'pdf') estimatedSize *= 1.5;
    if (exportFormat === 'excel') estimatedSize *= 1.2;
    if (exportFormat === 'image') estimatedSize *= 3;
    if (compression === 'high') estimatedSize *= 0.5;
    if (compression === 'low') estimatedSize *= 1.5;
    if (quality === 'ultra') estimatedSize *= 2;
    if (quality === 'high') estimatedSize *= 1.5;

    const sizeInKB = Math.ceil(estimatedSize / 1024);
    return sizeInKB > 1024
      ? `${(sizeInKB / 1024).toFixed(1)} MB`
      : `${sizeInKB} KB`;
  }, [data, exportFormat, compression, quality]);

  // ✅ Obtener nombre de archivo
  const getFileName = useCallback(() => {
    const date = new Date().toISOString().split('T')[0];
    const safeFileName = fileName.replace(/[^a-z0-9]/gi, '_');
    return `${safeFileName}_${date}.${exportFormat}`;
  }, [fileName, exportFormat]);

  // ✅ Copiar nombre de archivo
  const handleCopyFileName = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getFileName());
      setSuccessMessage('Nombre copiado al portapapeles');
      timeoutRef.current = setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err) {
      setErrorMessage('Error al copiar el nombre');
    }
  }, [getFileName]);

  // ✅ Renderizar mensajes de estado
  const renderStatusMessages = useCallback(() => {
    if (!errorMessage && !successMessage) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="export-status-messages"
        >
          {errorMessage && (
            <div className="export-error-message">
              <div className="export-error-content">
                <AlertCircle className="export-error-icon" />
                <p className="export-error-text">{errorMessage}</p>
              </div>
            </div>
          )}
          {successMessage && (
            <div className="export-success-message">
              <div className="export-success-content">
                <Check className="export-success-icon" />
                <p className="export-success-text">{successMessage}</p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }, [errorMessage, successMessage]);

  return (
    <div
      className="export-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="export-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {renderStatusMessages()}

        <div className="export-modal-header">
          <div className="export-modal-header-content">
            <div className="export-modal-icon">
              <Download className="export-modal-icon-svg" />
            </div>
            <div>
              <h2 id="export-modal-title" className="export-modal-title">
                Opciones de Exportación
              </h2>
              <p className="export-modal-subtitle">Configura cómo deseas exportar el reporte</p>
            </div>
          </div>
          <div className="export-modal-header-actions">
            <div className="export-file-size">
              <Clock className="export-file-size-icon" />
              <span>Est. tamaño: {estimateFileSize}</span>
            </div>
            <button
              onClick={onClose}
              className="export-close-button"
              aria-label="Cerrar"
            >
              <X className="export-close-icon" />
            </button>
          </div>
        </div>

        <div className="export-modal-content">
          <div className="export-modal-scrollable">
            <div className="export-section">
              <h3 className="export-section-title">Formato de exportación</h3>
              <div className="export-format-grid">
                {exportOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <motion.button
                      key={option.id}
                      type="button"
                      onClick={() => setExportFormat(option.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`export-format-button ${exportFormat === option.id ? 'export-format-button-active' : ''}`}
                      aria-pressed={exportFormat === option.id}
                    >
                      <div className="export-format-button-content">
                        <div className={`export-format-icon ${option.color}`}>
                          <Icon className="export-format-icon-svg" />
                        </div>
                        <span className="export-format-label">{option.label}</span>
                        <span className="export-format-description">{option.description}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={exportFormat}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="export-section"
              >
                <div className="export-section-header">
                  <div className="export-section-header-title">
                    <Settings className="export-section-icon" />
                    <h3 className="export-section-title">
                      Configuración de {getCurrentOption().label}
                    </h3>
                  </div>
                  <div className="export-format-badge">
                    <Zap className="export-format-badge-icon" />
                    {exportFormat.toUpperCase()}
                  </div>
                </div>
                {renderFormatOptions()}
              </motion.div>
            </AnimatePresence>

            <div className="export-section">
              <h3 className="export-section-title">Opciones generales</h3>
              <div className="export-general-options">
                <label className="export-checkbox-card">
                  <input
                    type="checkbox"
                    checked={includeCharts}
                    onChange={(e) => setIncludeCharts(e.target.checked)}
                    className="export-checkbox"
                  />
                  <div className="export-checkbox-card-content">
                    <div className="export-checkbox-card-label">Incluir gráficos y visualizaciones</div>
                    <div className="export-checkbox-card-description">Agrega todos los gráficos generados</div>
                  </div>
                </label>

                <label className="export-checkbox-card">
                  <input
                    type="checkbox"
                    checked={includeFilters}
                    onChange={(e) => setIncludeFilters(e.target.checked)}
                    className="export-checkbox"
                  />
                  <div className="export-checkbox-card-content">
                    <div className="export-checkbox-card-label">Incluir filtros aplicados</div>
                    <div className="export-checkbox-card-description">Muestra los filtros usados en el reporte</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="export-section">
              <h3 className="export-section-title">¿Cómo quieres recibir el reporte?</h3>
              <div className="export-mode-grid">
                <button
                  type="button"
                  onClick={() => setExportMode('download')}
                  className={`export-mode-button ${exportMode === 'download' ? 'export-mode-button-active' : ''}`}
                  aria-pressed={exportMode === 'download'}
                >
                  <div className="export-mode-button-content">
                    <Download className="export-mode-icon" />
                    <span className="export-mode-label">Descarga</span>
                    <span className="export-mode-description">
                      Descarga directa a tu dispositivo
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setExportMode('email')}
                  className={`export-mode-button ${exportMode === 'email' ? 'export-mode-button-active' : ''}`}
                  aria-pressed={exportMode === 'email'}
                >
                  <div className="export-mode-button-content">
                    <Mail className="export-mode-icon" />
                    <span className="export-mode-label">Email</span>
                    <span className="export-mode-description">
                      Envío a dirección de correo electrónico
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setExportMode('cloud')}
                  className={`export-mode-button ${exportMode === 'cloud' ? 'export-mode-button-active' : ''}`}
                  aria-pressed={exportMode === 'cloud'}
                >
                  <div className="export-mode-button-content">
                    <CloudUpload className="export-mode-icon" />
                    <span className="export-mode-label">Nube</span>
                    <span className="export-mode-description">
                      Guardar en servicios en la nube
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {renderEmailForm()}
            {renderCloudOptions()}

            <div className="export-section">
              <label className="form-label">
                Nombre del archivo
              </label>
              <div className="export-filename-input">
                <input
                  type="text"
                  value={getFileName()}
                  readOnly
                  className="export-filename-field"
                  aria-label="Nombre del archivo generado"
                />
                <div className="export-filename-actions">
                  <button
                    type="button"
                    onClick={handleCopyFileName}
                    className="export-filename-action"
                    title="Copiar nombre"
                    aria-label="Copiar nombre del archivo"
                  >
                    <Copy className="export-filename-action-icon" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const link = `${window.location.origin}/api/export/preview.${exportFormat}`;
                      window.open(link, '_blank', 'noopener,noreferrer');
                    }}
                    className="export-filename-action preview"
                    title="Vista previa"
                    aria-label="Ver vista previa del archivo"
                  >
                    <Eye className="export-filename-action-icon" />
                  </button>
                </div>
              </div>
              <div className="export-filename-hint">
                <AlertCircle className="export-filename-hint-icon" />
                El archivo se guardará con este nombre
              </div>
            </div>
          </div>
        </div>

        <div className="export-modal-footer">
          <div className="export-footer-info">
            <div className="export-footer-info-item">
              <Shield className="export-footer-icon" />
              <span>Exportación segura</span>
            </div>
            <div className="export-footer-divider"></div>
            <div className="export-footer-info-item">
              <Clock className="export-footer-icon" />
              <span>{estimateFileSize} estimado</span>
            </div>
          </div>

          <div className="export-footer-actions">
            <button
              onClick={onClose}
              className="export-cancel-button"
              disabled={isExporting}
            >
              Cancelar
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className={`export-submit-button ${isExporting ? 'export-submit-button-disabled' : ''}`}
            >
              {isExporting ? (
                <>
                  <div className="export-spinner"></div>
                  <span className="export-submit-text">
                    {(() => {
                      let icon;
                      if (exportMode === 'cloud') {
                        icon = <CloudUpload className="export-submit-icon" />;
                      } else if (exportMode === 'email') {
                        icon = <Mail className="export-submit-icon" />;
                      } else {
                        icon = <Download className="export-submit-icon" />;
                      }
                      return icon;
                    })()}
                    Exportando...
                  </span>
                </>
              ) : (
                <>
                  {exportMode === 'cloud' ? (
                    <CloudUpload className="export-submit-icon" />
                  ) : exportMode === 'email' ? (
                    <Mail className="export-submit-icon" />
                  ) : (
                    <Download className="export-submit-icon" />
                  )}
                  Exportar Reporte
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ✅ Validación de props
ExportOptions.propTypes = {
  data: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.object,
    PropTypes.string
  ]),
  reportType: PropTypes.string,
  fileName: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  customOptions: PropTypes.object,
  exportConfig: PropTypes.object
};

// ✅ Valores por defecto
ExportOptions.defaultProps = {
  reportType: 'general',
  fileName: 'reporte',
  customOptions: {},
  exportConfig: {}
};

export default React.memo(ExportOptions);