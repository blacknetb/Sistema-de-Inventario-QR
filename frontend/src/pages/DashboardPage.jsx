import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import '../assets/styles/pages/pages.css';

const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStock: 0,
    outOfStock: 0
  });

  const [chartData, setChartData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  useEffect(() => {
    // Datos de ejemplo
    const mockStats = {
      totalItems: 156,
      totalValue: 45678.90,
      lowStock: 12,
      outOfStock: 5
    };

    const mockChartData = [
      { month: 'Ene', ingresos: 4000, ventas: 2400 },
      { month: 'Feb', ingresos: 3000, ventas: 1398 },
      { month: 'Mar', ingresos: 2000, ventas: 9800 },
      { month: 'Abr', ingresos: 2780, ventas: 3908 },
      { month: 'May', ingresos: 1890, ventas: 4800 },
      { month: 'Jun', ingresos: 2390, ventas: 3800 },
    ];

    const mockCategoryData = [
      { name: 'Electrónica', value: 35 },
      { name: 'Accesorios', value: 25 },
      { name: 'Oficina', value: 20 },
      { name: 'Almacenamiento', value: 15 },
      { name: 'Redes', value: 5 },
    ];

    setStats(mockStats);
    setChartData(mockChartData);
    setCategoryData(mockCategoryData);
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Resumen general del inventario</p>
        </div>
        <div className="inventory-actions">
          <Link to="/inventory/add" className="btn btn-primary">
            <span className="btn-icon">+</span> Agregar Producto
          </Link>
          <Link to="/reports" className="btn btn-outline">
            <span className="btn-icon">📊</span> Ver Reportes
          </Link>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#3498db', background: '#e8f4fc' }}>
            📦
          </div>
          <div className="stat-content">
            <h3>{stats.totalItems}</h3>
            <p>Productos Totales</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#27ae60', background: '#d5f4e6' }}>
            💰
          </div>
          <div className="stat-content">
            <h3>${stats.totalValue.toLocaleString()}</h3>
            <p>Valor Total</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#f39c12', background: '#fef5e7' }}>
            ⚠️
          </div>
          <div className="stat-content">
            <h3>{stats.lowStock}</h3>
            <p>Bajo Stock</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#e74c3c', background: '#fdeaea' }}>
            ❌
          </div>
          <div className="stat-content">
            <h3>{stats.outOfStock}</h3>
            <p>Agotados</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Ventas Mensuales</h3>
            <select className="form-control" style={{ width: 'auto' }}>
              <option>Últimos 6 meses</option>
              <option>Este año</option>
              <option>Año pasado</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="ingresos" fill="#3498db" name="Ingresos ($)" />
              <Bar dataKey="ventas" fill="#2ecc71" name="Ventas (unidades)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="recent-container">
          <div className="recent-header">
            <h3 className="recent-title">Distribución por Categoría</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="page-card">
        <h3 className="section-title">Actividad Reciente</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Acción</th>
                <th>Usuario</th>
                <th>Fecha</th>
                <th>Detalles</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Laptop Dell XPS 13</td>
                <td><span className="badge badge-success">Agregado</span></td>
                <td>admin</td>
                <td>2024-03-15 14:30</td>
                <td>15 unidades</td>
              </tr>
              <tr>
                <td>Mouse Inalámbrico</td>
                <td><span className="badge badge-warning">Actualizado</span></td>
                <td>juan.perez</td>
                <td>2024-03-15 10:15</td>
                <td>Stock actualizado a 42</td>
              </tr>
              <tr>
                <td>Teclado Mecánico</td>
                <td><span className="badge badge-danger">Agotado</span></td>
                <td>Sistema</td>
                <td>2024-03-14 16:45</td>
                <td>Stock llegó a 0</td>
              </tr>
              <tr>
                <td>Monitor 24" Samsung</td>
                <td><span className="badge badge-info">Movimiento</span></td>
                <td>maria.garcia</td>
                <td>2024-03-14 09:20</td>
                <td>Transferido a sucursal B</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;