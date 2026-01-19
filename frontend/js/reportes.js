/**
 * Lógica específica para reportes y estadísticas
 */

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación y permisos
    checkAuth();
    if (!hasPermission('view_reports')) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Cargar componentes
    loadComponents();
    
    // Inicializar variables
    let currentReportType = 'inventory';
    let currentReportData = null;
    let charts = {};
    
    // Cargar datos iniciales
    loadReportStats();
    initializeCharts();
    
    // Configurar eventos
    setupEventListeners();
});

async function loadReportStats() {
    try {
        // Cargar estadísticas generales
        const products = await getProducts({ limit: 1 });
        document.getElementById('reportTotalProducts').textContent = formatNumber(products.total || 0);
        
        const lowStock = await getLowStockProducts({ limit: 1 });
        document.getElementById('reportLowStock').textContent = formatNumber(lowStock.total || 0);
        
        // Cargar valor total del inventario (requiere precios)
        const inventoryReport = await getInventoryReport({ limit: 1 });
        const totalValue = inventoryReport.data?.reduce((sum, item) => sum + (item.price * item.stock || 0), 0) || 0;
        document.getElementById('reportTotalValue').textContent = formatCurrency(totalValue);
        
        // Cargar movimientos de hoy
        const today = new Date().toISOString().split('T')[0];
        const movements = await getMovements({ 
            date_from: today, 
            date_to: today,
            limit: 1 
        });
        document.getElementById('reportMovementsToday').textContent = formatNumber(movements.total || 0);
        
        // Cargar estadísticas de stock
        updateStockStats(inventoryReport.data || []);
        
        // Cargar datos para gráficos
        loadChartData();
        
    } catch (error) {
        console.error('Error al cargar estadísticas de reportes:', error);
        showNotification('Error al cargar estadísticas', 'error');
    }
}

function updateStockStats(products) {
    if (!products || products.length === 0) {
        document.getElementById('optimalStock').textContent = '0';
        document.getElementById('lowStockCount').textContent = '0';
        document.getElementById('outOfStock').textContent = '0';
        document.getElementById('avgStock').textContent = '0';
        return;
    }
    
    let optimalCount = 0;
    let lowCount = 0;
    let outCount = 0;
    let totalStock = 0;
    
    products.forEach(product => {
        totalStock += product.stock || 0;
        
        if (product.stock === 0) {
            outCount++;
        } else if (product.min_stock > 0 && product.stock <= product.min_stock) {
            lowCount++;
        } else {
            optimalCount++;
        }
    });
    
    document.getElementById('optimalStock').textContent = formatNumber(optimalCount);
    document.getElementById('lowStockCount').textContent = formatNumber(lowCount);
    document.getElementById('outOfStock').textContent = formatNumber(outCount);
    document.getElementById('avgStock').textContent = formatNumber(Math.round(totalStock / products.length));
}

function initializeCharts() {
    // Gráfico de categorías
    const categoryCtx = document.getElementById('categoryChart');
    if (categoryCtx) {
        charts.category = new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                        '#9966FF', '#FF9F40', '#8AC926', '#1982C4',
                        '#6A4C93', '#F15BB5'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }
    
    // Gráfico de movimientos mensuales
    const movementCtx = document.getElementById('movementChart');
    if (movementCtx) {
        charts.movement = new Chart(movementCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Entradas',
                        data: [],
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        tension: 0.1
                    },
                    {
                        label: 'Salidas',
                        data: [],
                        borderColor: '#F44336',
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    // Gráfico de top productos
    const topProductsCtx = document.getElementById('topProductsChart');
    if (topProductsCtx) {
        charts.topProducts = new Chart(topProductsCtx, {
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
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

async function loadChartData() {
    try {
        // Cargar datos para gráfico de categorías
        const categoriesReport = await getCategoriesReport();
        updateCategoryChart(categoriesReport.data || []);
        
        // Cargar datos para gráfico de movimientos mensuales
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const movementsReport = await getMovementsReport({
            date_from: sixMonthsAgo.toISOString().split('T')[0]
        });
        
        updateMovementChart(movementsReport.data || []);
        
        // Cargar datos para gráfico de top productos
        const topProducts = await getMovements({
            limit: 10,
            group_by: 'product_id',
            sort_by: 'total_movements',
            sort_order: 'desc'
        });
        
        updateTopProductsChart(topProducts.data || []);
        
    } catch (error) {
        console.error('Error al cargar datos para gráficos:', error);
    }
}

function updateCategoryChart(categories) {
    if (!charts.category || !categories || categories.length === 0) return;
    
    const labels = categories.map(c => c.name || 'Sin categoría');
    const data = categories.map(c => c.product_count || 0);
    
    charts.category.data.labels = labels;
    charts.category.data.datasets[0].data = data;
    charts.category.update();
}

function updateMovementChart(movements) {
    if (!charts.movement || !movements || movements.length === 0) return;
    
    // Agrupar por mes
    const monthlyData = {};
    const now = new Date();
    
    // Inicializar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
        monthlyData[key] = { entradas: 0, salidas: 0 };
    }
    
    // Procesar movimientos
    movements.forEach(movement => {
        const date = new Date(movement.date);
        const key = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
        
        if (monthlyData[key]) {
            if (movement.type === 'entrada') {
                monthlyData[key].entradas += Math.abs(movement.quantity);
            } else if (movement.type === 'salida') {
                monthlyData[key].salidas += Math.abs(movement.quantity);
            }
        }
    });
    
    const labels = Object.keys(monthlyData);
    const entradaData = labels.map(key => monthlyData[key].entradas);
    const salidaData = labels.map(key => monthlyData[key].salidas);
    
    charts.movement.data.labels = labels;
    charts.movement.data.datasets[0].data = entradaData;
    charts.movement.data.datasets[1].data = salidaData;
    charts.movement.update();
}

function updateTopProductsChart(products) {
    if (!charts.topProducts || !products || products.length === 0) return;
    
    const labels = products.map(p => truncateText(p.product?.name || 'Producto', 15));
    const data = products.map(p => p.total_movements || 0);
    
    charts.topProducts.data.labels = labels;
    charts.topProducts.data.datasets[0].data = data;
    charts.topProducts.update();
}

function setupEventListeners() {
    // Botón generar reporte
    const generateReportBtn = document.getElementById('generateReportBtn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', generateReport);
    }
    
    // Botón exportar datos
    const exportReportBtn = document.getElementById('exportReportBtn');
    if (exportReportBtn) {
        exportReportBtn.addEventListener('click', showExportModal);
    }
    
    // Tipo de reporte
    const reportType = document.getElementById('reportType');
    if (reportType) {
        reportType.addEventListener('change', updateReportType);
    }
    
    // Período del reporte
    const reportPeriod = document.getElementById('reportPeriod');
    if (reportPeriod) {
        reportPeriod.addEventListener('change', updatePeriod);
    }
    
    // Botón ejecutar reporte
    const runReportBtn = document.getElementById('runReportBtn');
    if (runReportBtn) {
        runReportBtn.addEventListener('click', executeReport);
    }
    
    // Botón confirmar exportación
    const confirmExportBtn = document.getElementById('confirmExportBtn');
    if (confirmExportBtn) {
        confirmExportBtn.addEventListener('click', exportData);
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

function updateReportType() {
    const reportType = document.getElementById('reportType').value;
    currentReportType = reportType;
    
    // Actualizar título de la tabla
    const tableTitle = document.getElementById('reportTableTitle');
    if (tableTitle) {
        const titles = {
            'inventory': 'Reporte de Inventario Actual',
            'movements': 'Reporte de Movimientos',
            'low_stock': 'Reporte de Bajo Stock',
            'categories': 'Reporte por Categorías',
            'locations': 'Reporte por Ubicaciones',
            'valuation': 'Valuación de Inventario'
        };
        tableTitle.textContent = titles[reportType] || 'Reporte';
    }
}

function updatePeriod() {
    const period = document.getElementById('reportPeriod').value;
    const customPeriod = document.getElementById('customPeriod');
    
    if (period === 'custom') {
        customPeriod.style.display = 'flex';
        
        // Establecer fechas por defecto
        const today = new Date();
        const oneMonthAgo = new Date(today);
        oneMonthAgo.setMonth(today.getMonth() - 1);
        
        document.getElementById('reportDateFrom').value = oneMonthAgo.toISOString().split('T')[0];
        document.getElementById('reportDateTo').value = today.toISOString().split('T')[0];
    } else {
        customPeriod.style.display = 'none';
    }
}

async function generateReport() {
    // Esta función muestra el modal con las opciones del reporte
    // El reporte real se ejecuta con executeReport()
    updateReportType();
}

async function executeReport() {
    showLoading('Generando reporte...');
    
    try {
        const reportType = document.getElementById('reportType').value;
        const period = document.getElementById('reportPeriod').value;
        const format = document.getElementById('reportFormat').value;
        
        let params = {};
        
        // Configurar fechas según el período
        if (period !== 'custom') {
            const dateRange = getDateRange(period);
            if (dateRange.from) {
                params.date_from = dateRange.from;
            }
            if (dateRange.to) {
                params.date_to = dateRange.to;
            }
        } else {
            const dateFrom = document.getElementById('reportDateFrom').value;
            const dateTo = document.getElementById('reportDateTo').value;
            
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;
        }
        
        let reportData;
        
        // Obtener datos según el tipo de reporte
        switch (reportType) {
            case 'inventory':
                reportData = await getInventoryReport(params);
                break;
                
            case 'movements':
                reportData = await getMovementsReport(params);
                break;
                
            case 'low_stock':
                reportData = await getLowStockReport(params);
                break;
                
            case 'categories':
                reportData = await getCategoriesReport(params);
                break;
                
            case 'locations':
                reportData = await getLocationsReport(params);
                break;
                
            case 'valuation':
                reportData = await getValuationReport(params);
                break;
                
            default:
                throw new Error('Tipo de reporte no válido');
        }
        
        currentReportData = reportData.data || [];
        
        // Mostrar en tabla o exportar según formato
        if (format === 'html') {
            updateReportTable(currentReportData, reportType);
        } else {
            exportReportData(reportType, format, params);
        }
        
        showNotification('Reporte generado correctamente', 'success');
        
    } catch (error) {
        console.error('Error al generar reporte:', error);
        showNotification('Error al generar el reporte: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function getDateRange(period) {
    const now = new Date();
    const range = { from: null, to: null };
    
    switch (period) {
        case 'today':
            range.from = now.toISOString().split('T')[0];
            range.to = now.toISOString().split('T')[0];
            break;
            
        case 'yesterday':
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            range.from = yesterday.toISOString().split('T')[0];
            range.to = yesterday.toISOString().split('T')[0];
            break;
            
        case 'week':
            const weekAgo = new Date(now);
            weekAgo.setDate(now.getDate() - 7);
            range.from = weekAgo.toISOString().split('T')[0];
            range.to = now.toISOString().split('T')[0];
            break;
            
        case 'month':
            const monthAgo = new Date(now);
            monthAgo.setMonth(now.getMonth() - 1);
            range.from = monthAgo.toISOString().split('T')[0];
            range.to = now.toISOString().split('T')[0];
            break;
            
        case 'quarter':
            const quarterAgo = new Date(now);
            quarterAgo.setMonth(now.getMonth() - 3);
            range.from = quarterAgo.toISOString().split('T')[0];
            range.to = now.toISOString().split('T')[0];
            break;
            
        case 'year':
            const yearAgo = new Date(now);
            yearAgo.setFullYear(now.getFullYear() - 1);
            range.from = yearAgo.toISOString().split('T')[0];
            range.to = now.toISOString().split('T')[0];
            break;
    }
    
    return range;
}

function updateReportTable(data, reportType) {
    const thead = document.getElementById('reportTableHeader');
    const tbody = document.getElementById('reportTableBody');
    const countElement = document.getElementById('reportItemCount');
    
    if (!thead || !tbody) return;
    
    // Actualizar contador
    if (countElement) {
        countElement.textContent = `${data.length} elementos`;
    }
    
    if (!data || data.length === 0) {
        thead.innerHTML = '<tr><th class="text-center">No hay datos para mostrar</th></tr>';
        tbody.innerHTML = '';
        return;
    }
    
    // Generar encabezados según el tipo de reporte
    let headers = [];
    let rows = [];
    
    switch (reportType) {
        case 'inventory':
            headers = ['ID', 'Código', 'Nombre', 'Categoría', 'Ubicación', 'Stock', 'Mínimo', 'Precio', 'Valor'];
            rows = data.map(item => [
                item.id,
                item.code,
                item.name,
                item.category?.name || '-',
                item.location?.code || '-',
                `${formatNumber(item.stock)} ${item.unit || 'un'}`,
                formatNumber(item.min_stock),
                item.price ? formatCurrency(item.price) : '-',
                item.price ? formatCurrency(item.price * item.stock) : '-'
            ]);
            break;
            
        case 'movements':
            headers = ['ID', 'Fecha', 'Tipo', 'Producto', 'Cantidad', 'Stock Anterior', 'Stock Nuevo', 'Usuario', 'Motivo'];
            rows = data.map(item => [
                item.id,
                formatDate(item.date, 'short'),
                `<span class="badge badge-${item.type === 'entrada' ? 'success' : item.type === 'salida' ? 'danger' : 'info'}">${capitalize(item.type)}</span>`,
                item.product?.name || '-',
                `<span class="${item.type === 'entrada' ? 'text-success' : 'text-danger'}">${item.type === 'entrada' ? '+' : '-'}${formatNumber(item.quantity)}</span>`,
                formatNumber(item.previous_stock),
                formatNumber(item.new_stock),
                item.user?.name || '-',
                truncateText(item.reason, 30)
            ]);
            break;
            
        case 'low_stock':
            headers = ['ID', 'Código', 'Nombre', 'Categoría', 'Ubicación', 'Stock Actual', 'Stock Mínimo', 'Diferencia', 'Estado'];
            rows = data.map(item => {
                const diff = item.min_stock - item.stock;
                let statusClass = 'warning';
                let statusText = 'Bajo';
                
                if (item.stock === 0) {
                    statusClass = 'danger';
                    statusText = 'Agotado';
                } else if (diff > item.min_stock * 0.5) {
                    statusClass = 'danger';
                    statusText = 'Muy bajo';
                }
                
                return [
                    item.id,
                    item.code,
                    item.name,
                    item.category?.name || '-',
                    item.location?.code || '-',
                    `${formatNumber(item.stock)} ${item.unit || 'un'}`,
                    formatNumber(item.min_stock),
                    formatNumber(diff),
                    `<span class="badge badge-${statusClass}">${statusText}</span>`
                ];
            });
            break;
            
        case 'categories':
            headers = ['ID', 'Nombre', 'Descripción', 'Productos', 'Stock Total', 'Valor Total', 'Última Actualización'];
            rows = data.map(item => [
                item.id,
                item.name,
                item.description || '-',
                formatNumber(item.product_count || 0),
                formatNumber(item.total_stock || 0),
                item.total_value ? formatCurrency(item.total_value) : '-',
                formatDate(item.last_updated, 'short')
            ]);
            break;
            
        case 'locations':
            headers = ['ID', 'Código', 'Nombre', 'Tipo', 'Zona', 'Piso', 'Productos', 'Capacidad', 'Uso'];
            rows = data.map(item => {
                const capacity = item.capacity || 0;
                const usagePercent = capacity > 0 ? Math.round((item.product_count / capacity) * 100) : 0;
                let usageClass = 'success';
                
                if (usagePercent >= 90) usageClass = 'danger';
                else if (usagePercent >= 70) usageClass = 'warning';
                
                return [
                    item.id,
                    item.code,
                    item.name,
                    item.type || '-',
                    item.zone || '-',
                    item.floor || '-',
                    formatNumber(item.product_count || 0),
                    capacity > 0 ? formatNumber(capacity) : '∞',
                    `<div class="progress">
                        <div class="progress-bar bg-${usageClass}" style="width: ${usagePercent}%">
                            ${usagePercent}%
                        </div>
                    </div>`
                ];
            });
            break;
            
        case 'valuation':
            headers = ['Categoría', 'Productos', 'Stock Total', 'Valor Promedio', 'Valor Mínimo', 'Valor Máximo', 'Valor Total'];
            rows = data.map(item => [
                item.category?.name || 'Sin categoría',
                formatNumber(item.product_count || 0),
                formatNumber(item.total_stock || 0),
                item.average_price ? formatCurrency(item.average_price) : '-',
                item.min_price ? formatCurrency(item.min_price) : '-',
                item.max_price ? formatCurrency(item.max_price) : '-',
                item.total_value ? formatCurrency(item.total_value) : '-'
            ]);
            break;
    }
    
    // Generar HTML de la tabla
    let theadHtml = '<tr>';
    headers.forEach(header => {
        theadHtml += `<th>${header}</th>`;
    });
    theadHtml += '</tr>';
    
    let tbodyHtml = '';
    rows.forEach(row => {
        tbodyHtml += '<tr>';
        row.forEach(cell => {
            tbodyHtml += `<td>${cell}</td>`;
        });
        tbodyHtml += '</tr>';
    });
    
    thead.innerHTML = theadHtml;
    tbody.innerHTML = tbodyHtml;
}

function showExportModal() {
    const modal = document.getElementById('exportModal');
    modal.classList.add('show');
}

async function exportData() {
    const exportType = document.getElementById('exportType').value;
    const exportFormat = document.getElementById('exportFormat').value;
    const dateFrom = document.getElementById('exportDateFrom').value;
    const dateTo = document.getElementById('exportDateTo').value;
    const exportAll = document.getElementById('exportAllData').checked;
    
    let params = {};
    
    if (!exportAll) {
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
    }
    
    try {
        showLoading('Exportando datos...');
        
        const result = await exportReport(exportType, exportFormat, params);
        
        if (result.download_url) {
            // Descargar archivo
            const link = document.createElement('a');
            link.download = `${exportType}_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
            link.href = result.download_url;
            link.click();
            showNotification('Datos exportados correctamente', 'success');
        } else if (result.data) {
            // Descargar datos directos
            let content, fileName, mimeType;
            
            switch (exportFormat) {
                case 'csv':
                    content = convertToCSV(result.data);
                    fileName = `${exportType}.csv`;
                    mimeType = 'text/csv';
                    break;
                    
                case 'excel':
                    // Para Excel necesitarías una librería como xlsx
                    content = JSON.stringify(result.data);
                    fileName = `${exportType}.json`;
                    mimeType = 'application/json';
                    break;
                    
                case 'json':
                    content = JSON.stringify(result.data, null, 2);
                    fileName = `${exportType}.json`;
                    mimeType = 'application/json';
                    break;
                    
                case 'pdf':
                    // Para PDF necesitarías una librería específica
                    content = JSON.stringify(result.data);
                    fileName = `${exportType}.json`;
                    mimeType = 'application/json';
                    break;
            }
            
            if (content) {
                downloadFile(content, fileName, mimeType);
                showNotification('Datos exportados correctamente', 'success');
            }
        }
        
        closeModal('exportModal');
        
    } catch (error) {
        console.error('Error al exportar datos:', error);
        showNotification('Error al exportar los datos', 'error');
    } finally {
        hideLoading();
    }
}

function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Encabezados
    csvRows.push(headers.join(','));
    
    // Filas
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header];
            // Escapar comas y comillas
            const escaped = ('' + value).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
}

function exportReportData(reportType, format, params) {
    // Esta función maneja la exportación directa sin pasar por el servidor
    if (!currentReportData || currentReportData.length === 0) {
        showNotification('No hay datos para exportar', 'warning');
        return;
    }
    
    let content, fileName, mimeType;
    
    switch (format) {
        case 'csv':
            content = convertToCSV(currentReportData);
            fileName = `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
            mimeType = 'text/csv';
            break;
            
        case 'excel':
            // Nota: Para Excel real necesitarías una librería como SheetJS
            content = JSON.stringify(currentReportData);
            fileName = `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.json`;
            mimeType = 'application/json';
            showNotification('Exportación a Excel requiere configuración adicional', 'info');
            break;
            
        case 'pdf':
            // Nota: Para PDF necesitarías una librería como jsPDF
            content = JSON.stringify(currentReportData);
            fileName = `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.json`;
            mimeType = 'application/json';
            showNotification('Exportación a PDF requiere configuración adicional', 'info');
            break;
            
        default:
            content = JSON.stringify(currentReportData, null, 2);
            fileName = `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.json`;
            mimeType = 'application/json';
    }
    
    if (content) {
        downloadFile(content, fileName, mimeType);
    }
}

// Función para cargar componentes
async function loadComponents() {
    // Similar a dashboard.js
}