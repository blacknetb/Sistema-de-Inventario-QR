import React from 'react';
import '../../assets/styles/routes/routes.css';

const LoadingScreen = ({ message = 'Cargando...' }) => {
  return (
    <div className="loading-screen">
      <div className="loading-logo">📦</div>
      <div className="loading-spinner"></div>
      <p className="loading-text">{message}</p>
    </div>
  );
};

export default LoadingScreen;