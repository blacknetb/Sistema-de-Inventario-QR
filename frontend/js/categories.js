/**
 * Lógica específica para la gestión de categorías
 */

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación y permisos
    checkAuth();
    if (!hasPermission('manage_categories')) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Cargar componentes
    loadComponents();
    
    // Cargar categorías
    loadCategories();
    
    // Configurar eventos
    setupEventListeners();
});

let categories = [];
let categoryToDelete = null;

async function loadCategories() {
    showMiniLoading();
    
    try {
        const response = await getCategories({ limit: 1000 });
        categories = response.data || [];
        
        updateCategoriesTable();
        updateCategoryCount();
        
    } catch (error) {
        console.error('Error al cargar categorías:', error);
        showNotification('Error al cargar las categorías', 'error');
    } finally {
        hideMiniLoading();
    }
}

function updateCategoriesTable() {
    const tbody = document.getElementById('categoriesTableBody');
    if (!tbody) return;
    
    if (categories.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="empty-state">
                        <p>No se encontraron categorías</p>
                        <button id="addFirstCategory" class="btn btn-primary btn-sm">
                            + Agregar primera categoría
                        </button>
                    </div>
                </td>
            </tr>
        `;
        
        document.getElementById('addFirstCategory')?.addEventListener('click', () => {
            showCategoryModal();
        });
        
        return;
    }
    
    let html = '';
    
    categories.forEach(category => {
        const productCount = category.products_count || 0;
        
        html += `
            <tr>
                <td>${category.id}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="color-indicator" style="background-color: ${category.color || '#4CAF50'}"></div>
                        <span><strong>${category.name}</strong></span>
                    </div>
                </td>
                <td>${category.description || '-'}</td>
                <td>
                    <span class="badge badge-info">${productCount} productos</span>
                </td>
                <td>${formatDate(category.created_at, 'short')}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary edit-btn" data-id="${category.id}">
                            <span>✏️</span>
                        </button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${category.id}">
                            <span>🗑️</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    
    // Agregar eventos a los botones
    addCategoryTableEvents();
}

function addCategoryTableEvents() {
    // Botones de editar
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const categoryId = parseInt(this.getAttribute('data-id'));
            editCategory(categoryId);
        });
    });
    
    // Botones de eliminar
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const categoryId = parseInt(this.getAttribute('data-id'));
            confirmDeleteCategory(categoryId);
        });
    });
}

function updateCategoryCount() {
    const countElement = document.getElementById('categoryCount');
    if (countElement) {
        countElement.textContent = `${categories.length} categorías`;
    }
}

function setupEventListeners() {
    // Botón nueva categoría
    const newCategoryBtn = document.getElementById('newCategoryBtn');
    if (newCategoryBtn) {
        newCategoryBtn.addEventListener('click', showCategoryModal);
    }
    
    // Formulario de categoría
    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) {
        categoryForm.addEventListener('submit', handleCategorySubmit);
    }
    
    // Confirmación de eliminación
    const confirmDeleteBtn = document.getElementById('confirmDeleteCategory');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteCategory);
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

function showCategoryModal(category = null) {
    const modal = document.getElementById('categoryModal');
    const modalTitle = document.getElementById('categoryModalTitle');
    const form = document.getElementById('categoryForm');
    const categoryId = document.getElementById('categoryId');
    
    if (category) {
        // Modo edición
        modalTitle.textContent = 'Editar Categoría';
        
        // Llenar formulario
        document.getElementById('categoryName').value = category.name || '';
        document.getElementById('categoryDescription').value = category.description || '';
        document.getElementById('categoryColor').value = category.color || '#4CAF50';
        categoryId.value = category.id;
    } else {
        // Modo creación
        modalTitle.textContent = 'Nueva Categoría';
        form.reset();
        categoryId.value = '';
        
        // Establecer color por defecto
        document.getElementById('categoryColor').value = '#4CAF50';
    }
    
    // Mostrar modal
    modal.classList.add('show');
    
    // Enfocar primer campo
    document.getElementById('categoryName').focus();
}

async function editCategory(categoryId) {
    try {
        const category = categories.find(c => c.id === categoryId);
        if (category) {
            showCategoryModal(category);
        }
    } catch (error) {
        console.error('Error al cargar categoría:', error);
        showNotification('Error al cargar la categoría', 'error');
    }
}

async function handleCategorySubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const categoryData = Object.fromEntries(formData.entries());
    
    // Validar datos
    if (!categoryData.name) {
        showNotification('El nombre de la categoría es requerido', 'error');
        return;
    }
    
    try {
        showMiniLoading();
        
        if (categoryData.id) {
            // Actualizar categoría existente
            const id = categoryData.id;
            delete categoryData.id;
            await updateCategory(id, categoryData);
            showNotification('Categoría actualizada correctamente', 'success');
        } else {
            // Crear nueva categoría
            delete categoryData.id;
            await createCategory(categoryData);
            showNotification('Categoría creada correctamente', 'success');
        }
        
        // Cerrar modal y recargar categorías
        closeModal('categoryModal');
        loadCategories();
        
    } catch (error) {
        console.error('Error al guardar categoría:', error);
        showNotification(error.message || 'Error al guardar la categoría', 'error');
    } finally {
        hideMiniLoading();
    }
}

function confirmDeleteCategory(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    
    categoryToDelete = category;
    
    // Mostrar modal de confirmación
    const modal = document.getElementById('deleteCategoryModal');
    modal.classList.add('show');
}

async function deleteCategory() {
    if (!categoryToDelete) return;
    
    try {
        showMiniLoading();
        
        await deleteCategory(categoryToDelete.id);
        
        showNotification('Categoría eliminada correctamente', 'success');
        
        // Cerrar modal y recargar categorías
        closeModal('deleteCategoryModal');
        categoryToDelete = null;
        loadCategories();
        
    } catch (error) {
        console.error('Error al eliminar categoría:', error);
        showNotification(error.message || 'Error al eliminar la categoría', 'error');
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

// Función para cargar componentes
async function loadComponents() {
    // Similar a dashboard.js
}