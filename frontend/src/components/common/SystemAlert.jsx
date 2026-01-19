import React, { useEffect } from 'react';
import '../../assets/styles/routes/routes.css';

const SystemAlert = ({ alert, onClose }) => {
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [alert, onClose]);

  if (!alert) return null;

  const getAlertClass = (type) => {
    switch(type) {
      case 'success': return 'alert-success';
      case 'warning': return 'alert-warning';
      case 'error': return 'alert-danger';
      case 'info': return 'alert-info';
      default: return 'alert-info';
    }
  };

  const getAlertIcon = (type) => {
    switch(type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  return (
    <div className="system-alert">
      <div className={`alert ${getAlertClass(alert.type)}`}>
        <span style={{ fontSize: '1.2rem' }}>{getAlertIcon(alert.type)}</span>
        <span>{alert.message}</span>
        <button 
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.2rem',
            cursor: 'pointer',
            marginLeft: '15px',
            color: 'inherit'
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default SystemAlert;