/**
 * Lógica específica para la página de login
 */

document.addEventListener('DOMContentLoaded', function() {
    // Verificar si ya está autenticado
    checkAuth();
    
    // Elementos del DOM
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberCheckbox = document.getElementById('remember');
    const forgotPasswordLink = document.getElementById('forgotPassword');
    const loginText = document.getElementById('loginText');
    const loginLoading = document.getElementById('loginLoading');
    
    // Cargar credenciales guardadas si existen
    loadSavedCredentials();
    
    // Manejar envío del formulario
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Manejar olvido de contraseña
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', handleForgotPassword);
    }
    
    async function handleLogin(e) {
        e.preventDefault();
        
        // Validar formulario
        if (!validateForm()) {
            return;
        }
        
        // Mostrar loading
        setLoading(true);
        
        // Obtener credenciales
        const credentials = {
            email: emailInput.value.trim(),
            password: passwordInput.value
        };
        
        // Intentar login
        const result = await login(credentials.email, credentials.password);
        
        if (result.success) {
            // Guardar credenciales si se seleccionó "Recordar sesión"
            if (rememberCheckbox.checked) {
                saveCredentials(credentials.email);
            } else {
                clearSavedCredentials();
            }
            
            // Mostrar mensaje de éxito
            showNotification('¡Inicio de sesión exitoso!', 'success');
            
            // Redirigir al dashboard después de un breve delay
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            // Mostrar error
            showNotification(result.message || 'Error al iniciar sesión', 'error');
            setLoading(false);
        }
    }
    
    async function handleForgotPassword(e) {
        e.preventDefault();
        
        const email = prompt('Por favor, introduce tu correo electrónico para recuperar tu contraseña:');
        
        if (!email) {
            return;
        }
        
        if (!isValidEmail(email)) {
            showNotification('Por favor, introduce un correo electrónico válido', 'error');
            return;
        }
        
        setLoading(true, 'Enviando correo...');
        
        const result = await forgotPassword(email);
        
        setLoading(false);
        
        if (result.success) {
            showNotification('Se ha enviado un correo con las instrucciones para recuperar tu contraseña', 'success');
        } else {
            showNotification(result.message || 'Error al enviar el correo de recuperación', 'error');
        }
    }
    
    function validateForm() {
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        // Validar email
        if (!email) {
            showNotification('Por favor, introduce tu correo electrónico', 'error');
            emailInput.focus();
            return false;
        }
        
        if (!isValidEmail(email)) {
            showNotification('Por favor, introduce un correo electrónico válido', 'error');
            emailInput.focus();
            return false;
        }
        
        // Validar contraseña
        if (!password) {
            showNotification('Por favor, introduce tu contraseña', 'error');
            passwordInput.focus();
            return false;
        }
        
        if (password.length < 6) {
            showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
            passwordInput.focus();
            return false;
        }
        
        return true;
    }
    
    function setLoading(isLoading, text = 'Iniciando sesión...') {
        if (isLoading) {
            loginText.style.display = 'none';
            loginLoading.style.display = 'inline-block';
            emailInput.disabled = true;
            passwordInput.disabled = true;
            rememberCheckbox.disabled = true;
        } else {
            loginText.style.display = 'inline';
            loginLoading.style.display = 'none';
            emailInput.disabled = false;
            passwordInput.disabled = false;
            rememberCheckbox.disabled = false;
        }
    }
    
    function saveCredentials(email) {
        localStorage.setItem('remembered_email', email);
    }
    
    function clearSavedCredentials() {
        localStorage.removeItem('remembered_email');
    }
    
    function loadSavedCredentials() {
        const savedEmail = localStorage.getItem('remembered_email');
        if (savedEmail && emailInput) {
            emailInput.value = savedEmail;
            rememberCheckbox.checked = true;
        }
    }
    
    // Manejar tecla Enter en campos de formulario
    emailInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            passwordInput.focus();
        }
    });
    
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loginForm.dispatchEvent(new Event('submit'));
        }
    });
    
    // Animación de entrada para el formulario
    setTimeout(() => {
        const loginContainer = document.querySelector('.login-container');
        if (loginContainer) {
            loginContainer.classList.add('loaded');
        }
    }, 100);
});