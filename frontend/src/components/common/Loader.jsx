import React, { useMemo, useCallback, useState, useContext } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import "../../assets/styles/global.css";

export const useLoader = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);
  const [loadingText, setLoadingText] = useState('');

  const show = useCallback((text = '') => {
    setIsLoading(true);
    if (text) setLoadingText(text);
  }, []);

  const hide = useCallback(() => {
    setIsLoading(false);
    setLoadingText('');
  }, []);

  const toggle = useCallback(() => {
    setIsLoading(prev => !prev);
    setLoadingText('');
  }, []);

  const setText = useCallback((text) => {
    setLoadingText(text);
  }, []);

  return {
    isLoading,
    loadingText,
    show,
    hide,
    toggle,
    setText
  };
};

const SIZE_CLASSES = {
  xs: { loader: 'loader-xs', text: 'loader-text-xs' },
  sm: { loader: 'loader-sm', text: 'loader-text-sm' },
  md: { loader: 'loader-md', text: 'loader-text-md' },
  lg: { loader: 'loader-lg', text: 'loader-text-lg' },
  xl: { loader: 'loader-xl', text: 'loader-text-xl' }
};

const COLOR_CLASSES = {
  primary: 'loader-color-primary',
  secondary: 'loader-color-secondary',
  success: 'loader-color-success',
  warning: 'loader-color-warning',
  danger: 'loader-color-danger',
  light: 'loader-color-light',
  dark: 'loader-color-dark'
};

const SPEED_CLASSES = {
  slow: 'loader-speed-slow',
  normal: 'loader-speed-normal',
  fast: 'loader-speed-fast'
};

const THICKNESS_CLASSES = {
  thin: 'loader-thickness-thin',
  normal: 'loader-thickness-normal',
  thick: 'loader-thickness-thick'
};

const renderers = {
  dots: ({ sizeClass, colorClass, speedClass }) => (
    <div className={clsx('loader-dots', sizeClass, colorClass, speedClass)}>
      <div className="loader-dot"></div>
      <div className="loader-dot"></div>
      <div className="loader-dot"></div>
    </div>
  ),

  bars: ({ sizeClass, colorClass, speedClass }) => (
    <div className={clsx('loader-bars', sizeClass, colorClass, speedClass)}>
      <div className="loader-bar"></div>
      <div className="loader-bar"></div>
      <div className="loader-bar"></div>
      <div className="loader-bar"></div>
      <div className="loader-bar"></div>
    </div>
  ),

  progress: ({ sizeClass, colorClass, speedClass, thickness }) => {
    const styleMap = {
      thin: { height: '2px', borderRadius: '1px' },
      thick: { height: '6px', borderRadius: '3px' },
      normal: { height: '4px', borderRadius: '2px' }
    };
    
    const { height, borderRadius } = styleMap[thickness] || styleMap.normal;

    return (
      <div className={clsx('loader-progress', sizeClass)}>
        <div
          className={clsx('loader-progress-bar', colorClass, speedClass)}
          style={{ height, borderRadius }}
        ></div>
      </div>
    );
  },

  skeleton: ({ sizeClass, colorClass }) => (
    <div className={clsx('loader-skeleton', sizeClass)}>
      <div className="loader-skeleton-shimmer">
        <div className={clsx('loader-skeleton-content', colorClass)}></div>
      </div>
    </div>
  ),

  spinner: ({ sizeClass, colorClass, speedClass, thicknessClass }) => (
    <div className={clsx(
      'loader-spinner',
      sizeClass,
      colorClass,
      speedClass,
      thicknessClass
    )}>
      <div className="loader-spinner-inner"></div>
    </div>
  )
};

const Loader = React.memo(({
  size = 'md',
  color = 'primary',
  variant = 'spinner',
  text = '',
  fullScreen = false,
  className = '',
  showText = false,
  textPosition = 'bottom',
  overlay = false,
  overlayOpacity = 0.5,
  zIndex = 50,
  inline = false,
  speed = 'normal',
  thickness = 'normal',
  'aria-label': ariaLabel,
  ...props
}) => {
  const sizeClass = SIZE_CLASSES[size]?.loader || SIZE_CLASSES.md.loader;
  const textSizeClass = SIZE_CLASSES[size]?.text || SIZE_CLASSES.md.text;
  const colorClass = COLOR_CLASSES[color] || COLOR_CLASSES.primary;
  const speedClass = SPEED_CLASSES[speed] || SPEED_CLASSES.normal;
  const thicknessClass = THICKNESS_CLASSES[thickness] || THICKNESS_CLASSES.normal;

  const renderLoaderContent = useMemo(() => {
    const renderer = renderers[variant] || renderers.spinner;
    return renderer({
      sizeClass,
      colorClass,
      speedClass,
      thicknessClass,
      thickness
    });
  }, [variant, sizeClass, colorClass, speedClass, thicknessClass, thickness]);

  const loaderContent = useMemo(() => (
    <div
      className={clsx(
        'loader-container',
        inline ? 'loader-inline' : 'loader-block',
        className
      )}
      aria-live="polite"
      aria-label={ariaLabel || text || "Cargando..."}
      data-testid="loader-container"
      {...props}
    >
      <div className="loader-animation-container">
        {renderLoaderContent}
      </div>

      {showText && text && (
        <div className={clsx('loader-text-container', `loader-text-${textPosition}`)}>
          <p className={clsx('loader-text', textSizeClass)}>
            {text}
          </p>
        </div>
      )}
    </div>
  ), [
    inline, className, ariaLabel, text, showText, textPosition,
    textSizeClass, props, renderLoaderContent
  ]);

  if (fullScreen) {
    return (
      <div
        className="loader-fullscreen"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: zIndex || 50,
          backgroundColor: overlay ? `rgba(0, 0, 0, ${overlayOpacity})` : 'transparent'
        }}
        aria-label="Cargando contenido completo"
        data-testid="loader-fullscreen"
        role="dialog"
        aria-modal="true"
      >
        {loaderContent}
      </div>
    );
  }

  if (overlay && !fullScreen) {
    return (
      <div
        className="loader-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: zIndex || 40,
          backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`
        }}
        aria-label={ariaLabel || "Cargando..."}
        data-testid="loader-overlay"
        role="status"
      >
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
});

Loader.propTypes = {
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'warning', 'danger', 'light', 'dark']),
  variant: PropTypes.oneOf(['spinner', 'dots', 'bars', 'progress', 'skeleton']),
  text: PropTypes.string,
  fullScreen: PropTypes.bool,
  className: PropTypes.string,
  showText: PropTypes.bool,
  textPosition: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
  overlay: PropTypes.bool,
  overlayOpacity: PropTypes.number,
  zIndex: PropTypes.number,
  inline: PropTypes.bool,
  speed: PropTypes.oneOf(['slow', 'normal', 'fast']),
  thickness: PropTypes.oneOf(['thin', 'normal', 'thick']),
  'aria-label': PropTypes.string
};

Loader.defaultProps = {
  size: 'md',
  color: 'primary',
  variant: 'spinner',
  text: '',
  fullScreen: false,
  showText: false,
  textPosition: 'bottom',
  overlay: false,
  overlayOpacity: 0.5,
  zIndex: 50,
  inline: false,
  speed: 'normal',
  thickness: 'normal'
};

const createSpecializedLoader = (variant) => React.memo((props) => (
  <Loader variant={variant} {...props} />
));

const SpinnerLoader = createSpecializedLoader('spinner');
SpinnerLoader.displayName = 'SpinnerLoader';

const DotsLoader = createSpecializedLoader('dots');
DotsLoader.displayName = 'DotsLoader';

const BarsLoader = createSpecializedLoader('bars');
BarsLoader.displayName = 'BarsLoader';

const ProgressLoader = createSpecializedLoader('progress');
ProgressLoader.displayName = 'ProgressLoader';

const SkeletonLoader = createSpecializedLoader('skeleton');
SkeletonLoader.displayName = 'SkeletonLoader';

Loader.Spinner = SpinnerLoader;
Loader.Dots = DotsLoader;
Loader.Bars = BarsLoader;
Loader.Progress = ProgressLoader;
Loader.Skeleton = SkeletonLoader;
Loader.useLoader = useLoader;

Loader.displayName = 'Loader';

export const LoaderContext = React.createContext({
  isLoading: false,
  loadingText: '',
  show: () => {},
  hide: () => {},
  setText: () => {}
});

export const LoaderProvider = ({ children }) => {
  const loader = useLoader(false);

  const value = useMemo(() => ({
    isLoading: loader.isLoading,
    loadingText: loader.loadingText,
    show: loader.show,
    hide: loader.hide,
    setText: loader.setText
  }), [loader]);

  return (
    <LoaderContext.Provider value={value}>
      {children}
      {loader.isLoading && (
        <Loader
          fullScreen
          overlay
          text={loader.loadingText}
          showText={!!loader.loadingText}
          variant="spinner"
          color="primary"
        />
      )}
    </LoaderContext.Provider>
  );
};

LoaderProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useGlobalLoader = () => {
  const context = useContext(LoaderContext);
  if (context === undefined) {
    throw new Error('useGlobalLoader must be used within LoaderProvider');
  }
  return context;
};

export default Loader;