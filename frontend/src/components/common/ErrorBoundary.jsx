import React, { Component } from 'react';
import PropTypes from 'prop-types';
import "../../assets/styles/global.css";

const createLogger = () => {
  const isDev = process.env.NODE_ENV !== 'production';

  return {
    group: (title) => isDev && console.group(title),
    groupEnd: () => isDev && console.groupEnd(),
    error: (label, data) => console.error(`🚨 ${label}:`, data),
    warn: (label, data) => console.warn(`⚠️ ${label}:`, data),
    info: (label, data) => isDev && console.info(`ℹ️ ${label}:`, data),
    log: (label, data) => isDev && console.log(`📝 ${label}:`, data)
  };
};

const logger = createLogger();

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isDarkMode: false,
      isReportingError: false
    };

    this.mediaQuery = null;
    this.reportTimeout = null;

    this.handleReset = this.handleReset.bind(this);
    this.handleGoHome = this.handleGoHome.bind(this);
    this.handleGoBack = this.handleGoBack.bind(this);
    this.handleRefresh = this.handleRefresh.bind(this);
    this.handleCopyErrorId = this.handleCopyErrorId.bind(this);
    this.handleThemeChange = this.handleThemeChange.bind(this);
    this.handleStorageChange = this.handleStorageChange.bind(this);
  }

  componentDidMount() {
    this.detectDarkMode();

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageChange);
      this.setupThemeListener();
    }
  }

  setupThemeListener() {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    if (typeof this.mediaQuery.addEventListener === 'function') {
      this.mediaQuery.addEventListener('change', this.handleThemeChange);
    } else if (typeof this.mediaQuery.addListener === 'function') {
      this.mediaQuery.addListener(this.handleThemeChange);
    }
  }

  componentWillUnmount() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageChange);

      if (this.mediaQuery) {
        if (typeof this.mediaQuery.removeEventListener === 'function') {
          this.mediaQuery.removeEventListener('change', this.handleThemeChange);
        } else if (typeof this.mediaQuery.removeListener === 'function') {
          this.mediaQuery.removeListener(this.handleThemeChange);
        }
      }
    }

    if (this.reportTimeout) {
      clearTimeout(this.reportTimeout);
    }
  }

  detectDarkMode() {
    if (typeof document === 'undefined') return;

    let isDarkMode = false;

    if (document.documentElement.classList.contains('dark')) {
      isDarkMode = true;
    }
    else if (document.documentElement.getAttribute('data-theme') === 'dark') {
      isDarkMode = true;
    }
    else if (typeof localStorage !== 'undefined') {
      try {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
          isDarkMode = true;
        }
      } catch (error) {
        logger.warn('No se pudo acceder a localStorage:', error);
      }
    }
    else if (typeof window !== 'undefined' && window.matchMedia) {
      isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    this.setState({ isDarkMode });
  }

  handleThemeChange(e) {
    this.setState({ isDarkMode: e?.matches || false });
  }

  handleStorageChange(e) {
    if (!e || !e.key) return;
    
    const themeKeys = ['theme', 'darkMode', 'app-theme', 'color-scheme'];
    if (themeKeys.includes(e.key)) {
      this.detectDarkMode();
    }
  }

  static getDerivedStateFromError(error) {
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error: error,
      errorId: errorId
    };
  }

  componentDidCatch(error, errorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      logger.group('Error capturado por ErrorBoundary');
      logger.error('Error:', error);
      logger.error('Info:', errorInfo);
      logger.error('ID:', this.state.errorId);
      logger.error('URL:', typeof window !== 'undefined' ? window.location.href : 'No disponible');
      logger.error('Usuario:', this.getCurrentUser());
      logger.groupEnd();
    }

    this.setState({
      errorInfo,
      isReportingError: true
    }, () => {
      this.reportErrorToService(error, errorInfo);
    });
  }

  getCurrentUser() {
    if (typeof localStorage === 'undefined') return 'No autenticado';

    try {
      const userData = localStorage.getItem('user') ||
        localStorage.getItem('userData') ||
        localStorage.getItem('auth_user');

      if (!userData) return 'No autenticado';

      try {
        const user = JSON.parse(userData);
        return user.email || user.username || user.id || 'Usuario anónimo';
      } catch {
        return userData;
      }
    } catch (error) {
      logger.warn('Error obteniendo usuario:', error);
      return 'Error obteniendo usuario';
    }
  }

  prepareErrorData(error, errorInfo) {
    return {
      id: this.state.errorId,
      message: error?.message || 'Error desconocido',
      name: error?.name || 'Error',
      stack: error?.stack || 'No hay stack trace',
      componentStack: errorInfo?.componentStack || 'No hay información del componente',
      url: typeof window !== 'undefined' ? window.location.href : 'No disponible',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'No disponible',
      timestamp: new Date().toISOString(),
      appVersion: this.getAppVersion(),
      user: this.getCurrentUser(),
      environment: process.env.NODE_ENV || 'development',
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'No disponible',
      language: typeof navigator !== 'undefined' ? navigator.language : 'No disponible',
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'No disponible',
      screenSize: typeof window !== 'undefined'
        ? `${window.innerWidth}x${window.innerHeight}`
        : 'No disponible'
    };
  }

  reportErrorToService = async (error, errorInfo) => {
    try {
      const errorData = this.prepareErrorData(error, errorInfo);
      const shouldReport = this.shouldReportError();

      if (shouldReport) {
        await this.sendErrorReport(errorData);
      } else {
        this.logErrorLocally(errorData);
      }
    } catch (reportError) {
      logger.warn('Error en sistema de reporte:', reportError);
      this.saveErrorLocally(this.prepareErrorData(error, errorInfo));
    } finally {
      this.setState({ isReportingError: false });
    }
  }

  shouldReportError() {
    if (process.env.NODE_ENV !== 'production') return false;
    if (typeof window === 'undefined') return false;

    const hasApiConfig = window.APP_CONFIG?.api?.baseUrl;
    const hasErrorEndpoint = window.APP_CONFIG?.api?.errorEndpoint;

    return hasApiConfig && hasErrorEndpoint;
  }

  async sendErrorReport(errorData) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const endpoint = window.APP_CONFIG.api.errorEndpoint || '/api/logs/client-errors';
      const url = `${window.APP_CONFIG.api.baseUrl}${endpoint}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Error-ID': this.state.errorId,
          'X-Client-Version': this.getAppVersion()
        },
        body: JSON.stringify(errorData),
        signal: controller.signal,
        mode: 'cors',
        credentials: 'include'
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        logger.info('Error reportado al servidor');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      logger.warn('No se pudo enviar el error al servidor:', fetchError);
      throw fetchError;
    }
  }

  logErrorLocally(errorData) {
    if (process.env.NODE_ENV !== 'production') {
      logger.group('📝 Error capturado (desarrollo)');
      logger.log('Datos:', errorData);
      logger.groupEnd();
    }
  }

  getAppVersion() {
    if (typeof window !== 'undefined') {
      return window.APP_CONFIG?.app?.version ||
        process.env.REACT_APP_VERSION ||
        '1.0.0';
    }
    return process.env.REACT_APP_VERSION || '1.0.0';
  }

  saveErrorLocally(errorData) {
    try {
      if (typeof localStorage === 'undefined') return;

      const MAX_ERRORS = 50;
      const STORAGE_KEY = 'inventory_qr_client_errors';

      let errors = [];
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        errors = stored ? JSON.parse(stored) : [];
      } catch (e) {
        logger.warn('No se pudo leer errores almacenados:', e);
      }

      const enrichedError = {
        ...errorData,
        savedAt: new Date().toISOString(),
        localStorage: true
      };

      errors.push(enrichedError);

      if (errors.length > MAX_ERRORS) {
        errors.splice(0, errors.length - MAX_ERRORS);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(errors));

      logger.info('Error guardado localmente');
    } catch (e) {
      logger.warn('No se pudo guardar el error localmente:', e);
    }
  }

  handleReset() {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isReportingError: false
    }, () => {
      if (typeof this.props.onReset === 'function') {
        this.props.onReset();
      }
    });
  }

  handleGoHome() {
    if (typeof this.props.onGoHome === 'function') {
      this.props.onGoHome();
    } else if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }

  handleGoBack() {
    if (typeof this.props.onGoBack === 'function') {
      this.props.onGoBack();
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      this.handleGoHome();
    }
  }

  handleRefresh() {
    if (typeof this.props.onRefresh === 'function') {
      this.props.onRefresh();
    } else if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  async handleCopyErrorId() {
    const { errorId } = this.state;

    if (!errorId) {
      console.warn('No hay ID de error para copiar');
      return;
    }

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(errorId);
        console.log('ID copiado al portapapeles ✅');
        return;
      }

      const textArea = document.createElement('textarea');
      textArea.value = errorId;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        console.log('ID copiado al portapapeles ✅');
      } else {
        throw new Error('Fallback copy failed');
      }
    } catch (err) {
      logger.warn('No se pudo copiar el ID:', err);
      console.error('No se pudo copiar el ID ❌');
    }
  }

  renderErrorDetails() {
    const { showDetails } = this.props;
    const { error, errorInfo, errorId } = this.state;

    if (!showDetails || !error || process.env.NODE_ENV === 'production') return null;

    return (
      <div className="error-details">
        <h3 className="error-details-title">
          Detalles del Error (Solo desarrollo)
        </h3>
        <div className="error-details-content">
          <div className="error-details-section">
            <strong className="error-details-label">Mensaje:</strong>
            <pre className="error-details-pre">
              {error.toString()}
            </pre>
          </div>
          {errorInfo?.componentStack && (
            <div className="error-details-section">
              <strong className="error-details-label">Component Stack:</strong>
              <pre className="error-details-pre error-details-pre-stack">
                {errorInfo.componentStack}
              </pre>
            </div>
          )}
          <div className="error-details-section">
            <strong className="error-details-label">ID del Error:</strong>
            <div className="error-id-container">
              <code className="error-details-code">
                {errorId}
              </code>
              <button
                onClick={this.handleCopyErrorId}
                className="error-copy-button"
                aria-label="Copiar ID del error"
                title="Copiar ID del error al portapapeles"
              >
                📋
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  getSupportLink() {
    const { errorId } = this.state;
    if (!errorId) return '#';

    const subject = encodeURIComponent('Error en Sistema de Inventario QR');
    const body = encodeURIComponent(
      `ID del error: ${errorId}\n` +
      `URL: ${typeof window !== 'undefined' ? window.location.href : 'No disponible'}\n` +
      `Usuario: ${this.getCurrentUser()}\n` +
      `Navegador: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'No disponible'}\n` +
      `Fecha: ${new Date().toLocaleString()}\n\n` +
      `Descripción del problema:\n`
    );

    return `mailto:soporte@inventarioqr.example.com?subject=${subject}&body=${body}`;
  }

  render() {
    const { hasError, errorId, isDarkMode, isReportingError } = this.state;
    const { children, fallback, showDetails } = this.props;

    if (hasError) {
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback({
            errorId,
            resetError: this.handleReset,
            error: this.state.error
          });
        }
        return fallback;
      }

      const containerClasses = `error-boundary ${isDarkMode ? 'error-boundary-dark' : 'error-boundary-light'}`;

      return (
        <div
          className={containerClasses}
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="error-container">
            {isReportingError && (
              <div className="error-reporting-indicator">
                <span className="error-reporting-text">Reportando error...</span>
                <div className="error-reporting-spinner"></div>
              </div>
            )}

            <div className={`error-icon error-icon-danger ${isDarkMode ? 'error-icon-dark' : 'error-icon-light'}`}>
              <span aria-hidden="true">⚠️</span>
            </div>

            <h1 className="error-title">
              ¡Algo salió mal!
            </h1>

            <p className="error-message">
              Lo sentimos, ha ocurrido un error inesperado en la aplicación.
              {process.env.NODE_ENV === 'development' && ' (Modo desarrollo activado)'}
            </p>

            {errorId && (
              <div className="error-id-section">
                <p className="error-id-label">
                  ID del Error:
                </p>
                <div className="error-id-wrapper">
                  <code className="error-id">
                    {errorId}
                  </code>
                  <button
                    onClick={this.handleCopyErrorId}
                    className="error-copy-button"
                    aria-label="Copiar ID del error"
                    title="Copiar ID del error al portapapeles"
                    disabled={isReportingError}
                  >
                    📋
                  </button>
                </div>
                <p className="error-id-instruction">
                  Proporciona este ID al equipo de soporte para diagnosticar el problema.
                </p>
              </div>
            )}

            <div className="error-actions">
              <button
                onClick={this.handleReset}
                className="error-button error-button-primary"
                aria-label="Intentar cargar de nuevo"
                disabled={isReportingError}
              >
                {isReportingError ? 'Procesando...' : 'Intentar de nuevo'}
              </button>

              <div className="error-button-group">
                <button
                  onClick={this.handleGoHome}
                  className="error-button error-button-secondary"
                  aria-label="Ir a la página de inicio"
                  disabled={isReportingError}
                >
                  Ir al inicio
                </button>

                <button
                  onClick={this.handleGoBack}
                  className="error-button error-button-secondary"
                  aria-label="Volver a la página anterior"
                  disabled={isReportingError || (typeof window !== 'undefined' && window.history.length <= 1)}
                >
                  Volver atrás
                </button>
              </div>

              <button
                onClick={this.handleRefresh}
                className="error-button error-button-ghost"
                aria-label="Recargar la página completa"
                disabled={isReportingError}
              >
                Recargar página
              </button>
            </div>

            <div className="error-support">
              <p className="error-support-text">
                Si el problema persiste, contacta a soporte técnico.
              </p>
              <a
                href={this.getSupportLink()}
                className="error-support-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contactar soporte técnico por correo"
              >
                📧 soporte@inventarioqr.example.com
              </a>
            </div>

            {showDetails && this.renderErrorDetails()}
          </div>
        </div>
      );
    }

    return children;
  }
}

ErrorBoundary.defaultProps = {
  showDetails: process.env.NODE_ENV === 'development',
  onReset: null,
  onGoHome: null,
  onGoBack: null,
  onRefresh: null,
  fallback: null
};

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.func,
    PropTypes.element
  ]),
  showDetails: PropTypes.bool,
  onReset: PropTypes.func,
  onGoHome: PropTypes.func,
  onGoBack: PropTypes.func,
  onRefresh: PropTypes.func
};

ErrorBoundary.displayName = 'ErrorBoundary';

export default ErrorBoundary;