import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from './authService';
import '../../assets/styles/Auth.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStock: 0,
    categories: 0,
    scannedToday: 0
  });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        
        // Obtener usuario actual
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
          navigate('/auth/login');
          return;
        }
        
        setUser(currentUser);
        
        // Simular carga de estadísticas
        setTimeout(() => {
          setStats({
            totalItems: 156,
            lowStock: 12,
            categories: 8,
            scannedToday: 24
          });
          setLoading(false);
        }, 500);
        
      } catch (error) {
        console.error('Error cargando dashboard:', error);
        navigate('/auth/login');
      }
    };
    
    loadDashboard();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/auth/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (loading) {
    return (
      <div className="route-loading">
        <div className="spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1 className="dashboard-title">
            <span className="dashboard-icon">📊</span>
            Panel de Control
          </h1>
          <p className="dashboard-subtitle">
            Bienvenido, {user?.name || 'Usuario'}
          </p>
        </div>
        
        <div className="header-right">
          <div className="user-info">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <span className="user-email">{user?.email}</span>
              <span className="user-role badge">{user?.role}</span>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="logout-btn"
            aria-label="Cerrar sesión"
          >
            <span className="logout-icon">🚪</span>
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.totalItems}</h3>
            <p className="stat-label">Total de items</p>
          </div>
        </div>
        
        <div className="stat-card warning">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.lowStock}</h3>
            <p className="stat-label">Bajo stock</p>
          </div>
        </div>
        
        <div className="stat-card success">
          <div className="stat-icon">🏷️</div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.categories}</h3>
            <p className="stat-label">Categorías</p>
          </div>
        </div>
        
        <div className="stat-card info">
          <div className="stat-icon">📱</div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.scannedToday}</h3>
            <p className="stat-label">Escaneados hoy</p>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="quick-actions">
        <h2 className="section-title">Acciones rápidas</h2>
        <div className="actions-grid">
          <Link to="/scan" className="action-card">
            <div className="action-icon">📷</div>
            <h3>Escanear QR</h3>
            <p>Escanea un código QR para ver detalles</p>
          </Link>
          
          <Link to="/inventory" className="action-card">
            <div className="action-icon">📦</div>
            <h3>Ver inventario</h3>
            <p>Explora todos tus items</p>
          </Link>
          
          <Link to="/add-item" className="action-card">
            <div className="action-icon">➕</div>
            <h3>Agregar item</h3>
            <p>Añade un nuevo item al inventario</p>
          </Link>
          
          <Link to="/reports" className="action-card">
            <div className="action-icon">📈</div>
            <h3>Reportes</h3>
            <p>Genera reportes de inventario</p>
          </Link>
        </div>
      </div>

      {/* Información del sistema */}
      <div className="system-status">
        <h2 className="section-title">Estado del sistema</h2>
        <div className="status-grid">
          <div className="status-item online">
            <span className="status-indicator"></span>
            <span className="status-text">Servidor en línea</span>
          </div>
          <div className="status-item online">
            <span className="status-indicator"></span>
            <span className="status-text">Base de datos conectada</span>
          </div>
          <div className="status-item online">
            <span className="status-indicator"></span>
            <span className="status-text">API funcionando</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;