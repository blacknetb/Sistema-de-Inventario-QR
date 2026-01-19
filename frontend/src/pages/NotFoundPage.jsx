import React from 'react';
import { Link } from 'react-router-dom';
import '../assets/styles/pages/pages.css';

const NotFoundPage = () => {
  return (
    <div className="not-found-container">
      <div style={{ position: 'relative' }}>
        <h1 className="not-found-title">404</h1>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '5rem',
          opacity: 0.1
        }}>
          📦
        </div>
      </div>
      
      <h2 className="not-found-subtitle">¡Página no encontrada!</h2>
      
      <p className="not-found-text">
        Lo sentimos, la página que estás buscando no existe o ha sido movida.
        Verifica la URL o regresa a la página principal.
      </p>
      
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/dashboard" className="btn btn-primary">
          <span className="btn-icon">🏠</span> Ir al Dashboard
        </Link>
        
        <Link to="/inventory" className="btn btn-secondary">
          <span className="btn-icon">📦</span> Ver Inventario
        </Link>
        
        <Link to="/help" className="btn btn-outline">
          <span className="btn-icon">❓</span> Centro de Ayuda
        </Link>
        
        <button onClick={() => window.history.back()} className="btn btn-outline">
          <span className="btn-icon">↩️</span> Volver Atrás
        </button>
      </div>
      
      <div style={{ marginTop: '50px', color: '#bdc3c7', fontSize: '0.9rem' }}>
        <p>Si crees que esto es un error, por favor contacta al soporte técnico.</p>
        <div style={{ marginTop: '20px' }}>
          <p>Código de error: 404_NOT_FOUND</p>
          <p>Timestamp: {new Date().toISOString()}</p>
          <p>Path: {window.location.pathname}</p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;