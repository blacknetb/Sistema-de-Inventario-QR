import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import '../../assets/styles/common/profile.css';

const Profile = () => {
    const { user, updateProfile, changePassword, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [profileData, setProfileData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        direccion: '',
        empresa: ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [imagePreview, setImagePreview] = useState('');

    // Inicializar datos del perfil cuando se carga el usuario
    useEffect(() => {
        if (user) {
            setProfileData({
                nombre: user.nombre || '',
                apellido: user.apellido || '',
                email: user.email || '',
                telefono: user.telefono || '',
                direccion: user.direccion || '',
                empresa: user.empresa || ''
            });
            if (user.foto) {
                setImagePreview(user.foto);
            }
        }
    }, [user]);

    // Manejar cambio en datos del perfil
    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Manejar cambio en contraseñas
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Manejar cambio de imagen de perfil
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validar tipo de archivo
            const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (!validTypes.includes(file.type)) {
                setErrors(prev => ({
                    ...prev,
                    profileImage: 'Solo se permiten imágenes JPG, PNG o GIF'
                }));
                return;
            }

            // Validar tamaño (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setErrors(prev => ({
                    ...prev,
                    profileImage: 'La imagen no debe superar los 5MB'
                }));
                return;
            }

            setProfileImage(file);
            setImagePreview(URL.createObjectURL(file));
            setErrors(prev => ({
                ...prev,
                profileImage: ''
            }));
        }
    };

    // Validar datos del perfil
    const validateProfile = () => {
        const newErrors = {};
        
        if (!profileData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        }
        
        if (!profileData.apellido.trim()) {
            newErrors.apellido = 'El apellido es requerido';
        }
        
        if (!profileData.email) {
            newErrors.email = 'El correo electrónico es requerido';
        } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
            newErrors.email = 'Correo electrónico inválido';
        }
        
        if (profileData.telefono && !/^\d{10}$/.test(profileData.telefono)) {
            newErrors.telefono = 'Teléfono inválido (10 dígitos)';
        }
        
        return newErrors;
    };

    // Validar contraseñas
    const validatePasswords = () => {
        const newErrors = {};
        
        if (!passwordData.currentPassword) {
            newErrors.currentPassword = 'La contraseña actual es requerida';
        }
        
        if (!passwordData.newPassword) {
            newErrors.newPassword = 'La nueva contraseña es requerida';
        } else if (passwordData.newPassword.length < 6) {
            newErrors.newPassword = 'La contraseña debe tener al menos 6 caracteres';
        }
        
        if (!passwordData.confirmPassword) {
            newErrors.confirmPassword = 'Confirma tu nueva contraseña';
        } else if (passwordData.newPassword !== passwordData.confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }
        
        return newErrors;
    };

    // Manejar envío del formulario de perfil
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        
        const validationErrors = validateProfile();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        
        setLoading(true);
        setSuccess('');
        
        try {
            // Crear FormData para enviar imagen si existe
            const formData = new FormData();
            Object.keys(profileData).forEach(key => {
                formData.append(key, profileData[key]);
            });
            
            if (profileImage) {
                formData.append('foto', profileImage);
            }
            
            const result = await updateProfile(formData);
            
            if (result.success) {
                setSuccess('Perfil actualizado correctamente');
                setErrors({});
                // Limpiar mensaje después de 3 segundos
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setErrors({ general: result.error });
            }
        } catch (err) {
            setErrors({ general: 'Error al actualizar el perfil' });
        } finally {
            setLoading(false);
        }
    };

    // Manejar envío del formulario de contraseña
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        
        const validationErrors = validatePasswords();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        
        setLoading(true);
        setSuccess('');
        
        try {
            const result = await changePassword(
                passwordData.currentPassword,
                passwordData.newPassword
            );
            
            if (result.success) {
                setSuccess('Contraseña cambiada correctamente');
                setErrors({});
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                // Limpiar mensaje después de 3 segundos
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setErrors({ general: result.error });
            }
        } catch (err) {
            setErrors({ general: 'Error al cambiar la contraseña' });
        } finally {
            setLoading(false);
        }
    };

    // Renderizar pestaña de perfil
    const renderProfileTab = () => (
        <form onSubmit={handleProfileSubmit} className="profile-form">
            {errors.general && (
                <div className="alert alert-danger">
                    {errors.general}
                </div>
            )}
            
            {success && (
                <div className="alert alert-success">
                    {success}
                </div>
            )}
            
            <div className="profile-header">
                <div className="profile-avatar-container">
                    <div className="profile-avatar-wrapper">
                        <img 
                            src={imagePreview || '/default-avatar.png'} 
                            alt="Avatar" 
                            className="profile-avatar"
                        />
                        <label className="avatar-upload-label">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="avatar-upload-input"
                            />
                            <span className="avatar-upload-text">
                                <i className="fas fa-camera"></i>
                                Cambiar foto
                            </span>
                        </label>
                    </div>
                    {errors.profileImage && (
                        <span className="error-message">{errors.profileImage}</span>
                    )}
                </div>
                
                <div className="profile-info-header">
                    <h2>{`${profileData.nombre} ${profileData.apellido}`}</h2>
                    <p className="profile-role">
                        <span className="role-badge">{user?.rol || 'Usuario'}</span>
                    </p>
                    <p className="profile-email">{profileData.email}</p>
                </div>
            </div>
            
            <div className="form-grid">
                <div className="form-group">
                    <label htmlFor="nombre">Nombre *</label>
                    <input
                        type="text"
                        id="nombre"
                        name="nombre"
                        value={profileData.nombre}
                        onChange={handleProfileChange}
                        className={errors.nombre ? 'input-error' : ''}
                    />
                    {errors.nombre && <span className="error-message">{errors.nombre}</span>}
                </div>
                
                <div className="form-group">
                    <label htmlFor="apellido">Apellido *</label>
                    <input
                        type="text"
                        id="apellido"
                        name="apellido"
                        value={profileData.apellido}
                        onChange={handleProfileChange}
                        className={errors.apellido ? 'input-error' : ''}
                    />
                    {errors.apellido && <span className="error-message">{errors.apellido}</span>}
                </div>
                
                <div className="form-group">
                    <label htmlFor="email">Correo Electrónico *</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleProfileChange}
                        className={errors.email ? 'input-error' : ''}
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                </div>
                
                <div className="form-group">
                    <label htmlFor="telefono">Teléfono</label>
                    <input
                        type="tel"
                        id="telefono"
                        name="telefono"
                        value={profileData.telefono}
                        onChange={handleProfileChange}
                        className={errors.telefono ? 'input-error' : ''}
                        placeholder="5551234567"
                    />
                    {errors.telefono && <span className="error-message">{errors.telefono}</span>}
                </div>
                
                <div className="form-group">
                    <label htmlFor="empresa">Empresa</label>
                    <input
                        type="text"
                        id="empresa"
                        name="empresa"
                        value={profileData.empresa}
                        onChange={handleProfileChange}
                        placeholder="Nombre de tu empresa"
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="direccion">Dirección</label>
                    <textarea
                        id="direccion"
                        name="direccion"
                        value={profileData.direccion}
                        onChange={handleProfileChange}
                        rows="3"
                        placeholder="Dirección completa"
                    />
                </div>
            </div>
            
            <div className="form-actions">
                <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                >
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                        setProfileData({
                            nombre: user?.nombre || '',
                            apellido: user?.apellido || '',
                            email: user?.email || '',
                            telefono: user?.telefono || '',
                            direccion: user?.direccion || '',
                            empresa: user?.empresa || ''
                        });
                        setErrors({});
                    }}
                >
                    Cancelar
                </button>
            </div>
        </form>
    );

    // Renderizar pestaña de seguridad
    const renderSecurityTab = () => (
        <form onSubmit={handlePasswordSubmit} className="security-form">
            {errors.general && (
                <div className="alert alert-danger">
                    {errors.general}
                </div>
            )}
            
            {success && (
                <div className="alert alert-success">
                    {success}
                </div>
            )}
            
            <div className="form-group">
                <label htmlFor="currentPassword">Contraseña Actual *</label>
                <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className={errors.currentPassword ? 'input-error' : ''}
                    placeholder="Ingresa tu contraseña actual"
                />
                {errors.currentPassword && (
                    <span className="error-message">{errors.currentPassword}</span>
                )}
            </div>
            
            <div className="form-group">
                <label htmlFor="newPassword">Nueva Contraseña *</label>
                <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className={errors.newPassword ? 'input-error' : ''}
                    placeholder="Mínimo 6 caracteres"
                />
                {errors.newPassword && (
                    <span className="error-message">{errors.newPassword}</span>
                )}
                <small className="form-help">
                    La contraseña debe tener al menos 6 caracteres
                </small>
            </div>
            
            <div className="form-group">
                <label htmlFor="confirmPassword">Confirmar Nueva Contraseña *</label>
                <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className={errors.confirmPassword ? 'input-error' : ''}
                    placeholder="Repite la nueva contraseña"
                />
                {errors.confirmPassword && (
                    <span className="error-message">{errors.confirmPassword}</span>
                )}
            </div>
            
            <div className="password-strength">
                <div className="strength-meter">
                    <div 
                        className="strength-bar" 
                        style={{ 
                            width: `${Math.min((passwordData.newPassword.length / 6) * 100, 100)}%`,
                            backgroundColor: passwordData.newPassword.length >= 6 ? '#10b981' : '#ef4444'
                        }}
                    ></div>
                </div>
                <div className="strength-label">
                    {passwordData.newPassword.length >= 6 ? 'Contraseña segura' : 'Contraseña débil'}
                </div>
            </div>
            
            <div className="form-actions">
                <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                >
                    {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
                </button>
                <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                        setPasswordData({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                        });
                        setErrors({});
                    }}
                >
                    Cancelar
                </button>
            </div>
        </form>
    );

    // Renderizar pestaña de actividad
    const renderActivityTab = () => (
        <div className="activity-tab">
            <h3>Actividad Reciente</h3>
            <div className="activity-list">
                {/* Aquí iría la lista de actividades del usuario */}
                <div className="activity-item">
                    <div className="activity-icon">
                        <i className="fas fa-sign-in-alt"></i>
                    </div>
                    <div className="activity-content">
                        <p>Sesión iniciada desde dispositivo Chrome</p>
                        <span className="activity-time">Hace 2 horas</span>
                    </div>
                </div>
                <div className="activity-item">
                    <div className="activity-icon">
                        <i className="fas fa-qrcode"></i>
                    </div>
                    <div className="activity-content">
                        <p>Escaneado código QR: INV-2023-001</p>
                        <span className="activity-time">Hoy, 10:30 AM</span>
                    </div>
                </div>
                <div className="activity-item">
                    <div className="activity-icon">
                        <i className="fas fa-file-export"></i>
                    </div>
                    <div className="activity-content">
                        <p>Reporte generado: Inventario General</p>
                        <span className="activity-time">Ayer, 3:45 PM</span>
                    </div>
                </div>
            </div>
        </div>
    );

    // Renderizar pestaña de configuración
    const renderSettingsTab = () => (
        <div className="settings-tab">
            <h3>Configuración de Cuenta</h3>
            
            <div className="settings-section">
                <h4>Preferencias de Notificación</h4>
                <div className="setting-item">
                    <label className="setting-label">
                        <input type="checkbox" defaultChecked />
                        <span>Notificaciones por correo electrónico</span>
                    </label>
                    <p className="setting-description">
                        Recibe notificaciones sobre actividad importante
                    </p>
                </div>
                <div className="setting-item">
                    <label className="setting-label">
                        <input type="checkbox" defaultChecked />
                        <span>Alertas de inventario bajo</span>
                    </label>
                    <p className="setting-description">
                        Recibe alertas cuando el inventario esté por debajo del mínimo
                    </p>
                </div>
                <div className="setting-item">
                    <label className="setting-label">
                        <input type="checkbox" />
                        <span>Resumen semanal</span>
                    </label>
                    <p className="setting-description">
                        Recibe un resumen semanal de la actividad del inventario
                    </p>
                </div>
            </div>
            
            <div className="settings-section">
                <h4>Preferencias de Tema</h4>
                <div className="theme-selector">
                    <button className="theme-option active">
                        <i className="fas fa-sun"></i>
                        <span>Claro</span>
                    </button>
                    <button className="theme-option">
                        <i className="fas fa-moon"></i>
                        <span>Oscuro</span>
                    </button>
                    <button className="theme-option">
                        <i className="fas fa-adjust"></i>
                        <span>Automático</span>
                    </button>
                </div>
            </div>
            
            <div className="danger-zone">
                <h4>Zona de Peligro</h4>
                <p className="danger-warning">
                    Estas acciones no se pueden deshacer. Procede con precaución.
                </p>
                <div className="danger-actions">
                    <button 
                        className="btn btn-danger"
                        onClick={() => {
                            if (window.confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) {
                                // Lógica para eliminar cuenta
                            }
                        }}
                    >
                        <i className="fas fa-trash"></i>
                        Eliminar Cuenta
                    </button>
                    <button 
                        className="btn btn-warning"
                        onClick={logout}
                    >
                        <i className="fas fa-sign-out-alt"></i>
                        Cerrar Sesión en Todos los Dispositivos
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="profile-container">
            <div className="profile-card">
                <div className="profile-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <i className="fas fa-user"></i>
                        Perfil
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                        onClick={() => setActiveTab('security')}
                    >
                        <i className="fas fa-shield-alt"></i>
                        Seguridad
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
                        onClick={() => setActiveTab('activity')}
                    >
                        <i className="fas fa-history"></i>
                        Actividad
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        <i className="fas fa-cog"></i>
                        Configuración
                    </button>
                </div>
                
                <div className="tab-content">
                    {activeTab === 'profile' && renderProfileTab()}
                    {activeTab === 'security' && renderSecurityTab()}
                    {activeTab === 'activity' && renderActivityTab()}
                    {activeTab === 'settings' && renderSettingsTab()}
                </div>
            </div>
        </div>
    );
};

export default Profile;