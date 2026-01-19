import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import '../../assets/styles/Common/common.css';

const Sidebar = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activeSubmenu, setActiveSubmenu] = useState(null);
    const [quickActions, setQuickActions] = useState([]);

    useEffect(() => {
        // Cargar acciones rápidas basadas en permisos
        const actions = [
            {
                id: 'add-product',
                icon: 'fas fa-plus',
                label: 'Nuevo Producto',
                path: '/products/new',
                permission: 'product.create'
            },
            {
                id: 'scan-qr',
                icon: 'fas fa-qrcode',
                label: 'Escanear QR',
                path: '/scan',
                permission: 'scan'
            },
            {
                id: 'quick-report',
                icon: 'fas fa-chart-pie',
                label: 'Reporte Rápido',
                path: '/reports/quick',
                permission: 'report.view'
            },
            {
                id: 'low-stock',
                icon: 'fas fa-exclamation-triangle',
                label: 'Stock Bajo',
                path: '/products?filter=low-stock',
                permission: 'product.view'
            }
        ];
        setQuickActions(actions);
    }, []);

    const menuItems = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: 'fas fa-home',
            path: '/dashboard',
            permission: 'dashboard.view'
        },
        {
            id: 'products',
            label: 'Productos',
            icon: 'fas fa-box',
            path: '/products',
            permission: 'product.view',
            submenu: [
                {
                    label: 'Todos los Productos',
                    path: '/products',
                    icon: 'fas fa-list'
                },
                {
                    label: 'Agregar Producto',
                    path: '/products/new',
                    icon: 'fas fa-plus'
                },
                {
                    label: 'Categorías',
                    path: '/categories',
                    icon: 'fas fa-folder'
                },
                {
                    label: 'Stock Bajo',
                    path: '/products?filter=low-stock',
                    icon: 'fas fa-exclamation-triangle'
                },
                {
                    label: 'Sin Stock',
                    path: '/products?filter=out-of-stock',
                    icon: 'fas fa-times-circle'
                }
            ]
        },
        {
            id: 'inventory',
            label: 'Inventario',
            icon: 'fas fa-warehouse',
            path: '/inventory',
            permission: 'inventory.view',
            submenu: [
                {
                    label: 'Movimientos',
                    path: '/inventory/movements',
                    icon: 'fas fa-exchange-alt'
                },
                {
                    label: 'Ajustes',
                    path: '/inventory/adjustments',
                    icon: 'fas fa-adjust'
                },
                {
                    label: 'Transferencias',
                    path: '/inventory/transfers',
                    icon: 'fas fa-truck-moving'
                },
                {
                    label: 'Conteo Físico',
                    path: '/inventory/count',
                    icon: 'fas fa-clipboard-check'
                }
            ]
        },
        {
            id: 'suppliers',
            label: 'Proveedores',
            icon: 'fas fa-truck',
            path: '/suppliers',
            permission: 'supplier.view'
        },
        {
            id: 'reports',
            label: 'Reportes',
            icon: 'fas fa-chart-bar',
            path: '/reports',
            permission: 'report.view',
            submenu: [
                {
                    label: 'Ventas',
                    path: '/reports/sales',
                    icon: 'fas fa-shopping-cart'
                },
                {
                    label: 'Inventario',
                    path: '/reports/inventory',
                    icon: 'fas fa-boxes'
                },
                {
                    label: 'Stock',
                    path: '/reports/stock',
                    icon: 'fas fa-chart-line'
                },
                {
                    label: 'Proveedores',
                    path: '/reports/suppliers',
                    icon: 'fas fa-truck'
                }
            ]
        },
        {
            id: 'users',
            label: 'Usuarios',
            icon: 'fas fa-users',
            path: '/users',
            permission: 'user.view',
            roles: ['admin', 'supervisor']
        },
        {
            id: 'settings',
            label: 'Configuración',
            icon: 'fas fa-cog',
            path: '/settings',
            permission: 'settings.view'
        }
    ];

    const toggleSubmenu = (menuId) => {
        if (activeSubmenu === menuId) {
            setActiveSubmenu(null);
        } else {
            setActiveSubmenu(menuId);
        }
    };

    const checkPermission = (item) => {
        if (!item.permission) return true;
        if (item.roles && !item.roles.includes(user?.rol)) return false;
        // Aquí iría la lógica de permisos real
        return true;
    };

    const filteredMenuItems = menuItems.filter(checkPermission);

    return (
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            {/* Header del sidebar */}
            <div className="sidebar-header">
                <button
                    className="sidebar-toggle"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    title={isCollapsed ? 'Expandir menú' : 'Contraer menú'}
                >
                    <i className={`fas fa-chevron-${isCollapsed ? 'right' : 'left'}`}></i>
                </button>
                
                {!isCollapsed && (
                    <div className="sidebar-brand">
                        <div className="brand-icon">
                            <i className="fas fa-boxes"></i>
                        </div>
                        <div className="brand-text">
                            <span className="brand-primary">Inventario</span>
                            <span className="brand-secondary">Básico</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Acciones rápidas */}
            {!isCollapsed && (
                <div className="quick-actions">
                    <h3 className="section-title">Acciones Rápidas</h3>
                    <div className="actions-grid">
                        {quickActions.map(action => (
                            <NavLink
                                key={action.id}
                                to={action.path}
                                className="quick-action"
                                title={action.label}
                            >
                                <i className={action.icon}></i>
                                <span>{action.label}</span>
                            </NavLink>
                        ))}
                    </div>
                </div>
            )}

            {/* Menú principal */}
            <nav className="sidebar-menu">
                <ul className="menu-list">
                    {filteredMenuItems.map(item => (
                        <li key={item.id} className="menu-item-wrapper">
                            {item.submenu ? (
                                <>
                                    <button
                                        className={`menu-item ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
                                        onClick={() => toggleSubmenu(item.id)}
                                    >
                                        <i className={item.icon}></i>
                                        {!isCollapsed && <span>{item.label}</span>}
                                        {!isCollapsed && (
                                            <i className={`fas fa-chevron-${activeSubmenu === item.id ? 'up' : 'down'}`}></i>
                                        )}
                                    </button>
                                    
                                    {!isCollapsed && activeSubmenu === item.id && (
                                        <ul className="submenu">
                                            {item.submenu.map(subItem => (
                                                <li key={subItem.path}>
                                                    <NavLink
                                                        to={subItem.path}
                                                        className={({ isActive }) => 
                                                            `submenu-item ${isActive ? 'active' : ''}`
                                                        }
                                                    >
                                                        <i className={subItem.icon}></i>
                                                        <span>{subItem.label}</span>
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
                                        `menu-item ${isActive ? 'active' : ''}`
                                    }
                                    title={isCollapsed ? item.label : ''}
                                >
                                    <i className={item.icon}></i>
                                    {!isCollapsed && <span>{item.label}</span>}
                                </NavLink>
                            )}
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Footer del sidebar */}
            {!isCollapsed && (
                <div className="sidebar-footer">
                    <div className="system-info">
                        <div className="info-item">
                            <i className="fas fa-database"></i>
                            <div>
                                <span className="info-label">Productos</span>
                                <span className="info-value">1,245</span>
                            </div>
                        </div>
                        <div className="info-item">
                            <i className="fas fa-box"></i>
                            <div>
                                <span className="info-label">Stock Total</span>
                                <span className="info-value">45,678</span>
                            </div>
                        </div>
                        <div className="info-item">
                            <i className="fas fa-money-bill-wave"></i>
                            <div>
                                <span className="info-label">Valor Total</span>
                                <span className="info-value">$1.2M</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="user-summary">
                        <div className="user-avatar-small">
                            {user?.nombre?.charAt(0) || 'U'}
                        </div>
                        <div className="user-details">
                            <span className="user-name">{user?.nombre || 'Usuario'}</span>
                            <span className="user-role">{user?.rol || 'Usuario'}</span>
                        </div>
                        <div className="system-status">
                            <div className="status-indicator active"></div>
                            <span>Sistema Activo</span>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
};

export default Sidebar;