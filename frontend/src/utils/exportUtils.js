import { EXPORT_FORMATS } from './constants';
import { formatCurrency, formatDate, formatFilename } from './formatters';

/**
 * Utilidades para exportar datos del inventario
 */
class ExportUtils {
  /**
   * Exporta datos a formato CSV
   * @param {Array} data - Datos a exportar
   * @param {Object} options - Opciones de exportación
   * @returns {Blob} Archivo CSV
   */
  static toCSV(data, options = {}) {
    if (!data || data.length === 0) {
      return new Blob([''], { type: 'text/csv' });
    }
    
    const {
      fields = Object.keys(data[0]),
      fieldLabels = fields,
      delimiter = ',',
      includeHeader = true
    } = options;
    
    const csvRows = [];
    
    // Encabezados
    if (includeHeader) {
      csvRows.push(fieldLabels.join(delimiter));
    }
    
    // Datos
    data.forEach(item => {
      const row = fields.map(field => {
        let value = item[field];
        
        // Formatear valores especiales
        if (typeof value === 'number') {
          if (field.includes('price') || field.includes('cost') || field.includes('value')) {
            value = formatCurrency(value, { minimumFractionDigits: 2 });
          } else {
            value = value.toString();
          }
        } else if (value instanceof Date) {
          value = formatDate(value, 'short');
        } else if (value === null || value === undefined) {
          value = '';
        }
        
        // Escapar comillas y delimitadores
        if (typeof value === 'string' && (value.includes(delimiter) || value.includes('"'))) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        
        return value;
      });
      
      csvRows.push(row.join(delimiter));
    });
    
    const csvContent = csvRows.join('\n');
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }
  
  /**
   * Exporta datos a formato JSON
   * @param {Array} data - Datos a exportar
   * @param {Object} options - Opciones de exportación
   * @returns {Blob} Archivo JSON
   */
  static toJSON(data, options = {}) {
    const {
      pretty = true,
      includeMetadata = true
    } = options;
    
    const exportData = {
      ...(includeMetadata && {
        metadata: {
          exportedAt: new Date().toISOString(),
          totalItems: data.length,
          format: 'JSON',
          version: '1.0'
        }
      }),
      data: data
    };
    
    const jsonContent = pretty 
      ? JSON.stringify(exportData, null, 2)
      : JSON.stringify(exportData);
    
    return new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  }
  
  /**
   * Exporta datos a formato Excel (simulado como CSV con extensión .xlsx)
   * @param {Array} data - Datos a exportar
   * @param {Object} options - Opciones de exportación
   * @returns {Blob} Archivo "Excel" (CSV con cabecera MIME diferente)
   */
  static toExcel(data, options = {}) {
    // Usamos CSV pero con cabecera Excel para simular
    const csvBlob = this.toCSV(data, options);
    
    // Cambiar tipo MIME para Excel
    return new Blob([csvBlob], { type: 'application/vnd.ms-excel;charset=utf-8' });
  }
  
  /**
   * Exporta datos a formato PDF (simulado - en realidad devuelve HTML)
   * @param {Array} data - Datos a exportar
   * @param {Object} options - Opciones de exportación
   * @returns {Blob} Archivo HTML que simula PDF
   */
  static toPDF(data, options = {}) {
    const {
      title = 'Reporte de Inventario',
      includeSummary = true,
      includeHeader = true
    } = options;
    
    // Crear contenido HTML
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
          .header { margin-bottom: 30px; }
          .summary { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #3498db; color: white; padding: 12px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          .status-available { color: #27ae60; font-weight: bold; }
          .status-low { color: #f39c12; font-weight: bold; }
          .status-out { color: #e74c3c; font-weight: bold; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #7f8c8d; font-size: 12px; }
        </style>
      </head>
      <body>
    `;
    
    // Encabezado
    if (includeHeader) {
      htmlContent += `
        <div class="header">
          <h1>${title}</h1>
          <p>Generado: ${formatDate(new Date(), 'datetime')}</p>
          <p>Total de productos: ${data.length}</p>
        </div>
      `;
    }
    
    // Resumen (opcional)
    if (includeSummary && data.length > 0) {
      const totalValue = data.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const lowStock = data.filter(item => item.status === 'Bajo Stock').length;
      const outOfStock = data.filter(item => item.status === 'Agotado').length;
      
      htmlContent += `
        <div class="summary">
          <h3>Resumen del Inventario</h3>
          <p><strong>Valor total:</strong> ${formatCurrency(totalValue)}</p>
          <p><strong>Productos con stock bajo:</strong> ${lowStock}</p>
          <p><strong>Productos agotados:</strong> ${outOfStock}</p>
        </div>
      `;
    }
    
    // Tabla de datos
    htmlContent += `
      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Cantidad</th>
            <th>Precio</th>
            <th>Valor Total</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    data.forEach(item => {
      const totalValue = item.price * item.quantity;
      const statusClass = item.status === 'Disponible' ? 'status-available' :
                         item.status === 'Bajo Stock' ? 'status-low' : 'status-out';
      
      htmlContent += `
        <tr>
          <td>${item.sku || 'N/A'}</td>
          <td>${item.name}</td>
          <td>${item.category}</td>
          <td>${item.quantity}</td>
          <td>${formatCurrency(item.price)}</td>
          <td>${formatCurrency(totalValue)}</td>
          <td class="${statusClass}">${item.status}</td>
        </tr>
      `;
    });
    
    // Pie de página
    htmlContent += `
        </tbody>
      </table>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Sistema de Inventario - Página 1 de 1</p>
      </div>
      </body>
      </html>
    `;
    
    return new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  }
  
  /**
   * Descarga un archivo
   * @param {Blob} blob - Archivo a descargar
   * @param {string} filename - Nombre del archivo
   */
  static downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    // Limpiar
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  
  /**
   * Exporta datos en el formato especificado
   * @param {Array} data - Datos a exportar
   * @param {string} format - Formato de exportación
   * @param {Object} options - Opciones de exportación
   */
  static exportData(data, format = EXPORT_FORMATS.CSV, options = {}) {
    if (!data || data.length === 0) {
      throw new Error('No hay datos para exportar');
    }
    
    let blob;
    const filename = options.filename || formatFilename('inventario', format);
    
    switch (format.toLowerCase()) {
      case EXPORT_FORMATS.CSV:
        blob = this.toCSV(data, options);
        break;
        
      case EXPORT_FORMATS.JSON:
        blob = this.toJSON(data, options);
        break;
        
      case EXPORT_FORMATS.EXCEL:
        blob = this.toExcel(data, options);
        break;
        
      case EXPORT_FORMATS.PDF:
        blob = this.toPDF(data, options);
        break;
        
      default:
        throw new Error(`Formato no soportado: ${format}`);
    }
    
    this.downloadFile(blob, filename);
    
    return {
      success: true,
      filename,
      format,
      itemCount: data.length,
      fileSize: blob.size
    };
  }
  
  /**
   * Prepara datos para exportación
   * @param {Array} data - Datos originales
   * @param {Array} selectedFields - Campos a incluir
   * @returns {Array} Datos preparados
   */
  static prepareDataForExport(data, selectedFields = null) {
    if (!data) return [];
    
    // Si no se especifican campos, usar todos
    const fields = selectedFields || Object.keys(data[0] || {});
    
    return data.map(item => {
      const exportItem = {};
      
      fields.forEach(field => {
        if (item.hasOwnProperty(field)) {
          exportItem[field] = item[field];
        }
      });
      
      return exportItem;
    });
  }
  
  /**
   * Exporta estadísticas del inventario
   * @param {Object} stats - Estadísticas a exportar
   * @param {string} format - Formato de exportación
   */
  static exportInventoryStats(stats, format = EXPORT_FORMATS.JSON) {
    const data = [
      {
        'Total de Productos': stats.totalProducts || 0,
        'Valor Total del Inventario': stats.totalValue || 0,
        'Costo Total': stats.totalCost || 0,
        'Ganancia Estimada': stats.estimatedProfit || 0,
        'Productos con Stock Bajo': stats.lowStockCount || 0,
        'Productos Agotados': stats.outOfStockCount || 0,
        'Categorías Diferentes': stats.categoriesCount || 0,
        'Precio Promedio': stats.averagePrice || 0,
        'Fecha de Generación': new Date().toISOString()
      }
    ];
    
    return this.exportData(data, format, {
      filename: formatFilename('estadisticas_inventario', format)
    });
  }
  
  /**
   * Exporta reporte de productos que necesitan reposición
   * @param {Array} products - Productos que necesitan reposición
   * @param {string} format - Formato de exportación
   */
  static exportReplenishmentReport(products, format = EXPORT_FORMATS.CSV) {
    const preparedData = products.map(product => ({
      'SKU': product.sku || 'N/A',
      'Nombre': product.name,
      'Categoría': product.category,
      'Stock Actual': product.quantity,
      'Stock Mínimo': product.minStock || 10,
      'Necesario': product.needed || 0,
      'Prioridad': product.priority || 'media',
      'Proveedor': product.supplier || 'N/A',
      'Ubicación': product.location || 'N/A',
      'Última Actualización': formatDate(product.lastUpdated, 'short')
    }));
    
    return this.exportData(preparedData, format, {
      filename: formatFilename('reposicion_inventario', format),
      fieldLabels: ['SKU', 'Nombre', 'Categoría', 'Stock Actual', 'Stock Mínimo', 'Necesario', 'Prioridad', 'Proveedor', 'Ubicación', 'Última Actualización']
    });
  }
}

export default ExportUtils;