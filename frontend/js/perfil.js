/**
 * Lógica específica para el perfil de usuario
 */

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    checkAuth();
    
    // Cargar componentes
    loadComponents();
    
    // Cargar datos del perfil
    loadProfileData();
    
    // Configurar eventos
    setupEventListeners();
});

async function loadProfileData() {
    try {
        // Cargar datos del perfil
        const profile = await getProfile();
        
        // Actualizar información del perfil
        updateProfileInfo(profile);
        
        // Llenar formularios
        fillProfileForms(profile);
        
    } catch (error) {
        console.error('Error al cargar datos del perfil:', error);
        showNotification('Error al cargar los datos del perfil', 'error');
    }
}

function updateProfileInfo(profile) {
    // Actualizar avatar/iniciales
    const avatarElements = document.querySelectorAll('#avatarInitials');
    avatarElements.forEach(element => {
        if (profile.name) {
            const initials = profile.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            element.textContent = initials;
        }
    });
    
    // Actualizar nombre
    const nameElements = document.querySelectorAll('#profileName');
    nameElements.forEach(element => {
        if (profile.name) {
            element.textContent = profile.name;
        }
    });
    
    // Actualizar email
    const emailElements = document.querySelectorAll('#profileEmail');
    emailElements.forEach(element => {
        if (profile.email) {
            element.textContent = profile.email;
        }
    });
    
    // Actualizar rol
    const roleElements = document.querySelectorAll('#profileRole');
    roleElements.forEach(element => {
        if (profile.role) {
            const roleNames = {
                'admin': 'Administrador',
                'manager': 'Gerente',
                'operator': 'Operador',
                'viewer': 'Visualizador'
            };
            element.textContent = roleNames[profile.role] || profile.role;
        }
    });
}

function fillProfileForms(profile) {
    // Formulario de perfil
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        document.getElementById('profileFullName').value = profile.name || '';
        document.getElementById('profileEmailInput').value = profile.email || '';
        document.getElementById('profilePhone').value = profile.phone || '';
        document.getElementById('profileDepartment').value = profile.department || '';
        document.getElementById('profileBio').value = profile.bio || '';
    }
    
    // Formulario de preferencias
    const preferencesForm = document.getElementById('preferencesForm');
    if (preferencesForm) {
        const preferences = profile.preferences || {};
        
        document.getElementById('language').value = preferences.language || 'es';
        document.getElementById('theme').value = preferences.theme || 'light';
        document.getElementById('timezone').value = preferences.timezone || 'America/Mexico_City';
        document.getElementById('itemsPerPage').value = preferences.items_per_page || '25';
        document.getElementById('emailNotifications').checked = preferences.email_notifications !== false;
        document.getElementById('lowStockAlerts').checked = preferences.low_stock_alerts !== false;
    }
    
    // Información de sesión
    updateSessionInfo();
}

function updateSessionInfo() {
    // Esta información normalmente vendría del servidor
    const now = new Date();
    
    document.getElementById('currentLoginTime').textContent = formatDate(now, 'long');
    document.getElementById('currentLoginIp').textContent = '192.168.1.1'; // Simulado
    document.getElementById('currentLoginDevice').textContent = navigator.userAgent.split(' ')[0] || 'Desconocido';
}

function setupEventListeners() {
    // Formulario de perfil
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    // Formulario de contraseña
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordChange);
    }
    
    // Formulario de preferencias
    const preferencesForm = document.getElementById('preferencesForm');
    if (preferencesForm) {
        preferencesForm.addEventListener('submit', handlePreferencesUpdate);
    }
    
    // Botón cambiar avatar
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', showAvatarModal);
    }
    
    // Botón cerrar otras sesiones
    const logoutOtherSessionsBtn = document.getElementById('logoutOtherSessionsBtn');
    if (logoutOtherSessionsBtn) {
        logoutOtherSessionsBtn.addEventListener('click', logoutOtherSessions);
    }
    
    // Botón ver toda la actividad
    const viewAllActivityBtn = document.getElementById('viewAllActivityBtn');
    if (viewAllActivityBtn) {
        viewAllActivityBtn.addEventListener('click', viewAllActivity);
    }
    
    // Modal de avatar
    const saveAvatarBtn = document.getElementById('saveAvatarBtn');
    if (saveAvatarBtn) {
        saveAvatarBtn.addEventListener('click', saveAvatar);
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
    
    // Seleccionar opción de avatar
    document.querySelectorAll('.avatar-option').forEach(option => {
        option.addEventListener('click', function() {
            // Remover selección previa
            document.querySelectorAll('.avatar-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Agregar selección actual
            this.classList.add('selected');
        });
    });
    
    // Previsualizar imagen subida
    const avatarUpload = document.getElementById('avatarUpload');
    if (avatarUpload) {
        avatarUpload.addEventListener('change', previewAvatar);
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const profileData = Object.fromEntries(formData.entries());
    
    // Validar datos
    if (!profileData.name || !profileData.email) {
        showNotification('Nombre y email son campos requeridos', 'error');
        return;
    }
    
    if (!isValidEmail(profileData.email)) {
        showNotification('Por favor, introduce un email válido', 'error');
        return;
    }
    
    try {
        showMiniLoading();
        
        await updateProfile(profileData);
        
        showNotification('Perfil actualizado correctamente', 'success');
        
        // Recargar datos del perfil
        loadProfileData();
        
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        showNotification(error.message || 'Error al actualizar el perfil', 'error');
    } finally {
        hideMiniLoading();
    }
}

async function handlePasswordChange(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const passwordData = Object.fromEntries(formData.entries());
    
    // Validar datos
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_new_password) {
        showNotification('Todos los campos son requeridos', 'error');
        return;
    }
    
    if (passwordData.new_password.length < 6) {
        showNotification('La nueva contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    if (passwordData.new_password !== passwordData.confirm_new_password) {
        showNotification('Las nuevas contraseñas no coinciden', 'error');
        return;
    }
    
    try {
        showMiniLoading();
        
        const result = await changePassword(
            passwordData.current_password,
            passwordData.new_password
        );
        
        if (result.success) {
            showNotification('Contraseña cambiada correctamente', 'success');
            form.reset();
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        showNotification(error.message || 'Error al cambiar la contraseña', 'error');
    } finally {
        hideMiniLoading();
    }
}

async function handlePreferencesUpdate(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const preferencesData = Object.fromEntries(formData.entries());
    
    // Convertir checkboxes a boolean
    preferencesData.email_notifications = preferencesData.email_notifications === 'on';
    preferencesData.low_stock_alerts = preferencesData.low_stock_alerts === 'on';
    
    try {
        showMiniLoading();
        
        // Actualizar preferencias como parte del perfil
        await updateProfile({ preferences: preferencesData });
        
        showNotification('Preferencias guardadas correctamente', 'success');
        
        // Aplicar cambios inmediatos
        applyPreferences(preferencesData);
        
    } catch (error) {
        console.error('Error al guardar preferencias:', error);
        showNotification('Error al guardar las preferencias', 'error');
    } finally {
        hideMiniLoading();
    }
}

function applyPreferences(preferences) {
    // Aplicar tema
    if (preferences.theme === 'dark') {
        document.body.classList.add('dark-mode');
    } else if (preferences.theme === 'light') {
        document.body.classList.remove('dark-mode');
    } else {
        // Auto: detectar preferencias del sistema
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }
    
    // Guardar preferencias en localStorage
    localStorage.setItem('user_preferences', JSON.stringify(preferences));
    
    // Aplicar idioma (requeriría traducciones)
    if (preferences.language !== 'es') {
        // Cambiar idioma de la interfaz
        console.log('Cambiar idioma a:', preferences.language);
    }
}

function showAvatarModal() {
    const modal = document.getElementById('avatarModal');
    modal.classList.add('show');
}

function previewAvatar() {
    const fileInput = document.getElementById('avatarUpload');
    const file = fileInput.files[0];
    
    if (!file) return;
    
    // Validar tipo de archivo
    if (!file.type.match('image.*')) {
        showNotification('Por favor, selecciona una imagen', 'error');
        fileInput.value = '';
        return;
    }
    
    // Validar tamaño (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
        showNotification('La imagen debe ser menor a 2MB', 'error');
        fileInput.value = '';
        return;
    }
    
    // Previsualizar
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.createElement('img');
        preview.src = e.target.result;
        preview.style.maxWidth = '100px';
        preview.style.maxHeight = '100px';
        preview.style.borderRadius = '50%';
        
        // Reemplazar opciones con la previsualización
        const avatarOptions = document.querySelector('.avatar-options');
        if (avatarOptions) {
            avatarOptions.innerHTML = '';
            avatarOptions.appendChild(preview);
        }
    };
    
    reader.readAsDataURL(file);
}

async function saveAvatar() {
    const fileInput = document.getElementById('avatarUpload');
    const selectedOption = document.querySelector('.avatar-option.selected');
    
    let avatarData = null;
    
    if (fileInput.files.length > 0) {
        // Subir imagen
        const file = fileInput.files[0];
        avatarData = await uploadAvatar(file);
    } else if (selectedOption) {
        // Usar avatar seleccionado
        const img = selectedOption.querySelector('img');
        if (img) {
            avatarData = { type: 'url', value: img.src };
        } else {
            // Usar iniciales
            const initials = document.querySelector('.avatar-initials span')?.textContent;
            avatarData = { type: 'initials', value: initials };
        }
    }
    
    if (avatarData) {
        try {
            // Guardar avatar en el perfil
            await updateProfile({ avatar: avatarData });
            
            showNotification('Avatar actualizado correctamente', 'success');
            closeModal('avatarModal');
            
            // Actualizar visualización
            updateAvatarDisplay(avatarData);
            
        } catch (error) {
            console.error('Error al guardar avatar:', error);
            showNotification('Error al guardar el avatar', 'error');
        }
    } else {
        showNotification('Selecciona una opción de avatar', 'warning');
    }
}

async function uploadAvatar(file) {
    // Simular subida de archivo
    return new Promise((resolve) => {
        setTimeout(() => {
            const reader = new FileReader();
            reader.onload = function(e) {
                resolve({
                    type: 'base64',
                    value: e.target.result
                });
            };
            reader.readAsDataURL(file);
        }, 1000);
    });
}

function updateAvatarDisplay(avatarData) {
    const avatarElement = document.getElementById('profileAvatar');
    if (!avatarElement) return;
    
    if (avatarData.type === 'url') {
        avatarElement.innerHTML = `<img src="${avatarData.value}" alt="Avatar">`;
    } else if (avatarData.type === 'base64') {
        avatarElement.innerHTML = `<img src="${avatarData.value}" alt="Avatar">`;
    } else if (avatarData.type === 'initials') {
        avatarElement.innerHTML = `<span>${avatarData.value}</span>`;
    }
}

async function logoutOtherSessions() {
    if (!confirm('¿Estás seguro de que deseas cerrar todas las demás sesiones?\nSerás redirigido al login.')) {
        return;
    }
    
    try {
        showMiniLoading();
        
        // Llamar a API para cerrar otras sesiones
        // await api.post('/auth/logout-other-sessions');
        
        showNotification('Otras sesiones cerradas correctamente', 'success');
        
        // Redirigir al login
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error al cerrar otras sesiones:', error);
        showNotification('Error al cerrar otras sesiones', 'error');
    } finally {
        hideMiniLoading();
    }
}

function viewAllActivity() {
    // Redirigir a página de actividad
    window.location.href = 'movimientos.html?user=' + getCurrentUser().id;
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

// Aplicar preferencias guardadas al cargar
document.addEventListener('DOMContentLoaded', function() {
    const savedPreferences = localStorage.getItem('user_preferences');
    if (savedPreferences) {
        try {
            const preferences = JSON.parse(savedPreferences);
            applyPreferences(preferences);
        } catch (error) {
            console.error('Error al cargar preferencias:', error);
        }
    }
});