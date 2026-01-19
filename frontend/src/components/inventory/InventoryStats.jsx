import React from 'react';
import '../../assets/styles/inventory/Inventory.css';

const InventoryStats = ({ stats }) => {
  const statCards = [
    {
      title: 'Productos Totales',
      value: stats.totalProducts,
      icon: '📦',
      color: '#3b82f6',
      description: 'Items en inventario',
      trend: '+12%'
    },
    {
      title: 'Valor Total',
      value: `$${stats.totalValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
      icon: '💰',
      color: '#10b981',
      description: 'Valor del inventario',
      trend: '+8.5%'
    },
    {
      title: 'Costo Total',
      value: `$${stats.totalCost.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
      icon: '💳',
      color: '#8b5cf6',
      description: 'Inversión total',
      trend: '+5.2%'
    },
    {
      title: 'Ganancia Total',
      value: `$${(stats.totalValue - stats.totalCost).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
      icon: '📈',
      color: '#f59e0b',
      description: 'Ganancia potencial',
      trend: '+15.3%'
    },
    {
      title: 'Disponible',
      value: stats.inStock,
      icon: '✅',
      color: '#10b981',
      description: 'En stock',
      percentage: `${((stats.inStock / stats.totalProducts) * 100).toFixed(1)}%`
    },
    {
      title: 'Bajo Stock',
      value: stats.lowStock,
      icon: '⚠️',
      color: '#f59e0b',
      description: 'Necesitan reposición',
      percentage: `${((stats.lowStock / stats.totalProducts) * 100).toFixed(1)}%`
    },
    {
      title: 'Agotados',
      value: stats.outOfStock,
      icon: '❌',
      color: '#ef4444',
      description: 'Sin existencia',
      percentage: `${((stats.outOfStock / stats.totalProducts) * 100).toFixed(1)}%`
    }
  ];

  return (
    <div className="inventory-stats-container">
      <h3 className="stats-title">Estadísticas del Inventario</h3>
      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-header">
              <div 
                className="stat-icon-wrapper"
                style={{ backgroundColor: `${stat.color}20` }}
              >
                <span style={{ color: stat.color }}>{stat.icon}</span>
              </div>
              <div className="stat-trend">
                {stat.trend && <span className="trend-positive">{stat.trend}</span>}
                {stat.percentage && <span className="stat-percentage">{stat.percentage}</span>}
              </div>
            </div>
            
            <div className="stat-content">
              <h4 className="stat-value">{stat.value}</h4>
              <p className="stat-title">{stat.title}</p>
              <p className="stat-description">{stat.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InventoryStats;