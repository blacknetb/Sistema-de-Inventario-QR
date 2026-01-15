/**
 * StatsCards.js
 * Tarjetas de estadísticas del dashboard
 * Ubicación: E:\portafolio de desarrollo web\app web\proyectos basicos\inventarios basicos\frontend\src\components\dashboard\StatsCards.js
 */

import React from 'react';
import './StatsCards.css';

const StatsCards = ({ stats, loading }) => {
    // Definir las tarjetas de estadísticas
    const statCards = [
        {
            key: 'totalProducts',
            title: 'Total Productos',
            value: stats.totalProducts || 0,
            icon: '📦',
            color: 'blue',
            change: '+12%',
            description: 'vs mes anterior'
        },
        {
            key: 'totalSales',
            title: 'Ventas Totales',
            value: `$${stats.totalSales?.toLocaleString() || '0'}`,
            icon: '💰',
            color: 'green',
            change: '+18%',
            description: 'vs semana anterior'
        },
        {
            key: 'totalPurchases',
            title: 'Compras Totales',
            value: `$${stats.totalPurchases?.toLocaleString() || '0'}`,
            icon: '🛒',
            color: 'orange',
            change: '+8%',
            description: 'vs mes anterior'
        },
        {
            key: 'totalProfit',
            title: 'Utilidad Neta',
            value: `$${stats.totalProfit?.toLocaleString() || '0'}`,
            icon: '📈',
            color: 'purple',
            change: '+15%',
            description: 'vs mes anterior'
        },
        {
            key: 'lowStockItems',
            title: 'Stock Bajo',
            value: stats.lowStockItems || 0,
            icon: '⚠️',
            color: 'red',
            change: '-3',
            description: 'necesitan atención'
        },
        {
            key: 'outOfStockItems',
            title: 'Sin Stock',
            value: stats.outOfStockItems || 0,
            icon: '❌',
            color: 'dark',
            change: '+2',
            description: 'urgente reabastecer'
        },
        {
            key: 'activeSuppliers',
            title: 'Proveedores',
            value: stats.activeSuppliers || 0,
            icon: '🏢',
            color: 'teal',
            change: '+2',
            description: 'activos'
        },
        {
            key: 'pendingOrders',
            title: 'Pedidos Pendientes',
            value: stats.pendingOrders || 0,
            icon: '⏳',
            color: 'yellow',
            change: '-5',
            description: 'por procesar'
        }
    ];

    // Obtener color CSS según el tipo
    const getColorClass = (color) => {
        const colorMap = {
            blue: 'card-blue',
            green: 'card-green',
            orange: 'card-orange',
            purple: 'card-purple',
            red: 'card-red',
            dark: 'card-dark',
            teal: 'card-teal',
            yellow: 'card-yellow'
        };
        return colorMap[color] || 'card-blue';
    };

    // Determinar si el cambio es positivo
    const isPositiveChange = (change) => {
        if (!change) return 'neutral';
        const num = parseInt(change.replace(/[+-]/g, ''));
        const sign = change[0];
        
        // Para stock bajo y sin stock, menos es mejor
        if (change.includes('Stock')) {
            return sign === '-' ? 'positive' : 'negative';
        }
        
        return sign === '+' ? 'positive' : 'negative';
    };

    if (loading) {
        return (
            <div className="stats-cards-loading">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="stat-card-skeleton">
                        <div className="skeleton-icon"></div>
                        <div className="skeleton-content">
                            <div className="skeleton-title"></div>
                            <div className="skeleton-value"></div>
                            <div className="skeleton-change"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="stats-cards-container">
            {statCards.map((card) => (
                <div 
                    key={card.key}
                    className={`stat-card ${getColorClass(card.color)}`}
                >
                    <div className="card-header">
                        <div className="card-icon">
                            {card.icon}
                        </div>
                        <div className="card-trend">
                            <span className={`trend-value ${isPositiveChange(card.change)}`}>
                                {card.change}
                            </span>
                        </div>
                    </div>

                    <div className="card-body">
                        <h3 className="card-title">{card.title}</h3>
                        <p className="card-value">{card.value}</p>
                        <p className="card-description">{card.description}</p>
                    </div>

                    <div className="card-footer">
                        <button className="card-action">
                            Ver detalles →
                        </button>
                    </div>

                    {/* Indicador de animación */}
                    <div className="card-pulse"></div>
                </div>
            ))}
        </div>
    );
};

export default StatsCards;