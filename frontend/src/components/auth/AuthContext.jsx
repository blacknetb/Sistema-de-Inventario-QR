import React, { createContext, useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/AUTH/auth.css';

// Crear el contexto de autenticación
const AuthContext = createContext();

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Verificar autenticación al cargar
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('token');
                const userData = localStorage.getItem('user');
                
                if (token && userData) {
                    // Verificar token con el backend
                    const response = await fetch('http://localhost:3000/api/auth/verify', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (response.ok) {
                        setUser(JSON.parse(userData));
                    } else {
                        // Token inválido o expirado
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setUser(null);
                    }
                }
            } catch (err) {
                console.error('Error verificando autenticación:', err);
                setError('Error de conexión con el servidor');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    // Función para iniciar sesión
    const login = async (email, password) => {
        try {
            setError(null);
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Guardar token y usuario
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setUser(data.user);
                return { success: true, data };
            } else {
                setError(data.message || 'Error al iniciar sesión');
                return { success: false, error: data.message };
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
            return { success: false, error: 'Error de conexión' };
        }
    };

    // Función para registrar usuario
    const register = async (userData) => {
        try {
            setError(null);
            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data };
            } else {
                setError(data.message || 'Error al registrar usuario');
                return { success: false, error: data.message };
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
            return { success: false, error: 'Error de conexión' };
        }
    };

    // Función para cerrar sesión
    const logout = async () => {
        try {
            const token = localStorage.getItem('token');
            
            if (token) {
                // Opcional: Notificar al backend sobre el logout
                await fetch('http://localhost:3000/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
        } catch (err) {
            console.error('Error durante logout:', err);
        } finally {
            // Limpiar localStorage independientemente del resultado
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
        }
    };

    // Función para recuperar contraseña
    const forgotPassword = async (email) => {
        try {
            setError(null);
            const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data };
            } else {
                setError(data.message || 'Error al enviar correo de recuperación');
                return { success: false, error: data.message };
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
            return { success: false, error: 'Error de conexión' };
        }
    };

    // Función para resetear contraseña
    const resetPassword = async (token, password) => {
        try {
            setError(null);
            const response = await fetch('http://localhost:3000/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, password }),
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data };
            } else {
                setError(data.message || 'Error al restablecer contraseña');
                return { success: false, error: data.message };
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
            return { success: false, error: 'Error de conexión' };
        }
    };

    // Función para actualizar perfil
    const updateProfile = async (userData) => {
        try {
            setError(null);
            const token = localStorage.getItem('token');
            
            const response = await fetch('http://localhost:3000/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();

            if (response.ok) {
                // Actualizar usuario en estado y localStorage
                const updatedUser = { ...user, ...data.user };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                return { success: true, data };
            } else {
                setError(data.message || 'Error al actualizar perfil');
                return { success: false, error: data.message };
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
            return { success: false, error: 'Error de conexión' };
        }
    };

    // Función para cambiar contraseña
    const changePassword = async (currentPassword, newPassword) => {
        try {
            setError(null);
            const token = localStorage.getItem('token');
            
            const response = await fetch('http://localhost:3000/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data };
            } else {
                setError(data.message || 'Error al cambiar contraseña');
                return { success: false, error: data.message };
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
            return { success: false, error: 'Error de conexión' };
        }
    };

    // Función para obtener token de autenticación
    const getAuthHeader = () => {
        const token = localStorage.getItem('token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    };

    // Valores del contexto
    const value = {
        user,
        loading,
        error,
        setError,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        updateProfile,
        changePassword,
        getAuthHeader,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired
};

export default AuthContext;