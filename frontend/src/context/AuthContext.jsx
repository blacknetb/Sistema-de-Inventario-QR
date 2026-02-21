import React, { createContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Verificar si hay un usuario en localStorage al cargar la app
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      // Simular llamada a API
      // En producción, aquí iría la llamada real a tu backend
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simular validación
      if (email === 'admin@ejemplo.com' && password === 'admin123') {
        const userData = {
          id: 1,
          name: 'Admin User',
          email: email,
          role: 'admin',
          avatar: null
        };
        const token = 'mock-jwt-token-' + Math.random().toString(36).substr(2);

        // Guardar en localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);

        setUser(userData);
        return { success: true, user: userData };
      } else {
        throw new Error('Credenciales inválidas');
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Validar datos
      if (!userData.email || !userData.password || !userData.name) {
        throw new Error('Todos los campos son requeridos');
      }

      // Simular registro exitoso
      const newUser = {
        id: Date.now(),
        name: userData.name,
        email: userData.email,
        role: 'user',
        avatar: null
      };
      const token = 'mock-jwt-token-' + Math.random().toString(36).substr(2);

      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('token', token);

      setUser(newUser);
      return { success: true, user: newUser };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateProfile = async (updatedData) => {
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
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simular validación de contraseña actual
      if (currentPassword !== 'admin123') {
        throw new Error('Contraseña actual incorrecta');
      }

      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission) => {
    if (!user) return false;

    // Definir permisos por rol
    const permissions = {
      admin: ['create', 'read', 'update', 'delete', 'manage_users', 'export', 'import'],
      manager: ['create', 'read', 'update', 'export'],
      user: ['read']
    };

    return permissions[user.role]?.includes(permission) || false;
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    hasPermission,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;