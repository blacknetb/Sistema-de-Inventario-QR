import React, { useEffect, useState } from 'react';
import styles from './Dashboard.module.css';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/dashboard/StatCard/StatCard';
import RecentActivity from '../../components/dashboard/RecentActivity/RecentActivity';
import QuickActions from '../../components/dashboard/QuickActions/QuickActions';
import Chart from '../../components/reports/Chart/Chart';
import Loader from '../../components/common/Loader/Loader';
import Alert from '../../components/common/Alert/Alert';

const Dashboard = () => {
  const { user } = useAuth();
  const { 
    getStatistics, 
    getMovementsByDate, 
    products,
    loading 
  } = useInventory();
  
  const [stats, setStats] = useState(null);
  const [recentMovements, setRecentMovements] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (loadDashboardData);
  }, [products, loadDashboardData]);

  const loadDashboardData = () => {
    try {
      // Cargar estadísticas
      const statistics = getStatistics();
      setStats(statistics);

      // Cargar movimientos recientes
      const movements = getMovementsByDate(7);
      setRecentMovements(movements.map(m => ({
        ...m,
        description: m.description || `${m.type === 'entrada' ? 'Entrada' : 'Salida'} de ${m.productName}`,
        user: m.user || 'Sistema',
        time: new Date(m.date).toLocaleDateString()
      })));

      // Preparar datos para el gráfico
      const last7Days = [...Array(7)].map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toLocaleDateString('es-ES', { weekday: 'short' });
      }).reverse();

      const movementsByDay = last7Days.map(day => {
        return movements.filter(m => {
          const mDate = new Date(m.date).toLocaleDateString('es-ES', { weekday: 'short' });
          return mDate === day;
        }).length;
      });

      setChartData({
        labels: last7Days,
        values: movementsByDay
      });

      setError(null);
    } catch (err) {
      setError('Error al cargar los datos del dashboard');
    }
  };

  if (loading && !stats) {
    return <Loader fullScreen />;
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.welcome}>
          Bienvenido, <span className={styles.userName}>{user?.name}</span>
        </p>
      </div>

      {error && (
        <Alert 
          type="error" 
          message={error} 
          closable 
          onClose={() => setError(null)} 
        />
      )}

      <div className={styles.statsGrid}>
        <StatCard
          title="Total Productos"
          value={stats?.totalProducts || 0}
          icon="📦"
          color="blue"
          trend="up"
          trendValue="+12%"
        />
        <StatCard
          title="Stock Total"
          value={stats?.totalStock || 0}
          icon="📊"
          color="green"
          trend="up"
          trendValue="+5%"
        />
        <StatCard
          title="Valor Inventario"
          value={`$${stats?.totalValue?.toLocaleString() || 0}`}
          icon="💰"
          color="purple"
          trend="up"
          trendValue="+8%"
        />
        <StatCard
          title="Stock Bajo"
          value={stats?.lowStockProducts || 0}
          icon="⚠️"
          color="red"
          trend="down"
          trendValue="-2%"
        />
      </div>

      <div className={styles.chartSection}>
        <h2 className={styles.sectionTitle}>Movimientos por Día</h2>
        {chartData && (
          <Chart 
            type="line" 
            data={chartData} 
            height={300}
          />
        )}
      </div>

      <div className={styles.bottomSection}>
        <div className={styles.activitySection}>
          <h2 className={styles.sectionTitle}>Actividad Reciente</h2>
          <RecentActivity activities={recentMovements} />
        </div>
        <div className={styles.actionsSection}>
          <h2 className={styles.sectionTitle}>Acciones Rápidas</h2>
          <QuickActions />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;