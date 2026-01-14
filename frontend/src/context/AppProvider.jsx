import React from 'react';
import PropTypes from 'prop-types';
import { ThemeProvider, useTheme } from './ThemeContext';
import { AuthProvider, useAuth } from './AuthContext';
import { NotificationProvider, NotificationToaster, useNotification } from './NotificationContext';
import { InventoryProvider, useInventory } from './InventoryContext';
import '../assets/styles/context.css';

/**
 * ✅ APP PROVIDER COMBINADO - VERSIÓN CORREGIDA Y COMPLETA
 * Incluye todos los contextos: Tema, Autenticación, Notificaciones e Inventario
 */

export const AppProvider = ({ children, themeConfig, authConfig, notificationConfig }) => {
  return (
    <ThemeProvider {...themeConfig}>
      <NotificationProvider {...notificationConfig}>
        <AuthProvider 
          {...authConfig}
          renderNotificationContext={(notify) => ({
            success: notify?.success,
            error: notify?.error,
            handleApiError: notify?.handleApiError
          })}
        >
          <InventoryProvider>
            {children}
            <NotificationToaster />
          </InventoryProvider>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
};

AppProvider.propTypes = {
  children: PropTypes.node.isRequired,
  themeConfig: PropTypes.object,
  authConfig: PropTypes.object,
  notificationConfig: PropTypes.object
};

AppProvider.defaultProps = {
  themeConfig: {},
  authConfig: {},
  notificationConfig: {}
};

/**
 * ✅ Hook para usar todos los contextos fácilmente
 */
export const useAppContexts = () => {
  const theme = useTheme();
  const auth = useAuth();
  const notification = useNotification();
  const inventory = useInventory();
  
  return {
    theme,
    auth,
    notification,
    inventory,
    isDarkMode: theme?.isDarkMode,
    isAuthenticated: auth?.isAuthenticated,
    showNotification: notification?.showNotification,
    handleApiError: notification?.handleApiError
  };
};

/**
 * ✅ Error Boundary para manejar errores en contextos
 */
export class ContextErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Context Error:', error, errorInfo);
    // Aquí podrías enviar el error a un servicio de logging
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="context-error-boundary">
          <h3>Error en la aplicación</h3>
          <p>Ha ocurrido un error al cargar los contextos de la aplicación.</p>
          <p className="error-details">
            {this.state.error?.message || 'Error desconocido'}
          </p>
          <button 
            onClick={() => globalThis.location.reload()}
            className="reload-button"
          >
            Recargar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ContextErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};