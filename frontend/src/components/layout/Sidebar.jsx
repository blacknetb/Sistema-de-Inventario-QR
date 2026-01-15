import React, { useState } from 'react';
import "../../assets/styles/layout/layout.css";

/**
 * Componente Sidebar - Barra lateral de navegación
 * Incluye menú colapsable con diferentes secciones
 */
const Sidebar = ({ activeSection }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activeMenu, setActiveMenu] = useState(activeSection || 'dashboard');

    const menuItems = [
        { id: 'dashboard', icon: '📊', label: 'Dashboard', path: '/dashboard' },
        { id: 'products', icon: '📋', label: 'Productos', path: '/products' },
        { id: 'categories', icon: '📑', label: 'Categorías', path: '/categories' },
        { id: 'suppliers', icon: '🏭', label: 'Proveedores', path: '/suppliers' },
        { id: 'inventory', icon: '📦', label: 'Inventario', path: '/inventory' },
        { id: 'orders', icon: '🛒', label: 'Órdenes', path: '/orders' },
        { id: 'customers', icon: '👥', label: 'Clientes', path: '/customers' },
        { id: 'reports', icon: '📈', label: 'Reportes', path: '/reports' },
        { id: 'settings', icon: '⚙️', label: 'Configuración', path: '/settings' },
    ];

    const secondaryItems = [
        { id: 'help', icon: '❓', label: 'Ayuda', path: '/help' },
        { id: 'support', icon: '💬', label: 'Soporte', path: '/support' },
    ];

    return (
        <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <button 
                    className="sidebar-toggle" 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    aria-label={isCollapsed ? "Expandir menú" : "Colapsar menú"}
                >
                    <i className="toggle-icon">{isCollapsed ? '→' : '←'}</i>
                </button>
                {!isCollapsed && <h2 className="sidebar-title">Menú Principal</h2>}
            </div>

            <nav className="sidebar-nav">
                <ul className="sidebar-menu">
                    {menuItems.map((item) => (
                        <li key={item.id} className="menu-item">
                            <a 
                                href={item.path} 
                                className={`menu-link ${activeMenu === item.id ? 'active' : ''}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setActiveMenu(item.id);
                                    // En una aplicación real, aquí iría la navegación
                                    console.log(`Navegando a: ${item.path}`);
                                }}
                            >
                                <i className="menu-icon">{item.icon}</i>
                                {!isCollapsed && <span className="menu-label">{item.label}</span>}
                                {!isCollapsed && activeMenu === item.id && (
                                    <span className="active-indicator"></span>
                                )}
                            </a>
                        </li>
                    ))}
                </ul>

                <div className="sidebar-divider"></div>

                <ul className="sidebar-menu secondary-menu">
                    {secondaryItems.map((item) => (
                        <li key={item.id} className="menu-item">
                            <a 
                                href={item.path} 
                                className={`menu-link ${activeMenu === item.id ? 'active' : ''}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setActiveMenu(item.id);
                                }}
                            >
                                <i className="menu-icon">{item.icon}</i>
                                {!isCollapsed && <span className="menu-label">{item.label}</span>}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>

            {!isCollapsed && (
                <div className="sidebar-footer">
                    <div className="system-info">
                        <div className="system-status">
                            <span className="status-indicator active"></span>
                            <span className="status-text">Sistema activo</span>
                        </div>
                        <div className="version-info">
                            v1.0.0
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
};

export default Sidebar;