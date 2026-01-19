/**
 * Lógica específica para la gestión de usuarios
 */

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación y permisos
    checkAuth();
    if (!hasPermission('manage_users')) {
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
    let users = [];
    let userToDelete = null;
    let userToResetPassword = null;
    
    // Cargar usuarios
    loadUsers();
    
    // Configurar eventos
    setupEventListeners();
});

async function loadUsers() {
    showMiniLoading();
    
    try {
        const params = {
            page: currentPage,
            limit: itemsPerPage
        };
        
        const response = await getUsers(params);
        
        users = response.data || [];
        totalItems = response.total || 0;
        totalPages = Math.ceil(totalItems / itemsPerPage);
        
        updateUsersTable();
        updateUserPagination();
        updateUserCount();
        
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        showNotification('Error al cargar los usuarios', 'error');
    } finally {
        hideMiniLoading();
    }
}

function updateUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <div class="empty-state">
                        <p>No se encontraron usuarios</p>
                        <button id="addFirstUser" class="btn btn-primary btn-sm">
                            + Agregar primer usuario
                        </button>
                    </div>
                </td>
            </tr>
        `;
        
        document.getElementById('addFirstUser')?.addEventListener('click', () => {
            showUserModal();
        });
        
        return;
    }
    
    let html = '';
    
    const currentUserId = getCurrentUser()?.id;
    
    users.forEach(user => {
        const roleNames = {
            'admin': 'Administrador',
            'manager': 'Gerente',
            'operator': 'Operador',
            'viewer': 'Visualizador'
        };
        
        const statusClasses = {
            'active': 'success',
            'inactive': 'secondary',
            'suspended': 'danger'
        };
        
        const statusTexts = {
            'active': 'Activo',
            'inactive': 'Inactivo',
            'suspended': 'Suspendido'
        };
        
        const isCurrentUser = user.id === currentUserId;
        
        html += `
            <tr>
                <td>${user.id}</td>
                <td>
                    <strong>${user.name}</strong>
                    <small class="text-muted d-block">${user.email}</small>
                </td>
                <td>${user.email}</td>
                <td>
                    <span class="badge badge-info">${roleNames[user.role] || user.role}</span>
                </td>
                <td>
                    <span class="badge badge-${statusClasses[user.status] || 'secondary'}">
                        ${statusTexts[user.status] || user.status}
                    </span>
                </td>
                <td>
                    ${user.last_login ? formatDate(user.last_login, 'short') : 'Nunca'}
                </td>
                <td>${formatDate(user.created_at, 'short')}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary edit-btn" data-id="${user.id}" ${isCurrentUser ? 'disabled' : ''}>
                            <span>✏️</span>
                        </button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${user.id}" ${isCurrentUser ? 'disabled' : ''}>
                            <span>🗑️</span>
                        </button>
                        <button class="btn btn-sm btn-warning reset-password-btn" data-id="${user.id}" ${isCurrentUser ? 'disabled' : ''}>
                            <span>🔑</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    
    // Agregar eventos a los botones
    addUserTableEvents();
}

function addUserTableEvents() {
    // Botones de editar
    document.querySelectorAll('.edit-btn').forEach(btn => {
        if (!btn.disabled) {
            btn.addEventListener('click', function() {
                const userId = parseInt(this.getAttribute('data-id'));
                editUser(userId);
            });
        }
    });
    
    // Botones de eliminar
    document.querySelectorAll('.delete-btn').forEach(btn => {
        if (!btn.disabled) {
            btn.addEventListener('click', function() {
                const userId = parseInt(this.getAttribute('data-id'));
                confirmDeleteUser(userId);
            });
        }
    });
    
    // Botones de resetear contraseña
    document.querySelectorAll('.reset-password-btn').forEach(btn => {
        if (!btn.disabled) {
            btn.addEventListener('click', function() {
                const userId = parseInt(this.getAttribute('data-id'));
                showResetPasswordModal(userId);
            });
        }
    });
}

function updateUserPagination() {
    const prevBtn = document.getElementById('prevUserPage');
    const nextBtn = document.getElementById('nextUserPage');
    const pageInfo = document.getElementById('userPageInfo');
    
    if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
        prevBtn.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                loadUsers();
            }
        };
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages;
        nextBtn.onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadUsers();
            }
        };
    }
    
    if (pageInfo) {
        pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    }
}

function updateUserCount() {
    const countElement = document.getElementById('userCount');
    if (countElement) {
        countElement.textContent = `${totalItems} usuarios encontrados`;
    }
}

function setupEventListeners() {
    // Botón nuevo usuario
    const newUserBtn = document.getElementById('newUserBtn');
    if (newUserBtn) {
        newUserBtn.addEventListener('click', showUserModal);
    }
    
    // Formulario de usuario
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', handleUserSubmit);
    }
    
    // Formulario de resetear contraseña
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', handleResetPasswordSubmit);
    }
    
    // Confirmación de eliminación
    const confirmDeleteBtn = document.getElementById('confirmDeleteUser');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteUser);
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
    
    // Validación de contraseñas en tiempo real
    const userPassword = document.getElementById('userPassword');
    const userConfirmPassword = document.getElementById('userConfirmPassword');
    
    if (userPassword && userConfirmPassword) {
        userConfirmPassword.addEventListener('input', function() {
            validatePasswords();
        });
    }
}

function validatePasswords() {
    const password = document.getElementById('userPassword')?.value;
    const confirmPassword = document.getElementById('userConfirmPassword')?.value;
    const confirmInput = document.getElementById('userConfirmPassword');
    
    if (!confirmInput) return;
    
    if (password && confirmPassword && password !== confirmPassword) {
        confirmInput.classList.add('is-invalid');
        return false;
    } else {
        confirmInput.classList.remove('is-invalid');
        return true;
    }
}

function showUserModal(user = null) {
    const modal = document.getElementById('userModal');
    const modalTitle = document.getElementById('userModalTitle');
    const form = document.getElementById('userForm');
    const userId = document.getElementById('userId');
    const passwordField = document.getElementById('userPassword');
    const confirmPasswordField = document.getElementById('userConfirmPassword');
    
    if (user) {
        // Modo edición
        modalTitle.textContent = 'Editar Usuario';
        
        // Llenar formulario
        document.getElementById('userName').value = user.name || '';
        document.getElementById('userEmail').value = user.email || '';
        document.getElementById('userRole').value = user.role || '';
        document.getElementById('userStatus').value = user.status || 'active';
        document.getElementById('userPhone').value = user.phone || '';
        document.getElementById('userDepartment').value = user.department || '';
        userId.value = user.id;
        
        // Cambiar requerimientos de contraseña
        if (passwordField) {
            passwordField.required = false;
            passwordField.placeholder = 'Dejar en blanco para no cambiar';
        }
        
        if (confirmPasswordField) {
            confirmPasswordField.required = false;
            confirmPasswordField.placeholder = 'Dejar en blanco para no cambiar';
        }
        
    } else {
        // Modo creación
        modalTitle.textContent = 'Nuevo Usuario';
        form.reset();
        userId.value = '';
        
        // Establecer valores por defecto
        document.getElementById('userStatus').value = 'active';
        
        // Restaurar requerimientos de contraseña
        if (passwordField) {
            passwordField.required = true;
            passwordField.placeholder = 'Ingresa la contraseña';
        }
        
        if (confirmPasswordField) {
            confirmPasswordField.required = true;
            confirmPasswordField.placeholder = 'Confirma la contraseña';
        }
    }
    
    // Mostrar modal
    modal.classList.add('show');
    
    // Enfocar primer campo
    document.getElementById('userName').focus();
}

async function editUser(userId) {
    try {
        const user = await getUser(userId);
        showUserModal(user);
    } catch (error) {
        console.error('Error al cargar usuario:', error);
        showNotification('Error al cargar el usuario', 'error');
    }
}

async function handleUserSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const userData = Object.fromEntries(formData.entries());
    
    // Validar datos
    if (!userData.name || !userData.email) {
        showNotification('Nombre y email son campos requeridos', 'error');
        return;
    }
    
    if (!isValidEmail(userData.email)) {
        showNotification('Por favor, introduce un email válido', 'error');
        return;
    }
    
    // Validar contraseñas si se están cambiando
    if (userData.password) {
        if (userData.password.length < 6) {
            showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }
        
        if (userData.password !== userData.confirm_password) {
            showNotification('Las contraseñas no coinciden', 'error');
            return;
        }
    }
    
    // Eliminar confirm_password del objeto
    delete userData.confirm_password;
    
    // Si no se proporcionó contraseña en modo edición, eliminarla
    if (userData.id && (!userData.password || userData.password === '')) {
        delete userData.password;
    }
    
    try {
        showMiniLoading();
        
        if (userData.id) {
            // Actualizar usuario existente
            const id = userData.id;
            delete userData.id;
            await updateUser(id, userData);
            showNotification('Usuario actualizado correctamente', 'success');
        } else {
            // Crear nuevo usuario
            delete userData.id;
            await createUser(userData);
            showNotification('Usuario creado correctamente', 'success');
        }
        
        // Cerrar modal y recargar usuarios
        closeModal('userModal');
        loadUsers();
        
    } catch (error) {
        console.error('Error al guardar usuario:', error);
        showNotification(error.message || 'Error al guardar el usuario', 'error');
    } finally {
        hideMiniLoading();
    }
}

function confirmDeleteUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    userToDelete = user;
    
    // Mostrar modal de confirmación
    const modal = document.getElementById('deleteUserModal');
    modal.classList.add('show');
}

async function deleteUser() {
    if (!userToDelete) return;
    
    try {
        showMiniLoading();
        
        await deleteUser(userToDelete.id);
        
        showNotification('Usuario eliminado correctamente', 'success');
        
        // Cerrar modal y recargar usuarios
        closeModal('deleteUserModal');
        userToDelete = null;
        loadUsers();
        
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        showNotification(error.message || 'Error al eliminar el usuario', 'error');
    } finally {
        hideMiniLoading();
    }
}

function showResetPasswordModal(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    userToResetPassword = user;
    
    // Mostrar modal
    const modal = document.getElementById('resetPasswordModal');
    modal.classList.add('show');
    
    // Limpiar formulario
    document.getElementById('resetPasswordForm').reset();
    document.getElementById('resetUserId').value = user.id;
}

async function handleResetPasswordSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const resetData = Object.fromEntries(formData.entries());
    
    // Validar contraseñas
    if (!resetData.password || resetData.password.length < 6) {
        showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    if (resetData.password !== resetData.confirm_password) {
        showNotification('Las contraseñas no coinciden', 'error');
        return;
    }
    
    try {
        showMiniLoading();
        
        // En un sistema real, aquí llamarías a una API para resetear la contraseña
        // Por ahora, simulamos una actualización de usuario
        await updateUser(resetData.user_id, {
            password: resetData.password
        });
        
        showNotification('Contraseña actualizada correctamente', 'success');
        
        // Cerrar modal
        closeModal('resetPasswordModal');
        userToResetPassword = null;
        
    } catch (error) {
        console.error('Error al resetear contraseña:', error);
        showNotification('Error al actualizar la contraseña', 'error');
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