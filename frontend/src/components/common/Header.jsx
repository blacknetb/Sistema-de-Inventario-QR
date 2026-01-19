import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import '../../assets/styles/Common/common.css';

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        // Simular notificaciones
        const mockNotifications = [
            {
                id: 1,
                title: 'Inventario Bajo',
                message: 'El producto "Mouse Logitech" está por debajo del mínimo',
                time: 'Hace 2 horas',
                read: false,
                type: 'warning'
            },
            {
                id: 2,
                title: 'Producto Agregado',
                message: 'Se agregó "Monitor Samsung 24" al inventario',
                time: 'Hace 4 horas',
                read: false,
                type: 'success'
            },
            {
                id: 3,
                title: 'Reporte Generado',
                message: 'El reporte mensual de inventario está listo',
                time: 'Ayer',
                read: true,
                type: 'info'
            }
        ];
        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.filter(n => !n.read).length);
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
            setSearchQuery('');
        }
    };

    const markNotificationAsRead = (id) => {
        setNotifications(notifications.map(notif =>
            notif.id === id ? { ...notif, read: true } : notif
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(notif => ({ ...notif, read: true })));
        setUnreadCount(0);
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'warning': return 'fas fa-exclamation-triangle';
            case 'success': return 'fas fa-check-circle';
            case 'info': return 'fas fa-info-circle';
            case 'error': return 'fas fa-times-circle';
            default: return 'fas fa-bell';
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'warning': return 'warning';
            case 'success': return 'success';
            case 'info': return 'info';
            case 'error': return 'error';
            default: return 'primary';
        }
    };

    return (
        <header className="header">
            <div className="header-container">
                {/* Logo y toggle del menú móvil */}
                <div className="header-left">
                    <button
                        className="menu-toggle"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        <i className="fas fa-bars"></i>
                    </button>
                    
                    <Link to="/dashboard" className="logo">
                        <div className="logo-icon">
                            <i className="fas fa-boxes"></i>
                        </div>
                        <div className="logo-text">
                            <span className="logo-primary">Inventario</span>
                            <span className="logo-secondary">Básico</span>
                        </div>
                    </Link>
                </div>

                {/* Barra de búsqueda */}
                <div className="header-center">
                    <form onSubmit={handleSearch} className="search-form">
                        <div className="search-box">
                            <i className="fas fa-search"></i>
                            <input
                                type="text"
                                placeholder="Buscar productos, categorías, proveedores..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    className="clear-search"
                                    onClick={() => setSearchQuery('')}
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            )}
                        </div>
                        <button type="submit" className="btn btn-search">
                            Buscar
                        </button>
                    </form>
                </div>

                {/* Iconos de usuario */}
                <div className="header-right">
                    {/* Botón de escaneo QR */}
                    <button
                        className="header-action"
                        onClick={() => navigate('/scan')}
                        title="Escanear código QR"
                    >
                        <i className="fas fa-qrcode"></i>
                    </button>

                    {/* Notificaciones */}
                    <div className="notification-wrapper">
                        <button
                            className="header-action"
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            title="Notificaciones"
                        >
                            <i className="fas fa-bell"></i>
                            {unreadCount > 0 && (
                                <span className="notification-badge">{unreadCount}</span>
                            )}
                        </button>

                        {isNotificationsOpen && (
                            <>
                                <div
                                    className="notification-backdrop"
                                    onClick={() => setIsNotificationsOpen(false)}
                                />
                                <div className="notification-dropdown">
                                    <div className="notification-header">
                                        <h4>Notificaciones</h4>
                                        {unreadCount > 0 && (
                                            <button
                                                className="btn-mark-all"
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
                                                    className={`notification-item ${notification.read ? 'read' : 'unread'} ${getNotificationColor(notification.type)}`}
                                                    onClick={() => markNotificationAsRead(notification.id)}
                                                >
                                                    <div className="notification-icon">
                                                        <i className={getNotificationIcon(notification.type)}></i>
                                                    </div>
                                                    <div className="notification-content">
                                                        <h5>{notification.title}</h5>
                                                        <p>{notification.message}</p>
                                                        <span className="notification-time">
                                                            {notification.time}
                                                        </span>
                                                    </div>
                                                    {!notification.read && (
                                                        <div className="notification-indicator"></div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="notification-empty">
                                                <i className="fas fa-bell-slash"></i>
                                                <p>No hay notificaciones</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="notification-footer">
                                        <Link to="/notifications">
                                            Ver todas las notificaciones
                                        </Link>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Menú de usuario */}
                    <div className="user-menu-wrapper">
                        <button
                            className="user-profile"
                            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                        >
                            <div className="user-avatar">
                                {user?.nombre?.charAt(0) || 'U'}
                            </div>
                            <div className="user-info">
                                <span className="user-name">
                                    {user?.nombre || 'Usuario'}
                                </span>
                                <span className="user-role">
                                    {user?.rol || 'Usuario'}
                                </span>
                            </div>
                            <i className={`fas fa-chevron-${isProfileMenuOpen ? 'up' : 'down'}`}></i>
                        </button>

                        {isProfileMenuOpen && (
                            <>
                                <div
                                    className="user-menu-backdrop"
                                    onClick={() => setIsProfileMenuOpen(false)}
                                />
                                <div className="user-menu-dropdown">
                                    <div className="user-menu-header">
                                        <div className="menu-user-avatar">
                                            {user?.nombre?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <h4>{user?.nombre || 'Usuario'}</h4>
                                            <p>{user?.email || 'usuario@ejemplo.com'}</p>
                                            <span className="user-role-badge">
                                                {user?.rol || 'Usuario'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="user-menu-items">
                                        <Link
                                            to="/profile"
                                            className="menu-item"
                                            onClick={() => setIsProfileMenuOpen(false)}
                                        >
                                            <i className="fas fa-user"></i>
                                            <span>Mi Perfil</span>
                                        </Link>
                                        
                                        <Link
                                            to="/settings"
                                            className="menu-item"
                                            onClick={() => setIsProfileMenuOpen(false)}
                                        >
                                            <i className="fas fa-cog"></i>
                                            <span>Configuración</span>
                                        </Link>
                                        
                                        <Link
                                            to="/help"
                                            className="menu-item"
                                            onClick={() => setIsProfileMenuOpen(false)}
                                        >
                                            <i className="fas fa-question-circle"></i>
                                            <span>Ayuda</span>
                                        </Link>
                                        
                                        <div className="menu-divider"></div>
                                        
                                        <button
                                            className="menu-item logout"
                                            onClick={handleLogout}
                                        >
                                            <i className="fas fa-sign-out-alt"></i>
                                            <span>Cerrar Sesión</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Toggle de tema */}
                    <button
                        className="theme-toggle"
                        onClick={() => {
                            document.body.classList.toggle('dark-theme');
                            localStorage.setItem('theme', 
                                document.body.classList.contains('dark-theme') ? 'dark' : 'light'
                            );
                        }}
                        title="Cambiar tema"
                    >
                        <i className="fas fa-moon"></i>
                        <i className="fas fa-sun"></i>
                    </button>
                </div>
            </div>

            {/* Menú móvil */}
            {isMenuOpen && (
                <div className="mobile-menu">
                    <div className="mobile-menu-header">
                        <h3>Menú</h3>
                        <button
                            className="close-menu"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <nav className="mobile-nav">
                        <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                            <i className="fas fa-home"></i>
                            <span>Dashboard</span>
                        </Link>
                        <Link to="/products" onClick={() => setIsMenuOpen(false)}>
                            <i className="fas fa-box"></i>
                            <span>Productos</span>
                        </Link>
                        <Link to="/categories" onClick={() => setIsMenuOpen(false)}>
                            <i className="fas fa-folder"></i>
                            <span>Categorías</span>
                        </Link>
                        <Link to="/suppliers" onClick={() => setIsMenuOpen(false)}>
                            <i className="fas fa-truck"></i>
                            <span>Proveedores</span>
                        </Link>
                        <Link to="/reports" onClick={() => setIsMenuOpen(false)}>
                            <i className="fas fa-chart-bar"></i>
                            <span>Reportes</span>
                        </Link>
                        <Link to="/settings" onClick={() => setIsMenuOpen(false)}>
                            <i className="fas fa-cog"></i>
                            <span>Configuración</span>
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Header;