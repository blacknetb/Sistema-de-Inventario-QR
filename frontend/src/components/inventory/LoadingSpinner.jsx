import React from 'react';
import '../../assets/styles/inventory/Inventory.css';

const LoadingSpinner = ({ message = 'Cargando...' }) => {
  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner">
        <div className="spinner"></div>
        <div className="spinner-ring"></div>
      </div>
      <h3 className="loading-message">{message}</h3>
      <p className="loading-submessage">Por favor espera mientras cargamos el inventario</p>
      <div className="loading-dots">
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="dot"></span>
      </div>
    </div>
  );
};

export default LoadingSpinner;