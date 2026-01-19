import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../assets/styles/pages/pages.css';

const PrintPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [printData, setPrintData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener datos de la URL o localStorage
    const searchParams = new URLSearchParams(location.search);
    const type = searchParams.get('type') || 'inventory';
    
    // Datos de ejemplo basados en el tipo
    const mockData = {
      type: type,
      title: type === 'inventory' ? 'Reporte de Inventario' : 
             type === 'sales' ? 'Reporte de Ventas' : 
             'Reporte del Sistema',
      date: new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      generatedBy: 'Administrador',
      items: type === 'inventory' ? [
        { id: 1, name: 'Laptop Dell XPS 13', category: 'Electrónica', quantity: 15, price: 1299.99, total: 19499.85 },
        { id: 2, name: 'Mouse Inalámbrico', category: 'Accesorios', quantity: 42, price: 29.99, total: 1259.58 },
        { id: 3, name: 'Monitor 24" Samsung', category: 'Electrónica', quantity: 8, price: 199.99, total: 1599.92 },
        { id: 4, name: 'Teclado Mecánico', category: 'Accesorios', quantity: 0, price: 89.99, total: 0 },
        { id: 5, name: 'Impresora HP LaserJet', category: 'Oficina', quantity: 5, price: 349.99, total: 1749.95 },
        { id: 6, name: 'Cargador USB-C', category: 'Electrónica', quantity: 27, price: 19.99, total: 539.73 },
        { id: 7, name: 'Disco Duro Externo 1TB', category: 'Almacenamiento', quantity: 12, price: 79.99, total: 959.88 },
        { id: 8, name: 'Router Wi-Fi 6', category: 'Redes', quantity: 3, price: 149.99, total: 449.97 },
      ] : [
        { date: '2024-03-01', product: 'Laptop Dell', quantity: 2, amount: 2599.98 },
        { date: '2024-03-02', product: 'Mouse Inalámbrico', quantity: 5, amount: 149.95 },
        { date: '2024-03-03', product: 'Monitor 24"', quantity: 1, amount: 199.99 },
        { date: '2024-03-04', product: 'Teclado Mecánico', quantity: 3, amount: 269.97 },
        { date: '2024-03-05', product: 'Impresora HP', quantity: 1, amount: 349.99 },
      ],
      summary: {
        totalItems: type === 'inventory' ? 112 : 12,
        totalValue: type === 'inventory' ? 26108.88 : 3569.88,
        averagePrice: type === 'inventory' ? 233.12 : 297.49
      }
    };

    setTimeout(() => {
      setPrintData(mockData);
      setLoading(false);
    }, 500);

    // Configurar impresión automática
    const timer = setTimeout(() => {
      window.print();
    }, 1000);

    return () => clearTimeout(timer);
  }, [location]);

  const handleClose = () => {
    navigate(-1);
  };

  const getTableHeaders = () => {
    if (printData?.type === 'inventory') {
      return ['ID', 'Producto', 'Categoría', 'Cantidad', 'Precio Unitario', 'Valor Total'];
    } else {
      return ['Fecha', 'Producto', 'Cantidad', 'Monto'];
    }
  };

  if (loading) {
    return (
      <div className="page-container loading-container">
        <div className="loading-spinner"></div>
        <p>Preparando documento para imprimir...</p>
      </div>
    );
  }

  return (
    <div className="print-container">
      {/* Botón de cerrar (no se imprime) */}
      <button 
        onClick={handleClose} 
        className="btn btn-secondary no-print"
        style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}
      >
        Cerrar
      </button>

      {/* Contenido principal */}
      <div className="print-header">
        <h1 className="print-title">{printData.title}</h1>
        <p className="print-subtitle">Generado el {printData.date}</p>
        <p style={{ color: '#7f8c8d' }}>Generado por: {printData.generatedBy}</p>
      </div>

      <div style={{ margin: '30px 0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              {getTableHeaders().map(header => (
                <th key={header} style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {printData.items.map((item, index) => (
              <tr key={index}>
                {printData.type === 'inventory' ? (
                  <>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>#{item.id}</td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>{item.name}</td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>{item.category}</td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>{item.quantity}</td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>${item.price.toFixed(2)}</td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>${item.total.toFixed(2)}</td>
                  </>
                ) : (
                  <>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>{item.date}</td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>{item.product}</td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>{item.quantity}</td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>${item.amount.toFixed(2)}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        margin: '40px 0',
        padding: '20px',
        border: '1px solid #ddd',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ color: '#3498db', marginBottom: '5px' }}>
            {printData.summary.totalItems}
          </h3>
          <p style={{ color: '#7f8c8d' }}>
            {printData.type === 'inventory' ? 'Total de Productos' : 'Total de Ventas'}
          </p>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ color: '#27ae60', marginBottom: '5px' }}>
            ${printData.summary.totalValue.toFixed(2)}
          </h3>
          <p style={{ color: '#7f8c8d' }}>
            {printData.type === 'inventory' ? 'Valor Total' : 'Ingresos Totales'}
          </p>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ color: '#f39c12', marginBottom: '5px' }}>
            ${printData.summary.averagePrice.toFixed(2)}
          </h3>
          <p style={{ color: '#7f8c8d' }}>
            {printData.type === 'inventory' ? 'Precio Promedio' : 'Venta Promedio'}
          </p>
        </div>
      </div>

      <div className="print-footer">
        <p>Documento generado por Sistema de Inventario Pro</p>
        <p style={{ fontSize: '0.9rem', color: '#95a5a6' }}>
          Página 1 de 1 • {window.location.origin}
        </p>
      </div>

      {/* Instrucciones de impresión (no se imprimen) */}
      <div className="no-print" style={{ 
        marginTop: '50px', 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Instrucciones de Impresión</h3>
        <ul style={{ color: '#7f8c8d', lineHeight: '1.8' }}>
          <li>Este documento se imprimirá automáticamente en unos segundos</li>
          <li>Para imprimir manualmente, presiona Ctrl+P (Windows) o Cmd+P (Mac)</li>
          <li>Revisa la vista previa antes de imprimir</li>
          <li>Selecciona la orientación "Horizontal" para mejores resultados</li>
          <li>Asegúrate de que tu impresora esté conectada y tenga papel</li>
        </ul>
      </div>
    </div>
  );
};

export default PrintPage;