import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import PublicRoute from './PublicRoute';
import { AdminRouteWithAuth } from './AdminRoute';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import LoadingScreen from '../components/common/LoadingScreen';
import SystemAlert from '../components/common/SystemAlert';

// Importar páginas
import {
  DashboardPage,
  InventoryPage,
  AddItemPage,
  EditItemPage,
  ReportsPage,
  CategoriesPage,
  SuppliersPage,
  SettingsPage,
  LoginPage,
  RegisterPage,
  ProfilePage,
  HelpPage,
  NotFoundPage,
  PrintPage
} from '../pages';

import './routes.css';

// Componente para manejar las transiciones de ruta
const RouteTransition = ({ children }) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('fadeIn');

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('fadeOut');
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('fadeIn');
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  return (
    <div className={`route-transition ${transitionStage}`}>
      {children}
    </div>
  );
};

// Componente de layout principal
const MainLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [systemAlert, setSystemAlert] = useState(null);

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');

  // Datos de ejemplo para notificaciones
  useEffect(() => {
    const mockNotifications = [
      {
        id: 1,
        type: 'warning',
        message: 'El producto "Teclado Mecánico" está agotado',
        time: 'Hace 2 horas',
        read: false
      },
      {
        id: 2,
        type: 'info',
        message: 'Nueva orden recibida #ORD-1234',
        time: 'Hace 4 horas',
        read: true
      },
      {
        id: 3,
        type: 'success',
        message: 'Reporte semanal generado exitosamente',
        time: 'Ayer',
        read: true
      },
      {
        id: 4,
        type: 'danger',
        message: 'Stock crítico en "Monitor 24" Samsung"',
        time: 'Ayer',
        read: false
      }
    ];

    setNotifications(mockNotifications);
  }, []);

  const toggleSidebar = () => {
    if (window.innerWidth <= 1024) {
      setMobileSidebarOpen(!mobileSidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowUserMenu(false);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
    setShowNotifications(false);
  };

  const markNotificationAsRead = (id) => {
    setNotifications(notifications.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setShowNotifications(false);
  };

  const handleLogout = () => {
    // Mostrar confirmación
    if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      window.location.href = '/login';
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <div className="app-layout">
      {/* Overlay para mobile */}
      {mobileSidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onToggle={toggleSidebar}
        userRole={userData.role}
      />

      {/* Header */}
      <Header
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={toggleSidebar}
        userData={userData}
        notifications={notifications}
        unreadCount={unreadNotifications}
        showNotifications={showNotifications}
        showUserMenu={showUserMenu}
        onToggleNotifications={toggleNotifications}
        onToggleUserMenu={toggleUserMenu}
        onMarkAsRead={markNotificationAsRead}
        onClearNotifications={clearAllNotifications}
        onLogout={handleLogout}
      />

      {/* Contenido principal */}
      <main className="main-content">
        <RouteTransition>
          {children}
        </RouteTransition>
      </main>

      {/* Alertas del sistema */}
      <SystemAlert
        alert={systemAlert}
        onClose={() => setSystemAlert(null)}
      />
    </div>
  );
};

// Componente de ruta con layout
const RouteWithLayout = ({ element, layout = true }) => {
  if (!layout) {
    return element;
  }

  return <MainLayout>{element}</MainLayout>;
};

// Componente principal de rutas
const AppRoutes = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga inicial
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingScreen message="Cargando sistema de inventario..." />;
  }

  return (
    <Router>
      <Routes>
        {/* Rutas públicas sin layout */}
        <Route path="/login" element={
          <PublicRoute restricted={true}>
            <RouteWithLayout element={<LoginPage />} layout={false} />
          </PublicRoute>
        } />
        
        <Route path="/register" element={
          <PublicRoute restricted={true}>
            <RouteWithLayout element={<RegisterPage />} layout={false} />
          </PublicRoute>
        } />

        {/* Rutas de impresión (sin layout) */}
        <Route path="/print" element={
          <PrivateRoute>
            <PrintPage />
          </PrivateRoute>
        } />

        {/* Rutas con layout */}
        <Route path="/" element={
          <PrivateRoute>
            <RouteWithLayout element={<DashboardPage />} />
          </PrivateRoute>
        } />
        
        <Route path="/dashboard" element={
          <PrivateRoute>
            <RouteWithLayout element={<DashboardPage />} />
          </PrivateRoute>
        } />
        
        <Route path="/inventory" element={
          <PrivateRoute>
            <RouteWithLayout element={<InventoryPage />} />
          </PrivateRoute>
        } />
        
        <Route path="/inventory/add" element={
          <PrivateRoute requiredRoles={['admin', 'gestor']}>
            <RouteWithLayout element={<AddItemPage />} />
          </PrivateRoute>
        } />
        
        <Route path="/inventory/edit/:id" element={
          <PrivateRoute requiredRoles={['admin', 'gestor']}>
            <RouteWithLayout element={<EditItemPage />} />
          </PrivateRoute>
        } />
        
        <Route path="/reports" element={
          <PrivateRoute>
            <RouteWithLayout element={<ReportsPage />} />
          </PrivateRoute>
        } />
        
        <Route path="/categories" element={
          <PrivateRoute requiredRoles={['admin', 'gestor']}>
            <RouteWithLayout element={<CategoriesPage />} />
          </PrivateRoute>
        } />
        
        <Route path="/suppliers" element={
          <PrivateRoute requiredRoles={['admin', 'gestor']}>
            <RouteWithLayout element={<SuppliersPage />} />
          </PrivateRoute>
        } />
        
        <Route path="/settings" element={
          <AdminRouteWithAuth>
            <RouteWithLayout element={<SettingsPage />} />
          </AdminRouteWithAuth>
        } />
        
        <Route path="/profile" element={
          <PrivateRoute>
            <RouteWithLayout element={<ProfilePage />} />
          </PrivateRoute>
        } />
        
        <Route path="/help" element={
          <PrivateRoute>
            <RouteWithLayout element={<HelpPage />} />
          </PrivateRoute>
        } />

        {/* Ruta 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;