// Contexto de autenticación
import React, { createContext, useState, useContext, useCallback } from 'react';
import axios from 'axios';

// Crear el contexto de autenticación
export const authContext = createContext();

// URL base del backend
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Proveedor del contexto de autenticación
export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('inventory-token'));

    // Configurar axios con token por defecto
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Verificar autenticación
    const checkAuth = useCallback(async () => {
        if (!token) {
            setIsAuthenticated(false);
            return;
        }

        try {
            setAuthLoading(true);
            const response = await axios.get(`${API_URL}/auth/verify`);
            
            if (response.data.valid) {
                setIsAuthenticated(true);
                setUser(response.data.user);
            } else {
                localStorage.removeItem('inventory-token');
                setIsAuthenticated(false);
                setUser(null);
                setToken(null);
                delete axios.defaults.headers.common['Authorization'];
            }
        } catch (error) {
            localStorage.removeItem('inventory-token');
            setIsAuthenticated(false);
            setUser(null);
            setToken(null);
            delete axios.defaults.headers.common['Authorization'];
        } finally {
            setAuthLoading(false);
        }
    }, [token]);

    // Login de usuario
    const login = async (email, password) => {
        try {
            setAuthLoading(true);
            setAuthError(null);
            
            const response = await axios.post(`${API_URL}/auth/login`, {
                email,
                password
            });

            const { token, user } = response.data;
            
            // Guardar token en localStorage
            localStorage.setItem('inventory-token', token);
            setToken(token);
            
            // Configurar axios
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // Actualizar estado
            setIsAuthenticated(true);
            setUser(user);
            
            return { success: true, user };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error en el login';
            setAuthError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setAuthLoading(false);
        }
    };

    // Registro de usuario
    const register = async (userData) => {
        try {
            setAuthLoading(true);
            setAuthError(null);
            
            const response = await axios.post(`${API_URL}/auth/register`, userData);
            
            const { token, user } = response.data;
            
            // Guardar token en localStorage
            localStorage.setItem('inventory-token', token);
            setToken(token);
            
            // Configurar axios
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // Actualizar estado
            setIsAuthenticated(true);
            setUser(user);
            
            return { success: true, user };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error en el registro';
            setAuthError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setAuthLoading(false);
        }
    };

    // Logout de usuario
    const logout = () => {
        localStorage.removeItem('inventory-token');
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    // Actualizar perfil de usuario
    const updateProfile = async (userData) => {
        try {
            setAuthLoading(true);
            setAuthError(null);
            
            const response = await axios.put(`${API_URL}/auth/profile`, userData);
            
            setUser(response.data.user);
            return { success: true, user: response.data.user };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error al actualizar perfil';
            setAuthError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setAuthLoading(false);
        }
    };

    // Cambiar contraseña
    const changePassword = async (currentPassword, newPassword) => {
        try {
            setAuthLoading(true);
            setAuthError(null);
            
            await axios.put(`${API_URL}/auth/change-password`, {
                currentPassword,
                newPassword
            });
            
            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error al cambiar contraseña';
            setAuthError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setAuthLoading(false);
        }
    };

    // Limpiar errores
    const clearAuthError = () => {
        setAuthError(null);
    };

    // Valor del contexto
    const value = {
        isAuthenticated,
        user,
        authLoading,
        authError,
        token,
        checkAuth,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        clearAuthError
    };

    return (
        <authContext.Provider value={value}>
            {children}
        </authContext.Provider>
    );
};

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => {
    const context = useContext(authContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de AuthProvider');
    }
    return context;
};