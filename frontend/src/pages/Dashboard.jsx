import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, RefreshCw,
  Package, Users, DollarSign, ShoppingCart,
  AlertTriangle, CheckCircle, Info
} from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import Chart from '../components/dashboard/Chart';
import RecentActivity from '../components/dashboard/RecentActivity';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { useFetch } from '../hooks/useFetch';
import { api } from '../services/api';

const ACTIVITY_TYPES = {
  SUCCESS: 'success',
  WARNING: 'warning',
  INFO: 'info',
  INVENTORY: 'inventory',
  ORDER: 'order'
};

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('month');

  const {
    data: dashboardData = null,
    loading,
    error,
    refresh: refreshDashboard
  } = useFetch(
    async (params) => {
      try {
        const response = await api.get('/api/dashboard', {
          params: {
            timeRange: params?.timeRange || 'month'
          }
        });
        return response.data?.data || response.data || {};
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        throw err;
      }
    },
    { timeRange },
    {
      initialData: null,
      retryCount: 2,
      retryDelay: 1000,
      onError: (error) => {
        console.error('Error cargando dashboard:', error);
      }
    }
  );

  const {
    data: activitiesData = [],
    loading: activitiesLoading,
    error: activitiesError,
    refresh: refreshActivities
  } = useFetch(
    async () => {
      try {
        const response = await api.get('/api/activities/recent');
        return response.data?.data || response.data || [];
      } catch (err) {
        console.error('Activities fetch error:', err);
        return [];
      }
    },
    {},
    {
      pollingInterval: 30000,
      initialData: [],
      onError: () => {
        console.warn('Error cargando actividades, continuando sin ellas');
      }
    }
  );

  const stats = useMemo(() => {
    if (!dashboardData) return [];

    const data = dashboardData;

    return [
      {
        id: 'total-sales',
        title: 'Ventas Totales',
        value: `$${(data.totalSales || 0).toLocaleString()}`,
        change: data.salesChange || 0,
        icon: 'sales',
        trend: (data.salesChange || 0) >= 0 ? 'up' : 'down',
        iconComponent: <DollarSign className="w-6 h-6" />
      },
      {
        id: 'total-inventory',
        title: 'Inventario Total',
        value: (data.totalInventory || 0).toLocaleString(),
        change: data.inventoryChange || 0,
        icon: 'inventory',
        trend: (data.inventoryChange || 0) >= 0 ? 'up' : 'down',
        iconComponent: <Package className="w-6 h-6" />
      },
      {
        id: 'active-orders',
        title: 'Pedidos Activos',
        value: (data.activeOrders || 0).toString(),
        change: data.ordersChange || 0,
        icon: 'orders',
        trend: (data.ordersChange || 0) >= 0 ? 'up' : 'down',
        iconComponent: <ShoppingCart className="w-6 h-6" />
      },
      {
        id: 'active-users',
        title: 'Usuarios Activos',
        value: (data.activeUsers || 0).toString(),
        change: data.usersChange || 0,
        icon: 'users',
        trend: (data.usersChange || 0) >= 0 ? 'up' : 'down',
        iconComponent: <Users className="w-6 h-6" />
      }
    ];
  }, [dashboardData]);

  const salesData = useMemo(() => {
    if (!dashboardData?.salesTrend || !Array.isArray(dashboardData.salesTrend)) {
      return Array.from({ length: 7 }, (_, i) => ({
        name: `Día ${i + 1}`,
        sales: Math.floor(Math.random() * 1000) + 500,
        orders: Math.floor(Math.random() * 100) + 20
      }));
    }

    return dashboardData.salesTrend.map(item => ({
      name: item.period || 'Sin periodo',
      sales: item.sales || 0,
      orders: item.orders || 0
    }));
  }, [dashboardData]);

  const inventoryData = useMemo(() => {
    if (!dashboardData?.inventoryDistribution || !Array.isArray(dashboardData.inventoryDistribution)) {
      return [
        { name: 'Producto A', inventory: 150, sold: 80 },
        { name: 'Producto B', inventory: 200, sold: 120 },
        { name: 'Producto C', inventory: 100, sold: 60 },
        { name: 'Producto D', inventory: 180, sold: 90 },
        { name: 'Producto E', inventory: 120, sold: 70 }
      ];
    }

    return dashboardData.inventoryDistribution.slice(0, 5).map(item => ({
      name: item.productName || 'Producto sin nombre',
      inventory: item.currentStock || 0,
      sold: item.totalSold || 0
    }));
  }, [dashboardData]);

  const formatTimeAgo = useCallback((timestamp) => {
    if (!timestamp) return 'Recientemente';

    try {
      const now = new Date();
      const date = new Date(timestamp);

      if (Number.isNaN(date.getTime())) return 'Fecha inválida';

      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Hace unos segundos';
      if (diffMins < 60) return `Hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
      if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
      if (diffDays < 7) return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;

      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: diffDays > 365 ? 'numeric' : undefined
      });
    } catch (error) {
      console.error('Error formateando tiempo:', error);
      return 'Recientemente';
    }
  }, []);

  const getActivityIcon = useCallback((type) => {
    switch (type) {
      case ACTIVITY_TYPES.SUCCESS:
        return <CheckCircle className="w-5 h-5" />;
      case ACTIVITY_TYPES.WARNING:
        return <AlertTriangle className="w-5 h-5" />;
      case ACTIVITY_TYPES.INVENTORY:
        return <Package className="w-5 h-5" />;
      case ACTIVITY_TYPES.ORDER:
        return <ShoppingCart className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  }, []);

  const activities = useMemo(() => {
    if (!Array.isArray(activitiesData)) return [];

    return activitiesData.map(activity => ({
      id: activity.id || `activity-${Math.random()}`,
      type: activity.type || ACTIVITY_TYPES.INFO,
      message: activity.message || 'Actividad sin descripción',
      time: formatTimeAgo(activity.timestamp || activity.createdAt),
      icon: getActivityIcon(activity.type),
      user: activity.userName || 'Usuario desconocido'
    })).slice(0, 10);
  }, [activitiesData, formatTimeAgo, getActivityIcon]);

  const handleRefresh = useCallback(async () => {
    try {
      await Promise.all([
        refreshDashboard(),
        refreshActivities()
      ]);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    }
  }, [refreshDashboard, refreshActivities]);

  const handleTimeRangeChange = useCallback(async (newTimeRange) => {
    setTimeRange(newTimeRange);
    try {
      await refreshDashboard({ timeRange: newTimeRange });
    } catch (error) {
      console.error('Error changing time range:', error);
    }
  }, [refreshDashboard]);

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Resumen general del sistema de inventario</p>
          </div>
        </div>
        <ErrorMessage
          title="Error al cargar el dashboard"
          message={error.message || 'No se pudieron cargar los datos'}
          onRetry={handleRefresh}
        />
      </div>
    );
  }

  if (loading && !dashboardData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Resumen general del sistema de inventario</p>
          </div>
        </div>
        <LoadingSpinner message="Cargando dashboard..." />
      </div>
    );
  }

  const systemInfo = dashboardData?.systemInfo || {
    apiVersion: '1.0.0',
    responseTime: 0,
    dbStatus: 'unknown'
  };

  const lastUpdated = dashboardData?.lastUpdated ? new Date(dashboardData.lastUpdated) : new Date();

  const dbStatus = systemInfo.dbStatus;

  let statusColorClass;
  let statusTextClass;
  let statusLabel;

  if (dbStatus === "connected") {
    statusColorClass = "bg-green-500";
    statusTextClass = "text-green-600";
    statusLabel = "Conectado";
  } else if (dbStatus === "disconnected") {
    statusColorClass = "bg-red-500";
    statusTextClass = "text-red-600";
    statusLabel = "Desconectado";
  } else {
    statusColorClass = "bg-yellow-500";
    statusTextClass = "text-yellow-600";
    statusLabel = "Desconocido";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Resumen general del sistema de inventario</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={timeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-colors"
            disabled={loading}
          >
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
            <option value="quarter">Este trimestre</option>
            <option value="year">Este año</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Actualizando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </>
            )}
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat) => (
          <StatCard
            key={stat.id}
            {...stat}
            loading={loading}
          />
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Chart
            type="line"
            data={salesData}
            title="Tendencias de Ventas"
            loading={loading}
            timeRange={timeRange}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <RecentActivity
            activities={activities}
            loading={activitiesLoading}
            error={activitiesError}
            onRefresh={refreshActivities}
          />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Chart
          type="bar"
          data={inventoryData}
          title="Distribución de Inventario"
          loading={loading}
          showLegend={true}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
            Información del Sistema
          </h3>
          <span className="text-sm text-gray-500">
            Última actualización: {lastUpdated.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Versión API</div>
            <div className="text-lg font-semibold text-gray-900">
              {systemInfo.apiVersion}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Tiempo respuesta</div>
            <div className="text-lg font-semibold text-gray-900">
              {systemInfo.responseTime}ms
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Estado DB</div>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${statusColorClass}`}></div>
              <span className={`font-semibold ${statusTextClass}`}>
                {statusLabel}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

Dashboard.displayName = 'Dashboard';

export { Dashboard };
export default Dashboard;