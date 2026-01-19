/**
 * Utilidades para manejo de códigos QR en el sistema de inventario
 */

// Genera datos estructurados para el código QR
export const generateQRData = (itemData) => {
  const timestamp = new Date().toISOString();
  
  return {
    version: '1.0',
    type: 'inventory_item',
    itemId: itemData.itemId || generateItemId(),
    itemName: itemData.itemName,
    category: itemData.category || 'General',
    quantity: parseInt(itemData.quantity) || 1,
    price: parseFloat(itemData.price) || 0,
    location: itemData.location || 'Almacén Principal',
    description: itemData.description || '',
    generatedAt: timestamp,
    lastUpdated: timestamp,
    metadata: {
      system: 'Inventario Básico',
      version: '1.0.0'
    }
  };
};

// Genera un ID único para el item
export const generateItemId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `ITEM-${timestamp}-${random}`.toUpperCase();
};

// Valida los datos del QR
export const validateQRData = (qrData) => {
  const requiredFields = ['itemId', 'itemName', 'quantity', 'price'];
  
  for (const field of requiredFields) {
    if (!qrData[field] && qrData[field] !== 0) {
      return {
        isValid: false,
        error: `Campo requerido faltante: ${field}`
      };
    }
  }
  
  if (typeof qrData.quantity !== 'number' || qrData.quantity < 0) {
    return {
      isValid: false,
      error: 'Cantidad inválida'
    };
  }
  
  if (typeof qrData.price !== 'number' || qrData.price < 0) {
    return {
      isValid: false,
      error: 'Precio inválido'
    };
  }
  
  return {
    isValid: true,
    error: null
  };
};

// Descarga un código QR como imagen
export const downloadQRCode = (dataUrl, filename) => {
  try {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename || 'qr-code.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (error) {
    console.error('Error downloading QR code:', error);
    return false;
  }
};

// Descarga múltiples códigos QR como archivo ZIP
export const downloadAllQRCodes = async (qrItems) => {
  if (!window.JSZip) {
    alert('La funcionalidad ZIP requiere la librería JSZip. Por favor, descarga los QR individualmente.');
    return;
  }
  
  try {
    const zip = new JSZip();
    const folder = zip.folder('qr-codes');
    
    qrItems.forEach((item, index) => {
      // Convertir data URL a blob
      const base64Data = item.qrCode.split(',')[1];
      const filename = `${item.data.itemName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${item.data.itemId}.png`;
      folder.file(filename, base64Data, { base64: true });
    });
    
    // Agregar archivo de información
    const infoContent = qrItems.map(item => 
      `${item.data.itemId},${item.data.itemName},${item.data.category},${item.data.quantity},${item.data.price},${item.data.location}`
    ).join('\n');
    
    folder.file('informacion.csv', 'ID,Nombre,Categoría,Cantidad,Precio,Ubicación\n' + infoContent);
    
    // Generar y descargar ZIP
    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `qr-codes-${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
  } catch (error) {
    console.error('Error creating ZIP file:', error);
    alert('Error al crear archivo ZIP');
  }
};

// Exporta el historial a CSV
export const exportHistoryToCSV = (history) => {
  if (!history || history.length === 0) {
    alert('No hay datos para exportar');
    return;
  }
  
  const headers = [
    'ID',
    'Nombre del Producto',
    'Categoría',
    'Cantidad',
    'Precio',
    'Ubicación',
    'Fecha Generación',
    'Tipo',
    'ID QR'
  ];
  
  const rows = history.map(item => [
    item.data.itemId,
    `"${item.data.itemName}"`,
    item.data.category,
    item.data.quantity,
    item.data.price,
    item.data.location,
    new Date(item.timestamp).toLocaleString(),
    item.type || 'single',
    item.id
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `historial-qr-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Parsea un código QR escaneado
export const parseQRData = (qrText) => {
  try {
    const data = JSON.parse(qrText);
    
    // Validar estructura básica
    if (!data.itemId || !data.itemName) {
      throw new Error('Estructura de QR inválida');
    }
    
    return {
      success: true,
      data: data,
      message: 'QR parseado correctamente'
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: `Error al parsear QR: ${error.message}`
    };
  }
};

// Calcula estadísticas de códigos QR
export const calculateQRStats = (history) => {
  const stats = {
    total: history.length,
    byCategory: {},
    byDay: {},
    totalValue: 0
  };
  
  history.forEach(item => {
    // Por categoría
    const category = item.data.category || 'Sin categoría';
    stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    
    // Por día
    const date = new Date(item.timestamp).toLocaleDateString();
    stats.byDay[date] = (stats.byDay[date] || 0) + 1;
    
    // Valor total
    stats.totalValue += (item.data.price || 0) * (item.data.quantity || 0);
  });
  
  return stats;
};

// Filtra códigos QR por criterios
export const filterQRHistory = (history, filters) => {
  return history.filter(item => {
    // Filtrar por categoría
    if (filters.category && filters.category !== 'all') {
      if (item.data.category !== filters.category) return false;
    }
    
    // Filtrar por tipo
    if (filters.type && filters.type !== 'all') {
      if (filters.type === 'single' && item.type === 'batch') return false;
      if (filters.type === 'batch' && item.type !== 'batch') return false;
    }
    
    // Filtrar por fecha
    if (filters.startDate || filters.endDate) {
      const itemDate = new Date(item.timestamp);
      
      if (filters.startDate && itemDate < new Date(filters.startDate)) {
        return false;
      }
      
      if (filters.endDate && itemDate > new Date(filters.endDate)) {
        return false;
      }
    }
    
    // Filtrar por búsqueda de texto
    if (filters.searchText) {
      const searchTerm = filters.searchText.toLowerCase();
      const searchableFields = [
        item.data.itemName,
        item.data.category,
        item.data.itemId,
        item.data.location
      ].join(' ').toLowerCase();
      
      if (!searchableFields.includes(searchTerm)) {
        return false;
      }
    }
    
    return true;
  });
};

// Genera un número de lote para generación en masa
export const generateBatchNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  
  return `BATCH-${year}${month}${day}-${random}`;
};

// Valida si un código QR está expirado
export const isQRExpired = (qrData, expiryDays = 365) => {
  if (!qrData.generatedAt) return false;
  
  const generatedDate = new Date(qrData.generatedAt);
  const expiryDate = new Date(generatedDate);
  expiryDate.setDate(expiryDate.getDate() + expiryDays);
  
  return new Date() > expiryDate;
};