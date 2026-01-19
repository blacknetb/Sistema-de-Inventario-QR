import { useCallback } from 'react';

/**
 * Hook para exportar datos del inventario en diferentes formatos
 * @returns {Object} Funciones de exportación
 */
const useInventoryExport = () => {
  // Exportar a JSON
  const exportToJSON = useCallback((data, filename = 'inventory_export.json') => {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return { success: true, filename };
    } catch (error) {
      console.error('Error exportando a JSON:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Exportar a CSV
  const exportToCSV = useCallback((data, filename = 'inventory_export.csv') => {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No hay datos para exportar');
      }

      // Obtener todos los campos únicos
      const allFields = new Set();
      data.forEach(item => {
        Object.keys(item).forEach(key => allFields.add(key));
      });

      const fields = Array.from(allFields);
      
      // Crear encabezados CSV
      const headers = fields.map(field => 
        `"${field.replace(/"/g, '""')}"`
      ).join(',');
      
      // Crear filas CSV
      const rows = data.map(item => {
        return fields.map(field => {
          const value = item[field] !== undefined ? item[field] : '';
          const stringValue = String(value);
          return `"${stringValue.replace(/"/g, '""')}"`;
        }).join(',');
      });
      
      const csvContent = [headers, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return { success: true, filename, rows: data.length };
    } catch (error) {
      console.error('Error exportando a CSV:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Exportar a Excel (usando formato HTML para Excel)
  const exportToExcel = useCallback((data, filename = 'inventory_export.xls') => {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No hay datos para exportar');
      }

      // Obtener todos los campos únicos
      const allFields = new Set();
      data.forEach(item => {
        Object.keys(item).forEach(key => allFields.add(key));
      });

      const fields = Array.from(allFields);
      
      // Crear tabla HTML para Excel
      let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" ';
      html += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
      html += 'xmlns="http://www.w3.org/TR/REC-html40">';
      html += '<head>';
      html += '<meta charset="UTF-8">';
      html += '<!--[if gte mso 9]>';
      html += '<xml>';
      html += '<x:ExcelWorkbook>';
      html += '<x:ExcelWorksheets>';
      html += '<x:ExcelWorksheet>';
      html += '<x:Name>Inventario</x:Name>';
      html += '<x:WorksheetOptions>';
      html += '<x:DisplayGridlines/>';
      html += '</x:WorksheetOptions>';
      html += '</x:ExcelWorksheet>';
      html += '</x:ExcelWorksheets>';
      html += '</x:ExcelWorkbook>';
      html += '</xml>';
      html += '<![endif]-->';
      html += '</head>';
      html += '<body>';
      html += '<table border="1">';
      
      // Encabezados
      html += '<tr>';
      fields.forEach(field => {
        html += `<th>${escapeHTML(field)}</th>`;
      });
      html += '</tr>';
      
      // Filas
      data.forEach(item => {
        html += '<tr>';
        fields.forEach(field => {
          const value = item[field] !== undefined ? item[field] : '';
          html += `<td>${escapeHTML(String(value))}</td>`;
        });
        html += '</tr>';
      });
      
      html += '</table>';
      html += '</body>';
      html += '</html>';
      
      const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return { success: true, filename, rows: data.length };
    } catch (error) {
      console.error('Error exportando a Excel:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Exportar a PDF (usando formato HTML básico)
  const exportToPDF = useCallback((data, options = {}, filename = 'inventory_export.pdf') => {
    return new Promise((resolve) => {
      try {
        const {
          title = 'Reporte de Inventario',
          includeSummary = true,
          includeDate = true
        } = options;

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('No hay datos para exportar');
        }

        // Obtener todos los campos únicos
        const allFields = new Set();
        data.forEach(item => {
          Object.keys(item).forEach(key => allFields.add(key));
        });

        const fields = Array.from(allFields);
        
        // Crear contenido HTML para PDF
        let html = '<!DOCTYPE html>';
        html += '<html lang="es">';
        html += '<head>';
        html += '<meta charset="UTF-8">';
        html += '<title>' + title + '</title>';
        html += '<style>';
        html += 'body { font-family: Arial, sans-serif; margin: 20px; }';
        html += 'h1 { color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; }';
        html += 'table { width: 100%; border-collapse: collapse; margin-top: 20px; }';
        html += 'th { background-color: #4CAF50; color: white; padding: 12px; text-align: left; }';
        html += 'td { padding: 10px; border-bottom: 1px solid #ddd; }';
        html += 'tr:hover { background-color: #f5f5f5; }';
        html += '.summary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }';
        html += '.footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }';
        html += '</style>';
        html += '</head>';
        html += '<body>';
        
        // Título
        html += `<h1>${title}</h1>`;
        
        if (includeDate) {
          html += `<p>Generado el: ${new Date().toLocaleDateString('es-ES')}</p>`;
        }
        
        if (includeSummary) {
          html += '<div class="summary">';
          html += `<p><strong>Total de items:</strong> ${data.length}</p>`;
          html += `<p><strong>Generado por:</strong> Sistema de Inventario</p>`;
          html += '</div>';
        }
        
        // Tabla
        html += '<table>';
        html += '<thead><tr>';
        fields.forEach(field => {
          html += `<th>${field}</th>`;
        });
        html += '</tr></thead>';
        html += '<tbody>';
        
        data.forEach(item => {
          html += '<tr>';
          fields.forEach(field => {
            const value = item[field] !== undefined ? item[field] : '';
            html += `<td>${value}</td>`;
          });
          html += '</tr>';
        });
        
        html += '</tbody>';
        html += '</table>';
        
        // Pie de página
        html += '<div class="footer">';
        html += '<p>Sistema de Inventario - Reporte generado automáticamente</p>';
        html += '</div>';
        
        html += '</body>';
        html += '</html>';
        
        // En una implementación real, aquí usarías una librería como jsPDF
        // Por ahora, creamos un blob HTML
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename.replace('.pdf', '.html'); // Cambiar extensión
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        resolve({ 
          success: true, 
          filename: filename.replace('.pdf', '.html'),
          rows: data.length,
          note: 'PDF exportado como HTML (en producción usar librería jsPDF)'
        });
      } catch (error) {
        console.error('Error exportando a PDF:', error);
        resolve({ success: false, error: error.message });
      }
    });
  }, []);

  // Exportar reporte de estadísticas
  const exportStatsReport = useCallback((stats, format = 'json') => {
    try {
      const exportData = {
        reportDate: new Date().toISOString(),
        summary: stats.basicStats || {},
        categories: stats.categoryStats || [],
        statuses: stats.statusStats || [],
        attentionItems: stats.attentionStats || {}
      };

      let filename = `inventory_stats_${new Date().toISOString().split('T')[0]}`;
      
      switch(format) {
        case 'json':
          filename += '.json';
          return exportToJSON(exportData, filename);
          
        case 'csv':
          // Convertir a array plano para CSV
          const csvData = [
            { ...exportData.summary, type: 'summary' },
            ...exportData.categories.map(cat => ({ ...cat, type: 'category' })),
            ...exportData.statuses.map(stat => ({ ...stat, type: 'status' }))
          ];
          filename += '.csv';
          return exportToCSV(csvData, filename);
          
        case 'excel':
          const excelData = [
            { ...exportData.summary, type: 'summary' },
            ...exportData.categories.map(cat => ({ ...cat, type: 'category' })),
            ...exportData.statuses.map(stat => ({ ...stat, type: 'status' }))
          ];
          filename += '.xls';
          return exportToExcel(excelData, filename);
          
        default:
          throw new Error(`Formato no soportado: ${format}`);
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [exportToJSON, exportToCSV, exportToExcel]);

  // Exportar selección específica de campos
  const exportSelectedFields = useCallback((data, fields, format = 'csv') => {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No hay datos para exportar');
      }

      if (!Array.isArray(fields) || fields.length === 0) {
        throw new Error('No se especificaron campos para exportar');
      }

      // Filtrar datos para incluir solo los campos seleccionados
      const filteredData = data.map(item => {
        const filteredItem = {};
        fields.forEach(field => {
          if (item.hasOwnProperty(field)) {
            filteredItem[field] = item[field];
          }
        });
        return filteredItem;
      });

      let filename = `inventory_selected_${new Date().toISOString().split('T')[0]}`;
      
      switch(format) {
        case 'json':
          filename += '.json';
          return exportToJSON(filteredData, filename);
          
        case 'csv':
          filename += '.csv';
          return exportToCSV(filteredData, filename);
          
        case 'excel':
          filename += '.xls';
          return exportToExcel(filteredData, filename);
          
        default:
          throw new Error(`Formato no soportado: ${format}`);
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [exportToJSON, exportToCSV, exportToExcel]);

  // Función auxiliar para escapar HTML
  const escapeHTML = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // Generar nombre de archivo con timestamp
  const generateFilename = (baseName, extension) => {
    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .split('.')[0];
    
    return `${baseName}_${timestamp}.${extension}`;
  };

  // Obtener formatos disponibles
  const getAvailableFormats = () => {
    return [
      { value: 'json', label: 'JSON', description: 'Formato estructurado' },
      { value: 'csv', label: 'CSV', description: 'Compatible con Excel' },
      { value: 'excel', label: 'Excel', description: 'Formato Microsoft Excel' },
      { value: 'pdf', label: 'PDF', description: 'Documento imprimible' }
    ];
  };

  return {
    // Funciones de exportación
    exportToJSON,
    exportToCSV,
    exportToExcel,
    exportToPDF,
    exportStatsReport,
    exportSelectedFields,
    
    // Utilidades
    generateFilename,
    getAvailableFormats,
    
    // Método de conveniencia para exportar todo
    exportAll: (data, options = {}) => {
      const { format = 'csv', ...exportOptions } = options;
      
      switch(format) {
        case 'json':
          return exportToJSON(data, exportOptions.filename);
        case 'csv':
          return exportToCSV(data, exportOptions.filename);
        case 'excel':
          return exportToExcel(data, exportOptions.filename);
        case 'pdf':
          return exportToPDF(data, exportOptions, exportOptions.filename);
        default:
          return exportToCSV(data, exportOptions.filename);
      }
    }
  };
};

export default useInventoryExport;