import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useLoading } from '../../contexts/LoadingContext';
import categoriesApi from '../../api/categoriesApi';
import styles from './CategoriesPage.module.css';

const CategoriesPage = () => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const { withLoading } = useLoading();
    
    const [categories, setCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });

    useEffect(() => {
        loadCategories();
    }, [pagination.page]);

    useEffect(() => {
        filterCategories();
    }, [searchTerm, categories]);

    const loadCategories = async () => {
        try {
            const response = await withLoading(
                categoriesApi.getCategories({
                    page: pagination.page,
                    limit: pagination.limit
                })
            );
            
            if (response.success) {
                setCategories(response.data);
                setPagination({
                    ...pagination,
                    total: response.total,
                    totalPages: response.totalPages
                });
            }
        } catch (error) {
            showNotification(error.message || 'Error al cargar categorías', 'error');
        }
    };

    const filterCategories = () => {
        if (!searchTerm.trim()) {
            setFilteredCategories(categories);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = categories.filter(category => 
            category.name.toLowerCase().includes(term) ||
            category.description?.toLowerCase().includes(term)
        );
        
        setFilteredCategories(filtered);
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleCreate = () => {
        navigate('/categories/create');
    };

    const handleEdit = (id) => {
        navigate(`/categories/${id}/edit`);
    };

    const handleView = (id) => {
        navigate(`/categories/${id}`);
    };

    const handleDeleteClick = (category) => {
        setSelectedCategory(category);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedCategory) return;

        try {
            const response = await withLoading(
                categoriesApi.deleteCategory(selectedCategory.id)
            );
            
            if (response.success) {
                showNotification('Categoría eliminada exitosamente', 'success');
                loadCategories();
                setShowDeleteModal(false);
                setSelectedCategory(null);
            }
        } catch (error) {
            showNotification(error.message || 'Error al eliminar categoría', 'error');
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setSelectedCategory(null);
    };

    const handlePageChange = (newPage) => {
        setPagination({
            ...pagination,
            page: newPage
        });
    };

    const getStatusClass = (isActive) => {
        return isActive ? styles.statusActive : styles.statusInactive;
    };

    const getStatusText = (isActive) => {
        return isActive ? 'Activo' : 'Inactivo';
    };

    return (
        <div className={styles.categoriesPage}>
            <div className={styles.header}>
                <h1 className={styles.title}>Categorías</h1>
                <button 
                    className={styles.createButton}
                    onClick={handleCreate}
                >
                    <span className={styles.buttonIcon}>+</span>
                    Nueva Categoría
                </button>
            </div>

            <div className={styles.filters}>
                <div className={styles.searchBox}>
                    <input
                        type="text"
                        placeholder="Buscar categorías..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className={styles.searchInput}
                    />
                    <span className={styles.searchIcon}>🔍</span>
                </div>
                
                <div className={styles.stats}>
                    <span className={styles.statItem}>
                        Total: {pagination.total}
                    </span>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Descripción</th>
                            <th>Categoría Padre</th>
                            <th># Productos</th>
                            <th>Estado</th>
                            <th>Fecha Creación</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCategories.length > 0 ? (
                            filteredCategories.map(category => (
                                <tr key={category.id} className={styles.tableRow}>
                                    <td>{category.id}</td>
                                    <td className={styles.categoryName}>
                                        <span className={styles.nameText}>{category.name}</span>
                                    </td>
                                    <td className={styles.description}>
                                        {category.description || '-'}
                                    </td>
                                    <td>{category.parent?.name || '-'}</td>
                                    <td className={styles.productCount}>
                                        {category.productCount || 0}
                                    </td>
                                    <td>
                                        <span className={`${styles.status} ${getStatusClass(category.isActive)}`}>
                                            {getStatusText(category.isActive)}
                                        </span>
                                    </td>
                                    <td>
                                        {new Date(category.createdAt).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button
                                                className={`${styles.actionButton} ${styles.viewButton}`}
                                                onClick={() => handleView(category.id)}
                                                title="Ver detalles"
                                            >
                                                👁️
                                            </button>
                                            <button
                                                className={`${styles.actionButton} ${styles.editButton}`}
                                                onClick={() => handleEdit(category.id)}
                                                title="Editar"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className={`${styles.actionButton} ${styles.deleteButton}`}
                                                onClick={() => handleDeleteClick(category)}
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
                                <td colSpan="8" className={styles.emptyState}>
                                    {searchTerm ? 'No se encontraron categorías' : 'No hay categorías disponibles'}
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

            {showDeleteModal && selectedCategory && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3 className={styles.modalTitle}>Confirmar Eliminación</h3>
                        <p className={styles.modalMessage}>
                            ¿Estás seguro de que deseas eliminar la categoría "{selectedCategory.name}"?
                            {selectedCategory.productCount > 0 && (
                                <span className={styles.warning}>
                                    <br />
                                    ⚠️ Esta categoría tiene {selectedCategory.productCount} productos asociados.
                                </span>
                            )}
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

export default CategoriesPage;