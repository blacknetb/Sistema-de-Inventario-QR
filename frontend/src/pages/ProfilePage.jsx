import React, { useState } from 'react';
import '../assets/styles/pages/pages.css';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState({
    name: 'Juan Pérez',
    email: 'juan.perez@empresa.com',
    phone: '+1 234 567 8900',
    role: 'Gestor de Inventario',
    department: 'Logística',
    joinDate: '2023-03-15',
    avatar: 'JP',
    notifications: {
      email: true,
      push: true,
      weeklyReport: true,
      lowStockAlerts: true
    }
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const handleProfileChange = (field, value) => {
    setUserData({
      ...userData,
      [field]: value
    });
  };

  const handleNotificationChange = (field) => {
    setUserData({
      ...userData,
      notifications: {
        ...userData.notifications,
        [field]: !userData.notifications[field]
      }
    });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
    
    // Limpiar errores
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validatePasswordChange = () => {
    const newErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'La contraseña actual es requerida';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'La nueva contraseña es requerida';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    return newErrors;
  };

  const handleSaveProfile = () => {
    // Simular guardado
    setSuccessMessage('Perfil actualizado exitosamente');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    
    const validationErrors = validatePasswordChange();
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Simular cambio de contraseña
    alert('Contraseña cambiada exitosamente');
    
    // Limpiar formulario
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const renderTabContent = () => {
    switch(activeTab) {
      case 'profile':
        return (
          <div className="settings-section">
            <h3 className="section-title">Información Personal</h3>
            
            {successMessage && (
              <div className="alert alert-success">
                <span>✓</span>
                <span>{successMessage}</span>
              </div>
            )}
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nombre Completo</label>
                <input
                  type="text"
                  className="form-control"
                  value={userData.name}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={userData.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input
                  type="tel"
                  className="form-control"
                  value={userData.phone}
                  onChange={(e) => handleProfileChange('phone', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Departamento</label>
                <input
                  type="text"
                  className="form-control"
                  value={userData.department}
                  onChange={(e) => handleProfileChange('department', e.target.value)}
                />
              </div>
            </div>
            
            <div className="form-group">
              <button className="btn btn-primary" onClick={handleSaveProfile}>
                <span className="btn-icon">💾</span> Guardar Cambios
              </button>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="settings-section">
            <h3 className="section-title">Cambiar Contraseña</h3>
            
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label className="form-label">Contraseña Actual</label>
                <input
                  type="password"
                  name="currentPassword"
                  className="form-control"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                />
                {errors.currentPassword && <div className="alert alert-danger" style={{ marginTop: '5px', padding: '8px' }}>{errors.currentPassword}</div>}
              </div>
              
              <div className="form-group">
                <label className="form-label">Nueva Contraseña</label>
                <input
                  type="password"
                  name="newPassword"
                  className="form-control"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                />
                {errors.newPassword && <div className="alert alert-danger" style={{ marginTop: '5px', padding: '8px' }}>{errors.newPassword}</div>}
              </div>
              
              <div className="form-group">
                <label className="form-label">Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-control"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <div className="alert alert-danger" style={{ marginTop: '5px', padding: '8px' }}>{errors.confirmPassword}</div>}
              </div>
              
              <div className="form-group">
                <button type="submit" className="btn btn-primary">
                  <span className="btn-icon">🔒</span> Cambiar Contraseña
                </button>
              </div>
            </form>
          </div>
        );

      case 'notifications':
        return (
          <div className="settings-section">
            <h3 className="section-title">Preferencias de Notificaciones</h3>
            
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <input
                  type="checkbox"
                  checked={userData.notifications.email}
                  onChange={() => handleNotificationChange('email')}
                />
                Recibir notificaciones por email
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <input
                  type="checkbox"
                  checked={userData.notifications.push}
                  onChange={() => handleNotificationChange('push')}
                />
                Notificaciones push en el navegador
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <input
                  type="checkbox"
                  checked={userData.notifications.weeklyReport}
                  onChange={() => handleNotificationChange('weeklyReport')}
                />
                Reporte semanal de inventario
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <input
                  type="checkbox"
                  checked={userData.notifications.lowStockAlerts}
                  onChange={() => handleNotificationChange('lowStockAlerts')}
                />
                Alertas de bajo stock
              </label>
            </div>
            
            <div className="form-group">
              <button className="btn btn-primary" onClick={handleSaveProfile}>
                <span className="btn-icon">💾</span> Guardar Preferencias
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mi Perfil</h1>
          <p className="page-subtitle">Administra tu información personal y preferencias</p>
        </div>
      </div>

      <div className="profile-header">
        <div className="profile-avatar">{userData.avatar}</div>
        <div className="profile-info">
          <h2>{userData.name}</h2>
          <p>{userData.role} • {userData.department}</p>
          <p style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
            Miembro desde {userData.joinDate} • {userData.email}
          </p>
          
          <div className="profile-stats">
            <div className="stat-item">
              <div className="stat-value">156</div>
              <div className="stat-label">Productos</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">48</div>
              <div className="stat-label">Órdenes</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">12</div>
              <div className="stat-label">Alertas</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">95%</div>
              <div className="stat-label">Actividad</div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-card">
        <div className="settings-nav">
          <button 
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Información Personal
          </button>
          <button 
            className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Seguridad
          </button>
          <button 
            className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            Notificaciones
          </button>
        </div>

        {renderTabContent()}
      </div>

      <div className="page-card">
        <h3 className="section-title">Actividad Reciente</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Actividad</th>
                <th>Detalles</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>2024-03-15 14:30</td>
                <td>Inicio de sesión</td>
                <td>Sesión iniciada desde Chrome</td>
                <td>192.168.1.100</td>
              </tr>
              <tr>
                <td>2024-03-15 10:15</td>
                <td>Actualización de producto</td>
                <td>Stock de Mouse Inalámbrico actualizado</td>
                <td>192.168.1.100</td>
              </tr>
              <tr>
                <td>2024-03-14 16:45</td>
                <td>Creación de producto</td>
                <td>Nuevo producto: Tablet Samsung</td>
                <td>192.168.1.100</td>
              </tr>
              <tr>
                <td>2024-03-14 09:20</td>
                <td>Reporte generado</td>
                <td>Reporte de inventario semanal</td>
                <td>192.168.1.100</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;