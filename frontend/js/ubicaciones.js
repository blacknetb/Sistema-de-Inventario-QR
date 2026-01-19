/**
 * Lógica específica para la gestión de ubicaciones
 */

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación y permisos
    checkAuth();
    if (!hasPermission('manage_locations')) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Cargar componentes
    loadComponents();
    
    // Inicializar variables
    let locations = [];
    let locationToDelete = null;
    let currentView = 'list'; // 'list' o 'map'
    
    // Cargar ubicaciones
    loadLocations();
    
    // Configurar eventos
    setupEventListeners();
});

async function loadLocations() {
    showMiniLoading();
    
    try {
        const response = await getLocations({ limit: 1000 });
        locations = response.data || [];
        
        updateLocationsTable();
        updateLocationMap();
        updateLocationCount();
        
    } catch (error) {
        console.error('Error al cargar ubicaciones:', error);
        showNotification('Error al cargar las ubicaciones', 'error');
    } finally {
        hideMiniLoading();
    }
}

function updateLocationsTable() {
    const tbody = document.getElementById('locationsTableBody');
    if (!tbody) return;
    
    if (locations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <div class="empty-state">
                        <p>No se encontraron ubicaciones</p>
                        <button id="addFirstLocation" class="btn btn-primary btn-sm">
                            + Agregar primera ubicación
                        </button>
                    </div>
                </td>
            </tr>
        `;
        
        document.getElementById('addFirstLocation')?.addEventListener('click', () => {
            showLocationModal();
        });
        
        return;
    }
    
    let html = '';
    
    locations.forEach(location => {
        const productCount = location.products_count || 0;
        const capacity = location.capacity || 0;
        const usagePercent = capacity > 0 ? Math.round((productCount / capacity) * 100) : 0;
        
        let capacityClass = 'success';
        if (usagePercent >= 90) {
            capacityClass = 'danger';
        } else if (usagePercent >= 70) {
            capacityClass = 'warning';
        }
        
        html += `
            <tr>
                <td>${location.id}</td>
                <td>
                    <strong>${location.name}</strong>
                    <small class="text-muted d-block">${location.zone || ''} ${location.floor || ''}</small>
                </td>
                <td><code>${location.code}</code></td>
                <td>${location.description || '-'}</td>
                <td>
                    <div class="capacity-info">
                        <span class="text-${capacityClass}"><strong>${productCount}</strong> / ${capacity || '∞'}</span>
                        ${capacity > 0 ? `
                            <div class="progress capacity-bar">
                                <div class="progress-bar bg-${capacityClass}" 
                                     style="width: ${usagePercent}%"></div>
                            </div>
                        ` : ''}
                    </div>
                </td>
                <td>
                    <span class="badge badge-info">${productCount} productos</span>
                </td>
                <td>
                    <span class="badge badge-secondary">${location.type || 'almacen'}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary edit-btn" data-id="${location.id}">
                            <span>✏️</span>
                        </button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${location.id}">
                            <span>🗑️</span>
                        </button>
                        <button class="btn btn-sm btn-secondary view-products-btn" data-id="${location.id}">
                            <span>📦</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    
    // Agregar eventos a los botones
    addLocationTableEvents();
}

function addLocationTableEvents() {
    // Botones de editar
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const locationId = parseInt(this.getAttribute('data-id'));
            editLocation(locationId);
        });
    });
    
    // Botones de eliminar
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const locationId = parseInt(this.getAttribute('data-id'));
            confirmDeleteLocation(locationId);
        });
    });
    
    // Botones de ver productos
    document.querySelectorAll('.view-products-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const locationId = parseInt(this.getAttribute('data-id'));
            viewLocationProducts(locationId);
        });
    });
}

function updateLocationMap() {
    const mapContainer = document.querySelector('.map-grid');
    if (!mapContainer || currentView !== 'map') return;
    
    if (locations.length === 0) {
        mapContainer.innerHTML = `
            <div class="empty-map">
                <p>No hay ubicaciones para mostrar</p>
                <button id="addFirstLocationMap" class="btn btn-primary btn-sm">
                    + Agregar primera ubicación
                </button>
            </div>
        `;
        
        document.getElementById('addFirstLocationMap')?.addEventListener('click', () => {
            showLocationModal();
        });
        
        return;
    }
    
    // Agrupar ubicaciones por zona
    const zones = {};
    locations.forEach(location => {
        const zone = location.zone || 'Sin zona';
        if (!zones[zone]) {
            zones[zone] = [];
        }
        zones[zone].push(location);
    });
    
    let html = '';
    
    Object.keys(zones).forEach(zone => {
        html += `<div class="map-zone"><h4>${zone}</h4><div class="zone-grid">`;
        
        zones[zone].forEach(location => {
            const productCount = location.products_count || 0;
            const capacity = location.capacity || 0;
            const usagePercent = capacity > 0 ? Math.round((productCount / capacity) * 100) : 0;
            
            let statusClass = 'available';
            if (capacity > 0) {
                if (productCount >= capacity) {
                    statusClass = 'full';
                } else if (usagePercent >= 70) {
                    statusClass = 'warning';
                }
            }
            
            html += `
                <div class="location-cell ${statusClass}" data-id="${location.id}">
                    <div class="cell-code">${location.code}</div>
                    <div class="cell-name">${truncateText(location.name, 10)}</div>
                    <div class="cell-info">${productCount} / ${capacity || '∞'}</div>
                </div>
            `;
        });
        
        html += '</div></div>';
    });
    
    mapContainer.innerHTML = html;
    
    // Agregar eventos a las celdas
    document.querySelectorAll('.location-cell').forEach(cell => {
        cell.addEventListener('click', function() {
            const locationId = parseInt(this.getAttribute('data-id'));
            const location = locations.find(l => l.id === locationId);
            if (location) {
                showLocationDetails(location);
            }
        });
    });
}

function showLocationDetails(location) {
    const productCount = location.products_count || 0;
    const capacity = location.capacity || 0;
    
    let html = `
        <h4>${location.name} (${location.code})</h4>
        <p><strong>Tipo:</strong> ${location.type || 'Almacén'}</p>
        <p><strong>Zona:</strong> ${location.zone || 'Sin zona'}</p>
        <p><strong>Piso/Nivel:</strong> ${location.floor || 'N/A'}</p>
        <p><strong>Productos:</strong> ${productCount}${capacity > 0 ? ` / ${capacity}` : ''}</p>
        <p><strong>Descripción:</strong> ${location.description || 'Sin descripción'}</p>
    `;
    
    if (productCount > 0) {
        html += `<button class="btn btn-primary btn-sm mt-2" onclick="viewLocationProducts(${location.id})">Ver productos</button>`;
    }
    
    html += `<button class="btn btn-secondary btn-sm mt-2 ml-2" onclick="editLocation(${location.id})">Editar</button>`;
    
    // Mostrar en modal o tooltip
    alert(html.replace(/<[^>]*>/g, ''));
}

function updateLocationCount() {
    const countElement = document.getElementById('locationCount');
    if (countElement) {
        countElement.textContent = `${locations.length} ubicaciones`;
    }
}

function setupEventListeners() {
    // Botón nueva ubicación
    const newLocationBtn = document.getElementById('newLocationBtn');
    if (newLocationBtn) {
        newLocationBtn.addEventListener('click', showLocationModal);
    }
    
    // Botones de cambio de vista
    const listViewBtn = document.getElementById('listViewBtn');
    const mapViewBtn = document.getElementById('mapViewBtn');
    
    if (listViewBtn) {
        listViewBtn.addEventListener('click', () => switchView('list'));
    }
    
    if (mapViewBtn) {
        mapViewBtn.addEventListener('click', () => switchView('map'));
    }
    
    // Formulario de ubicación
    const locationForm = document.getElementById('locationForm');
    if (locationForm) {
        locationForm.addEventListener('submit', handleLocationSubmit);
    }
    
    // Confirmación de eliminación
    const confirmDeleteBtn = document.getElementById('confirmDeleteLocation');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteLocation);
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

function switchView(view) {
    currentView = view;
    
    const listView = document.getElementById('listView');
    const mapView = document.getElementById('mapView');
    const listBtn = document.getElementById('listViewBtn');
    const mapBtn = document.getElementById('mapViewBtn');
    
    if (view === 'list') {
        listView?.classList.add('active');
        mapView?.classList.remove('active');
        listBtn?.classList.add('active');
        mapBtn?.classList.remove('active');
    } else {
        listView?.classList.remove('active');
        mapView?.classList.add('active');
        listBtn?.classList.remove('active');
        mapBtn?.classList.add('active');
        updateLocationMap();
    }
}

function showLocationModal(location = null) {
    const modal = document.getElementById('locationModal');
    const modalTitle = document.getElementById('locationModalTitle');
    const form = document.getElementById('locationForm');
    const locationId = document.getElementById('locationId');
    
    if (location) {
        // Modo edición
        modalTitle.textContent = 'Editar Ubicación';
        
        // Llenar formulario
        document.getElementById('locationName').value = location.name || '';
        document.getElementById('locationCode').value = location.code || '';
        document.getElementById('locationDescription').value = location.description || '';
        document.getElementById('locationType').value = location.type || 'almacen';
        document.getElementById('locationCapacity').value = location.capacity || '';
        document.getElementById('locationZone').value = location.zone || '';
        document.getElementById('locationFloor').value = location.floor || '';
        locationId.value = location.id;
    } else {
        // Modo creación
        modalTitle.textContent = 'Nueva Ubicación';
        form.reset();
        locationId.value = '';
        
        // Establecer valores por defecto
        document.getElementById('locationType').value = 'almacen';
    }
    
    // Mostrar modal
    modal.classList.add('show');
    
    // Enfocar primer campo
    document.getElementById('locationName').focus();
}

async function editLocation(locationId) {
    try {
        const location = locations.find(l => l.id === locationId);
        if (location) {
            showLocationModal(location);
        }
    } catch (error) {
        console.error('Error al cargar ubicación:', error);
        showNotification('Error al cargar la ubicación', 'error');
    }
}

function viewLocationProducts(locationId) {
    // Redirigir a productos con filtro de ubicación
    window.location.href = `productos.html?location=${locationId}`;
}

async function handleLocationSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const locationData = Object.fromEntries(formData.entries());
    
    // Validar datos
    if (!locationData.name || !locationData.code) {
        showNotification('Nombre y código son campos requeridos', 'error');
        return;
    }
    
    // Convertir campos numéricos
    if (locationData.capacity) {
        locationData.capacity = parseInt(locationData.capacity);
    }
    
    try {
        showMiniLoading();
        
        if (locationData.id) {
            // Actualizar ubicación existente
            const id = locationData.id;
            delete locationData.id;
            await updateLocation(id, locationData);
            showNotification('Ubicación actualizada correctamente', 'success');
        } else {
            // Crear nueva ubicación
            delete locationData.id;
            await createLocation(locationData);
            showNotification('Ubicación creada correctamente', 'success');
        }
        
        // Cerrar modal y recargar ubicaciones
        closeModal('locationModal');
        loadLocations();
        
    } catch (error) {
        console.error('Error al guardar ubicación:', error);
        showNotification(error.message || 'Error al guardar la ubicación', 'error');
    } finally {
        hideMiniLoading();
    }
}

function confirmDeleteLocation(locationId) {
    const location = locations.find(l => l.id === locationId);
    if (!location) return;
    
    locationToDelete = location;
    
    // Mostrar modal de confirmación
    const modal = document.getElementById('deleteLocationModal');
    modal.classList.add('show');
}

async function deleteLocation() {
    if (!locationToDelete) return;
    
    try {
        showMiniLoading();
        
        await deleteLocation(locationToDelete.id);
        
        showNotification('Ubicación eliminada correctamente', 'success');
        
        // Cerrar modal y recargar ubicaciones
        closeModal('deleteLocationModal');
        locationToDelete = null;
        loadLocations();
        
    } catch (error) {
        console.error('Error al eliminar ubicación:', error);
        showNotification(error.message || 'Error al eliminar la ubicación', 'error');
    } finally {
        hideMiniLoading();
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

// Exportar funciones para uso en HTML
window.editLocation = editLocation;
window.viewLocationProducts = viewLocationProducts;

// Función para cargar componentes
async function loadComponents() {
    // Similar a dashboard.js
}