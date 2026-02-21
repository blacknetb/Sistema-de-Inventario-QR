import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useLoading } from '../../contexts/LoadingContext';
import reportsApi from '../../api/reportsApi';
import { REPORT_TYPES, REPORT_TYPES_LABELS } from '../../utils/constants';
import styles from './ReportsPage.module.css';

const ReportGenerator = () => {
    const { type } = useParams();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const { withLoading } = useLoading();

    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [parameters, setParameters] = useState({});

    useEffect(() => {
        generateReport();
    }, [type]);

    const generateReport = async () => {
        setLoading(true);
        try {
            let response;
            switch (type) {
                case REPORT_TYPES.INVENTORY:
                    response = await withLoading(reportsApi.generateInventoryReport(parameters));
                    break;
                case REPORT_TYPES.MOVEMENTS:
                    response = await withLoading(reportsApi.generateMovementsReport(parameters));
                    break;
                case REPORT_TYPES.SALES:
                    response = await withLoading(reportsApi.generateSalesReport(parameters));
                    break;
                case REPORT_TYPES.PRODUCTS:
                    response = await withLoading(reportsApi.generateProductsReport(parameters));
                    break;
                case REPORT_TYPES.SUPPLIERS:
                    response = await withLoading(reportsApi.generateSuppliersReport(parameters));
                    break;
                case REPORT_TYPES.EXPIRY:
                    response = await withLoading(reportsApi.generateExpiryReport(parameters));
                    break;
                case REPORT_TYPES.LOW_STOCK:
                    response = await withLoading(reportsApi.generateLowStockReport(parameters));
                    break;
                default:
                    response = await withLoading(reportsApi.generateInventoryReport(parameters));
            }

            if (response.success) {
                setReportData(response.data);
            }
        } catch (error) {
            showNotification('Error al generar el reporte', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format) => {
        try {
            const blob = await withLoading(reportsApi.exportReport(reportData.id, format));
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reporte_${type}_${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showNotification('Reporte exportado exitosamente', 'success');
        } catch (error) {
            showNotification('Error al exportar reporte', 'error');
        }
    };

    const renderSummary = () => {
        if (!reportData) return null;

        switch (type) {
            case REPORT_TYPES.INVENTORY:
                return (
                    <div className={styles.summaryCards}>
                        <div className={styles.summaryCard}>
                            <span className={styles.summaryValue}>{reportData.totalProducts}</span>
                            <span className={styles.summaryLabel}>Total Productos</span>
                        </div>
                        <div className={styles.summaryCard}>
                            <span className={styles.summaryValue}>${reportData.totalValue?.toFixed(2)}</span>
                            <span className={styles.summaryLabel}>Valor Total</span>
                        </div>
                        <div className={styles.summaryCard}>
                            <span className={styles.summaryValue}>{reportData.lowStockCount}</span>
                            <span className={styles.summaryLabel}>Stock Bajo</span>
                        </div>
                        <div className={styles.summaryCard}>
                            <span className={styles.summaryValue}>{reportData.outOfStockCount}</span>
                            <span className={styles.summaryLabel}>Sin Stock</span>
                        </div>
                    </div>
                );

            case REPORT_TYPES.LOW_STOCK:
                return (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>SKU</th>
                                    <th>Stock Actual</th>
                                    <th>Stock Mínimo</th>
                                    <th>Diferencia</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.products?.map(product => (
                                    <tr key={product.id}>
                                        <td>{product.name}</td>
                                        <td>{product.sku}</td>
                                        <td className={styles.stockLow}>{product.stock}</td>
                                        <td>{product.minStock}</td>
                                        <td className={styles.difference}>
                                            {product.stock - product.minStock}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            case REPORT_TYPES.EXPIRY:
                return (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Lote</th>
                                    <th>Fecha Vencimiento</th>
                                    <th>Días Restantes</th>
                                    <th>Stock</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.products?.map(product => (
                                    <tr key={product.id}>
                                        <td>{product.name}</td>
                                        <td>{product.batch}</td>
                                        <td>{new Date(product.expiryDate).toLocaleDateString()}</td>
                                        <td className={
                                            product.daysUntilExpiry <= 7 ? styles.expiringSoon : ''
                                        }>
                                            {product.daysUntilExpiry}
                                        </td>
                                        <td>{product.stock}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            default:
                return (
                    <pre className={styles.rawData}>
                        {JSON.stringify(reportData, null, 2)}
                    </pre>
                );
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Generando reporte...</p>
            </div>
        );
    }

    return (
        <div className={styles.reportGenerator}>
            <div className={styles.header}>
                <h1 className={styles.title}>
                    {REPORT_TYPES_LABELS[type] || 'Reporte'}
                </h1>
                <div className={styles.headerActions}>
                    <button
                        onClick={() => handleExport('pdf')}
                        className={styles.exportButton}
                    >
                        📥 PDF
                    </button>
                    <button
                        onClick={() => handleExport('excel')}
                        className={styles.exportButton}
                    >
                        📊 Excel
                    </button>
                    <button
                        onClick={() => navigate('/reports')}
                        className={styles.backButton}
                    >
                        Volver
                    </button>
                </div>
            </div>

            <div className={styles.reportContent}>
                <div className={styles.reportMeta}>
                    <p>Generado: {new Date().toLocaleString()}</p>
                    <p>Período: {reportData?.period || 'No especificado'}</p>
                </div>

                {renderSummary()}
            </div>
        </div>
    );
};

export default ReportGenerator;