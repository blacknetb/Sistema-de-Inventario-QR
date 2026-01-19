import React from 'react';
import '../../assets/styles/Dashboard/Dashboard.css';

const DashboardHeader = ({ title, onAddItem, user }) => {
  const currentDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <h1 className="dashboard-title">{title}</h1>
        <p className="dashboard-date">{currentDate}</p>
      </div>
      
      <div className="header-right">
        <button className="add-item-btn" onClick={onAddItem}>
          <span className="btn-icon">+</span>
          Agregar Producto
        </button>
        
        <div className="user-profile">
          <div className="user-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <span className="user-name">{user.name}</span>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;