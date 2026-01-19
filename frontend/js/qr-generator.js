/**
 * Generación y manejo de códigos QR
 */

class QRGenerator {
    constructor() {
        this.defaultOptions = {
            width: 256,
            height: 256,
            colorDark: "#000000",
            colorLight: "#FFFFFF",
            correctLevel: QRCode.CorrectLevel.H
        };
    }
    
    /**
     * Genera un código QR a partir de datos
     * @param {string|object} data - Datos a codificar
     * @param {HTMLElement} container - Contenedor donde mostrar el QR
     * @param {object} options - Opciones de generación
     */
    generate(data, container, options = {}) {
        if (!container) {
            throw new Error('Se requiere un contenedor para el QR');
        }
        
        // Limpiar contenedor
        container.innerHTML = '';
        
        // Preparar datos
        const qrData = typeof data === 'string' ? data : JSON.stringify(data);
        
        // Combinar opciones
        const finalOptions = { ...this.defaultOptions, ...options };
        
        // Generar QR
        try {
            QRCode.toCanvas(container, qrData, finalOptions, (error) => {
                if (error) {
                    console.error('Error al generar QR:', error);
                    this.showError(container, 'Error al generar código QR');
                }
            });
        } catch (error) {
            console.error('Error en generación QR:', error);
            this.showError(container, 'Error en generación de QR');
        }
    }
    
    /**
     * Genera múltiples códigos QR
     * @param {Array} items - Array de items con datos
     * @param {HTMLElement} container - Contenedor principal
     * @param {object} options - Opciones de generación
     */
    generateMultiple(items, container, options = {}) {
        if (!container || !Array.isArray(items)) {
            throw new Error('Parámetros inválidos para generación múltiple');
        }
        
        container.innerHTML = '';
        
        items.forEach((item, index) => {
            const itemContainer = document.createElement('div');
            itemContainer.className = 'qr-item';
            
            const qrContainer = document.createElement('div');
            qrContainer.className = 'qr-code';
            
            const labelContainer = document.createElement('div');
            labelContainer.className = 'qr-label';
            labelContainer.textContent = item.label || `QR ${index + 1}`;
            
            itemContainer.appendChild(qrContainer);
            itemContainer.appendChild(labelContainer);
            container.appendChild(itemContainer);
            
            // Generar QR individual
            this.generate(item.data, qrContainer, options);
        });
    }
    
    /**
     * Genera y descarga un código QR como imagen
     * @param {string|object} data - Datos a codificar
     * @param {string} fileName - Nombre del archivo
     * @param {object} options - Opciones de generación
     */
    generateAndDownload(data, fileName = 'qr_code.png', options = {}) {
        return new Promise((resolve, reject) => {
            const qrData = typeof data === 'string' ? data : JSON.stringify(data);
            const finalOptions = { ...this.defaultOptions, ...options };
            
            QRCode.toDataURL(qrData, finalOptions, (error, url) => {
                if (error) {
                    reject(error);
                    return;
                }
                
                this.downloadImage(url, fileName);
                resolve(url);
            });
        });
    }
    
    /**
     * Genera un QR para un producto
     * @param {object} product - Datos del producto
     * @param {HTMLElement} container - Contenedor donde mostrar el QR
     * @param {object} options - Opciones de generación
     */
    generateForProduct(product, container, options = {}) {
        if (!product || !product.id) {
            throw new Error('Producto inválido para generación de QR');
        }
        
        const qrData = {
            type: 'product',
            product_id: product.id,
            code: product.code,
            name: product.name,
            timestamp: new Date().toISOString()
        };
        
        // Agregar información adicional si está disponible
        if (product.location_id) {
            qrData.location_id = product.location_id;
        }
        
        if (product.category_id) {
            qrData.category_id = product.category_id;
        }
        
        this.generate(qrData, container, options);
        
        // Devolver datos del QR generado
        return qrData;
    }
    
    /**
     * Genera un QR para un movimiento
     * @param {object} movement - Datos del movimiento
     * @param {HTMLElement} container - Contenedor donde mostrar el QR
     * @param {object} options - Opciones de generación
     */
    generateForMovement(movement, container, options = {}) {
        if (!movement || !movement.id) {
            throw new Error('Movimiento inválido para generación de QR');
        }
        
        const qrData = {
            type: 'movement',
            movement_id: movement.id,
            product_id: movement.product_id,
            quantity: movement.quantity,
            type: movement.type,
            date: movement.date,
            timestamp: new Date().toISOString()
        };
        
        this.generate(qrData, container, options);
        return qrData;
    }
    
    /**
     * Genera un QR para una ubicación
     * @param {object} location - Datos de la ubicación
     * @param {HTMLElement} container - Contenedor donde mostrar el QR
     * @param {object} options - Opciones de generación
     */
    generateForLocation(location, container, options = {}) {
        if (!location || !location.id) {
            throw new Error('Ubicación inválida para generación de QR');
        }
        
        const qrData = {
            type: 'location',
            location_id: location.id,
            code: location.code,
            name: location.name,
            timestamp: new Date().toISOString()
        };
        
        this.generate(qrData, container, options);
        return qrData;
    }
    
    /**
     * Descarga una imagen
     * @param {string} dataUrl - Data URL de la imagen
     * @param {string} fileName - Nombre del archivo
     */
    downloadImage(dataUrl, fileName) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    /**
     * Imprime un código QR
     * @param {HTMLElement} qrContainer - Contenedor con el QR
     * @param {string} title - Título para la impresión
     */
    printQR(qrContainer, title = 'Código QR') {
        if (!qrContainer) return;
        
        const printWindow = window.open('', '_blank');
        const qrCanvas = qrContainer.querySelector('canvas');
        
        if (!qrCanvas) {
            console.error('No se encontró canvas de QR para imprimir');
            return;
        }
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>${title}</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            text-align: center; 
                            padding: 20px; 
                        }
                        .qr-container { 
                            margin: 20px auto; 
                            max-width: 300px; 
                        }
                        .print-title { 
                            margin-bottom: 20px; 
                            font-size: 18px; 
                        }
                        .print-footer { 
                            margin-top: 20px; 
                            font-size: 12px; 
                            color: #666; 
                        }
                        @media print {
                            body { padding: 0; }
                        }
                    </style>
                </head>
                <body>
                    <div class="print-title">${title}</div>
                    <div class="qr-container">
                        <img src="${qrCanvas.toDataURL('image/png')}" 
                             alt="Código QR" 
                             style="width: 100%; height: auto;">
                    </div>
                    <div class="print-footer">
                        Generado el: ${formatDate(new Date(), 'long')}
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                            setTimeout(() => window.close(), 500);
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    }
    
    /**
     * Muestra un mensaje de error en el contenedor
     * @param {HTMLElement} container - Contenedor donde mostrar el error
     * @param {string} message - Mensaje de error
     */
    showError(container, message) {
        if (container) {
            container.innerHTML = `
                <div class="qr-error">
                    <div class="error-icon">❌</div>
                    <div class="error-message">${message}</div>
                </div>
            `;
        }
    }
    
    /**
     * Parsea datos de un código QR escaneado
     * @param {string} qrText - Texto del código QR
     * @returns {object} Datos parseados
     */
    parseQRData(qrText) {
        try {
            const data = JSON.parse(qrText);
            
            // Validar estructura básica
            if (!data.type) {
                throw new Error('QR no válido: falta tipo de dato');
            }
            
            return {
                valid: true,
                data: data,
                type: data.type,
                timestamp: data.timestamp || new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Error al parsear QR:', error);
            
            // Intentar interpretar como código simple
            if (qrText) {
                return {
                    valid: false,
                    raw: qrText,
                    type: 'unknown',
                    error: error.message
                };
            }
            
            return {
                valid: false,
                error: 'QR vacío o no válido'
            };
        }
    }
    
    /**
     * Valida si un código QR es para un producto
     * @param {object} qrData - Datos del QR parseados
     * @returns {boolean}
     */
    isProductQR(qrData) {
        return qrData.valid && qrData.type === 'product' && qrData.data.product_id;
    }
    
    /**
     * Valida si un código QR es para un movimiento
     * @param {object} qrData - Datos del QR parseados
     * @returns {boolean}
     */
    isMovementQR(qrData) {
        return qrData.valid && qrData.type === 'movement' && qrData.data.movement_id;
    }
    
    /**
     * Valida si un código QR es para una ubicación
     * @param {object} qrData - Datos del QR parseados
     * @returns {boolean}
     */
    isLocationQR(qrData) {
        return qrData.valid && qrData.type === 'location' && qrData.data.location_id;
    }
    
    /**
     * Obtiene información legible del QR
     * @param {object} qrData - Datos del QR parseados
     * @returns {string} Descripción legible
     */
    getQRDescription(qrData) {
        if (!qrData.valid) {
            return 'QR no válido';
        }
        
        switch (qrData.type) {
            case 'product':
                return `Producto: ${qrData.data.name || qrData.data.code || 'Desconocido'}`;
                
            case 'movement':
                return `Movimiento #${qrData.data.movement_id}`;
                
            case 'location':
                return `Ubicación: ${qrData.data.name || qrData.data.code || 'Desconocida'}`;
                
            default:
                return `QR tipo: ${qrData.type}`;
        }
    }
    
    /**
     * Genera un lote de códigos QR para productos
     * @param {Array} products - Lista de productos
     * @param {object} options - Opciones de generación
     * @returns {Promise} Promesa con los resultados
     */
    async generateBatchForProducts(products, options = {}) {
        if (!Array.isArray(products) || products.length === 0) {
            throw new Error('Lista de productos vacía');
        }
        
        const results = [];
        const batchOptions = {
            ...this.defaultOptions,
            width: options.width || 200,
            height: options.height || 200
        };
        
        // Crear contenedor temporal
        const tempContainer = document.createElement('div');
        tempContainer.style.display = 'none';
        document.body.appendChild(tempContainer);
        
        for (const product of products) {
            try {
                const qrContainer = document.createElement('div');
                tempContainer.appendChild(qrContainer);
                
                const qrData = this.generateForProduct(product, qrContainer, batchOptions);
                
                // Obtener data URL
                const canvas = qrContainer.querySelector('canvas');
                if (canvas) {
                    const dataUrl = canvas.toDataURL('image/png');
                    
                    results.push({
                        success: true,
                        product: product,
                        qrData: qrData,
                        dataUrl: dataUrl,
                        fileName: `qr_${product.code || product.id}.png`
                    });
                } else {
                    throw new Error('No se pudo generar canvas');
                }
                
            } catch (error) {
                results.push({
                    success: false,
                    product: product,
                    error: error.message
                });
            }
        }
        
        // Limpiar contenedor temporal
        document.body.removeChild(tempContainer);
        
        return results;
    }
    
    /**
     * Crea un archivo ZIP con múltiples códigos QR
     * @param {Array} qrResults - Resultados de generación de QR
     * @param {string} zipName - Nombre del archivo ZIP
     */
    async createQRZip(qrResults, zipName = 'qr_codes.zip') {
        // Nota: Esta función requiere la librería JSZip
        if (typeof JSZip === 'undefined') {
            throw new Error('JSZip no está disponible. Incluye la librería JSZip.');
        }
        
        const zip = new JSZip();
        const imgFolder = zip.folder('qr_codes');
        
        // Agregar archivos al ZIP
        qrResults.forEach((result, index) => {
            if (result.success && result.dataUrl) {
                // Convertir data URL a blob
                const base64Data = result.dataUrl.split(',')[1];
                const binaryData = atob(base64Data);
                const arrayBuffer = new ArrayBuffer(binaryData.length);
                const uint8Array = new Uint8Array(arrayBuffer);
                
                for (let i = 0; i < binaryData.length; i++) {
                    uint8Array[i] = binaryData.charCodeAt(i);
                }
                
                const blob = new Blob([uint8Array], { type: 'image/png' });
                
                // Nombre del archivo
                const fileName = result.fileName || `qr_${index + 1}.png`;
                imgFolder.file(fileName, blob, { binary: true });
            }
        });
        
        // Crear archivo README
        const readmeContent = `
Códigos QR Generados
====================

Fecha: ${formatDate(new Date(), 'long')}
Total de códigos: ${qrResults.filter(r => r.success).length}
Generados por: Sistema de Inventario QR

Contenido:
${qrResults.map((r, i) => {
    if (r.success) {
        return `${i + 1}. ${r.product?.name || 'Producto'} (${r.product?.code || 'N/A'})`;
    }
    return `${i + 1}. ERROR: ${r.product?.name || 'Producto'} - ${r.error}`;
}).join('\n')}
        `;
        
        zip.file('README.txt', readmeContent);
        
        // Generar ZIP
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const zipUrl = URL.createObjectURL(zipBlob);
        
        // Descargar ZIP
        const link = document.createElement('a');
        link.href = zipUrl;
        link.download = zipName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Liberar URL
        setTimeout(() => URL.revokeObjectURL(zipUrl), 1000);
        
        return {
            success: true,
            count: qrResults.filter(r => r.success).length,
            zipUrl: zipUrl
        };
    }
}

// Instancia global del generador QR
const qrGenerator = new QRGenerator();

// Exportar funciones principales
window.qrGenerator = qrGenerator;
window.generateQR = qrGenerator.generate.bind(qrGenerator);
window.generateProductQR = qrGenerator.generateForProduct.bind(qrGenerator);
window.generateMultipleQR = qrGenerator.generateMultiple.bind(qrGenerator);
window.generateAndDownloadQR = qrGenerator.generateAndDownload.bind(qrGenerator);
window.parseQRData = qrGenerator.parseQRData.bind(qrGenerator);
window.printQRCode = qrGenerator.printQR.bind(qrGenerator);