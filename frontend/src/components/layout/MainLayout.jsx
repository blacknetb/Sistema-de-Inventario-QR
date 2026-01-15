import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import "../../assets/styles/layout/layout.css";

/**
 * Componente MainLayout - Layout principal de la aplicación
 * Organiza la estructura general con Header, Sidebar, Contenido y Footer
 */
const MainLayout = ({ children, user, activeSection, onLogout }) => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Datos de usuario de ejemplo (en una app real vendrían del backend)
    const defaultUser = {
        name: "Juan Pérez",
        role: "Administrador",
        email: "juan.perez@empresa.com",
        avatar: "JP"
    };

    const handleLogout = () => {
        if (onLogout) {
            onLogout();
        } else {
            // En una aplicación real, aquí se manejaría el logout
            console.log("Cerrando sesión...");
            // Redirección al login
            window.location.href = '/login';
        }
    };

    return (
        <div className="app-container">
            <Header 
                user={user || defaultUser} 
                onLogout={handleLogout}
            />
            
            <div className="app-body">
                <Sidebar 
                    activeSection={activeSection}
                    onToggleCollapse={setSidebarCollapsed}
                />
                
                <main className={`app-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                    <div className="main-content">
                        <div className="content-wrapper">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
            
            <Footer />
        </div>
    );
};

// Propiedades por defecto
MainLayout.defaultProps = {
    user: null,
    activeSection: 'dashboard',
    onLogout: null,
};

export default MainLayout;