/**
 * Generación de códigos QR
 */
class QRCodeManager {
    constructor() {
        this.qrCodeCache = new Map();
        this.init();
    }
    
    init() {
        // Verificar si hay una librería QR disponible
        if (typeof QRCode === 'undefined') {
            console.warn('Librería QRCode no disponible. Cargando desde CDN...');
            this.loadQRCodeLibrary();
        }
    }
    
    /**
     * Cargar librería QR desde CDN
     */
    loadQRCodeLibrary() {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
        script.integrity = 'sha384-+i+5WzxQpC5V7+9+5j5W5p5q5v5v5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5';
        script.crossOrigin = 'anonymous';
        script.onload = () => {
            console.log('Librería QRCode cargada correctamente');
        };
        script.onerror = () => {
            console.error('Error cargando librería QRCode');
        };
        document.head.appendChild(script);
    }
    
    /**
     * Generar código QR para producto
     */
    generateForProduct(product) {
        const qrData = JSON.stringify({
            type: 'product',
            id: product.id,
            code: product.code,
            name: product.name,
            timestamp: new Date().toISOString()
        });
        
        return this.generateQRCode(qrData, `product-${product.code}`);
    }
    
    /**
     * Generar código QR para ubicación
     */
    generateForLocation(location) {
        const qrData = JSON.stringify({
            type: 'location',
            id: location.id,
            code: location.code,
            name: location.name,
            timestamp: new Date().toISOString()
        });
        
        return this.generateQRCode(qrData, `location-${location.code}`);
    }
    
    /**
     * Generar código QR para movimiento
     */
    generateForMovement(movement) {
        const qrData = JSON.stringify({
            type: 'movement',
            id: movement.id,
            product_id: movement.product_id,
            type: movement.type,
            quantity: movement.quantity,
            timestamp: movement.created_at
        });
        
        return this.generateQRCode(qrData, `movement-${movement.id}`);
    }
    
    /**
     * Generar código QR genérico
     */
    generateQRCode(data, cacheKey = null) {
        return new Promise((resolve, reject) => {
            // Verificar cache
            if (cacheKey && this.qrCodeCache.has(cacheKey)) {
                resolve(this.qrCodeCache.get(cacheKey));
                return;
            }
            
            // Verificar si la librería está disponible
            if (typeof QRCode === 'undefined') {
                reject(new Error('Librería QRCode no disponible'));
                return;
            }
            
            try {
                // Generar código QR
                const qrCanvas = document.createElement('canvas');
                
                QRCode.toCanvas(
                    qrCanvas,
                    data,
                    {
                        width: APP_CONFIG.QR_CODE.SIZE,
                        height: APP_CONFIG.QR_CODE.SIZE,
                        color: {
                            dark: APP_CONFIG.QR_CODE.COLOR_DARK,
                            light: APP_CONFIG.QR_CODE.COLOR_LIGHT
                        },
                        errorCorrectionLevel: APP_CONFIG.QR_CODE.ERROR_LEVEL
                    },
                    (error) => {
                        if (error) {
                            reject(error);
                        } else {
                            // Convertir a data URL
                            const dataUrl = qrCanvas.toDataURL('image/png');
                            
                            // Guardar en cache
                            if (cacheKey) {
                                this.qrCodeCache.set(cacheKey, dataUrl);
                            }
                            
                            resolve({
                                dataUrl: dataUrl,
                                canvas: qrCanvas,
                                blob: this.canvasToBlob(qrCanvas)
                            });
                        }
                    }
                );
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Generar y mostrar código QR en un elemento
     */
    generateToElement(elementId, data, options = {}) {
        return new Promise((resolve, reject) => {
            const element = document.getElementById(elementId);
            if (!element) {
                reject(new Error(`Elemento ${elementId} no encontrado`));
                return;
            }
            
            const config = {
                text: typeof data === 'string' ? data : JSON.stringify(data),
                width: options.width || APP_CONFIG.QR_CODE.SIZE,
                height: options.height || APP_CONFIG.QR_CODE.SIZE,
                colorDark: options.colorDark || APP_CONFIG.QR_CODE.COLOR_DARK,
                colorLight: options.colorLight || APP_CONFIG.QR_CODE.COLOR_LIGHT,
                correctLevel: options.correctLevel || QRCode.CorrectLevel.H
            };
            
            try {
                // Limpiar elemento
                element.innerHTML = '';
                
                // Generar QR
                new QRCode(element, config);
                
                // Obtener imagen generada
                setTimeout(() => {
                    const img = element.querySelector('img');
                    const canvas = element.querySelector('canvas');
                    
                    resolve({
                        element: element,
                        img: img,
                        canvas: canvas,
                        dataUrl: canvas ? canvas.toDataURL('image/png') : null
                    });
                }, 100);
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Generar y descargar código QR
     */
    async generateAndDownload(data, filename = 'qrcode.png') {
        try {
            const result = await this.generateQRCode(data);
            
            // Crear enlace de descarga
            const link = document.createElement('a');
            link.href = result.dataUrl;
            link.download = filename;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            return result;
            
        } catch (error) {
            console.error('Error generando QR para descarga:', error);
            throw error;
        }
    }
    
    /**
     * Generar y abrir código QR en nueva ventana
     */
    async generateAndOpen(data, title = 'Código QR') {
        try {
            const result = await this.generateQRCode(data);
            
            // Crear ventana emergente
            const win = window.open('', '_blank');
            win.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${title}</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            margin: 0;
                            padding: 20px;
                            background-color: #f5f5f5;
                        }
                        .qr-container {
                            background: white;
                            padding: 20px;
                            border-radius: 10px;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                            text-align: center;
                        }
                        .qr-title {
                            margin-bottom: 20px;
                            color: #333;
                        }
                        .qr-actions {
                            margin-top: 20px;
                        }
                        button {
                            padding: 10px 20px;
                            background: #007bff;
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                            margin: 0 5px;
                        }
                        button:hover {
                            background: #0056b3;
                        }
                    </style>
                </head>
                <body>
                    <div class="qr-container">
                        <h2 class="qr-title">${title}</h2>
                        <img src="${result.dataUrl}" alt="Código QR">
                        <div class="qr-actions">
                            <button onclick="window.print()">Imprimir</button>
                            <button onclick="downloadQR()">Descargar</button>
                            <button onclick="window.close()">Cerrar</button>
                        </div>
                    </div>
                    <script>
                        function downloadQR() {
                            const link = document.createElement('a');
                            link.href = '${result.dataUrl}';
                            link.download = '${title.toLowerCase().replace(/\\s+/g, '-')}.png';
                            link.click();
                        }
                    </script>
                </body>
                </html>
            `);
            win.document.close();
            
            return result;
            
        } catch (error) {
            console.error('Error generando QR para visualización:', error);
            throw error;
        }
    }
    
    /**
     * Generar múltiples códigos QR
     */
    async generateBatch(items, generatorFn) {
        const results = [];
        
        for (const item of items) {
            try {
                const result = await generatorFn(item);
                results.push({
                    item: item,
                    success: true,
                    result: result
                });
            } catch (error) {
                results.push({
                    item: item,
                    success: false,
                    error: error.message
                });
            }
        }
        
        return results;
    }
    
    /**
     * Generar hoja de códigos QR
     */
    async generateSheet(items, options = {}) {
        const defaultOptions = {
            columns: 3,
            rows: 10,
            margin: 20,
            itemWidth: 200,
            itemHeight: 250,
            showLabels: true,
            labelField: 'code'
        };
        
        const config = { ...defaultOptions, ...options };
        
        // Crear canvas principal
        const sheetCanvas = document.createElement('canvas');
        const ctx = sheetCanvas.getContext('2d');
        
        // Calcular dimensiones
        const sheetWidth = (config.itemWidth + config.margin) * config.columns + config.margin;
        const sheetHeight = (config.itemHeight + config.margin) * config.rows + config.margin;
        
        sheetCanvas.width = sheetWidth;
        sheetCanvas.height = sheetHeight;
        
        // Fondo blanco
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, sheetWidth, sheetHeight);
        
        // Generar cada QR
        for (let i = 0; i < Math.min(items.length, config.columns * config.rows); i++) {
            const item = items[i];
            const row = Math.floor(i / config.columns);
            const col = i % config.columns;
            
            const x = config.margin + col * (config.itemWidth + config.margin);
            const y = config.margin + row * (config.itemHeight + config.margin);
            
            try {
                // Generar QR
                const qrResult = await this.generateForProduct(item);
                
                // Crear canvas temporal para el QR
                const qrCanvas = document.createElement('canvas');
                const qrCtx = qrCanvas.getContext('2d');
                qrCanvas.width = config.itemWidth - 40;
                qrCanvas.height = config.itemWidth - 40;
                
                // Dibujar QR
                const qrImg = new Image();
                qrImg.onload = () => {
                    qrCtx.drawImage(qrImg, 0, 0, qrCanvas.width, qrCanvas.height);
                    
                    // Dibujar en la hoja
                    ctx.drawImage(qrCanvas, x + 20, y + 20);
                    
                    // Dibujar etiqueta si está habilitado
                    if (config.showLabels && config.labelField) {
                        ctx.fillStyle = '#000';
                        ctx.font = '14px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText(
                            item[config.labelField],
                            x + config.itemWidth / 2,
                            y + config.itemHeight - 10
                        );
                        
                        // Dibujar nombre si hay espacio
                        if (item.name) {
                            ctx.font = '12px Arial';
                            ctx.fillText(
                                item.name.substring(0, 20),
                                x + config.itemWidth / 2,
                                y + config.itemHeight - 30
                            );
                        }
                    }
                };
                qrImg.src = qrResult.dataUrl;
                
            } catch (error) {
                console.error(`Error generando QR para ${item.code}:`, error);
                
                // Dibujar placeholder de error
                ctx.fillStyle = '#ffcccc';
                ctx.fillRect(x, y, config.itemWidth, config.itemHeight);
                ctx.fillStyle = '#cc0000';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(
                    'Error',
                    x + config.itemWidth / 2,
                    y + config.itemHeight / 2
                );
            }
        }
        
        return sheetCanvas.toDataURL('image/png');
    }
    
    /**
     * Convertir canvas a blob
     */
    canvasToBlob(canvas) {
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/png');
        });
    }
    
    /**
     * Limpiar cache
     */
    clearCache() {
        this.qrCodeCache.clear();
    }
    
    /**
     * Validar si un texto es un código QR válido del sistema
     */
    isValidSystemQR(text) {
        try {
            const data = JSON.parse(text);
            return data.type && (data.type === 'product' || data.type === 'location' || data.type === 'movement');
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Parsear código QR del sistema
     */
    parseSystemQR(text) {
        try {
            const data = JSON.parse(text);
            
            if (this.isValidSystemQR(text)) {
                return {
                    valid: true,
                    type: data.type,
                    data: data,
                    raw: text
                };
            }
        } catch (error) {
            // No es JSON válido
        }
        
        return {
            valid: false,
            type: 'unknown',
            data: null,
            raw: text
        };
    }
}

// Crear instancia global del gestor de QR
const qrCodeManager = new QRCodeManager();

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = qrCodeManager;
} else {
    window.qrCodeManager = qrCodeManager;
}