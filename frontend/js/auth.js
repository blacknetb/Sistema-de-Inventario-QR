/**
 * Manejo de autenticación y autorización
 */

// Verificar si hay una sesión activa y redirigir si es necesario
function checkAuth() {
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath.includes('index.html') || currentPath === '/' || currentPath.includes('login');
    
    if (isAuthenticated()) {
        // Si ya está autenticado y está en la página de login, redirigir al dashboard
        if (isLoginPage) {
            window.location.href = 'dashboard.html';
        }
        
        // Mostrar secciones de administración si corresponde
        if (getCurrentUser() && getCurrentUser().role === 'admin') {
            const adminSection = document.getElementById('adminSection');
            if (adminSection) {
                adminSection.style.display = 'block';
            }
        }
        
        // Actualizar información del usuario en la navbar
        updateUserInfo();
    } else {
        // Si no está autenticado y no está en la página de login, redirigir al login
        if (!isLoginPage) {
            window.location.href = 'index.html';
        }
    }
}

// Actualizar información del usuario en la interfaz
function updateUserInfo() {
    const user = getCurrentUser();
    if (!user) return;
    
    // Actualizar avatar/iniciales
    const avatarElements = document.querySelectorAll('#userInitials, #avatarInitials');
    avatarElements.forEach(element => {
        if (user.name) {
            const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            element.textContent = initials;
        }
    });
    
    // Actualizar nombre de usuario
    const nameElements = document.querySelectorAll('#userName, #profileName');
    nameElements.forEach(element => {
        if (user.name) {
            element.textContent = user.name;
        }
    });
    
    // Actualizar email
    const emailElements = document.querySelectorAll('#profileEmail');
    emailElements.forEach(element => {
        if (user.email) {
            element.textContent = user.email;
        }
    });
    
    // Actualizar rol
    const roleElements = document.querySelectorAll('#profileRole');
    roleElements.forEach(element => {
        if (user.role) {
            const roleNames = {
                'admin': 'Administrador',
                'manager': 'Gerente',
                'operator': 'Operador',
                'viewer': 'Visualizador'
            };
            element.textContent = roleNames[user.role] || user.role;
        }
    });
}

// Función de login
async function login(email, password) {
    try {
        const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGIN), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Error en la autenticación');
        }
        
        // Guardar datos de autenticación
        saveAuthData(data.token, data.refreshToken, data.user);
        
        return { success: true, data };
    } catch (error) {
        console.error('Error en login:', error);
        return { success: false, message: error.message };
    }
}

// Función de logout
async function logout() {
    try {
        // Intentar hacer logout en el servidor
        const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGOUT), {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
    } catch (error) {
        console.error('Error en logout:', error);
    } finally {
        // Limpiar datos locales siempre
        clearAuthData();
        window.location.href = 'index.html';
    }
}

// Función para refrescar el token
async function refreshToken() {
    try {
        const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.REFRESH), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                refreshToken: APP_STATE.refreshToken
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Error al refrescar token');
        }
        
        // Actualizar token
        APP_STATE.token = data.token;
        localStorage.setItem(API_CONFIG.JWT.TOKEN_KEY, data.token);
        
        return { success: true, token: data.token };
    } catch (error) {
        console.error('Error al refrescar token:', error);
        clearAuthData();
        window.location.href = 'index.html';
        return { success: false, message: error.message };
    }
}

// Función para verificar el token
async function verifyToken() {
    if (!getToken()) {
        return { success: false, message: 'No hay token' };
    }
    
    try {
        const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.VERIFY), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Token inválido');
        }
        
        return { success: true, data };
    } catch (error) {
        console.error('Error al verificar token:', error);
        return { success: false, message: error.message };
    }
}

// Función para recuperar contraseña
async function forgotPassword(email) {
    try {
        const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Error al enviar correo de recuperación');
        }
        
        return { success: true, data };
    } catch (error) {
        console.error('Error en forgotPassword:', error);
        return { success: false, message: error.message };
    }
}

// Función para resetear contraseña
async function resetPassword(token, newPassword) {
    try {
        const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token, newPassword })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Error al resetear contraseña');
        }
        
        return { success: true, data };
    } catch (error) {
        console.error('Error en resetPassword:', error);
        return { success: false, message: error.message };
    }
}

// Función para cambiar contraseña
async function changePassword(currentPassword, newPassword) {
    try {
        const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.USERS.CHANGE_PASSWORD), {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Error al cambiar contraseña');
        }
        
        return { success: true, data };
    } catch (error) {
        console.error('Error en changePassword:', error);
        return { success: false, message: error.message };
    }
}

// Middleware para añadir token a las peticiones
function authHeader() {
    const token = getToken();
    if (token) {
        return { 'Authorization': `Bearer ${token}` };
    }
    return {};
}

// Inicializar eventos de autenticación
function initAuthEvents() {
    // Botones de logout
    const logoutButtons = document.querySelectorAll('#logoutBtn, #sidebarLogoutBtn');
    logoutButtons.forEach(button => {
        if (button) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }
    });
    
    // Verificar autenticación en páginas protegidas
    if (!window.location.pathname.includes('index.html') && 
        window.location.pathname !== '/' && 
        !window.location.pathname.includes('login')) {
        checkAuth();
    }
}

// Evento cuando el DOM está cargado
document.addEventListener('DOMContentLoaded', function() {
    initAuthEvents();
});

// Exportar funciones
window.login = login;
window.logout = logout;
window.refreshToken = refreshToken;
window.verifyToken = verifyToken;
window.forgotPassword = forgotPassword;
window.resetPassword = resetPassword;
window.changePassword = changePassword;
window.authHeader = authHeader;
window.checkAuth = checkAuth;
window.updateUserInfo = updateUserInfo;