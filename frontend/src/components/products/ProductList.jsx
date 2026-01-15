import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import ProductFilters from './ProductFilters';
import '../../assets/styles/products.css';

/**
 * Componente ProductList - Lista de productos con paginación y filtros
 * Muestra todos los productos del inventario con opciones de búsqueda y ordenamiento
 */
const ProductList = ({ products, onEdit, onDelete, onAddToCart, onViewDetail }) => {
    const [filteredProducts, setFilteredProducts] = useState(products || []);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(12);
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');

    // Datos de ejemplo si no se proporcionan productos
    const sampleProducts = [
        {
            id: 1,
            name: 'Laptop Dell XPS 13',
            sku: 'LP-DELL-XPS13',
            category: 'Electrónicos',
            price: 1299.99,
            stock: 25,
            minStock: 5,
            status: 'available',
            supplier: 'Dell Technologies',
            lastUpdated: '2024-01-15'
        },
        {
            id: 2,
            name: 'iPhone 15 Pro',
            sku: 'PH-APPLE-IP15P',
            category: 'Electrónicos',
            price: 999.99,
            stock: 42,
            minStock: 10,
            status: 'available',
            supplier: 'Apple Inc.',
            lastUpdated: '2024-01-14'
        },
        {
            id: 3,
            name: 'Silla Ergonómica',
            sku: 'OF-SILLA-ERG',
            category: 'Oficina',
            price: 299.99,
            stock: 3,
            minStock: 5,
            status: 'low-stock',
            supplier: 'OfficeMax',
            lastUpdated: '2024-01-13'
        }
    ];

    const productsData = products || sampleProducts;

    useEffect(() => {
        // Aplicar filtros y ordenamiento
        let result = [...productsData];
        
        // Ordenamiento
        result.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];
            
            if (sortBy === 'price' || sortBy === 'stock') {
                aValue = parseFloat(aValue);
                bValue = parseFloat(bValue);
            }
            
            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
        
        setFilteredProducts(result);
    }, [productsData, sortBy, sortOrder]);

    // Calcular paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleFiltersChange = (filters) => {
        console.log('Filtros aplicados:', filters);
        // En una aplicación real, aquí se aplicaría el filtrado
    };

    const handleAddNewProduct = () => {
        console.log('Agregar nuevo producto');
        // En una aplicación real, esto abriría un modal o redirigiría
    };

    return (
        <div className="products-container">
            <div className="products-header">
                <div className="header-left">
                    <h1 className="page-title">Gestión de Productos</h1>
                    <p className="page-subtitle">
                        {filteredProducts.length} productos encontrados
                    </p>
                </div>
                <div className="header-right">
                    <button 
                        className="btn btn-primary"
                        onClick={handleAddNewProduct}
                    >
                        <i className="btn-icon">+</i>
                        <span>Nuevo Producto</span>
                    </button>
                </div>
            </div>

            <ProductFilters 
                onFilterChange={handleFiltersChange}
                categories={['Electrónicos', 'Oficina', 'Hogar', 'Ropa', 'Alimentos']}
                suppliers={['Dell Technologies', 'Apple Inc.', 'OfficeMax', 'Samsung']}
            />

            <div className="products-toolbar">
                <div className="toolbar-left">
                    <div className="sort-options">
                        <span className="sort-label">Ordenar por:</span>
                        <select 
                            className="sort-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="name">Nombre</option>
                            <option value="price">Precio</option>
                            <option value="stock">Stock</option>
                            <option value="category">Categoría</option>
                            <option value="lastUpdated">Última actualización</option>
                        </select>
                        <button 
                            className="sort-order-btn"
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        >
                            {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                    </div>
                </div>
                <div className="toolbar-right">
                    <div className="view-options">
                        <button className="view-btn active" title="Vista de cuadrícula">
                            <i className="view-icon">☷</i>
                        </button>
                        <button className="view-btn" title="Vista de lista">
                            <i className="view-icon">☰</i>
                        </button>
                    </div>
                </div>
            </div>

            {currentItems.length === 0 ? (
                <div className="empty-state">
                    <i className="empty-icon">📦</i>
                    <h3>No se encontraron productos</h3>
                    <p>Intenta ajustar los filtros o agrega un nuevo producto.</p>
                    <button 
                        className="btn btn-primary"
                        onClick={handleAddNewProduct}
                    >
                        Agregar Producto
                    </button>
                </div>
            ) : (
                <>
                    <div className="products-grid">
                        {currentItems.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onAddToCart={onAddToCart}
                                onViewDetail={onViewDetail}
                            />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination">
                            <button 
                                className="pagination-btn"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                ← Anterior
                            </button>
                            
                            <div className="page-numbers">
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(page => {
                                        // Mostrar solo páginas cercanas a la actual
                                        return page === 1 || 
                                               page === totalPages ||
                                               (page >= currentPage - 1 && page <= currentPage + 1);
                                    })
                                    .map((page, index, array) => {
                                        // Agregar puntos suspensivos para páginas omitidas
                                        const showEllipsis = index > 0 && page - array[index - 1] > 1;
                                        return (
                                            <React.Fragment key={page}>
                                                {showEllipsis && (
                                                    <span className="page-ellipsis">...</span>
                                                )}
                                                <button
                                                    className={`page-number ${currentPage === page ? 'active' : ''}`}
                                                    onClick={() => handlePageChange(page)}
                                                >
                                                    {page}
                                                </button>
                                            </React.Fragment>
                                        );
                                    })}
                            </div>
                            
                            <button 
                                className="pagination-btn"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Siguiente →
                            </button>
                        </div>
                    )}
                </>
            )}

            <div className="products-summary">
                <div className="summary-item">
                    <span className="summary-label">Total Productos:</span>
                    <span className="summary-value">{filteredProducts.length}</span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Valor Total:</span>
                    <span className="summary-value">
                        ${filteredProducts.reduce((sum, p) => sum + (p.price * p.stock), 0).toLocaleString('es-ES', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}
                    </span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Stock Bajo:</span>
                    <span className="summary-value warning">
                        {filteredProducts.filter(p => p.status === 'low-stock').length}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ProductList;