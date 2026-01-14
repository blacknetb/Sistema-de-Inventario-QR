import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import "../../assets/styles/global.css";

/**
 * ✅ COMPONENTE LOADING SCREEN OPTIMIZADO
 */

const LoadingScreen = ({
  message = "Cargando...",
  showSpinner = true,
  fullScreen = true,
  size = "md",
  variant = "default",
  className = "",
  showProgress = false,
  progressValue = 0,
  ...props
}) => {
  const sizeClasses = useMemo(() => ({
    sm: {
      spinner: "loading-spinner-sm",
      container: "loading-container-sm",
      text: "loading-text-sm"
    },
    md: {
      spinner: "loading-spinner-md",
      container: "loading-container-md",
      text: "loading-text-md"
    },
    lg: {
      spinner: "loading-spinner-lg",
      container: "loading-container-lg",
      text: "loading-text-lg"
    },
    xl: {
      spinner: "loading-spinner-xl",
      container: "loading-container-xl",
      text: "loading-text-xl"
    }
  }), []);

  const variantClasses = useMemo(() => ({
    default: "loading-variant-default",
    primary: "loading-variant-primary",
    secondary: "loading-variant-secondary",
    minimal: "loading-variant-minimal",
    transparent: "loading-variant-transparent"
  }), []);

  const currentSize = sizeClasses[size] || sizeClasses.md;
  const currentVariant = variantClasses[variant] || variantClasses.default;

  const normalizedProgress = Math.min(100, Math.max(0, progressValue));

  const LoadingContent = () => (
    <div className={clsx("loading-content", currentSize.container, currentVariant, className)}>
      {showSpinner && (
        <div className="loading-spinner-wrapper" aria-hidden="true">
          <div className={clsx("loading-spinner-outer", currentSize.spinner)}></div>
          <div className="loading-spinner-inner">
            <div className={clsx(
              "loading-spinner-dot",
              size === 'xl' ? "loading-spinner-dot-xl" : "loading-spinner-dot-md"
            )}></div>
          </div>
        </div>
      )}
      <div className="loading-text">
        <p className="loading-title" aria-hidden="true">
          Sistema de Inventario QR
        </p>
        <p className="loading-message">
          {message}
        </p>

        {showProgress && (
          <div 
            className="loading-progress-wrapper" 
            aria-label={`Progreso: ${normalizedProgress}%`}
          >
            <div 
              className="loading-progress-bar" 
              role="progressbar"
              aria-valuenow={normalizedProgress}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div
                className="loading-progress-indicator"
                style={{ width: `${normalizedProgress}%` }}
              ></div>
            </div>
            <p className="loading-progress-text">
              {normalizedProgress < 100 ? `Cargando... ${normalizedProgress}%` : "¡Completado!"}
            </p>
          </div>
        )}

        {process.env.NODE_ENV === 'development' && !showProgress && (
          <div className="loading-debug-info" aria-hidden="true">
            <small className="loading-debug-text">
              Modo desarrollo • Conectando con backend...
            </small>
          </div>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className="loading-screen-full"
        role="status"
        aria-live="polite"
        aria-label="Cargando aplicación"
        data-testid="loading-screen-full"
        {...props}
      >
        <LoadingContent />
      </div>
    );
  }

  return (
    <div
      className="loading-screen-inline"
      role="status"
      aria-live="polite"
      data-testid="loading-screen-inline"
      {...props}
    >
      <LoadingContent />
    </div>
  );
};

LoadingScreen.propTypes = {
  message: PropTypes.string,
  showSpinner: PropTypes.bool,
  fullScreen: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  variant: PropTypes.oneOf(['default', 'primary', 'secondary', 'minimal', 'transparent']),
  className: PropTypes.string,
  showProgress: PropTypes.bool,
  progressValue: PropTypes.number
};

LoadingScreen.defaultProps = {
  message: "Cargando...",
  showSpinner: true,
  fullScreen: true,
  size: "md",
  variant: "default",
  className: "",
  showProgress: false,
  progressValue: 0
};

// ✅ COMPONENTE PRIMARY
const PrimaryLoading = React.memo(({ message, ...props }) => (
  <LoadingScreen
    {...props}
    variant="primary"
    fullScreen={true}
    size="lg"
    message={message || "Inicializando sistema de inventario..."}
    showProgress={true}
  />
));

PrimaryLoading.displayName = 'LoadingScreen.Primary';

// ✅ COMPONENTE SECONDARY
const SecondaryLoading = React.memo(({ message, ...props }) => (
  <div className="loading-secondary-container" data-testid="loading-secondary">
    <LoadingScreen
      {...props}
      variant="secondary"
      fullScreen={false}
      size="md"
      message={message || "Cargando datos del inventario..."}
    />
  </div>
));

SecondaryLoading.displayName = 'LoadingScreen.Secondary';

// ✅ COMPONENTE INLINE
const InlineLoading = React.memo(({ message, showSpinner = true, ...props }) => (
  <div
    className="loading-inline"
    role="status"
    aria-live="polite"
    data-testid="loading-inline"
    {...props}
  >
    {showSpinner && <div className="loading-inline-spinner" aria-hidden="true"></div>}
    <span className="loading-inline-text">
      {message || "Cargando..."}
    </span>
  </div>
));

InlineLoading.displayName = 'LoadingScreen.Inline';

// ✅ COMPONENTE SKELETON
const SkeletonLoading = React.memo(({
  type = "card",
  count = 1,
  className = "",
  ...props
}) => {
  const skeletonCount = Math.max(1, Math.min(count, 10));

  const skeletons = [];

  const generateSkeleton = (index) => {
    const key = `skeleton-${type}-${index}`;

    switch (type) {
      case "card":
        return (
          <div key={key} className={clsx("loading-skeleton-card", className)} {...props}>
            <div className="loading-skeleton-card-content">
              <div className="loading-skeleton-image" aria-hidden="true"></div>
              <div className="loading-skeleton-text">
                <div className="loading-skeleton-line loading-skeleton-line-wide"></div>
                <div className="loading-skeleton-line loading-skeleton-line-medium"></div>
                <div className="loading-skeleton-line loading-skeleton-line-narrow"></div>
              </div>
            </div>
          </div>
        );

      case "table":
        return (
          <div key={key} className={clsx("loading-skeleton-table", className)} {...props}>
            <div className="loading-skeleton-table-header">
              <div className="loading-skeleton-line loading-skeleton-line-wide"></div>
            </div>
            <div className="loading-skeleton-table-body">
              {Array.from({ length: 4 }).map((_, rowIndex) => (
                <div key={`skeleton-row-${rowIndex}`} className="loading-skeleton-table-row">
                  <div className="loading-skeleton-line loading-skeleton-line-5-6"></div>
                  <div className="loading-skeleton-line loading-skeleton-line-4-6"></div>
                  <div className="loading-skeleton-line loading-skeleton-line-3-6"></div>
                </div>
              ))}
            </div>
          </div>
        );

      case "list":
        return (
          <div key={key} className={clsx("loading-skeleton-list", className)} {...props}>
            <div className="loading-skeleton-lines">
              {Array.from({ length: 6 }).map((_, lineIndex) => (
                <div
                  key={`skeleton-line-${lineIndex}`}
                  className={`loading-skeleton-line loading-skeleton-line-${(lineIndex % 3) + 4}-6`}
                />
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div key={key} className={clsx("loading-skeleton-default", className)} {...props}>
            <div className="loading-skeleton-default-content"></div>
          </div>
        );
    }
  };

  for (let i = 0; i < skeletonCount; i++) {
    skeletons.push(generateSkeleton(i));
  }

  return (
    <div
      className="loading-skeleton-container"
      aria-label="Cargando contenido..."
    >
      {skeletons}
    </div>
  );
});

SkeletonLoading.displayName = 'LoadingScreen.Skeleton';
SkeletonLoading.propTypes = {
  type: PropTypes.string,
  count: PropTypes.number,
  className: PropTypes.string,
};

// ✅ COMPONENTE PROGRESS
const ProgressLoading = React.memo(({
  progress = 0,
  message = "Procesando...",
  showLabel = true,
  ...props
}) => (
  <div className="loading-progress-container" data-testid="loading-progress">
    <LoadingScreen
      {...props}
      variant="primary"
      fullScreen={false}
      showSpinner={false}
      showProgress={true}
      progressValue={progress}
      message={message}
    />
    {showLabel && (
      <div className="loading-progress-label" aria-live="polite">
        {progress < 100 ? `${message} (${progress}%)` : "¡Completado!"}
      </div>
    )}
  </div>
));

ProgressLoading.displayName = 'LoadingScreen.Progress';
ProgressLoading.propTypes = {
  progress: PropTypes.number,
  message: PropTypes.string,
  showLabel: PropTypes.bool,
};

// ✅ COMPONENTE ERROR
const ErrorLoading = React.memo(({
  message = "Error al cargar",
  retryText = "Reintentar",
  onRetry,
  ...props
}) => (
  <div
    className="loading-error-container"
    role="alert"
    aria-live="assertive"
    data-testid="loading-error"
    {...props}
  >
    <div className="loading-error-icon" aria-hidden="true">⚠️</div>
    <div className="loading-error-content">
      <p className="loading-error-message">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="loading-error-retry-btn"
          aria-label="Reintentar carga"
        >
          {retryText}
        </button>
      )}
    </div>
  </div>
));

ErrorLoading.displayName = 'LoadingScreen.Error';
ErrorLoading.propTypes = {
  message: PropTypes.string,
  retryText: PropTypes.string,
  onRetry: PropTypes.func,
};

// ✅ ASIGNACIÓN DE COMPONENTES
LoadingScreen.Primary = PrimaryLoading;
LoadingScreen.Secondary = SecondaryLoading;
LoadingScreen.Inline = InlineLoading;
LoadingScreen.Skeleton = SkeletonLoading;
LoadingScreen.Progress = ProgressLoading;
LoadingScreen.Error = ErrorLoading;

LoadingScreen.displayName = 'LoadingScreen';

export default LoadingScreen;