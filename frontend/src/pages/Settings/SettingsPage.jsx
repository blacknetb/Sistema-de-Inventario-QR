import React, { useState } from 'react';
import styles from './SettingsPage.module.css';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Input from '../../components/common/Input/Input';
import Alert from '../../components/common/Alert/Alert';

const SettingsPage = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const { 
    theme, 
    accentColor, 
    fontSize, 
    animations, 
    compactMode,
    toggleTheme,
    setAccent,
    setSize,
    toggleAnimations,
    toggleCompactMode,
    resetToDefaults
  } = useTheme();
  
  const { showSuccess, showError } = useNotifications();

  const [activeTab, setActiveTab] = useState('profile');
  const [alert, setAlert] = useState({ show: false, type: 'info', message: '' });
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    stockAlerts: true,
    systemUpdates: false
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  // Función para mostrar alertas
  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
      setAlert(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const handleProfileUpdate = async () => {
    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        showSuccess('Perfil actualizado exitosamente');
        showAlert('success', 'Perfil actualizado exitosamente');
      }
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
      showError('Error al actualizar el perfil');
      showAlert('error', 'Error al actualizar el perfil');
    }
  };

  const handlePasswordChange = async () => {
    // Validar
    const newErrors = {};
    
    if (!passwordData.current) {
      newErrors.current = 'La contraseña actual es requerida';
    }
    
    if (!passwordData.new) {
      newErrors.new = 'La nueva contraseña es requerida';
    } else if (passwordData.new.length < 6) {
      newErrors.new = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    if (passwordData.new !== passwordData.confirm) {
      newErrors.confirm = 'Las contraseñas no coinciden';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showAlert('error', 'Por favor, corrige los errores en el formulario');
      return;
    }

    try {
      const result = await changePassword(passwordData.current, passwordData.new);
      if (result.success) {
        showSuccess('Contraseña actualizada exitosamente');
        showAlert('success', 'Contraseña actualizada exitosamente');
        setPasswordData({ current: '', new: '', confirm: '' });
        setErrors({});
      }
    } catch (err) {
      console.error('Error al cambiar contraseña:', err);
      showError('Error al cambiar la contraseña');
      showAlert('error', 'Error al cambiar la contraseña. Verifica tu contraseña actual.');
    }
  };

  const handleSaveNotifications = () => {
    // Aquí iría la lógica para guardar las preferencias de notificaciones
    showSuccess('Preferencias guardadas');
    showAlert('success', 'Preferencias de notificaciones guardadas');
  };

  const handleCreateBackup = () => {
    // Aquí iría la lógica para crear respaldo
    showSuccess('Respaldo iniciado');
    showAlert('info', 'Respaldo iniciado. Esto puede tomar algunos minutos.');
  };

  const handleRestoreBackup = () => {
    // Aquí iría la lógica para restaurar respaldo
    showSuccess('Respaldo restaurado');
    showAlert('success', 'Respaldo restaurado exitosamente');
  };

  const handleResetToDefaults = () => {
    resetToDefaults();
    showAlert('info', 'Configuración restablecida a valores predeterminados');
  };

  return (
    <div className={styles.settingsPage}>
      {/* Componente Alert */}
      <Alert 
        type={alert.type}
        message={alert.message}
        show={alert.show}
        onClose={() => setAlert(prev => ({ ...prev, show: false }))}
        closable={true}
        duration={5000}
      />

      <div className={styles.header}>
        <h1 className={styles.title}>Configuración</h1>
        <p className={styles.subtitle}>
          Personaliza tu experiencia en la aplicación
        </p>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'profile' ? styles.active : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          👤 Perfil
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'appearance' ? styles.active : ''}`}
          onClick={() => setActiveTab('appearance')}
        >
          🎨 Apariencia
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'notifications' ? styles.active : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          🔔 Notificaciones
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'security' ? styles.active : ''}`}
          onClick={() => setActiveTab('security')}
        >
          🔒 Seguridad
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'backup' ? styles.active : ''}`}
          onClick={() => setActiveTab('backup')}
        >
          💾 Respaldo
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'profile' && (
          <Card title="Información del Perfil">
            <div className={styles.form}>
              <Input
                label="Nombre completo"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Tu nombre"
              />
              <Input
                type="email"
                label="Email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="tu@email.com"
                disabled
              />
              <div className={styles.formActions}>
                <Button variant="primary" onClick={handleProfileUpdate}>
                  Guardar Cambios
                </Button>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'appearance' && (
          <Card title="Personalizar Apariencia">
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Tema</h3>
              <div className={styles.themeOptions}>
                <button
                  className={`${styles.themeOption} ${theme === 'light' ? styles.active : ''}`}
                  onClick={() => theme !== 'light' && toggleTheme()}
                >
                  <span className={styles.themeIcon}>☀️</span>
                  <span>Claro</span>
                </button>
                <button
                  className={`${styles.themeOption} ${theme === 'dark' ? styles.active : ''}`}
                  onClick={() => theme !== 'dark' && toggleTheme()}
                >
                  <span className={styles.themeIcon}>🌙</span>
                  <span>Oscuro</span>
                </button>
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Color de Acento</h3>
              <div className={styles.colorOptions}>
                {['blue', 'green', 'red', 'purple', 'orange', 'teal'].map(color => (
                  <button
                    key={color}
                    className={`${styles.colorOption} ${styles[color]} ${accentColor === color ? styles.active : ''}`}
                    onClick={() => setAccent(color)}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Tamaño de Fuente</h3>
              <div className={styles.sizeOptions}>
                {['small', 'medium', 'large'].map(size => (
                  <button
                    key={size}
                    className={`${styles.sizeOption} ${fontSize === size ? styles.active : ''}`}
                    onClick={() => setSize(size)}
                  >
                    {size === 'small' && 'Pequeño'}
                    {size === 'medium' && 'Mediano'}
                    {size === 'large' && 'Grande'}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Opciones Adicionales</h3>
              <div className={styles.switchOption}>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={animations}
                    onChange={toggleAnimations}
                  />
                  <span className={styles.slider}></span>
                </label>
                <span>Animaciones</span>
              </div>
              <div className={styles.switchOption}>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={compactMode}
                    onChange={toggleCompactMode}
                  />
                  <span className={styles.slider}></span>
                </label>
                <span>Modo compacto</span>
              </div>
            </div>

            <div className={styles.formActions}>
              <Button variant="outline" onClick={handleResetToDefaults}>
                Restablecer Valores
              </Button>
            </div>
          </Card>
        )}

        {activeTab === 'notifications' && (
          <Card title="Configuración de Notificaciones">
            <div className={styles.section}>
              <div className={styles.switchOption}>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={notifications.emailAlerts}
                    onChange={(e) => setNotifications(prev => ({ ...prev, emailAlerts: e.target.checked }))}
                  />
                  <span className={styles.slider}></span>
                </label>
                <div className={styles.switchLabel}>
                  <strong>Alertas por Email</strong>
                  <p>Recibe notificaciones importantes en tu correo</p>
                </div>
              </div>

              <div className={styles.switchOption}>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={notifications.stockAlerts}
                    onChange={(e) => setNotifications(prev => ({ ...prev, stockAlerts: e.target.checked }))}
                  />
                  <span className={styles.slider}></span>
                </label>
                <div className={styles.switchLabel}>
                  <strong>Alertas de Stock</strong>
                  <p>Notificaciones cuando el stock esté bajo</p>
                </div>
              </div>

              <div className={styles.switchOption}>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={notifications.systemUpdates}
                    onChange={(e) => setNotifications(prev => ({ ...prev, systemUpdates: e.target.checked }))}
                  />
                  <span className={styles.slider}></span>
                </label>
                <div className={styles.switchLabel}>
                  <strong>Actualizaciones del Sistema</strong>
                  <p>Información sobre nuevas características</p>
                </div>
              </div>
            </div>

            <div className={styles.formActions}>
              <Button variant="primary" onClick={handleSaveNotifications}>
                Guardar Preferencias
              </Button>
            </div>
          </Card>
        )}

        {activeTab === 'security' && (
          <Card title="Seguridad">
            <div className={styles.form}>
              <Input
                type="password"
                label="Contraseña actual"
                value={passwordData.current}
                onChange={(e) => setPasswordData(prev => ({ ...prev, current: e.target.value }))}
                error={errors.current}
              />
              <Input
                type="password"
                label="Nueva contraseña"
                value={passwordData.new}
                onChange={(e) => setPasswordData(prev => ({ ...prev, new: e.target.value }))}
                error={errors.new}
              />
              <Input
                type="password"
                label="Confirmar nueva contraseña"
                value={passwordData.confirm}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirm: e.target.value }))}
                error={errors.confirm}
              />
              <div className={styles.formActions}>
                <Button variant="primary" onClick={handlePasswordChange}>
                  Cambiar Contraseña
                </Button>
              </div>
            </div>

            <div className={styles.securityNote}>
              <h4>Recomendaciones de seguridad:</h4>
              <ul>
                <li>Usa una contraseña única y compleja</li>
                <li>Cambia tu contraseña periódicamente</li>
                <li>No compartas tus credenciales</li>
                <li>Cierra sesión en dispositivos compartidos</li>
              </ul>
            </div>
          </Card>
        )}

        {activeTab === 'backup' && (
          <Card title="Respaldo de Datos">
            <div className={styles.backupOptions}>
              <p className={styles.backupText}>
                Realiza copias de seguridad de tus datos para evitar pérdidas
              </p>
              
              <div className={styles.backupActions}>
                <Button variant="primary" onClick={handleCreateBackup}>
                  Crear Respaldo
                </Button>
                <Button variant="outline" onClick={handleRestoreBackup}>
                  Restaurar Respaldo
                </Button>
              </div>

              <div className={styles.backupInfo}>
                <h4>Respaldos automáticos:</h4>
                <p>Último respaldo: Hoy 10:30 AM</p>
                <p>Próximo respaldo: Mañana 10:30 AM</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;