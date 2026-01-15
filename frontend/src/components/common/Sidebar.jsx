/**
 * Sidebar.js
 * Componente de barra lateral para navegación
 * Ubicación: E:\portafolio de desarrollo web\app web\proyectos basicos\inventarios basicos\frontend\src\components\common\Sidebar.js
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../assets/styles/common/Sidebar.css';

const Sidebar = ({ collapsed = false, onToggle }) => {
    const [expandedSections, setExpandedSections] = useState({});
    const location = useLocation();

    // Secciones del menú
    const menuSections = [
        {
            id: 'dashboard',
            title: 'Dashboard',
            icon: '📊',
            path: '/',
            items: []
        },
        {
            id: 'inventory',
            title: 'Inventario',
            icon: '📦',
            path: null,
            items: [
                { label: 'Todos los Productos', path: '/products' },
                { label: 'Categorías', path: '/categories' },
                { label: 'Marcas', path: '/brands' },
                { label: 'Almacenes', path: '/warehouses' },
                { label: 'Ubicaciones', path: '/locations' },
                { label: 'Ajustes de Inventario', path: '/inventory-adjustments' }
            ]
        },
        {
            id: 'purchases',
            title: 'Compras',
            icon: '🛒',
            path: null,
            items: [
                { label: 'Órdenes de Compra', path: '/purchase-orders' },
                { label: 'Proveedores', path: '/suppliers' },
                { label: 'Recepciones', path: '/receivings' },
                { label: 'Devoluciones', path: '/returns' }
            ]
        },
        {
            id: 'sales',
            title: 'Ventas',
            icon: '💰',
            path: null,
            items: [
                { label: 'Pedidos', path: '/orders' },
                { label: 'Clientes', path: '/customers' },
                { label: 'Cotizaciones', path: '/quotes' },
                { label: 'Facturas', path: '/invoices' }
            ]
        },
        {
            id: 'reports',
            title: 'Reportes',
            icon: '📈',
            path: null,
            items: [
                { label: 'Reporte de Inventario', path: '/reports/inventory' },
                { label: 'Reporte de Ventas', path: '/reports/sales' },
                { label: 'Reporte de Compras', path: '/reports/purchases' },
                { label: 'Reporte de Utilidades', path: '/reports/profits' },
                { label: 'Reportes Personalizados', path: '/reports/custom' }
            ]
        },
        {
            id: 'analytics',
            title: 'Analítica',
            icon: '📊',
            path: '/analytics',
            items: []
        },
        {
            id: 'settings',
            title: 'Configuración',
            icon: '⚙️',
            path: null,
            items: [
                { label: 'Usuarios', path: '/settings/users' },
                { label: 'Roles y Permisos', path: '/settings/roles' },
                { label: 'Configuración General', path: '/settings/general' },
                { label: 'Integraciones', path: '/settings/integrations' },
                { label: 'Backup', path: '/settings/backup' }
            ]
        }
    ];

    // Alternar sección expandida
    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    // Verificar si un enlace está activo
    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    // Verificar si una sección tiene algún ítem activo
    const hasActiveItem = (section) => {
        if (section.path && isActive(section.path)) return true;
        return section.items.some(item => isActive(item.path));
    };

    return (
        <aside className={`app-sidebar ${collapsed ? 'collapsed' : 'expanded'}`}>
            {/* Logo y botón de toggle */}
            <div className="sidebar-header">
                {!collapsed && (
                    <div className="sidebar-logo">
                        <div className="logo-icon">📦</div>
                        <div className="logo-text">
                            <h2>InventarioPro</h2>
                            <span className="logo-subtitle">Panel de Control</span>
                        </div>
                    </div>
                )}
                
                <button className="sidebar-toggle" onClick={onToggle}>
                    {collapsed ? '→' : '←'}
                </button>
            </div>

            {/* Menú de navegación */}
            <nav className="sidebar-nav">
                <ul className="sidebar-menu">
                    {menuSections.map(section => {
                        const isSectionActive = hasActiveItem(section);
                        const isExpanded = expandedSections[section.id] || isSectionActive;

                        return (
                            <li 
                                key={section.id}
                                className={`menu-section ${isSectionActive ? 'active-section' : ''}`}
                            >
                                {section.items.length > 0 ? (
                                    <>
                                        <button
                                            className="section-header"
                                            onClick={() => toggleSection(section.id)}
                                        >
                                            <span className="section-icon">{section.icon}</span>
                                            {!collapsed && (
                                                <>
                                                    <span className="section-title">{section.title}</span>
                                                    <span className="section-arrow">
                                                        {isExpanded ? '▼' : '▶'}
                                                    </span>
                                                </>
                                            )}
                                        </button>
                                        
                                        {!collapsed && isExpanded && (
                                            <ul className="section-items">
                                                {section.items.map(item => (
                                                    <li key={item.path}>
                                                        <Link
                                                            to={item.path}
                                                            className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
                                                        >
                                                            <span className="item-dot"></span>
                                                            <span className="item-label">{item.label}</span>
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </>
                                ) : (
                                    <Link
                                        to={section.path}
                                        className={`section-header link ${isActive(section.path) ? 'active' : ''}`}
                                    >
                                        <span className="section-icon">{section.icon}</span>
                                        {!collapsed && (
                                            <span className="section-title">{section.title}</span>
                                        )}
                                    </Link>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Estadísticas rápidas */}
            {!collapsed && (
                <div className="sidebar-stats">
                    <h3 className="stats-title">Resumen Rápido</h3>
                    
                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-icon">📦</div>
                            <div className="stat-info">
                                <span className="stat-value">1,234</span>
                                <span className="stat-label">Productos</span>
                            </div>
                        </div>
                        
                        <div className="stat-item">
                            <div className="stat-icon">⚠️</div>
                            <div className="stat-info">
                                <span className="stat-value">23</span>
                                <span className="stat-label">Bajo Stock</span>
                            </div>
                        </div>
                        
                        <div className="stat-item">
                            <div className="stat-icon">📈</div>
                            <div className="stat-info">
                                <span className="stat-value">$45,678</span>
                                <span className="stat-label">Ventas Hoy</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Información de usuario */}
            <div className="sidebar-user">
                <div className="user-avatar">
                    <img 
                        src="https://via.placeholder.com/40" 
                        alt="Usuario" 
                        className="avatar-img"
                    />
                </div>
                
                {!collapsed && (
                    <div className="user-info">
                        <h4 className="user-name">Juan Pérez</h4>
                        <p className="user-role">Administrador</p>
                        <Link to="/profile" className="user-profile-link">
                            Ver perfil
                        </Link>
                    </div>
                )}
            </div>

            {/* Botones de acción */}
            {!collapsed && (
                <div className="sidebar-actions">
                    <button className="action-btn primary">
                        <span className="action-icon">➕</span>
                        Nuevo Producto
                    </button>
                    <button className="action-btn secondary">
                        <span className="action-icon">📥</span>
                        Importar Datos
                    </button>
                </div>
            )}
        </aside>
    );
};

export default Sidebar;