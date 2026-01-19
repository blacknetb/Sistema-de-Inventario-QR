import React, { useState } from 'react';
import '../assets/styles/pages/pages.css';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    general: {
      companyName: 'Mi Empresa S.A.',
      currency: 'USD',
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
      language: 'es'
    },
    inventory: {
      lowStockThreshold: 10,
      autoGenerateSKU: true,
      defaultCategory: 'Electrónica',
      alertOnLowStock: true,
      enableBarcode: false
    },
    notifications: {
      emailAlerts: true,
      lowStockAlert: true,
      outOfStockAlert: true,
      newOrderAlert: true,
      dailyReport: false,
      weeklyReport: true
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordExpiry: 90,
      loginAttempts: 5,
      ipRestriction: false
    },
    users: [
      { id: 1, name: 'Admin', email: 'admin@empresa.com', role: 'Administrador', status: 'active' },
      { id: 2, name: 'Juan Pérez', email: 'juan@empresa.com', role: 'Gestor', status: 'active' },
      { id: 3, name: 'María García', email: 'maria@empresa.com', role: 'Vendedor', status: 'active' },
      { id: 4, name: 'Carlos López', email: 'carlos@empresa.com', role: 'Vendedor', status: 'inactive' }
    ]
  });

  const currencies = ['USD', 'EUR', 'GBP', 'MXN', 'COP', 'ARS', 'BRL'];
  const timezones = ['America/New_York', 'America/Mexico_City', 'America/Bogota', 'America/Buenos_Aires', 'Europe/London', 'Europe/Madrid'];
  const dateFormats = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];
  const languages = [
    { code: 'es', name: 'Español' },
    { code: 'en', name: 'English' },
    { code: 'pt', name: 'Português' },
    { code: 'fr', name: 'Français' }
  ];

  const handleSettingChange = (section, field, value) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value
      }
    });
  };

  const handleSaveSettings = () => {
    // Aquí iría la lógica para guardar en el servidor
    alert('Configuraciones guardadas exitosamente');
  };

  const handleAddUser = () => {
    const newUser = {
      id: settings.users.length + 1,
      name: '',
      email: '',
      role: 'Vendedor',
      status: 'active'
    };
    setSettings({
      ...settings,
      users: [...settings.users, newUser]
    });
  };

  const handleRemoveUser = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
      setSettings({
        ...settings,
        users: settings.users.filter(user => user.id !== id)
      });
    }
  };

  const renderTabContent = () => {
    switch(activeTab) {
      case 'general':
        return (
          <div className="settings-section">
            <h3 className="section-title">Configuración General</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nombre de la Empresa</label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.general.companyName}
                  onChange={(e) => handleSettingChange('general', 'companyName', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Moneda</label>
                <select
                  className="form-control"
                  value={settings.general.currency}
                  onChange={(e) => handleSettingChange('general', 'currency', e.target.value)}
                >
                  {currencies.map(curr => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Zona Horaria</label>
                <select
                  className="form-control"
                  value={settings.general.timezone}
                  onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                >
                  {timezones.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Formato de Fecha</label>
                <select
                  className="form-control"
                  value={settings.general.dateFormat}
                  onChange={(e) => handleSettingChange('general', 'dateFormat', e.target.value)}
                >
                  {dateFormats.map(format => (
                    <option key={format} value={format}>{format}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Idioma</label>
              <select
                className="form-control"
                value={settings.general.language}
                onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'inventory':
        return (
          <div className="settings-section">
            <h3 className="section-title">Configuración de Inventario</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Umbral de Bajo Stock</label>
                <input
                  type="number"
                  className="form-control"
                  value={settings.inventory.lowStockThreshold}
                  onChange={(e) => handleSettingChange('inventory', 'lowStockThreshold', parseInt(e.target.value))}
                  min="1"
                />
                <small style={{ color: '#7f8c8d' }}>Número mínimo de unidades antes de alertar</small>
              </div>
              <div className="form-group">
                <label className="form-label">Categoría Predeterminada</label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.inventory.defaultCategory}
                  onChange={(e) => handleSettingChange('inventory', 'defaultCategory', e.target.value)}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <input
                  type="checkbox"
                  checked={settings.inventory.autoGenerateSKU}
                  onChange={(e) => handleSettingChange('inventory', 'autoGenerateSKU', e.target.checked)}
                />
                Generar SKU automáticamente
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <input
                  type="checkbox"
                  checked={settings.inventory.alertOnLowStock}
                  onChange={(e) => handleSettingChange('inventory', 'alertOnLowStock', e.target.checked)}
                />
                Alertar cuando el stock sea bajo
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <input
                  type="checkbox"
                  checked={settings.inventory.enableBarcode}
                  onChange={(e) => handleSettingChange('inventory', 'enableBarcode', e.target.checked)}
                />
                Habilitar escaneo de código de barras
              </label>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="settings-section">
            <h3 className="section-title">Configuración de Notificaciones</h3>
            <div className="form-group">
              <h4 style={{ marginBottom: '15px' }}>Alertas por Email</h4>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <input
                  type="checkbox"
                  checked={settings.notifications.emailAlerts}
                  onChange={(e) => handleSettingChange('notifications', 'emailAlerts', e.target.checked)}
                />
                Habilitar todas las alertas por email
              </label>
              
              <div style={{ marginLeft: '30px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <input
                    type="checkbox"
                    checked={settings.notifications.lowStockAlert}
                    onChange={(e) => handleSettingChange('notifications', 'lowStockAlert', e.target.checked)}
                    disabled={!settings.notifications.emailAlerts}
                  />
                  Alertas de bajo stock
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <input
                    type="checkbox"
                    checked={settings.notifications.outOfStockAlert}
                    onChange={(e) => handleSettingChange('notifications', 'outOfStockAlert', e.target.checked)}
                    disabled={!settings.notifications.emailAlerts}
                  />
                  Alertas de productos agotados
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <input
                    type="checkbox"
                    checked={settings.notifications.newOrderAlert}
                    onChange={(e) => handleSettingChange('notifications', 'newOrderAlert', e.target.checked)}
                    disabled={!settings.notifications.emailAlerts}
                  />
                  Alertas de nuevas órdenes
                </label>
              </div>
              
              <h4 style={{ marginTop: '20px', marginBottom: '15px' }}>Reportes Automáticos</h4>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <input
                  type="checkbox"
                  checked={settings.notifications.dailyReport}
                  onChange={(e) => handleSettingChange('notifications', 'dailyReport', e.target.checked)}
                />
                Reporte diario de inventario
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <input
                  type="checkbox"
                  checked={settings.notifications.weeklyReport}
                  onChange={(e) => handleSettingChange('notifications', 'weeklyReport', e.target.checked)}
                />
                Reporte semanal de ventas
              </label>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="settings-section">
            <h3 className="section-title">Configuración de Seguridad</h3>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <input
                  type="checkbox"
                  checked={settings.security.twoFactorAuth}
                  onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
                />
                Autenticación de dos factores (2FA)
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <input
                  type="checkbox"
                  checked={settings.security.ipRestriction}
                  onChange={(e) => handleSettingChange('security', 'ipRestriction', e.target.checked)}
                />
                Restricción por IP
              </label>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tiempo de espera de sesión (minutos)</label>
                <input
                  type="number"
                  className="form-control"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                  min="1"
                  max="240"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Expiración de contraseña (días)</label>
                <input
                  type="number"
                  className="form-control"
                  value={settings.security.passwordExpiry}
                  onChange={(e) => handleSettingChange('security', 'passwordExpiry', parseInt(e.target.value))}
                  min="1"
                  max="365"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Intentos de login permitidos</label>
              <input
                type="number"
                className="form-control"
                value={settings.security.loginAttempts}
                onChange={(e) => handleSettingChange('security', 'loginAttempts', parseInt(e.target.value))}
                min="1"
                max="10"
              />
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="settings-section">
            <h3 className="section-title">Gestión de Usuarios</h3>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              <button className="btn btn-primary" onClick={handleAddUser}>
                <span className="btn-icon">+</span> Nuevo Usuario
              </button>
            </div>
            
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.users.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '35px', height: '35px', backgroundColor: '#3498db', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          {user.name}
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <select className="form-control" style={{ width: 'auto', padding: '5px' }} defaultValue={user.role}>
                          <option value="Administrador">Administrador</option>
                          <option value="Gestor">Gestor</option>
                          <option value="Vendedor">Vendedor</option>
                          <option value="Visualizador">Visualizador</option>
                        </select>
                      </td>
                      <td>
                        <select className="form-control" style={{ width: 'auto', padding: '5px' }} defaultValue={user.status}>
                          <option value="active">Activo</option>
                          <option value="inactive">Inactivo</option>
                          <option value="suspended">Suspendido</option>
                        </select>
                      </td>
                      <td>
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '5px 10px', fontSize: '0.85rem' }}
                          onClick={() => handleRemoveUser(user.id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
          <h1 className="page-title">Configuración</h1>
          <p className="page-subtitle">Ajustes del sistema de inventario</p>
        </div>
        <button className="btn btn-primary" onClick={handleSaveSettings}>
          <span className="btn-icon">💾</span> Guardar Cambios
        </button>
      </div>

      <div className="page-card">
        <div className="settings-nav">
          <button 
            className={`nav-item ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button 
            className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            Inventario
          </button>
          <button 
            className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            Notificaciones
          </button>
          <button 
            className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Seguridad
          </button>
          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Usuarios
          </button>
        </div>

        {renderTabContent()}
      </div>
    </div>
  );
};

export default SettingsPage;