import { utils } from './index';

const exportService = {
  // Exportar a CSV
  toCSV: (data, options = {}) => {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No hay datos para exportar');
      }
      
      const { 
        headers = true,
        delimiter = ',',
        filename = 'export.csv'
      } = options;
      
      // Obtener columnas del primer objeto
      const columns = Object.keys(data[0]);
      
      let csv = '';
      
      // Agregar encabezados si se solicita
      if (headers) {
        csv += columns.map(col => `"${col}"`).join(delimiter) + '\n';
      }
      
      // Agregar datos
      data.forEach(item => {
        const row = columns.map(col => {
          let value = item[col];
          
          // Manejar diferentes tipos de datos
          if (value === null || value === undefined) {
            value = '';
          } else if (typeof value === 'object') {
            value = JSON.stringify(value);
          } else if (typeof value === 'boolean') {
            value = value ? 'Sí' : 'No';
          }
          
          // Escapar comillas
          value = String(value).replace(/"/g, '""');
          
          return `"${value}"`;
        });
        
        csv += row.join(delimiter) + '\n';
      });
      
      // Crear y descargar archivo
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.href = url;
      link.download = filename;
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      return {
        success: true,
        filename,
        rowCount: data.length,
        message: 'Exportación a CSV completada'
      };
    } catch (error) {
      console.error('Error exportando a CSV:', error);
      throw error;
    }
  },

  // Exportar a Excel (XLSX) usando formato básico
  toExcel: (data, options = {}) => {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No hay datos para exportar');
      }
      
      const {
        sheetName = 'Inventario',
        filename = 'export.xlsx'
      } = options;
      
      // Crear contenido XML para Excel (formato básico)
      let xml = '<?xml version="1.0"?>\n';
      xml += '<?mso-application progid="Excel.Sheet"?>\n';
      xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
      xml += '  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
      xml += `  <Worksheet ss:Name="${sheetName}">\n`;
      xml += '    <Table>\n';
      
      // Encabezados
      const columns = Object.keys(data[0]);
      xml += '      <Row>\n';
      columns.forEach(col => {
        xml += `        <Cell><Data ss:Type="String">${col}</Data></Cell>\n`;
      });
      xml += '      </Row>\n';
      
      // Datos
      data.forEach(item => {
        xml += '      <Row>\n';
        columns.forEach(col => {
          let value = item[col];
          let type = 'String';
          
          if (typeof value === 'number') {
            type = 'Number';
            value = String(value);
          } else if (typeof value === 'boolean') {
            type = 'String';
            value = value ? 'Sí' : 'No';
          } else if (value === null || value === undefined) {
            value = '';
          } else {
            value = String(value);
          }
          
          xml += `        <Cell><Data ss:Type="${type}">${utils.escapeXML(value)}</Data></Cell>\n`;
        });
        xml += '      </Row>\n';
      });
      
      xml += '    </Table>\n';
      xml += '  </Worksheet>\n';
      xml += '</Workbook>';
      
      // Crear y descargar archivo
      const blob = new Blob([xml], { 
        type: 'application/vnd.ms-excel' 
      });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.href = url;
      link.download = filename;
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      return {
        success: true,
        filename,
        rowCount: data.length,
        message: 'Exportación a Excel completada'
      };
    } catch (error) {
      console.error('Error exportando a Excel:', error);
      throw error;
    }
  },

  // Exportar a JSON
  toJSON: (data, options = {}) => {
    try {
      const {
        filename = 'export.json',
        pretty = true
      } = options;
      
      const json = pretty 
        ? JSON.stringify(data, null, 2) 
        : JSON.stringify(data);
      
      const blob = new Blob([json], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.href = url;
      link.download = filename;
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      return {
        success: true,
        filename,
        message: 'Exportación a JSON completada'
      };
    } catch (error) {
      console.error('Error exportando a JSON:', error);
      throw error;
    }
  },

  // Exportar a PDF (básico usando HTML)
  toPDF: (data, options = {}) => {
    return new Promise((resolve, reject) => {
      try {
        const {
          title = 'Reporte de Inventario',
          filename = 'export.pdf',
          includeDate = true
        } = options;
        
        // Crear contenido HTML para el PDF
        let html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>${title}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
              .header { margin-bottom: 20px; }
              .date { color: #7f8c8d; font-size: 14px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background-color: #3498db; color: white; padding: 10px; text-align: left; }
              td { padding: 8px 10px; border-bottom: 1px solid #ddd; }
              tr:nth-child(even) { background-color: #f9f9f9; }
              .footer { margin-top: 30px; text-align: center; color: #7f8c8d; font-size: 12px; }
              .summary { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${title}</h1>
              ${includeDate ? `<div class="date">Generado: ${new Date().toLocaleString()}</div>` : ''}
              <div class="summary">
                <strong>Resumen:</strong> ${data.length} registros exportados
              </div>
            </div>
        `;
        
        if (Array.isArray(data) && data.length > 0) {
          const columns = Object.keys(data[0]);
          
          html += '<table>';
          html += '<thead><tr>';
          columns.forEach(col => {
            html += `<th>${col}</th>`;
          });
          html += '</tr></thead>';
          
          html += '<tbody>';
          data.forEach(item => {
            html += '<tr>';
            columns.forEach(col => {
              let value = item[col];
              
              if (value === null || value === undefined) {
                value = '';
              } else if (typeof value === 'object') {
                value = JSON.stringify(value);
              }
              
              html += `<td>${value}</td>`;
            });
            html += '</tr>';
          });
          html += '</tbody></table>';
        } else {
          html += '<p>No hay datos para mostrar</p>';
        }
        
        html += `
            <div class="footer">
              <p>Sistema de Inventario Básico - Exportado el ${new Date().toLocaleDateString()}</p>
            </div>
          </body>
          </html>
        `;
        
        // Crear ventana para imprimir (simulación de PDF)
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        
        // Esperar a que cargue el contenido
        printWindow.onload = () => {
          printWindow.print();
          printWindow.close();
          
          resolve({
            success: true,
            filename,
            rowCount: Array.isArray(data) ? data.length : 0,
            message: 'PDF generado para impresión'
          });
        };
        
      } catch (error) {
        reject(new Error(`Error generando PDF: ${error.message}`));
      }
    });
  },

  // Exportar inventario completo
  exportInventory: async (format = 'csv', filters = {}) => {
    try {
      // En una implementación real, aquí se obtendrían los datos del servicio
      const inventoryData = localStorageService.get('inventory_items') || [];
      
      let filteredData = [...inventoryData];
      
      // Aplicar filtros si existen
      if (filters.category) {
        filteredData = filteredData.filter(item => item.category === filters.category);
      }
      if (filters.status) {
        filteredData = filteredData.filter(item => item.status === filters.status);
      }
      if (filters.minPrice !== undefined) {
        filteredData = filteredData.filter(item => item.price >= filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        filteredData = filteredData.filter(item => item.price <= filters.maxPrice);
      }
      
      // Formatear datos para exportación
      const exportData = filteredData.map(item => ({
        ID: item.id,
        Nombre: item.name,
        Categoría: item.category,
        Cantidad: item.quantity,
        Precio: `$${item.price.toFixed(2)}`,
        Valor_Total: `$${(item.price * item.quantity).toFixed(2)}`,
        Estado: item.status,
        'Stock_Mínimo': item.minimumStock || 'N/A',
        SKU: item.sku || 'N/A',
        Descripción: item.description || 'N/A'
      }));
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      const filename = `inventario_${timestamp}.${format}`;
      
      switch (format.toLowerCase()) {
        case 'csv':
          return exportService.toCSV(exportData, { filename });
        case 'excel':
        case 'xlsx':
          return exportService.toExcel(exportData, { 
            filename: filename.replace('.xlsx', '.xml'),
            sheetName: 'Inventario' 
          });
        case 'json':
          return exportService.toJSON(inventoryData, { filename });
        case 'pdf':
          return exportService.toPDF(exportData, { 
            title: 'Reporte de Inventario Completo',
            filename 
          });
        default:
          throw new Error(`Formato no soportado: ${format}`);
      }
    } catch (error) {
      console.error('Error exportando inventario:', error);
      throw error;
    }
  }
};

export default exportService;