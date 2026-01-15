import React from 'react';
import "../../assets/styles/layout/layout.css";

/**
 * Componente Header - Encabezado principal de la aplicación
 * Incluye logo, título y menú de usuario
 */
const Header = ({ user, onLogout }) => {
    return (
        <header className="app-header">
            <div className="header-left">
                <div className="logo">
                    <i className="logo-icon">📦</i>
                    <h1 className="logo-text">Sistema de Inventarios</h1>
                </div>
            </div>
            
            <div className="header-center">
                <nav className="main-nav">
                    <ul className="nav-list">
                        <li className="nav-item">
                            <a href="/dashboard" className="nav-link active">
                                <i className="nav-icon">📊</i>
                                <span>Dashboard</span>
                            </a>
                        </li>
                        <li className="nav-item">
                            <a href="/products" className="nav-link">
                                <i className="nav-icon">📋</i>
                                <span>Productos</span>
                            </a>
                        </li>
                        <li className="nav-item">
                            <a href="/categories" className="nav-link">
                                <i className="nav-icon">📑</i>
                                <span>Categorías</span>
                            </a>
                        </li>
                        <li className="nav-item">
                            <a href="/reports" className="nav-link">
                                <i className="nav-icon">📈</i>
                                <span>Reportes</span>
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>
            
            <div className="header-right">
                <div className="user-menu">
                    <div className="user-info">
                        <div className="user-avatar">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="user-details">
                            <span className="user-name">{user?.name || 'Usuario'}</span>
                            <span className="user-role">{user?.role || 'Administrador'}</span>
                        </div>
                    </div>
                    <div className="dropdown-menu">
                        <button className="dropdown-item" onClick={onLogout}>
                            <i className="dropdown-icon">🚪</i>
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;