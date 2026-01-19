// Datos de ejemplo para el inventario
export const mockInventoryItems = [
  {
    id: 1,
    sku: 'ELE-LAP-123',
    name: 'Laptop Dell XPS 13',
    description: 'Laptop ultrabook con pantalla InfinityEdge, procesador Intel Core i7, 16GB RAM, 512GB SSD',
    category: 'Electrónica',
    quantity: 15,
    price: 1299.99,
    minimumStock: 5,
    status: 'Disponible',
    location: 'Almacén A, Estante 3',
    supplier: 'Dell Technologies',
    createdAt: '2024-01-10T08:30:00Z',
    updatedAt: '2024-01-15T14:20:00Z',
    lastRestocked: '2024-01-15T14:20:00Z',
    tags: ['laptop', 'ultrabook', 'dell', 'premium']
  },
  {
    id: 2,
    sku: 'ACC-MOU-456',
    name: 'Mouse Inalámbrico Logitech MX Master 3',
    description: 'Mouse ergonómico inalámbrico con seguimiento de alta precisión y batería de larga duración',
    category: 'Accesorios',
    quantity: 42,
    price: 29.99,
    minimumStock: 10,
    status: 'Disponible',
    location: 'Almacén B, Estante 1',
    supplier: 'Logitech',
    createdAt: '2024-01-05T10:15:00Z',
    updatedAt: '2024-01-16T09:45:00Z',
    lastRestocked: '2024-01-10T11:30:00Z',
    tags: ['mouse', 'inalámbrico', 'logitech', 'ergonómico']
  },
  {
    id: 3,
    sku: 'ELE-MON-789',
    name: 'Monitor 24" Samsung FHD',
    description: 'Monitor LED de 24 pulgadas, resolución Full HD 1920x1080, tiempo de respuesta 5ms',
    category: 'Electrónica',
    quantity: 8,
    price: 199.99,
    minimumStock: 3,
    status: 'Bajo Stock',
    location: 'Almacén A, Estante 2',
    supplier: 'Samsung Electronics',
    createdAt: '2024-01-12T13:45:00Z',
    updatedAt: '2024-01-16T16:20:00Z',
    lastRestocked: '2024-01-12T13:45:00Z',
    tags: ['monitor', 'samsung', 'fhd', 'led']
  },
  {
    id: 4,
    sku: 'ACC-TEC-101',
    name: 'Teclado Mecánico Redragon K552',
    description: 'Teclado mecánico gaming con switches Outemu Blue, retroiluminación RGB, diseño 60%',
    category: 'Accesorios',
    quantity: 0,
    price: 89.99,
    minimumStock: 5,
    status: 'Agotado',
    location: 'Almacén B, Estante 2',
    supplier: 'Redragon',
    createdAt: '2023-12-20T09:30:00Z',
    updatedAt: '2024-01-14T15:10:00Z',
    lastRestocked: '2023-12-28T11:00:00Z',
    tags: ['teclado', 'mecánico', 'gaming', 'rgb']
  },
  {
    id: 5,
    sku: 'OFF-IMP-202',
    name: 'Impresora HP LaserJet Pro M404dn',
    description: 'Impresora láser monocromática, velocidad hasta 40 ppm, conexión Ethernet y USB',
    category: 'Oficina',
    quantity: 5,
    price: 349.99,
    minimumStock: 2,
    status: 'Disponible',
    location: 'Almacén C, Estante 1',
    supplier: 'HP Inc.',
    createdAt: '2024-01-03T14:20:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    lastRestocked: '2024-01-03T14:20:00Z',
    tags: ['impresora', 'láser', 'hp', 'monocromática']
  },
  {
    id: 6,
    sku: 'ELE-CAR-303',
    name: 'Cargador USB-C 65W',
    description: 'Cargador rápido USB-C de 65W compatible con laptops, tablets y smartphones',
    category: 'Electrónica',
    quantity: 27,
    price: 19.99,
    minimumStock: 15,
    status: 'Disponible',
    location: 'Almacén A, Estante 4',
    supplier: 'Anker',
    createdAt: '2024-01-08T11:45:00Z',
    updatedAt: '2024-01-16T08:15:00Z',
    lastRestocked: '2024-01-16T08:15:00Z',
    tags: ['cargador', 'usb-c', '65w', 'anker']
  },
  {
    id: 7,
    sku: 'ALM-DIS-404',
    name: 'Disco Duro Externo Seagate 1TB',
    description: 'Disco duro externo portátil de 1TB, USB 3.0, compatible con Windows y Mac',
    category: 'Almacenamiento',
    quantity: 12,
    price: 79.99,
    minimumStock: 8,
    status: 'Disponible',
    location: 'Almacén B, Estante 3',
    supplier: 'Seagate Technology',
    createdAt: '2024-01-11T16:30:00Z',
    updatedAt: '2024-01-15T13:45:00Z',
    lastRestocked: '2024-01-11T16:30:00Z',
    tags: ['disco duro', 'externo', 'seagate', '1tb']
  },
  {
    id: 8,
    sku: 'RED-ROU-505',
    name: 'Router Wi-Fi 6 TP-Link Archer AX50',
    description: 'Router Wi-Fi 6 de doble banda, velocidad hasta 3Gbps, 4 antenas externas',
    category: 'Redes',
    quantity: 3,
    price: 149.99,
    minimumStock: 2,
    status: 'Bajo Stock',
    location: 'Almacén C, Estante 2',
    supplier: 'TP-Link',
    createdAt: '2024-01-14T10:00:00Z',
    updatedAt: '2024-01-17T09:30:00Z',
    lastRestocked: '2024-01-14T10:00:00Z',
    tags: ['router', 'wifi-6', 'tp-link', 'doble-banda']
  },
  {
    id: 9,
    sku: 'OFF-ESC-606',
    name: 'Escritorio de Oficina Moderno',
    description: 'Escritorio de madera con diseño moderno, medidas 120x60x75 cm, color nogal',
    category: 'Muebles',
    quantity: 7,
    price: 249.99,
    minimumStock: 3,
    status: 'Disponible',
    location: 'Almacén D, Zona 1',
    supplier: 'Office Solutions Inc.',
    createdAt: '2024-01-06T13:15:00Z',
    updatedAt: '2024-01-13T14:40:00Z',
    lastRestocked: '2024-01-13T14:40:00Z',
    tags: ['escritorio', 'oficina', 'madera', 'moderno']
  },
  {
    id: 10,
    sku: 'HER-TAL-707',
    name: 'Taladro Inalámbrico DeWalt 20V',
    description: 'Taladro percutor inalámbrico, batería de iones de litio 20V, velocidad variable',
    category: 'Herramientas',
    quantity: 4,
    price: 189.99,
    minimumStock: 3,
    status: 'Disponible',
    location: 'Almacén D, Zona 3',
    supplier: 'DeWalt',
    createdAt: '2024-01-09T15:30:00Z',
    updatedAt: '2024-01-16T11:20:00Z',
    lastRestocked: '2024-01-09T15:30:00Z',
    tags: ['taladro', 'inalámbrico', 'dewalt', '20v']
  }
];

// Datos de ejemplo para movimientos
export const mockMovements = [
  {
    id: 1,
    itemId: 1,
    itemName: 'Laptop Dell XPS 13',
    type: 'Entrada',
    quantity: 5,
    previousQuantity: 10,
    newQuantity: 15,
    date: '2024-01-15T14:20:00Z',
    userId: 1,
    userName: 'Admin',
    notes: 'Compra proveedor - Factura #INV-2024-001',
    reference: 'PO-2024-015'
  },
  {
    id: 2,
    itemId: 2,
    itemName: 'Mouse Inalámbrico Logitech',
    type: 'Salida',
    quantity: 2,
    previousQuantity: 44,
    newQuantity: 42,
    date: '2024-01-16T09:45:00Z',
    userId: 2,
    userName: 'Juan Pérez',
    notes: 'Venta a cliente - Ticket #TKT-2024-045',
    reference: 'SALE-045'
  },
  {
    id: 3,
    itemId: 3,
    itemName: 'Monitor 24" Samsung FHD',
    type: 'Ajuste',
    quantity: -1,
    previousQuantity: 9,
    newQuantity: 8,
    date: '2024-01-16T16:20:00Z',
    userId: 1,
    userName: 'Admin',
    notes: 'Daño en almacén durante inventario físico',
    reference: 'ADJ-2024-003'
  },
  {
    id: 4,
    itemId: 4,
    itemName: 'Teclado Mecánico Redragon',
    type: 'Salida',
    quantity: 5,
    previousQuantity: 5,
    newQuantity: 0,
    date: '2024-01-14T15:10:00Z',
    userId: 3,
    userName: 'María García',
    notes: 'Venta a cliente corporativo',
    reference: 'TKT-2024-042'
  },
  {
    id: 5,
    itemId: 6,
    itemName: 'Cargador USB-C 65W',
    type: 'Entrada',
    quantity: 20,
    previousQuantity: 7,
    newQuantity: 27,
    date: '2024-01-16T08:15:00Z',
    userId: 1,
    userName: 'Admin',
    notes: 'Reabastecimiento de stock',
    reference: 'PO-2024-016'
  }
];

// Datos de ejemplo para notificaciones
export const mockNotifications = [
  {
    id: 'notif_1',
    type: 'low_stock',
    title: 'Bajo Stock Detectado',
    message: 'Monitor 24" Samsung FHD tiene bajo stock (8 unidades restantes)',
    metadata: {
      itemId: 3,
      itemName: 'Monitor 24" Samsung FHD',
      quantity: 8
    },
    read: false,
    createdAt: '2024-01-16T16:25:00Z',
    icon: '📉'
  },
  {
    id: 'notif_2',
    type: 'out_of_stock',
    title: 'Producto Agotado',
    message: 'Teclado Mecánico Redragon K552 está agotado',
    metadata: {
      itemId: 4,
      itemName: 'Teclado Mecánico Redragon K552'
    },
    read: false,
    createdAt: '2024-01-14T15:15:00Z',
    icon: '🛑'
  },
  {
    id: 'notif_3',
    type: 'success',
    title: 'Inventario Actualizado',
    message: 'Stock de Cargador USB-C actualizado exitosamente',
    metadata: {
      itemId: 6,
      operation: 'restock'
    },
    read: true,
    createdAt: '2024-01-16T08:20:00Z',
    icon: '✅'
  },
  {
    id: 'notif_4',
    type: 'info',
    title: 'Reporte Generado',
    message: 'Reporte de inventario mensual ha sido generado',
    metadata: {
      reportType: 'monthly',
      period: 'Enero 2024'
    },
    read: true,
    createdAt: '2024-01-15T10:00:00Z',
    icon: '📊'
  },
  {
    id: 'notif_5',
    type: 'warning',
    title: 'Revisión de Inventario',
    message: 'Recordatorio: Inventario físico programado para el viernes',
    metadata: {
      date: '2024-01-19',
      type: 'physical_inventory'
    },
    read: false,
    createdAt: '2024-01-16T09:00:00Z',
    icon: '⚠️'
  }
];

// Datos de ejemplo para usuarios
export const mockUsers = [
  {
    id: 1,
    email: 'admin@inventario.com',
    name: 'Administrador',
    role: 'admin',
    avatar: 'https://ui-avatars.com/api/?name=Admin&background=3498db&color=fff',
    lastLogin: '2024-01-17T08:30:00Z',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    email: 'juan.perez@inventario.com',
    name: 'Juan Pérez',
    role: 'manager',
    avatar: 'https://ui-avatars.com/api/?name=Juan+Perez&background=2ecc71&color=fff',
    lastLogin: '2024-01-16T16:45:00Z',
    createdAt: '2024-01-03T09:15:00Z'
  },
  {
    id: 3,
    email: 'maria.garcia@inventario.com',
    name: 'María García',
    role: 'user',
    avatar: 'https://ui-avatars.com/api/?name=Maria+Garcia&background=9b59b6&color=fff',
    lastLogin: '2024-01-15T14:20:00Z',
    createdAt: '2024-01-05T11:30:00Z'
  }
];

// Datos de ejemplo para proveedores
export const mockSuppliers = [
  {
    id: 1,
    name: 'Dell Technologies',
    contactPerson: 'Roberto Martínez',
    email: 'compras@dell.com',
    phone: '+1-800-123-4567',
    address: '123 Tech Street, Austin, TX',
    itemsSupplied: ['Laptop Dell XPS 13'],
    rating: 4.8,
    lastOrder: '2024-01-15'
  },
  {
    id: 2,
    name: 'Logitech',
    contactPerson: 'Ana López',
    email: 'ventas@logitech.com',
    phone: '+1-800-987-6543',
    address: '456 Innovation Blvd, San Jose, CA',
    itemsSupplied: ['Mouse Inalámbrico Logitech MX Master 3'],
    rating: 4.5,
    lastOrder: '2024-01-10'
  },
  {
    id: 3,
    name: 'Samsung Electronics',
    contactPerson: 'Carlos Kim',
    email: 'ventas@samsung.com',
    phone: '+1-800-555-7890',
    address: '789 Electronics Ave, Seoul, Korea',
    itemsSupplied: ['Monitor 24" Samsung FHD'],
    rating: 4.7,
    lastOrder: '2024-01-12'
  }
];

// Datos de ejemplo para reportes
export const mockReports = [
  {
    id: 'REP-20240117001',
    type: 'inventory',
    title: 'Reporte de Inventario Mensual',
    period: 'Enero 2024',
    generatedAt: '2024-01-17T10:00:00Z',
    generatedBy: 'Admin',
    fileSize: '2.4 MB',
    downloadUrl: '#',
    summary: {
      totalItems: 10,
      totalValue: '$15,899.88',
      lowStockItems: 2,
      outOfStockItems: 1
    }
  },
  {
    id: 'REP-20240116001',
    type: 'low_stock',
    title: 'Reporte de Bajo Stock',
    period: 'Al 16 de Enero 2024',
    generatedAt: '2024-01-16T17:00:00Z',
    generatedBy: 'Sistema',
    fileSize: '1.1 MB',
    downloadUrl: '#',
    summary: {
      itemsNeedingReorder: 3,
      estimatedCost: '$1,299.97',
      criticalItems: 1
    }
  },
  {
    id: 'REP-20240115001',
    type: 'movement',
    title: 'Reporte de Movimientos Semanal',
    period: '8-15 Enero 2024',
    generatedAt: '2024-01-15T18:30:00Z',
    generatedBy: 'Juan Pérez',
    fileSize: '3.2 MB',
    downloadUrl: '#',
    summary: {
      totalMovements: 15,
      entries: 8,
      exits: 7,
      netChange: '+32 unidades'
    }
  }
];

export default {
  mockInventoryItems,
  mockMovements,
  mockNotifications,
  mockUsers,
  mockSuppliers,
  mockReports
};