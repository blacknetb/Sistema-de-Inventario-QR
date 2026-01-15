/**
 * DashboardMain.js
 * Componente principal del dashboard
 * Ubicación: E:\portafolio de desarrollo web\app web\proyectos basicos\inventarios basicos\frontend\src\components\dashboard\DashboardMain.js
 */

import React, { useState, useEffect } from 'react';
import './DashboardMain.css';

// Componentes del dashboard
import StatsCards from './StatsCards';
import RecentActivity from './RecentActivity';
import InventoryChart from './InventoryChart';
import SalesChart from './SalesChart';
import LowStockProducts from './LowStockProducts';
import TopProducts from './TopProducts';
import QuickActions from './QuickActions';
import PerformanceMetrics from './PerformanceMetrics';

const DashboardMain = () => {
    const [dashboardData, setDashboardData] = useState({
        stats: {},
        activities: [],
        inventoryData: [],
        salesData: [],
        lowStock: [],
        topProducts: [],
        metrics: {}
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dateRange, setDateRange] = useState('today');
    const [refreshKey, setRefreshKey] = useState(0);

    // Cargar datos del dashboard
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);

                const token = localStorage.getItem('token');
                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };

                // Fetch múltiples endpoints en paralelo
                const [
                    statsRes,
                    activitiesRes,
                    inventoryRes,
                    salesRes,
                    lowStockRes,
                    topProductsRes,
                    metricsRes
                ] = await Promise.all([
                    fetch(`http://localhost:3000/api/dashboard/stats?range=${dateRange}`, { headers }),
                    fetch(`http://localhost:3000/api/dashboard/activities?limit=10`, { headers }),
                    fetch(`http://localhost:3000/api/dashboard/inventory?range=${dateRange}`, { headers }),
                    fetch(`http://localhost:3000/api/dashboard/sales?range=${dateRange}`, { headers }),
                    fetch('http://localhost:3000/api/dashboard/low-stock?threshold=10', { headers }),
                    fetch('http://localhost:3000/api/dashboard/top-products?limit=5', { headers }),
                    fetch(`http://localhost:3000/api/dashboard/metrics?range=${dateRange}`, { headers })
                ]);

                // Verificar respuestas
                const responses = [statsRes, activitiesRes, inventoryRes, salesRes, lowStockRes, topProductsRes, metricsRes];
                const hasError = responses.some(res => !res.ok);

                if (hasError) {
                    throw new Error('Error al cargar datos del dashboard');
                }

                // Parsear respuestas
                const [
                    statsData,
                    activitiesData,
                    inventoryData,
                    salesData,
                    lowStockData,
                    topProductsData,
                    metricsData
                ] = await Promise.all(responses.map(res => res.json()));

                setDashboardData({
                    stats: statsData,
                    activities: activitiesData,
                    inventoryData: inventoryData,
                    salesData: salesData,
                    lowStock: lowStockData,
                    topProducts: topProductsData,
                    metrics: metricsData
                });

            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError(err.message);
                
                // Datos de ejemplo para desarrollo
                setDashboardData({
                    stats: {
                        totalProducts: 1245,
                        totalSales: 45678,
                        totalPurchases: 23456,
                        totalProfit: 22222,
                        lowStockItems: 23,
                        outOfStockItems: 5,
                        activeSuppliers: 45,
                        pendingOrders: 12
                    },
                    activities: [
                        { id: 1, type: 'sale', message: 'Venta realizada - Orden #12345', time: '2024-01-15T10:30:00Z', user: 'Juan Pérez' },
                        { id: 2, type: 'purchase', message: 'Compra recibida - Proveedor ABC', time: '2024-01-15T09:15:00Z', user: 'María García' },
                        { id: 3, type: 'stock', message: 'Stock actualizado - Producto XYZ', time: '2024-01-15T08:45:00Z', user: 'Carlos López' },
                        { id: 4, type: 'alert', message: 'Producto con stock bajo detectado', time: '2024-01-15T08:00:00Z', user: 'Sistema' },
                        { id: 5, type: 'user', message: 'Nuevo usuario registrado', time: '2024-01-14T16:20:00Z', user: 'Ana Martínez' }
                    ],
                    inventoryData: [
                        { category: 'Electrónicos', count: 320 },
                        { category: 'Ropa', count: 450 },
                        { category: 'Alimentos', count: 280 },
                        { category: 'Hogar', count: 195 }
                    ],
                    salesData: [
                        { day: 'Lun', sales: 12000 },
                        { day: 'Mar', sales: 18000 },
                        { day: 'Mié', sales: 15000 },
                        { day: 'Jue', sales: 22000 },
                        { day: 'Vie', sales: 25000 },
                        { day: 'Sáb', sales: 30000 },
                        { day: 'Dom', sales: 28000 }
                    ],
                    lowStock: [
                        { id: 1, name: 'Producto A', currentStock: 5, minStock: 20, category: 'Electrónicos' },
                        { id: 2, name: 'Producto B', currentStock: 8, minStock: 25, category: 'Ropa' },
                        { id: 3, name: 'Producto C', currentStock: 3, minStock: 15, category: 'Alimentos' },
                        { id: 4, name: 'Producto D', currentStock: 2, minStock: 10, category: 'Hogar' }
                    ],
                    topProducts: [
                        { id: 1, name: 'Producto Popular 1', sales: 156, revenue: 23400 },
                        { id: 2, name: 'Producto Popular 2', sales: 134, revenue: 20100 },
                        { id: 3, name: 'Producto Popular 3', sales: 122, revenue: 18300 },
                        { id: 4, name: 'Producto Popular 4', sales: 98, revenue: 14700 },
                        { id: 5, name: 'Producto Popular 5', sales: 87, revenue: 13050 }
                    ],
                    metrics: {
                        salesGrowth: 12.5,
                        profitMargin: 25.8,
                        inventoryTurnover: 4.2,
                        customerSatisfaction: 4.5
                    }
                });
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [dateRange, refreshKey]);

    // Manejar cambio de rango de fecha
    const handleDateRangeChange = (range) => {
        setDateRange(range);
        setLoading(true);
    };

    // Manejar refresco manual
    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    // Manejar error
    const handleErrorDismiss = () => {
        setError(null);
    };

    if (loading && refreshKey === 0) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner"></div>
                <p>Cargando dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-main">
            {/* Encabezado del dashboard */}
            <div className="dashboard-header">
                <div className="header-content">
                    <h1 className="dashboard-title">Dashboard</h1>
                    <p className="dashboard-subtitle">
                        Resumen general del sistema de inventario
                        <span className="last-updated">
                            Última actualización: {new Date().toLocaleTimeString()}
                        </span>
                    </p>
                </div>

                <div className="header-controls">
                    <div className="date-range-selector">
                        <button 
                            className={`range-btn ${dateRange === 'today' ? 'active' : ''}`}
                            onClick={() => handleDateRangeChange('today')}
                        >
                            Hoy
                        </button>
                        <button 
                            className={`range-btn ${dateRange === 'week' ? 'active' : ''}`}
                            onClick={() => handleDateRangeChange('week')}
                        >
                            Esta Semana
                        </button>
                        <button 
                            className={`range-btn ${dateRange === 'month' ? 'active' : ''}`}
                            onClick={() => handleDateRangeChange('month')}
                        >
                            Este Mes
                        </button>
                        <button 
                            className={`range-btn ${dateRange === 'year' ? 'active' : ''}`}
                            onClick={() => handleDateRangeChange('year')}
                        >
                            Este Año
                        </button>
                    </div>

                    <button 
                        className="refresh-btn"
                        onClick={handleRefresh}
                        disabled={loading}
                    >
                        {loading ? '🔄 Actualizando...' : '🔄 Actualizar'}
                    </button>
                </div>
            </div>

            {/* Mensaje de error */}
            {error && (
                <div className="dashboard-error">
                    <div className="error-content">
                        <span className="error-icon">⚠️</span>
                        <div className="error-message">
                            <strong>Error:</strong> {error}
                        </div>
                    </div>
                    <button className="error-dismiss" onClick={handleErrorDismiss}>
                        ×
                    </button>
                </div>
            )}

            {/* Tarjetas de estadísticas */}
            <StatsCards stats={dashboardData.stats} loading={loading} />

            {/* Grid principal del dashboard */}
            <div className="dashboard-grid">
                {/* Columna izquierda */}
                <div className="dashboard-column left">
                    <div className="dashboard-section">
                        <InventoryChart data={dashboardData.inventoryData} loading={loading} />
                    </div>

                    <div className="dashboard-section">
                        <LowStockProducts products={dashboardData.lowStock} loading={loading} />
                    </div>

                    <div className="dashboard-section">
                        <QuickActions />
                    </div>
                </div>

                {/* Columna central */}
                <div className="dashboard-column middle">
                    <div className="dashboard-section">
                        <SalesChart data={dashboardData.salesData} loading={loading} />
                    </div>

                    <div className="dashboard-section">
                        <TopProducts products={dashboardData.topProducts} loading={loading} />
                    </div>
                </div>

                {/* Columna derecha */}
                <div className="dashboard-column right">
                    <div className="dashboard-section">
                        <RecentActivity activities={dashboardData.activities} loading={loading} />
                    </div>

                    <div className="dashboard-section">
                        <PerformanceMetrics metrics={dashboardData.metrics} loading={loading} />
                    </div>
                </div>
            </div>

            {/* Sección inferior */}
            <div className="dashboard-footer">
                <div className="footer-info">
                    <div className="info-item">
                        <span className="info-label">Estado del sistema:</span>
                        <span className="info-value status-ok">🟢 Operativo</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Usuarios en línea:</span>
                        <span className="info-value">12</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Tiempo de actividad:</span>
                        <span className="info-value">99.8%</span>
                    </div>
                </div>

                <div className="footer-actions">
                    <button className="footer-btn">📊 Reporte Completo</button>
                    <button className="footer-btn">📥 Exportar Datos</button>
                    <button className="footer-btn">⚙️ Configuración</button>
                </div>
            </div>
        </div>
    );
};

export default DashboardMain;