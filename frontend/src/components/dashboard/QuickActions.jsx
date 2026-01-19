import React from 'react';
import '../../assets/styles/Dashboard/Dashboard.css';

const QuickActions = ({ onAddItem, onExport, onPrint }) => {
  const actions = [
    {
      id: 1,
      title: 'Agregar Producto',
      icon: '➕',
      description: 'Añadir nuevo item al inventario',
      onClick: onAddItem,
      color: '#3498db'
    },
    {
      id: 2,
      title: 'Exportar Datos',
      icon: '📊',
      description: 'Exportar a CSV o Excel',
      onClick: onExport,
      color: '#2ecc71'
    },
    {
      id: 3,
      title: 'Imprimir Reporte',
      icon: '🖨️',
      description: 'Generar reporte imprimible',
      onClick: onPrint,
      color: '#9b59b6'
    },
    {
      id: 4,
      title: 'Ver Estadísticas',
      icon: '📈',
      description: 'Análisis detallado',
      onClick: () => alert('Funcionalidad en desarrollo'),
      color: '#e74c3c'
    }
  ];

  return (
    <div className="quick-actions-container">
      <h3 className="section-title">Acciones Rápidas</h3>
      <div className="actions-grid">
        {actions.map(action => (
          <button 
            key={action.id} 
            className="action-card"
            onClick={action.onClick}
            style={{ '--action-color': action.color }}
          >
            <div className="action-icon">{action.icon}</div>
            <div className="action-content">
              <h4>{action.title}</h4>
              <p>{action.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;