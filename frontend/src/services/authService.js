import { post, setAuthToken, clearAuthToken } from './api';

const authService = {
  // Iniciar sesión
  login: async (email, password) => {
    try {
      // En un entorno real, esto haría una llamada a la API
      // Por ahora, simulamos una respuesta
      
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Validación básica (en producción, esto vendría del backend)
      if (!email || !password) {
        throw new Error('Email y contraseña son requeridos');
      }
      
      // Simular credenciales válidas
      const validUsers = [
        { email: 'admin@inventario.com', password: 'admin123', role: 'admin' },
        { email: 'usuario@inventario.com', password: 'usuario123', role: 'user' }
      ];
      
      const user = validUsers.find(u => u.email === email && u.password === password);
      
      if (!user) {
        throw new Error('Credenciales inválidas');
      }
      
      // Crear token simulado
      const token = btoa(JSON.stringify({
        email: user.email,
        role: user.role,
        exp: Date.now() + 24 * 60 * 60 * 1000 // 24 horas
      }));
      
      // Guardar token
      setAuthToken(token);
      
      // Guardar información del usuario
      const userData = {
        id: 1,
        email: user.email,
        name: user.email.split('@')[0],
        role: user.role,
        avatar: `https://ui-avatars.com/api/?name=${user.email.split('@')[0]}&background=3498db&color=fff`
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      
      return {
        success: true,
        data: {
          token,
          user: userData
        },
        message: 'Inicio de sesión exitoso'
      };
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  },

  // Cerrar sesión
  logout: () => {
    clearAuthToken();
    localStorage.removeItem('user');
    return { success: true, message: 'Sesión cerrada exitosamente' };
  },

  // Registrar nuevo usuario
  register: async (userData) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!userData.email || !userData.password || !userData.name) {
        throw new Error('Todos los campos son requeridos');
      }
      
      // Simular creación de usuario
      const newUser = {
        id: Date.now(),
        ...userData,
        role: 'user',
        createdAt: new Date().toISOString()
      };
      
      return {
        success: true,
        data: newUser,
        message: 'Usuario registrado exitosamente'
      };
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  },

  // Verificar si el usuario está autenticado
  isAuthenticated: () => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    if (!token || !user) return false;
    
    try {
      // Verificar expiración del token (simulado)
      const tokenData = JSON.parse(atob(token));
      return tokenData.exp > Date.now();
    } catch {
      return false;
    }
  },

  // Obtener información del usuario actual
  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      return null;
    }
  },

  // Actualizar perfil de usuario
  updateProfile: async (userData) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }
      
      const updatedUser = {
        ...currentUser,
        ...userData,
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return {
        success: true,
        data: updatedUser,
        message: 'Perfil actualizado exitosamente'
      };
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      throw error;
    }
  },

  // Cambiar contraseña
  changePassword: async (currentPassword, newPassword) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (!currentPassword || !newPassword) {
        throw new Error('Ambas contraseñas son requeridas');
      }
      
      if (newPassword.length < 6) {
        throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
      }
      
      return {
        success: true,
        message: 'Contraseña cambiada exitosamente'
      };
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      throw error;
    }
  }
};

export default authService;