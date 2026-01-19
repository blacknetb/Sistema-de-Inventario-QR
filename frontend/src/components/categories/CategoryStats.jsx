import React from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/CATEGORIES/categories.css';

const CategoryStats = ({ categories }) => {
    const calculateStats = () => {
        if (!categories || categories.length === 0) {
            return {
                total: 0,
                active: 0,
                inactive: 0,
                totalProducts: 0,
                totalValue: 0,
                averageProducts: 0,
                averageValue: 0
            };
        }

        const activeCategories = categories.filter(cat => cat.estado);
        const inactiveCategories = categories.filter(cat => !cat.estado);
        
        const totalProducts = categories.reduce((sum, cat) => sum + (cat.total_productos || 0), 0);
        const totalValue = categories.reduce((sum, cat) => sum + (cat.valor_total || 0), 0);
        
        const averageProducts = categories.length > 0 ? totalProducts / categories.length : 0;
        const averageValue = categories.length > 0 ? totalValue / categories.length : 0;

        return {
            total: categories.length,
            active: activeCategories.length,
            inactive: inactiveCategories.length,
            totalProducts,
            totalValue,
            averageProducts: Math.round(averageProducts * 100) / 100,
            averageValue: Math.round(averageValue * 100) / 100
        };
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    const stats = calculateStats();

    const getPercentage = (value, total) => {
        return total > 0 ? Math.round((value / total) * 100) : 0;
    };

    return (
        <div className="category-stats-container">
            <h3>Estadísticas de Categorías</h3>
            
            <div className="stats-grid">
                <div className="stat-card total">
                    <div className="stat-icon">
                        <i className="fas fa-folder"></i>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-label">Total Categorías</span>
                    </div>
                    <div className="stat-trend">
                        <span className="trend-up">📈</span>
                    </div>
                </div>

                <div className="stat-card active">
                    <div className="stat-icon">
                        <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.active}</span>
                        <span className="stat-label">Categorías Activas</span>
                        <div className="stat-progress">
                            <div 
                                className="progress-bar" 
                                style={{ width: `${getPercentage(stats.active, stats.total)}%` }}
                            ></div>
                        </div>
                        <span className="stat-percentage">
                            {getPercentage(stats.active, stats.total)}%
                        </span>
                    </div>
                </div>

                <div className="stat-card products">
                    <div className="stat-icon">
                        <i className="fas fa-boxes"></i>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.totalProducts}</span>
                        <span className="stat-label">Total Productos</span>
                    </div>
                    <div className="stat-detail">
                        <span className="stat-average">
                            {stats.averageProducts.toFixed(1)} por categoría
                        </span>
                    </div>
                </div>

                <div className="stat-card value">
                    <div className="stat-icon">
                        <i className="fas fa-money-bill-wave"></i>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{formatCurrency(stats.totalValue)}</span>
                        <span className="stat-label">Valor Total</span>
                    </div>
                    <div className="stat-detail">
                        <span className="stat-average">
                            {formatCurrency(stats.averageValue)} promedio
                        </span>
                    </div>
                </div>

                <div className="stat-card distribution">
                    <div className="stat-content">
                        <h4>Distribución por Estado</h4>
                        <div className="distribution-chart">
                            <div 
                                className="chart-segment active-segment"
                                style={{ flex: stats.active }}
                                title={`${stats.active} activas (${getPercentage(stats.active, stats.total)}%)`}
                            >
                                <span>Activas</span>
                            </div>
                            <div 
                                className="chart-segment inactive-segment"
                                style={{ flex: stats.inactive }}
                                title={`${stats.inactive} inactivas (${getPercentage(stats.inactive, stats.total)}%)`}
                            >
                                <span>Inactivas</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="stat-card insights">
                    <div className="stat-content">
                        <h4>📊 Información Útil</h4>
                        <ul className="insights-list">
                            <li>
                                <i className="fas fa-lightbulb"></i>
                                <span>
                                    {stats.totalProducts === 0 
                                        ? 'Agrega productos a tus categorías' 
                                        : stats.averageProducts < 5 
                                            ? 'Considera agrupar categorías similares'
                                            : '¡Buen balance de productos!'}
                                </span>
                            </li>
                            <li>
                                <i className="fas fa-lightbulb"></i>
                                <span>
                                    {stats.inactive > 0 
                                        ? `${stats.inactive} categorías inactivas - revisa si son necesarias` 
                                        : 'Todas las categorías están activas ✓'}
                                </span>
                            </li>
                            <li>
                                <i className="fas fa-lightbulb"></i>
                                <span>
                                    Categoría con más productos: {
                                        categories.length > 0 
                                            ? categories.reduce((max, cat) => 
                                                (cat.total_productos || 0) > (max.total_productos || 0) ? cat : max
                                              ).nombre
                                            : 'N/A'
                                    }
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {stats.total > 0 && (
                <div className="stats-summary">
                    <div className="summary-item">
                        <strong>Relación Activo/Inactivo:</strong>
                        <span>{stats.active}:{stats.inactive}</span>
                    </div>
                    <div className="summary-item">
                        <strong>Productos por Categoría:</strong>
                        <span>{stats.averageProducts.toFixed(1)} (promedio)</span>
                    </div>
                    <div className="summary-item">
                        <strong>Valor por Categoría:</strong>
                        <span>{formatCurrency(stats.averageValue)} (promedio)</span>
                    </div>
                    <div className="summary-item">
                        <strong>Eficiencia Organizacional:</strong>
                        <span className={`efficiency ${stats.totalProducts > 0 ? 'good' : 'poor'}`}>
                            {stats.totalProducts > 0 ? 'Buena' : 'Por mejorar'}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

CategoryStats.propTypes = {
    categories: PropTypes.arrayOf(PropTypes.shape({
        estado: PropTypes.bool,
        total_productos: PropTypes.number,
        valor_total: PropTypes.number,
        nombre: PropTypes.string
    })).isRequired
};

export default CategoryStats;