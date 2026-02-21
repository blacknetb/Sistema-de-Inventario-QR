import React, { useState, useEffect } from 'react';
import Chart from '../Chart';
import ReportFilters from '../ReportFilters';
import styles from './MovementsReport.module.css';

const MovementsReport = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: 'month',
    type: 'all'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchMovementsData();
  }, [filters]);

  const fetchMovementsData = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockData = {
        summary: {
          totalEntries: 2840,
          totalExits: 2750,
          netChange: 90,
          avgDailyEntries: 94.7,
          avgDailyExits: 91.7,
          topMovementDay: '2024-03-15'
        },
        dailyMovements: [
          { date: '2024-03-01', entries: 85, exits: 72 },
          { date: '2024-03-02', entries: 92, exits: 88 },
          { date: '2024-03-03', entries: 78, exits: 65 },
          { date: '2024-03-04', entries: 95, exits: 91 },
          { date: '2024-03-05', entries: 112, exits: 105 },
          { date: '2024-03-06', entries: 98, exits: 94 },
          { date: '2024-03-07', entries: 105, exits: 102 }
        ],
        byCategory: [
          { category: 'Electrónicos', entries: 850, exits: 820 },
          { category: 'Ropa', entries: 720, exits: 710 },
          { category: 'Hogar', entries: 580, exits: 550 },
          { category: 'Deportes', entries: 420, exits: 400 },
          { category: 'Libros', entries: 270, exits: 270 }
        ],
        recentMovements: [
          { id: 1, date: '2024-03-07 10:30', product: 'Smartphone X', type: 'entry', quantity: 15, user: 'Admin' },
          { id: 2, date: '2024-03-07 09:45', product: 'Laptop Pro', type: 'exit', quantity: 3, user: 'Ventas' },
          { id: 3, date: '2024-03-07 08:20', product: 'Camiseta Deportiva', type: 'entry', quantity: 50, user: 'Admin' },
          { id: 4, date: '2024-03-06 16:30', product: 'Sofá 3 plazas', type: 'exit', quantity: 2, user: 'Ventas' },
          { id: 5, date: '2024-03-06 14:15', product: 'Set de pesas', type: 'entry', quantity: 10, user: 'Admin' },
          { id: 6, date: '2024-03-06 11:00', product: 'Smartphone X', type: 'exit', quantity: 5, user: 'Ventas' },
          { id: 7, date: '2024-03-06 09:30', product: 'Laptop Pro', type: 'entry', quantity: 8, user: 'Admin' }
        ]
      };
      
      setData(mockData);
      setError(null);
    } catch (err) {
      setError('Error al cargar movimientos');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const getFilteredMovements = () => {
    if (!data) return [];
    
    let filtered = [...data.recentMovements];
    
    if (filters.type !== 'all') {
      filtered = filtered.filter(m => m.type === filters.type);
    }
    
    return filtered;
  };

  const paginatedMovements = getFilteredMovements().slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(getFilteredMovements().length / itemsPerPage);

  if (loading && !data) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Cargando reporte de movimientos...</p>
      </div>
    );
  }

  return (
    <div className={styles.movementsReportContainer}>
      <div className={styles.header}>
        <h1>Reporte de Movimientos</h1>
        <div className={styles.headerActions}>
          <button className={styles.exportButton}>📥 Exportar</button>
        </div>
      </div>

      <ReportFilters 
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <div className={styles.cardIcon}>📥</div>
          <div className={styles.cardInfo}>
            <span className={styles.cardValue}>{data.summary.totalEntries}</span>
            <span className={styles.cardLabel}>Total Entradas</span>
          </div>
          <div className={styles.cardTrend}>↑ 12%</div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardIcon}>📤</div>
          <div className={styles.cardInfo}>
            <span className={styles.cardValue}>{data.summary.totalExits}</span>
            <span className={styles.cardLabel}>Total Salidas</span>
          </div>
          <div className={styles.cardTrend}>↓ 5%</div>
        </div>

        <div className={`${styles.summaryCard} ${data.summary.netChange >= 0 ? styles.positive : styles.negative}`}>
          <div className={styles.cardIcon}>📊</div>
          <div className={styles.cardInfo}>
            <span className={styles.cardValue}>{data.summary.netChange}</span>
            <span className={styles.cardLabel}>Balance Neto</span>
          </div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3>Movimientos Diarios</h3>
          <div className={styles.chartContainer}>
            <Chart 
              type="line"
              data={{
                labels: data.dailyMovements.map(m => m.date.slice(5)),
                datasets: [
                  {
                    label: 'Entradas',
                    data: data.dailyMovements.map(m => m.entries),
                    borderColor: '#2ecc71',
                    backgroundColor: 'transparent'
                  },
                  {
                    label: 'Salidas',
                    data: data.dailyMovements.map(m => m.exits),
                    borderColor: '#e74c3c',
                    backgroundColor: 'transparent'
                  }
                ]
              }}
            />
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3>Movimientos por Categoría</h3>
          <div className={styles.chartContainer}>
            <Chart 
              type="bar"
              data={{
                labels: data.byCategory.map(c => c.category),
                datasets: [
                  {
                    label: 'Entradas',
                    data: data.byCategory.map(c => c.entries),
                    backgroundColor: '#2ecc71'
                  },
                  {
                    label: 'Salidas',
                    data: data.byCategory.map(c => c.exits),
                    backgroundColor: '#e74c3c'
                  }
                ]
              }}
            />
          </div>
        </div>
      </div>

      <div className={styles.tableSection}>
        <h3>Movimientos Recientes</h3>
        
        <div className={styles.tableFilters}>
          <select 
            className={styles.typeFilter}
            value={filters.type}
            onChange={(e) => handleFilterChange({ type: e.target.value })}
          >
            <option value="all">Todos los tipos</option>
            <option value="entry">Solo entradas</option>
            <option value="exit">Solo salidas</option>
          </select>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMovements.map(movement => (
                <tr key={movement.id}>
                  <td>{movement.date}</td>
                  <td>{movement.product}</td>
                  <td>
                    <span className={`${styles.typeBadge} ${styles[movement.type]}`}>
                      {movement.type === 'entry' ? 'Entrada' : 'Salida'}
                    </span>
                  </td>
                  <td className={movement.type === 'entry' ? styles.entry : styles.exit}>
                    {movement.quantity}
                  </td>
                  <td>{movement.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageButton}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ←
            </button>
            
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                className={`${styles.pageButton} ${currentPage === i + 1 ? styles.active : ''}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            
            <button
              className={styles.pageButton}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              →
            </button>
          </div>
        )}
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h4>Promedio diario entradas</h4>
          <div className={styles.statValue}>{data.summary.avgDailyEntries}</div>
        </div>
        
        <div className={styles.statCard}>
          <h4>Promedio diario salidas</h4>
          <div className={styles.statValue}>{data.summary.avgDailyExits}</div>
        </div>
        
        <div className={styles.statCard}>
          <h4>Día con más movimiento</h4>
          <div className={styles.statValue}>{data.summary.topMovementDay}</div>
        </div>
      </div>
    </div>
  );
};

export default MovementsReport;