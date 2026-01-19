/**
 * Lógica específica para el dashboard
 */

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    checkAuth();
    
    // Cargar componentes
    loadComponents();
    
    // Cargar datos del dashboard
    loadDashboardData();
    
    // Configurar eventos
    setupEventListeners();
    
    // Inicializar gráficos
    initializeCharts();
});

async function loadDashboardData() {
    showMiniLoading();
    
    try {
        // Cargar estadísticas
        await loadStats();
        
        // Cargar productos con bajo stock
        await loadLowStockProducts();
        
        // Cargar últimos movimientos
        await loadRecentMovements();
        
        // Cargar datos para gráficos
        await loadChartData();
        
    } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        showNotification('Error al cargar los datos del dashboard', 'error');
    } finally {
        hideMiniLoading();
    }
}

async function loadStats() {
    try {
        // Cargar productos
        const products = await getProducts({ limit: 1 });
        document.getElementById('totalProducts').textContent = formatNumber(products.total || 0);
        
        // Cargar categorías
        const categories = await getCategories({ limit: 1 });
        document.getElementById('totalCategories').textContent = formatNumber(categories.total || 0);
        
        // Cargar ubicaciones
        const locations = await getLocations({ limit: 1 });
        document.getElementById('totalLocations').textContent = formatNumber(locations.total || 0);
        
        // Cargar movimientos de hoy
        const today = new Date().toISOString().split('T')[0];
        const movements = await getMovements({ 
            date_from: today, 
            date_to: today,
            limit: 1 
        });
        document.getElementById('totalMovements').textContent = formatNumber(movements.total || 0);
        
    } catch (error) {
        handleApiError(error);
    }
}

async function loadLowStockProducts() {
    try {
        const products = await getLowStockProducts({ limit: 5 });
        
        const container = document.getElementById('lowStockTable');
        if (!container) return;
        
        if (!products.data || products.data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>✅ Todos los productos tienen stock suficiente</p>
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="table-responsive">
                <table class="mini-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Stock</th>
                            <th>Mínimo</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        products.data.forEach(product => {
            const stockPercent = (product.stock / product.min_stock) * 100;
            let statusClass = 'success';
            let statusText = 'Normal';
            
            if (product.stock === 0) {
                statusClass = 'danger';
                statusText = 'Agotado';
            } else if (stockPercent <= 20) {
                statusClass = 'danger';
                statusText = 'Muy bajo';
            } else if (stockPercent <= 50) {
                statusClass = 'warning';
                statusText = 'Bajo';
            }
            
            html += `
                <tr>
                    <td>
                        <strong>${product.name}</strong>
                        <small class="text-muted">${product.code}</small>
                    </td>
                    <td>${formatNumber(product.stock)}</td>
                    <td>${formatNumber(product.min_stock)}</td>
                    <td>
                        <span class="badge badge-${statusClass}">${statusText}</span>
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error al cargar productos con bajo stock:', error);
        const container = document.getElementById('lowStockTable');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <p>Error al cargar los productos</p>
                </div>
            `;
        }
    }
}

async function loadRecentMovements() {
    try {
        const movements = await getMovements({ 
            limit: 5,
            sort_by: 'date',
            sort_order: 'desc'
        });
        
        const container = document.getElementById('recentMovements');
        if (!container) return;
        
        if (!movements.data || movements.data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No hay movimientos recientes</p>
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="movements-list">
        `;
        
        movements.data.forEach(movement => {
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
                <div class="movement-item">
                    <div class="movement-icon">
                        ${icon}
                    </div>
                    <div class="movement-content">
                        <div class="movement-header">
                            <strong>${movement.product?.name || 'Producto no encontrado'}</strong>
                            <span class="badge badge-${typeClass}">${capitalize(movement.type)}</span>
                        </div>
                        <div class="movement-details">
                            <span>Cantidad: ${formatNumber(movement.quantity)}</span>
                            <span class="text-muted">${formatDate(movement.date, 'time')}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error al cargar movimientos recientes:', error);
        const container = document.getElementById('recentMovements');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <p>Error al cargar los movimientos</p>
                </div>
            `;
        }
    }
}

async function loadChartData() {
    try {
        // Obtener estadísticas de movimientos de la última semana
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const movements = await getMovements({
            date_from: oneWeekAgo.toISOString().split('T')[0],
            limit: 100
        });
        
        if (movements.data && movements.data.length > 0) {
            // Agrupar por producto
            const productMovements = {};
            movements.data.forEach(movement => {
                if (movement.product) {
                    if (!productMovements[movement.product.id]) {
                        productMovements[movement.product.id] = {
                            name: movement.product.name,
                            total: 0
                        };
                    }
                    productMovements[movement.product.id].total += Math.abs(movement.quantity);
                }
            });
            
            // Ordenar por total y tomar los primeros 10
            const topProducts = Object.values(productMovements)
                .sort((a, b) => b.total - a.total)
                .slice(0, 10);
            
            // Actualizar gráfico si existe
            const ctx = document.getElementById('movementChart');
            if (ctx) {
                updateMovementChart(topProducts);
            }
        }
        
    } catch (error) {
        console.error('Error al cargar datos para gráficos:', error);
    }
}

function initializeCharts() {
    // Inicializar gráficos vacíos
    const ctx = document.getElementById('movementChart');
    if (ctx) {
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Movimientos',
                    data: [],
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Cantidad'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Productos'
                        }
                    }
                }
            }
        });
        
        window.movementChart = chart;
    }
}

function updateMovementChart(products) {
    if (!window.movementChart || !products || products.length === 0) return;
    
    const labels = products.map(p => truncateText(p.name, 15));
    const data = products.map(p => p.total);
    
    window.movementChart.data.labels = labels;
    window.movementChart.data.datasets[0].data = data;
    window.movementChart.update();
}

function loadComponents() {
    // Cargar componentes comunes
    loadComponent('navbar', 'navbar-container');
    loadComponent('sidebar', 'sidebar-container');
    loadComponent('footer', 'footer-container');
}

async function loadComponent(componentName, containerId) {
    try {
        const response = await fetch(`components/${componentName}.html`);
        const html = await response.text();
        
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = html;
            
            // Inicializar eventos específicos del componente
            if (componentName === 'navbar') {
                initNavbarEvents();
            } else if (componentName === 'sidebar') {
                initSidebarEvents();
            }
        }
    } catch (error) {
        console.error(`Error al cargar componente ${componentName}:`, error);
    }
}

function initNavbarEvents() {
    // Busqueda global
    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleGlobalSearch, 300));
    }
    
    // Notificaciones
    const notificationsBtn = document.getElementById('notificationsBtn');
    if (notificationsBtn) {
        notificationsBtn.addEventListener('click', toggleNotifications);
    }
    
    // Menú de usuario
    const userMenuBtn = document.getElementById('userMenuBtn');
    if (userMenuBtn) {
        userMenuBtn.addEventListener('click', toggleUserMenu);
    }
}

function initSidebarEvents() {
    // Toggle sidebar
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarClose = document.getElementById('sidebarClose');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    if (sidebarClose) {
        sidebarClose.addEventListener('click', toggleSidebar);
    }
    
    // Cerrar sidebar al hacer clic fuera en móviles
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            const sidebar = document.querySelector('.sidebar');
            const toggle = document.getElementById('sidebarToggle');
            
            if (sidebar && sidebar.classList.contains('open') && 
                !sidebar.contains(e.target) && 
                (!toggle || !toggle.contains(e.target))) {
                sidebar.classList.remove('open');
            }
        }
    });
}

function setupEventListeners() {
    // Recargar datos cuando se hace clic en el logo
    const logo = document.querySelector('.navbar-logo');
    if (logo) {
        logo.addEventListener('click', function(e) {
            e.preventDefault();
            loadDashboardData();
        });
    }
    
    // Actualizar datos cada 5 minutos
    setInterval(loadDashboardData, 5 * 60 * 1000);
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

function toggleUserMenu() {
    const menu = document.getElementById('userDropdown');
    if (menu) {
        menu.classList.toggle('show');
    }
}

function toggleNotifications() {
    // Implementar lógica de notificaciones
    showNotification('Funcionalidad de notificaciones en desarrollo', 'info');
}

async function handleGlobalSearch(query) {
    if (!query || query.length < 2) return;
    
    try {
        const results = await searchProducts(query, { limit: 10 });
        
        // Mostrar resultados en un dropdown
        showSearchResults(results.data);
        
    } catch (error) {
        console.error('Error en búsqueda global:', error);
    }
}

function showSearchResults(results) {
    // Implementar dropdown de resultados
    console.log('Resultados de búsqueda:', results);
}