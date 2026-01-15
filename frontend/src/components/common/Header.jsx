/**
 * Header.js
 * Componente de encabezado para la aplicación
 * Ubicación: E:\portafolio de desarrollo web\app web\proyectos basicos\inventarios basicos\frontend\src\components\common\Header.js
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../../assets/styles/common/Header.css';

const Header = () => {
    const [user, setUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Cargar información del usuario
    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    // Cargar notificaciones
    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/notifications', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    // Manejar cierre de sesión
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // Marcar notificación como leída
    const markNotificationAsRead = async (notificationId) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            // Actualizar notificaciones localmente
            setNotifications(prev => 
                prev.map(notif => 
                    notif.id === notificationId 
                        ? { ...notif, read: true }
                        : notif
                )
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Marcar todas como leídas
    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await fetch('http://localhost:5000/api/notifications/read-all', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            setNotifications(prev => 
                prev.map(notif => ({ ...notif, read: true }))
            );
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    // Contar notificaciones no leídas
    const unreadCount = notifications.filter(n => !n.read).length;

    // Navegación principal
    const mainNavItems = [
        { path: '/', label: 'Dashboard', icon: '📊' },
        { path: '/products', label: 'Productos', icon: '📦' },
        { path: '/categories', label: 'Categorías', icon: '📁' },
        { path: '/suppliers', label: 'Proveedores', icon: '🏢' },
        { path: '/inventory', label: 'Inventario', icon: '📋' },
        { path: '/reports', label: 'Reportes', icon: '📈' },
    ];

    return (
        <header className="app-header">
            {/* Logo y nombre de la aplicación */}
            <div className="header-left">
                <div className="logo-container">
                    <div className="logo">📦</div>
                    <div className="app-name">
                        <h1>InventarioPro</h1>
                        <span className="app-tagline">Gestión Inteligente</span>
                    </div>
                </div>

                {/* Navegación principal */}
                <nav className="main-nav">
                    <ul className="nav-list">
                        {mainNavItems.map(item => (
                            <li key={item.path} className="nav-item">
                                <Link 
                                    to={item.path}
                                    className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                                >
                                    <span className="nav-icon">{item.icon}</span>
                                    <span className="nav-label">{item.label}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>

            {/* Controles del usuario */}
            <div className="header-right">
                {/* Barra de búsqueda global */}
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Buscar productos, categorías, proveedores..."
                        className="search-input"
                    />
                    <button className="search-btn">
                        🔍
                    </button>
                </div>

                {/* Botón de menú móvil */}
                <button className="mobile-menu-btn">
                    ☰
                </button>

                {/* Iconos de acción */}
                <div className="header-actions">
                    {/* Notificaciones */}
                    <div className="notification-container">
                        <button 
                            className="notification-btn"
                            onClick={() => setShowNotifications(!showNotifications)}
                        >
                            🔔
                            {unreadCount > 0 && (
                                <span className="notification-badge">{unreadCount}</span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="notification-dropdown">
                                <div className="notification-header">
                                    <h3>Notificaciones</h3>
                                    {unreadCount > 0 && (
                                        <button 
                                            className="mark-all-read"
                                            onClick={markAllAsRead}
                                        >
                                            Marcar todas como leídas
                                        </button>
                                    )}
                                </div>
                                
                                <div className="notification-list">
                                    {notifications.length > 0 ? (
                                        notifications.map(notification => (
                                            <div 
                                                key={notification.id}
                                                className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                                                onClick={() => markNotificationAsRead(notification.id)}
                                            >
                                                <div className="notification-icon">
                                                    {notification.type === 'warning' ? '⚠️' : 
                                                     notification.type === 'success' ? '✅' : 'ℹ️'}
                                                </div>
                                                <div className="notification-content">
                                                    <p className="notification-message">{notification.message}</p>
                                                    <span className="notification-time">
                                                        {new Date(notification.createdAt).toLocaleTimeString([], { 
                                                            hour: '2-digit', 
                                                            minute: '2-digit' 
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-notifications">
                                            No hay notificaciones nuevas
                                        </div>
                                    )}
                                </div>

                                <div className="notification-footer">
                                    <Link to="/notifications">Ver todas las notificaciones</Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Modo oscuro/claro */}
                    <button className="theme-toggle">
                        🌙
                    </button>

                    {/* Perfil del usuario */}
                    <div className="user-profile">
                        <button 
                            className="user-btn"
                            onClick={() => setShowUserMenu(!showUserMenu)}
                        >
                            <div className="user-avatar">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="user-info">
                                <span className="user-name">{user?.name || 'Usuario'}</span>
                                <span className="user-role">{user?.role || 'Administrador'}</span>
                            </div>
                            <span className="dropdown-arrow">▼</span>
                        </button>

                        {showUserMenu && (
                            <div className="user-menu">
                                <div className="user-menu-header">
                                    <div className="menu-avatar">
                                        {user?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div className="menu-user-info">
                                        <h4>{user?.name || 'Usuario'}</h4>
                                        <p>{user?.email || 'usuario@ejemplo.com'}</p>
                                    </div>
                                </div>

                                <div className="user-menu-items">
                                    <Link to="/profile" className="menu-item">
                                        👤 Mi Perfil
                                    </Link>
                                    <Link to="/settings" className="menu-item">
                                        ⚙️ Configuración
                                    </Link>
                                    <Link to="/help" className="menu-item">
                                        ❓ Ayuda
                                    </Link>
                                    <button className="menu-item logout" onClick={handleLogout}>
                                        🚪 Cerrar Sesión
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;