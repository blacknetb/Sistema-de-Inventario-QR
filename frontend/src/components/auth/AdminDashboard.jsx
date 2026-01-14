import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from './authService';
import '../../assets/styles/Auth.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalItems: 0,
    pendingTasks: 0,
    storageUsage: 65,
    systemHealth: 98
  });

  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdminDashboard = async () => {
      try {
        setLoading(true);
        
        // Verificar que el usuario es admin
        const user = authService.getCurrentUser();
        const isAdmin = user?.role === 'admin' || user?.isAdmin === true;
        
        if (!isAdmin) {
          navigate('/unauthorized');
          return;
        }

        // Simular carga de datos
        setTimeout(() => {
          setAdminStats({
            totalUsers: 143,
            activeUsers: 127,
            totalItems: 2156,
            pendingTasks: 8,
            storageUsage: 65,
            systemHealth: 98
          });

          setRecentUsers([
            { id: 1, name: 'Ana García', email: 'ana@example.com', role: 'admin', joined: '2024-01-15' },
            { id: 2, name: 'Carlos López', email: 'carlos@example.com', role: 'user', joined: '2024-01-14' },
            { id: 3, name: 'María Rodríguez', email: 'maria@example.com', role: 'user', joined: '2024-01-13' },
            { id: 4, name: 'Pedro Martínez', email: 'pedro@example.com', role: 'manager', joined: '2024-01-12' },
            { id: 5, name: 'Laura Sánchez', email: 'laura@example.com', role: 'user', joined: '2024-01-11' }
          ]);

          setLoading(false);
        }, 800);
        
      } catch (error) {
        console.error('Error cargando dashboard de administración:', error);
        navigate('/dashboard');
      }
    };
    
    loadAdminDashboard();
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
        <p>Cargando panel de administración...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      {/* Header del admin */}
      <header className="admin-header">
        <div className="admin-header-left">
          <h1 className="admin-title">
            <span className="admin-icon">👑</span>
            Panel de Administración
          </h1>
          <p className="admin-subtitle">
            Control total del sistema
          </p>
        </div>
        
        <div className="admin-header-right">
          <div className="admin-actions">
            <Link to="/dashboard" className="admin-action-btn">
              <span className="action-icon">📊</span>
              Panel principal
            </Link>
            <button 
              onClick={handleLogout}
              className="logout-btn"
              aria-label="Cerrar sesión"
            >
              <span className="logout-icon">🚪</span>
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Estadísticas de administración */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card primary">
          <div className="admin-stat-icon">👥</div>
          <div className="admin-stat-content">
            <h3 className="admin-stat-value">{adminStats.totalUsers}</h3>
            <p className="admin-stat-label">Usuarios totales</p>
            <div className="admin-stat-subtext">
              <span className="subtext-success">+{adminStats.activeUsers} activos</span>
            </div>
          </div>
        </div>
        
        <div className="admin-stat-card success">
          <div className="admin-stat-icon">📦</div>
          <div className="admin-stat-content">
            <h3 className="admin-stat-value">{adminStats.totalItems}</h3>
            <p className="admin-stat-label">Items en inventario</p>
          </div>
        </div>
        
        <div className="admin-stat-card warning">
          <div className="admin-stat-icon">⏱️</div>
          <div className="admin-stat-content">
            <h3 className="admin-stat-value">{adminStats.pendingTasks}</h3>
            <p className="admin-stat-label">Tareas pendientes</p>
          </div>
        </div>
        
        <div className="admin-stat-card info">
          <div className="admin-stat-icon">💾</div>
          <div className="admin-stat-content">
            <h3 className="admin-stat-value">{adminStats.storageUsage}%</h3>
            <p className="admin-stat-label">Uso de almacenamiento</p>
            <div className="storage-bar">
              <div 
                className="storage-progress" 
                style={{ width: `${adminStats.storageUsage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de gestión */}
      <div className="admin-management">
        <div className="management-section">
          <h2 className="section-title">Gestión de usuarios</h2>
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Fecha de registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar-small">
                          {user.name.charAt(0)}
                        </div>
                        {user.name}
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{user.joined}</td>
                    <td>
                      <div className="user-actions">
                        <button className="action-btn edit" title="Editar">
                          ✏️
                        </button>
                        <button className="action-btn delete" title="Eliminar">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-actions">
            <Link to="/admin/users" className="view-all-btn">
              Ver todos los usuarios →
            </Link>
          </div>
        </div>

        {/* Herramientas del sistema */}
        <div className="system-tools">
          <h2 className="section-title">Herramientas del sistema</h2>
          <div className="tools-grid">
            <button className="tool-card">
              <div className="tool-icon">🔄</div>
              <h3>Backup</h3>
              <p>Copia de seguridad completa</p>
            </button>
            
            <button className="tool-card">
              <div className="tool-icon">📊</div>
              <h3>Reportes</h3>
              <p>Generar reportes del sistema</p>
            </button>
            
            <button className="tool-card">
              <div className="tool-icon">⚙️</div>
              <h3>Configuración</h3>
              <p>Ajustes del sistema</p>
            </button>
            
            <button className="tool-card">
              <div className="tool-icon">🔧</div>
              <h3>Mantenimiento</h3>
              <p>Tareas de optimización</p>
            </button>
          </div>
        </div>
      </div>

      {/* Estado del sistema */}
      <div className="system-health">
        <h2 className="section-title">Salud del sistema</h2>
        <div className="health-indicators">
          <div className="health-indicator">
            <div className="health-value">{adminStats.systemHealth}%</div>
            <div className="health-label">Salud general</div>
            <div className="health-bar">
              <div 
                className="health-progress" 
                style={{ width: `${adminStats.systemHealth}%` }}
              ></div>
            </div>
          </div>
          
          <div className="health-metrics">
            <div className="metric">
              <span className="metric-label">API Response Time</span>
              <span className="metric-value success">125ms</span>
            </div>
            <div className="metric">
              <span className="metric-label">Database Latency</span>
              <span className="metric-value success">45ms</span>
            </div>
            <div className="metric">
              <span className="metric-label">Uptime</span>
              <span className="metric-value success">99.9%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;