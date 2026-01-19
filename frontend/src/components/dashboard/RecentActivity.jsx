import React from 'react';
import '../../assets/styles/Dashboard/Dashboard.css';

const RecentActivity = ({ items }) => {
  // Simular actividad reciente basada en los items
  const recentActivities = [
    {
      id: 1,
      action: 'Producto agregado',
      item: 'Laptop Dell XPS 13',
      time: 'Hace 2 horas',
      user: 'Admin',
      type: 'add'
    },
    {
      id: 2,
      action: 'Stock actualizado',
      item: 'Mouse Inalámbrico',
      time: 'Hace 4 horas',
      user: 'Juan Pérez',
      type: 'update'
    },
    {
      id: 3,
      action: 'Producto agotado',
      item: 'Teclado Mecánico',
      time: 'Ayer',
      user: 'Sistema',
      type: 'warning'
    },
    {
      id: 4,
      action: 'Reporte generado',
      item: 'Inventario completo',
      time: 'Ayer',
      user: 'Admin',
      type: 'report'
    },
    {
      id: 5,
      action: 'Producto editado',
      item: 'Monitor 24" Samsung',
      time: 'Hace 2 días',
      user: 'María García',
      type: 'edit'
    }
  ];

  const getActivityIcon = (type) => {
    switch(type) {
      case 'add': return '🆕';
      case 'update': return '📝';
      case 'warning': return '⚠️';
      case 'report': return '📄';
      case 'edit': return '✏️';
      default: return '📋';
    }
  };

  const getActivityColor = (type) => {
    switch(type) {
      case 'add': return '#2ecc71';
      case 'update': return '#3498db';
      case 'warning': return '#e74c3c';
      case 'report': return '#9b59b6';
      case 'edit': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="recent-activity-container">
      <div className="activity-header">
        <h3 className="section-title">Actividad Reciente</h3>
        <span className="activity-count">{recentActivities.length} actividades</span>
      </div>
      
      <div className="activity-list">
        {recentActivities.map(activity => (
          <div key={activity.id} className="activity-item">
            <div 
              className="activity-icon"
              style={{ backgroundColor: `${getActivityColor(activity.type)}20`, color: getActivityColor(activity.type) }}
            >
              {getActivityIcon(activity.type)}
            </div>
            <div className="activity-content">
              <div className="activity-title">
                <strong>{activity.action}</strong> - {activity.item}
              </div>
              <div className="activity-meta">
                <span className="activity-user">{activity.user}</span>
                <span className="activity-time">{activity.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;