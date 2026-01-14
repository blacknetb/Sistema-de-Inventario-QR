import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Lock, Palette, Bell, Package,
  Settings as SettingsIcon, Save, RotateCw,
  Download, Upload, Eye, EyeOff,
  CheckCircle, AlertCircle, Sun, Moon,
  Monitor, Cpu, LogOut
} from 'lucide-react';

// ✅ Configuración de API
const API_CONFIG = {
  BASE_URL: window.APP_CONFIG?.apiUrl || 'http://localhost:3000/api',
  getAuthHeader: () => ({
    'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  })
};

// ✅ Componente de input con validación
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
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {Icon && <Icon className="w-4 h-4 inline mr-2 mb-0.5" />}
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type={isPassword && showPassword ? 'text' : type}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200 ${error
            ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
            : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${name}-error`} className="text-sm text-red-600 dark:text-red-400 flex items-center mt-1">
          <AlertCircle className="w-4 h-4 mr-1 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
});

ValidatedInput.propTypes = {
  label: PropTypes.string.isRequired,
  type: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  icon: PropTypes.elementType,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool
};

ValidatedInput.displayName = 'ValidatedInput';

// ✅ Componente de tarjeta de configuración
const SettingsCard = React.memo(({ title, description, icon: Icon, children, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800',
    purple: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800',
    orange: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800'
  };

  const iconColors = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    purple: 'text-purple-600 dark:text-purple-400',
    orange: 'text-orange-600 dark:text-orange-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border ${colorClasses[color]} p-6`}
    >
      <div className="flex items-start mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color].replace('50', '100').replace('900/30', '800/50')} mr-4`}>
          <Icon className={`w-6 h-6 ${iconColors[color]}`} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
          )}
        </div>
      </div>
      {children}
    </motion.div>
  );
});

SettingsCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  icon: PropTypes.elementType.isRequired,
  children: PropTypes.node.isRequired,
  color: PropTypes.oneOf(['blue', 'green', 'purple', 'orange'])
};

SettingsCard.displayName = 'SettingsCard';

// ✅ Componente de opción de tema
const ThemeOption = React.memo(({ theme, isActive, onClick }) => {
  const themes = {
    light: { label: 'Claro', icon: Sun, bg: 'bg-white', border: 'border-gray-200' },
    dark: { label: 'Oscuro', icon: Moon, bg: 'bg-gray-900', border: 'border-gray-700' },
    auto: { label: 'Automático', icon: Monitor, bg: 'bg-gradient-to-r from-white to-gray-900', border: 'border-gray-300' }
  };

  const { label, icon: Icon, bg, border } = themes[theme] || themes.light;
  
  const getIconColor = () => {
    if (theme === 'light') return 'text-yellow-500';
    if (theme === 'dark') return 'text-gray-300';
    return 'text-gray-500';
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 ${isActive
        ? 'border-blue-500 ring-2 ring-blue-500/20'
        : `${border} hover:border-gray-400 dark:hover:border-gray-500`
        }`}
    >
      <div className="flex flex-col items-center">
        <div className={`w-16 h-12 rounded-md mb-3 ${bg} ${border} border flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${getIconColor()}`} />
        </div>
        <span className="font-medium text-gray-900 dark:text-white">{label}</span>
      </div>
      {isActive && (
        <div className="absolute -top-2 -right-2">
          <CheckCircle className="w-5 h-5 text-blue-500 bg-white rounded-full" />
        </div>
      )}
    </motion.div>
  );
});

ThemeOption.propTypes = {
  theme: PropTypes.oneOf(['light', 'dark', 'auto']).isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired
};

ThemeOption.displayName = 'ThemeOption';

// ✅ COMPONENTE PRINCIPAL
const Settings = () => {
  const navigate = useNavigate();

  // ✅ ESTADOS PRINCIPALES
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  // ✅ ESTADOS PARA PERFIL
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    avatar: ''
  });

  const [profileErrors, setProfileErrors] = useState({});

  // ✅ ESTADOS PARA CONTRASEÑA
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  // ✅ ESTADOS PARA CONFIGURACIÓN
  const [appSettings, setAppSettings] = useState({
    theme: 'light',
    language: 'es',
    notifications: {
      email: true,
      push: true,
      lowStock: true,
      weeklyReport: false,
      orderUpdates: true,
      securityAlerts: true
    },
    inventory: {
      lowStockThreshold: 10,
      itemsPerPage: 20,
      autoSave: true,
      showImages: true
    },
    qr: {
      quality: 'high',
      size: 200,
      includeLogo: true
    },
    export: {
      format: 'pdf',
      includeCharts: true,
      includeImages: false
    },
    system: {
      maintenanceMode: false,
      backupFrequency: 'weekly',
      sessionTimeout: 30,
      auditLog: true
    }
  });

  // ✅ MEJORA: Cargar datos del usuario
  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_CONFIG.BASE_URL}/profile`, {
        headers: API_CONFIG.getAuthHeader()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const userData = await response.json();

      if (userData && typeof userData === 'object') {
        setProfileData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          department: userData.department || '',
          position: userData.position || '',
          avatar: userData.avatar || ''
        });
      }
    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
      setErrorMessage('Error al cargar datos del perfil');
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ MEJORA: Cargar configuración
  const loadSettings = useCallback(async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/settings`, {
        headers: API_CONFIG.getAuthHeader()
      });

      if (response.ok) {
        const settingsData = await response.json();
        if (settingsData && typeof settingsData === 'object') {
          setAppSettings(prev => ({
            ...prev,
            ...settingsData
          }));
        }
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
      // Usar configuración por defecto
    }
  }, []);

  // ✅ MEJORA: Cargar datos iniciales
  useEffect(() => {
    loadUserData();
    loadSettings();
  }, [loadUserData, loadSettings]);

  // ✅ MEJORA: Manejar cambios en perfil
  const handleProfileChange = useCallback((e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));

    // Limpiar error específico
    if (profileErrors[name]) {
      setProfileErrors(prev => ({ ...prev, [name]: '' }));
    }

    if (successMessage) setSuccessMessage('');
    if (errorMessage) setErrorMessage('');
  }, [profileErrors, successMessage, errorMessage]);

  // ✅ MEJORA: Manejar cambios en contraseña
  const handlePasswordChange = useCallback((e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));

    // Limpiar error específico
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }

    // ✅ MEJORA: Calcular fortaleza de contraseña
    if (name === 'newPassword') {
      let strength = 0;
      if (value.length >= 8) strength += 1;
      if (/[A-Z]/.test(value)) strength += 1;
      if (/\d/.test(value)) strength += 1;
      if (/[^A-Za-z0-9]/.test(value)) strength += 1;
      setPasswordStrength(strength);
    }

    if (successMessage) setSuccessMessage('');
    if (errorMessage) setErrorMessage('');
  }, [passwordErrors, successMessage, errorMessage]);

  // ✅ MEJORA: Manejar cambios en configuración
  const handleSettingsChange = useCallback((category, key, value) => {
    setAppSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));

    if (successMessage) setSuccessMessage('');
    if (errorMessage) setErrorMessage('');
  }, [successMessage, errorMessage]);

  // ✅ MEJORA: Validar datos del perfil
  const validateProfile = useCallback(() => {
    const errors = {};

    if (!profileData.name.trim()) {
      errors.name = 'El nombre es requerido';
    } else if (profileData.name.trim().length < 2) {
      errors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!profileData.email.trim()) {
      errors.email = 'El correo electrónico es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      errors.email = 'Correo electrónico inválido';
    }

    if (profileData.phone && !/^[\d\s\-+()]+$/.test(profileData.phone)) {
      errors.phone = 'Número de teléfono inválido';
    }

    return errors;
  }, [profileData]);

  // ✅ MEJORA: Validar contraseña
  const validatePassword = useCallback(() => {
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'La contraseña actual es requerida';
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'La nueva contraseña es requerida';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Debe tener al menos 8 caracteres';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      errors.newPassword = 'Debe incluir mayúsculas, minúsculas y números';
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Confirma tu contraseña';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }

    return errors;
  }, [passwordData]);

  // ✅ MEJORA: Guardar perfil
  const handleSaveProfile = useCallback(async (e) => {
    e.preventDefault();

    const errors = validateProfile();
    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    setSaving(true);
    setProfileErrors({});
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/profile`, {
        method: 'PUT',
        headers: API_CONFIG.getAuthHeader(),
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al actualizar perfil');
      }

      const updatedUser = await response.json();
      setProfileData(updatedUser);
      setSuccessMessage('Perfil actualizado correctamente');

      // ✅ MEJORA: Actualizar en localStorage si es necesario
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (currentUser?.id) {
        localStorage.setItem('user', JSON.stringify({
          ...currentUser,
          ...updatedUser
        }));
      }
    } catch (error) {
      console.error('Error al guardar perfil:', error);
      setErrorMessage(error.message || 'Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  }, [profileData, validateProfile]);

  // ✅ MEJORA: Cambiar contraseña
  const handleChangePassword = useCallback(async (e) => {
    e.preventDefault();

    const errors = validatePassword();
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setSaving(true);
    setPasswordErrors({});
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/profile/password`, {
        method: 'PUT',
        headers: API_CONFIG.getAuthHeader(),
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al cambiar contraseña');
      }

      setSuccessMessage('Contraseña cambiada correctamente');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordStrength(0);
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      setErrorMessage(error.message || 'Error al cambiar la contraseña');
    } finally {
      setSaving(false);
    }
  }, [passwordData, validatePassword]);

  // ✅ MEJORA: Guardar configuración
  const handleSaveSettings = useCallback(async () => {
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/settings`, {
        method: 'PUT',
        headers: API_CONFIG.getAuthHeader(),
        body: JSON.stringify(appSettings)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al guardar configuración');
      }

      // ✅ MEJORA: Aplicar tema inmediatamente
      if (appSettings.theme === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else if (appSettings.theme === 'light') {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      } else {
        // Tema automático
        localStorage.removeItem('theme');
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }

      setSuccessMessage('Configuración guardada correctamente');
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      setErrorMessage(error.message || 'Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  }, [appSettings]);

  // ✅ MEJORA: Exportar configuración
  const handleExportSettings = useCallback(() => {
    try {
      const dataStr = JSON.stringify(appSettings, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

      const exportFileDefaultName = `configuracion-sistema-${new Date().toISOString().split('T')[0]}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      document.body.appendChild(linkElement);
      linkElement.click();
      linkElement.remove();
    } catch (error) {
      console.error('Error exportando configuración:', error);
      setErrorMessage('Error al exportar la configuración');
    }
  }, [appSettings]);

  // ✅ MEJORA: Importar configuración
  const handleImportSettings = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.name.endsWith('.json')) {
      setErrorMessage('Solo se permiten archivos JSON (.json)');
      e.target.value = '';
      return;
    }

    try {
      const fileContent = await file.text();
      const importedSettings = JSON.parse(fileContent);

      // ✅ MEJORA: Validar estructura de la configuración
      if (!importedSettings || typeof importedSettings !== 'object') {
        throw new Error('Formato de archivo inválido');
      }

      // Validar estructura específica si es necesario
      const requiredProperties = ['apiUrl', 'theme', 'language'];
      const missingProps = requiredProperties.filter(prop => !(prop in importedSettings));

      if (missingProps.length > 0) {
        throw new Error(`Faltan propiedades requeridas: ${missingProps.join(', ')}`);
      }

      setAppSettings(prev => ({
        ...prev,
        ...importedSettings
      }));
      setSuccessMessage('Configuración importada correctamente');
    } catch (error) {
      console.error('Error importando configuración:', error);

      // Mensaje de error específico
      let errorMsg = 'Error al importar configuración';
      if (error instanceof SyntaxError) {
        errorMsg = 'Archivo JSON inválido. Verifica el formato.';
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }

      setErrorMessage(errorMsg);
    } finally {
      // Resetear input
      e.target.value = '';
    }
  }, []);

  // ✅ MEJORA: Restablecer configuración
  const handleResetSettings = useCallback(() => {
    if (window.confirm('¿Estás seguro de que quieres restablecer toda la configuración a los valores predeterminados? Esta acción no se puede deshacer.')) {
      const defaultSettings = {
        theme: 'light',
        language: 'es',
        notifications: {
          email: true,
          push: true,
          lowStock: true,
          weeklyReport: false,
          orderUpdates: true,
          securityAlerts: true
        },
        inventory: {
          lowStockThreshold: 10,
          itemsPerPage: 20,
          autoSave: true,
          showImages: true
        },
        qr: {
          quality: 'high',
          size: 200,
          includeLogo: true
        },
        export: {
          format: 'pdf',
          includeCharts: true,
          includeImages: false
        },
        system: {
          maintenanceMode: false,
          backupFrequency: 'weekly',
          sessionTimeout: 30,
          auditLog: true
        }
      };

      setAppSettings(defaultSettings);
      setSuccessMessage('Configuración restablecida a valores predeterminados');
    }
  }, []);

  // ✅ MEJORA: Cerrar sesión
  const handleLogout = useCallback(() => {
    if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  }, [navigate]);

  // ✅ MEJORA: Limpiar mensajes
  const clearMessages = useCallback(() => {
    setSuccessMessage('');
    setErrorMessage('');
  }, []);

  // ✅ MEJORA: Tabs de configuración
  const tabs = useMemo(() => [
    { id: 'profile', label: 'Perfil', icon: User, color: 'blue' },
    { id: 'security', label: 'Seguridad', icon: Lock, color: 'green' },
    { id: 'appearance', label: 'Apariencia', icon: Palette, color: 'purple' },
    { id: 'notifications', label: 'Notificaciones', icon: Bell, color: 'orange' },
    { id: 'inventory', label: 'Inventario', icon: Package, color: 'blue' },
    { id: 'system', label: 'Sistema', icon: Cpu, color: 'green' }
  ], []);

  // ✅ MEJORA: Indicador de fortaleza de contraseña
  const passwordStrengthInfo = useMemo(() => {
    const levels = [
      { text: 'Muy débil', color: 'bg-red-500', width: '25%' },
      { text: 'Débil', color: 'bg-orange-500', width: '50%' },
      { text: 'Moderada', color: 'bg-yellow-500', width: '75%' },
      { text: 'Fuerte', color: 'bg-green-500', width: '100%' }
    ];

    return levels[Math.min(passwordStrength, 3)];
  }, [passwordStrength]);

  // ✅ MEJORA: Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Cargando configuración...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Por favor espera</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* ✅ HEADER DE CONFIGURACIÓN */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-linear-to-r from-blue-500 to-purple-500 rounded-xl">
                <SettingsIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  Configuración del Sistema
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Gestiona tu perfil, preferencias y configuración de la aplicación
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="px-6 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all duration-200 flex items-center font-medium shadow-sm"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar todo'}
              </button>

              <button
                onClick={handleLogout}
                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center font-medium"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </motion.div>

        {/* ✅ MENSAJES DE ÉXITO/ERROR */}
        <AnimatePresence>
          {(successMessage || errorMessage) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6"
            >
              {successMessage && (
                <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 shrink-0" />
                    <span className="text-green-700 dark:text-green-300">{successMessage}</span>
                  </div>
                  <button
                    onClick={clearMessages}
                    className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                    aria-label="Cerrar mensaje"
                  >
                    ×
                  </button>
                </div>
              )}

              {errorMessage && (
                <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 shrink-0" />
                    <span className="text-red-700 dark:text-red-300">{errorMessage}</span>
                  </div>
                  <button
                    onClick={clearMessages}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    aria-label="Cerrar mensaje"
                  >
                    ×
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ✅ NAVEGACIÓN POR PESTAÑAS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="flex overflow-x-auto scrollbar-thin">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                const tabColorClasses = {
                  blue: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500",
                  green: "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-b-2 border-green-500",
                  purple: "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-b-2 border-purple-500",
                  orange: "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-b-2 border-orange-500"
                };

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`shrink-0 px-6 py-4 text-sm font-medium flex items-center whitespace-nowrap transition-colors duration-200 ${isActive
                      ? tabColorClasses[tab.color]
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`panel-${tab.id}`}
                    id={`tab-${tab.id}`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ✅ CONTENIDO DE PESTAÑAS */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="space-y-8"
        >
          {/* ✅ PESTAÑA: PERFIL */}
          {activeTab === 'profile' && (
            <SettingsCard
              title="Información del Perfil"
              description="Actualiza tu información personal y detalles de contacto"
              icon={User}
              color="blue"
            >
              <form onSubmit={handleSaveProfile}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <ValidatedInput
                    label="Nombre completo"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    error={profileErrors.name}
                    icon={User}
                    placeholder="Juan Pérez"
                    required
                  />

                  <ValidatedInput
                    label="Correo electrónico"
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    error={profileErrors.email}
                    icon={User}
                    placeholder="juan.perez@empresa.com"
                    required
                  />

                  <ValidatedInput
                    label="Teléfono"
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    error={profileErrors.phone}
                    placeholder="+52 55 1234 5678"
                  />

                  <div>
                    <label
                      htmlFor="department"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Departamento
                    </label>
                    <select
                      id="department"
                      name="department"
                      value={profileData.department}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Seleccionar departamento</option>
                      <option value="administracion">Administración</option>
                      <option value="almacen">Almacén</option>
                      <option value="ventas">Ventas</option>
                      <option value="compras">Compras</option>
                      <option value="produccion">Producción</option>
                      <option value="logistica">Logística</option>
                      <option value="ti">TI</option>
                      <option value="rh">Recursos Humanos</option>
                    </select>
                  </div>

                  <ValidatedInput
                    label="Cargo / Posición"
                    name="position"
                    value={profileData.position}
                    onChange={handleProfileChange}
                    placeholder="Ej: Supervisor de Inventario"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={loadUserData}
                    className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all duration-200 font-medium shadow-sm"
                  >
                    {saving ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </span>
                    ) : (
                      'Guardar Cambios'
                    )}
                  </button>
                </div>
              </form>
            </SettingsCard>
          )}

          {/* ✅ PESTAÑA: SEGURIDAD */}
          {activeTab === 'security' && (
            <SettingsCard
              title="Seguridad y Contraseña"
              description="Cambia tu contraseña y gestiona la seguridad de tu cuenta"
              icon={Lock}
              color="green"
            >
              <form onSubmit={handleChangePassword}>
                <div className="space-y-6 mb-8">
                  <ValidatedInput
                    label="Contraseña actual"
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    error={passwordErrors.currentPassword}
                    icon={Lock}
                    placeholder="••••••••"
                    required
                  />

                  <ValidatedInput
                    label="Nueva contraseña"
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    error={passwordErrors.newPassword}
                    placeholder="••••••••"
                    required
                  />

                  {/* ✅ MEJORA: Indicador de fortaleza */}
                  {passwordData.newPassword && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Fortaleza:</span>
                        <span className="font-medium">{passwordStrengthInfo.text}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${passwordStrengthInfo.color} transition-all duration-300`}
                          style={{ width: passwordStrengthInfo.width }}
                        />
                      </div>
                    </div>
                  )}

                  <ValidatedInput
                    label="Confirmar nueva contraseña"
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    error={passwordErrors.confirmPassword}
                    placeholder="••••••••"
                    required
                  />

                  {/* ✅ MEJORA: Requisitos de contraseña */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Requisitos de seguridad:
                    </h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                      <li className="flex items-center">
                        <CheckCircle className={`w-4 h-4 mr-2 ${passwordData.newPassword.length >= 8 ? 'text-green-500' : 'text-gray-400'
                          }`} />
                        Al menos 8 caracteres
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className={`w-4 h-4 mr-2 ${/[A-Z]/.test(passwordData.newPassword) && /[a-z]/.test(passwordData.newPassword)
                          ? 'text-green-500'
                          : 'text-gray-400'
                          }`} />
                        Mayúsculas y minúsculas
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className={`w-4 h-4 mr-2 ${/\d/.test(passwordData.newPassword) ? 'text-green-500' : 'text-gray-400'
                          }`} />
                        Al menos un número
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className={`w-4 h-4 mr-2 ${/[^A-Za-z0-9]/.test(passwordData.newPassword) ? 'text-green-500' : 'text-gray-400'
                          }`} />
                        Al menos un carácter especial
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    })}
                    className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 font-medium"
                  >
                    Limpiar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-linear-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 disabled:opacity-50 transition-all duration-200 font-medium shadow-sm"
                  >
                    {saving ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Cambiando...
                      </span>
                    ) : (
                      'Cambiar Contraseña'
                    )}
                  </button>
                </div>
              </form>
            </SettingsCard>
          )}

          {/* ✅ PESTAÑA: APARIENCIA */}
          {activeTab === 'appearance' && (
            <SettingsCard
              title="Apariencia e Interfaz"
              description="Personaliza la apariencia de la aplicación"
              icon={Palette}
              color="purple"
            >
              <div className="space-y-8">
                {/* TEMA */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Tema de la aplicación
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <ThemeOption
                      theme="light"
                      isActive={appSettings.theme === "light"}
                      onClick={() => handleSettingsChange("theme", "light")}
                    />
                    <ThemeOption
                      theme="dark"
                      isActive={appSettings.theme === "dark"}
                      onClick={() => handleSettingsChange("theme", "dark")}
                    />
                    <ThemeOption
                      theme="auto"
                      isActive={appSettings.theme === "auto"}
                      onClick={() => handleSettingsChange("theme", "auto")}
                    />
                  </div>
                </div>

                {/* CONFIGURACIÓN REGIONAL */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Configuración Regional
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Idioma */}
                    <div>
                      <label
                        htmlFor="language"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Idioma
                      </label>
                      <select
                        id="language"
                        value={appSettings.language}
                        onChange={(e) => handleSettingsChange("language", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none 
                       transition-colors duration-200 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="es">Español</option>
                        <option value="en">English</option>
                        <option value="pt">Português</option>
                        <option value="fr">Français</option>
                      </select>
                    </div>

                    {/* Formato de fecha */}
                    <div>
                      <label
                        htmlFor="dateFormat"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Formato de fecha
                      </label>
                      <select
                        id="dateFormat"
                        value={appSettings.dateFormat || "dd/MM/yyyy"}
                        onChange={(e) => handleSettingsChange("dateFormat", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none 
                       transition-colors duration-200 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="dd/MM/yyyy">DD/MM/AAAA</option>
                        <option value="MM/dd/yyyy">MM/DD/AAAA</option>
                        <option value="yyyy-MM-dd">AAAA-MM-DD</option>
                        <option value="dd MMM yyyy">DD MMM AAAA</option>
                      </select>
                    </div>

                    {/* Zona horaria */}
                    <div>
                      <label
                        htmlFor="timezone"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Zona horaria
                      </label>
                      <select
                        id="timezone"
                        value={appSettings.timezone || "America/Mexico_City"}
                        onChange={(e) => handleSettingsChange("timezone", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none 
                       transition-colors duration-200 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="America/Mexico_City">Ciudad de México</option>
                        <option value="America/New_York">Nueva York</option>
                        <option value="Europe/Madrid">Madrid</option>
                        <option value="Europe/London">Londres</option>
                        <option value="Asia/Tokyo">Tokio</option>
                      </select>
                    </div>

                    {/* Tamaño de fuente */}
                    <div>
                      <label
                        htmlFor="fontSize"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Tamaño de fuente
                      </label>
                      <select
                        id="fontSize"
                        value={appSettings.fontSize || "medium"}
                        onChange={(e) => handleSettingsChange("fontSize", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none 
                       transition-colors duration-200 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="small">Pequeña</option>
                        <option value="medium">Mediana</option>
                        <option value="large">Grande</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* BOTONES */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={handleResetSettings}
                    className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 
                   dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 
                   transition-colors duration-200 font-medium"
                  >
                    <RotateCw className="w-4 h-4 mr-2 inline" />
                    Restablecer
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="px-6 py-2.5 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-lg 
                   hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all 
                   duration-200 font-medium shadow-sm"
                  >
                    {saving ? "Guardando..." : "Guardar Apariencia"}
                  </button>
                </div>
              </div>
            </SettingsCard>
          )}

          {/* ✅ PESTAÑA: INVENTARIO */}
          {activeTab === 'inventory' && (
            <SettingsCard
              title="Configuración de Inventario"
              description="Personaliza el comportamiento del sistema de inventario"
              icon={Package}
              color="blue"
            >
              <div className="space-y-8">
                {/* CONFIGURACIÓN GENERAL */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Configuración General
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="lowStockThreshold"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Umbral de stock bajo
                      </label>
                      <div className="flex items-center">
                        <input
                          id="lowStockThreshold"
                          name="lowStockThreshold"
                          type="range"
                          min={1}
                          max={100}
                          value={appSettings.inventory.lowStockThreshold}
                          onChange={(e) =>
                            handleSettingsChange("inventory", "lowStockThreshold", Number(e.target.value))
                          }
                          className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="ml-4 w-16 text-center font-medium text-gray-900 dark:text-white">
                          {appSettings.inventory.lowStockThreshold}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Productos con stock por debajo de este valor se mostrarán como "stock bajo"
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="itemsPerPage"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Artículos por página
                      </label>
                      <select
                        id="itemsPerPage"
                        name="itemsPerPage"
                        value={appSettings.inventory.itemsPerPage}
                        onChange={(e) =>
                          handleSettingsChange("inventory", "itemsPerPage", Number(e.target.value))
                        }
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200 dark:bg-gray-700 dark:text-white"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>

                    <div className="md:col-span-2 space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={appSettings.inventory.autoSave}
                          onChange={(e) => handleSettingsChange('inventory', 'autoSave', e.target.checked)}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">
                          Guardado automático de cambios
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={appSettings.inventory.showImages}
                          onChange={(e) => handleSettingsChange('inventory', 'showImages', e.target.checked)}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">
                          Mostrar imágenes de productos
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* CONFIGURACIÓN DE QR */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Configuración de Códigos QR
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="qrQuality"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Calidad del QR
                      </label>
                      <select
                        id="qrQuality"
                        value={appSettings.qr.quality}
                        onChange={(e) => handleSettingsChange("qr", "quality", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="low">Baja</option>
                        <option value="medium">Media</option>
                        <option value="high">Alta</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="qrSize"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Tamaño del QR (px)
                      </label>
                      <select
                        id="qrSize"
                        value={appSettings.qr.size}
                        onChange={(e) =>
                          handleSettingsChange("qr", "size", Number(e.target.value))
                        }
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200 dark:bg-gray-700 dark:text-white"
                      >
                        <option value={128}>128px</option>
                        <option value={200}>200px</option>
                        <option value={256}>256px</option>
                        <option value={512}>512px</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={appSettings.qr.includeLogo}
                          onChange={(e) => handleSettingsChange('qr', 'includeLogo', e.target.checked)}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">
                          Incluir logo de la empresa en los QR
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* GESTIÓN DE CONFIGURACIÓN */}
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Gestión de Configuración
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleExportSettings}
                      className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exportar Configuración
                    </button>

                    <label className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Importar Configuración
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportSettings}
                        className="hidden"
                      />
                    </label>

                    <button
                      onClick={handleResetSettings}
                      className="px-4 py-2.5 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors duration-200 flex items-center"
                    >
                      <RotateCw className="w-4 h-4 mr-2" />
                      Restablecer a Valores por Defecto
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="px-6 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all duration-200 font-medium shadow-sm"
                  >
                    {saving ? 'Guardando...' : 'Guardar Configuración'}
                  </button>
                </div>
              </div>
            </SettingsCard>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;