import { inventoryConstants } from './inventoryConstants';

// Datos de ejemplo para desarrollo
export const sampleInventory = [
  {
    id: 1,
    name: 'Laptop Dell XPS 13',
    description: 'Laptop premium con pantalla InfinityEdge',
    category: 'Electrónica',
    quantity: 15,
    price: 1299.99,
    cost: 950.00,
    sku: 'DLXPS13-2024',
    barcode: '123456789012',
    status: inventoryConstants.ITEM_STATUS.AVAILABLE,
    supplier: 'Dell Technologies',
    location: 'Almacén A, Estante 3',
    minStock: 5,
    maxStock: 30,
    lastUpdated: '2024-01-15T10:30:00Z',
    created: '2024-01-01T08:00:00Z'
  },
  {
    id: 2,
    name: 'Mouse Inalámbrico Logitech MX Master 3',
    description: 'Mouse ergonómico para productividad',
    category: 'Accesorios',
    quantity: 42,
    price: 89.99,
    cost: 55.00,
    sku: 'LOG-MX3-WL',
    barcode: '234567890123',
    status: inventoryConstants.ITEM_STATUS.AVAILABLE,
    supplier: 'Logitech',
    location: 'Almacén B, Estante 1',
    minStock: 20,
    maxStock: 100,
    lastUpdated: '2024-01-14T14:20:00Z',
    created: '2024-01-02T09:15:00Z'
  },
  {
    id: 3,
    name: 'Monitor 24" Samsung FHD',
    description: 'Monitor LED de 24 pulgadas Full HD',
    category: 'Electrónica',
    quantity: 8,
    price: 199.99,
    cost: 140.00,
    sku: 'SAM-M24FHD',
    barcode: '345678901234',
    status: inventoryConstants.ITEM_STATUS.LOW_STOCK,
    supplier: 'Samsung',
    location: 'Almacén A, Estante 5',
    minStock: 10,
    maxStock: 25,
    lastUpdated: '2024-01-13T16:45:00Z',
    created: '2024-01-03T10:30:00Z'
  },
  {
    id: 4,
    name: 'Teclado Mecánico Corsair K70',
    description: 'Teclado mecánico RGB switches Cherry MX',
    category: 'Accesorios',
    quantity: 0,
    price: 149.99,
    cost: 95.00,
    sku: 'COR-K70-MX',
    barcode: '456789012345',
    status: inventoryConstants.ITEM_STATUS.OUT_OF_STOCK,
    supplier: 'Corsair',
    location: 'Almacén B, Estante 2',
    minStock: 5,
    maxStock: 25,
    lastUpdated: '2024-01-12T11:10:00Z',
    created: '2024-01-04T14:00:00Z'
  },
  {
    id: 5,
    name: 'Impresora HP LaserJet Pro',
    description: 'Impresora láser multifunción',
    category: 'Oficina',
    quantity: 5,
    price: 349.99,
    cost: 250.00,
    sku: 'HP-LJP-MFP',
    barcode: '567890123456',
    status: inventoryConstants.ITEM_STATUS.AVAILABLE,
    supplier: 'HP Inc.',
    location: 'Almacén C, Estante 1',
    minStock: 3,
    maxStock: 15,
    lastUpdated: '2024-01-15T09:45:00Z',
    created: '2024-01-05T08:45:00Z'
  },
  {
    id: 6,
    name: 'Disco Duro Externo Seagate 2TB',
    description: 'Disco duro externo USB 3.0',
    category: 'Almacenamiento',
    quantity: 27,
    price: 79.99,
    cost: 50.00,
    sku: 'SEA-EXT-2TB',
    barcode: '678901234567',
    status: inventoryConstants.ITEM_STATUS.AVAILABLE,
    supplier: 'Seagate',
    location: 'Almacén A, Estante 4',
    minStock: 15,
    maxStock: 50,
    lastUpdated: '2024-01-14T13:30:00Z',
    created: '2024-01-06T11:20:00Z'
  },
  {
    id: 7,
    name: 'Router Wi-Fi 6 TP-Link Archer AX50',
    description: 'Router de doble banda Wi-Fi 6',
    category: 'Redes',
    quantity: 3,
    price: 149.99,
    cost: 100.00,
    sku: 'TPL-AX50-W6',
    barcode: '789012345678',
    status: inventoryConstants.ITEM_STATUS.LOW_STOCK,
    supplier: 'TP-Link',
    location: 'Almacén B, Estante 3',
    minStock: 5,
    maxStock: 20,
    lastUpdated: '2024-01-13T15:15:00Z',
    created: '2024-01-07T13:10:00Z'
  },
  {
    id: 8,
    name: 'Silla Ergonómica de Oficina',
    description: 'Silla ergonómica con soporte lumbar',
    category: 'Muebles',
    quantity: 12,
    price: 299.99,
    cost: 180.00,
    sku: 'OFI-CHAIR-ERG',
    barcode: '890123456789',
    status: inventoryConstants.ITEM_STATUS.AVAILABLE,
    supplier: 'OfficePro',
    location: 'Almacén C, Estante 2',
    minStock: 5,
    maxStock: 25,
    lastUpdated: '2024-01-12T10:00:00Z',
    created: '2024-01-08T09:30:00Z'
  }
];

// Funciones utilitarias
export const calculateInventoryValue = (items) => {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

export const calculateTotalCost = (items) => {
  return items.reduce((total, item) => total + (item.cost * item.quantity), 0);
};

export const calculateProfit = (items) => {
  const totalValue = calculateInventoryValue(items);
  const totalCost = calculateTotalCost(items);
  return totalValue - totalCost;
};

export const calculateProfitMargin = (items) => {
  const totalValue = calculateInventoryValue(items);
  const totalCost = calculateTotalCost(items);
  if (totalCost === 0) return 0;
  return ((totalValue - totalCost) / totalCost) * 100;
};

export const getLowStockItems = (items) => {
  return items.filter(item => 
    item.status === inventoryConstants.ITEM_STATUS.LOW_STOCK || 
    item.quantity < item.minStock
  );
};

export const getOutOfStockItems = (items) => {
  return items.filter(item => 
    item.status === inventoryConstants.ITEM_STATUS.OUT_OF_STOCK || 
    item.quantity === 0
  );
};

export const getItemsNeedingReorder = (items) => {
  return items.filter(item => 
    item.quantity <= item.minStock && item.quantity > 0
  );
};

export const getCategorySummary = (items) => {
  const summary = {};
  
  items.forEach(item => {
    if (!summary[item.category]) {
      summary[item.category] = {
        count: 0,
        totalValue: 0,
        items: []
      };
    }
    
    summary[item.category].count++;
    summary[item.category].totalValue += item.price * item.quantity;
    summary[item.category].items.push(item);
  });
  
  return summary;
};

export const filterItems = (items, filter, searchTerm) => {
  let filtered = [...items];
  
  // Aplicar filtro por estado
  if (filter !== inventoryConstants.FILTER_OPTIONS.ALL) {
    filtered = filtered.filter(item => {
      switch(filter) {
        case inventoryConstants.FILTER_OPTIONS.AVAILABLE:
          return item.status === inventoryConstants.ITEM_STATUS.AVAILABLE;
        case inventoryConstants.FILTER_OPTIONS.LOW_STOCK:
          return item.status === inventoryConstants.ITEM_STATUS.LOW_STOCK;
        case inventoryConstants.FILTER_OPTIONS.OUT_OF_STOCK:
          return item.status === inventoryConstants.ITEM_STATUS.OUT_OF_STOCK;
        default:
          return true;
      }
    });
  }
  
  // Aplicar búsqueda
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(item =>
      item.name.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term) ||
      item.sku.toLowerCase().includes(term) ||
      item.barcode.includes(term)
    );
  }
  
  return filtered;
};

export const sortItems = (items, sortOption) => {
  const sorted = [...items];
  
  switch(sortOption) {
    case inventoryConstants.SORT_OPTIONS.NAME_ASC:
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    
    case inventoryConstants.SORT_OPTIONS.NAME_DESC:
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    
    case inventoryConstants.SORT_OPTIONS.PRICE_ASC:
      return sorted.sort((a, b) => a.price - b.price);
    
    case inventoryConstants.SORT_OPTIONS.PRICE_DESC:
      return sorted.sort((a, b) => b.price - a.price);
    
    case inventoryConstants.SORT_OPTIONS.QUANTITY_ASC:
      return sorted.sort((a, b) => a.quantity - b.quantity);
    
    case inventoryConstants.SORT_OPTIONS.QUANTITY_DESC:
      return sorted.sort((a, b) => b.quantity - a.quantity);
    
    case inventoryConstants.SORT_OPTIONS.DATE_ASC:
      return sorted.sort((a, b) => new Date(a.lastUpdated) - new Date(b.lastUpdated));
    
    case inventoryConstants.SORT_OPTIONS.DATE_DESC:
      return sorted.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
    
    default:
      return sorted;
  }
};

export const generateNextSKU = (category) => {
  const prefix = category.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${timestamp}`;
};

export const validateItem = (item) => {
  const errors = {};
  
  if (!item.name || item.name.trim().length < 2) {
    errors.name = 'El nombre debe tener al menos 2 caracteres';
  }
  
  if (!item.category) {
    errors.category = 'La categoría es obligatoria';
  }
  
  if (item.quantity < 0) {
    errors.quantity = 'La cantidad no puede ser negativa';
  }
  
  if (item.price <= 0) {
    errors.price = 'El precio debe ser mayor a 0';
  }
  
  if (item.cost && item.cost < 0) {
    errors.cost = 'El costo no puede ser negativo';
  }
  
  if (item.minStock && item.maxStock && item.minStock > item.maxStock) {
    errors.minStock = 'Stock mínimo no puede ser mayor al máximo';
  }
  
  return errors;
};

export const updateItemStatus = (item) => {
  const updatedItem = { ...item };
  
  if (updatedItem.quantity === 0) {
    updatedItem.status = inventoryConstants.ITEM_STATUS.OUT_OF_STOCK;
  } else if (updatedItem.quantity <= updatedItem.minStock) {
    updatedItem.status = inventoryConstants.ITEM_STATUS.LOW_STOCK;
  } else {
    updatedItem.status = inventoryConstants.ITEM_STATUS.AVAILABLE;
  }
  
  updatedItem.lastUpdated = new Date().toISOString();
  
  return updatedItem;
};