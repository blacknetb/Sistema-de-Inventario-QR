/**
 * Lógica específica para la gestión de productos
 */

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación y permisos
    checkAuth();
    if (!hasPermission('manage_products')) {
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
    let products = [];
    let categories = [];
    let locations = [];
    
    // Cargar datos iniciales
    loadInitialData();
    
    // Configurar eventos
    setupEventListeners();
    
    // Cargar productos
    loadProducts();
});

async function loadInitialData() {
    try {
        // Cargar categorías para filtros
        const categoriesResponse = await getCategories({ limit: 100 });
        categories = categoriesResponse.data || [];
        
        // Cargar ubicaciones para filtros
        const locationsResponse = await getLocations({ limit: 100 });
        locations = locationsResponse.data || [];
        
        // Llenar selectores de categorías
        const categorySelect = document.getElementById('filterCategory');
        const productCategorySelect = document.getElementById('productCategory');
        
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">Todas las categorías</option>' +
                categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
        }
        
        if (productCategorySelect) {
            productCategorySelect.innerHTML = '<option value="">Selecciona una categoría</option>' +
                categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
        }
        
        // Llenar selectores de ubicaciones
        const locationSelect = document.getElementById('filterLocation');
        const productLocationSelect = document.getElementById('productLocation');
        
        if (locationSelect) {
            locationSelect.innerHTML = '<option value="">Todas las ubicaciones</option>' +
                locations.map(loc => `<option value="${loc.id}">${loc.name} (${loc.code})</option>`).join('');
        }
        
        if (productLocationSelect) {
            productLocationSelect.innerHTML = '<option value="">Selecciona una ubicación</option>' +
                locations.map(loc => `<option value="${loc.id}">${loc.name} (${loc.code})</option>`).join('');
        }
        
    } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        showNotification('Error al cargar categorías y ubicaciones', 'error');
    }
}

async function loadProducts() {
    showMiniLoading();
    
    try {
        const params = {
            page: currentPage,
            limit: itemsPerPage,
            ...currentFilters
        };
        
        const response = await getProducts(params);
        
        products = response.data || [];
        totalItems = response.total || 0;
        totalPages = Math.ceil(totalItems / itemsPerPage);
        
        updateProductsTable();
        updatePagination();
        updateProductCount();
        
    } catch (error) {
        console.error('Error al cargar productos:', error);
        showNotification('Error al cargar los productos', 'error');
    } finally {
        hideMiniLoading();
    }
}

function updateProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    
    if (products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center">
                    <div class="empty-state">
                        <p>No se encontraron productos</p>
                        <button id="addFirstProduct" class="btn btn-primary btn-sm">
                            + Agregar primer producto
                        </button>
                    </div>
                </td>
            </tr>
        `;
        
        document.getElementById('addFirstProduct')?.addEventListener('click', () => {
            showProductModal();
        });
        
        return;
    }
    
    let html = '';
    
    products.forEach(product => {
        const stockPercent = product.min_stock > 0 ? (product.stock / product.min_stock) * 100 : 0;
        
        let statusClass = 'success';
        let statusText = 'Normal';
        let stockClass = '';
        
        if (product.stock === 0) {
            statusClass = 'danger';
            statusText = 'Agotado';
            stockClass = 'text-danger';
        } else if (stockPercent <= 20) {
            statusClass = 'danger';
            statusText = 'Muy bajo';
            stockClass = 'text-danger';
        } else if (stockPercent <= 50) {
            statusClass = 'warning';
            statusText = 'Bajo';
            stockClass = 'text-warning';
        }
        
        html += `
            <tr>
                <td>${product.id}</td>
                <td>
                    <button class="btn btn-sm btn-secondary view-qr-btn" data-id="${product.id}">
                        <span>👁️ Ver QR</span>
                    </button>
                </td>
                <td>
                    <strong>${product.name}</strong>
                    <small class="text-muted d-block">${product.code}</small>
                </td>
                <td>${product.category?.name || '-'}</td>
                <td>${product.location?.name || '-'} <small class="text-muted">${product.location?.code || ''}</small></td>
                <td class="${stockClass}"><strong>${formatNumber(product.stock)}</strong> ${product.unit || 'un'}</td>
                <td>${formatNumber(product.min_stock)}</td>
                <td>
                    <span class="badge badge-${statusClass}">${statusText}</span>
                </td>
                <td>${formatDate(product.updated_at, 'short')}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary edit-btn" data-id="${product.id}">
                            <span>✏️</span>
                        </button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${product.id}">
                            <span>🗑️</span>
                        </button>
                        <button class="btn btn-sm btn-secondary qr-btn" data-id="${product.id}">
                            <span>📄 QR</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    
    // Agregar eventos a los botones
    addProductTableEvents();
}

function addProductTableEvents() {
    // Botones de editar
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            editProduct(productId);
        });
    });
    
    // Botones de eliminar
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            confirmDeleteProduct(productId);
        });
    });
    
    // Botones de ver QR
    document.querySelectorAll('.view-qr-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            showProductQR(productId);
        });
    });
    
    // Botones de generar QR
    document.querySelectorAll('.qr-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            generateProductQR(productId);
        });
    });
}

function updatePagination() {
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    
    if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
        prevBtn.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                loadProducts();
            }
        };
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages;
        nextBtn.onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadProducts();
            }
        };
    }
    
    if (pageInfo) {
        pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    }
}

function updateProductCount() {
    const countElement = document.getElementById('productCount');
    if (countElement) {
        countElement.textContent = `${totalItems} productos encontrados`;
    }
}

function setupEventListeners() {
    // Botón nuevo producto
    const newProductBtn = document.getElementById('newProductBtn');
    if (newProductBtn) {
        newProductBtn.addEventListener('click', showProductModal);
    }
    
    // Botón generar QR masivo
    const generateQrBtn = document.getElementById('generateQrBtn');
    if (generateQrBtn) {
        generateQrBtn.addEventListener('click', showBulkQRModal);
    }
    
    // Filtros
    const applyFiltersBtn = document.getElementById('applyFilters');
    const clearFiltersBtn = document.getElementById('clearFilters');
    const searchInput = document.getElementById('searchProduct');
    const categoryFilter = document.getElementById('filterCategory');
    const locationFilter = document.getElementById('filterLocation');
    const stockFilter = document.getElementById('filterStock');
    const itemsPerPageSelect = document.getElementById('itemsPerPage');
    
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
            loadProducts();
        }, 500));
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            currentFilters.category_id = categoryFilter.value || undefined;
            currentPage = 1;
            loadProducts();
        });
    }
    
    if (locationFilter) {
        locationFilter.addEventListener('change', () => {
            currentFilters.location_id = locationFilter.value || undefined;
            currentPage = 1;
            loadProducts();
        });
    }
    
    if (stockFilter) {
        stockFilter.addEventListener('change', () => {
            currentFilters.stock_status = stockFilter.value || undefined;
            currentPage = 1;
            loadProducts();
        });
    }
    
    if (itemsPerPageSelect) {
        itemsPerPageSelect.value = itemsPerPage;
        itemsPerPageSelect.addEventListener('change', function() {
            itemsPerPage = parseInt(this.value);
            currentPage = 1;
            loadProducts();
        });
    }
    
    // Modal de producto
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }
    
    // Modal de QR masivo
    const bulkQrForm = document.getElementById('generateBulkQrBtn');
    if (bulkQrForm) {
        bulkQrForm.addEventListener('click', generateBulkQR);
    }
    
    const selectAllBtn = document.getElementById('selectAllProducts');
    const deselectAllBtn = document.getElementById('deselectAllProducts');
    const bulkProductsSelect = document.getElementById('bulkProductsSelect');
    
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => {
            if (bulkProductsSelect) {
                Array.from(bulkProductsSelect.options).forEach(option => {
                    option.selected = true;
                });
                updateSelectedCount();
            }
        });
    }
    
    if (deselectAllBtn) {
        deselectAllBtn.addEventListener('click', () => {
            if (bulkProductsSelect) {
                Array.from(bulkProductsSelect.options).forEach(option => {
                    option.selected = false;
                });
                updateSelectedCount();
            }
        });
    }
    
    if (bulkProductsSelect) {
        bulkProductsSelect.addEventListener('change', updateSelectedCount);
    }
}

function applyFilters() {
    const searchInput = document.getElementById('searchProduct');
    const categoryFilter = document.getElementById('filterCategory');
    const locationFilter = document.getElementById('filterLocation');
    const stockFilter = document.getElementById('filterStock');
    
    currentFilters = {
        search: searchInput?.value.trim() || undefined,
        category_id: categoryFilter?.value || undefined,
        location_id: locationFilter?.value || undefined,
        stock_status: stockFilter?.value || undefined
    };
    
    currentPage = 1;
    loadProducts();
}

function clearFilters() {
    const searchInput = document.getElementById('searchProduct');
    const categoryFilter = document.getElementById('filterCategory');
    const locationFilter = document.getElementById('filterLocation');
    const stockFilter = document.getElementById('filterStock');
    
    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (locationFilter) locationFilter.value = '';
    if (stockFilter) stockFilter.value = '';
    
    currentFilters = {};
    currentPage = 1;
    loadProducts();
}

function showProductModal(product = null) {
    const modal = document.getElementById('productModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('productForm');
    const productId = document.getElementById('productId');
    
    if (product) {
        // Modo edición
        modalTitle.textContent = 'Editar Producto';
        
        // Llenar formulario
        document.getElementById('productName').value = product.name || '';
        document.getElementById('productCode').value = product.code || '';
        document.getElementById('productStock').value = product.stock || 0;
        document.getElementById('productMinStock').value = product.min_stock || 10;
        document.getElementById('productMaxStock').value = product.max_stock || 100;
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productUnit').value = product.unit || '';
        document.getElementById('productPrice').value = product.price || '';
        productId.value = product.id;
        
        // Seleccionar categoría y ubicación
        if (product.category_id) {
            document.getElementById('productCategory').value = product.category_id;
        }
        
        if (product.location_id) {
            document.getElementById('productLocation').value = product.location_id;
        }
    } else {
        // Modo creación
        modalTitle.textContent = 'Nuevo Producto';
        form.reset();
        productId.value = '';
        
        // Establecer valores por defecto
        document.getElementById('productStock').value = 0;
        document.getElementById('productMinStock').value = 10;
        document.getElementById('productMaxStock').value = 100;
    }
    
    // Mostrar modal
    modal.classList.add('show');
    
    // Enfocar primer campo
    document.getElementById('productName').focus();
}

async function editProduct(productId) {
    try {
        const product = await getProduct(productId);
        showProductModal(product);
    } catch (error) {
        console.error('Error al cargar producto:', error);
        showNotification('Error al cargar el producto', 'error');
    }
}

async function handleProductSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const productData = Object.fromEntries(formData.entries());
    
    // Convertir campos numéricos
    productData.stock = parseInt(productData.stock) || 0;
    productData.min_stock = parseInt(productData.min_stock) || 0;
    productData.max_stock = parseInt(productData.max_stock) || 0;
    productData.price = parseFloat(productData.price) || null;
    productData.category_id = parseInt(productData.category_id) || null;
    productData.location_id = parseInt(productData.location_id) || null;
    
    // Validar datos
    if (!productData.name || !productData.code) {
        showNotification('Nombre y código son campos requeridos', 'error');
        return;
    }
    
    try {
        showMiniLoading();
        
        if (productData.id) {
            // Actualizar producto existente
            const id = productData.id;
            delete productData.id;
            await updateProduct(id, productData);
            showNotification('Producto actualizado correctamente', 'success');
        } else {
            // Crear nuevo producto
            delete productData.id;
            await createProduct(productData);
            showNotification('Producto creado correctamente', 'success');
        }
        
        // Cerrar modal y recargar productos
        closeModal('productModal');
        loadProducts();
        
    } catch (error) {
        console.error('Error al guardar producto:', error);
        showNotification(error.message || 'Error al guardar el producto', 'error');
    } finally {
        hideMiniLoading();
    }
}

async function confirmDeleteProduct(productId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) {
        return;
    }
    
    try {
        showMiniLoading();
        await deleteProduct(productId);
        showNotification('Producto eliminado correctamente', 'success');
        loadProducts();
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        showNotification(error.message || 'Error al eliminar el producto', 'error');
    } finally {
        hideMiniLoading();
    }
}

async function showProductQR(productId) {
    try {
        const product = await getProduct(productId);
        const modal = document.getElementById('qrModal');
        const qrContainer = document.getElementById('qrCodeContainer');
        const productInfo = document.getElementById('qrProductInfo');
        
        // Generar contenido QR
        const qrContent = JSON.stringify({
            product_id: product.id,
            code: product.code,
            name: product.name
        });
        
        // Limpiar contenedor QR
        qrContainer.innerHTML = '';
        
        // Generar QR
        const qrSize = API_CONFIG.QR.DEFAULT_SIZE;
        QRCode.toCanvas(qrContainer, qrContent, {
            width: qrSize,
            height: qrSize,
            color: {
                dark: API_CONFIG.QR.DEFAULT_COLOR,
                light: API_CONFIG.QR.DEFAULT_BG_COLOR
            }
        }, function(error) {
            if (error) {
                console.error('Error al generar QR:', error);
                qrContainer.innerHTML = '<p class="text-danger">Error al generar QR</p>';
            }
        });
        
        // Mostrar información del producto
        productInfo.textContent = `${product.name} (${product.code})`;
        
        // Configurar botones
        document.getElementById('printQrBtn').onclick = () => printQR(product);
        document.getElementById('downloadQrBtn').onclick = () => downloadQR(product);
        
        // Mostrar modal
        modal.classList.add('show');
        
    } catch (error) {
        console.error('Error al cargar producto para QR:', error);
        showNotification('Error al cargar información del producto', 'error');
    }
}

function printQR(product) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>QR Producto ${product.code}</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                    .qr-container { margin: 20px 0; }
                    .product-info { margin: 20px 0; font-size: 14px; }
                </style>
            </head>
            <body>
                <h3>Código QR del Producto</h3>
                <div class="product-info">
                    <p><strong>${product.name}</strong></p>
                    <p>Código: ${product.code}</p>
                    <p>Generado: ${formatDate(new Date(), 'medium')}</p>
                </div>
                <div class="qr-container" id="qrPrintContainer"></div>
                <script src="${window.location.origin}/libs/qrcode.min.js"></script>
                <script>
                    const qrContent = ${JSON.stringify({
                        product_id: product.id,
                        code: product.code,
                        name: product.name
                    })};
                    
                    QRCode.toCanvas(document.getElementById('qrPrintContainer'), qrContent, {
                        width: 200,
                        height: 200,
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

function downloadQR(product) {
    const qrContent = JSON.stringify({
        product_id: product.id,
        code: product.code,
        name: product.name
    });
    
    const canvas = document.querySelector('#qrCodeContainer canvas');
    if (canvas) {
        const link = document.createElement('a');
        link.download = `qr_${product.code}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showNotification('QR descargado correctamente', 'success');
    }
}

async function generateProductQR(productId) {
    try {
        const options = {
            size: API_CONFIG.QR.DEFAULT_SIZE,
            include_label: true
        };
        
        const result = await generateProductQR(productId, options);
        
        if (result.qr_url) {
            // Descargar QR
            const link = document.createElement('a');
            link.download = `qr_producto_${productId}.png`;
            link.href = result.qr_url;
            link.click();
            showNotification('QR generado y descargado correctamente', 'success');
        }
    } catch (error) {
        console.error('Error al generar QR:', error);
        showNotification('Error al generar QR', 'error');
    }
}

async function showBulkQRModal() {
    try {
        // Cargar todos los productos para selección
        const response = await getProducts({ limit: 1000 });
        const products = response.data || [];
        
        const modal = document.getElementById('bulkQrModal');
        const select = document.getElementById('bulkProductsSelect');
        
        if (select) {
            select.innerHTML = products.map(product => 
                `<option value="${product.id}">${product.code} - ${product.name}</option>`
            ).join('');
            
            updateSelectedCount();
        }
        
        modal.classList.add('show');
        
    } catch (error) {
        console.error('Error al cargar productos para QR masivo:', error);
        showNotification('Error al cargar productos', 'error');
    }
}

function updateSelectedCount() {
    const select = document.getElementById('bulkProductsSelect');
    const countElement = document.getElementById('selectedCount');
    
    if (select && countElement) {
        const selectedCount = Array.from(select.selectedOptions).length;
        countElement.textContent = selectedCount;
    }
}

async function generateBulkQR() {
    const select = document.getElementById('bulkProductsSelect');
    const qrSize = document.getElementById('qrSize').value;
    
    if (!select) return;
    
    const selectedOptions = Array.from(select.selectedOptions);
    const productIds = selectedOptions.map(option => parseInt(option.value));
    
    if (productIds.length === 0) {
        showNotification('Selecciona al menos un producto', 'error');
        return;
    }
    
    try {
        showLoading('Generando códigos QR...');
        
        const options = {
            size: parseInt(qrSize),
            include_label: true
        };
        
        const result = await generateBulkQR(productIds, options);
        
        if (result.zip_url) {
            // Descargar archivo ZIP
            const link = document.createElement('a');
            link.download = 'qr_codes.zip';
            link.href = result.zip_url;
            link.click();
            showNotification(`${productIds.length} códigos QR generados y descargados`, 'success');
        }
        
        closeModal('bulkQrModal');
        
    } catch (error) {
        console.error('Error al generar QR masivo:', error);
        showNotification('Error al generar códigos QR', 'error');
    } finally {
        hideLoading();
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

// Función para cargar componentes (similar a dashboard.js)
async function loadComponents() {
    // Implementar carga de componentes si es necesario
}

// Inicializar modales
document.addEventListener('DOMContentLoaded', function() {
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
});