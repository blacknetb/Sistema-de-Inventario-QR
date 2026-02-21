import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useLoading } from '../../contexts/LoadingContext';
import productsApi from '../../api/productsApi';
import categoriesApi from '../../api/categoriesApi';
import suppliersApi from '../../api/suppliersApi';
import styles from './ProductsPage.module.css';

const ProductsPage = () => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const { withLoading } = useLoading();
    
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [filters, setFilters] = useState({
        search: '',
        category: '',
        supplier: '',
        status: '',
        lowStock: false
    });
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        loadProducts();
    }, [pagination.page, filters.category, filters.supplier, filters.status, filters.lowStock]);

    useEffect(() => {
        filterProducts();
    }, [filters.search, products]);

    const loadInitialData = async () => {
        try {
            const [categoriesRes, suppliersRes] = await withLoading(
                Promise.all([
                    categoriesApi.getAllCategories(),
                    suppliersApi.getAllSuppliers()
                ])
            );

            if (categoriesRes.success) {
                setCategories(categoriesRes.data);
            }
            if (suppliersRes.success) {
                setSuppliers(suppliersRes.data);
            }
        } catch (error) {
            showNotification('Error al cargar datos iniciales', 'error');
        }
    };

    const loadProducts = async () => {
        try {
            const response = await withLoading(
                productsApi.getProducts({
                    page: pagination.page,
                    limit: pagination.limit,
                    category: filters.category,
                    supplier: filters.supplier,
                    status: filters.status,
                    lowStock: filters.lowStock
                })
            );
            
            if (response.success) {
                setProducts(response.data);
                setPagination({
                    ...pagination,
                    total: response.total,
                    totalPages: response.totalPages
                });
            }
        } catch (error) {
            showNotification(error.message || 'Error al cargar productos', 'error');
        }
    };

    const filterProducts = () => {
        if (!filters.search.trim()) {
            setFilteredProducts(products);
            return;
        }

        const term = filters.search.toLowerCase();
        const filtered = products.filter(product => 
            product.name.toLowerCase().includes(term) ||
            product.sku?.toLowerCase().includes(term) ||
            product.barcode?.toLowerCase().includes(term) ||
            product.description?.toLowerCase().includes(term)
        );
        
        setFilteredProducts(filtered);
    };

    const handleFilterChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleSearch = (e) => {
        setFilters(prev => ({ ...prev, search: e.target.value }));
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            category: '',
            supplier: '',
            status: '',
            lowStock: false
        });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleCreate = () => {
        navigate('/products/create');
    };

    const handleEdit = (id) => {
        navigate(`/products/${id}/edit`);
    };

    const handleView = (id) => {
        navigate(`/products/${id}`);
    };

    const handleDeleteClick = (product) => {
        setSelectedProduct(product);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedProduct) return;

        try {
            const response = await withLoading(
                productsApi.deleteProduct(selectedProduct.id)
            );
            
            if (response.success) {
                showNotification('Producto eliminado exitosamente', 'success');
                loadProducts();
                setShowDeleteModal(false);
                setSelectedProduct(null);
            }
        } catch (error) {
            showNotification(error.message || 'Error al eliminar producto', 'error');
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setSelectedProduct(null);
    };

    const handleExport = async (format = 'csv') => {
        try {
            const blob = await withLoading(
                productsApi.exportProducts(format, filters)
            );
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `productos_export_${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showNotification('Productos exportados exitosamente', 'success');
        } catch (error) {
            showNotification('Error al exportar productos', 'error');
        }
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({
            ...prev,
            page: newPage
        }));
    };

    const getStockClass = (stock) => {
        if (stock <= 0) return styles.stockOut;
        if (stock < 10) return styles.stockLow;
        return styles.stockOk;
    };

    const getStatusClass = (isActive) => {
        return isActive ? styles.statusActive : styles.statusInactive;
    };

    return (
        <div className={styles.productsPage}>
            <div className={styles.header}>
                <h1 className={styles.title}>Productos</h1>
                <div className={styles.headerActions}>
                    <button 
                        className={styles.exportButton}
                        onClick={() => handleExport('csv')}
                    >
                        📥 Exportar
                    </button>
                    <button 
                        className={styles.createButton}
                        onClick={handleCreate}
                    >
                        <span className={styles.buttonIcon}>+</span>
                        Nuevo Producto
                    </button>
                </div>
            </div>

            <div className={styles.filters}>
                <div className={styles.searchBox}>
                    <input
                        type="text"
                        placeholder="Buscar productos por nombre, SKU o código..."
                        value={filters.search}
                        onChange={handleSearch}
                        className={styles.searchInput}
                    />
                    <span className={styles.searchIcon}>🔍</span>
                </div>

                <div className={styles.filterGrid}>
                    <select
                        name="category"
                        value={filters.category}
                        onChange={handleFilterChange}
                        className={styles.filterSelect}
                    >
                        <option value="">Todas las categorías</option>
                        {categories.map(category => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>

                    <select
                        name="supplier"
                        value={filters.supplier}
                        onChange={handleFilterChange}
                        className={styles.filterSelect}
                    >
                        <option value="">Todos los proveedores</option>
                        {suppliers.map(supplier => (
                            <option key={supplier.id} value={supplier.id}>
                                {supplier.name}
                            </option>
                        ))}
                    </select>

                    <select
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                        className={styles.filterSelect}
                    >
                        <option value="">Todos los estados</option>
                        <option value="active">Activos</option>
                        <option value="inactive">Inactivos</option>
                    </select>

                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            name="lowStock"
                            checked={filters.lowStock}
                            onChange={handleFilterChange}
                        />
                        <span>Stock bajo</span>
                    </label>

                    {(filters.category || filters.supplier || filters.status || filters.lowStock) && (
                        <button
                            onClick={clearFilters}
                            className={styles.clearFilters}
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Imagen</th>
                            <th>Nombre</th>
                            <th>SKU</th>
                            <th>Categoría</th>
                            <th>Proveedor</th>
                            <th>Precio</th>
                            <th>Stock</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map(product => (
                                <tr key={product.id} className={styles.tableRow}>
                                    <td>{product.id}</td>
                                    <td>
                                        <img 
                                            src={product.image || '/placeholder-product.png'} 
                                            alt={product.name}
                                            className={styles.productImage}
                                        />
                                    </td>
                                    <td className={styles.productName}>
                                        <span className={styles.nameText}>{product.name}</span>
                                    </td>
                                    <td className={styles.sku}>{product.sku || '-'}</td>
                                    <td>{product.category?.name || '-'}</td>
                                    <td>{product.supplier?.name || '-'}</td>
                                    <td className={styles.price}>
                                        ${product.price?.toFixed(2)}
                                    </td>
                                    <td>
                                        <span className={`${styles.stock} ${getStockClass(product.stock)}`}>
                                            {product.stock}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`${styles.status} ${getStatusClass(product.isActive)}`}>
                                            {product.isActive ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button
                                                className={`${styles.actionButton} ${styles.viewButton}`}
                                                onClick={() => handleView(product.id)}
                                                title="Ver detalles"
                                            >
                                                👁️
                                            </button>
                                            <button
                                                className={`${styles.actionButton} ${styles.editButton}`}
                                                onClick={() => handleEdit(product.id)}
                                                title="Editar"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className={`${styles.actionButton} ${styles.deleteButton}`}
                                                onClick={() => handleDeleteClick(product)}
                                                title="Eliminar"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="10" className={styles.emptyState}>
                                    {filters.search || filters.category || filters.supplier 
                                        ? 'No se encontraron productos con los filtros aplicados'
                                        : 'No hay productos disponibles'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {pagination.totalPages > 1 && (
                <div className={styles.pagination}>
                    <button
                        className={styles.pageButton}
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                    >
                        Anterior
                    </button>
                    
                    {[...Array(pagination.totalPages)].map((_, index) => (
                        <button
                            key={index + 1}
                            className={`${styles.pageButton} ${pagination.page === index + 1 ? styles.activePage : ''}`}
                            onClick={() => handlePageChange(index + 1)}
                        >
                            {index + 1}
                        </button>
                    ))}
                    
                    <button
                        className={styles.pageButton}
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                    >
                        Siguiente
                    </button>
                </div>
            )}

            {showDeleteModal && selectedProduct && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3 className={styles.modalTitle}>Confirmar Eliminación</h3>
                        <p className={styles.modalMessage}>
                            ¿Estás seguro de que deseas eliminar el producto "{selectedProduct.name}"?
                        </p>
                        <div className={styles.modalActions}>
                            <button
                                className={`${styles.modalButton} ${styles.cancelButton}`}
                                onClick={handleDeleteCancel}
                            >
                                Cancelar
                            </button>
                            <button
                                className={`${styles.modalButton} ${styles.confirmButton}`}
                                onClick={handleDeleteConfirm}
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductsPage;