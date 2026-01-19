/**
 * Lógica específica para el escáner QR
 */

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    checkAuth();
    
    // Cargar componentes
    loadComponents();
    
    // Inicializar variables
    let html5QrCode = null;
    let currentScanner = null;
    let scannedProducts = [];
    let inventorySession = null;
    
    // Configurar eventos
    setupEventListeners();
    
    // Cargar historial de escaneos
    loadScanHistory();
});

function setupEventListeners() {
    // Botones del escáner
    const startScannerBtn = document.getElementById('startScannerBtn');
    const stopScannerBtn = document.getElementById('stopScannerBtn');
    const toggleCameraBtn = document.getElementById('toggleCameraBtn');
    const newScanBtn = document.getElementById('newScanBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    
    // Botones de acciones rápidas
    const scanAndAddBtn = document.getElementById('scanAndAddBtn');
    const scanAndRemoveBtn = document.getElementById('scanAndRemoveBtn');
    const scanAndTransferBtn = document.getElementById('scanAndTransferBtn');
    const scanMultipleBtn = document.getElementById('scanMultipleBtn');
    const scanInventoryBtn = document.getElementById('scanInventoryBtn');
    const manualEntryBtn = document.getElementById('manualEntryBtn');
    
    // Botones de producto escaneado
    const viewProductBtn = document.getElementById('viewProductBtn');
    const registerMovementBtn = document.getElementById('registerMovementBtn');
    const generateLabelBtn = document.getElementById('generateLabelBtn');
    
    // Modales
    const manualEntryModal = document.getElementById('manualEntryModal');
    const inventoryModal = document.getElementById('inventoryModal');
    
    if (startScannerBtn) {
        startScannerBtn.addEventListener('click', startScanner);
    }
    
    if (stopScannerBtn) {
        stopScannerBtn.addEventListener('click', stopScanner);
    }
    
    if (toggleCameraBtn) {
        toggleCameraBtn.addEventListener('click', toggleCamera);
    }
    
    if (newScanBtn) {
        newScanBtn.addEventListener('click', resetScanner);
    }
    
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearScanHistory);
    }
    
    if (scanAndAddBtn) {
        scanAndAddBtn.addEventListener('click', () => scanAndAction('add'));
    }
    
    if (scanAndRemoveBtn) {
        scanAndRemoveBtn.addEventListener('click', () => scanAndAction('remove'));
    }
    
    if (scanAndTransferBtn) {
        scanAndTransferBtn.addEventListener('click', () => scanAndAction('transfer'));
    }
    
    if (scanMultipleBtn) {
        scanMultipleBtn.addEventListener('click', startMultipleScan);
    }
    
    if (scanInventoryBtn) {
        scanInventoryBtn.addEventListener('click', startInventoryScan);
    }
    
    if (manualEntryBtn) {
        manualEntryBtn.addEventListener('click', showManualEntryModal);
    }
    
    if (viewProductBtn) {
        viewProductBtn.addEventListener('click', viewScannedProduct);
    }
    
    if (registerMovementBtn) {
        registerMovementBtn.addEventListener('click', registerMovementFromScan);
    }
    
    if (generateLabelBtn) {
        generateLabelBtn.addEventListener('click', generateProductLabel);
    }
    
    // Formulario de entrada manual
    const manualEntryForm = document.getElementById('manualEntryForm');
    if (manualEntryForm) {
        manualEntryForm.addEventListener('submit', handleManualEntry);
    }
    
    // Botones de inventario
    const finishInventoryBtn = document.getElementById('finishInventoryBtn');
    const cancelInventoryBtn = document.getElementById('cancelInventoryBtn');
    
    if (finishInventoryBtn) {
        finishInventoryBtn.addEventListener('click', finishInventory);
    }
    
    if (cancelInventoryBtn) {
        cancelInventoryBtn.addEventListener('click', cancelInventory);
    }
    
    // Inicializar modales
    initModals();
}

function initModals() {
    // Cerrar modales al hacer clic en X o fuera
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('show');
                stopScanner();
            }
        });
    });
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
                stopScanner();
            }
        });
    });
}

function startScanner() {
    const scannerView = document.getElementById('scannerView');
    const scanResult = document.getElementById('scanResult');
    const startBtn = document.getElementById('startScannerBtn');
    const stopBtn = document.getElementById('stopScannerBtn');
    const toggleBtn = document.getElementById('toggleCameraBtn');
    
    if (!scannerView || !scanResult) return;
    
    try {
        // Inicializar escáner
        html5QrCode = new Html5Qrcode("reader");
        
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        };
        
        // Obtener cámaras disponibles
        Html5Qrcode.getCameras().then(cameras => {
            if (cameras && cameras.length > 0) {
                const facingMode = currentScanner === 'user' ? 'user' : 'environment';
                const cameraId = cameras.find(cam => cam.label.includes(facingMode))?.id || cameras[0].id;
                
                html5QrCode.start(
                    cameraId,
                    config,
                    onScanSuccess,
                    onScanError
                ).then(() => {
                    // Actualizar UI
                    scannerView.style.display = 'block';
                    scanResult.style.display = 'none';
                    startBtn.disabled = true;
                    stopBtn.disabled = false;
                    toggleBtn.disabled = false;
                    
                    showNotification('Escáner iniciado', 'success');
                });
            } else {
                throw new Error('No se encontraron cámaras');
            }
        }).catch(err => {
            console.error('Error al obtener cámaras:', err);
            showNotification('No se pudo acceder a la cámara', 'error');
        });
        
    } catch (error) {
        console.error('Error al iniciar escáner:', error);
        showNotification('Error al iniciar el escáner', 'error');
    }
}

function stopScanner() {
    if (!html5QrCode) return;
    
    const startBtn = document.getElementById('startScannerBtn');
    const stopBtn = document.getElementById('stopScannerBtn');
    const toggleBtn = document.getElementById('toggleCameraBtn');
    
    html5QrCode.stop().then(() => {
        html5QrCode = null;
        
        // Actualizar UI
        startBtn.disabled = false;
        stopBtn.disabled = true;
        toggleBtn.disabled = true;
        
        showNotification('Escáner detenido', 'info');
    }).catch(err => {
        console.error('Error al detener escáner:', err);
    });
}

function toggleCamera() {
    currentScanner = currentScanner === 'user' ? 'environment' : 'user';
    
    // Reiniciar escáner con la cámara opuesta
    stopScanner();
    setTimeout(startScanner, 500);
}

async function onScanSuccess(decodedText, decodedResult) {
    try {
        // Parsear datos del QR
        const qrData = JSON.parse(decodedText);
        
        if (!qrData.product_id) {
            throw new Error('Código QR inválido');
        }
        
        // Detener escáner temporalmente
        stopScanner();
        
        // Buscar producto
        const product = await getProduct(qrData.product_id);
        
        // Procesar producto según el modo actual
        if (inventorySession) {
            processInventoryScan(product);
        } else {
            processSingleScan(product);
        }
        
        // Guardar en historial
        saveToScanHistory(product, true);
        
    } catch (error) {
        console.error('Error al procesar QR:', error);
        
        // Guardar escaneo fallido en historial
        saveToScanHistory(null, false, error.message);
        
        showNotification('Error al leer el código QR: ' + error.message, 'error');
        
        // Reiniciar escáner después de un tiempo
        setTimeout(() => {
            if (inventorySession) {
                startScanner();
            }
        }, 2000);
    }
}

function onScanError(errorMessage) {
    // Mostrar errores solo si son relevantes
    if (!errorMessage.includes('NotFoundException')) {
        console.warn('Error en escáner QR:', errorMessage);
    }
}

function processSingleScan(product) {
    const scannerView = document.getElementById('scannerView');
    const scanResult = document.getElementById('scanResult');
    const productInfo = document.getElementById('productInfo');
    
    if (!scannerView || !scanResult || !productInfo) return;
    
    // Mostrar información del producto
    let html = `
        <div class="product-card scanned">
            <h4>${product.name}</h4>
            <div class="product-details">
                <p><strong>Código:</strong> ${product.code}</p>
                <p><strong>Categoría:</strong> ${product.category?.name || '-'}</p>
                <p><strong>Ubicación:</strong> ${product.location?.name || '-'} (${product.location?.code || '-'})</p>
                <p><strong>Stock actual:</strong> 
                    <span class="${product.stock <= product.min_stock ? 'text-danger' : 'text-success'}">
                        ${formatNumber(product.stock)} ${product.unit || 'un'}
                    </span>
                </p>
                <p><strong>Stock mínimo:</strong> ${formatNumber(product.min_stock)}</p>
                ${product.price ? `<p><strong>Precio:</strong> ${formatCurrency(product.price)}</p>` : ''}
            </div>
        </div>
    `;
    
    productInfo.innerHTML = html;
    
    // Almacenar producto para acciones posteriores
    window.currentScannedProduct = product;
    
    // Cambiar vista
    scannerView.style.display = 'none';
    scanResult.style.display = 'block';
    
    showNotification('Producto escaneado correctamente', 'success');
}

function processInventoryScan(product) {
    if (!inventorySession) return;
    
    // Verificar si el producto ya fue escaneado
    const existingIndex = inventorySession.scannedProducts.findIndex(p => p.id === product.id);
    
    if (existingIndex >= 0) {
        // Incrementar cantidad
        inventorySession.scannedProducts[existingIndex].count++;
        showNotification(`${product.name} - Cantidad: ${inventorySession.scannedProducts[existingIndex].count}`, 'info');
    } else {
        // Agregar nuevo producto
        inventorySession.scannedProducts.push({
            ...product,
            count: 1
        });
        showNotification(`Nuevo producto: ${product.name}`, 'success');
    }
    
    // Actualizar UI
    updateInventoryUI();
    
    // Continuar escaneando
    startScanner();
}

function updateInventoryUI() {
    if (!inventorySession) return;
    
    const scannedCount = document.getElementById('scannedCount');
    const inventoryList = document.getElementById('inventoryList');
    const progressBar = document.querySelector('.progress');
    
    if (scannedCount) {
        scannedCount.textContent = inventorySession.scannedProducts.length;
    }
    
    if (progressBar) {
        const progress = Math.min((inventorySession.scannedProducts.length / 50) * 100, 100);
        progressBar.style.width = `${progress}%`;
    }
    
    if (inventoryList) {
        let html = '';
        
        inventorySession.scannedProducts.forEach((product, index) => {
            html += `
                <div class="inventory-item">
                    <div class="item-info">
                        <strong>${product.code}</strong> - ${product.name}
                        <small class="text-muted">${product.location?.code || 'Sin ubicación'}</small>
                    </div>
                    <div class="item-count">
                        <span class="badge badge-primary">${product.count}</span>
                        <button class="btn btn-sm btn-danger remove-item" data-index="${index}">
                            <span>×</span>
                        </button>
                    </div>
                </div>
            `;
        });
        
        inventoryList.innerHTML = html || '<p class="text-muted">Aún no se han escaneado productos</p>';
        
        // Agregar eventos a los botones de eliminar
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                removeFromInventory(index);
            });
        });
    }
}

function removeFromInventory(index) {
    if (!inventorySession || !inventorySession.scannedProducts[index]) return;
    
    inventorySession.scannedProducts.splice(index, 1);
    updateInventoryUI();
    showNotification('Producto removido del inventario', 'info');
}

function resetScanner() {
    const scannerView = document.getElementById('scannerView');
    const scanResult = document.getElementById('scanResult');
    
    if (scannerView) scannerView.style.display = 'block';
    if (scanResult) scanResult.style.display = 'none';
    
    window.currentScannedProduct = null;
    
    // Reiniciar escáner
    startScanner();
}

function loadScanHistory() {
    // Cargar historial desde localStorage
    const history = JSON.parse(localStorage.getItem('scan_history') || '[]');
    
    const historyContainer = document.getElementById('scanHistory');
    const emptyHistory = document.getElementById('emptyHistory');
    
    if (!historyContainer || !emptyHistory) return;
    
    if (history.length === 0) {
        historyContainer.style.display = 'none';
        emptyHistory.style.display = 'block';
        return;
    }
    
    historyContainer.style.display = 'block';
    emptyHistory.style.display = 'none';
    
    let html = '';
    
    // Mostrar últimos 10 escaneos
    history.slice(0, 10).forEach(item => {
        const timeAgo = getTimeAgo(item.timestamp);
        
        html += `
            <div class="scan-history-item ${item.success ? 'success' : 'error'}">
                <div class="scan-time">${timeAgo}</div>
                <div class="scan-product">${item.product_name || 'Código desconocido'}</div>
                <div class="scan-result">${item.success ? '✅' : '❌'} ${item.message || 'Escaneo'}</div>
            </div>
        `;
    });
    
    historyContainer.innerHTML = html;
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Hace unos segundos';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    
    return formatDate(past, 'short');
}

function saveToScanHistory(product, success, message = null) {
    const history = JSON.parse(localStorage.getItem('scan_history') || '[]');
    
    history.unshift({
        timestamp: new Date().toISOString(),
        product_id: product?.id,
        product_name: product?.name || product?.code,
        success: success,
        message: message || (success ? 'Escaneo exitoso' : 'Error en escaneo')
    });
    
    // Mantener solo los últimos 50 registros
    if (history.length > 50) {
        history.pop();
    }
    
    localStorage.setItem('scan_history', JSON.stringify(history));
    
    // Actualizar UI
    loadScanHistory();
}

function clearScanHistory() {
    if (confirm('¿Estás seguro de que deseas limpiar el historial de escaneos?')) {
        localStorage.removeItem('scan_history');
        loadScanHistory();
        showNotification('Historial limpiado', 'success');
    }
}

function scanAndAction(action) {
    // Configurar modo de escaneo según la acción
    let mode = 'single';
    let message = '';
    
    switch (action) {
        case 'add':
            message = 'Modo: Escanear y Agregar. Escanea un producto para registrar una entrada.';
            break;
        case 'remove':
            message = 'Modo: Escanear y Retirar. Escanea un producto para registrar una salida.';
            break;
        case 'transfer':
            message = 'Modo: Escanear y Transferir. Escanea un producto para registrar una transferencia.';
            break;
    }
    
    showNotification(message, 'info');
    
    // Iniciar escáner
    startScanner();
    
    // Al escanear, realizar la acción correspondiente
    window.scanActionMode = action;
}

async function startMultipleScan() {
    showNotification('Modo: Escaneo Múltiple. Escanea varios productos consecutivamente.', 'info');
    
    // Iniciar sesión de escaneo múltiple
    scannedProducts = [];
    
    // Iniciar escáner
    startScanner();
    
    // Al escanear, agregar a la lista
    window.scanActionMode = 'multiple';
}

function startInventoryScan() {
    // Iniciar sesión de inventario físico
    inventorySession = {
        startTime: new Date(),
        scannedProducts: [],
        location: null // Se podría seleccionar una ubicación
    };
    
    // Mostrar modal de inventario
    const modal = document.getElementById('inventoryModal');
    modal.classList.add('show');
    
    // Iniciar escáner
    startScanner();
    
    showNotification('Modo: Inventario Físico. Escanea todos los productos en esta ubicación.', 'info');
}

function showManualEntryModal() {
    const modal = document.getElementById('manualEntryModal');
    modal.classList.add('show');
    
    // Enfocar campo de entrada
    document.getElementById('manualCode').focus();
}

async function handleManualEntry(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const entryData = Object.fromEntries(formData.entries());
    
    const code = entryData.code.trim();
    const codeType = entryData.code_type;
    
    if (!code) {
        showNotification('Por favor, introduce un código', 'error');
        return;
    }
    
    try {
        showMiniLoading();
        
        let product;
        
        // Buscar producto según el tipo de código
        switch (codeType) {
            case 'qr_code':
            case 'barcode':
                // Parsear código QR/barra
                try {
                    const qrData = JSON.parse(code);
                    if (qrData.product_id) {
                        product = await getProduct(qrData.product_id);
                    }
                } catch (error) {
                    // Si no es JSON, buscar por código
                    const products = await searchProducts(code);
                    if (products.data && products.data.length > 0) {
                        product = products.data[0];
                    }
                }
                break;
                
            case 'product_code':
            case 'sku':
                // Buscar por código
                const products = await searchProducts(code);
                if (products.data && products.data.length > 0) {
                    product = products.data[0];
                }
                break;
        }
        
        if (product) {
            // Procesar como si se hubiera escaneado
            processSingleScan(product);
            saveToScanHistory(product, true);
            closeModal('manualEntryModal');
        } else {
            throw new Error('Producto no encontrado');
        }
        
    } catch (error) {
        console.error('Error en entrada manual:', error);
        saveToScanHistory(null, false, 'Producto no encontrado');
        showNotification('Producto no encontrado', 'error');
    } finally {
        hideMiniLoading();
    }
}

function viewScannedProduct() {
    const product = window.currentScannedProduct;
    if (!product) return;
    
    // Redirigir a la página del producto
    window.location.href = `productos.html?id=${product.id}`;
}

function registerMovementFromScan() {
    const product = window.currentScannedProduct;
    if (!product) return;
    
    // Redirigir a movimientos con el producto seleccionado
    window.location.href = `movimientos.html?product=${product.id}`;
}

function generateProductLabel() {
    const product = window.currentScannedProduct;
    if (!product) return;
    
    // Generar etiqueta para imprimir
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <html>
            <head>
                <title>Etiqueta - ${product.code}</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 0; 
                        padding: 10px; 
                        width: 80mm; 
                    }
                    .label { 
                        border: 1px solid #000; 
                        padding: 10px; 
                        text-align: center; 
                    }
                    .product-name { 
                        font-size: 14px; 
                        font-weight: bold; 
                        margin-bottom: 5px; 
                    }
                    .product-code { 
                        font-size: 12px; 
                        margin-bottom: 10px; 
                    }
                    .qr-code { 
                        margin: 10px auto; 
                    }
                    .product-info { 
                        font-size: 10px; 
                        margin-top: 10px; 
                    }
                </style>
            </head>
            <body>
                <div class="label">
                    <div class="product-name">${product.name}</div>
                    <div class="product-code">${product.code}</div>
                    <div class="qr-code" id="qrCode"></div>
                    <div class="product-info">
                        <div>Stock: ${product.stock} ${product.unit || 'un'}</div>
                        <div>${product.location?.code || 'Sin ubicación'}</div>
                        <div>${formatDate(new Date(), 'short')}</div>
                    </div>
                </div>
                <script src="${window.location.origin}/libs/qrcode.min.js"></script>
                <script>
                    const qrContent = ${JSON.stringify({
                        product_id: product.id,
                        code: product.code,
                        name: product.name
                    })};
                    
                    QRCode.toCanvas(document.getElementById('qrCode'), qrContent, {
                        width: 100,
                        height: 100,
                        color: { dark: '#000000', light: '#FFFFFF' }
                    });
                    
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

function finishInventory() {
    if (!inventorySession || inventorySession.scannedProducts.length === 0) {
        showNotification('No se escanearon productos', 'warning');
        return;
    }
    
    // Mostrar resumen del inventario
    let summary = `Inventario finalizado:\n`;
    summary += `Productos escaneados: ${inventorySession.scannedProducts.length}\n`;
    summary += `Total de items: ${inventorySession.scannedProducts.reduce((sum, p) => sum + p.count, 0)}\n`;
    summary += `Tiempo: ${Math.round((new Date() - inventorySession.startTime) / 1000)} segundos`;
    
    alert(summary);
    
    // Aquí podrías enviar los datos al servidor
    // await saveInventoryData(inventorySession);
    
    showNotification('Inventario guardado correctamente', 'success');
    cancelInventory();
}

function cancelInventory() {
    inventorySession = null;
    
    // Limpiar UI
    const inventoryList = document.getElementById('inventoryList');
    const scannedCount = document.getElementById('scannedCount');
    const progressBar = document.querySelector('.progress');
    
    if (inventoryList) inventoryList.innerHTML = '<p class="text-muted">Aún no se han escaneado productos</p>';
    if (scannedCount) scannedCount.textContent = '0';
    if (progressBar) progressBar.style.width = '0%';
    
    // Cerrar modal y detener escáner
    closeModal('inventoryModal');
    stopScanner();
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

// Función para cargar componentes
async function loadComponents() {
    // Similar a dashboard.js
}