/**
 * Lógica específica para la gestión de movimientos
 */

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación y permisos
    checkAuth();
    if (!hasPermission('manage_movements')) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Cargar componentes
    loadComponents();
    
    // Inicializar variables
    let currentPage = 1;
    let itemsPerPage = 10;
    let totalItems = 0;
    let totalPages = 1;
    let currentFilters = {};
    let movements = [];
    let products = [];
    let locations = [];
    
    // Cargar datos iniciales
    loadInitialData();
    
    // Configurar eventos
    setupEventListeners();
    
    // Cargar movimientos
    loadMovements();
    
    // Cargar estadísticas
    loadMovementStats();
});

async function loadInitialData() {
    try {
        // Cargar productos para filtros
        const productsResponse = await getProducts({ limit: 1000 });
        products = productsResponse.data || [];
        
        // Cargar ubicaciones para filtros
        const locationsResponse = await getLocations({ limit: 1000 });
        locations = locationsResponse.data || [];
        
        // Llenar selectores de productos
        const productFilter = document.getElementById('filterProduct');
        const movementProduct = document.getElementById('movementProduct');
        
        if (productFilter) {
            productFilter.innerHTML = '<option value="">Todos los productos</option>' +
                products.map(p => `<option value="${p.id}">${p.code} - ${p.name}</option>`).join('');
        }
        
        if (movementProduct) {
            movementProduct.innerHTML = '<option value="">Selecciona un producto</option>' +
                products.map(p => `<option value="${p.id}">${p.code} - ${p.name}</option>`).join('');
        }
        
        // Llenar selectores de ubicaciones
        const fromLocation = document.getElementById('movementFromLocation');
        const toLocation = document.getElementById('movementToLocation');
        
        if (fromLocation) {
            fromLocation.innerHTML = '<option value="">Selecciona ubicación</option>' +
                locations.map(l => `<option value="${l.id}">${l.code} - ${l.name}</option>`).join('');
        }
        
        if (toLocation) {
            toLocation.innerHTML = '<option value="">Selecciona ubicación</option>' +
                locations.map(l => `<option value="${l.id}">${l.code} - ${l.name}</option>`).join('');
        }
        
    } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        showNotification('Error al cargar productos y ubicaciones', 'error');
    }
}

async function loadMovements() {
    showMiniLoading();
    
    try {
        const params = {
            page: currentPage,
            limit: itemsPerPage,
            ...currentFilters
        };
        
        const response = await getMovements(params);
        
        movements = response.data || [];
        totalItems = response.total || 0;
        totalPages = Math.ceil(totalItems / itemsPerPage);
        
        updateMovementsTable();
        updateMovementPagination();
        updateMovementCount();
        
    } catch (error) {
        console.error('Error al cargar movimientos:', error);
        showNotification('Error al cargar los movimientos', 'error');
    } finally {
        hideMiniLoading();
    }
}

function updateMovementsTable() {
    const tbody = document.getElementById('movementsTableBody');
    if (!tbody) return;
    
    if (movements.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" class="text-center">
                    <div class="empty-state">
                        <p>No se encontraron movimientos</p>
                        <button id="addFirstMovement" class="btn btn-primary btn-sm">
                            + Registrar primer movimiento
                        </button>
                    </div>
                </td>
            </tr>
        `;
        
        document.getElementById('addFirstMovement')?.addEventListener('click', () => {
            showMovementModal();
        });
        
        return;
    }
    
    let html = '';
    
    movements.forEach(movement => {
        const typeIcons = {
            'entrada': '⬆️',
            'salida': '⬇️',
            'transferencia': '🔄',
            'ajuste': '📝'
        };
        
        const typeClasses = {
            'entrada': 'success',
            'salida': 'danger',
            'transferencia': 'info',
            'ajuste': 'warning'
        };
        
        const icon = typeIcons[movement.type] || '📦';
        const typeClass = typeClasses[movement.type] || 'secondary';
        
        html += `
            <tr>
                <td>${movement.id}</td>
                <td>${formatDate(movement.date, 'short')}</td>
                <td>
                    <span class="badge badge-${typeClass}">${icon} ${capitalize(movement.type)}</span>
                </td>
                <td>
                    <strong>${movement.product?.name || 'Producto eliminado'}</strong>
                    <small class="text-muted d-block">${movement.product?.code || ''}</small>
                </td>
                <td class="text-${movement.type === 'entrada' ? 'success' : 'danger'}">
                    <strong>${movement.type === 'entrada' ? '+' : '-'}${formatNumber(movement.quantity)}</strong>
                </td>
                <td>${formatNumber(movement.previous_stock)}</td>
                <td>${formatNumber(movement.new_stock)}</td>
                <td>
                    ${movement.from_location ? `
                        <small class="text-muted">De:</small> ${movement.from_location.code}
                    ` : ''}
                    ${movement.to_location ? `
                        <br><small class="text-muted">A:</small> ${movement.to_location.code}
                    ` : ''}
                </td>
                <td>${movement.user?.name || 'Usuario'}</td>
                <td>${truncateText(movement.reason, 30)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-info view-btn" data-id="${movement.id}">
                            <span>👁️</span>
                        </button>
                        ${hasPermission('manage_movements') ? `
                            <button class="btn btn-sm btn-danger delete-btn" data-id="${movement.id}">
                                <span>🗑️</span>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    
    // Agregar eventos a los botones
    addMovementTableEvents();
}

function addMovementTableEvents() {
    // Botones de ver
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const movementId = this.getAttribute('data-id');
            viewMovement(movementId);
        });
    });
    
    // Botones de eliminar
    if (hasPermission('manage_movements')) {
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const movementId = this.getAttribute('data-id');
                confirmDeleteMovement(movementId);
            });
        });
    }
}

function updateMovementPagination() {
    const prevBtn = document.getElementById('prevMovementPage');
    const nextBtn = document.getElementById('nextMovementPage');
    const pageInfo = document.getElementById('movementPageInfo');
    
    if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
        prevBtn.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                loadMovements();
            }
        };
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages;
        nextBtn.onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadMovements();
            }
        };
    }
    
    if (pageInfo) {
        pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    }
}

function updateMovementCount() {
    const countElement = document.getElementById('movementCount');
    if (countElement) {
        countElement.textContent = `${totalItems} movimientos encontrados`;
    }
}

async function loadMovementStats() {
    try {
        const stats = await getMovementStats();
        
        // Actualizar estadísticas
        document.getElementById('totalEntradas').textContent = formatNumber(stats.entradas || 0);
        document.getElementById('totalSalidas').textContent = formatNumber(stats.salidas || 0);
        document.getElementById('totalTransferencias').textContent = formatNumber(stats.transferencias || 0);
        document.getElementById('totalAjustes').textContent = formatNumber(stats.ajustes || 0);
        
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

function setupEventListeners() {
    // Botón nuevo movimiento
    const newMovementBtn = document.getElementById('newMovementBtn');
    if (newMovementBtn) {
        newMovementBtn.addEventListener('click', showMovementModal);
    }
    
    // Botón escanear QR
    const scanMovementBtn = document.getElementById('scanMovementBtn');
    if (scanMovementBtn) {
        scanMovementBtn.addEventListener('click', showScanModal);
    }
    
    // Filtros
    const applyFiltersBtn = document.getElementById('applyMovementFilters');
    const clearFiltersBtn = document.getElementById('clearMovementFilters');
    const searchInput = document.getElementById('searchMovement');
    const typeFilter = document.getElementById('filterMovementType');
    const productFilter = document.getElementById('filterProduct');
    const dateFrom = document.getElementById('filterDateFrom');
    const dateTo = document.getElementById('filterDateTo');
    const itemsPerPageSelect = document.getElementById('movementItemsPerPage');
    
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            currentFilters.search = searchInput.value.trim();
            currentPage = 1;
            loadMovements();
        }, 500));
    }
    
    if (typeFilter) {
        typeFilter.addEventListener('change', () => {
            currentFilters.type = typeFilter.value || undefined;
            currentPage = 1;
            loadMovements();
        });
    }
    
    if (productFilter) {
        productFilter.addEventListener('change', () => {
            currentFilters.product_id = productFilter.value || undefined;
            currentPage = 1;
            loadMovements();
        });
    }
    
    if (dateFrom) {
        dateFrom.addEventListener('change', () => {
            currentFilters.date_from = dateFrom.value || undefined;
            currentPage = 1;
            loadMovements();
        });
    }
    
    if (dateTo) {
        dateTo.addEventListener('change', () => {
            currentFilters.date_to = dateTo.value || undefined;
            currentPage = 1;
            loadMovements();
        });
    }
    
    if (itemsPerPageSelect) {
        itemsPerPageSelect.value = itemsPerPage;
        itemsPerPageSelect.addEventListener('change', function() {
            itemsPerPage = parseInt(this.value);
            currentPage = 1;
            loadMovements();
        });
    }
    
    // Formulario de movimiento
    const movementForm = document.getElementById('movementForm');
    if (movementForm) {
        movementForm.addEventListener('submit', handleMovementSubmit);
    }
    
    // Tipo de movimiento cambia
    const movementType = document.getElementById('movementType');
    if (movementType) {
        movementType.addEventListener('change', updateMovementForm);
    }
    
    // Botón continuar después de escanear
    const continueBtn = document.getElementById('continueMovementBtn');
    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            closeModal('scanModal');
            showMovementModal(scannedProduct);
        });
    }
    
    // Inicializar modales
    initModals();
    
    // Inicializar escáner
    initScanner();
}

function initModals() {
    // Cerrar modales al hacer clic en X o fuera
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('show');
            }
        });
    });
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
            }
        });
    });
}

function applyFilters() {
    const searchInput = document.getElementById('searchMovement');
    const typeFilter = document.getElementById('filterMovementType');
    const productFilter = document.getElementById('filterProduct');
    const dateFrom = document.getElementById('filterDateFrom');
    const dateTo = document.getElementById('filterDateTo');
    
    currentFilters = {
        search: searchInput?.value.trim() || undefined,
        type: typeFilter?.value || undefined,
        product_id: productFilter?.value || undefined,
        date_from: dateFrom?.value || undefined,
        date_to: dateTo?.value || undefined
    };
    
    currentPage = 1;
    loadMovements();
}

function clearFilters() {
    const searchInput = document.getElementById('searchMovement');
    const typeFilter = document.getElementById('filterMovementType');
    const productFilter = document.getElementById('filterProduct');
    const dateFrom = document.getElementById('filterDateFrom');
    const dateTo = document.getElementById('filterDateTo');
    
    if (searchInput) searchInput.value = '';
    if (typeFilter) typeFilter.value = '';
    if (productFilter) productFilter.value = '';
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';
    
    currentFilters = {};
    currentPage = 1;
    loadMovements();
}

function showMovementModal(movement = null, scannedProduct = null) {
    const modal = document.getElementById('movementModal');
    const modalTitle = document.getElementById('movementModalTitle');
    const form = document.getElementById('movementForm');
    const movementId = document.getElementById('movementId');
    
    if (movement) {
        // Modo edición
        modalTitle.textContent = 'Editar Movimiento';
        
        // Llenar formulario
        document.getElementById('movementType').value = movement.type || '';
        document.getElementById('movementDate').value = new Date(movement.date).toISOString().slice(0, 16);
        document.getElementById('movementProduct').value = movement.product_id || '';
        document.getElementById('movementQuantity').value = movement.quantity || '';
        document.getElementById('movementFromLocation').value = movement.from_location_id || '';
        document.getElementById('movementToLocation').value = movement.to_location_id || '';
        document.getElementById('movementReason').value = movement.reason || '';
        document.getElementById('movementNotes').value = movement.notes || '';
        movementId.value = movement.id;
        
        updateMovementForm();
        
    } else {
        // Modo creación
        modalTitle.textContent = 'Nuevo Movimiento';
        form.reset();
        movementId.value = '';
        
        // Establecer valores por defecto
        const now = new Date();
        document.getElementById('movementDate').value = now.toISOString().slice(0, 16);
        
        // Si hay un producto escaneado, seleccionarlo
        if (scannedProduct) {
            document.getElementById('movementProduct').value = scannedProduct.id;
            document.getElementById('movementQuantity').value = 1;
        }
        
        updateMovementForm();
    }
    
    // Mostrar modal
    modal.classList.add('show');
    
    // Enfocar primer campo
    document.getElementById('movementType').focus();
}

function updateMovementForm() {
    const movementType = document.getElementById('movementType').value;
    const fromLocationRow = document.getElementById('fromLocationRow');
    const toLocationRow = document.getElementById('toLocationRow');
    const toLocationLabel = document.querySelector('label[for="movementToLocation"]');
    
    switch (movementType) {
        case 'entrada':
            fromLocationRow.style.display = 'none';
            toLocationRow.style.display = 'block';
            if (toLocationLabel) toLocationLabel.innerHTML = 'Ubicación Destino *';
            break;
            
        case 'salida':
            fromLocationRow.style.display = 'block';
            toLocationRow.style.display = 'none';
            break;
            
        case 'transferencia':
            fromLocationRow.style.display = 'block';
            toLocationRow.style.display = 'block';
            if (toLocationLabel) toLocationLabel.innerHTML = 'Ubicación Destino *';
            break;
            
        case 'ajuste':
            fromLocationRow.style.display = 'none';
            toLocationRow.style.display = 'block';
            if (toLocationLabel) toLocationLabel.innerHTML = 'Ubicación *';
            break;
            
        default:
            fromLocationRow.style.display = 'none';
            toLocationRow.style.display = 'none';
    }
}

async function viewMovement(movementId) {
    try {
        const movement = await getMovement(movementId);
        
        let html = `
            <h4>Detalles del Movimiento #${movement.id}</h4>
            <div class="movement-details">
                <p><strong>Fecha:</strong> ${formatDate(movement.date, 'long')}</p>
                <p><strong>Tipo:</strong> <span class="badge badge-${movement.type === 'entrada' ? 'success' : movement.type === 'salida' ? 'danger' : 'info'}">${capitalize(movement.type)}</span></p>
                <p><strong>Producto:</strong> ${movement.product?.name || 'Producto eliminado'} (${movement.product?.code || 'N/A'})</p>
                <p><strong>Cantidad:</strong> <span class="${movement.type === 'entrada' ? 'text-success' : 'text-danger'}">${movement.type === 'entrada' ? '+' : '-'}${formatNumber(movement.quantity)}</span></p>
                <p><strong>Stock anterior:</strong> ${formatNumber(movement.previous_stock)}</p>
                <p><strong>Nuevo stock:</strong> ${formatNumber(movement.new_stock)}</p>
        `;
        
        if (movement.from_location) {
            html += `<p><strong>Ubicación origen:</strong> ${movement.from_location.name} (${movement.from_location.code})</p>`;
        }
        
        if (movement.to_location) {
            html += `<p><strong>Ubicación destino:</strong> ${movement.to_location.name} (${movement.to_location.code})</p>`;
        }
        
        html += `
                <p><strong>Motivo:</strong> ${movement.reason}</p>
                ${movement.notes ? `<p><strong>Notas:</strong> ${movement.notes}</p>` : ''}
                <p><strong>Registrado por:</strong> ${movement.user?.name || 'Usuario'} (${formatDate(movement.created_at, 'short')})</p>
            </div>
        `;
        
        // Mostrar en modal
        showInfoModal('Detalles del Movimiento', html);
        
    } catch (error) {
        console.error('Error al cargar movimiento:', error);
        showNotification('Error al cargar los detalles del movimiento', 'error');
    }
}

async function handleMovementSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const movementData = Object.fromEntries(formData.entries());
    
    // Validar datos
    if (!movementData.type || !movementData.date || !movementData.product_id || !movementData.quantity || !movementData.reason) {
        showNotification('Todos los campos requeridos deben ser completados', 'error');
        return;
    }
    
    // Convertir campos
    movementData.product_id = parseInt(movementData.product_id);
    movementData.quantity = parseFloat(movementData.quantity);
    movementData.from_location_id = movementData.from_location_id ? parseInt(movementData.from_location_id) : null;
    movementData.to_location_id = movementData.to_location_id ? parseInt(movementData.to_location_id) : null;
    
    // Validar cantidad
    if (movementData.quantity <= 0) {
        showNotification('La cantidad debe ser mayor a 0', 'error');
        return;
    }
    
    try {
        showMiniLoading();
        
        if (movementData.id) {
            // Actualizar movimiento existente
            const id = movementData.id;
            delete movementData.id;
            await updateMovement(id, movementData);
            showNotification('Movimiento actualizado correctamente', 'success');
        } else {
            // Crear nuevo movimiento
            delete movementData.id;
            await createMovement(movementData);
            showNotification('Movimiento registrado correctamente', 'success');
        }
        
        // Cerrar modal y recargar movimientos y estadísticas
        closeModal('movementModal');
        loadMovements();
        loadMovementStats();
        
    } catch (error) {
        console.error('Error al guardar movimiento:', error);
        showNotification(error.message || 'Error al guardar el movimiento', 'error');
    } finally {
        hideMiniLoading();
    }
}

function confirmDeleteMovement(movementId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este movimiento?\nEsta acción no se puede deshacer.')) {
        return;
    }
    
    deleteMovement(movementId);
}

async function deleteMovement(movementId) {
    try {
        showMiniLoading();
        
        await deleteMovement(movementId);
        
        showNotification('Movimiento eliminado correctamente', 'success');
        
        // Recargar movimientos y estadísticas
        loadMovements();
        loadMovementStats();
        
    } catch (error) {
        console.error('Error al eliminar movimiento:', error);
        showNotification(error.message || 'Error al eliminar el movimiento', 'error');
    } finally {
        hideMiniLoading();
    }
}

// Variables para el escáner
let html5QrCode = null;
let scannedProduct = null;

function initScanner() {
    // Inicializar escáner QR
    try {
        html5QrCode = new Html5Qrcode("reader");
    } catch (error) {
        console.error('Error al inicializar escáner QR:', error);
    }
}

function showScanModal() {
    const modal = document.getElementById('scanModal');
    modal.classList.add('show');
    
    // Iniciar escáner
    startScanner();
}

function startScanner() {
    if (!html5QrCode) return;
    
    const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        facingMode: API_CONFIG.SCANNER.FACING_MODE
    };
    
    html5QrCode.start(
        { facingMode: config.facingMode },
        config,
        onScanSuccess,
        onScanError
    ).catch(err => {
        console.error('Error al iniciar escáner:', err);
        showNotification('Error al iniciar la cámara. Asegúrate de dar permisos.', 'error');
    });
}

function stopScanner() {
    if (html5QrCode) {
        html5QrCode.stop().catch(err => {
            console.error('Error al detener escáner:', err);
        });
    }
}

async function onScanSuccess(decodedText, decodedResult) {
    try {
        // Detener escáner
        stopScanner();
        
        // Parsear datos del QR
        const qrData = JSON.parse(decodedText);
        
        if (!qrData.product_id) {
            throw new Error('Código QR inválido');
        }
        
        // Buscar producto
        const product = await getProduct(qrData.product_id);
        scannedProduct = product;
        
        // Mostrar información del producto
        showScannedProduct(product);
        
    } catch (error) {
        console.error('Error al procesar QR:', error);
        showNotification('Error al leer el código QR. Intenta nuevamente.', 'error');
        
        // Reiniciar escáner después de un tiempo
        setTimeout(startScanner, 2000);
    }
}

function onScanError(error) {
    // Mostrar errores solo si son relevantes
    if (!error.includes('NotFoundException')) {
        console.warn('Error en escáner QR:', error);
    }
}

function showScannedProduct(product) {
    const scannerView = document.getElementById('scannerView');
    const scannedProductInfo = document.getElementById('scannedProductInfo');
    const productDetails = document.getElementById('productDetails');
    
    if (scannerView && scannedProductInfo && productDetails) {
        scannerView.style.display = 'none';
        scannedProductInfo.style.display = 'block';
        
        let html = `
            <div class="product-card">
                <h5>${product.name}</h5>
                <p><strong>Código:</strong> ${product.code}</p>
                <p><strong>Categoría:</strong> ${product.category?.name || '-'}</p>
                <p><strong>Ubicación:</strong> ${product.location?.name || '-'} (${product.location?.code || '-'})</p>
                <p><strong>Stock actual:</strong> ${formatNumber(product.stock)} ${product.unit || 'un'}</p>
                <p><strong>Stock mínimo:</strong> ${formatNumber(product.min_stock)}</p>
            </div>
        `;
        
        productDetails.innerHTML = html;
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
    
    // Detener escáner si está activo
    stopScanner();
    
    // Resetear vista de escáner
    const scannerView = document.getElementById('scannerView');
    const scannedProductInfo = document.getElementById('scannedProductInfo');
    
    if (scannerView) scannerView.style.display = 'block';
    if (scannedProductInfo) scannedProductInfo.style.display = 'none';
    
    scannedProduct = null;
}

function showInfoModal(title, content) {
    // Crear modal dinámico
    const modalId = 'infoModal_' + Date.now();
    const modalHtml = `
        <div id="${modalId}" class="modal show">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="document.getElementById('${modalId}').classList.remove('show')">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="document.getElementById('${modalId}').classList.remove('show')">Cerrar</button>
                </div>
            </div>
        </div>
    `;
    
    // Agregar al body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer.firstElementChild);
    
    // Cerrar al hacer clic fuera
    document.getElementById(modalId).addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('show');
        }
    });
}

// Función para cargar componentes
async function loadComponents() {
    // Similar a dashboard.js
}