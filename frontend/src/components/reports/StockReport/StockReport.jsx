import React, { useState, useEffect } from 'react';
import Chart from '../Chart';
import ReportFilters from '../ReportFilters';
import styles from './StockReport.module.css';

const StockReport = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: 'month',
    category: 'all',
    supplier: 'all',
    stockLevel: 'all'
  });

  useEffect(() => {
    fetchStockData();
  }, [filters]);

  const fetchStockData = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Datos de ejemplo
      const mockData = {
        summary: {
          totalProducts: 1250,
          totalValue: 875000,
          lowStock: 23,
          outOfStock: 12,
          categories: 15,
          suppliers: 28
        },
        stockByCategory: [
          { category: 'Electrónicos', quantity: 450, value: 450000 },
          { category: 'Ropa', quantity: 380, value: 114000 },
          { category: 'Hogar', quantity: 220, value: 176000 },
          { category: 'Deportes', quantity: 120, value: 84000 },
          { category: 'Libros', quantity: 80, value: 51000 }
        ],
        stockBySupplier: [
          { supplier: 'Distribuidora ABC', products: 450, value: 315000 },
          { supplier: 'Proveedores XYZ', products: 320, value: 256000 },
          { supplier: 'Importaciones Global', products: 280, value: 196000 },
          { supplier: 'Mayorista Central', products: 200, value: 108000 }
        ],
        stockLevels: {
          optimal: 850,
          low: 230,
          critical: 120,
          outOfStock: 50
        },
        movements: [
          { date: '2024-01', entries: 450, exits: 380 },
          { date: '2024-02', entries: 520, exits: 490 },
          { date: '2024-03', entries: 610, exits: 580 },
          { date: '2024-04', entries: 580, exits: 620 },
          { date: '2024-05', entries: 720, exits: 680 }
        ],
        topProducts: [
          { name: 'Smartphone X', stock: 45, value: 225000 },
          { name: 'Laptop Pro', stock: 28, value: 420000 },
          { name: 'Camiseta Deportiva', stock: 120, value: 36000 },
          { name: 'Sofá 3 plazas', stock: 15, value: 112500 },
          { name: 'Set de pesas', stock: 35, value: 52500 }
        ]
      };
      
      setData(mockData);
      setError(null);
    } catch (err) {
      setError('Error al cargar datos del reporte');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleExport = (format) => {
    console.log(`Exportando reporte en formato ${format}...`);
    // Lógica de exportación
  };

  if (loading && !data) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Cargando reporte de inventario...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <span className={styles.errorIcon}>⚠️</span>
        <p>{error}</p>
        <button onClick={fetchStockData} className={styles.retryButton}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={styles.stockReportContainer}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>Reporte de Inventario</h1>
          <p className={styles.lastUpdate}>
            Última actualización: {new Date().toLocaleString()}
          </p>
        </div>
        
        <div className={styles.headerActions}>
          <button 
            className={styles.exportButton}
            onClick={() => handleExport('pdf')}
          >
            📄 Exportar PDF
          </button>
          <button 
            className={styles.exportButton}
            onClick={() => handleExport('excel')}
          >
            📊 Exportar Excel
          </button>
        </div>
      </div>

      <ReportFilters 
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Tarjetas de resumen */}
      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <div className={styles.cardIcon}>📦</div>
          <div className={styles.cardInfo}>
            <span className={styles.cardValue}>{data.summary.totalProducts}</span>
            <span className={styles.cardLabel}>Total Productos</span>
          </div>
        </div>
        
        <div className={styles.summaryCard}>
          <div className={styles.cardIcon}>💰</div>
          <div className={styles.cardInfo}>
            <span className={styles.cardValue}>
              ${data.summary.totalValue.toLocaleString()}
            </span>
            <span className={styles.cardLabel}>Valor Total</span>
          </div>
        </div>
        
        <div className={`${styles.summaryCard} ${styles.warning}`}>
          <div className={styles.cardIcon}>⚠️</div>
          <div className={styles.cardInfo}>
            <span className={styles.cardValue}>{data.summary.lowStock}</span>
            <span className={styles.cardLabel}>Stock Bajo</span>
          </div>
        </div>
        
        <div className={`${styles.summaryCard} ${styles.danger}`}>
          <div className={styles.cardIcon}>❌</div>
          <div className={styles.cardInfo}>
            <span className={styles.cardValue}>{data.summary.outOfStock}</span>
            <span className={styles.cardLabel}>Sin Stock</span>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3>Stock por Categoría</h3>
          <div className={styles.chartContainer}>
            <Chart 
              type="bar"
              data={{
                labels: data.stockByCategory.map(item => item.category),
                datasets: [{
                  label: 'Cantidad',
                  data: data.stockByCategory.map(item => item.quantity),
                  backgroundColor: '#667eea'
                }]
              }}
            />
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3>Movimientos de Stock</h3>
          <div className={styles.chartContainer}>
            <Chart 
              type="line"
              data={{
                labels: data.movements.map(item => item.date),
                datasets: [
                  {
                    label: 'Entradas',
                    data: data.movements.map(item => item.entries),
                    borderColor: '#2ecc71',
                    backgroundColor: 'transparent'
                  },
                  {
                    label: 'Salidas',
                    data: data.movements.map(item => item.exits),
                    borderColor: '#e74c3c',
                    backgroundColor: 'transparent'
                  }
                ]
              }}
            />
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3>Distribución de Stock</h3>
          <div className={styles.chartContainer}>
            <Chart 
              type="pie"
              data={{
                labels: ['Óptimo', 'Bajo', 'Crítico', 'Sin Stock'],
                datasets: [{
                  data: [
                    data.stockLevels.optimal,
                    data.stockLevels.low,
                    data.stockLevels.critical,
                    data.stockLevels.outOfStock
                  ],
                  backgroundColor: ['#2ecc71', '#f1c40f', '#e67e22', '#e74c3c']
                }]
              }}
            />
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3>Stock por Proveedor</h3>
          <div className={styles.chartContainer}>
            <Chart 
              type="doughnut"
              data={{
                labels: data.stockBySupplier.map(item => item.supplier),
                datasets: [{
                  data: data.stockBySupplier.map(item => item.products),
                  backgroundColor: [
                    '#667eea', '#764ba2', '#f39c12', '#e74c3c', '#2ecc71'
                  ]
                }]
              }}
            />
          </div>
        </div>
      </div>

      {/* Tabla de productos top */}
      <div className={styles.tableSection}>
        <h3>Productos con Mayor Stock</h3>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Valor</th>
                <th>% del Total</th>
              </tr>
            </thead>
            <tbody>
              {data.topProducts.map((product, index) => (
                <tr key={index}>
                  <td>{product.name}</td>
                  <td>{product.stock}</td>
                  <td>${product.value.toLocaleString()}</td>
                  <td>
                    {((product.value / data.summary.totalValue) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Métricas adicionales */}
      <div className={styles.metricsSection}>
        <div className={styles.metricCard}>
          <h4>Rotación de Inventario</h4>
          <div className={styles.metricValue}>4.5</div>
          <div className={styles.metricTrend}>↑ 12% vs mes anterior</div>
        </div>

        <div className={styles.metricCard}>
          <h4>Días de Inventario</h4>
          <div className={styles.metricValue}>45</div>
          <div className={styles.metricTrend}>↓ 3 días</div>
        </div>

        <div className={styles.metricCard}>
          <h4>Costo Promedio</h4>
          <div className={styles.metricValue}>$700</div>
          <div className={styles.metricTrend}>por unidad</div>
        </div>
      </div>
    </div>
  );
};

export default StockReport;