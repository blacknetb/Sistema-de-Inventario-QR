import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import '../assets/styles/pages/pages.css';

const ReportsPage = () => {
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState('month');
  const [reportData, setReportData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [lowStockData, setLowStockData] = useState([]);

  useEffect(() => {
    // Datos de ejemplo para ventas
    const salesData = [
      { month: 'Ene', ventas: 2400, ingresos: 4800 },
      { month: 'Feb', ventas: 1398, ingresos: 4200 },
      { month: 'Mar', ventas: 9800, ingresos: 15600 },
      { month: 'Abr', ventas: 3908, ingresos: 8200 },
      { month: 'May', ventas: 4800, ingresos: 9600 },
      { month: 'Jun', ventas: 3800, ingresos: 7600 },
    ];

    // Datos de ejemplo para categorías
    const categoryData = [
      { name: 'Electrónica', value: 35, color: '#0088FE' },
      { name: 'Accesorios', value: 25, color: '#00C49F' },
      { name: 'Oficina', value: 20, color: '#FFBB28' },
      { name: 'Almacenamiento', value: 15, color: '#FF8042' },
      { name: 'Redes', value: 5, color: '#8884D8' },
    ];

    // Datos de ejemplo para bajo stock
    const lowStockData = [
      { name: 'Monitor 24"', stock: 8, min: 10, diferencia: -2 },
      { name: 'Router Wi-Fi 6', stock: 3, min: 5, diferencia: -2 },
      { name: 'Impresora HP', stock: 5, min: 8, diferencia: -3 },
      { name: 'Tablet Samsung', stock: 7, min: 10, diferencia: -3 },
      { name: 'Disco Duro 2TB', stock: 4, min: 6, diferencia: -2 },
    ];

    setReportData(salesData);
    setCategoryData(categoryData);
    setLowStockData(lowStockData);
  }, []);

  const handleReportTypeChange = (type) => {
    setReportType(type);
    // Aquí normalmente cargarías datos diferentes según el tipo de reporte
  };

  const handleExport = (format) => {
    alert(`Exportando reporte en formato ${format.toUpperCase()}`);
    // Aquí iría la lógica para exportar el reporte
  };

  const getReportTitle = () => {
    switch(reportType) {
      case 'sales': return 'Reporte de Ventas';
      case 'inventory': return 'Reporte de Inventario';
      case 'categories': return 'Distribución por Categoría';
      case 'lowstock': return 'Productos con Bajo Stock';
      default: return 'Reportes';
    }
  };

  const getReportDescription = () => {
    switch(reportType) {
      case 'sales': return 'Análisis de ventas e ingresos por período';
      case 'inventory': return 'Estado actual del inventario y valorización';
      case 'categories': return 'Distribución de productos por categoría';
      case 'lowstock': return 'Productos que necesitan reposición';
      default: return '';
    }
  };

  const renderReportContent = () => {
    switch(reportType) {
      case 'sales':
        return (
          <div className="page-card">
            <div className="chart-header" style={{ marginBottom: '30px' }}>
              <h3 className="chart-title">Ventas Mensuales</h3>
              <select 
                className="form-control" 
                style={{ width: 'auto' }}
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="week">Esta semana</option>
                <option value="month">Este mes</option>
                <option value="quarter">Este trimestre</option>
                <option value="year">Este año</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="ventas" fill="#3498db" name="Ventas (unidades)" />
                <Bar yAxisId="right" dataKey="ingresos" fill="#2ecc71" name="Ingresos ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'inventory':
        return (
          <div className="page-card">
            <div className="chart-header" style={{ marginBottom: '30px' }}>
              <h3 className="chart-title">Valor del Inventario</h3>
              <select className="form-control" style={{ width: 'auto' }}>
                <option>Última actualización</option>
                <option>Comparar con mes anterior</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ingresos" stroke="#8884d8" activeDot={{ r: 8 }} name="Valor del Inventario ($)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case 'categories':
        return (
          <div className="row">
            <div className="col">
              <div className="page-card">
                <h3 className="section-title">Distribución por Categoría</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="col">
              <div className="page-card">
                <h3 className="section-title">Detalles por Categoría</h3>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Categoría</th>
                        <th>Porcentaje</th>
                        <th>Cantidad</th>
                        <th>Valor Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryData.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '15px', height: '15px', backgroundColor: item.color }}></div>
                              {item.name}
                            </div>
                          </td>
                          <td>{item.value}%</td>
                          <td>{Math.floor(item.value * 4)} productos</td>
                          <td>${(item.value * 1000).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case 'lowstock':
        return (
          <div className="page-card">
            <h3 className="section-title">Productos con Bajo Stock</h3>
            <div className="alert alert-warning">
              <span>⚠️</span>
              <span>Estos productos necesitan reposición urgente</span>
            </div>
            
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Stock Actual</th>
                    <th>Stock Mínimo</th>
                    <th>Diferencia</th>
                    <th>Estado</th>
                    <th>Acción Sugerida</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockData.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td>{item.stock}</td>
                      <td>{item.min}</td>
                      <td>
                        <span style={{ color: item.diferencia < 0 ? '#e74c3c' : '#27ae60' }}>
                          {item.diferencia < 0 ? item.diferencia : `+${item.diferencia}`}
                        </span>
                      </td>
                      <td>
                        {item.stock <= 0 ? (
                          <span className="badge badge-danger">Agotado</span>
                        ) : item.stock < item.min ? (
                          <span className="badge badge-warning">Bajo Stock</span>
                        ) : (
                          <span className="badge badge-success">Normal</span>
                        )}
                      </td>
                      <td>
                        <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                          Ordenar Reposición
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{getReportTitle()}</h1>
          <p className="page-subtitle">{getReportDescription()}</p>
        </div>
        <div className="inventory-actions">
          <button className="btn btn-primary" onClick={() => handleExport('pdf')}>
            <span className="btn-icon">📄</span> Exportar PDF
          </button>
          <button className="btn btn-success" onClick={() => handleExport('excel')}>
            <span className="btn-icon">📊</span> Exportar Excel
          </button>
          <button className="btn btn-outline" onClick={() => window.print()}>
            <span className="btn-icon">🖨️</span> Imprimir
          </button>
        </div>
      </div>

      <div className="page-card">
        <div className="settings-nav">
          <button 
            className={`nav-item ${reportType === 'sales' ? 'active' : ''}`}
            onClick={() => handleReportTypeChange('sales')}
          >
            Ventas
          </button>
          <button 
            className={`nav-item ${reportType === 'inventory' ? 'active' : ''}`}
            onClick={() => handleReportTypeChange('inventory')}
          >
            Inventario
          </button>
          <button 
            className={`nav-item ${reportType === 'categories' ? 'active' : ''}`}
            onClick={() => handleReportTypeChange('categories')}
          >
            Categorías
          </button>
          <button 
            className={`nav-item ${reportType === 'lowstock' ? 'active' : ''}`}
            onClick={() => handleReportTypeChange('lowstock')}
          >
            Bajo Stock
          </button>
        </div>

        {renderReportContent()}
      </div>

      <div className="row">
        <div className="col">
          <div className="page-card">
            <h3 className="section-title">Resumen Ejecutivo</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '2rem', color: '#3498db', marginBottom: '5px' }}>$45,678</h3>
                <p style={{ color: '#7f8c8d' }}>Ingresos Totales</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '2rem', color: '#27ae60', marginBottom: '5px' }}>156</h3>
                <p style={{ color: '#7f8c8d' }}>Productos Totales</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '2rem', color: '#f39c12', marginBottom: '5px' }}>12</h3>
                <p style={{ color: '#7f8c8d' }}>Productos Bajo Stock</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '2rem', color: '#e74c3c', marginBottom: '5px' }}>5</h3>
                <p style={{ color: '#7f8c8d' }}>Productos Agotados</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;