import React, { useState } from 'react';
import '../../assets/styles/layout/layout.css';

const Header = ({ 
  user, 
  sidebarCollapsed, 
  onToggleSidebar, 
  onToggleMobileMenu,
  mobileMenuOpen 
}) => {
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Stock Bajo', message: 'Mouse Inalámbrico está por debajo del mínimo', time: 'Hace 2 horas', read: false, type: 'warning' },
    { id: 2, title: 'Nuevo Pedido', message: 'Pedido #1234 recibido exitosamente', time: 'Hace 4 horas', read: true, type: 'success' },
    { id: 3, title: 'Producto Agotado', message: 'Teclado Mecánico se ha agotado', time: 'Ayer', read: false, type: 'danger' }
  ]);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
    setShowNotifications(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      console.log('Searching for:', searchTerm);
      // Implementar búsqueda aquí
    }
  };

  const handleLogout = () => {
    console.log('Logging out...');
    // Implementar logout aquí
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button 
          className="sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? "Expandir sidebar" : "Contraer sidebar"}
        >
          {sidebarCollapsed ? '→' : '←'}
        </button>
        
        <button 
          className="mobile-menu-toggle"
          onClick={onToggleMobileMenu}
          aria-label={mobileMenuOpen ? "Cerrar menú móvil" : "Abrir menú móvil"}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
        
        <div className="logo">
          <span className="logo-icon">📦</span>
          <span className="logo-text">InventarioPro</span>
        </div>
      </div>

      <div className="header-center">
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Buscar productos, órdenes, proveedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                type="button" 
                className="clear-search"
                onClick={() => setSearchTerm('')}
              >
                ✕
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="header-right">
        <div className="header-actions">
          <button 
            className="header-btn notifications-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notificaciones"
          >
            <span className="btn-icon">🔔</span>
            {unreadNotifications > 0 && (
              <span className="notification-badge">{unreadNotifications}</span>
            )}
          </button>

          <button 
            className="header-btn help-btn"
            aria-label="Ayuda"
            onClick={() => window.open('/help', '_blank')}
          >
            <span className="btn-icon">❓</span>
          </button>

          <div className="user-menu-wrapper">
            <button 
              className="user-profile-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-label="Menú de usuario"
            >
              <div className="user-avatar">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} />
                ) : (
                  <span>{user.name.charAt(0)}</span>
                )}
              </div>
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role}</span>
              </div>
              <span className="user-chevron">{showUserMenu ? '↑' : '↓'}</span>
            </button>

            {showUserMenu && (
              <div className="user-menu-dropdown">
                <div className="user-menu-header">
                  <div className="dropdown-avatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} />
                    ) : (
                      <span>{user.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="dropdown-user-info">
                    <strong>{user.name}</strong>
                    <small>{user.role}</small>
                  </div>
                </div>
                
                <div className="user-menu-items">
                  <a href="/profile" className="menu-item">
                    <span className="item-icon">👤</span>
                    <span>Mi Perfil</span>
                  </a>
                  <a href="/settings" className="menu-item">
                    <span className="item-icon">⚙️</span>
                    <span>Configuración</span>
                  </a>
                  <a href="/activity" className="menu-item">
                    <span className="item-icon">📊</span>
                    <span>Mi Actividad</span>
                  </a>
                  <div className="menu-divider"></div>
                  <button className="menu-item logout-item" onClick={handleLogout}>
                    <span className="item-icon">🚪</span>
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notificaciones Dropdown */}
      {showNotifications && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h4>Notificaciones</h4>
            <button className="mark-all-read" onClick={markAllAsRead}>
              Marcar todo como leído
            </button>
          </div>
          
          <div className="notifications-list">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => handleNotificationClick(notification.id)}
                >
                  <div className={`notification-icon ${notification.type}`}>
                    {notification.type === 'warning' ? '⚠️' : 
                     notification.type === 'success' ? '✅' : '❌'}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">{notification.time}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-notifications">
                <span className="empty-icon">📭</span>
                <p>No hay notificaciones</p>
              </div>
            )}
          </div>
          
          <div className="notifications-footer">
            <a href="/notifications" className="view-all-link">
              Ver todas las notificaciones →
            </a>
          </div>
        </div>
      )}

      {/* Overlay para cerrar dropdowns */}
      {(showNotifications || showUserMenu) && (
        <div 
          className="dropdown-overlay"
          onClick={() => {
            setShowNotifications(false);
            setShowUserMenu(false);
          }}
        ></div>
      )}
    </header>
  );
};

export default Header;