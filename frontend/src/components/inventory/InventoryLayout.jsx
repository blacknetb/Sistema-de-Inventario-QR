import React, { useState, useEffect } from 'react';
import InventoryHeader from './InventoryHeader';
import InventoryStats from './InventoryStats';
import ProductList from './ProductList';
import CategoryFilter from './CategoryFilter';
import SearchBar from './SearchBar';
import Pagination from './Pagination';
import EmptyState from './EmptyState';
import LoadingSpinner from './LoadingSpinner';
import ExportButton from './ExportButton';
import DeleteConfirmation from './DeleteConfirmation';
import ProductForm from './ProductForm';
import '../../assets/styles/inventory/Inventory.css';

const InventoryLayout = () => {
  // Estado del inventario
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estado de filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  
  // Estado para modales
  const [showProductForm, setShowProductForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formMode, setFormMode] = useState('add'); // 'add' o 'edit'
  
  // Datos iniciales de ejemplo
  const initialProducts = [
    {
      id: 1,
      name: 'Laptop Dell XPS 13',
      category: 'Electrónica',
      sku: 'LAP-DEL-XPS13',
      description: 'Laptop de alta gama con pantalla InfinityEdge',
      quantity: 15,
      price: 1299.99,
      cost: 899.99,
      supplier: 'Dell Technologies',
      status: 'in-stock',
      lowStockThreshold: 5,
      lastUpdated: '2024-01-15',
      image: 'https://via.placeholder.com/300x200/3498db/FFFFFF?text=Laptop'
    },
    {
      id: 2,
      name: 'Mouse Inalámbrico Logitech MX Master 3',
      category: 'Accesorios',
      sku: 'MOU-LOG-MX3',
      description: 'Mouse ergonómico con scroll horizontal',
      quantity: 42,
      price: 99.99,
      cost: 45.50,
      supplier: 'Logitech',
      status: 'in-stock',
      lowStockThreshold: 10,
      lastUpdated: '2024-01-14',
      image: 'https://via.placeholder.com/300x200/2ecc71/FFFFFF?text=Mouse'
    },
    {
      id: 3,
      name: 'Monitor 24" Samsung FHD',
      category: 'Electrónica',
      sku: 'MON-SAM-24FHD',
      description: 'Monitor Full HD con tecnología Eye Saver',
      quantity: 8,
      price: 199.99,
      cost: 120.00,
      supplier: 'Samsung',
      status: 'low-stock',
      lowStockThreshold: 10,
      lastUpdated: '2024-01-13',
      image: 'https://via.placeholder.com/300x200/e74c3c/FFFFFF?text=Monitor'
    },
    {
      id: 4,
      name: 'Teclado Mecánico Razer BlackWidow',
      category: 'Accesorios',
      sku: 'KEY-RAZ-BW',
      description: 'Teclado gaming con switches mecánicos',
      quantity: 0,
      price: 149.99,
      cost: 75.00,
      supplier: 'Razer',
      status: 'out-of-stock',
      lowStockThreshold: 5,
      lastUpdated: '2024-01-12',
      image: 'https://via.placeholder.com/300x200/95a5a6/FFFFFF?text=Teclado'
    },
    {
      id: 5,
      name: 'Impresora HP LaserJet Pro',
      category: 'Oficina',
      sku: 'PRI-HP-LJPRO',
      description: 'Impresora láser para oficina',
      quantity: 5,
      price: 349.99,
      cost: 210.00,
      supplier: 'HP Inc',
      status: 'in-stock',
      lowStockThreshold: 3,
      lastUpdated: '2024-01-11',
      image: 'https://via.placeholder.com/300x200/9b59b6/FFFFFF?text=Impresora'
    },
    {
      id: 6,
      name: 'Cargador USB-C 65W',
      category: 'Electrónica',
      sku: 'CHA-USB-65W',
      description: 'Cargador rápido para laptop y móvil',
      quantity: 27,
      price: 39.99,
      cost: 15.00,
      supplier: 'Anker',
      status: 'in-stock',
      lowStockThreshold: 15,
      lastUpdated: '2024-01-10',
      image: 'https://via.placeholder.com/300x200/1abc9c/FFFFFF?text=Cargador'
    },
    {
      id: 7,
      name: 'Disco Duro Externo 2TB WD',
      category: 'Almacenamiento',
      sku: 'HDD-WD-2TB',
      description: 'Disco duro portátil USB 3.0',
      quantity: 12,
      price: 89.99,
      cost: 45.00,
      supplier: 'Western Digital',
      status: 'in-stock',
      lowStockThreshold: 8,
      lastUpdated: '2024-01-09',
      image: 'https://via.placeholder.com/300x200/34495e/FFFFFF?text=Disco+Duro'
    },
    {
      id: 8,
      name: 'Router Wi-Fi 6 ASUS RT-AX86U',
      category: 'Redes',
      sku: 'ROU-ASU-AX86U',
      description: 'Router gaming con Wi-Fi 6',
      quantity: 3,
      price: 249.99,
      cost: 150.00,
      supplier: 'ASUS',
      status: 'low-stock',
      lowStockThreshold: 5,
      lastUpdated: '2024-01-08',
      image: 'https://via.placeholder.com/300x200/f39c12/FFFFFF?text=Router'
    },
    {
      id: 9,
      name: 'Webcam Logitech C920',
      category: 'Accesorios',
      sku: 'CAM-LOG-C920',
      description: 'Webcam Full HD con micrófono integrado',
      quantity: 18,
      price: 79.99,
      cost: 35.00,
      supplier: 'Logitech',
      status: 'in-stock',
      lowStockThreshold: 10,
      lastUpdated: '2024-01-07',
      image: 'https://via.placeholder.com/300x200/3498db/FFFFFF?text=Webcam'
    },
    {
      id: 10,
      name: 'Silla de Oficina Ergonómica',
      category: 'Mobiliario',
      sku: 'CHA-OFF-ERG',
      description: 'Silla ergonómica con soporte lumbar',
      quantity: 6,
      price: 299.99,
      cost: 180.00,
      supplier: 'OfficePro',
      status: 'in-stock',
      lowStockThreshold: 4,
      lastUpdated: '2024-01-06',
      image: 'https://via.placeholder.com/300x200/2ecc71/FFFFFF?text=Silla'
    }
  ];

  // Cargar productos iniciales
  useEffect(() => {
    const loadProducts = () => {
      setLoading(true);
      try {
        // Simular carga de API
        setTimeout(() => {
          setProducts(initialProducts);
          setFilteredProducts(initialProducts);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Error al cargar los productos');
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Filtrar y ordenar productos
  useEffect(() => {
    let result = [...products];

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      result = result.filter(product => product.category === selectedCategory);
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(product =>
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term) ||
        product.supplier.toLowerCase().includes(term)
      );
    }

    // Ordenar productos
    result.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Manejar ordenamiento por estado especial
      if (sortBy === 'status') {
        const statusOrder = { 'in-stock': 1, 'low-stock': 2, 'out-of-stock': 3 };
        aValue = statusOrder[a.status] || 4;
        bValue = statusOrder[b.status] || 4;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredProducts(result);
    setCurrentPage(1); // Resetear a primera página cuando cambian los filtros
  }, [products, selectedCategory, searchTerm, sortBy, sortOrder]);

  // Calcular datos de paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Manejar agregar producto
  const handleAddProduct = (newProduct) => {
    const productWithId = {
      ...newProduct,
      id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    setProducts([...products, productWithId]);
    setShowProductForm(false);
  };

  // Manejar editar producto
  const handleEditProduct = (updatedProduct) => {
    setProducts(products.map(product =>
      product.id === updatedProduct.id
        ? { ...updatedProduct, lastUpdated: new Date().toISOString().split('T')[0] }
        : product
    ));
    setShowProductForm(false);
    setSelectedProduct(null);
  };

  // Manejar eliminar producto
  const handleDeleteProduct = () => {
    if (selectedProduct) {
      setProducts(products.filter(product => product.id !== selectedProduct.id));
      setShowDeleteModal(false);
      setSelectedProduct(null);
    }
  };

  // Manejar cambio de página
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Manejar cambio de items por página
  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  // Abrir formulario para agregar producto
  const openAddForm = () => {
    setFormMode('add');
    setSelectedProduct(null);
    setShowProductForm(true);
  };

  // Abrir formulario para editar producto
  const openEditForm = (product) => {
    setFormMode('edit');
    setSelectedProduct(product);
    setShowProductForm(true);
  };

  // Abrir modal de confirmación para eliminar
  const openDeleteModal = (product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  // Exportar datos
  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,SKU,Nombre,Categoría,Descripción,Cantidad,Precio,Costo,Proveedor,Estado,Última Actualización\n"
      + products.map(product => 
          `${product.id},${product.sku},${product.name},${product.category},"${product.description}",${product.quantity},${product.price},${product.cost},${product.supplier},${product.status},${product.lastUpdated}`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inventario_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Resetear filtros
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSortBy('name');
    setSortOrder('asc');
  };

  // Calcular estadísticas
  const stats = {
    totalProducts: products.length,
    totalValue: products.reduce((sum, product) => sum + (product.price * product.quantity), 0),
    totalCost: products.reduce((sum, product) => sum + (product.cost * product.quantity), 0),
    inStock: products.filter(p => p.status === 'in-stock').length,
    lowStock: products.filter(p => p.status === 'low-stock').length,
    outOfStock: products.filter(p => p.status === 'out-of-stock').length,
  };

  if (loading) {
    return <LoadingSpinner message="Cargando inventario..." />;
  }

  if (error) {
    return (
      <div className="inventory-layout">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="inventory-layout">
      <InventoryHeader 
        title="Sistema de Inventario Completo"
        onAddProduct={openAddForm}
        onExport={handleExport}
        productCount={products.length}
      />

      <div className="inventory-content">
        <div className="inventory-sidebar">
          <CategoryFilter
            categories={['all', 'Electrónica', 'Accesorios', 'Oficina', 'Almacenamiento', 'Redes', 'Mobiliario']}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />

          <InventoryStats stats={stats} />
        </div>

        <div className="inventory-main">
          <div className="inventory-toolbar">
            <SearchBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              placeholder="Buscar productos por nombre, SKU o proveedor..."
            />

            <div className="toolbar-controls">
              <div className="sort-controls">
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="name">Ordenar por Nombre</option>
                  <option value="quantity">Ordenar por Cantidad</option>
                  <option value="price">Ordenar por Precio</option>
                  <option value="lastUpdated">Ordenar por Fecha</option>
                  <option value="status">Ordenar por Estado</option>
                </select>
                <button 
                  className="sort-order-btn"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                </button>
              </div>

              <button 
                className="reset-filters-btn"
                onClick={handleResetFilters}
              >
                Limpiar Filtros
              </button>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <EmptyState
              message="No se encontraron productos con los filtros aplicados"
              onReset={handleResetFilters}
            />
          ) : (
            <>
              <ProductList
                products={currentItems}
                onEdit={openEditForm}
                onDelete={openDeleteModal}
              />

              <div className="inventory-footer">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  totalItems={filteredProducts.length}
                />

                <div className="results-info">
                  Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredProducts.length)} de {filteredProducts.length} productos
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modales */}
      {showProductForm && (
        <ProductForm
          isOpen={showProductForm}
          onClose={() => setShowProductForm(false)}
          onSubmit={formMode === 'add' ? handleAddProduct : handleEditProduct}
          product={selectedProduct}
          mode={formMode}
        />
      )}

      {showDeleteModal && (
        <DeleteConfirmation
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteProduct}
          productName={selectedProduct?.name}
        />
      )}
    </div>
  );
};

export default InventoryLayout;