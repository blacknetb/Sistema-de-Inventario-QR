import React, { useState } from 'react';
import styles from './ProfilePage.module.css';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Input from '../../components/common/Input/Input';
import Alert from '../../components/common/Alert/Alert';

const ProfilePage = () => {
  const { user, updateProfile, logout } = useAuth();
  const { showSuccess, showError } = useNotifications();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
    position: user?.position || ''
  });
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState({ show: false, type: 'info', message: '' });

  // Mostrar alerta
  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
      setAlert(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpiar error del campo cuando el usuario escribe
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showAlert('error', 'La imagen no puede superar los 5MB');
        return;
      }
      
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        showAlert('error', 'Por favor selecciona un archivo de imagen válido');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name?.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    if (!formData.email?.trim()) {
      newErrors.email = 'El email es requerido';
    }
    return newErrors;
  };

  const handleSubmit = async () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showAlert('error', 'Por favor, complete todos los campos requeridos');
      return;
    }

    try {
      const result = await updateProfile({ ...formData, avatar });
      if (result.success) {
        showSuccess('Perfil actualizado exitosamente');
        setIsEditing(false);
        showAlert('success', 'Perfil actualizado exitosamente');
      }
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
      showError('Error al actualizar el perfil');
      showAlert('error', 'Error al actualizar el perfil');
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      department: user?.department || '',
      position: user?.position || ''
    });
    setAvatar(user?.avatar || null);
    setErrors({});
    setIsEditing(false);
  };

  return (
    <div className={styles.profilePage}>
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
        <h1 className={styles.title}>Mi Perfil</h1>
        {!isEditing && (
          <Button variant="primary" onClick={() => setIsEditing(true)}>
            Editar Perfil
          </Button>
        )}
      </div>

      <div className={styles.content}>
        <Card className={styles.profileCard}>
          <div className={styles.avatarSection}>
            <div className={styles.avatarContainer}>
              {avatar ? (
                <img src={avatar} alt={user?.name} className={styles.avatar} />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              {isEditing && (
                <label className={styles.avatarUpload}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className={styles.avatarInput}
                  />
                  <span className={styles.uploadIcon}>📷</span>
                </label>
              )}
            </div>
            <h2 className={styles.userName}>{user?.name}</h2>
            <p className={styles.userRole}>{user?.role || 'Usuario'}</p>
          </div>

          <div className={styles.infoSection}>
            {isEditing ? (
              <div className={styles.form}>
                <Input
                  label="Nombre completo"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  required
                />
                <Input
                  type="email"
                  label="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled
                />
                <Input
                  label="Teléfono"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+56 9 1234 5678"
                />
                <Input
                  label="Departamento"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Ej: Ventas"
                />
                <Input
                  label="Cargo"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  placeholder="Ej: Gerente"
                />
                <div className={styles.formActions}>
                  <Button variant="outline" onClick={handleCancel}>
                    Cancelar
                  </Button>
                  <Button variant="primary" onClick={handleSubmit}>
                    Guardar Cambios
                  </Button>
                </div>
              </div>
            ) : (
              <div className={styles.info}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Email:</span>
                  <span className={styles.infoValue}>{user?.email}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Teléfono:</span>
                  <span className={styles.infoValue}>
                    {user?.phone || 'No especificado'}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Departamento:</span>
                  <span className={styles.infoValue}>
                    {user?.department || 'No especificado'}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Cargo:</span>
                  <span className={styles.infoValue}>
                    {user?.position || 'No especificado'}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Miembro desde:</span>
                  <span className={styles.infoValue}>
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Enero 2024'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card title="Estadísticas de Actividad" className={styles.statsCard}>
          <div className={styles.statsGrid}>
            <div className={styles.stat}>
              <span className={styles.statValue}>156</span>
              <span className={styles.statLabel}>Productos creados</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>45</span>
              <span className={styles.statLabel}>Movimientos</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>12</span>
              <span className={styles.statLabel}>Reportes generados</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>30</span>
              <span className={styles.statLabel}>Días activo</span>
            </div>
          </div>
        </Card>

        <Card title="Acciones de Cuenta" className={styles.actionsCard}>
          <div className={styles.accountActions}>
            <Button variant="outline" onClick={() => {}}>
              Cambiar Contraseña
            </Button>
            <Button variant="outline" onClick={() => {}}>
              Configuración de Notificaciones
            </Button>
            <Button variant="danger" onClick={logout}>
              Cerrar Sesión
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;