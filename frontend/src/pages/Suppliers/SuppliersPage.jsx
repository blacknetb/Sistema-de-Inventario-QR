import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useLoading } from '../../contexts/LoadingContext';
import suppliersApi from '../../api/suppliersApi';
import styles from './SuppliersPage.module.css';

const SuppliersPage = () => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const { withLoading } = useLoading();
    
    const [suppliers, setSuppliers] = useState([]);
    const [filteredSuppliers, setFilteredSuppliers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });

    useEffect(() => {
        loadSuppliers();
    }, [pagination.page]);

    useEffect(() => {
        filterSuppliers();
    }, [searchTerm, suppliers]);

    const loadSuppliers = async () => {
        try {
            const response = await withLoading(
                suppliersApi.getSuppliers({
                    page: pagination.page,
                    limit: pagination.limit
                })
            );
            
            if (response.success) {
                setSuppliers(response.data);
                setPagination({
                    ...pagination,
                    total: response.total,
                    totalPages: response.totalPages
                });
            }
        } catch (error) {
            showNotification(error.message || 'Error al cargar proveedores', 'error');
        }
    };

    const filterSuppliers = () => {
        if (!searchTerm.trim()) {
            setFilteredSuppliers(suppliers);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = suppliers.filter(supplier => 
            supplier.name.toLowerCase().includes(term) ||
            supplier.email?.toLowerCase().includes(term) ||
            supplier.phone?.toLowerCase().includes(term) ||
            supplier.rfc?.toLowerCase().includes(term)
        );
        
        setFilteredSuppliers(filtered);
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleCreate = () => {
        navigate('/suppliers/create');
    };

    const handleEdit = (id) => {
        navigate(`/suppliers/${id}/edit`);
    };

    const handleView = (id) => {
        navigate(`/suppliers/${id}`);
    };

    const handleDeleteClick = (supplier) => {
        setSelectedSupplier(supplier);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedSupplier) return;

        try {
            const response = await withLoading(
                suppliersApi.deleteSupplier(selectedSupplier.id)
            );
            
            if (response.success) {
                showNotification('Proveedor eliminado exitosamente', 'success');
                loadSuppliers();
                setShowDeleteModal(false);
                setSelectedSupplier(null);
            }
        } catch (error) {
            showNotification(error.message || 'Error al eliminar proveedor', 'error');
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setSelectedSupplier(null);
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            const response = await withLoading(
                suppliersApi.toggleSupplierStatus(id, !currentStatus)
            );
            
            if (response.success) {
                showNotification(
                    `Proveedor ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`,
                    'success'
                );
                loadSuppliers();
            }
        } catch (error) {
            showNotification('Error al cambiar estado del proveedor', 'error');
        }
    };

    const handleExport = async () => {
        try {
            const blob = await withLoading(suppliersApi.exportSuppliers('csv'));
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `proveedores_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showNotification('Proveedores exportados exitosamente', 'success');
        } catch (error) {
            showNotification('Error al exportar proveedores', 'error');
        }
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({
            ...prev,
            page: newPage
        }));
    };

    const getStatusClass = (isActive) => {
        return isActive ? styles.statusActive : styles.statusInactive;
    };

    return (
        <div className={styles.suppliersPage}>
            <div className={styles.header}>
                <h1 className={styles.title}>Proveedores</h1>
                <div className={styles.headerActions}>
                    <button 
                        className={styles.exportButton}
                        onClick={handleExport}
                    >
                        📥 Exportar
                    </button>
                    <button 
                        className={styles.createButton}
                        onClick={handleCreate}
                    >
                        <span className={styles.buttonIcon}>+</span>
                        Nuevo Proveedor
                    </button>
                </div>
            </div>

            <div className={styles.filters}>
                <div className={styles.searchBox}>
                    <input
                        type="text"
                        placeholder="Buscar proveedores por nombre, email, teléfono..."
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
                    <span className={styles.statItem}>
                        Activos: {suppliers.filter(s => s.isActive).length}
                    </span>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Teléfono</th>
                            <th>RFC</th>
                            <th>Productos</th>
                            <th>Estado</th>
                            <th>Fecha Registro</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSuppliers.length > 0 ? (
                            filteredSuppliers.map(supplier => (
                                <tr key={supplier.id} className={styles.tableRow}>
                                    <td>{supplier.id}</td>
                                    <td className={styles.supplierName}>
                                        <span className={styles.nameText}>{supplier.name}</span>
                                    </td>
                                    <td>
                                        <a href={`mailto:${supplier.email}`} className={styles.emailLink}>
                                            {supplier.email}
                                        </a>
                                    </td>
                                    <td>
                                        <a href={`tel:${supplier.phone}`} className={styles.phoneLink}>
                                            {supplier.phone}
                                        </a>
                                    </td>
                                    <td className={styles.rfc}>{supplier.rfc || '-'}</td>
                                    <td className={styles.productCount}>
                                        {supplier.productCount || 0}
                                    </td>
                                    <td>
                                        <span className={`${styles.status} ${getStatusClass(supplier.isActive)}`}>
                                            {supplier.isActive ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td>
                                        {new Date(supplier.createdAt).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button
                                                className={`${styles.actionButton} ${styles.viewButton}`}
                                                onClick={() => handleView(supplier.id)}
                                                title="Ver detalles"
                                            >
                                                👁️
                                            </button>
                                            <button
                                                className={`${styles.actionButton} ${styles.editButton}`}
                                                onClick={() => handleEdit(supplier.id)}
                                                title="Editar"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className={`${styles.actionButton} ${
                                                    supplier.isActive ? styles.deactivateButton : styles.activateButton
                                                }`}
                                                onClick={() => handleToggleStatus(supplier.id, supplier.isActive)}
                                                title={supplier.isActive ? 'Desactivar' : 'Activar'}
                                            >
                                                {supplier.isActive ? '🔴' : '🟢'}
                                            </button>
                                            <button
                                                className={`${styles.actionButton} ${styles.deleteButton}`}
                                                onClick={() => handleDeleteClick(supplier)}
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
                                <td colSpan="9" className={styles.emptyState}>
                                    {searchTerm ? 'No se encontraron proveedores' : 'No hay proveedores disponibles'}
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

            {showDeleteModal && selectedSupplier && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3 className={styles.modalTitle}>Confirmar Eliminación</h3>
                        <p className={styles.modalMessage}>
                            ¿Estás seguro de que deseas eliminar el proveedor "{selectedSupplier.name}"?
                            {selectedSupplier.productCount > 0 && (
                                <span className={styles.warning}>
                                    <br />
                                    ⚠️ Este proveedor tiene {selectedSupplier.productCount} productos asociados.
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

export default SuppliersPage;