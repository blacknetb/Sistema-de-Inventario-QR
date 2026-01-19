import React from 'react';
import '../../assets/styles/layout/layout.css';

const Breadcrumb = ({ items, onNavigate }) => {
  const handleClick = (item, index) => {
    if (item.path && index < items.length - 1) {
      if (onNavigate) {
        onNavigate(item.path);
      } else {
        // Navegación por defecto
        window.location.hash = item.path;
      }
    }
  };

  return (
    <nav className="breadcrumb" aria-label="breadcrumb">
      <ol className="breadcrumb-list">
        {items.map((item, index) => (
          <li key={index} className="breadcrumb-item">
            {index < items.length - 1 ? (
              <>
                <button
                  className="breadcrumb-link"
                  onClick={() => handleClick(item, index)}
                  disabled={!item.path}
                >
                  {item.icon && <span className="breadcrumb-icon">{item.icon}</span>}
                  <span className="breadcrumb-text">{item.label}</span>
                </button>
                <span className="breadcrumb-separator">/</span>
              </>
            ) : (
              <span className="breadcrumb-current">
                {item.icon && <span className="breadcrumb-icon">{item.icon}</span>}
                <span className="breadcrumb-text">{item.label}</span>
              </span>
            )}
          </li>
        ))}
      </ol>
      
      {items.length > 1 && (
        <div className="breadcrumb-actions">
          <button 
            className="breadcrumb-action-btn"
            onClick={() => window.history.back()}
            title="Volver atrás"
          >
            ← Volver
          </button>
          <button 
            className="breadcrumb-action-btn"
            onClick={() => window.location.reload()}
            title="Refrescar página"
          >
            ↻ Refrescar
          </button>
        </div>
      )}
    </nav>
  );
};

export default Breadcrumb;