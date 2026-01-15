import React, { useState, useEffect } from 'react';
import '../../assets/styles/categoria/CategoryStatistics.css';

const CategoryStatistics = () => {
    const [statistics, setStatistics] = useState({
        totalCategories: 0,
        activeCategories: 0,
        inactiveCategories: 0,
        categoriesByMonth: [],
        recentCategories: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState('month');

    // Cargar estadísticas
    const fetchStatistics = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:3000/api/categories/statistics?range=${timeRange}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar las estadísticas');
            }

            const data = await response.json();
            setStatistics(data);
            setError(null);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching statistics:', err);
        } finally {
            setLoading(false);
        }
    };

    // Cargar estadísticas al montar el componente o cambiar el rango de tiempo
    useEffect(() => {
        fetchStatistics();
    }, [timeRange]);

    // Calcular porcentaje de categorías activas
    const activePercentage = statistics.totalCategories > 0 
        ? Math.round((statistics.activeCategories / statistics.totalCategories) * 100)
        : 0;

    // Obtener el color según el porcentaje
    const getPercentageColor = (percentage) => {
        if (percentage >= 80) return '#10b981';
        if (percentage >= 60) return '#f59e0b';
        return '#ef4444';
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Cargando estadísticas...</p>
            </div>
        );
    }

    return (
        <div className="category-statistics">
            <div className="stats-header">
                <h2>Estadísticas de Categorías</h2>
                <div className="time-range-selector">
                    <button
                        className={`time-btn ${timeRange === 'week' ? 'active' : ''}`}
                        onClick={() => setTimeRange('week')}
                    >
                        Semana
                    </button>
                    <button
                        className={`time-btn ${timeRange === 'month' ? 'active' : ''}`}
                        onClick={() => setTimeRange('month')}
                    >
                        Mes
                    </button>
                    <button
                        className={`time-btn ${timeRange === 'year' ? 'active' : ''}`}
                        onClick={() => setTimeRange('year')}
                    >
                        Año
                    </button>
                </div>
            </div>

            {error && (
                <div className="error-alert">
                    <p>{error}</p>
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            <div className="stats-grid">
                <div className="stat-card total">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                        <h3>Total Categorías</h3>
                        <p className="stat-value">{statistics.totalCategories}</p>
                        <p className="stat-trend">Total registradas</p>
                    </div>
                </div>

                <div className="stat-card active">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <h3>Categorías Activas</h3>
                        <p className="stat-value">{statistics.activeCategories}</p>
                        <div className="stat-progress">
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill"
                                    style={{
                                        width: `${activePercentage}%`,
                                        backgroundColor: getPercentageColor(activePercentage)
                                    }}
                                ></div>
                            </div>
                            <span className="percentage">{activePercentage}%</span>
                        </div>
                    </div>
                </div>

                <div className="stat-card inactive">
                    <div className="stat-icon">⏸️</div>
                    <div className="stat-content">
                        <h3>Categorías Inactivas</h3>
                        <p className="stat-value">{statistics.inactiveCategories}</p>
                        <p className="stat-trend">
                            {statistics.totalCategories > 0 
                                ? `${100 - activePercentage}% del total`
                                : 'Sin datos'
                            }
                        </p>
                    </div>
                </div>

                <div className="stat-card recent">
                    <div className="stat-icon">🆕</div>
                    <div className="stat-content">
                        <h3>Recientes</h3>
                        <p className="stat-value">
                            {statistics.recentCategories.length}
                        </p>
                        <p className="stat-trend">
                            Últimos 30 días
                        </p>
                    </div>
                </div>
            </div>

            {/* Gráfico de categorías por mes */}
            {statistics.categoriesByMonth.length > 0 && (
                <div className="chart-container">
                    <h3>Distribución por Mes</h3>
                    <div className="chart">
                        {statistics.categoriesByMonth.map((item, index) => {
                            const maxValue = Math.max(...statistics.categoriesByMonth.map(i => i.count));
                            const height = maxValue > 0 ? (item.count / maxValue) * 100 : 0;
                            
                            return (
                                <div key={index} className="chart-bar">
                                    <div 
                                        className="bar-fill"
                                        style={{ height: `${height}%` }}
                                    ></div>
                                    <span className="bar-label">{item.month}</span>
                                    <span className="bar-value">{item.count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Lista de categorías recientes */}
            {statistics.recentCategories.length > 0 && (
                <div className="recent-categories">
                    <h3>Categorías Recientes</h3>
                    <ul className="recent-list">
                        {statistics.recentCategories.map((category, index) => (
                            <li key={index} className="recent-item">
                                <div className="recent-info">
                                    <span className="recent-name">{category.name}</span>
                                    <span className={`recent-status ${category.status}`}>
                                        {category.status === 'active' ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                                <span className="recent-date">
                                    {new Date(category.createdAt).toLocaleDateString()}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default CategoryStatistics;