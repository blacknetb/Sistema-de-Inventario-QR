import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useLoading } from '../../contexts/LoadingContext';
import categoriesApi from '../../api/categoriesApi';
import styles from './CategoriesPage.module.css';

const CategoryDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { showNotification } = useNotification();
    const { withLoading } = useLoading();

    const [category, setCategory] = useState(null);
    const [products, setProducts] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [activeTab, setActiveTab] = useState('info');
    const [productPagination, setProductPagination] = useState({
        page: 1,
        limit: 10,
        total: 0
    });

    useEffect(() => {
        loadCategoryData();
    }, [id]);

    useEffect(() => {
        if (activeTab === 'products') {
            loadProducts();
        }
    }, [activeTab, productPagination.page]);

    const loadCategoryData = async () => {
        try {
            const [categoryRes, subcategoriesRes] = await withLoading(
                Promise.all([
                    categoriesApi.getCategoryById(id),
                    categoriesApi.getSubcategories(id)
                ])
            );

            if (categoryRes.success) {
                setCategory(categoryRes.data);
            }

            if (subcategoriesRes.success) {
                setSubcategories(subcategoriesRes.data);
            }
        } catch (error) {
            showNotification('Error al cargar los datos de la categoría', 'error');
            navigate('/categories');
        }
    };

    const loadProducts = async () => {
        try {
            const response = await withLoading(
                categoriesApi.getCategoryProducts(id, {
                    page: productPagination.page,
                    limit: productPagination.limit
                })
            );

            if (response.success) {
                setProducts(response.data);
                setProductPagination(prev => ({
                    ...prev,
                    total: response.total
                }));
            }
        } catch (error) {
            showNotification('Error al cargar los productos', 'error');
        }
    };

    const handleEdit = () => {
        navigate(`/categories/${id}/edit`);
    };

    const handleDelete = async () => {
        if (!window.confirm('¿Estás seguro de eliminar esta categoría?')) return;

        try {
            const response = await withLoading(categoriesApi.deleteCategory(id));
            if (response.success) {
                showNotification('Categoría eliminada exitosamente', 'success');
                navigate('/categories');
            }
        } catch (error) {
            showNotification(error.message || 'Error al eliminar la categoría', 'error');
        }
    };

    const handleToggleStatus = async () => {
        try {
            const response = await withLoading(
                categoriesApi.toggleCategoryStatus(id, !category.isActive)
            );
            if (response.success) {
                setCategory(prev => ({ ...prev, isActive: !prev.isActive }));
                showNotification(
                    `Categoría ${!category.isActive ? 'activada' : 'desactivada'} exitosamente`,
                    'success'
                );
            }
        } catch (error) {
            showNotification('Error al cambiar el estado de la categoría', 'error');
        }
    };

    const handleProductPageChange = (newPage) => {
        setProductPagination(prev => ({
            ...prev,
            page: newPage
        }));
    };

    if (!category) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Cargando categoría...</p>
            </div>
        );
    }

    return (
        <div className={styles.categoryDetail}>
            <div className={styles.header}>
                <h1 className={styles.title}>{category.name}</h1>
                <div className={styles.headerActions}>
                    <button
                        onClick={handleEdit}
                        className={`${styles.actionButton} ${styles.editButton}`}
                    >
                        ✏️ Editar
                    </button>
                    <button
                        onClick={handleToggleStatus}
                        className={`${styles.actionButton} ${
                            category.isActive ? styles.deactivateButton : styles.activateButton
                        }`}
                    >
                        {category.isActive ? '🔴 Desactivar' : '🟢 Activar'}
                    </button>
                    <button
                        onClick={handleDelete}
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                    >
                        🗑️ Eliminar
                    </button>
                </div>
            </div>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'info' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('info')}
                >
                    Información General
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'subcategories' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('subcategories')}
                >
                    Subcategorías ({subcategories.length})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'products' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('products')}
                >
                    Productos ({productPagination.total})
                </button>
            </div>

            <div className={styles.tabContent}>
                {activeTab === 'info' && (
                    <div className={styles.infoGrid}>
                        <div className={styles.infoCard}>
                            <h3>Detalles de la Categoría</h3>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>ID:</span>
                                <span className={styles.infoValue}>{category.id}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Nombre:</span>
                                <span className={styles.infoValue}>{category.name}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Descripción:</span>
                                <span className={styles.infoValue}>
                                    {category.description || 'Sin descripción'}
                                </span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Categoría Padre:</span>
                                <span className={styles.infoValue}>
                                    {category.parent ? (
                                        <Link to={`/categories/${category.parent.id}`}>
                                            {category.parent.name}
                                        </Link>
                                    ) : 'Ninguna (Principal)'}
                                </span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Estado:</span>
                                <span className={`${styles.status} ${
                                    category.isActive ? styles.statusActive : styles.statusInactive
                                }`}>
                                    {category.isActive ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Fecha Creación:</span>
                                <span className={styles.infoValue}>
                                    {new Date(category.createdAt).toLocaleString()}
                                </span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Última Actualización:</span>
                                <span className={styles.infoValue}>
                                    {new Date(category.updatedAt).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className={styles.statsCard}>
                            <h3>Estadísticas</h3>
                            <div className={styles.statsGrid}>
                                <div className={styles.statBox}>
                                    <span className={styles.statValue}>
                                        {category.productCount || 0}
                                    </span>
                                    <span className={styles.statLabel}>Productos</span>
                                </div>
                                <div className={styles.statBox}>
                                    <span className={styles.statValue}>
                                        {subcategories.length}
                                    </span>
                                    <span className={styles.statLabel}>Subcategorías</span>
                                </div>
                                <div className={styles.statBox}>
                                    <span className={styles.statValue}>
                                        {category.productCount ? 
                                            category.productCount.toLocaleString() : '0'
                                        }
                                    </span>
                                    <span className={styles.statLabel}>Stock Total</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'subcategories' && (
                    <div className={styles.subcategoriesList}>
                        {subcategories.length > 0 ? (
                            subcategories.map(sub => (
                                <Link
                                    key={sub.id}
                                    to={`/categories/${sub.id}`}
                                    className={styles.subcategoryCard}
                                >
                                    <h4>{sub.name}</h4>
                                    <p>{sub.description || 'Sin descripción'}</p>
                                    <div className={styles.subcategoryMeta}>
                                        <span className={styles.productCount}>
                                            {sub.productCount || 0} productos
                                        </span>
                                        <span className={`${styles.status} ${
                                            sub.isActive ? styles.statusActive : styles.statusInactive
                                        }`}>
                                            {sub.isActive ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className={styles.emptyState}>
                                <p>No hay subcategorías</p>
                                <button
                                    onClick={() => navigate('/categories/create', { 
                                        state: { parentId: category.id } 
                                    })}
                                    className={styles.createButton}
                                >
                                    Crear Subcategoría
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'products' && (
                    <div className={styles.productsList}>
                        {products.length > 0 ? (
                            <>
                                <table className={styles.productsTable}>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Nombre</th>
                                            <th>Precio</th>
                                            <th>Stock</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map(product => (
                                            <tr key={product.id}>
                                                <td>{product.id}</td>
                                                <td>
                                                    <Link to={`/products/${product.id}`}>
                                                        {product.name}
                                                    </Link>
                                                </td>
                                                <td>${product.price.toFixed(2)}</td>
                                                <td className={
                                                    product.stock < 10 ? styles.lowStock : ''
                                                }>
                                                    {product.stock}
                                                </td>
                                                <td>
                                                    <span className={`${styles.status} ${
                                                        product.isActive ? styles.statusActive : styles.statusInactive
                                                    }`}>
                                                        {product.isActive ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => navigate(`/products/${product.id}`)}
                                                        className={styles.viewButton}
                                                    >
                                                        Ver
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {productPagination.total > productPagination.limit && (
                                    <div className={styles.pagination}>
                                        <button
                                            onClick={() => handleProductPageChange(productPagination.page - 1)}
                                            disabled={productPagination.page === 1}
                                            className={styles.pageButton}
                                        >
                                            Anterior
                                        </button>
                                        <span className={styles.pageInfo}>
                                            Página {productPagination.page} de {
                                                Math.ceil(productPagination.total / productPagination.limit)
                                            }
                                        </span>
                                        <button
                                            onClick={() => handleProductPageChange(productPagination.page + 1)}
                                            disabled={
                                                productPagination.page === 
                                                Math.ceil(productPagination.total / productPagination.limit)
                                            }
                                            className={styles.pageButton}
                                        >
                                            Siguiente
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className={styles.emptyState}>
                                <p>No hay productos en esta categoría</p>
                                <button
                                    onClick={() => navigate('/products/create', { 
                                        state: { categoryId: category.id } 
                                    })}
                                    className={styles.createButton}
                                >
                                    Crear Producto
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryDetail;