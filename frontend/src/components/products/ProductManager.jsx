import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductTable from './ProductTable';
import ProductFilter from './ProductFilter';
import ProductBatchActions from './ProductBatchActions';
import ProductImportExport from './ProductImportExport';
import ProductForm from './ProductForm';
import ProductQuickView from './ProductQuickView';
import ProductAnalytics from './ProductAnalytics';
import '../../assets/styles/Products/products.CSS';

const ProductManager = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [totalStats, setTotalStats] = useState({
    total: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0
  });

  // Estado de filtros
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    status: 'all',
    supplier: 'all',
    priceRange: [0, 10000],
    stockRange: [0, 1000],
    dateRange: ['', '']
  });

  // Estado de paginación
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    totalPages: 1,
    totalItems: 0
  });

  // Estado de ordenamiento
  const [sortConfig, setSortConfig] = useState({
    key: 'createdAt',
    direction: 'desc'
  });

  // Datos iniciales de ejemplo
  const initialProducts = [
    {
      id: 'PROD-001',
      sku: 'LAP-DEL-XPS13',
      name: 'Laptop Dell XPS 13',
      description: 'Laptop ultradelgada con pantalla InfinityEdge y procesador Intel Core i7 de 11va generación',
      category: 'Electrónica',
      subcategory: 'Laptops',
      brand: 'Dell',
      supplier: 'Dell Technologies',
      unit: 'Unidad',
      weight: 1.2,
      dimensions: '30x21x1.5 cm',
      cost: 899.99,
      price: 1299.99,
      salePrice: 1199.99,
      taxRate: 16,
      barcode: '1234567890123',
      stock: 15,
      minStock: 5,
      maxStock: 50,
      status: 'active',
      stockStatus: 'in-stock',
      rating: 4.7,
      reviewCount: 128,
      tags: ['gaming', 'premium', 'ultrabook'],
      features: ['Pantalla 13.4"', '16GB RAM', '512GB SSD', 'Intel Iris Xe'],
      specifications: {
        processor: 'Intel Core i7-1165G7',
        ram: '16GB LPDDR4x',
        storage: '512GB SSD',
        display: '13.4" FHD+',
        graphics: 'Intel Iris Xe',
        battery: '52Whr'
      },
      variants: [
        { id: 'VAR-001', name: '8GB RAM/256GB SSD', sku: 'LAP-DEL-XPS13-8256', price: 1099.99, stock: 8 },
        { id: 'VAR-002', name: '16GB RAM/512GB SSD', sku: 'LAP-DEL-XPS13-16512', price: 1299.99, stock: 15 },
        { id: 'VAR-003', name: '16GB RAM/1TB SSD', sku: 'LAP-DEL-XPS13-161TB', price: 1499.99, stock: 3 }
      ],
      images: [
        'https://via.placeholder.com/400x300/3498db/FFFFFF?text=Laptop+Front',
        'https://via.placeholder.com/400x300/2ecc71/FFFFFF?text=Laptop+Back',
        'https://via.placeholder.com/400x300/e74c3c/FFFFFF?text=Laptop+Side'
      ],
      mainImage: 'https://via.placeholder.com/400x300/3498db/FFFFFF?text=Laptop+Main',
      notes: 'Producto premium con garantía de 3 años',
      createdAt: '2024-01-15',
      updatedAt: '2024-03-20',
      createdBy: 'admin',
      updatedBy: 'admin'
    },
    {
      id: 'PROD-002',
      sku: 'MOU-LOG-MX3',
      name: 'Mouse Inalámbrico Logitech MX Master 3',
      description: 'Mouse ergonómico para productividad con scroll horizontal y carga rápida USB-C',
      category: 'Accesorios',
      subcategory: 'Periféricos',
      brand: 'Logitech',
      supplier: 'Logitech Inc',
      unit: 'Unidad',
      weight: 0.141,
      dimensions: '12.5x8.5x5 cm',
      cost: 45.50,
      price: 99.99,
      salePrice: 89.99,
      taxRate: 16,
      barcode: '9876543210987',
      stock: 42,
      minStock: 10,
      maxStock: 100,
      status: 'active',
      stockStatus: 'in-stock',
      rating: 4.8,
      reviewCount: 256,
      tags: ['ergonomic', 'wireless', 'productivity'],
      features: ['Seguimiento de 4000 DPI', '70 días de batería', 'Carga rápida USB-C', 'Compatible multi-dispositivo'],
      specifications: {
        sensor: 'Darkfield 4000 DPI',
        connectivity: 'Bluetooth/Unifying Receiver',
        battery: '70 días',
        buttons: '7 programables',
        compatibility: 'Windows, macOS, Linux, iPadOS'
      },
      variants: [],
      images: [
        'https://via.placeholder.com/400x300/9b59b6/FFFFFF?text=Mouse+Black',
        'https://via.placeholder.com/400x300/34495e/FFFFFF?text=Mouse+Side'
      ],
      mainImage: 'https://via.placeholder.com/400x300/9b59b6/FFFFFF?text=Mouse+Main',
      notes: 'Incluye receptor USB Unifying',
      createdAt: '2024-02-10',
      updatedAt: '2024-03-18',
      createdBy: 'admin',
      updatedBy: 'manager'
    },
    {
      id: 'PROD-003',
      sku: 'MON-SAM-24FHD',
      name: 'Monitor 24" Samsung FHD',
      description: 'Monitor Full HD con tecnología Eye Saver y diseño sin bordes',
      category: 'Electrónica',
      subcategory: 'Monitores',
      brand: 'Samsung',
      supplier: 'Samsung Electronics',
      unit: 'Unidad',
      weight: 3.8,
      dimensions: '54x40x20 cm',
      cost: 120.00,
      price: 199.99,
      salePrice: 179.99,
      taxRate: 16,
      barcode: '4567891230456',
      stock: 8,
      minStock: 10,
      maxStock: 30,
      status: 'active',
      stockStatus: 'low-stock',
      rating: 4.5,
      reviewCount: 89,
      tags: ['office', 'gaming', 'led'],
      features: ['Resolución 1920x1080', 'Tiempo de respuesta 5ms', 'Modo Eye Saver', 'Diseño sin bordes'],
      specifications: {
        screenSize: '24"',
        resolution: '1920x1080 FHD',
        refreshRate: '75Hz',
        responseTime: '5ms',
        ports: 'HDMI, VGA, DisplayPort',
        panel: 'IPS'
      },
      variants: [
        { id: 'VAR-004', name: '27" 4K', sku: 'MON-SAM-27UHD', price: 399.99, stock: 5 },
        { id: 'VAR-005', name: '32" Curvo', sku: 'MON-SAM-32CURVE', price: 499.99, stock: 12 }
      ],
      images: [
        'https://via.placeholder.com/400x300/f39c12/FFFFFF?text=Monitor+Front',
        'https://via.placeholder.com/400x300/1abc9c/FFFFFF?text=Monitor+Back'
      ],
      mainImage: 'https://via.placeholder.com/400x300/f39c12/FFFFFF?text=Monitor+Main',
      notes: 'Incluye cable HDMI',
      createdAt: '2024-01-25',
      updatedAt: '2024-03-15',
      createdBy: 'manager',
      updatedBy: 'admin'
    },
    {
      id: 'PROD-004',
      sku: 'KEY-RAZ-BW',
      name: 'Teclado Mecánico Razer BlackWidow',
      description: 'Teclado gaming con switches mecánicos Razer Green y retroiluminación RGB',
      category: 'Accesorios',
      subcategory: 'Periféricos',
      brand: 'Razer',
      supplier: 'Razer Inc',
      unit: 'Unidad',
      weight: 1.35,
      dimensions: '44x15x4 cm',
      cost: 75.00,
      price: 149.99,
      salePrice: 129.99,
      taxRate: 16,
      barcode: '7890123456789',
      stock: 0,
      minStock: 5,
      maxStock: 25,
      status: 'active',
      stockStatus: 'out-of-stock',
      rating: 4.6,
      reviewCount: 203,
      tags: ['gaming', 'rgb', 'mechanical'],
      features: ['Switches mecánicos Razer Green', 'Retroiluminación RGB Chroma', 'Reposamuñecas magnético', 'Cable trenzado'],
      specifications: {
        switchType: 'Razer Green Mechanical',
        backlight: 'RGB Chroma',
        keycaps: 'ABS Doubleshot',
        connectivity: 'USB 2.0',
        macros: 'Fully programmable'
      },
      variants: [
        { id: 'VAR-006', name: 'TKL (Sin teclado numérico)', sku: 'KEY-RAZ-BW-TKL', price: 129.99, stock: 0 },
        { id: 'VAR-007', name: 'Elite (Con reposamuñecas)', sku: 'KEY-RAZ-BW-ELITE', price: 169.99, stock: 2 }
      ],
      images: [
        'https://via.placeholder.com/400x300/95a5a6/FFFFFF?text=Keyboard+RGB',
        'https://via.placeholder.com/400x300/7f8c8d/FFFFFF?text=Keyboard+Side'
      ],
      mainImage: 'https://via.placeholder.com/400x300/95a5a6/FFFFFF?text=Keyboard+Main',
      notes: 'Próxima llegada: 15/04/2024',
      createdAt: '2024-02-15',
      updatedAt: '2024-03-10',
      createdBy: 'admin',
      updatedBy: 'admin'
    },
    {
      id: 'PROD-005',
      sku: 'PRI-HP-LJPRO',
      name: 'Impresora HP LaserJet Pro',
      description: 'Impresora láser monocromática para oficina con conectividad Wi-Fi y Ethernet',
      category: 'Oficina',
      subcategory: 'Impresoras',
      brand: 'HP',
      supplier: 'HP Inc',
      unit: 'Unidad',
      weight: 9.1,
      dimensions: '40x36x25 cm',
      cost: 210.00,
      price: 349.99,
      salePrice: 329.99,
      taxRate: 16,
      barcode: '3210987654321',
      stock: 5,
      minStock: 3,
      maxStock: 15,
      status: 'active',
      stockStatus: 'in-stock',
      rating: 4.3,
      reviewCount: 67,
      tags: ['office', 'laser', 'wireless'],
      features: ['Impresión láser monocromática', 'Wi-Fi y Ethernet', 'Pantalla táctil', 'Autoduplex'],
      specifications: {
        technology: 'Láser monocromática',
        speed: '30 ppm',
        resolution: '1200x1200 dpi',
        connectivity: 'Wi-Fi, Ethernet, USB',
        monthlyDutyCycle: '30,000 páginas'
      },
      variants: [],
      images: [
        'https://via.placeholder.com/400x300/3498db/FFFFFF?text=Printer+Front',
        'https://via.placeholder.com/400x300/2ecc71/FFFFFF?text=Printer+Back'
      ],
      mainImage: 'https://via.placeholder.com/400x300/3498db/FFFFFF?text=Printer+Main',
      notes: 'Incluye tóner inicial',
      createdAt: '2024-01-30',
      updatedAt: '2024-03-05',
      createdBy: 'manager',
      updatedBy: 'admin'
    }
  ];

  // Cargar productos
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      // Simular carga de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProducts(initialProducts);
      setFilteredProducts(initialProducts);
      calculateStats(initialProducts);
      setPagination(prev => ({
        ...prev,
        totalItems: initialProducts.length,
        totalPages: Math.ceil(initialProducts.length / prev.pageSize)
      }));
      setLoading(false);
    } catch (err) {
      setError('Error al cargar los productos');
      setLoading(false);
    }
  };

  // Calcular estadísticas
  const calculateStats = useCallback((productsList) => {
    const stats = {
      total: productsList.length,
      inStock: productsList.filter(p => p.stockStatus === 'in-stock').length,
      lowStock: productsList.filter(p => p.stockStatus === 'low-stock').length,
      outOfStock: productsList.filter(p => p.stockStatus === 'out-of-stock').length,
      totalValue: productsList.reduce((sum, p) => sum + (p.price * p.stock), 0)
    };
    setTotalStats(stats);
  }, []);

  // Aplicar filtros
  useEffect(() => {
    let result = [...products];

    // Filtro de búsqueda
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.sku.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.brand.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro de categoría
    if (filters.category !== 'all') {
      result = result.filter(product => product.category === filters.category);
    }

    // Filtro de estado
    if (filters.status !== 'all') {
      result = result.filter(product => product.stockStatus === filters.status);
    }

    // Filtro de proveedor
    if (filters.supplier !== 'all') {
      result = result.filter(product => product.supplier === filters.supplier);
    }

    // Filtro de precio
    result = result.filter(product =>
      product.price >= filters.priceRange[0] &&
      product.price <= filters.priceRange[1]
    );

    // Filtro de stock
    result = result.filter(product =>
      product.stock >= filters.stockRange[0] &&
      product.stock <= filters.stockRange[1]
    );

    // Ordenar
    result.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key.includes('.')) {
        const keys = sortConfig.key.split('.');
        aValue = keys.reduce((obj, key) => obj?.[key], a);
        bValue = keys.reduce((obj, key) => obj?.[key], b);
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredProducts(result);
    calculateStats(result);
    setPagination(prev => ({
      ...prev,
      page: 1,
      totalItems: result.length,
      totalPages: Math.ceil(result.length / prev.pageSize)
    }));
  }, [products, filters, sortConfig, calculateStats]);

  // Manejar selección de productos
  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  // Manejar acciones
  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleDeleteProduct = (productId) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      setProducts(prev => prev.filter(p => p.id !== productId));
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const handleBatchDelete = () => {
    if (window.confirm(`¿Estás seguro de eliminar ${selectedProducts.length} productos?`)) {
      setProducts(prev => prev.filter(p => !selectedProducts.includes(p.id)));
      setSelectedProducts([]);
    }
  };

  const handleBatchUpdateStatus = (status) => {
    setProducts(prev => prev.map(p => 
      selectedProducts.includes(p.id) ? { ...p, status } : p
    ));
  };

  const handleSaveProduct = (productData) => {
    if (editingProduct) {
      // Actualizar producto existente
      setProducts(prev => prev.map(p => 
        p.id === editingProduct.id ? { ...p, ...productData, updatedAt: new Date().toISOString().split('T')[0] } : p
      ));
    } else {
      // Agregar nuevo producto
      const newProduct = {
        ...productData,
        id: `PROD-${String(products.length + 1).padStart(3, '0')}`,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        createdBy: 'admin'
      };
      setProducts(prev => [...prev, newProduct]);
    }
    setShowProductForm(false);
    setEditingProduct(null);
  };

  // Manejar paginación
  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (pageSize) => {
    setPagination(prev => ({ 
      ...prev, 
      pageSize,
      page: 1,
      totalPages: Math.ceil(prev.totalItems / pageSize)
    }));
  };

  // Obtener productos paginados
  const getPaginatedProducts = () => {
    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredProducts.slice(startIndex, endIndex);
  };

  if (loading) {
    return (
      <div className="product-manager-loading">
        <div className="loading-spinner"></div>
        <p>Cargando productos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-manager-error">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={loadProducts}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="product-manager">
      <div className="product-manager-header">
        <div className="header-left">
          <h1>Gestión de Productos</h1>
          <p className="subtitle">Administra tu inventario de productos</p>
        </div>
        
        <div className="header-right">
          <button className="btn-primary" onClick={handleAddProduct}>
            <span className="btn-icon">+</span>
            Nuevo Producto
          </button>
        </div>
      </div>

      <ProductAnalytics stats={totalStats} />

      <div className="product-manager-content">
        <div className="sidebar">
          <ProductFilter 
            filters={filters}
            onFilterChange={setFilters}
            onResetFilters={() => setFilters({
              search: '',
              category: 'all',
              status: 'all',
              supplier: 'all',
              priceRange: [0, 10000],
              stockRange: [0, 1000],
              dateRange: ['', '']
            })}
          />

          <ProductImportExport 
            onImport={() => console.log('Import products')}
            onExport={() => console.log('Export products')}
          />
        </div>

        <div className="main-content">
          <div className="toolbar">
            <div className="view-controls">
              <button 
                className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
              >
                <span className="view-icon">📋</span>
                Tabla
              </button>
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <span className="view-icon">📊</span>
                Grid
              </button>
            </div>

            <div className="toolbar-actions">
              <ProductBatchActions
                selectedCount={selectedProducts.length}
                onBatchDelete={handleBatchDelete}
                onBatchUpdateStatus={handleBatchUpdateStatus}
              />
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="no-products">
              <div className="no-products-icon">📦</div>
              <h3>No se encontraron productos</h3>
              <p>Intenta con otros filtros o agrega un nuevo producto</p>
              <button className="btn-primary" onClick={handleAddProduct}>
                Agregar Producto
              </button>
            </div>
          ) : (
            <>
              {viewMode === 'table' ? (
                <ProductTable
                  products={getPaginatedProducts()}
                  selectedProducts={selectedProducts}
                  onSelectProduct={handleSelectProduct}
                  onSelectAll={handleSelectAll}
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteProduct}
                  onQuickView={setQuickViewProduct}
                  sortConfig={sortConfig}
                  onSort={setSortConfig}
                />
              ) : (
                <div className="product-grid">
                  {getPaginatedProducts().map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      selected={selectedProducts.includes(product.id)}
                      onSelect={() => handleSelectProduct(product.id)}
                      onEdit={() => handleEditProduct(product)}
                      onDelete={() => handleDeleteProduct(product.id)}
                      onQuickView={() => setQuickViewProduct(product)}
                    />
                  ))}
                </div>
              )}

              {/* Paginación */}
              {filteredProducts.length > pagination.pageSize && (
                <div className="pagination">
                  <div className="pagination-info">
                    Mostrando {((pagination.page - 1) * pagination.pageSize) + 1} - 
                    {Math.min(pagination.page * pagination.pageSize, filteredProducts.length)} de {filteredProducts.length} productos
                  </div>
                  
                  <div className="pagination-controls">
                    <button 
                      className="pagination-btn"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      ← Anterior
                    </button>
                    
                    <div className="page-numbers">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNumber;
                        if (pagination.totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNumber = i + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNumber = pagination.totalPages - 4 + i;
                        } else {
                          pageNumber = pagination.page - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNumber}
                            className={`page-btn ${pagination.page === pageNumber ? 'active' : ''}`}
                            onClick={() => handlePageChange(pageNumber)}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button 
                      className="pagination-btn"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Siguiente →
                    </button>
                  </div>
                  
                  <div className="page-size-selector">
                    <span>Mostrar:</span>
                    <select 
                      value={pagination.pageSize}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modales */}
      {showProductForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <ProductForm
              product={editingProduct}
              onSave={handleSaveProduct}
              onClose={() => {
                setShowProductForm(false);
                setEditingProduct(null);
              }}
            />
          </div>
        </div>
      )}

      {quickViewProduct && (
        <ProductQuickView
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onEdit={() => {
            setEditingProduct(quickViewProduct);
            setShowProductForm(true);
            setQuickViewProduct(null);
          }}
        />
      )}
    </div>
  );
};

export default ProductManager;