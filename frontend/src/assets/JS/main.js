// Sistema de Inventario QR - Script Principal
// Versión: 1.0.0

(function() {
    'use strict';
    
    // =============== CONSTANTES Y CONFIGURACIÓN ===============
    const APP_ROUTES = {
        dashboard: '/',
        products: {
            list: '/products',
            new: '/products/new',
            edit: '/products/:id/edit',
            view: '/products/:id'
        },
        inventory: '/inventory',
        scanner: '/scanner',
        reports: '/reports',
        settings: '/settings',
        profile: '/profile'
    };
    
    // =============== FUNCIONES DE NAVEGACIÓN ===============
    
    /**
     * Navega a una ruta específica
     * @param {string} path - Ruta de destino
     * @param {Object} params - Parámetros para la ruta
     */
    function navigateTo(path, params = {}) {
        let finalPath = path;
        
        // Reemplazar parámetros en la ruta
        Object.keys(params).forEach(key => {
            finalPath = finalPath.replace(`:${key}`, params[key]);
        });
        
        // Simular navegación (en una SPA real usarías un router)
        console.log('Navegando a:', finalPath);
        
        // Actualizar URL sin recargar la página
        window.history.pushState({ path: finalPath }, '', finalPath);
        
        // Cargar contenido de la ruta
        loadRouteContent(finalPath);
    }
    
    /**
     * Carga el contenido de una ruta específica
     * @param {string} path - Ruta a cargar
     */
    function loadRouteContent(path) {
        const root = document.getElementById('root');
        
        // Mostrar indicador de carga
        root.innerHTML = `
            <div class="app-loading fade-in">
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p class="loading-description">Cargando contenido...</p>
                </div>
            </div>
        `;
        
        // Simular carga de contenido
        setTimeout(() => {
            root.innerHTML = getRouteTemplate(path);
            
            // Inicializar componentes específicos de la ruta
            initializeRouteComponents(path);
            
            // Ocultar pantalla de carga principal si aún está visible
            const appLoading = document.getElementById('app-loading');
            if (appLoading && appLoading.style.display !== 'none') {
                appLoading.style.opacity = '0';
                setTimeout(() => {
                    appLoading.style.display = 'none';
                }, 400);
            }
        }, 500);
    }
    
    /**
     * Obtiene el template HTML para una ruta específica
     * @param {string} path - Ruta solicitada
     * @returns {string} - Template HTML
     */
    function getRouteTemplate(path) {
        // En una aplicación real, esto vendría de archivos separados o de un servidor
        const templates = {
            '/': getDashboardTemplate(),
            '/products': getProductsTemplate(),
            '/products/new': getProductFormTemplate(),
            '/inventory': getInventoryTemplate(),
            '/scanner': getScannerTemplate(),
            '/reports': getReportsTemplate(),
            '/settings': getSettingsTemplate(),
            '/profile': getProfileTemplate(),
            '/404': getNotFoundTemplate()
        };
        
        return templates[path] || templates['/404'];
    }
    
    // =============== TEMPLATES DE RUTAS ===============
    
    function getDashboardTemplate() {
        return `
            <div class="app-container">
                <header class="app-header">
                    <div class="container">
                        <div class="header-content">
                            <div class="logo">
                                <svg class="logo-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375z"/>
                                    <path fill-rule="evenodd" d="M3.087 9l.54 9.176A3 3 0 006.62 21h10.757a3 3 0 002.995-2.824L20.913 9H3.087zm6.163 3.75A.75.75 0 0110 12h4a.75.75 0 010 1.5h-4a.75.75 0 01-.75-.75z" clip-rule="evenodd"/>
                                </svg>
                                <span class="logo-text">Inventario QR</span>
                            </div>
                            <nav class="nav-menu">
                                <a href="#" class="nav-link active" data-route="/">Dashboard</a>
                                <a href="#" class="nav-link" data-route="/products">Productos</a>
                                <a href="#" class="nav-link" data-route="/inventory">Inventario</a>
                                <a href="#" class="nav-link" data-route="/scanner">Escáner</a>
                                <a href="#" class="nav-link" data-route="/reports">Reportes</a>
                            </nav>
                            <div class="user-menu">
                                <button class="btn btn-outline" id="user-menu-btn">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>
                
                <main class="main-content">
                    <div class="container">
                        <div class="welcome-section mb-5">
                            <h1 class="mb-2">Dashboard de Inventario</h1>
                            <p class="text-secondary">Bienvenido al sistema de gestión de inventario con códigos QR</p>
                        </div>
                        
                        <div class="dashboard-grid">
                            <div class="dashboard-card">
                                <div class="dashboard-card-title">Productos Totales</div>
                                <div class="dashboard-card-value" id="total-products">0</div>
                                <div class="dashboard-card-change positive" id="products-change">
                                    <span>+0% desde ayer</span>
                                </div>
                            </div>
                            
                            <div class="dashboard-card">
                                <div class="dashboard-card-title">Stock Disponible</div>
                                <div class="dashboard-card-value" id="total-stock">0</div>
                                <div class="dashboard-card-change negative" id="stock-change">
                                    <span>-0% desde ayer</span>
                                </div>
                            </div>
                            
                            <div class="dashboard-card">
                                <div class="dashboard-card-title">Valor Total</div>
                                <div class="dashboard-card-value" id="total-value">$0</div>
                                <div class="dashboard-card-change positive" id="value-change">
                                    <span>+0% desde ayer</span>
                                </div>
                            </div>
                            
                            <div class="dashboard-card">
                                <div class="dashboard-card-title">Productos Bajos</div>
                                <div class="dashboard-card-value" id="low-stock">0</div>
                                <div class="dashboard-card-change negative" id="low-stock-change">
                                    <span>+0 desde ayer</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row mt-5">
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-header">
                                        <div class="card-title">Productos con Stock Bajo</div>
                                    </div>
                                    <div class="card-body">
                                        <div id="low-stock-list">
                                            <p class="text-center text-secondary">Cargando productos...</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-header">
                                        <div class="card-title">Acciones Rápidas</div>
                                    </div>
                                    <div class="card-body">
                                        <div class="d-grid gap-3">
                                            <button class="btn btn-primary" id="scan-qr-btn">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="mr-2">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
                                                </svg>
                                                Escanear Código QR
                                            </button>
                                            <button class="btn btn-success" id="add-product-btn">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="mr-2">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                                </svg>
                                                Agregar Nuevo Producto
                                            </button>
                                            <button class="btn btn-outline" id="generate-report-btn">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="mr-2">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                                </svg>
                                                Generar Reporte
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
                
                <footer class="app-footer">
                    <div class="container">
                        <div class="footer-content">
                            <div class="footer-section">
                                <h3>Sistema de Inventario QR</h3>
                                <p>Sistema profesional de gestión de inventario con códigos QR</p>
                            </div>
                            <div class="footer-section">
                                <h3>Enlaces Rápidos</h3>
                                <ul>
                                    <li><a href="#" data-route="/">Dashboard</a></li>
                                    <li><a href="#" data-route="/products">Productos</a></li>
                                    <li><a href="#" data-route="/inventory">Inventario</a></li>
                                </ul>
                            </div>
                            <div class="footer-section">
                                <h3>Contacto</h3>
                                <ul>
                                    <li>support@inventario-qr.com</li>
                                    <li>+1 (555) 123-4567</li>
                                </ul>
                            </div>
                        </div>
                        <div class="copyright">
                            <p>© 2024 Sistema de Inventario QR. Todos los derechos reservados.</p>
                            <p>Versión ${window.APP_CONFIG?.version || '1.0.0'}</p>
                        </div>
                    </div>
                </footer>
            </div>
        `;
    }
    
    function getProductsTemplate() {
        return `
            <div class="app-container">
                <header class="app-header">
                    <!-- Mismo header que dashboard -->
                </header>
                
                <main class="main-content">
                    <div class="container">
                        <div class="d-flex justify-between align-center mb-4">
                            <div>
                                <h1 class="mb-1">Productos</h1>
                                <p class="text-secondary">Gestión de productos del inventario</p>
                            </div>
                            <button class="btn btn-primary" id="new-product-btn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="mr-2">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                </svg>
                                Nuevo Producto
                            </button>
                        </div>
                        
                        <div class="card mb-4">
                            <div class="card-header">
                                <div class="card-title">Filtros de Búsqueda</div>
                            </div>
                            <div class="card-body">
                                <div class="row g-3">
                                    <div class="col-md-4">
                                        <input type="text" class="form-control" id="search-input" placeholder="Buscar productos...">
                                    </div>
                                    <div class="col-md-3">
                                        <select class="form-control" id="category-filter">
                                            <option value="">Todas las categorías</option>
                                            <option value="electronics">Electrónica</option>
                                            <option value="office">Oficina</option>
                                            <option value="tools">Herramientas</option>
                                        </select>
                                    </div>
                                    <div class="col-md-3">
                                        <select class="form-control" id="stock-filter">
                                            <option value="">Todo el stock</option>
                                            <option value="high">Stock Alto</option>
                                            <option value="medium">Stock Medio</option>
                                            <option value="low">Stock Bajo</option>
                                        </select>
                                    </div>
                                    <div class="col-md-2">
                                        <button class="btn btn-primary w-100" id="apply-filters-btn">Aplicar</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-header">
                                <div class="card-title">Lista de Productos</div>
                                <div class="d-flex gap-2">
                                    <button class="btn btn-sm btn-outline" id="export-csv-btn">
                                        Exportar CSV
                                    </button>
                                    <button class="btn btn-sm btn-outline" id="refresh-products-btn">
                                        Actualizar
                                    </button>
                                </div>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table" id="products-table">
                                        <thead>
                                            <tr>
                                                <th>Código</th>
                                                <th>Nombre</th>
                                                <th>Categoría</th>
                                                <th>Stock</th>
                                                <th>Precio</th>
                                                <th>Estado</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody id="products-table-body">
                                            <tr>
                                                <td colspan="7" class="text-center text-secondary">
                                                    Cargando productos...
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div class="d-flex justify-between align-center mt-4">
                                    <div class="text-secondary" id="products-count">
                                        Mostrando 0 productos
                                    </div>
                                    <div class="pagination" id="products-pagination">
                                        <!-- Paginación será generada dinámicamente -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
                
                <footer class="app-footer">
                    <!-- Mismo footer que dashboard -->
                </footer>
            </div>
        `;
    }
    
    function getProductFormTemplate() {
        return `
            <div class="app-container">
                <header class="app-header">
                    <!-- Mismo header que dashboard -->
                </header>
                
                <main class="main-content">
                    <div class="container">
                        <div class="mb-4">
                            <a href="#" class="text-primary" data-route="/products">
                                ← Volver a Productos
                            </a>
                        </div>
                        
                        <div class="card">
                            <div class="card-header">
                                <div class="card-title">Nuevo Producto</div>
                            </div>
                            <div class="card-body">
                                <form id="product-form">
                                    <div class="row mb-3">
                                        <div class="col-md-6">
                                            <div class="form-group">
                                                <label for="product-name" class="form-label">Nombre del Producto *</label>
                                                <input type="text" class="form-control" id="product-name" required>
                                                <div class="invalid-feedback">El nombre del producto es requerido</div>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="form-group">
                                                <label for="product-code" class="form-label">Código del Producto</label>
                                                <input type="text" class="form-control" id="product-code" placeholder="Generado automáticamente">
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="row mb-3">
                                        <div class="col-md-6">
                                            <div class="form-group">
                                                <label for="product-category" class="form-label">Categoría *</label>
                                                <select class="form-control" id="product-category" required>
                                                    <option value="">Seleccionar categoría</option>
                                                    <option value="electronics">Electrónica</option>
                                                    <option value="office">Oficina</option>
                                                    <option value="tools">Herramientas</option>
                                                    <option value="furniture">Mobiliario</option>
                                                    <option value="supplies">Suministros</option>
                                                </select>
                                                <div class="invalid-feedback">La categoría es requerida</div>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="form-group">
                                                <label for="product-brand" class="form-label">Marca</label>
                                                <input type="text" class="form-control" id="product-brand">
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="row mb-3">
                                        <div class="col-md-4">
                                            <div class="form-group">
                                                <label for="product-price" class="form-label">Precio *</label>
                                                <div class="input-group">
                                                    <span class="input-group-text">$</span>
                                                    <input type="number" class="form-control" id="product-price" step="0.01" min="0" required>
                                                </div>
                                                <div class="invalid-feedback">El precio es requerido</div>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="form-group">
                                                <label for="product-stock" class="form-label">Stock Inicial *</label>
                                                <input type="number" class="form-control" id="product-stock" min="0" required>
                                                <div class="invalid-feedback">El stock inicial es requerido</div>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="form-group">
                                                <label for="product-min-stock" class="form-label">Stock Mínimo *</label>
                                                <input type="number" class="form-control" id="product-min-stock" min="0" required>
                                                <div class="invalid-feedback">El stock mínimo es requerido</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="row mb-3">
                                        <div class="col-md-6">
                                            <div class="form-group">
                                                <label for="product-supplier" class="form-label">Proveedor</label>
                                                <input type="text" class="form-control" id="product-supplier">
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="form-group">
                                                <label for="product-location" class="form-label">Ubicación en Almacén</label>
                                                <input type="text" class="form-control" id="product-location">
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <div class="form-group">
                                            <label for="product-description" class="form-label">Descripción</label>
                                            <textarea class="form-control" id="product-description" rows="3"></textarea>
                                        </div>
                                    </div>
                                    
                                    <div class="mb-4">
                                        <div class="form-group">
                                            <label class="form-label">Imagen del Producto</label>
                                            <div class="border rounded p-3 text-center">
                                                <div id="image-preview" class="mb-3">
                                                    <div class="text-secondary">No hay imagen seleccionada</div>
                                                </div>
                                                <input type="file" class="form-control" id="product-image" accept="image/*">
                                                <small class="text-secondary">Formatos aceptados: JPG, PNG, GIF, WEBP (Max. 10MB)</small>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="form-actions">
                                        <button type="button" class="btn btn-outline" id="cancel-btn">Cancelar</button>
                                        <button type="submit" class="btn btn-primary" id="save-btn">
                                            <span id="save-btn-text">Guardar Producto</span>
                                            <span id="save-btn-spinner" class="d-none">
                                                <span class="spinner-border spinner-border-sm" role="status"></span>
                                                Guardando...
                                            </span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </main>
                
                <footer class="app-footer">
                    <!-- Mismo footer que dashboard -->
                </footer>
            </div>
        `;
    }
    
    // Templates para otras rutas (simplificados por brevedad)
    function getInventoryTemplate() {
        return `<div class="app-container">Inventario</div>`;
    }
    
    function getScannerTemplate() {
        return `<div class="app-container">Escáner QR</div>`;
    }
    
    function getReportsTemplate() {
        return `<div class="app-container">Reportes</div>`;
    }
    
    function getSettingsTemplate() {
        return `<div class="app-container">Configuración</div>`;
    }
    
    function getProfileTemplate() {
        return `<div class="app-container">Perfil</div>`;
    }
    
    function getNotFoundTemplate() {
        return `
            <div class="app-container">
                <div class="container text-center py-5">
                    <h1 class="display-1 text-muted">404</h1>
                    <h2 class="mb-4">Página no encontrada</h2>
                    <p class="lead mb-4">La página que buscas no existe o ha sido movida.</p>
                    <a href="#" class="btn btn-primary" data-route="/">Volver al Dashboard</a>
                </div>
            </div>
        `;
    }
    
    // =============== INICIALIZACIÓN DE COMPONENTES ===============
    
    function initializeRouteComponents(path) {
        // Inicializar componentes comunes
        initializeCommonComponents();
        
        // Inicializar componentes específicos de la ruta
        switch(path) {
            case '/':
                initializeDashboardComponents();
                break;
            case '/products':
                initializeProductsComponents();
                break;
            case '/products/new':
                initializeProductFormComponents();
                break;
        }
    }
    
    function initializeCommonComponents() {
        // Navegación
        document.querySelectorAll('[data-route]').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const route = this.getAttribute('data-route');
                navigateTo(route);
            });
        });
        
        // Menú de usuario
        const userMenuBtn = document.getElementById('user-menu-btn');
        if (userMenuBtn) {
            userMenuBtn.addEventListener('click', function() {
                navigateTo('/profile');
            });
        }
        
        // Manejar botón de retroceso/avance del navegador
        window.addEventListener('popstate', function(event) {
            if (event.state && event.state.path) {
                loadRouteContent(event.state.path);
            }
        });
    }
    
    function initializeDashboardComponents() {
        // Cargar datos del dashboard
        loadDashboardData();
        
        // Botones de acciones rápidas
        const scanQrBtn = document.getElementById('scan-qr-btn');
        if (scanQrBtn) {
            scanQrBtn.addEventListener('click', function() {
                navigateTo('/scanner');
            });
        }
        
        const addProductBtn = document.getElementById('add-product-btn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', function() {
                navigateTo('/products/new');
            });
        }
        
        const generateReportBtn = document.getElementById('generate-report-btn');
        if (generateReportBtn) {
            generateReportBtn.addEventListener('click', function() {
                navigateTo('/reports');
            });
        }
    }
    
    function initializeProductsComponents() {
        // Cargar lista de productos
        loadProductsList();
        
        // Botón para nuevo producto
        const newProductBtn = document.getElementById('new-product-btn');
        if (newProductBtn) {
            newProductBtn.addEventListener('click', function() {
                navigateTo('/products/new');
            });
        }
        
        // Filtros de búsqueda
        const applyFiltersBtn = document.getElementById('apply-filters-btn');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', function() {
                applyProductFilters();
            });
        }
        
        // Botón de exportar CSV
        const exportCsvBtn = document.getElementById('export-csv-btn');
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', function() {
                exportProductsToCSV();
            });
        }
        
        // Botón de actualizar
        const refreshBtn = document.getElementById('refresh-products-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                loadProductsList();
            });
        }
    }
    
    function initializeProductFormComponents() {
        const form = document.getElementById('product-form');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                saveProduct();
            });
        }
        
        const cancelBtn = document.getElementById('cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                if (window.confirm('¿Seguro que quieres cancelar? Los cambios no guardados se perderán.')) {
                    navigateTo('/products');
                }
            });
        }
        
        // Generar código automático si está vacío
        const productCodeInput = document.getElementById('product-code');
        if (productCodeInput) {
            productCodeInput.addEventListener('focus', function() {
                if (!this.value) {
                    this.value = 'PROD-' + Date.now().toString().slice(-6);
                }
            });
        }
        
        // Previsualización de imagen
        const imageInput = document.getElementById('product-image');
        if (imageInput) {
            imageInput.addEventListener('change', function(e) {
                previewImage(e.target.files[0]);
            });
        }
    }
    
    // =============== FUNCIONES DE DATOS ===============
    
    async function loadDashboardData() {
        try {
            // Simular carga de datos
            const mockData = {
                totalProducts: 145,
                totalStock: 1250,
                totalValue: 45250.75,
                lowStock: 12,
                lowStockList: [
                    { name: 'Laptop Dell XPS 13', stock: 2, minStock: 5 },
                    { name: 'Mouse Inalámbrico Logitech', stock: 3, minStock: 10 },
                    { name: 'Teclado Mecánico Redragon', stock: 4, minStock: 8 }
                ]
            };
            
            // Actualizar UI
            updateDashboardUI(mockData);
            
        } catch (error) {
            console.error('Error cargando datos del dashboard:', error);
            window.showNotification('error', 'Error al cargar los datos del dashboard');
        }
    }
    
    function updateDashboardUI(data) {
        const totalProducts = document.getElementById('total-products');
        const totalStock = document.getElementById('total-stock');
        const totalValue = document.getElementById('total-value');
        const lowStock = document.getElementById('low-stock');
        const lowStockList = document.getElementById('low-stock-list');
        
        if (totalProducts) totalProducts.textContent = data.totalProducts;
        if (totalStock) totalStock.textContent = data.totalStock;
        if (totalValue) totalValue.textContent = `$${data.totalValue.toLocaleString()}`;
        if (lowStock) lowStock.textContent = data.lowStock;
        
        if (lowStockList && data.lowStockList.length > 0) {
            lowStockList.innerHTML = data.lowStockList.map(item => `
                <div class="alert alert-warning mb-2">
                    <div class="d-flex justify-between align-center">
                        <div>
                            <strong>${item.name}</strong>
                            <div class="small">Stock: ${item.stock} / Mínimo: ${item.minStock}</div>
                        </div>
                        <button class="btn btn-sm btn-outline" onclick="reorderProduct('${item.name}')">
                            Reabastecer
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }
    
    async function loadProductsList() {
        try {
            // Simular carga de productos
            const mockProducts = Array.from({ length: 15 }, (_, i) => ({
                id: i + 1,
                code: `PROD-${1000 + i}`,
                name: `Producto ${i + 1}`,
                category: ['electronics', 'office', 'tools'][i % 3],
                stock: Math.floor(Math.random() * 100),
                price: (Math.random() * 1000 + 10).toFixed(2),
                status: ['active', 'inactive', 'discontinued'][i % 3]
            }));
            
            updateProductsTable(mockProducts);
            
        } catch (error) {
            console.error('Error cargando productos:', error);
            window.showNotification('error', 'Error al cargar la lista de productos');
        }
    }
    
    function updateProductsTable(products) {
        const tbody = document.getElementById('products-table-body');
        const countElement = document.getElementById('products-count');
        
        if (tbody) {
            tbody.innerHTML = products.map(product => `
                <tr>
                    <td><code>${product.code}</code></td>
                    <td>${product.name}</td>
                    <td>
                        <span class="badge ${getCategoryBadgeClass(product.category)}">
                            ${getCategoryLabel(product.category)}
                        </span>
                    </td>
                    <td>
                        <span class="stock-badge ${getStockLevelClass(product.stock)}">
                            ${product.stock}
                        </span>
                    </td>
                    <td>$${parseFloat(product.price).toLocaleString()}</td>
                    <td>
                        <span class="badge ${getStatusBadgeClass(product.status)}">
                            ${getStatusLabel(product.status)}
                        </span>
                    </td>
                    <td>
                        <div class="d-flex gap-1">
                            <button class="btn btn-sm btn-outline" onclick="viewProduct(${product.id})">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                </svg>
                            </button>
                            <button class="btn btn-sm btn-outline" onclick="editProduct(${product.id})">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                </svg>
                            </button>
                            <button class="btn btn-sm btn-outline text-danger" onclick="deleteProduct(${product.id})">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
        
        if (countElement) {
            countElement.textContent = `Mostrando ${products.length} productos`;
        }
    }
    
    async function saveProduct() {
        const form = document.getElementById('product-form');
        const saveBtn = document.getElementById('save-btn');
        const saveBtnText = document.getElementById('save-btn-text');
        const saveBtnSpinner = document.getElementById('save-btn-spinner');
        
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }
        
        try {
            // Mostrar indicador de carga
            saveBtn.disabled = true;
            saveBtnText.classList.add('d-none');
            saveBtnSpinner.classList.remove('d-none');
            
            // Obtener datos del formulario
            const formData = {
                name: document.getElementById('product-name').value,
                code: document.getElementById('product-code').value,
                category: document.getElementById('product-category').value,
                brand: document.getElementById('product-brand').value,
                price: parseFloat(document.getElementById('product-price').value),
                stock: parseInt(document.getElementById('product-stock').value),
                minStock: parseInt(document.getElementById('product-min-stock').value),
                supplier: document.getElementById('product-supplier').value,
                location: document.getElementById('product-location').value,
                description: document.getElementById('product-description').value
            };
            
            // Simular guardado
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Éxito
            window.showNotification('success', 'Producto guardado exitosamente');
            
            // Redirigir a lista de productos
            setTimeout(() => {
                navigateTo('/products');
            }, 1000);
            
        } catch (error) {
            console.error('Error guardando producto:', error);
            window.showNotification('error', 'Error al guardar el producto');
            
            // Restaurar botón
            saveBtn.disabled = false;
            saveBtnText.classList.remove('d-none');
            saveBtnSpinner.classList.add('d-none');
        }
    }
    
    // =============== FUNCIONES AUXILIARES ===============
    
    function getCategoryLabel(category) {
        const labels = {
            'electronics': 'Electrónica',
            'office': 'Oficina',
            'tools': 'Herramientas',
            'furniture': 'Mobiliario',
            'supplies': 'Suministros'
        };
        return labels[category] || category;
    }
    
    function getCategoryBadgeClass(category) {
        const classes = {
            'electronics': 'badge-primary',
            'office': 'badge-secondary',
            'tools': 'badge-success',
            'furniture': 'badge-warning',
            'supplies': 'badge-info'
        };
        return classes[category] || 'badge-secondary';
    }
    
    function getStockLevelClass(stock) {
        if (stock > 50) return 'high';
        if (stock > 10) return 'medium';
        return 'low';
    }
    
    function getStatusLabel(status) {
        const labels = {
            'active': 'Activo',
            'inactive': 'Inactivo',
            'discontinued': 'Descontinuado'
        };
        return labels[status] || status;
    }
    
    function getStatusBadgeClass(status) {
        const classes = {
            'active': 'badge-success',
            'inactive': 'badge-secondary',
            'discontinued': 'badge-danger'
        };
        return classes[status] || 'badge-secondary';
    }
    
    function previewImage(file) {
        const preview = document.getElementById('image-preview');
        
        if (!file) {
            preview.innerHTML = '<div class="text-secondary">No hay imagen seleccionada</div>';
            return;
        }
        
        if (!file.type.match('image.*')) {
            window.showNotification('error', 'Por favor, selecciona un archivo de imagen');
            return;
        }
        
        if (file.size > window.APP_CONFIG?.upload?.maxFileSize || 10 * 1024 * 1024) {
            window.showNotification('error', 'La imagen es demasiado grande. Máximo 10MB');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Vista previa" class="img-fluid rounded" style="max-height: 200px;">
                <div class="mt-2 small text-secondary">${file.name} (${(file.size / 1024).toFixed(2)} KB)</div>
            `;
        };
        reader.readAsDataURL(file);
    }
    
    function applyProductFilters() {
        // Implementar lógica de filtrado
        window.showNotification('info', 'Filtros aplicados');
    }
    
    function exportProductsToCSV() {
        // Simular exportación
        window.showNotification('success', 'Exportando productos a CSV...');
        
        setTimeout(() => {
            const mockData = [
                { Código: 'PROD-1001', Nombre: 'Producto 1', Categoría: 'Electrónica', Stock: 45, Precio: 99.99 },
                { Código: 'PROD-1002', Nombre: 'Producto 2', Categoría: 'Oficina', Stock: 23, Precio: 49.99 }
            ];
            
            window.exportToCSV(mockData, 'productos_inventario.csv');
        }, 1000);
    }
    
    // =============== FUNCIONES GLOBALES PARA BOTONES ===============
    
    window.viewProduct = function(id) {
        window.showNotification('info', `Viendo producto #${id}`);
        navigateTo(`/products/${id}`);
    };
    
    window.editProduct = function(id) {
        window.showNotification('info', `Editando producto #${id}`);
        navigateTo(`/products/${id}/edit`);
    };
    
    window.deleteProduct = function(id) {
        if (window.confirm('¿Estás seguro de eliminar este producto?')) {
            window.showNotification('success', `Producto #${id} eliminado`);
            // Recargar lista
            loadProductsList();
        }
    };
    
    window.reorderProduct = function(name) {
        window.showNotification('info', `Solicitando reabastecimiento para: ${name}`);
    };
    
    // =============== INICIALIZACIÓN DE LA APLICACIÓN ===============
    
    /**
     * Inicializa la aplicación cuando el DOM está listo
     */
    function initialize() {
        console.log('🚀 Inicializando Sistema de Inventario QR');
        
        // Verificar si la configuración está disponible
        if (!window.APP_CONFIG) {
            console.error('Configuración de la aplicación no encontrada');
            showLoadingError('Error en la configuración de la aplicación');
            return;
        }
        
        // Cargar la ruta actual
        const initialPath = window.location.pathname || '/';
        loadRouteContent(initialPath);
        
        // Registrar event listeners
        window.addEventListener('app-loaded', function() {
            console.log('✅ Aplicación cargada correctamente');
            window.hideAppLoading();
        });
        
        // Configurar tiempo de carga máxima
        setTimeout(() => {
            const appLoading = document.getElementById('app-loading');
            if (appLoading && appLoading.style.display !== 'none') {
                console.warn('⚠️ La aplicación está tardando más de lo esperado');
            }
        }, 10000);
    }
    
    // Iniciar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
})();