import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import {
  User, Mail, Phone, MapPin, Lock,
  Camera, Save, Shield, Bell, Globe,
  Key, Eye, EyeOff, CheckCircle, AlertCircle,
  Building, Calendar, ShieldCheck,
  Upload, Loader2, Edit2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// ✅ MEJORA: Configuración centralizada
const API_CONFIG = {
  BASE_URL: globalThis.APP_CONFIG?.apiUrl || 'http://localhost:3000/api',
  getAuthHeader: () => ({
    'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  })
};

// ✅ MEJORA: Expresiones regulares para validación
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// ✅ MEJORA: Custom Hook para manejo de usuario optimizado
const useUserProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [originalUser, setOriginalUser] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_CONFIG.BASE_URL}/profile`, {
        headers: API_CONFIG.getAuthHeader()
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // ✅ MEJORA: Validar estructura de datos
      if (!data || typeof data !== 'object') {
        throw new Error('Datos de perfil inválidos');
      }

      setUser(data);
      setOriginalUser(structuredClone(data));
      setError(null);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err.message);
      toast.error(err.message || 'Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const updateUser = useCallback((updates) => {
    if (!user) return;

    setUser(prev => {
      const updated = { ...prev, ...updates };
      // ✅ MEJORA: Verificar si hay cambios
      const hasChanges = JSON.stringify(updated) !== JSON.stringify(originalUser);
      setIsDirty(hasChanges);
      return updated;
    });
  }, [user, originalUser]);

  const resetChanges = useCallback(() => {
    if (originalUser) {
      setUser(structuredClone(originalUser));
      setIsDirty(false);
    }
  }, [originalUser]);

  const saveChanges = useCallback(async () => {
    if (!user || !isDirty) return false;

    try {
      setSaving(true);

      // ✅ MEJORA: Validar datos antes de enviar
      const validationErrors = validateUserData(user);
      if (validationErrors.length > 0) {
        toast.error(validationErrors.join(', '));
        return false;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/profile`, {
        method: 'PUT',
        headers: API_CONFIG.getAuthHeader(),
        body: JSON.stringify(user)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al guardar cambios');
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      setOriginalUser(structuredClone(updatedUser));
      setIsDirty(false);

      toast.success('Perfil actualizado correctamente');
      return true;
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.error(err.message || 'Error al guardar los cambios');
      return false;
    } finally {
      setSaving(false);
    }
  }, [user, isDirty]);

  const uploadAvatar = useCallback(async (file) => {
    try {
      if (!file || !file.type.startsWith('image/')) {
        throw new Error('Archivo de imagen inválido');
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB
        throw new Error('La imagen no debe superar los 5MB');
      }

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${API_CONFIG.BASE_URL}/profile/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': API_CONFIG.getAuthHeader().Authorization
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Error al subir la imagen');
      }

      const data = await response.json();
      updateUser({ avatar: data.avatarUrl });
      toast.success('Foto de perfil actualizada');
      return data.avatarUrl;
    } catch (err) {
      console.error('Error uploading avatar:', err);
      toast.error(err.message || 'Error al subir la imagen');
      throw err;
    }
  }, [updateUser]);

  return {
    user,
    loading,
    error,
    isDirty,
    saving,
    updateUser,
    resetChanges,
    saveChanges,
    uploadAvatar,
    fetchUserData
  };
};

// ✅ MEJORA: Custom Hook para manejo de contraseña optimizado
const usePasswordManager = () => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [passwordStrength, setPasswordStrength] = useState(0);
  const [changing, setChanging] = useState(false);

  const calculatePasswordStrength = useCallback((password) => {
    if (!password) return 0;

    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return Math.min(strength, 4);
  }, []);

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(passwordData.newPassword));
  }, [passwordData.newPassword, calculatePasswordStrength]);

  const updatePasswordData = useCallback((field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  }, []);

  const togglePasswordVisibility = useCallback((field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const changePassword = useCallback(async () => {
    try {
      setChanging(true);

      // ✅ MEJORA: Validaciones exhaustivas
      if (!passwordData.currentPassword) {
        throw new Error('La contraseña actual es requerida');
      }

      if (!PASSWORD_REGEX.test(passwordData.newPassword)) {
        throw new Error('La nueva contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales');
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/profile/password`, {
        method: 'PUT',
        headers: API_CONFIG.getAuthHeader(),
        body: JSON.stringify(passwordData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al cambiar contraseña');
      }

      // ✅ MEJORA: Resetear formulario
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Contraseña cambiada correctamente');
    } catch (err) {
      console.error('Error changing password:', err);
      toast.error(err.message || 'Error al cambiar la contraseña');
      throw err;
    } finally {
      setChanging(false);
    }
  }, [passwordData]);

  return {
    passwordData,
    showPasswords,
    passwordStrength,
    changing,
    updatePasswordData,
    togglePasswordVisibility,
    changePassword
  };
};

// ✅ MEJORA: Custom Hook para preferencias optimizado
const usePreferences = () => {
  const [preferences, setPreferences] = useState({
    notifications: {
      email: true,
      push: true,
      lowStock: true,
      weeklyReport: false,
      orderUpdates: true,
      securityAlerts: true
    },
    display: {
      theme: 'light',
      language: 'es',
      timezone: 'America/Mexico_City',
      dateFormat: 'DD/MM/YYYY'
    },
    privacy: {
      profileVisibility: 'team',
      activityLog: true,
      dataSharing: false
    }
  });

  const [saving, setSaving] = useState(false);

  const updatePreference = useCallback((category, key, value) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  }, []);

  const savePreferences = useCallback(async () => {
    try {
      setSaving(true);

      const response = await fetch(`${API_CONFIG.BASE_URL}/profile/preferences`, {
        method: 'PUT',
        headers: API_CONFIG.getAuthHeader(),
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        throw new Error('Error al guardar preferencias');
      }

      toast.success('Preferencias guardadas correctamente');
      return true;
    } catch (err) {
      console.error('Error saving preferences:', err);
      toast.error(err.message || 'Error al guardar preferencias');
      return false;
    } finally {
      setSaving(false);
    }
  }, [preferences]);

  const resetPreferences = useCallback(() => {
    setPreferences({
      notifications: {
        email: true,
        push: true,
        lowStock: true,
        weeklyReport: false,
        orderUpdates: true,
        securityAlerts: true
      },
      display: {
        theme: 'light',
        language: 'es',
        timezone: 'America/Mexico_City',
        dateFormat: 'DD/MM/YYYY'
      },
      privacy: {
        profileVisibility: 'team',
        activityLog: true,
        dataSharing: false
      }
    });
  }, []);

  return {
    preferences,
    saving,
    updatePreference,
    savePreferences,
    resetPreferences
  };
};

// ✅ MEJORA: Custom Hook para sesiones activas
const useActiveSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_CONFIG.BASE_URL}/profile/sessions`, {
        headers: API_CONFIG.getAuthHeader()
      });

      if (!response.ok) {
        throw new Error('Error al cargar sesiones');
      }

      const data = await response.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      toast.error('Error al cargar sesiones activas');
    } finally {
      setLoading(false);
    }
  }, []);

  const terminateSession = useCallback(async (sessionId) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/profile/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: API_CONFIG.getAuthHeader()
      });

      if (!response.ok) {
        throw new Error('Error al terminar sesión');
      }

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      toast.success('Sesión terminada');
    } catch (err) {
      console.error('Error terminating session:', err);
      toast.error('Error al terminar sesión');
    }
  }, []);

  const terminateAllSessions = useCallback(async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/profile/sessions`, {
        method: 'DELETE',
        headers: API_CONFIG.getAuthHeader()
      });

      if (!response.ok) {
        throw new Error('Error al terminar todas las sesiones');
      }

      setSessions([]);
      toast.success('Todas las sesiones terminadas');
    } catch (err) {
      console.error('Error terminating all sessions:', err);
      toast.error('Error al terminar sesiones');
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    fetchSessions,
    terminateSession,
    terminateAllSessions
  };
};

// ✅ MEJORA: Componente para subida de avatar optimizado
const AvatarUpload = React.memo(({ currentAvatar, onAvatarChange, uploading }) => {
  const [preview, setPreview] = useState(currentAvatar);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    setPreview(currentAvatar);
  }, [currentAvatar]);

  const handleFileChange = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    handleFile(file);
  }, []);

  const handleFile = useCallback((file) => {
    // Validar tipo y tamaño
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida (JPEG, PNG, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast.error('La imagen no debe superar los 5MB');
      return;
    }

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      onAvatarChange(file);
    };
    reader.onerror = () => {
      toast.error('Error al leer la imagen');
    };
    reader.readAsDataURL(file);
  }, [onAvatarChange]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="relative group">
      <div
        className={`relative w-32 h-32 rounded-full overflow-hidden border-4 transition-all duration-300 ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-white shadow-lg'
          }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        tabIndex={0}
        aria-label="Cambiar foto de perfil"
        onKeyDown={(e) => e.key === 'Enter' && triggerFileInput()}
      >
        {preview ? (
          <img
            src={preview}
            alt="Avatar del usuario"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <User className="w-12 h-12 text-white" />
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Camera className="w-6 h-6 text-white" />
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center space-y-2">
        <label className="cursor-pointer">
          <div className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center">
            <Upload className="w-4 h-4 mr-2" />
            Cambiar foto
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        <p className="text-xs text-gray-500 text-center">
          PNG, JPG hasta 5MB
        </p>
      </div>
    </div>
  );
});

AvatarUpload.displayName = 'AvatarUpload';

// ✅ MEJORA: Componente para indicador de seguridad de contraseña
const PasswordStrengthIndicator = React.memo(({ strength }) => {
  const getStrengthConfig = useCallback((strength) => {
    switch (strength) {
      case 0: return { color: 'bg-gray-200', text: 'Muy débil', textColor: 'text-gray-600' };
      case 1: return { color: 'bg-red-500', text: 'Débil', textColor: 'text-red-600' };
      case 2: return { color: 'bg-orange-500', text: 'Moderada', textColor: 'text-orange-600' };
      case 3: return { color: 'bg-yellow-500', text: 'Buena', textColor: 'text-yellow-600' };
      case 4: return { color: 'bg-green-500', text: 'Excelente', textColor: 'text-green-600' };
      default: return { color: 'bg-gray-200', text: '', textColor: 'text-gray-600' };
    }
  }, []);

  const { color, text, textColor } = getStrengthConfig(strength);

  return (
    <div className="mt-3 space-y-2">
      <div className="flex space-x-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-2 flex-1 rounded-full transition-all duration-300 ${level <= strength ? color : 'bg-gray-200'
              }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${textColor}`}>
        Seguridad: {text}
      </p>
    </div>
  );
});

PasswordStrengthIndicator.displayName = 'PasswordStrengthIndicator';

// ✅ MEJORA: Componente de TabButton reutilizable
const TabButton = ({ tab, isActive, onClick }) => {
  const Icon = tab.icon;

  return (
    <button
      onClick={() => onClick(tab.id)}
      className={`shrink-0 px-6 py-4 text-sm font-medium flex items-center whitespace-nowrap transition-all duration-200 ${isActive
        ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }`}
      aria-selected={isActive}
      type="button"
    >
      <Icon className="w-5 h-5 mr-3" />
      {tab.label}
    </button>
  );
};

TabButton.propTypes = {
  tab: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired
};

// ✅ MEJORA: Componente de Input con validación
const ValidatedInput = React.memo(({
  label,
  type = 'text',
  name,
  value,
  onChange,
  error,
  icon: Icon,
  placeholder,
  required = false,
  disabled = false,
  ...props
}) => {
  const [isTouched, setIsTouched] = useState(false);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {Icon && <Icon className="w-4 h-4 inline mr-2 text-gray-400" />}
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          name={name}
          value={value || ''}
          onChange={(e) => {
            onChange(e);
            setIsTouched(true);
          }}
          onBlur={() => setIsTouched(true)}
          disabled={disabled}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200 ${error && isTouched
            ? 'border-red-500 bg-red-50'
            : 'border-gray-300 bg-white'
            } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          placeholder={placeholder}
          aria-invalid={!!error && isTouched}
          aria-describedby={error && isTouched ? `${name}-error` : undefined}
          {...props}
        />
      </div>
      {error && isTouched && (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
});

ValidatedInput.displayName = 'ValidatedInput';

ValidatedInput.propTypes = {
  label: PropTypes.string.isRequired,
  type: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  icon: PropTypes.elementType,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool
};

// ✅ MEJORA: Componentes separados para cada tab para reducir complejidad

// Componente para la pestaña de información personal
const PersonalTab = React.memo(({ 
  user, 
  isEditing, 
  uploadingAvatar, 
  handleAvatarChange, 
  updateUser, 
  validateEmail, 
  validatePhone, 
  formatDate 
}) => {
  const getRequiredFieldError = (value) => value?.trim() ? null : 'Este campo es requerido';
  const getEmailError = (email) => validateEmail(email || '') ? null : 'Correo electrónico inválido';
  const getPhoneError = (phone) => validatePhone(phone || '') ? null : 'Número de teléfono inválido';

  const getStatusConfig = (status) => {
    return status === 'active' 
      ? { class: 'bg-green-100 text-green-800', label: 'Activa' }
      : { class: 'bg-gray-100 text-gray-800', label: 'Inactiva' };
  };

  const statusConfig = getStatusConfig(user?.status);

  return (
    <motion.div
      key="personal"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Avatar y información básica */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
        <div className="shrink-0">
          <AvatarUpload
            currentAvatar={user?.avatar}
            onAvatarChange={handleAvatarChange}
            uploading={uploadingAvatar}
          />
        </div>

        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {user?.firstName} {user?.lastName}
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-gray-600">
            <div className="flex items-center">
              <Building className="w-4 h-4 mr-2" />
              <span>{user?.department || 'Sin departamento'}</span>
            </div>
            <div className="flex items-center">
              <ShieldCheck className="w-4 h-4 mr-2" />
              <span className="capitalize">{user?.role || 'Usuario'}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Miembro desde: {formatDate(user?.joinDate)}</span>
            </div>
          </div>

          <div className="mt-4 p-4 bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-medium">ID de usuario:</span>{' '}
              <span className="font-mono">#{String(user?.id || '').padStart(6, '0')}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Formulario de información personal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ValidatedInput
          label="Nombre"
          type="text"
          name="firstName"
          value={user?.firstName || ''}
          onChange={(e) => updateUser({ firstName: e.target.value })}
          error={getRequiredFieldError(user?.firstName)}
          icon={User}
          placeholder="Juan"
          required
          disabled={!isEditing}
        />

        <ValidatedInput
          label="Apellido"
          type="text"
          name="lastName"
          value={user?.lastName || ''}
          onChange={(e) => updateUser({ lastName: e.target.value })}
          error={getRequiredFieldError(user?.lastName)}
          placeholder="Pérez"
          required
          disabled={!isEditing}
        />

        <ValidatedInput
          label="Correo Electrónico"
          type="email"
          name="email"
          value={user?.email || ''}
          onChange={(e) => updateUser({ email: e.target.value })}
          error={getEmailError(user?.email)}
          icon={Mail}
          placeholder="ejemplo@correo.com"
          required
          disabled={!isEditing}
        />

        <ValidatedInput
          label="Teléfono"
          type="tel"
          name="phone"
          value={user?.phone || ''}
          onChange={(e) => updateUser({ phone: e.target.value })}
          error={getPhoneError(user?.phone)}
          icon={Phone}
          placeholder="+52 55 1234 5678"
          required
          disabled={!isEditing}
        />

        <div className="md:col-span-2">
          <ValidatedInput
            label="Dirección"
            type="text"
            name="address"
            value={user?.address || ''}
            onChange={(e) => updateUser({ address: e.target.value })}
            icon={MapPin}
            placeholder="Av. Principal #123, Ciudad, CP 12345"
            disabled={!isEditing}
          />
        </div>

        <ValidatedInput
          label="Empresa"
          type="text"
          name="company"
          value={user?.company || ''}
          onChange={(e) => updateUser({ company: e.target.value })}
          icon={Building}
          placeholder="Nombre de tu empresa"
          disabled={!isEditing}
        />

        <ValidatedInput
          label="Idioma preferido"
          type="text"
          name="language"
          value={user?.language || 'Español'}
          onChange={(e) => updateUser({ language: e.target.value })}
          icon={Globe}
          disabled={!isEditing}
        />
      </div>

      {/* Información adicional */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de la cuenta</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Última actualización</p>
            <p className="font-medium text-gray-900">
              {user?.lastUpdated ? formatDate(user.lastUpdated) : 'Nunca'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Estado de la cuenta</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.class}`}>
              {statusConfig.label}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Verificación</p>
            <div className="flex items-center">
              {user?.emailVerified ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-700 font-medium">Verificado</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-yellow-500 mr-1" />
                  <span className="text-yellow-700 font-medium">Pendiente</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

PersonalTab.displayName = 'PersonalTab';

PersonalTab.propTypes = {
  user: PropTypes.object,
  isEditing: PropTypes.bool.isRequired,
  uploadingAvatar: PropTypes.bool.isRequired,
  handleAvatarChange: PropTypes.func.isRequired,
  updateUser: PropTypes.func.isRequired,
  validateEmail: PropTypes.func.isRequired,
  validatePhone: PropTypes.func.isRequired,
  formatDate: PropTypes.func.isRequired
};

// Componente para la pestaña de seguridad
const SecurityTab = React.memo(({ 
  passwordData, 
  showPasswords, 
  passwordStrength, 
  changing, 
  updatePasswordData, 
  togglePasswordVisibility, 
  changePassword,
  user 
}) => {
  return (
    <motion.div
      key="security"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Alerta de seguridad */}
      <div className="bg-linear-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-start">
          <Shield className="w-6 h-6 text-yellow-600 mr-3 mt-1 shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Seguridad de la cuenta</h3>
            <p className="text-yellow-700">
              Por seguridad, te recomendamos cambiar tu contraseña periódicamente, habilitar autenticación de dos factores y revisar regularmente tus sesiones activas.
            </p>
          </div>
        </div>
      </div>

      {/* Cambio de contraseña */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900">Cambiar contraseña</h3>

        <ValidatedInput
          label="Contraseña Actual"
          type={showPasswords.current ? "text" : "password"}
          name="currentPassword"
          value={passwordData.currentPassword}
          onChange={(e) => updatePasswordData('currentPassword', e.target.value)}
          icon={Lock}
          placeholder="••••••••"
        />

        <ValidatedInput
          label="Nueva Contraseña"
          type={showPasswords.new ? "text" : "password"}
          name="newPassword"
          value={passwordData.newPassword}
          onChange={(e) => updatePasswordData('newPassword', e.target.value)}
          icon={Lock}
          placeholder="••••••••"
        />

        {passwordData.newPassword && <PasswordStrengthIndicator strength={passwordStrength} />}

        <ValidatedInput
          label="Confirmar Nueva Contraseña"
          type={showPasswords.confirm ? "text" : "password"}
          name="confirmPassword"
          value={passwordData.confirmPassword}
          onChange={(e) => updatePasswordData('confirmPassword', e.target.value)}
          placeholder="••••••••"
        />

        {/* Botones para mostrar/ocultar contraseñas */}
        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => togglePasswordVisibility('current')}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center transition-colors duration-200"
          >
            {showPasswords.current ? (
              <EyeOff className="w-4 h-4 mr-1" />
            ) : (
              <Eye className="w-4 h-4 mr-1" />
            )}
            {showPasswords.current ? 'Ocultar' : 'Mostrar'} contraseña actual
          </button>

          <button
            type="button"
            onClick={() => togglePasswordVisibility('new')}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center transition-colors duration-200"
          >
            {showPasswords.new ? (
              <EyeOff className="w-4 h-4 mr-1" />
            ) : (
              <Eye className="w-4 h-4 mr-1" />
            )}
            {showPasswords.new ? 'Ocultar' : 'Mostrar'} nueva contraseña
          </button>

          <button
            type="button"
            onClick={() => togglePasswordVisibility('confirm')}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center transition-colors duration-200"
          >
            {showPasswords.confirm ? (
              <EyeOff className="w-4 h-4 mr-1" />
            ) : (
              <Eye className="w-4 h-4 mr-1" />
            )}
            {showPasswords.confirm ? 'Ocultar' : 'Mostrar'} confirmación
          </button>
        </div>

        <button
          onClick={changePassword}
          disabled={changing || passwordStrength < 3 || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
          className="px-6 py-3 bg-linear-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center"
        >
          {changing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Cambiando contraseña...
            </>
          ) : (
            'Cambiar Contraseña'
          )}
        </button>
      </div>

      {/* Autenticación de dos factores */}
      <div className="pt-6 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Autenticación de Dos Factores
            </h4>
            <p className="text-gray-600 max-w-2xl">
              Aumenta la seguridad de tu cuenta requiriendo un código adicional de verificación cada vez que inicies sesión desde un dispositivo nuevo.
            </p>
          </div>
          <button className="px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium flex items-center whitespace-nowrap">
            {user?.twoFactorEnabled ? 'Deshabilitar' : 'Habilitar'} 2FA
          </button>
        </div>
      </div>
    </motion.div>
  );
});

SecurityTab.displayName = 'SecurityTab';

SecurityTab.propTypes = {
  passwordData: PropTypes.object.isRequired,
  showPasswords: PropTypes.object.isRequired,
  passwordStrength: PropTypes.number.isRequired,
  changing: PropTypes.bool.isRequired,
  updatePasswordData: PropTypes.func.isRequired,
  togglePasswordVisibility: PropTypes.func.isRequired,
  changePassword: PropTypes.func.isRequired,
  user: PropTypes.object
};

// Componente para la pestaña de preferencias
const PreferencesTab = React.memo(({ 
  preferences, 
  savingPreferences, 
  updatePreference, 
  savePreferences, 
  resetPreferences 
}) => {
  return (
    <motion.div
      key="preferences"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Notificaciones */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Notificaciones</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(preferences.notifications).map(([key, value]) => (
            <label
              key={key}
              className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors duration-200 cursor-pointer"
            >
              <div className="flex items-center">
                <Bell className="w-5 h-5 text-gray-500 mr-3" />
                <div>
                  <span className="block font-medium text-gray-900">
                    {key === 'email' && 'Notificaciones por correo'}
                    {key === 'push' && 'Notificaciones push'}
                    {key === 'lowStock' && 'Alertas de stock bajo'}
                    {key === 'weeklyReport' && 'Reporte semanal'}
                    {key === 'orderUpdates' && 'Actualizaciones de pedidos'}
                    {key === 'securityAlerts' && 'Alertas de seguridad'}
                  </span>
                  <span className="block text-sm text-gray-500 mt-1">
                    {key === 'email' && 'Recibir notificaciones por correo electrónico'}
                    {key === 'push' && 'Notificaciones en tiempo real en el navegador'}
                    {key === 'lowStock' && 'Alertas cuando el stock esté bajo'}
                    {key === 'weeklyReport' && 'Reporte semanal de actividad'}
                    {key === 'orderUpdates' && 'Actualizaciones sobre tus pedidos'}
                    {key === 'securityAlerts' && 'Alertas importantes de seguridad'}
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => updatePreference('notifications', key, e.target.checked)}
                className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-offset-2"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Configuración regional */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Configuración Regional</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="language-select"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Idioma
            </label>
            <select
              id="language-select"
              value={preferences.display.language}
              onChange={(e) => updatePreference('display', 'language', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200 bg-white"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="pt">Português</option>
              <option value="fr">Français</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="timezone-select"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Zona horaria
            </label>
            <select
              id="timezone-select"
              value={preferences.display.timezone}
              onChange={(e) => updatePreference('display', 'timezone', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200 bg-white"
            >
              <option value="America/Mexico_City">Ciudad de México (UTC-6)</option>
              <option value="America/New_York">Nueva York (UTC-5)</option>
              <option value="Europe/Madrid">Madrid (UTC+1)</option>
              <option value="America/Los_Angeles">Los Ángeles (UTC-8)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="theme-select"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Tema
            </label>
            <select
              id="theme-select"
              value={preferences.display.theme}
              onChange={(e) => updatePreference('display', 'theme', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200 bg-white"
            >
              <option value="light">Claro</option>
              <option value="dark">Oscuro</option>
              <option value="system">Sistema</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="date-format-select"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Formato de fecha
            </label>
            <select
              id="date-format-select"
              value={preferences.display.dateFormat}
              onChange={(e) => updatePreference('display', 'dateFormat', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200 bg-white"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>

        {/* Privacidad */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Privacidad</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors duration-200 cursor-pointer">
              <div>
                <label
                  htmlFor="profileVisibility"
                  className="block font-medium text-gray-900"
                >
                  Visibilidad del perfil
                </label>
                <span className="block text-sm text-gray-500 mt-1">
                  Controla quién puede ver tu perfil
                </span>
              </div>
              <select
                id="profileVisibility"
                value={preferences.privacy.profileVisibility}
                onChange={(e) =>
                  updatePreference("privacy", "profileVisibility", e.target.value)
                }
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                <option value="private">Privado</option>
                <option value="team">Solo equipo</option>
                <option value="public">Público</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors duration-200 cursor-pointer">
              <div>
                <span className="block font-medium text-gray-900">Registro de actividad</span>
                <span className="block text-sm text-gray-500 mt-1">
                  Guardar historial de tu actividad
                </span>
              </div>
              <input
                id="activityLog"
                type="checkbox"
                checked={preferences.privacy.activityLog}
                onChange={(e) =>
                  updatePreference("privacy", "activityLog", e.target.checked)
                }
                className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-offset-2"
              />
              <label htmlFor="activityLog" className="sr-only">
                Registro de actividad
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors duration-200 cursor-pointer">
              <div>
                <span className="block font-medium text-gray-900">Compartir datos</span>
                <span className="block text-sm text-gray-500 mt-1">
                  Permitir compartir datos anónimos para mejorar el servicio
                </span>
              </div>
              <input
                id="dataSharing"
                type="checkbox"
                checked={preferences.privacy.dataSharing}
                onChange={(e) =>
                  updatePreference("privacy", "dataSharing", e.target.checked)
                }
                className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-offset-2"
              />
              <label htmlFor="dataSharing" className="sr-only">
                Compartir datos
              </label>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            onClick={resetPreferences}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
          >
            Restablecer valores
          </button>
          <button
            onClick={savePreferences}
            disabled={savingPreferences}
            className="px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium flex items-center disabled:opacity-50"
          >
            {savingPreferences ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Preferencias'
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
});

PreferencesTab.displayName = 'PreferencesTab';

PreferencesTab.propTypes = {
  preferences: PropTypes.object.isRequired,
  savingPreferences: PropTypes.bool.isRequired,
  updatePreference: PropTypes.func.isRequired,
  savePreferences: PropTypes.func.isRequired,
  resetPreferences: PropTypes.func.isRequired
};

// Componente para la pestaña de sesiones activas
const SessionsTab = React.memo(({ 
  sessions, 
  loadingSessions, 
  terminateSession, 
  terminateAllSessions 
}) => {
  let content;

  if (loadingSessions) {
    content = (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
        <p className="text-gray-600">Cargando sesiones...</p>
      </div>
    );
  } else if (sessions.length === 0) {
    content = (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">No hay sesiones activas</h4>
        <p className="text-gray-600">
          No se encontraron sesiones activas en otros dispositivos.
        </p>
      </div>
    );
  } else {
    content = (
      <div className="space-y-4">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-sm transition-shadow duration-200"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  <div
                    className={`p-2 rounded-lg ${session.isCurrent
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                      }`}
                  >
                    {session.isCurrent ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Key className="w-5 h-5" />
                    )}
                  </div>
                  <div className="ml-3">
                    <h4 className="font-semibold text-gray-900">
                      {session.browser} {session.browserVersion} - {session.os}
                    </h4>
                    <p className="text-sm text-gray-600">{session.ipAddress}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Última actividad:</span>
                    <p className="font-medium text-gray-900">
                      {new Date(session.lastActivity).toLocaleString('es-MX')}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Inicio:</span>
                    <p className="font-medium text-gray-900">
                      {new Date(session.createdAt).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Ubicación:</span>
                    <p className="font-medium text-gray-900">
                      {session.location || 'Desconocida'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                {!session.isCurrent && (
                  <button
                    onClick={() => terminateSession(session.id)}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200 font-medium text-sm whitespace-nowrap"
                  >
                    Terminar sesión
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      key="sessions"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Información de sesiones */}
      <div className="bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start">
          <Key className="w-6 h-6 text-blue-600 mr-3 mt-1 shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Sesiones Activas</h3>
            <p className="text-blue-700">
              Aquí puedes ver y gestionar todas las sesiones activas en tu cuenta. Si reconoces
              alguna sesión sospechosa, puedes terminarla inmediatamente.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de sesiones */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            Sesiones ({sessions.length})
          </h3>
          <button
            onClick={terminateAllSessions}
            disabled={sessions.length === 0}
            className="px-4 py-2 bg-linear-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Terminar todas las sesiones
          </button>
        </div>

        {content}
      </div>
    </motion.div>
  );
});

SessionsTab.displayName = 'SessionsTab';

SessionsTab.propTypes = {
  sessions: PropTypes.array.isRequired,
  loadingSessions: PropTypes.bool.isRequired,
  terminateSession: PropTypes.func.isRequired,
  terminateAllSessions: PropTypes.func.isRequired
};

// ✅ MEJORA: Helper function para validación
const validateUserData = (user) => {
  const errors = [];

  if (!user?.firstName?.trim()) {
    errors.push('El nombre es requerido');
  }

  if (!user?.lastName?.trim()) {
    errors.push('El apellido es requerido');
  }

  if (!user?.email?.trim() || !EMAIL_REGEX.test(user.email)) {
    errors.push('Correo electrónico inválido');
  }

  if (user?.phone && !PHONE_REGEX.test(user.phone.replaceAll(' ', ''))) {
    errors.push('Número de teléfono inválido');
  }

  return errors;
};

// ✅ MEJORA: Componente principal optimizado
const Profile = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ✅ MEJORA: Usar custom hooks
  const {
    user,
    loading,
    error,
    isDirty,
    saving,
    updateUser,
    resetChanges,
    saveChanges,
    uploadAvatar,
    fetchUserData
  } = useUserProfile();

  const {
    passwordData,
    showPasswords,
    passwordStrength,
    changing,
    updatePasswordData,
    togglePasswordVisibility,
    changePassword
  } = usePasswordManager();

  const {
    preferences,
    saving: savingPreferences,
    updatePreference,
    savePreferences,
    resetPreferences
  } = usePreferences();

  const {
    sessions,
    loading: loadingSessions,
    terminateSession,
    terminateAllSessions
  } = useActiveSessions();

  // ✅ MEJORA: Configuración de tabs
  const tabs = useMemo(() => [
    { id: 'personal', label: 'Información Personal', icon: User },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'preferences', label: 'Preferencias', icon: Bell },
    { id: 'sessions', label: 'Sesiones Activas', icon: Key }
  ], []);

  // ✅ MEJORA: Manejar guardado de cambios
  const handleSave = useCallback(async () => {
    const success = await saveChanges();
    if (success) {
      setIsEditing(false);
    }
  }, [saveChanges]);

  // ✅ MEJORA: Manejar cancelar edición
  const handleCancel = useCallback(() => {
    resetChanges();
    setIsEditing(false);
  }, [resetChanges]);

  // ✅ MEJORA: Manejar subida de avatar
  const handleAvatarChange = useCallback(async (file) => {
    try {
      setUploadingAvatar(true);
      await uploadAvatar(file);
    } catch (err) {
      console.error('Error handling avatar change:', err);
    } finally {
      setUploadingAvatar(false);
    }
  }, [uploadAvatar]);

  // ✅ MEJORA: Validación de email
  const validateEmail = useCallback((email) => {
    return EMAIL_REGEX.test(email);
  }, []);

  // ✅ MEJORA: Validación de teléfono
  const validatePhone = useCallback((phone) => {
    return PHONE_REGEX.test(phone.replaceAll(' ', ''));
  }, []);

  // ✅ MEJORA: Formatear fecha
  const formatDate = useCallback((dateString) => {
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return 'Fecha inválida';

      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.warn('Error formateando fecha:', error);
      return 'Fecha inválida';
    }
  }, []);

  // ✅ MEJORA: Renderizar contenido de cada tab con componentes separados
  const renderTabContent = useMemo(() => {
    const tabComponents = {
      personal: (
        <PersonalTab
          user={user}
          isEditing={isEditing}
          uploadingAvatar={uploadingAvatar}
          handleAvatarChange={handleAvatarChange}
          updateUser={updateUser}
          validateEmail={validateEmail}
          validatePhone={validatePhone}
          formatDate={formatDate}
        />
      ),
      security: (
        <SecurityTab
          passwordData={passwordData}
          showPasswords={showPasswords}
          passwordStrength={passwordStrength}
          changing={changing}
          updatePasswordData={updatePasswordData}
          togglePasswordVisibility={togglePasswordVisibility}
          changePassword={changePassword}
          user={user}
        />
      ),
      preferences: (
        <PreferencesTab
          preferences={preferences}
          savingPreferences={savingPreferences}
          updatePreference={updatePreference}
          savePreferences={savePreferences}
          resetPreferences={resetPreferences}
        />
      ),
      sessions: (
        <SessionsTab
          sessions={sessions}
          loadingSessions={loadingSessions}
          terminateSession={terminateSession}
          terminateAllSessions={terminateAllSessions}
        />
      )
    };

    return tabComponents[activeTab] || null;
  }, [
    activeTab,
    user,
    isEditing,
    uploadingAvatar,
    passwordData,
    showPasswords,
    passwordStrength,
    changing,
    preferences,
    savingPreferences,
    sessions,
    loadingSessions,
    handleAvatarChange,
    updateUser,
    validateEmail,
    validatePhone,
    formatDate,
    updatePasswordData,
    togglePasswordVisibility,
    changePassword,
    updatePreference,
    savePreferences,
    resetPreferences,
    terminateSession,
    terminateAllSessions
  ]);

  // ✅ MEJORA: Loading state mejorado
  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-4">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <User className="w-8 h-8 text-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Cargando perfil</h3>
          <p className="text-gray-600">Estamos preparando tu información...</p>
        </div>
      </div>
    );
  }

  // ✅ MEJORA: Error state mejorado
  if (error && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="p-4 bg-red-100 rounded-full inline-flex mb-4">
            <AlertCircle className="w-16 h-16 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar perfil</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={fetchUserData}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              Reintentar
            </button>
            <button
              onClick={() => globalThis.location.href = '/'}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* ✅ MEJORA: Header con indicadores */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Perfil de Usuario</h1>
            <p className="text-gray-600">Administra tu información personal y configuración de cuenta</p>
          </div>

          <AnimatePresence>
            {isDirty && isEditing && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex items-center"
              >
                <AlertCircle className="w-5 h-5 text-blue-600 mr-3 shrink-0" />
                <span className="text-sm text-blue-800 font-medium">Tienes cambios sin guardar</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={!isDirty || saving}
                  className="px-5 py-2.5 bg-linear-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-200 font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium flex items-center"
              >
                <Edit2 className="w-5 h-5 mr-2" />
                Editar Perfil
              </button>
            )}
          </div>
        </div>

        {/* ✅ MEJORA: Contenido principal */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Navegación de tabs */}
          <div className="border-b border-gray-200 overflow-x-auto scrollbar-thin">
            <div className="flex" role="tablist">
              {tabs.map((tab) => (
                <TabButton
                  key={tab.id}
                  tab={tab}
                  isActive={activeTab === tab.id}
                  onClick={setActiveTab}
                />
              ))}
            </div>
          </div>

          {/* Contenido de tab */}
          <div className="p-6 md:p-8">
            <AnimatePresence mode="wait">
              {renderTabContent}
            </AnimatePresence>
          </div>
        </div>

        {/* ✅ MEJORA: Información adicional */}
        <div className="mt-8 bg-linear-to-r from-gray-50 to-gray-100 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de cuenta</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-4 rounded-xl">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500">ID de usuario</p>
              <p className="font-bold text-gray-900 text-lg">
                #{String(user?.id || '').padStart(6, '0')}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500">Tipo de cuenta</p>
              <p className="font-bold text-gray-900 text-lg capitalize">
                {user?.role || 'Usuario'}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500">Miembro desde</p>
              <p className="font-bold text-gray-900 text-lg">
                {formatDate(user?.joinDate)}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Bell className="w-5 h-5 text-orange-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500">Notificaciones activas</p>
              <p className="font-bold text-gray-900 text-lg">
                {Object.values(preferences.notifications).filter(Boolean).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;