import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import logger from '../utils/logger';

// Configuración por defecto
const DEFAULT_CONFIG = {
  // Aplicación
  app: {
    name: 'Sistema de Inventario QR',
    version: '1.0.0',
    language: 'es',
    currency: 'USD',
    timezone: 'America/Mexico_City',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    itemsPerPage: 20,
    enableAnalytics: false,
    enableErrorReporting: true,
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: false
  },

  // Inventario
  inventory: {
    lowStockThreshold: 10,
    criticalStockThreshold: 5,
    enableAutoReorder: false,
    reorderQuantity: 25,
    enableBarcodeScanner: true,
    enableQRGenerator: true,
    defaultCategory: 'General',
    trackExpirationDates: false,
    enableBatchTracking: false,
    enableSerialNumberTracking: true
  },

  // Productos
  products: {
    enableVariants: true,
    enableCustomFields: false,
    enableImages: true,
    maxImagesPerProduct: 5,
    enableReviews: false,
    enableRating: false,
    enableWishlist: false,
    enableComparison: false,
    enableRelatedProducts: true,
    showStockLevel: true,
    showPrice: true
  },

  // Usuario
  user: {
    enableDarkMode: true,
    enableNotifications: true,
    enableSounds: false,
    enableVibration: false,
    compactView: false,
    showTutorial: true,
    autoSave: true,
    saveInterval: 30, // segundos
    defaultView: 'grid',
    fontSize: 'medium',
    density: 'comfortable'
  },

  // Seguridad
  security: {
    sessionTimeout: 30, // minutos
    maxLoginAttempts: 5,
    enable2FA: false,
    passwordMinLength: 8,
    requireSpecialChars: true,
    requireNumbers: true,
    requireUppercase: true,
    enableAuditLog: true,
    logRetentionDays: 90,
    ipWhitelist: [],
    enableGeoRestriction: false
  },

  // API y Conectividad
  api: {
    baseURL: process.env.VITE_API_URL || 'http://localhost:3000/api',
    timeout: 30000,
    retryAttempts: 3,
    cacheDuration: 300, // segundos
    enableOfflineMode: true,
    syncInterval: 60, // segundos
    enableWebSocket: true,
    compression: true,
    enableCaching: true
  },

  // Reportes
  reports: {
    enableAutoReports: false,
    reportFrequency: 'weekly',
    defaultFormat: 'pdf',
    enableCharts: true,
    enableExport: true,
    retentionPeriod: 365, // días
    enableScheduling: false,
    includeSensitiveData: false,
    enableEmailReports: false
  },

  // Integraciones
  integrations: {
    enableGoogleSheets: false,
    enableExcelExport: true,
    enablePDFExport: true,
    enablePrint: true,
    enableEmail: false,
    enableSMS: false,
    enableWebhook: false,
    enableAPI: true,
    enableWebServices: false
  }
};

// Crear el contexto
const ConfigContext = createContext();

// Hook personalizado
export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig debe usarse dentro de un ConfigProvider');
  }
  return context;
};

// Proveedor de configuración
export const ConfigProvider = ({ children, initialConfig = {} }) => {
  // Estado para la configuración
  const [config, setConfig] = useState(() => {
    try {
      // Combinar configuración inicial con valores por defecto
      const mergedConfig = { ...DEFAULT_CONFIG, ...initialConfig };
      
      // Intentar cargar configuración guardada
      const savedConfig = localStorage.getItem('inventario_qr_config');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        return { ...mergedConfig, ...parsedConfig };
      }
      
      return mergedConfig;
    } catch (error) {
      logger.error('Error al inicializar configuración:', error);
      return { ...DEFAULT_CONFIG, ...initialConfig };
    }
  });

  // Estado para indicar si está cargando
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado para errores
  const [error, setError] = useState(null);

  // Cargar configuración del servidor
  const loadConfigFromServer = useCallback(async () => {
    if (!config.api.baseURL || config.api.baseURL.includes('localhost')) {
      return; // No cargar desde servidor en desarrollo
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${config.api.baseURL}/config`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('inventario_qr_token')}`
        }
      });

      if (response.ok) {
        const serverConfig = await response.json();
        setConfig(prev => ({ ...prev, ...serverConfig }));
        logger.info('Configuración cargada desde servidor');
      }
    } catch (error) {
      logger.warn('No se pudo cargar configuración del servidor:', error);
      // No establecer error para no bloquear la aplicación
    } finally {
      setIsLoading(false);
    }
  }, [config.api.baseURL]);

  // Guardar configuración
  const saveConfig = useCallback(async (newConfig, saveToServer = false) => {
    try {
      // Actualizar estado local
      setConfig(prev => ({ ...prev, ...newConfig }));

      // Guardar en localStorage
      localStorage.setItem('inventario_qr_config', JSON.stringify(newConfig));

      // Guardar en servidor si está habilitado
      if (saveToServer && config.api.baseURL && !config.api.baseURL.includes('localhost')) {
        const token = localStorage.getItem('inventario_qr_token');
        if (token) {
          await fetch(`${config.api.baseURL}/config`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newConfig)
          });
        }
      }

      logger.info('Configuración guardada exitosamente');
      return true;
    } catch (error) {
      logger.error('Error al guardar configuración:', error);
      setError(error.message);
      return false;
    }
  }, [config.api.baseURL]);

  // Actualizar configuración específica
  const updateConfig = useCallback((section, values, saveToServer = false) => {
    return saveConfig({ [section]: { ...config[section], ...values } }, saveToServer);
  }, [config, saveConfig]);

  // Restablecer a valores por defecto
  const resetConfig = useCallback((section = null, saveToServer = false) => {
    if (section) {
      // Restablecer sección específica
      return updateConfig(section, DEFAULT_CONFIG[section], saveToServer);
    } else {
      // Restablecer toda la configuración
      return saveConfig(DEFAULT_CONFIG, saveToServer);
    }
  }, [updateConfig, saveConfig]);

  // Obtener configuración específica
  const getConfig = useCallback((path, defaultValue = null) => {
    try {
      const keys = path.split('.');
      let value = config;
      
      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          return defaultValue;
        }
      }
      
      return value;
    } catch (error) {
      logger.warn(`Error al obtener configuración: ${path}`, error);
      return defaultValue;
    }
  }, [config]);

  // Verificar si una característica está habilitada
  const isFeatureEnabled = useCallback((featurePath) => {
    return getConfig(featurePath, false);
  }, [getConfig]);

  // Cargar configuración inicial
  useEffect(() => {
    loadConfigFromServer();
    
    // Escuchar cambios en otras pestañas
    const handleStorageChange = (event) => {
      if (event.key === 'inventario_qr_config' && event.newValue) {
        try {
          const newConfig = JSON.parse(event.newValue);
          setConfig(prev => ({ ...prev, ...newConfig }));
          logger.info('Configuración actualizada desde otra pestaña');
        } catch (error) {
          logger.warn('Error al procesar cambio de configuración:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadConfigFromServer]);

  // Aplicar efectos de configuración
  useEffect(() => {
    // Aplicar configuración de tema
    if (config.user.enableDarkMode) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const savedTheme = localStorage.getItem('inventario_qr_theme');
      
      if (savedTheme === 'auto' || !savedTheme) {
        document.documentElement.classList.toggle('dark', prefersDark);
      }
    }

    // Aplicar configuración de fuente
    document.documentElement.style.setProperty('--font-size-base', {
      small: '14px',
      medium: '16px',
      large: '18px'
    }[config.user.fontSize] || '16px');

    // Aplicar densidad
    document.documentElement.classList.remove('density-compact', 'density-comfortable', 'density-spacious');
    document.documentElement.classList.add(`density-${config.user.density}`);

    // Configurar intervalos de autoguardado
    let autoSaveInterval;
    if (config.user.autoSave && config.user.saveInterval > 0) {
      autoSaveInterval = setInterval(() => {
        window.dispatchEvent(new CustomEvent('auto-save'));
      }, config.user.saveInterval * 1000);
    }

    return () => {
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
      }
    };
  }, [config]);

  // Valor del contexto
  const contextValue = useMemo(() => ({
    // Estado
    config,
    isLoading,
    error,
    
    // Métodos
    saveConfig,
    updateConfig,
    resetConfig,
    getConfig,
    isFeatureEnabled,
    
    // Accesos directos comunes
    app: config.app,
    inventory: config.inventory,
    products: config.products,
    user: config.user,
    security: config.security,
    api: config.api,
    reports: config.reports,
    integrations: config.integrations,
    
    // Utilidades
    isMaintenanceMode: config.app.maintenanceMode,
    canRegister: config.app.allowRegistration,
    isDarkMode: config.user.enableDarkMode,
    isOfflineMode: config.api.enableOfflineMode,
    isAutoSaveEnabled: config.user.autoSave,
    
    // Formateadores
    formatCurrency: (amount) => {
      const formatter = new Intl.NumberFormat(config.app.language, {
        style: 'currency',
        currency: config.app.currency,
        minimumFractionDigits: 2
      });
      return formatter.format(amount);
    },
    
    formatDate: (date) => {
      const dateObj = new Date(date);
      const formatter = new Intl.DateTimeFormat(config.app.language, {
        dateStyle: 'medium',
        timeStyle: config.timeFormat === '24h' ? 'short' : undefined
      });
      return formatter.format(dateObj);
    },
    
    formatNumber: (number) => {
      const formatter = new Intl.NumberFormat(config.app.language);
      return formatter.format(number);
    }
  }), [config, isLoading, error, saveConfig, updateConfig, resetConfig, getConfig, isFeatureEnabled]);

  return (
    <ConfigContext.Provider value={contextValue}>
      {children}
    </ConfigContext.Provider>
  );
};

// Componente para mostrar estado de configuración
export const ConfigStatus = () => {
  const { isLoading, error, isMaintenanceMode } = useConfig();

  if (isLoading) {
    return (
      <div className="config-status loading">
        <span className="config-status-icon">⏳</span>
        <span className="config-status-text">Cargando configuración...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="config-status error">
        <span className="config-status-icon">⚠️</span>
        <span className="config-status-text">Error: {error}</span>
      </div>
    );
  }

  if (isMaintenanceMode) {
    return (
      <div className="config-status maintenance">
        <span className="config-status-icon">🔧</span>
        <span className="config-status-text">Modo mantenimiento activo</span>
      </div>
    );
  }

  return null;
};

// Componente para gestionar configuración
export const ConfigManager = () => {
  const { config, updateConfig, resetConfig, saveConfig } = useConfig();
  const [activeSection, setActiveSection] = useState('app');
  const [localConfig, setLocalConfig] = useState(config[activeSection]);
  const [isSaving, setIsSaving] = useState(false);

  const sections = [
    { id: 'app', name: 'Aplicación', icon: '⚙️' },
    { id: 'inventory', name: 'Inventario', icon: '📦' },
    { id: 'products', name: 'Productos', icon: '🏷️' },
    { id: 'user', name: 'Usuario', icon: '👤' },
    { id: 'security', name: 'Seguridad', icon: '🔒' },
    { id: 'api', name: 'API', icon: '🔗' },
    { id: 'reports', name: 'Reportes', icon: '📊' },
    { id: 'integrations', name: 'Integraciones', icon: '🔄' }
  ];

  useEffect(() => {
    setLocalConfig(config[activeSection]);
  }, [activeSection, config]);

  const handleChange = (key, value) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateConfig(activeSection, localConfig, true);
      // Mostrar mensaje de éxito
    } catch (error) {
      // Mostrar mensaje de error
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm(`¿Restablecer configuración de ${sections.find(s => s.id === activeSection)?.name}?`)) {
      resetConfig(activeSection, true);
    }
  };

  const renderField = (key, value) => {
    const label = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/(enable|allow|show|track)/gi, '');

    if (typeof value === 'boolean') {
      return (
        <div key={key} className="config-field">
          <label className="config-field-label">
            <input
              type="checkbox"
              checked={localConfig[key] || false}
              onChange={(e) => handleChange(key, e.target.checked)}
              className="config-field-input"
            />
            <span className="config-field-text">{label}</span>
          </label>
          <div className="config-field-description">
            {getFieldDescription(activeSection, key)}
          </div>
        </div>
      );
    }

    if (typeof value === 'number') {
      return (
        <div key={key} className="config-field">
          <label className="config-field-label">{label}</label>
          <input
            type="number"
            value={localConfig[key] || 0}
            onChange={(e) => handleChange(key, Number(e.target.value))}
            className="config-field-input"
          />
          <div className="config-field-description">
            {getFieldDescription(activeSection, key)}
          </div>
        </div>
      );
    }

    if (typeof value === 'string') {
      // Verificar si es un select especial
      if (key.includes('Format') || key.includes('Frequency') || key === 'language' || key === 'currency') {
        const options = getSelectOptions(activeSection, key);
        return (
          <div key={key} className="config-field">
            <label className="config-field-label">{label}</label>
            <select
              value={localConfig[key] || ''}
              onChange={(e) => handleChange(key, e.target.value)}
              className="config-field-input"
            >
              {options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="config-field-description">
              {getFieldDescription(activeSection, key)}
            </div>
          </div>
        );
      }

      return (
        <div key={key} className="config-field">
          <label className="config-field-label">{label}</label>
          <input
            type="text"
            value={localConfig[key] || ''}
            onChange={(e) => handleChange(key, e.target.value)}
            className="config-field-input"
          />
          <div className="config-field-description">
            {getFieldDescription(activeSection, key)}
          </div>
        </div>
      );
    }

    return null;
  };

  const getFieldDescription = (section, key) => {
    const descriptions = {
      app: {
        language: 'Idioma de la interfaz',
        currency: 'Moneda para precios',
        itemsPerPage: 'Número de elementos por página en listados'
      },
      inventory: {
        lowStockThreshold: 'Nivel mínimo para alerta de stock bajo',
        enableAutoReorder: 'Habilitar reorden automático'
      }
      // Agregar más descripciones según sea necesario
    };

    return descriptions[section]?.[key] || '';
  };

  const getSelectOptions = (section, key) => {
    if (key === 'language') {
      return [
        { value: 'es', label: 'Español' },
        { value: 'en', label: 'English' },
        { value: 'pt', label: 'Português' }
      ];
    }

    if (key === 'currency') {
      return [
        { value: 'USD', label: 'USD - Dólar Americano' },
        { value: 'MXN', label: 'MXN - Peso Mexicano' },
        { value: 'EUR', label: 'EUR - Euro' }
      ];
    }

    return [{ value: localConfig[key] || '', label: localConfig[key] || '' }];
  };

  return (
    <div className="config-manager">
      <div className="config-manager-sidebar">
        {sections.map(section => (
          <button
            key={section.id}
            className={`config-section-button ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => setActiveSection(section.id)}
          >
            <span className="config-section-icon">{section.icon}</span>
            <span className="config-section-name">{section.name}</span>
          </button>
        ))}
      </div>
      
      <div className="config-manager-content">
        <div className="config-section-header">
          <h3 className="config-section-title">
            {sections.find(s => s.id === activeSection)?.name}
          </h3>
          <div className="config-section-actions">
            <button
              className="config-button secondary"
              onClick={handleReset}
              disabled={isSaving}
            >
              Restablecer
            </button>
            <button
              className="config-button primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
        
        <div className="config-fields">
          {Object.entries(localConfig).map(([key, value]) => 
            renderField(key, value)
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfigContext;