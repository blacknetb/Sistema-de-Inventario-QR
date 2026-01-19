import React from 'react';
import '../../assets/styles/layout/layout.css';

const LoadingOverlay = ({ 
  isLoading, 
  message = 'Cargando...', 
  type = 'spinner',
  fullScreen = true,
  zIndex = 2000,
  className = '',
  style = {}
}) => {
  if (!isLoading) return null;

  const overlayClass = `
    loading-overlay 
    ${fullScreen ? 'loading-overlay-fullscreen' : 'loading-overlay-inline'} 
    ${className}
  `.trim();

  const overlayStyle = {
    zIndex,
    ...style
  };

  const renderLoader = () => {
    switch (type) {
      case 'dots':
        return (
          <div className="dots-loader">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        );
      
      case 'bars':
        return (
          <div className="bars-loader">
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
          </div>
        );
      
      case 'pulse':
        return <div className="pulse-loader"></div>;
      
      default: // spinner
        return (
          <div className="spinner-loader">
            <div className="spinner"></div>
            <div className="spinner-ring"></div>
          </div>
        );
    }
  };

  return (
    <div className={overlayClass} style={overlayStyle}>
      <div className="loading-content">
        {renderLoader()}
        {message && <div className="loading-message">{message}</div>}
        
        {fullScreen && (
          <div className="loading-progress">
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
            <div className="progress-text">Cargando datos del inventario...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;