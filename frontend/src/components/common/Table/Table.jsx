import React from 'react';
import styles from './Table.module.css';

const Table = ({
  columns,
  data,
  striped = false,
  bordered = false,
  hoverable = false,
  compact = false,
  onRowClick,
  className = ''
}) => {
  return (
    <div className={`${styles.tableContainer} ${className}`}>
      <table className={`${styles.table} ${striped ? styles.striped : ''} ${bordered ? styles.bordered : ''} ${hoverable ? styles.hoverable : ''} ${compact ? styles.compact : ''}`}>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={column.key || index}
                style={column.width ? { width: column.width } : {}}
                className={column.align ? styles[`align${column.align}`] : ''}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={row.id || rowIndex}
              onClick={() => onRowClick && onRowClick(row)}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {columns.map((column, colIndex) => (
                <td
                  key={`${rowIndex}-${colIndex}`}
                  className={column.align ? styles[`align${column.align}`] : ''}
                >
                  {column.render
                    ? column.render(row[column.key], row)
                    : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className={styles.empty}>
                No hay datos disponibles
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;