import { useState, useEffect, useCallback } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Cargar usuario del localStorage al iniciar
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
      setIsAuthenticated(true);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      // Simular llamada API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Validación básica
      if (!email || !password) {
        throw new Error('Email y contraseña son requeridos');
      }

      // Simular diferentes usuarios
      let userData = null;
      let tokenData = null;

      if (email === 'admin@ejemplo.com' && password === 'admin123') {
        userData = {
          id: 1,
          name: 'Admin Usuario',
          email: email,
          role: 'admin',
          avatar: null,
          permissions: ['all']
        };
        tokenData = 'token-admin-' + Date.now();
      } else if (email === 'user@ejemplo.com' && password === 'user123') {
        userData = {
          id: 2,
          name: 'Usuario Regular',
          email: email,
          role: 'user',
          avatar: null,
          permissions: ['read', 'create']
        };
        tokenData = 'token-user-' + Date.now();
      } else {
        throw new Error('Credenciales inválidas');
      }

      // Guardar en localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', tokenData);

      setUser(userData);
      setToken(tokenData);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Validaciones
      if (!userData.name || !userData.email || !userData.password) {
        throw new Error('Todos los campos son requeridos');
      }

      if (userData.password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      if (userData.password !== userData.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      // Crear nuevo usuario
      const newUser = {
        id: Date.now(),
        name: userData.name,
        email: userData.email,
        role: 'user',
        avatar: null,
        permissions: ['read', 'create'],
        createdAt: new Date().toISOString()
      };

      const newToken = 'token-' + Date.now();

      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('token', newToken);

      setUser(newUser);
      setToken(newToken);
      setIsAuthenticated(true);

      return { success: true, user: newUser };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  }, []);

  const updateProfile = useCallback(async (updatedData) => {
    try {
      setLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedUser = { ...user, ...updatedData };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      return { success: true, user: updatedUser };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user]);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Validar contraseña actual (simulado)
      if (currentPassword !== 'admin123' && currentPassword !== 'user123') {
        throw new Error('Contraseña actual incorrecta');
      }

      if (newPassword.length < 6) {
        throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
      }

      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const requestPasswordReset = useCallback(async (email) => {
    try {
      setLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!email) {
        throw new Error('Email es requerido');
      }

      // Aquí iría la lógica real de envío de email
      return { 
        success: true, 
        message: 'Se ha enviado un enlace de recuperación a tu email' 
      };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (token, newPassword) => {
    try {
      setLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 1000));

      if (newPassword.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      return { success: true, message: 'Contraseña actualizada exitosamente' };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const hasPermission = useCallback((permission) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions?.includes(permission) || false;
  }, [user]);

  const refreshToken = useCallback(async () => {
    try {
      setLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newToken = 'token-refreshed-' + Date.now();
      localStorage.setItem('token', newToken);
      setToken(newToken);
      
      return { success: true, token: newToken };
    } catch (err) {
      setError('Error al refrescar token');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    requestPasswordReset,
    resetPassword,
    hasPermission,
    refreshToken
  };
};

export default useAuth;