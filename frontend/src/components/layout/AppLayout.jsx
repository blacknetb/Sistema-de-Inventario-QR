import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import MainContent from './MainContent';
import Breadcrumb from './Breadcrumb';
import LoadingOverlay from './LoadingOverlay';
import Alert from './Alert';
import '../../assets/styles/layout/layout.css';

const AppLayout = ({ children, pageTitle = 'Inventario', showBreadcrumb = true }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);

  // Simular carga inicial
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const showAlert = (type, message, duration = 5000) => {
    const id = Date.now();
    const newAlert = { id, type, message };
    setAlerts(prev => [...prev, newAlert]);

    // Auto-remove alert after duration
    setTimeout(() => {
      removeAlert(id);
    }, duration);
  };

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const user = {
    name: 'Administrador',
    role: 'Supervisor de Inventario',
    avatar: 'https://via.placeholder.com/40/3498db/FFFFFF?text=A'
  };

  const navigation = [
    { path: '/', label: 'Dashboard', icon: '📊', badge: null },
    { path: '/inventory', label: 'Inventario', icon: '📦', badge: '15' },
    { path: '/categories', label: 'Categorías', icon: '🏷️', badge: null },
    { path: '/suppliers', label: 'Proveedores', icon: '🏢', badge: '3' },
    { path: '/orders', label: 'Órdenes', icon: '📋', badge: '5' },
    { path: '/reports', label: 'Reportes', icon: '📈', badge: null },
    { path: '/settings', label: 'Configuración', icon: '⚙️', badge: null }
  ];

  const breadcrumbItems = [
    { label: 'Inicio', path: '/' },
    { label: pageTitle, path: null }
  ];

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}>
      <LoadingOverlay isLoading={isLoading} message="Cargando aplicación..." />
      
      <Header 
        user={user}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={toggleSidebar}
        onToggleMobileMenu={toggleMobileMenu}
        mobileMenuOpen={mobileMenuOpen}
      />
      
      <Sidebar 
        navigation={navigation}
        collapsed={sidebarCollapsed}
        onCloseMobileMenu={closeMobileMenu}
        mobileOpen={mobileMenuOpen}
      />
      
      <MainContent>
        {showBreadcrumb && (
          <Breadcrumb 
            items={breadcrumbItems}
            onNavigate={(path) => console.log('Navigate to:', path)}
          />
        )}
        
        <div className="alerts-container">
          {alerts.map(alert => (
            <Alert
              key={alert.id}
              type={alert.type}
              message={alert.message}
              onClose={() => removeAlert(alert.id)}
            />
          ))}
        </div>
        
        {children}
      </MainContent>
      
      <Footer 
        companyName="Sistema de Inventario"
        version="v2.0.1"
        copyrightYear={new Date().getFullYear()}
      />
      
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={closeMobileMenu}></div>
      )}
    </div>
  );
};

export default AppLayout;