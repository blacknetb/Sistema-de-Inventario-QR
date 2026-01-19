import React from 'react';
import '../../assets/styles/Dashboard/Dashboard.css';

const StatsCards = ({ stats }) => {
  const cards = [
    {
      title: 'Total de Productos',
      value: stats.totalItems,
      icon: '📦',
      color: '#3498db',
      description: 'Items en inventario'
    },
    {
      title: 'Valor Total',
      value: `$${stats.totalValue.toFixed(2)}`,
      icon: '💰',
      color: '#2ecc71',
      description: 'Valor del inventario'
    },
    {
      title: 'Bajo Stock',
      value: stats.lowStockItems,
      icon: '⚠️',
      color: '#f39c12',
      description: 'Necesitan reposición'
    },
    {
      title: 'Agotados',
      value: stats.outOfStockItems,
      icon: '❌',
      color: '#e74c3c',
      description: 'Sin existencia'
    }
  ];

  return (
    <div className="stats-cards-container">
      {cards.map((card, index) => (
        <div className="stat-card" key={index}>
          <div className="stat-icon" style={{ backgroundColor: `${card.color}20` }}>
            <span style={{ color: card.color }}>{card.icon}</span>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{card.value}</h3>
            <p className="stat-title">{card.title}</p>
            <p className="stat-description">{card.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;