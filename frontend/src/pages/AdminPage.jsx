import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiUsers, 
  FiSettings, 
  FiShield, 
  FiDatabase, 
  FiActivity, 
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiKey,
  FiServer,
  FiGlobe,
  FiLock,
  FiUnlock,
  FiDownload,
  FiUpload,
  FiBarChart2,
  FiCalendar,
  FiClock,
  FiUserCheck
} from 'react-icons/fi';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { toast } from 'react-hot-toast';
import logger from '../utils/logger';
import '../assets/styles/pages/pages.css';

const AdminPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    activeSessions: 0,
    totalProducts: 0,
    apiRequests: 0,
    databaseSize: '0 MB',
    uptime: '0 days',
    lastBackup: 'N/A'
  });

  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    allowRegistrations: true,
    maxLoginAttempts: 5,
    sessionTimeout: 30,
    apiRateLimit: 100,
    backupFrequency: 'daily'
  });

  // Datos para gráficos
  const userActivityData = [
    { name: 'Lun', logins: 65, registrations: 12 },
    { name: 'Mar', logins: 78, registrations: 8 },
    { name: 'Mié', logins: 90, registrations: 15 },
    { name: 'Jue', logins: 81, registrations: 10 },
    { name: 'Vie', logins: 56, registrations: 7 },
    { name: 'Sáb', logins: 45, registrations: 5 },
    { name: 'Dom', logins: 60, registrations: 9 }
  ];

  const systemMetricsData = [
    { name: 'CPU', value: 65, color: '#8884d8' },
    { name: 'Memoria', value: 45, color: '#82ca9d' },
    { name: 'Disco', value: 30, color: '#ffc658' },
    { name: 'Red', value: 85, color: '#ff8042' }
  ];

  const apiRequestsData = [
    { hour: '00:00', requests: 120 },
    { hour: '03:00', requests: 90 },
    { hour: '06:00', requests: 150 },
    { hour: '09:00', requests: 320 },
    { hour: '12:00', requests: 450 },
    { hour: '15:00', requests: 380 },
    { hour: '18:00', requests: 280 },
    { hour: '21:00', requests: 190 }
  ];

  useEffect(() => {
    fetchSystemStats();
    fetchUsers();
    fetchLogs();
  }, []);

  const fetchSystemStats = async () => {
    setLoading(true);
    try {
      // Simular llamada a API
      setTimeout(() => {
        setSystemStats({
          totalUsers: 154,
          activeSessions: 23,
          totalProducts: 1247,
          apiRequests: 24580,
          databaseSize: '245 MB',
          uptime: '15 días 8h',
          lastBackup: 'Hoy 02:00'
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      logger.error('Error fetching system stats:', error);
      toast.error('Error al cargar estadísticas del sistema');
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // Simular datos de usuarios
      const mockUsers = [
        { id: 1, name: 'Admin Principal', email: 'admin@inventarioqr.com', role: 'Administrador', status: 'active', lastLogin: '2024-01-15 10:30', createdAt: '2023-01-01' },
        { id: 2, name: 'Juan Pérez', email: 'juan@empresa.com', role: 'Manager', status: 'active', lastLogin: '2024-01-14 15:45', createdAt: '2023-03-15' },
        { id: 3, name: 'María García', email: 'maria@empresa.com', role: 'Usuario', status: 'active', lastLogin: '2024-01-13 09:20', createdAt: '2023-05-20' },
        { id: 4, name: 'Carlos López', email: 'carlos@empresa.com', role: 'Usuario', status: 'inactive', lastLogin: '2024-01-10 14:15', createdAt: '2023-07-10' },
        { id: 5, name: 'Ana Martínez', email: 'ana@empresa.com', role: 'Auditor', status: 'active', lastLogin: '2024-01-15 08:45', createdAt: '2023-09-05' },
        { id: 6, name: 'Pedro Sánchez', email: 'pedro@empresa.com', role: 'Usuario', status: 'suspended', lastLogin: '2024-01-09 11:30', createdAt: '2023-11-15' }
      ];
      setUsers(mockUsers);
    } catch (error) {
      logger.error('Error fetching users:', error);
      toast.error('Error al cargar usuarios');
    }
  };

  const fetchLogs = async () => {
    try {
      // Simular logs del sistema
      const mockLogs = [
        { id: 1, type: 'info', message: 'Backup completado exitosamente', timestamp: '2024-01-15 02:00:00', user: 'System' },
        { id: 2, type: 'warning', message: 'Alta utilización de CPU detectada', timestamp: '2024-01-15 10:15:00', user: 'System' },
        { id: 3, type: 'success', message: 'Usuario autenticado exitosamente', timestamp: '2024-01-15 09:30:00', user: 'admin@inventarioqr.com' },
        { id: 4, type: 'error', message: 'Error en conexión con base de datos', timestamp: '2024-01-15 08:45:00', user: 'System' },
        { id: 5, type: 'info', message: 'Reporte mensual generado', timestamp: '2024-01-15 00:30:00', user: 'System' },
        { id: 6, type: 'success', message: 'Producto agregado exitosamente', timestamp: '2024-01-14 22:15:00', user: 'juan@empresa.com' }
      ];
      setLogs(mockLogs);
    } catch (error) {
      logger.error('Error fetching logs:', error);
      toast.error('Error al cargar logs');
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // Simular guardado de configuraciones
      setTimeout(() => {
        toast.success('Configuraciones guardadas exitosamente');
        setLoading(false);
      }, 1000);
    } catch (error) {
      logger.error('Error saving settings:', error);
      toast.error('Error al guardar configuraciones');
      setLoading(false);
    }
  };

  const runBackup = async () => {
    setLoading(true);
    try {
      setTimeout(() => {
        toast.success('Backup completado exitosamente');
        setSystemStats(prev => ({
          ...prev,
          lastBackup: new Date().toLocaleString()
        }));
        setLoading(false);
      }, 2000);
    } catch (error) {
      logger.error('Error running backup:', error);
      toast.error('Error al ejecutar backup');
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    toast.success('Logs limpiados exitosamente');
  };

  const toggleUserStatus = (userId, currentStatus) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, status: currentStatus === 'active' ? 'suspended' : 'active' }
        : user
    ));
    toast.success(`Estado de usuario actualizado`);
  };

  const deleteUser = (userId) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
      setUsers(prev => prev.filter(user => user.id !== userId));
      toast.success('Usuario eliminado exitosamente');
    }
  };

  const renderDashboard = () => (
    <div className="admin-dashboard">
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-card-icon">
            <FiUsers />
          </div>
          <div className="stat-card-content">
            <h3>Usuarios Totales</h3>
            <p className="stat-value">{systemStats.totalUsers}</p>
            <p className="stat-description">23 activos ahora</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-icon">
            <FiDatabase />
          </div>
          <div className="stat-card-content">
            <h3>Tamaño Base de Datos</h3>
            <p className="stat-value">{systemStats.databaseSize}</p>
            <p className="stat-description">Último backup: {systemStats.lastBackup}</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-icon">
            <FiActivity />
          </div>
          <div className="stat-card-content">
            <h3>Solicitudes API</h3>
            <p className="stat-value">{systemStats.apiRequests.toLocaleString()}</p>
            <p className="stat-description">Últimas 24 horas</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-icon">
            <FiServer />
          </div>
          <div className="stat-card-content">
            <h3>Uptime del Sistema</h3>
            <p className="stat-value">{systemStats.uptime}</p>
            <p className="stat-description">100% disponibilidad</p>
          </div>
        </div>
      </div>

      <div className="admin-charts-grid">
        <div className="admin-chart-card">
          <h3>Actividad de Usuarios</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userActivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="logins" fill="#3b82f6" name="Inicios de sesión" />
                <Bar dataKey="registrations" fill="#10b981" name="Registros" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-chart-card">
          <h3>Solicitudes API por Hora</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={apiRequestsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="requests" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-chart-card">
          <h3>Métricas del Sistema</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={systemMetricsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {systemMetricsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-chart-card">
          <h3>Logs del Sistema</h3>
          <div className="logs-container">
            {logs.slice(0, 6).map(log => (
              <div key={log.id} className={`log-item log-${log.type}`}>
                <div className="log-icon">
                  {log.type === 'info' && <FiActivity />}
                  {log.type === 'warning' && <FiAlertCircle />}
                  {log.type === 'success' && <FiCheckCircle />}
                  {log.type === 'error' && <FiXCircle />}
                </div>
                <div className="log-content">
                  <p className="log-message">{log.message}</p>
                  <p className="log-meta">
                    <span className="log-timestamp">{log.timestamp}</span>
                    <span className="log-user">por {log.user}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="admin-users">
      <div className="section-header">
        <h2>Gestión de Usuarios</h2>
        <button className="btn btn-primary">
          <FiUsers /> Agregar Usuario
        </button>
      </div>

      <div className="users-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Último Login</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>#{user.id}</td>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-details">
                      <strong>{user.name}</strong>
                      <small>Registrado: {user.createdAt}</small>
                    </div>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge role-${user.role.toLowerCase()}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`status-badge status-${user.status}`}>
                    {user.status === 'active' && <FiCheckCircle />}
                    {user.status === 'inactive' && <FiClock />}
                    {user.status === 'suspended' && <FiLock />}
                    {user.status}
                  </span>
                </td>
                <td>{user.lastLogin}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn-icon"
                      onClick={() => navigate(`/users/${user.id}`)}
                      title="Ver detalles"
                    >
                      <FiUserCheck />
                    </button>
                    <button 
                      className="btn-icon"
                      onClick={() => toggleUserStatus(user.id, user.status)}
                      title={user.status === 'active' ? 'Suspender' : 'Activar'}
                    >
                      {user.status === 'active' ? <FiLock /> : <FiUnlock />}
                    </button>
                    <button 
                      className="btn-icon btn-danger"
                      onClick={() => deleteUser(user.id)}
                      title="Eliminar"
                    >
                      <FiXCircle />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="user-roles-section">
        <h3>Roles y Permisos</h3>
        <div className="roles-grid">
          <div className="role-card">
            <div className="role-header">
              <FiShield />
              <h4>Administrador</h4>
            </div>
            <ul className="role-permissions">
              <li>Acceso total al sistema</li>
              <li>Gestión de usuarios</li>
              <li>Configuración del sistema</li>
              <li>Backup y restauración</li>
            </ul>
          </div>

          <div className="role-card">
            <div className="role-header">
              <FiBarChart2 />
              <h4>Manager</h4>
            </div>
            <ul className="role-permissions">
              <li>Gestión de inventario</li>
              <li>Generación de reportes</li>
              <li>Supervisión de usuarios</li>
              <li>Aprobación de solicitudes</li>
            </ul>
          </div>

          <div className="role-card">
            <div className="role-header">
              <FiUsers />
              <h4>Usuario</h4>
            </div>
            <ul className="role-permissions">
              <li>Consulta de inventario</li>
              <li>Escaneo de productos</li>
              <li>Reporte de incidencias</li>
              <li>Perfil personal</li>
            </ul>
          </div>

          <div className="role-card">
            <div className="role-header">
              <FiCalendar />
              <h4>Auditor</h4>
            </div>
            <ul className="role-permissions">
              <li>Auditoría de registros</li>
              <li>Reportes de actividad</li>
              <li>Verificación de datos</li>
              <li>Historial completo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="admin-settings">
      <div className="section-header">
        <h2>Configuración del Sistema</h2>
        <button 
          className="btn btn-primary"
          onClick={saveSettings}
          disabled={loading}
        >
          {loading ? <FiRefreshCw className="spin" /> : <FiCheckCircle />}
          Guardar Cambios
        </button>
      </div>

      <div className="settings-grid">
        <div className="settings-section">
          <h3>
            <FiShield /> Seguridad
          </h3>
          
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
              />
              Modo Mantenimiento
            </label>
            <p className="setting-description">
              Cuando está activado, solo los administradores pueden acceder al sistema
            </p>
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.allowRegistrations}
                onChange={(e) => handleSettingChange('allowRegistrations', e.target.checked)}
              />
              Permitir Nuevos Registros
            </label>
            <p className="setting-description">
              Permitir que nuevos usuarios se registren en el sistema
            </p>
          </div>

          <div className="setting-item">
            <label>
              Máximo de Intentos de Login:
              <input
                type="number"
                min="1"
                max="10"
                value={settings.maxLoginAttempts}
                onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value))}
              />
            </label>
            <p className="setting-description">
              Número de intentos fallidos antes de bloquear la cuenta
            </p>
          </div>

          <div className="setting-item">
            <label>
              Tiempo de Espera de Sesión (minutos):
              <input
                type="number"
                min="5"
                max="240"
                value={settings.sessionTimeout}
                onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
              />
            </label>
            <p className="setting-description">
              Tiempo de inactividad antes de cerrar sesión automáticamente
            </p>
          </div>
        </div>

        <div className="settings-section">
          <h3>
            <FiGlobe /> API & Servicios
          </h3>
          
          <div className="setting-item">
            <label>
              Límite de Tasa API (por hora):
              <input
                type="number"
                min="10"
                max="1000"
                value={settings.apiRateLimit}
                onChange={(e) => handleSettingChange('apiRateLimit', parseInt(e.target.value))}
              />
            </label>
            <p className="setting-description">
              Número máximo de solicitudes API por hora por usuario
            </p>
          </div>

          <div className="setting-item">
            <label>
              Frecuencia de Backup Automático:
              <select
                value={settings.backupFrequency}
                onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
              >
                <option value="hourly">Cada hora</option>
                <option value="daily">Diario</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
                <option value="manual">Manual</option>
              </select>
            </label>
            <p className="setting-description">
              Frecuencia con la que se realizan backups automáticos de la base de datos
            </p>
          </div>

          <div className="setting-actions">
            <h4>Acciones del Sistema</h4>
            <div className="action-buttons">
              <button 
                className="btn btn-secondary"
                onClick={runBackup}
                disabled={loading}
              >
                <FiDownload /> Ejecutar Backup Manual
              </button>
              <button className="btn btn-secondary">
                <FiUpload /> Restaurar Backup
              </button>
              <button className="btn btn-danger">
                <FiXCircle /> Limpiar Cache
              </button>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>
            <FiKey /> Tokens y Autenticación
          </h3>
          
          <div className="setting-item">
            <label>Token de Acceso</label>
            <div className="token-display">
              <code>eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</code>
              <button className="btn-icon">
                <FiRefreshCw />
              </button>
            </div>
            <p className="setting-description">
              Token JWT para autenticación API. Vence en 24 horas.
            </p>
          </div>

          <div className="setting-item">
            <label>Clave API</label>
            <div className="token-display">
              <code>sk_live_51N9y2RLW9x7mK8g4HjF6...</code>
              <button className="btn-icon">
                <FiRefreshCw />
              </button>
            </div>
            <p className="setting-description">
              Clave secreta para integraciones con servicios externos
            </p>
          </div>

          <div className="setting-item">
            <h4>Regenerar Claves</h4>
            <div className="regenerate-keys">
              <button className="btn btn-outline">
                <FiKey /> Regenerar Tokens
              </button>
              <button className="btn btn-outline">
                <FiShield /> Resetear Contraseñas
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLogs = () => (
    <div className="admin-logs">
      <div className="section-header">
        <h2>Logs del Sistema</h2>
        <div className="log-actions">
          <button className="btn btn-secondary" onClick={clearLogs}>
            <FiXCircle /> Limpiar Logs
          </button>
          <button className="btn btn-secondary">
            <FiDownload /> Exportar Logs
          </button>
          <button className="btn btn-primary" onClick={fetchLogs}>
            <FiRefreshCw /> Actualizar
          </button>
        </div>
      </div>

      <div className="log-filters">
        <div className="filter-group">
          <label>Tipo:</label>
          <select>
            <option value="all">Todos</option>
            <option value="info">Info</option>
            <option value="warning">Advertencia</option>
            <option value="error">Error</option>
            <option value="success">Éxito</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Fecha:</label>
          <input type="date" />
          <input type="date" />
        </div>

        <div className="filter-group">
          <label>Usuario:</label>
          <input type="text" placeholder="Filtrar por usuario..." />
        </div>
      </div>

      <div className="logs-list">
        {logs.length === 0 ? (
          <div className="empty-logs">
            <FiActivity />
            <p>No hay logs disponibles</p>
          </div>
        ) : (
          logs.map(log => (
            <div key={log.id} className={`log-entry log-${log.type}`}>
              <div className="log-header">
                <div className="log-type">
                  {log.type === 'info' && <FiActivity className="log-icon-info" />}
                  {log.type === 'warning' && <FiAlertCircle className="log-icon-warning" />}
                  {log.type === 'error' && <FiXCircle className="log-icon-error" />}
                  {log.type === 'success' && <FiCheckCircle className="log-icon-success" />}
                  <span className={`log-type-text type-${log.type}`}>
                    {log.type.toUpperCase()}
                  </span>
                </div>
                <div className="log-timestamp">{log.timestamp}</div>
              </div>
              <div className="log-content">
                <p className="log-message">{log.message}</p>
                <div className="log-meta">
                  <span className="log-user">
                    <FiUsers /> {log.user}
                  </span>
                  <span className="log-id">ID: {log.id}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="log-stats">
        <div className="log-stat">
          <span className="stat-label">Total Logs:</span>
          <span className="stat-value">{logs.length}</span>
        </div>
        <div className="log-stat">
          <span className="stat-label">Errores:</span>
          <span className="stat-value error">{logs.filter(l => l.type === 'error').length}</span>
        </div>
        <div className="log-stat">
          <span className="stat-label">Advertencias:</span>
          <span className="stat-value warning">{logs.filter(l => l.type === 'warning').length}</span>
        </div>
        <div className="log-stat">
          <span className="stat-label">Éxitos:</span>
          <span className="stat-value success">{logs.filter(l => l.type === 'success').length}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>
          <FiSettings /> Panel de Administración
        </h1>
        <p className="admin-subtitle">
          Sistema de Inventario QR - Gestión completa del sistema
        </p>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <FiActivity /> Dashboard
        </button>
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <FiUsers /> Usuarios
        </button>
        <button
          className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <FiSettings /> Configuración
        </button>
        <button
          className={`admin-tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <FiDatabase /> Logs
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'settings' && renderSettings()}
        {activeTab === 'logs' && renderLogs()}
      </div>
    </div>
  );
};

export default AdminPage;