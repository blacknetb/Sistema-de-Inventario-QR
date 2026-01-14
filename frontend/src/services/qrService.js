import { get, post, put, del, downloadFile, uploadFile, requestWithRetry, clearCache } from './api';
import notificationService from './notificationService';

// ✅ MEJORA: Sistema de cache para códigos QR
const createQRCache = () => {
  const cache = new Map();
  const imageCache = new Map(); // Cache separado para imágenes
  const scanCache = new Map(); // Cache para resultados de escaneo
  
  return {
    get: (key) => {
      const cached = cache.get(key);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return cached.data;
      }
      cache.delete(key);
      return null;
    },
    
    set: (key, data, ttl = 60 * 60 * 1000) => {
      cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl
      });
    },
    
    delete: (key) => {
      cache.delete(key);
    },
    
    clear: (pattern = null) => {
      if (pattern) {
        for (const key of cache.keys()) {
          if (key.includes(pattern)) {
            cache.delete(key);
          }
        }
      } else {
        cache.clear();
        imageCache.clear();
        scanCache.clear();
      }
    },
    
    clearByProduct: (productId) => {
      for (const key of cache.keys()) {
        if (key.includes(`product_${productId}`) || key.includes('qr_')) {
          cache.delete(key);
        }
      }
    },
    
    // ✅ MEJORA: Cache para imágenes
    getImage: (key) => {
      return imageCache.get(key);
    },
    
    setImage: (key, blob) => {
      imageCache.set(key, {
        blob,
        timestamp: Date.now()
      });
    },
    
    // ✅ MEJORA: Cache para escaneos (TTL muy corto)
    getScan: (code) => {
      const cached = scanCache.get(code);
      if (cached && Date.now() - cached.timestamp < 10 * 1000) { // 10 segundos
        return cached.data;
      }
      scanCache.delete(code);
      return null;
    },
    
    setScan: (code, data) => {
      scanCache.set(code, {
        data,
        timestamp: Date.now()
      });
    }
  };
};

const qrCache = createQRCache();

// ✅ MEJORA: Validación de datos QR
const validateQRData = (qrData, isGeneration = false) => {
  const errors = [];
  const warnings = [];
  
  if (isGeneration) {
    if (!qrData.product_id && !qrData.custom_data) {
      errors.push('Se requiere product_id o custom_data');
    }
    
    if (qrData.size && (qrData.size < 100 || qrData.size > 1000)) {
      warnings.push('El tamaño recomendado es entre 100 y 1000 píxeles');
    }
    
    if (qrData.margin && (qrData.margin < 0 || qrData.margin > 50)) {
      warnings.push('El margen recomendado es entre 0 y 50');
    }
  } else {
    if (!qrData.code && !qrData.data) {
      errors.push('Se requiere código QR o datos para escanear');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * ✅ SERVICIO DE CÓDIGOS QR COMPLETO
 */
export const qrService = {
  /**
   * Generar código QR para producto
   */
  generateForProduct: async (productId, options = {}) => {
    try {
      if (!productId) {
        throw new Error('Se requiere ID de producto');
      }
      
      const qrData = {
        product_id: productId,
        ...options
      };
      
      const validation = validateQRData(qrData, true);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      // Mostrar warnings
      if (validation.warnings.length > 0) {
        validation.warnings.forEach(warning => {
          notificationService.warning(warning);
        });
      }
      
      const response = await post(`/qr/product/${productId}/generate`, options);
      
      if (response.success) {
        // Limpiar cache relacionada
        qrCache.clearByProduct(productId);
        qrCache.clear();
        
        notificationService.success('Código QR generado exitosamente');
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Escanear código QR
   */
  scan: async (code, useCache = true) => {
    try {
      if (!code || typeof code !== 'string' || code.trim().length === 0) {
        throw new Error('Código QR inválido');
      }
      
      // ✅ MEJORA: Validar formato del código
      if (!this.isValidQR(code)) {
        throw new Error('Formato de código QR inválido');
      }
      
      // Verificar cache de escaneo (TTL corto)
      if (useCache) {
        const cachedScan = qrCache.getScan(code);
        if (cachedScan) {
          return cachedScan;
        }
      }
      
      const response = await post('/qr/scan', { code });
      
      if (response.success && useCache) {
        qrCache.setScan(code, response);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Obtener información de código QR
   */
  getQRInfo: async (code, useCache = true) => {
    try {
      const cacheKey = `qr_info_${code}`;
      
      if (useCache) {
        const cached = qrCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }
      
      const response = await get(`/qr/info/${code}`);
      
      if (useCache && response.success) {
        qrCache.set(cacheKey, response);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Descargar imagen QR
   */
  downloadQR: async (code, filename = null, useCache = true) => {
    try {
      // ✅ CORRECCIÓN: Verificar window antes de usar
      if (typeof window === 'undefined') {
        throw new Error('No se puede descargar en este entorno');
      }
      
      // Verificar si ya tenemos la imagen en cache
      if (useCache) {
        const cachedImage = qrCache.getImage(code);
        if (cachedImage) {
          // Usar imagen cacheada
          this.downloadBlob(cachedImage.blob, filename || `qr_${code}.png`);
          return { success: true, fromCache: true, filename: filename || `qr_${code}.png` };
        }
      }
      
      // Obtener nombre de archivo si no se proporciona
      if (!filename) {
        const infoResponse = await this.getQRInfo(code, true);
        if (infoResponse.success && infoResponse.data.product_name) {
          const productName = infoResponse.data.product_name
            .replace(/[^a-z0-9]/gi, '_')
            .toLowerCase()
            .substring(0, 50);
          filename = `qr_${productName}_${code}.png`;
        } else {
          filename = `qr_${code}.png`;
        }
      }
      
      await downloadFile(`/qr/download/${code}`, filename);
      
      return { success: true, filename };
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Obtener códigos QR por producto
   */
  getByProduct: async (productId, useCache = true) => {
    try {
      const cacheKey = `qr_product_${productId}`;
      
      if (useCache) {
        const cached = qrCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }
      
      const response = await get(`/qr/product/${productId}`);
      
      if (useCache && response.success) {
        qrCache.set(cacheKey, response);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Obtener todos los códigos QR
   */
  getAll: async (params = {}, useCache = true) => {
    try {
      const cacheKey = `qr_all_${JSON.stringify(params)}`;
      
      if (useCache) {
        const cached = qrCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }
      
      const response = await get('/qr', params);
      
      if (useCache && response.success) {
        qrCache.set(cacheKey, response);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Eliminar código QR
   */
  delete: async (id, productId = null) => {
    try {
      const confirmed = await notificationService.confirm(
        '¿Estás seguro de eliminar este código QR?'
      );
      
      if (!confirmed) {
        return { success: false, message: 'Operación cancelada' };
      }
      
      const response = await del(`/qr/${id}`);
      
      if (response.success) {
        // Limpiar cache
        qrCache.clear();
        if (productId) {
          qrCache.clearByProduct(productId);
        }
        
        notificationService.success('Código QR eliminado exitosamente');
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Generar múltiples códigos QR
   */
  generateMultiple: async (productIds, options = {}, parallel = true, maxConcurrent = 3) => {
    try {
      if (!Array.isArray(productIds) || productIds.length === 0) {
        throw new Error('No hay productos para generar códigos QR');
      }
      
      notificationService.loading(`Generando ${productIds.length} códigos QR...`);
      
      const results = [];
      
      if (parallel) {
        // Generación paralela con límite
        const batches = [];
        for (let i = 0; i < productIds.length; i += maxConcurrent) {
          batches.push(productIds.slice(i, i + maxConcurrent));
        }
        
        for (const batch of batches) {
          const batchPromises = batch.map(productId =>
            this.generateForProduct(productId, options)
              .then(result => ({ productId, success: true, data: result.data }))
              .catch(error => ({ productId, success: false, error: error.message }))
          );
          
          const batchResults = await Promise.all(batchPromises);
          results.push(...batchResults);
          
          // Pequeña pausa entre batches
          if (batches.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      } else {
        // Generación secuencial
        for (const productId of productIds) {
          try {
            const result = await this.generateForProduct(productId, options);
            results.push({
              productId,
              success: true,
              data: result.data
            });
          } catch (error) {
            results.push({
              productId,
              success: false,
              error: error.message
            });
          }
          
          // Pequeña pausa entre generaciones
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      notificationService.dismissLoading();
      
      // Limpiar cache
      qrCache.clear();
      
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      
      if (errorCount === 0) {
        notificationService.success(`Todos los códigos QR generados exitosamente`);
      } else if (successCount === 0) {
        notificationService.error(`Error generando todos los códigos QR`);
      } else {
        notificationService.warning(`${successCount} generados, ${errorCount} errores`);
      }
      
      return {
        success: errorCount === 0,
        results,
        summary: {
          total: productIds.length,
          success: successCount,
          errors: errorCount,
          parallel
        }
      };
    } catch (error) {
      notificationService.dismissLoading();
      throw error;
    }
  },
  
  /**
   * Verificar validez de código QR
   */
  isValidQR: (code) => {
    if (!code || typeof code !== 'string') return false;
    
    // Limpiar y validar
    const cleanedCode = code.trim();
    
    // Patrones para códigos QR del sistema
    const systemPatterns = [
      /^QR[A-Z0-9]{8,12}$/i,                    // QR + 8-12 caracteres
      /^INV-[A-Z0-9]{8,12}$/i,                  // INV- + 8-12 caracteres
      /^PROD-[A-Z0-9]{8,10}$/i,                 // PROD- + 8-10 caracteres
      /^[A-Z0-9]{10,20}$/,                      // Códigos alfanuméricos simples
      /^https?:\/\/[^\/]+\/qr\/[A-Z0-9]+$/i     // URLs del sistema
    ];
    
    // Verificar contra patrones
    const matchesPattern = systemPatterns.some(pattern => pattern.test(cleanedCode));
    
    // También verificar longitud razonable
    const validLength = cleanedCode.length >= 8 && cleanedCode.length <= 200;
    
    // Verificar caracteres válidos
    const validChars = /^[A-Z0-9\-_\/:\.]+$/i.test(cleanedCode);
    
    return matchesPattern || (validLength && validChars);
  },
  
  /**
   * Extraer información de código QR
   */
  parseQRData: (data) => {
    try {
      // Intentar parsear como JSON
      try {
        const parsed = JSON.parse(data);
        
        // Validar estructura básica
        if (parsed && (parsed.product_id || parsed.code || parsed.type)) {
          return {
            type: 'structured',
            format: 'json',
            data: parsed
          };
        }
      } catch (jsonError) {
        // No es JSON, continuar con otros formatos
      }
      
      // Verificar si es un código simple del sistema
      if (this.isValidQR(data)) {
        return {
          type: 'code',
          format: 'system',
          data: { code: data }
        };
      }
      
      // Verificar si es una URL
      try {
        if (typeof window !== 'undefined') {
          const url = new URL(data);
          return {
            type: 'url',
            format: 'url',
            data: { 
              url: data,
              protocol: url.protocol,
              hostname: url.hostname,
              pathname: url.pathname
            }
          };
        }
      } catch (urlError) {
        // No es URL válida
      }
      
      // Verificar si es texto plano con formato especial
      if (data.includes('|') || data.includes(';')) {
        const parts = data.split(/[|;]/).map(part => part.trim());
        return {
          type: 'delimited',
          format: 'text',
          data: { parts, raw: data }
        };
      }
      
      // Cualquier otro texto
      return {
        type: 'text',
        format: 'plain',
        data: { text: data }
      };
    } catch (error) {
      console.error('Error parsing QR data:', error);
      return {
        type: 'unknown',
        format: 'raw',
        data: { raw: data }
      };
    }
  },
  
  /**
   * Generar código QR localmente (usando librería de frontend)
   */
  generateQRCodeLocal: async (data, options = {}) => {
    try {
      // Verificar si hay librería de QR disponible
      if (typeof window !== 'undefined') {
        // Opción 1: QRCode.js
        if (window.QRCode) {
          return new Promise((resolve, reject) => {
            try {
              const qr = window.QRCode.generateSVG(data, options);
              resolve({
                success: true,
                type: 'svg',
                data: qr.outerHTML,
                generatedAt: new Date().toISOString()
              });
            } catch (error) {
              reject(error);
            }
          });
        }
        
        // Opción 2: qrcode library
        else if (window.qrcode) {
          return new Promise((resolve, reject) => {
            try {
              window.qrcode.toDataURL(data, options, (error, url) => {
                if (error) reject(error);
                else resolve({
                  success: true,
                  type: 'dataurl',
                  data: url,
                  generatedAt: new Date().toISOString()
                });
              });
            } catch (error) {
              reject(error);
            }
          });
        }
      }
      
      throw new Error('Librería QR no disponible en el cliente. Usa el backend para generación.');
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Escanear código QR desde imagen (usando API del navegador)
   */
  scanFromImage: async (imageFile) => {
    try {
      // Validar archivo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
      if (!validTypes.includes(imageFile.type)) {
        throw new Error('Tipo de archivo no permitido. Solo imágenes');
      }
      
      notificationService.loading('Procesando imagen QR...');
      
      try {
        // Crear FormData para upload
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('scan_type', 'image');
        
        const response = await uploadFile('/qr/scan/image', imageFile);
        
        notificationService.dismissLoading();
        
        if (response.success) {
          // Cachear resultado del escaneo
          if (response.data.code) {
            qrCache.setScan(response.data.code, response);
          }
          
          notificationService.success('Código QR escaneado exitosamente');
        }
        
        return response;
      } catch (uploadError) {
        notificationService.dismissLoading();
        
        // Si el endpoint no existe, intentar con librería de frontend
        console.log('Intentando escanear con librería frontend...');
        
        // Verificar si jsQR está disponible y window está definido
        if (typeof window !== 'undefined' && window.jsQR) {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
              try {
                const img = new Image();
                img.onload = () => {
                  try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = window.jsQR(imageData.data, imageData.width, imageData.height);
                    
                    if (code) {
                      resolve({
                        success: true,
                        data: {
                          code: code.data,
                          format: 'frontend_scan',
                          points: code.location
                        }
                      });
                    } else {
                      reject(new Error('No se pudo detectar código QR en la imagen'));
                    }
                  } catch (canvasError) {
                    reject(canvasError);
                  }
                };
                img.onerror = () => reject(new Error('Error cargando imagen'));
                img.src = e.target.result;
              } catch (imgError) {
                reject(imgError);
              }
            };
            
            reader.onerror = () => reject(new Error('Error leyendo archivo'));
            reader.readAsDataURL(imageFile);
          });
        } else {
          throw new Error('Escaner de QR desde imagen no disponible. Sube la imagen al backend.');
        }
      }
    } catch (error) {
      notificationService.dismissLoading();
      throw error;
    }
  },
  
  /**
   * ✅ MEJORA: Descargar múltiples códigos QR
   */
  downloadMultipleQR: async (codes, zipName = 'qr_codes') => {
    try {
      if (!Array.isArray(codes) || codes.length === 0) {
        throw new Error('No hay códigos para descargar');
      }
      
      if (codes.length > 50) {
        throw new Error('Máximo 50 códigos QR por descarga');
      }
      
      notificationService.loading(`Preparando descarga de ${codes.length} códigos QR...`);
      
      try {
        // Intentar endpoint de descarga múltiple
        const response = await downloadFile(
          '/qr/download/batch',
          `${zipName}.zip`,
          { params: { codes: codes.join(',') } }
        );
        
        notificationService.dismissLoading();
        notificationService.success('Archivo ZIP descargado exitosamente');
        
        return response;
      } catch (error) {
        // Si no hay endpoint batch, descargar individualmente
        console.log('Descargando códigos individualmente...');
        
        const downloadPromises = codes.map(async (code, index) => {
          try {
            await this.downloadQR(code, `qr_${code}_${index + 1}.png`, true);
            return { code, success: true };
          } catch (dlError) {
            return { code, success: false, error: dlError.message };
          }
        });
        
        const results = await Promise.all(downloadPromises);
        notificationService.dismissLoading();
        
        const successCount = results.filter(r => r.success).length;
        const errorCount = results.filter(r => !r.success).length;
        
        if (errorCount === 0) {
          notificationService.success(`Todos los códigos descargados exitosamente`);
        } else if (successCount === 0) {
          notificationService.error(`Error descargando todos los códigos`);
        } else {
          notificationService.warning(`${successCount} descargados, ${errorCount} errores`);
        }
        
        return {
          success: errorCount === 0,
          results,
          summary: {
            total: codes.length,
            success: successCount,
            errors: errorCount
          }
        };
      }
    } catch (error) {
      notificationService.dismissLoading();
      throw error;
    }
  },
  
  /**
   * ✅ CORRECCIÓN: Método helper para descargar blob con verificación de window
   */
  downloadBlob: (blob, filename) => {
    if (typeof window === 'undefined') {
      console.error('No se puede descargar: window no está definido');
      return;
    }
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    globalThis.URL.revokeObjectURL(url);
  },
  
  /**
   * Validar código QR
   */
  validateQRCode: (code) => {
    const errors = [];
    
    if (!code || code.trim().length === 0) {
      errors.push('El código QR no puede estar vacío');
    }
    
    if (code.length > 500) {
      errors.push('El código QR es demasiado largo');
    }
    
    // Verificar caracteres problemáticos
    const invalidChars = code.match(/[<>"'&]/g);
    if (invalidChars) {
      errors.push(`Caracteres inválidos encontrados: ${invalidChars.join(', ')}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },
  
  /**
   * Limpiar cache
   */
  clearCache: () => {
    qrCache.clear();
    clearCache('qr');
  }
};

export default qrService;
