import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useLoading } from '../../contexts/LoadingContext';
import productsApi from '../../api/productsApi';
import qrApi from '../../api/qrApi';
import styles from './ProductsPage.module.css';

const ProductDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { showNotification } = useNotification();
    const { withLoading } = useLoading();

    const [product, setProduct] = useState(null);
    const [qrCode, setQrCode] = useState(null);
    const [activeTab, setActiveTab] = useState('info');
    const [movements, setMovements] = useState([]);
    const [movementPagination, setMovementPagination] = useState({
        page: 1,
        limit: 10,
        total: 0
    });

    useEffect(() => {
        loadProductData();
    }, [id]);

    useEffect(() => {
        if (activeTab === 'movements') {
            loadMovements();
        }
    }, [activeTab, movementPagination.page]);

    const loadProductData = async () => {
        try {
            const productRes = await withLoading(productsApi.getProductById(id));
            
            if (productRes.success) {
                setProduct(productRes.data);
                
                // Load QR code if exists
                if (productRes.data.qrCode) {
                    const qrRes = await qrApi.getProductQR(id);
                    if (qrRes.success) {
                        setQrCode(qrRes.data);
                    }
                }
            }
        } catch (error) {
            showNotification('Error al cargar los datos del producto', 'error');
            navigate('/products');
        }
    };

    const loadMovements = async () => {
        try {
            const response = await withLoading(
                productsApi.getProductHistory(id, {
                    page: movementPagination.page,
                    limit: movementPagination.limit
                })
            );

            if (response.success) {
                setMovements(response.data);
                setMovementPagination(prev => ({
                    ...prev,
                    total: response.total
                }));
            }
        } catch (error) {
            showNotification('Error al cargar el historial de movimientos', 'error');
        }
    };

    const handleEdit = () => {
        navigate(`/products/${id}/edit`);
    };

    const handleDelete = async () => {
        if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;

        try {
            const response = await withLoading(productsApi.deleteProduct(id));
            if (response.success) {
                showNotification('Producto eliminado exitosamente', 'success');
                navigate('/products');
            }
        } catch (error) {
            showNotification(error.message || 'Error al eliminar el producto', 'error');
        }
    };

    const handleToggleStatus = async () => {
        try {
            const response = await withLoading(
                productsApi.updateProduct(id, { isActive: !product.isActive })
            );
            if (response.success) {
                setProduct(prev => ({ ...prev, isActive: !prev.isActive }));
                showNotification(
                    `Producto ${!product.isActive ? 'activado' : 'desactivado'} exitosamente`,
                    'success'
                );
            }
        } catch (error) {
            showNotification('Error al cambiar el estado del producto', 'error');
        }
    };

    const handleGenerateQR = async () => {
        try {
            const response = await withLoading(qrApi.generateProductQR(id));
            if (response.success) {
                setQrCode(response.data);
                showNotification('Código QR generado exitosamente', 'success');
            }
        } catch (error) {
            showNotification('Error al generar el código QR', 'error');
        }
    };

    const handleDownloadQR = async () => {
        try {
            const blob = await withLoading(qrApi.downloadProductQR(id));
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `qr_${product.sku || product.id}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            showNotification('Error al descargar el código QR', 'error');
        }
    };

    const handleMovementPageChange = (newPage) => {
        setMovementPagination(prev => ({
            ...prev,
            page: newPage
        }));
    };

    if (!product) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Cargando producto...</p>
            </div>
        );
    }

    return (
        <div className={styles.productDetail}>
            <div className={styles.header}>
                <h1 className={styles.title}>{product.name}</h1>
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
                            product.isActive ? styles.deactivateButton : styles.activateButton
                        }`}
                    >
                        {product.isActive ? '🔴 Desactivar' : '🟢 Activar'}
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
                    className={`${styles.tab} ${activeTab === 'qr' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('qr')}
                >
                    Código QR
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'movements' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('movements')}
                >
                    Historial de Movimientos
                </button>
            </div>

            <div className={styles.tabContent}>
                {activeTab === 'info' && (
                    <div className={styles.infoGrid}>
                        <div className={styles.infoCard}>
                            <h3>Detalles del Producto</h3>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>ID:</span>
                                <span className={styles.infoValue}>{product.id}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Nombre:</span>
                                <span className={styles.infoValue}>{product.name}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>SKU:</span>
                                <span className={styles.infoValue}>{product.sku || '-'}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Código de Barras:</span>
                                <span className={styles.infoValue}>{product.barcode || '-'}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Descripción:</span>
                                <span className={styles.infoValue}>
                                    {product.description || 'Sin descripción'}
                                </span>
                            </div>
                        </div>

                        <div className={styles.infoCard}>
                            <h3>Precios y Stock</h3>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Precio de Compra:</span>
                                <span className={styles.infoValue}>
                                    ${product.purchasePrice?.toFixed(2) || '0.00'}
                                </span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Precio de Venta:</span>
                                <span className={styles.infoValue}>
                                    ${product.price?.toFixed(2)}
                                </span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Stock Actual:</span>
                                <span className={`${styles.infoValue} ${
                                    product.stock < 10 ? styles.stockLow : ''
                                }`}>
                                    {product.stock}
                                </span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Stock Mínimo:</span>
                                <span className={styles.infoValue}>{product.minStock || 0}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Stock Máximo:</span>
                                <span className={styles.infoValue}>{product.maxStock || 0}</span>
                            </div>
                        </div>

                        <div className={styles.infoCard}>
                            <h3>Categoría y Proveedor</h3>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Categoría:</span>
                                <span className={styles.infoValue}>
                                    {product.category ? (
                                        <Link to={`/categories/${product.category.id}`}>
                                            {product.category.name}
                                        </Link>
                                    ) : 'Sin categoría'}
                                </span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Proveedor:</span>
                                <span className={styles.infoValue}>
                                    {product.supplier ? (
                                        <Link to={`/suppliers/${product.supplier.id}`}>
                                            {product.supplier.name}
                                        </Link>
                                    ) : 'Sin proveedor'}
                                </span>
                            </div>
                        </div>

                        <div className={styles.infoCard}>
                            <h3>Fechas</h3>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Fecha de Creación:</span>
                                <span className={styles.infoValue}>
                                    {new Date(product.createdAt).toLocaleString()}
                                </span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Última Actualización:</span>
                                <span className={styles.infoValue}>
                                    {new Date(product.updatedAt).toLocaleString()}
                                </span>
                            </div>
                            {product.expiryDate && (
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Fecha de Vencimiento:</span>
                                    <span className={`${styles.infoValue} ${
                                        new Date(product.expiryDate) < new Date() ? styles.expired : ''
                                    }`}>
                                        {new Date(product.expiryDate).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'qr' && (
                    <div className={styles.qrSection}>
                        <div className={styles.qrCard}>
                            <h3>Código QR del Producto</h3>
                            
                            {qrCode ? (
                                <>
                                    <div className={styles.qrImage}>
                                        <img 
                                            src={qrCode.imageUrl || `/api/qr/products/${id}/image`} 
                                            alt={`QR de ${product.name}`}
                                        />
                                    </div>
                                    <div className={styles.qrActions}>
                                        <button
                                            onClick={handleDownloadQR}
                                            className={styles.qrButton}
                                        >
                                            📥 Descargar QR
                                        </button>
                                        <button
                                            onClick={handleGenerateQR}
                                            className={styles.qrButton}
                                        >
                                            🔄 Regenerar QR
                                        </button>
                                    </div>
                                    <p className={styles.qrInfo}>
                                        Este código QR puede ser escaneado para acceder rápidamente
                                        a la información del producto.
                                    </p>
                                </>
                            ) : (
                                <div className={styles.noQr}>
                                    <p>Este producto aún no tiene un código QR generado.</p>
                                    <button
                                        onClick={handleGenerateQR}
                                        className={styles.generateQrButton}
                                    >
                                        Generar Código QR
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'movements' && (
                    <div className={styles.movementsSection}>
                        <h3>Historial de Movimientos</h3>
                        
                        {movements.length > 0 ? (
                            <>
                                <table className={styles.movementsTable}>
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Tipo</th>
                                            <th>Cantidad</th>
                                            <th>Stock Anterior</th>
                                            <th>Stock Nuevo</th>
                                            <th>Razón</th>
                                            <th>Usuario</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {movements.map(movement => (
                                            <tr key={movement.id}>
                                                <td>
                                                    {new Date(movement.createdAt).toLocaleString()}
                                                </td>
                                                <td>
                                                    <span className={`${styles.movementType} ${
                                                        styles[`movement${movement.type}`]
                                                    }`}>
                                                        {movement.type === 'add' ? '➕ Entrada' :
                                                         movement.type === 'remove' ? '➖ Salida' :
                                                         movement.type === 'adjust' ? '⚖️ Ajuste' :
                                                         movement.type}
                                                    </span>
                                                </td>
                                                <td className={styles.movementQuantity}>
                                                    {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
                                                </td>
                                                <td>{movement.previousStock}</td>
                                                <td>{movement.newStock}</td>
                                                <td>{movement.reason || '-'}</td>
                                                <td>{movement.user?.name || 'Sistema'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {movementPagination.total > movementPagination.limit && (
                                    <div className={styles.pagination}>
                                        <button
                                            onClick={() => handleMovementPageChange(movementPagination.page - 1)}
                                            disabled={movementPagination.page === 1}
                                            className={styles.pageButton}
                                        >
                                            Anterior
                                        </button>
                                        <span className={styles.pageInfo}>
                                            Página {movementPagination.page} de {
                                                Math.ceil(movementPagination.total / movementPagination.limit)
                                            }
                                        </span>
                                        <button
                                            onClick={() => handleMovementPageChange(movementPagination.page + 1)}
                                            disabled={
                                                movementPagination.page === 
                                                Math.ceil(movementPagination.total / movementPagination.limit)
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
                                <p>No hay movimientos registrados para este producto.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDetail;