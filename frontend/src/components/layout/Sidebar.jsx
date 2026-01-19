import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import '../../assets/styles/layout/layout.css';

const Sidebar = ({ navigation, collapsed, onCloseMobileMenu, mobileOpen }) => {
  const [activeSubmenu, setActiveSubmenu] = useState(null);

  const toggleSubmenu = (index) => {
    setActiveSubmenu(activeSubmenu === index ? null : index);
  };

  const handleNavClick = () => {
    onCloseMobileMenu();
  };

  const navItems = [
    ...navigation,
    {
      path: '/reports',
      label: 'Reportes',
      icon: '📈',
      badge: null,
      submenu: [
        { path: '/reports/inventory', label: 'Inventario' },
        { path: '/reports/sales', label: 'Ventas' },
        { path: '/reports/profit', label: 'Ganancias' }
      ]
    },
    {
      path: '/analytics',
      label: 'Analíticas',
      icon: '📊',
      badge: 'Nuevo',
      badgeType: 'success'
    }
  ];

  return (
    <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">📦</span>
          {!collapsed && <span className="logo-text">InventarioPro</span>}
        </div>
        {!collapsed && (
          <div className="sidebar-status">
            <div className="status-indicator online"></div>
            <span className="status-text">Sistema en línea</span>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="section-label">Principal</div>
          <ul className="nav-list">
            {navItems.map((item, index) => (
              <li key={item.path} className="nav-item">
                {item.submenu ? (
                  <>
                    <button
                      className={`nav-link ${activeSubmenu === index ? 'active' : ''}`}
                      onClick={() => toggleSubmenu(index)}
                    >
                      <span className="nav-icon">{item.icon}</span>
                      {!collapsed && (
                        <>
                          <span className="nav-label">{item.label}</span>
                          <span className="nav-chevron">
                            {activeSubmenu === index ? '↑' : '↓'}
                          </span>
                        </>
                      )}
                      {item.badge && !collapsed && (
                        <span className={`nav-badge ${item.badgeType || 'default'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                    
                    {(!collapsed || mobileOpen) && activeSubmenu === index && (
                      <ul className="submenu">
                        {item.submenu.map(subItem => (
                          <li key={subItem.path}>
                            <NavLink
                              to={subItem.path}
                              className={({ isActive }) => 
                                `submenu-link ${isActive ? 'active' : ''}`
                              }
                              onClick={handleNavClick}
                            >
                              <span className="submenu-icon">→</span>
                              <span className="submenu-label">{subItem.label}</span>
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => 
                      `nav-link ${isActive ? 'active' : ''}`
                    }
                    onClick={handleNavClick}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {!collapsed && (
                      <>
                        <span className="nav-label">{item.label}</span>
                        {item.badge && (
                          <span className={`nav-badge ${item.badgeType || 'default'}`}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {collapsed && item.badge && (
                      <span className="collapsed-badge">{item.badge}</span>
                    )}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="nav-section">
          <div className="section-label">Herramientas</div>
          <ul className="nav-list">
            <li className="nav-item">
              <a href="/import" className="nav-link" onClick={handleNavClick}>
                <span className="nav-icon">⬆️</span>
                {!collapsed && <span className="nav-label">Importar Datos</span>}
              </a>
            </li>
            <li className="nav-item">
              <a href="/export" className="nav-link" onClick={handleNavClick}>
                <span className="nav-icon">⬇️</span>
                {!collapsed && <span className="nav-label">Exportar Datos</span>}
              </a>
            </li>
            <li className="nav-item">
              <a href="/backup" className="nav-link" onClick={handleNavClick}>
                <span className="nav-icon">💾</span>
                {!collapsed && <span className="nav-label">Backup</span>}
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <div className="sidebar-footer">
        {!collapsed ? (
          <>
            <div className="user-info">
              <div className="user-avatar">
                <span>A</span>
              </div>
              <div className="user-details">
                <div className="user-name">Administrador</div>
                <div className="user-role">Supervisor</div>
              </div>
            </div>
            <div className="quick-actions">
              <button className="quick-action-btn" title="Ajustes Rápidos">
                ⚙️
              </button>
              <button className="quick-action-btn" title="Modo Oscuro">
                🌙
              </button>
              <button className="quick-action-btn" title="Ayuda">
                ❓
              </button>
            </div>
          </>
        ) : (
          <div className="collapsed-footer">
            <button className="quick-action-btn" title="Ajustes Rápidos">
              ⚙️
            </button>
            <button className="quick-action-btn" title="Modo Oscuro">
              🌙
            </button>
            <button className="quick-action-btn" title="Ayuda">
              ❓
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;