import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useLoading } from '../../contexts/LoadingContext';
import suppliersApi from '../../api/suppliersApi';
import styles from './SuppliersPage.module.css';

const SupplierDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { showNotification } = useNotification();
    const { withLoading } = useLoading();

    const [supplier, setSupplier] = useState(null);
    const [products, setProducts] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [activeTab, setActiveTab] = useState('info');
    const [productPagination, setProductPagination] = useState({
        page: 1,
        limit: 10,
        total: 0
    });

    useEffect(() => {
        loadSupplierData();
    }, [id]);

    useEffect(() => {
        if (activeTab === 'products') {
            loadProducts();
        } else if (activeTab === 'contacts') {
            loadContacts();
        }
    }, [activeTab, productPagination.page]);

    const loadSupplierData = async () => {
        try {
            const response = await withLoading(suppliersApi.getSupplierById(id));
            if (response.success) {
                setSupplier(response.data);
            }
        } catch (error) {
            showNotification('Error al cargar los datos del proveedor', 'error');
            navigate('/suppliers');
        }
    };

    const loadProducts = async () => {
        try {
            const response = await withLoading(
                suppliersApi.getSupplierProducts(id, {
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

    const loadContacts = async () => {
        try {
            const response = await withLoading(suppliersApi.getSupplierContacts(id));
            if (response.success) {
                setContacts(response.data);
            }
        } catch (error) {
            showNotification('Error al cargar los contactos', 'error');
        }
    };

    const handleEdit = () => {
        navigate(`/suppliers/${id}/edit`);
    };

    const handleDelete = async () => {
        if (!window.confirm('¿Estás seguro de eliminar este proveedor?')) return;

        try {
            const response = await withLoading(suppliersApi.deleteSupplier(id));
            if (response.success) {
                showNotification('Proveedor eliminado exitosamente', 'success');
                navigate('/suppliers');
            }
        } catch (error) {
            showNotification(error.message || 'Error al eliminar el proveedor', 'error');
        }
    };

    const handleToggleStatus = async () => {
        try {
            const response = await withLoading(
                suppliersApi.toggleSupplierStatus(id, !supplier.isActive)
            );
            if (response.success) {
                setSupplier(prev => ({ ...prev, isActive: !prev.isActive }));
                showNotification(
                    `Proveedor ${!supplier.isActive ? 'activado' : 'desactivado'} exitosamente`,
                    'success'
                );
            }
        } catch (error) {
            showNotification('Error al cambiar el estado del proveedor', 'error');
        }
    };

    const handleProductPageChange = (newPage) => {
        setProductPagination(prev => ({
            ...prev,
            page: newPage
        }));
    };

    if (!supplier) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Cargando proveedor...</p>
            </div>
        );
    }

    return (
        <div className={styles.supplierDetail}>
            <div className={styles.header}>
                <h1 className={styles.title}>{supplier.name}</h1>
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
                            supplier.isActive ? styles.deactivateButton : styles.activateButton
                        }`}
                    >
                        {supplier.isActive ? '🔴 Desactivar' : '🟢 Activar'}
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
                    className={`${styles.tab} ${activeTab === 'contacts' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('contacts')}
                >
                    Contactos ({contacts.length})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'products' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('products')}
                >
                    Productos ({productPagination.total})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'purchases' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('purchases')}
                >
                    Historial de Compras
                </button>
            </div>

            <div className={styles.tabContent}>
                {activeTab === 'info' && (
                    <div className={styles.infoGrid}>
                        <div className={styles.infoCard}>
                            <h3>Información de Contacto</h3>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Email:</span>
                                <span className={styles.infoValue}>
                                    <a href={`mailto:${supplier.email}`}>{supplier.email}</a>
                                </span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Teléfono:</span>
                                <span className={styles.infoValue}>
                                    <a href={`tel:${supplier.phone}`}>{supplier.phone}</a>
                                </span>
                            </div>
                            {supplier.website && (
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Sitio Web:</span>
                                    <span className={styles.infoValue}>
                                        <a href={supplier.website} target="_blank" rel="noopener noreferrer">
                                            {supplier.website}
                                        </a>
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className={styles.infoCard}>
                            <h3>Información Fiscal</h3>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>RFC:</span>
                                <span className={styles.infoValue}>{supplier.rfc || 'No especificado'}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Razón Social:</span>
                                <span className={styles.infoValue}>{supplier.businessName || supplier.name}</span>
                            </div>
                        </div>

                        <div className={styles.infoCard}>
                            <h3>Dirección</h3>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Calle:</span>
                                <span className={styles.infoValue}>{supplier.address?.street || 'No especificada'}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Colonia:</span>
                                <span className={styles.infoValue}>{supplier.address?.colony || '-'}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Ciudad:</span>
                                <span className={styles.infoValue}>{supplier.address?.city || '-'}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Estado:</span>
                                <span className={styles.infoValue}>{supplier.address?.state || '-'}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Código Postal:</span>
                                <span className={styles.infoValue}>{supplier.address?.zipCode || '-'}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>País:</span>
                                <span className={styles.infoValue}>{supplier.address?.country || 'México'}</span>
                            </div>
                        </div>

                        <div className={styles.infoCard}>
                            <h3>Información Adicional</h3>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Estado:</span>
                                <span className={`${styles.status} ${
                                    supplier.isActive ? styles.statusActive : styles.statusInactive
                                }`}>
                                    {supplier.isActive ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Fecha Registro:</span>
                                <span className={styles.infoValue}>
                                    {new Date(supplier.createdAt).toLocaleString()}
                                </span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Última Actualización:</span>
                                <span className={styles.infoValue}>
                                    {new Date(supplier.updatedAt).toLocaleString()}
                                </span>
                            </div>
                            {supplier.notes && (
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Notas:</span>
                                    <span className={styles.infoValue}>{supplier.notes}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'contacts' && (
                    <div className={styles.contactsSection}>
                        {contacts.length > 0 ? (
                            <div className={styles.contactsGrid}>
                                {contacts.map(contact => (
                                    <div key={contact.id} className={styles.contactCard}>
                                        <h4>{contact.name}</h4>
                                        <p className={styles.contactPosition}>{contact.position}</p>
                                        <div className={styles.contactDetails}>
                                            <p>📧 {contact.email}</p>
                                            <p>📞 {contact.phone}</p>
                                            {contact.mobile && <p>📱 {contact.mobile}</p>}
                                        </div>
                                        {contact.isPrimary && (
                                            <span className={styles.primaryBadge}>Contacto Principal</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <p>No hay contactos registrados</p>
                                <button
                                    onClick={() => navigate(`/suppliers/${id}/contacts/add`)}
                                    className={styles.addButton}
                                >
                                    Agregar Contacto
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'products' && (
                    <div className={styles.productsSection}>
                        {products.length > 0 ? (
                            <>
                                <table className={styles.productsTable}>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Nombre</th>
                                            <th>SKU</th>
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
                                                <td>{product.sku}</td>
                                                <td>${product.price?.toFixed(2)}</td>
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
                                <p>No hay productos de este proveedor</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'purchases' && (
                    <div className={styles.purchasesSection}>
                        <div className={styles.statsCards}>
                            <div className={styles.statCard}>
                                <span className={styles.statValue}>$0.00</span>
                                <span className={styles.statLabel}>Total Compras</span>
                            </div>
                            <div className={styles.statCard}>
                                <span className={styles.statValue}>0</span>
                                <span className={styles.statLabel}>Órdenes</span>
                            </div>
                            <div className={styles.statCard}>
                                <span className={styles.statValue}>0</span>
                                <span className={styles.statLabel}>Productos</span>
                            </div>
                        </div>

                        <div className={styles.emptyState}>
                            <p>No hay historial de compras disponible</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupplierDetail;