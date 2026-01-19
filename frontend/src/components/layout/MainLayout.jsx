import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import '../../assets/styles/layout/layout.css';

const MainLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, markAsRead, clearAll } = useNotification();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const unreadNotifications = notifications.filter(n => !n.read).length;

  // Cerrar menús al cambiar de ruta
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowNotifications(false);
    setShowUserMenu(false);
  }, [location.pathname]);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notifications-dropdown')) {
        setShowNotifications(false);
      }
      if (showUserMenu && !event.target.closest('.user-menu-dropdown')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showNotifications, showUserMenu]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const navItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard', badge: null },
    { path: '/products', icon: '📦', label: 'Productos', badge: null },
    { path: '/inventory', icon: '📋', label: 'Inventario', badge: null },
    { path: '/scanner', icon: '📷', label: 'Escáner QR', badge: null },
    { path: '/reports', icon: '📈', label: 'Reportes', badge: null },
    { path: '/categories', icon: '🏷️', label: 'Categorías', badge: null },
    { path: '/suppliers', icon: '🏢', label: 'Proveedores', badge: null },
    { path: '/transactions', icon: '💸', label: 'Transacciones', badge: null },
    { path: '/qr-management', icon: '🔲', label: 'Gestión QR', badge: null },
    { path: '/admin', icon: '⚙️', label: 'Admin', badge: null },
  ];

  const quickActions = [
    { icon: '➕', label: 'Nuevo Producto', onClick: () => navigate('/products/new') },
    { icon: '📷', label: 'Escanear QR', onClick: () => navigate('/scanner') },
    { icon: '📄', label: 'Generar Reporte', onClick: () => navigate('/reports') },
    { icon: '🔔', label: 'Ver Notificaciones', onClick: () => setShowNotifications(true) },
  ];

  return (
    <div className="main-layout">
      {/* Header */}
      <header className="main-header">
        <div className="header-left">
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Ocultar sidebar' : 'Mostrar sidebar'}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          <Link to="/dashboard" className="header-logo">
            <div className="logo-icon">QR</div>
            <div className="logo-text">
              <span className="logo-title">Inventario QR</span>
              <span className="logo-subtitle">Sistema de Gestión</span>
            </div>
          </Link>
        </div>

        <div className="header-center">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="search"
              placeholder="Buscar productos, categorías..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>
        </div>

        <div className="header-right">
          {/* Botón móvil */}
          <button 
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menú móvil"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Acciones rápidas */}
          <div className="quick-actions">
            {quickActions.slice(0, 3).map((action, index) => (
              <button
                key={index}
                className="quick-action-button"
                onClick={action.onClick}
                title={action.label}
              >
                <span className="quick-action-icon">{action.icon}</span>
              </button>
            ))}
          </div>

          {/* Notificaciones */}
          <div className="notifications-wrapper">
            <button 
              className="notifications-button"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notificaciones"
            >
              <span className="notifications-icon">🔔</span>
              {unreadNotifications > 0 && (
                <span className="notifications-badge">{unreadNotifications}</span>
              )}
            </button>

            {showNotifications && (
              <div className="notifications-dropdown">
                <div className="notifications-header">
                  <h3>Notificaciones</h3>
                  {unreadNotifications > 0 && (
                    <button 
                      className="mark-all-read"
                      onClick={() => notifications.forEach(n => markAsRead(n.id))}
                    >
                      Marcar todo como leído
                    </button>
                  )}
                </div>
                
                <div className="notifications-list">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 5).map(notification => (
                      <div 
                        key={notification.id} 
                        className={`notification-item ${!notification.read ? 'unread' : ''}`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="notification-icon">{notification.icon}</div>
                        <div className="notification-content">
                          <p className="notification-title">{notification.title}</p>
                          <p className="notification-message">{notification.message}</p>
                          <span className="notification-time">{notification.time}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-notifications">
                      <p>No hay notificaciones</p>
                    </div>
                  )}
                </div>
                
                {notifications.length > 0 && (
                  <div className="notifications-footer">
                    <Link to="/notifications">Ver todas</Link>
                    <button onClick={clearAll}>Limpiar todo</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tema */}
          <button 
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Usuario */}
          <div className="user-menu-wrapper">
            <button 
              className="user-menu-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-label="Menú de usuario"
            >
              <div className="user-avatar">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="user-info">
                <span className="user-name">{user?.name || 'Usuario'}</span>
                <span className="user-role">{user?.role || 'Administrador'}</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M19 9L12 16L5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {showUserMenu && (
              <div className="user-menu-dropdown">
                <div className="user-menu-header">
                  <div className="user-avatar-large">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="user-details">
                    <h4>{user?.name || 'Usuario'}</h4>
                    <p>{user?.email || 'usuario@ejemplo.com'}</p>
                    <span className="user-role-badge">{user?.role || 'Administrador'}</span>
                  </div>
                </div>
                
                <div className="user-menu-items">
                  <Link to="/profile" className="user-menu-item">
                    <span className="menu-item-icon">👤</span>
                    <span>Mi Perfil</span>
                  </Link>
                  <Link to="/settings" className="user-menu-item">
                    <span className="menu-item-icon">⚙️</span>
                    <span>Configuración</span>
                  </Link>
                  <Link to="/help" className="user-menu-item">
                    <span className="menu-item-icon">❓</span>
                    <span>Ayuda</span>
                  </Link>
                  <div className="menu-divider"></div>
                  <button className="user-menu-item logout" onClick={handleLogout}>
                    <span className="menu-item-icon">🚪</span>
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`main-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span className="sidebar-link-text">{item.label}</span>
              {item.badge && <span className="sidebar-link-badge">{item.badge}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-stats">
            <div className="stat-item">
              <span className="stat-label">Productos</span>
              <span className="stat-value">127</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Bajo Stock</span>
              <span className="stat-value warning">12</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Valor Total</span>
              <span className="stat-value">$45,230</span>
            </div>
          </div>
          
          <div className="sidebar-help">
            <Link to="/help" className="help-link">
              <span className="help-icon">❓</span>
              <span>Ayuda y Soporte</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Menú móvil */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay">
          <div className="mobile-menu">
            <div className="mobile-menu-header">
              <h3>Menú</h3>
              <button 
                className="close-menu"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Cerrar menú"
              >
                ✕
              </button>
            </div>
            
            <nav className="mobile-nav">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`mobile-link ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="mobile-link-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge && <span className="mobile-link-badge">{item.badge}</span>}
                </Link>
              ))}
            </nav>
            
            <div className="mobile-actions">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  className="mobile-action-button"
                  onClick={() => {
                    action.onClick();
                    setMobileMenuOpen(false);
                  }}
                >
                  <span className="action-icon">{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="main-footer">
        <div className="footer-content">
          <div className="footer-left">
            <p className="copyright">
              © {new Date().getFullYear()} Sistema de Inventario QR v{window.GLOBAL_CONFIG?.app?.version || '1.0.0'}
            </p>
          </div>
          
          <div className="footer-center">
            <div className="status-indicators">
              <span className="status-item online">
                <span className="status-dot"></span>
                Sistema Online
              </span>
              <span className="status-item">
                <span className="status-dot"></span>
                API: {window.GLOBAL_CONFIG?.api?.baseUrl ? 'Conectado' : 'Local'}
              </span>
            </div>
          </div>
          
          <div className="footer-right">
            <Link to="/privacy" className="footer-link">Privacidad</Link>
            <Link to="/terms" className="footer-link">Términos</Link>
            <Link to="/contact" className="footer-link">Contacto</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;