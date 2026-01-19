import { useCallback, useRef } from 'react';

/**
 * Hook para generar y imprimir reportes del inventario
 * @returns {Object} Funciones para imprimir reportes
 */
const usePrintReport = () => {
  const printFrameRef = useRef(null);

  // Crear iframe para impresión
  const createPrintFrame = useCallback(() => {
    if (typeof window === 'undefined') return null;

    if (!printFrameRef.current) {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.top = '-1000px';
      iframe.style.left = '-1000px';
      iframe.title = 'Print Frame';
      
      document.body.appendChild(iframe);
      printFrameRef.current = iframe;
    }

    return printFrameRef.current;
  }, []);

  // Limpiar iframe
  const cleanupPrintFrame = useCallback(() => {
    if (printFrameRef.current && printFrameRef.current.parentNode) {
      printFrameRef.current.parentNode.removeChild(printFrameRef.current);
      printFrameRef.current = null;
    }
  }, []);

  // Generar HTML para reporte de inventario
  const generateInventoryHTML = useCallback((data, options = {}) => {
    const {
      title = 'Reporte de Inventario',
      includeHeader = true,
      includeFooter = true,
      includeSummary = true,
      includeDetails = true,
      groupByCategory = false,
      filterLowStock = false,
      currency = '$'
    } = options;

    const now = new Date();
    const formattedDate = now.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = now.toLocaleTimeString('es-ES');

    let html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          @media print {
            @page {
              size: A4;
              margin: 1cm;
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              font-size: 12px;
              line-height: 1.4;
              color: #333;
              margin: 0;
              padding: 0;
            }
            
            .no-print {
              display: none !important;
            }
            
            .page-break {
              page-break-after: always;
            }
            
            table {
              page-break-inside: avoid;
            }
            
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 20px;
            background: white;
          }
          
          .container {
            max-width: 100%;
            margin: 0 auto;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 2px solid #4CAF50;
          }
          
          .header h1 {
            color: #2c3e50;
            margin: 0 0 10px 0;
            font-size: 24px;
          }
          
          .header .subtitle {
            color: #7f8c8d;
            font-size: 14px;
            margin: 0;
          }
          
          .summary {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 20px;
          }
          
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 15px;
          }
          
          .summary-item {
            text-align: center;
          }
          
          .summary-value {
            font-size: 20px;
            font-weight: bold;
            color: #2c3e50;
            margin: 5px 0;
          }
          
          .summary-label {
            font-size: 12px;
            color: #7f8c8d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .table-container {
            overflow-x: auto;
            margin-bottom: 30px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          th {
            background-color: #4CAF50;
            color: white;
            font-weight: 600;
            text-align: left;
            padding: 12px 8px;
            border: 1px solid #45a049;
          }
          
          td {
            padding: 10px 8px;
            border: 1px solid #ddd;
          }
          
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          
          tr:hover {
            background-color: #f5f5f5;
          }
          
          .status {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-align: center;
            display: inline-block;
            min-width: 80px;
          }
          
          .status-available {
            background-color: #d4edda;
            color: #155724;
          }
          
          .status-low {
            background-color: #fff3cd;
            color: #856404;
          }
          
          .status-out {
            background-color: #f8d7da;
            color: #721c24;
          }
          
          .category-header {
            background-color: #e9ecef;
            font-weight: bold;
            font-size: 14px;
            padding: 15px;
            margin: 20px 0 10px 0;
            border-left: 4px solid #4CAF50;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #7f8c8d;
            font-size: 11px;
          }
          
          .print-button {
            display: inline-block;
            background-color: #4CAF50;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            margin: 20px 0;
            text-decoration: none;
          }
          
          .print-button:hover {
            background-color: #45a049;
          }
          
          .warning-note {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 4px;
            padding: 10px;
            margin: 15px 0;
            color: #856404;
          }
        </style>
      </head>
      <body>
        <div class="container">
    `;

    // Encabezado
    if (includeHeader) {
      html += `
        <div class="header">
          <h1>${title}</h1>
          <p class="subtitle">Generado el ${formattedDate} a las ${formattedTime}</p>
        </div>
      `;
    }

    // Calcular estadísticas
    const totalItems = data.length;
    const totalQuantity = data.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = data.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const lowStockItems = data.filter(item => item.status === 'Bajo Stock').length;
    const outOfStockItems = data.filter(item => item.status === 'Agotado').length;

    // Resumen
    if (includeSummary) {
      html += `
        <div class="summary">
          <h3>Resumen del Inventario</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-value">${totalItems}</div>
              <div class="summary-label">Total de Productos</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${totalQuantity}</div>
              <div class="summary-label">Cantidad Total</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${currency}${totalValue.toFixed(2)}</div>
              <div class="summary-label">Valor Total</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${lowStockItems}</div>
              <div class="summary-label">Bajo Stock</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${outOfStockItems}</div>
              <div class="summary-label">Agotados</div>
            </div>
          </div>
        </div>
      `;

      if (filterLowStock && (lowStockItems > 0 || outOfStockItems > 0)) {
        html += `
          <div class="warning-note">
            <strong>⚠ Atención:</strong> Hay ${lowStockItems} productos con stock bajo y 
            ${outOfStockItems} productos agotados que necesitan atención.
          </div>
        `;
      }
    }

    // Detalles
    if (includeDetails) {
      if (groupByCategory) {
        // Agrupar por categoría
        const categories = {};
        data.forEach(item => {
          const category = item.category || 'Sin Categoría';
          if (!categories[category]) {
            categories[category] = [];
          }
          categories[category].push(item);
        });

        Object.entries(categories).forEach(([category, items]) => {
          const categoryValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          const categoryQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
          
          html += `
            <div class="category-header">
              ${category} - ${items.length} productos, ${categoryQuantity} unidades, 
              Valor: ${currency}${categoryValue.toFixed(2)}
            </div>
          `;

          html += generateItemsTable(items, currency);
        });
      } else {
        // Todos los items en una tabla
        html += '<h3>Detalles del Inventario</h3>';
        html += generateItemsTable(data, currency);
      }
    }

    // Pie de página
    if (includeFooter) {
      html += `
        <div class="footer">
          <p>Sistema de Inventario - Reporte generado automáticamente</p>
          <p>Página 1 de 1</p>
        </div>
      `;
    }

    html += `
        </div>
        <div class="no-print" style="text-align: center; margin-top: 30px;">
          <button class="print-button" onclick="window.print()">Imprimir Reporte</button>
        </div>
      </body>
      </html>
    `;

    return html;
  }, []);

  // Generar tabla de items
  const generateItemsTable = useCallback((items, currency) => {
    let table = `
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Cantidad</th>
              <th>Precio Unitario</th>
              <th>Valor Total</th>
              <th>Estado</th>
              <th>SKU</th>
              <th>Ubicación</th>
            </tr>
          </thead>
          <tbody>
    `;

    items.forEach(item => {
      const totalValue = item.price * item.quantity;
      const statusClass = `status-${item.status.toLowerCase().replace(' ', '-')}`;
      
      table += `
        <tr>
          <td>${item.id}</td>
          <td>${item.name}</td>
          <td>${item.category || 'N/A'}</td>
          <td>${item.quantity}</td>
          <td>${currency}${item.price.toFixed(2)}</td>
          <td>${currency}${totalValue.toFixed(2)}</td>
          <td><span class="status ${statusClass}">${item.status}</span></td>
          <td>${item.sku || 'N/A'}</td>
          <td>${item.location || 'N/A'}</td>
        </tr>
      `;
    });

    table += `
          </tbody>
        </table>
      </div>
    `;

    return table;
  }, []);

  // Imprimir reporte
  const printReport = useCallback((data, options = {}) => {
    return new Promise((resolve, reject) => {
      try {
        const html = generateInventoryHTML(data, options);
        const iframe = createPrintFrame();
        
        if (!iframe) {
          reject(new Error('No se pudo crear el frame de impresión'));
          return;
        }

        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();

        // Esperar a que se cargue el contenido
        iframe.onload = () => {
          try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            resolve({ success: true });
          } catch (error) {
            reject(error);
          }
        };

        // Fallback si onload no se dispara
        setTimeout(() => {
          try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            resolve({ success: true });
          } catch (error) {
            reject(error);
          }
        }, 1000);
      } catch (error) {
        reject(error);
      }
    });
  }, [generateInventoryHTML, createPrintFrame]);

  // Generar reporte de stock bajo
  const printLowStockReport = useCallback((data, threshold = 5) => {
    const lowStockItems = data.filter(item => 
      item.quantity <= threshold || item.status === 'Bajo Stock' || item.status === 'Agotado'
    );

    return printReport(lowStockItems, {
      title: 'Reporte de Stock Bajo y Agotado',
      filterLowStock: true,
      includeSummary: true,
      includeDetails: true
    });
  }, [printReport]);

  // Generar reporte por categoría
  const printCategoryReport = useCallback((data) => {
    return printReport(data, {
      title: 'Reporte de Inventario por Categoría',
      groupByCategory: true,
      includeSummary: true,
      includeDetails: true
    });
  }, [printReport]);

  // Generar reporte de valor
  const printValueReport = useCallback((data) => {
    const sortedData = [...data].sort((a, b) => 
      (b.price * b.quantity) - (a.price * a.quantity)
    );

    return printReport(sortedData.slice(0, 50), {
      title: 'Reporte de Productos Más Valiosos (Top 50)',
      includeSummary: true,
      includeDetails: true
    });
  }, [printReport]);

  // Generar reporte completo
  const printFullReport = useCallback((data) => {
    return printReport(data, {
      title: 'Reporte Completo de Inventario',
      includeHeader: true,
      includeFooter: true,
      includeSummary: true,
      includeDetails: true,
      groupByCategory: false
    });
  }, [printReport]);

  // Generar HTML para previsualización
  const generatePreviewHTML = useCallback((data, options = {}) => {
    return generateInventoryHTML(data, options);
  }, [generateInventoryHTML]);

  // Exportar reporte como HTML
  const exportAsHTML = useCallback((data, options = {}) => {
    const html = generateInventoryHTML(data, options);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte_inventario_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return { success: true };
  }, [generateInventoryHTML]);

  return {
    // Funciones principales
    printReport,
    printLowStockReport,
    printCategoryReport,
    printValueReport,
    printFullReport,
    
    // Utilidades
    generatePreviewHTML,
    exportAsHTML,
    cleanupPrintFrame,
    
    // Tipos de reporte disponibles
    reportTypes: [
      { id: 'full', name: 'Reporte Completo', description: 'Todos los items del inventario' },
      { id: 'low_stock', name: 'Stock Bajo', description: 'Items con stock bajo o agotado' },
      { id: 'category', name: 'Por Categoría', description: 'Agrupado por categoría' },
      { id: 'value', name: 'Productos Valiosos', description: 'Top 50 productos más valiosos' }
    ]
  };
};

export default usePrintReport;