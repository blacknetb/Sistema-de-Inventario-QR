import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useLoading } from '../../contexts/LoadingContext';
import reportsApi from '../../api/reportsApi';
import { REPORT_TYPES, REPORT_TYPES_LABELS, EXPORT_FORMATS } from '../../utils/constants';
import styles from './ReportsPage.module.css';

const ReportsPage = () => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const { withLoading } = useLoading();

    const [generatedReports, setGeneratedReports] = useState([]);
    const [scheduledReports, setScheduledReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [activeTab, setActiveTab] = useState('generate');
    
    const [reportForm, setReportForm] = useState({
        type: REPORT_TYPES.INVENTORY,
        format: EXPORT_FORMATS.PDF,
        dateRange: 'thisMonth',
        startDate: '',
        endDate: '',
        filters: {}
    });

    const [scheduleForm, setScheduleForm] = useState({
        reportType: REPORT_TYPES.INVENTORY,
        frequency: 'daily',
        time: '08:00',
        recipients: [''],
        format: EXPORT_FORMATS.PDF,
        name: '',
        active: true
    });

    useEffect(() => {
        loadReports();
        loadScheduledReports();
    }, []);

    const loadReports = async () => {
        try {
            const response = await withLoading(reportsApi.getGeneratedReports());
            if (response.success) {
                setGeneratedReports(response.data);
            }
        } catch (error) {
            showNotification('Error al cargar reportes generados', 'error');
        }
    };

    const loadScheduledReports = async () => {
        try {
            const response = await withLoading(reportsApi.getScheduledReports());
            if (response.success) {
                setScheduledReports(response.data);
            }
        } catch (error) {
            showNotification('Error al cargar reportes programados', 'error');
        }
    };

    const handleReportTypeChange = (e) => {
        const type = e.target.value;
        setReportForm(prev => ({
            ...prev,
            type,
            filters: {}
        }));
    };

    const handleDateRangeChange = (e) => {
        const range = e.target.value;
        setReportForm(prev => ({
            ...prev,
            dateRange: range
        }));

        // Set default dates based on range
        const today = new Date();
        let startDate = new Date();
        let endDate = new Date();

        switch (range) {
            case 'today':
                startDate = today;
                endDate = today;
                break;
            case 'yesterday':
                startDate = new Date(today.setDate(today.getDate() - 1));
                endDate = new Date(today.setDate(today.getDate()));
                break;
            case 'thisWeek':
                startDate = new Date(today.setDate(today.getDate() - today.getDay()));
                endDate = new Date(today.setDate(startDate.getDate() + 6));
                break;
            case 'thisMonth':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
            case 'lastMonth':
                startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                endDate = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
            case 'custom':
                // Keep user selected dates
                break;
            default:
                break;
        }

        setReportForm(prev => ({
            ...prev,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        }));
    };

    const handleFilterChange = (key, value) => {
        setReportForm(prev => ({
            ...prev,
            filters: {
                ...prev.filters,
                [key]: value
            }
        }));
    };

    const handleGenerateReport = async () => {
        try {
            const params = {
                type: reportForm.type,
                startDate: reportForm.startDate,
                endDate: reportForm.endDate,
                ...reportForm.filters
            };

            let response;
            switch (reportForm.type) {
                case REPORT_TYPES.INVENTORY:
                    response = await withLoading(reportsApi.generateInventoryReport(params));
                    break;
                case REPORT_TYPES.MOVEMENTS:
                    response = await withLoading(reportsApi.generateMovementsReport(params));
                    break;
                case REPORT_TYPES.SALES:
                    response = await withLoading(reportsApi.generateSalesReport(params));
                    break;
                case REPORT_TYPES.PRODUCTS:
                    response = await withLoading(reportsApi.generateProductsReport(params));
                    break;
                case REPORT_TYPES.SUPPLIERS:
                    response = await withLoading(reportsApi.generateSuppliersReport(params));
                    break;
                case REPORT_TYPES.EXPIRY:
                    response = await withLoading(reportsApi.generateExpiryReport(params));
                    break;
                case REPORT_TYPES.LOW_STOCK:
                    response = await withLoading(reportsApi.generateLowStockReport(params));
                    break;
                default:
                    response = await withLoading(reportsApi.generateInventoryReport(params));
            }

            if (response.success) {
                setPreviewData(response.data);
                setShowPreviewModal(true);
                showNotification('Reporte generado exitosamente', 'success');
                loadReports();
            }
        } catch (error) {
            showNotification(error.message || 'Error al generar reporte', 'error');
        }
    };

    const handleExportReport = async (reportId, format) => {
        try {
            const blob = await withLoading(reportsApi.exportReport(reportId, format));
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reporte_${reportId}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showNotification('Reporte exportado exitosamente', 'success');
        } catch (error) {
            showNotification('Error al exportar reporte', 'error');
        }
    };

    const handleScheduleReport = async () => {
        try {
            const response = await withLoading(reportsApi.scheduleReport({
                reportType: scheduleForm.reportType,
                params: {
                    ...reportForm.filters,
                    startDate: reportForm.startDate,
                    endDate: reportForm.endDate
                },
                schedule: scheduleForm.frequency,
                time: scheduleForm.time,
                recipients: scheduleForm.recipients.filter(r => r.trim()),
                format: scheduleForm.format,
                name: scheduleForm.name
            }));

            if (response.success) {
                showNotification('Reporte programado exitosamente', 'success');
                setShowScheduleModal(false);
                loadScheduledReports();
            }
        } catch (error) {
            showNotification(error.message || 'Error al programar reporte', 'error');
        }
    };

    const handleDeleteScheduled = async (scheduleId) => {
        if (!window.confirm('¿Estás seguro de eliminar esta programación?')) return;

        try {
            const response = await withLoading(reportsApi.cancelScheduledReport(scheduleId));
            if (response.success) {
                showNotification('Programación eliminada', 'success');
                loadScheduledReports();
            }
        } catch (error) {
            showNotification('Error al eliminar programación', 'error');
        }
    };

    const handleDeleteReport = async (reportId) => {
        if (!window.confirm('¿Estás seguro de eliminar este reporte?')) return;

        try {
            const response = await withLoading(reportsApi.deleteReport(reportId));
            if (response.success) {
                showNotification('Reporte eliminado', 'success');
                loadReports();
            }
        } catch (error) {
            showNotification('Error al eliminar reporte', 'error');
        }
    };

    const handleAddRecipient = () => {
        setScheduleForm(prev => ({
            ...prev,
            recipients: [...prev.recipients, '']
        }));
    };

    const handleRecipientChange = (index, value) => {
        const newRecipients = [...scheduleForm.recipients];
        newRecipients[index] = value;
        setScheduleForm(prev => ({
            ...prev,
            recipients: newRecipients
        }));
    };

    const handleRemoveRecipient = (index) => {
        setScheduleForm(prev => ({
            ...prev,
            recipients: prev.recipients.filter((_, i) => i !== index)
        }));
    };

    return (
        <div className={styles.reportsPage}>
            <div className={styles.header}>
                <h1 className={styles.title}>Reportes</h1>
            </div>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'generate' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('generate')}
                >
                    Generar Reporte
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'history' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    Historial
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'scheduled' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('scheduled')}
                >
                    Programados
                </button>
            </div>

            <div className={styles.tabContent}>
                {activeTab === 'generate' && (
                    <div className={styles.generateSection}>
                        <div className={styles.formCard}>
                            <h3>Parámetros del Reporte</h3>
                            
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Tipo de Reporte</label>
                                <select
                                    value={reportForm.type}
                                    onChange={handleReportTypeChange}
                                    className={styles.select}
                                >
                                    {Object.entries(REPORT_TYPES_LABELS).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Rango de Fechas</label>
                                <select
                                    value={reportForm.dateRange}
                                    onChange={handleDateRangeChange}
                                    className={styles.select}
                                >
                                    <option value="today">Hoy</option>
                                    <option value="yesterday">Ayer</option>
                                    <option value="thisWeek">Esta semana</option>
                                    <option value="thisMonth">Este mes</option>
                                    <option value="lastMonth">Mes pasado</option>
                                    <option value="custom">Personalizado</option>
                                </select>
                            </div>

                            {reportForm.dateRange === 'custom' && (
                                <div className={styles.dateRange}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Fecha Inicio</label>
                                        <input
                                            type="date"
                                            value={reportForm.startDate}
                                            onChange={(e) => setReportForm(prev => ({ ...prev, startDate: e.target.value }))}
                                            className={styles.input}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Fecha Fin</label>
                                        <input
                                            type="date"
                                            value={reportForm.endDate}
                                            onChange={(e) => setReportForm(prev => ({ ...prev, endDate: e.target.value }))}
                                            className={styles.input}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Formato de Exportación</label>
                                <select
                                    value={reportForm.format}
                                    onChange={(e) => setReportForm(prev => ({ ...prev, format: e.target.value }))}
                                    className={styles.select}
                                >
                                    {Object.entries(EXPORT_FORMATS).map(([key, value]) => (
                                        <option key={key} value={value}>
                                            {key}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Dynamic filters based on report type */}
                            {reportForm.type === REPORT_TYPES.PRODUCTS && (
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Categoría</label>
                                    <select
                                        value={reportForm.filters.category || ''}
                                        onChange={(e) => handleFilterChange('category', e.target.value)}
                                        className={styles.select}
                                    >
                                        <option value="">Todas las categorías</option>
                                        <option value="electronics">Electrónicos</option>
                                        <option value="clothing">Ropa</option>
                                    </select>
                                </div>
                            )}

                            {reportForm.type === REPORT_TYPES.LOW_STOCK && (
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Umbral de Stock Bajo</label>
                                    <input
                                        type="number"
                                        value={reportForm.filters.threshold || 10}
                                        onChange={(e) => handleFilterChange('threshold', parseInt(e.target.value))}
                                        className={styles.input}
                                        min="1"
                                    />
                                </div>
                            )}

                            {reportForm.type === REPORT_TYPES.EXPIRY && (
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Días para vencimiento</label>
                                    <input
                                        type="number"
                                        value={reportForm.filters.daysToExpire || 30}
                                        onChange={(e) => handleFilterChange('daysToExpire', parseInt(e.target.value))}
                                        className={styles.input}
                                        min="1"
                                    />
                                </div>
                            )}

                            <div className={styles.formActions}>
                                <button
                                    onClick={handleGenerateReport}
                                    className={styles.generateButton}
                                >
                                    Generar Reporte
                                </button>
                                <button
                                    onClick={() => setShowScheduleModal(true)}
                                    className={styles.scheduleButton}
                                >
                                    Programar
                                </button>
                            </div>
                        </div>

                        <div className={styles.templatesCard}>
                            <h3>Plantillas Rápidas</h3>
                            <div className={styles.templatesGrid}>
                                <div 
                                    className={styles.template}
                                    onClick={() => {
                                        setReportForm({
                                            ...reportForm,
                                            type: REPORT_TYPES.INVENTORY,
                                            dateRange: 'thisMonth'
                                        });
                                    }}
                                >
                                    <span className={styles.templateIcon}>📦</span>
                                    <span>Inventario Mensual</span>
                                </div>
                                <div 
                                    className={styles.template}
                                    onClick={() => {
                                        setReportForm({
                                            ...reportForm,
                                            type: REPORT_TYPES.LOW_STOCK,
                                            filters: { threshold: 10 }
                                        });
                                    }}
                                >
                                    <span className={styles.templateIcon}>⚠️</span>
                                    <span>Stock Bajo</span>
                                </div>
                                <div 
                                    className={styles.template}
                                    onClick={() => {
                                        setReportForm({
                                            ...reportForm,
                                            type: REPORT_TYPES.EXPIRY,
                                            filters: { daysToExpire: 15 }
                                        });
                                    }}
                                >
                                    <span className={styles.templateIcon}>⏰</span>
                                    <span>Próximos a Vencer</span>
                                </div>
                                <div 
                                    className={styles.template}
                                    onClick={() => {
                                        setReportForm({
                                            ...reportForm,
                                            type: REPORT_TYPES.MOVEMENTS,
                                            dateRange: 'thisWeek'
                                        });
                                    }}
                                >
                                    <span className={styles.templateIcon}>🔄</span>
                                    <span>Movimientos Semanales</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className={styles.historySection}>
                        <h3>Reportes Generados</h3>
                        
                        {generatedReports.length > 0 ? (
                            <div className={styles.reportsList}>
                                {generatedReports.map(report => (
                                    <div key={report.id} className={styles.reportCard}>
                                        <div className={styles.reportInfo}>
                                            <h4>{report.name}</h4>
                                            <p className={styles.reportMeta}>
                                                {REPORT_TYPES_LABELS[report.type]} • 
                                                {new Date(report.createdAt).toLocaleDateString()}
                                            </p>
                                            <p className={styles.reportDescription}>
                                                {report.description}
                                            </p>
                                        </div>
                                        <div className={styles.reportActions}>
                                            <button
                                                onClick={() => handleExportReport(report.id, 'pdf')}
                                                className={styles.downloadButton}
                                                title="Descargar PDF"
                                            >
                                                📥 PDF
                                            </button>
                                            <button
                                                onClick={() => handleExportReport(report.id, 'excel')}
                                                className={styles.downloadButton}
                                                title="Descargar Excel"
                                            >
                                                📊 Excel
                                            </button>
                                            <button
                                                onClick={() => handleDeleteReport(report.id)}
                                                className={styles.deleteButton}
                                                title="Eliminar"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <p>No hay reportes generados</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'scheduled' && (
                    <div className={styles.scheduledSection}>
                        <h3>Reportes Programados</h3>
                        
                        {scheduledReports.length > 0 ? (
                            <div className={styles.scheduledList}>
                                {scheduledReports.map(schedule => (
                                    <div key={schedule.id} className={styles.scheduleCard}>
                                        <div className={styles.scheduleInfo}>
                                            <h4>{schedule.name || REPORT_TYPES_LABELS[schedule.reportType]}</h4>
                                            <div className={styles.scheduleDetails}>
                                                <span className={styles.scheduleBadge}>
                                                    {schedule.frequency === 'daily' ? '📅 Diario' :
                                                     schedule.frequency === 'weekly' ? '📆 Semanal' :
                                                     schedule.frequency === 'monthly' ? '🗓️ Mensual' : schedule.frequency}
                                                </span>
                                                <span className={styles.scheduleTime}>
                                                    ⏰ {schedule.time}
                                                </span>
                                                <span className={`${styles.statusBadge} ${schedule.active ? styles.active : styles.inactive}`}>
                                                    {schedule.active ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </div>
                                            <div className={styles.scheduleRecipients}>
                                                <strong>Destinatarios:</strong>
                                                <ul>
                                                    {schedule.recipients?.map((email, i) => (
                                                        <li key={i}>{email}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                        <div className={styles.scheduleActions}>
                                            <button
                                                onClick={() => handleDeleteScheduled(schedule.id)}
                                                className={styles.deleteButton}
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <p>No hay reportes programados</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showScheduleModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2 className={styles.modalTitle}>Programar Reporte</h2>
                        
                        <div className={styles.modalContent}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Nombre del Reporte</label>
                                <input
                                    type="text"
                                    value={scheduleForm.name}
                                    onChange={(e) => setScheduleForm(prev => ({ ...prev, name: e.target.value }))}
                                    className={styles.input}
                                    placeholder="Ej: Reporte de inventario semanal"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Frecuencia</label>
                                <select
                                    value={scheduleForm.frequency}
                                    onChange={(e) => setScheduleForm(prev => ({ ...prev, frequency: e.target.value }))}
                                    className={styles.select}
                                >
                                    <option value="daily">Diario</option>
                                    <option value="weekly">Semanal</option>
                                    <option value="monthly">Mensual</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Hora de envío</label>
                                <input
                                    type="time"
                                    value={scheduleForm.time}
                                    onChange={(e) => setScheduleForm(prev => ({ ...prev, time: e.target.value }))}
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Destinatarios</label>
                                {scheduleForm.recipients.map((recipient, index) => (
                                    <div key={index} className={styles.recipientRow}>
                                        <input
                                            type="email"
                                            value={recipient}
                                            onChange={(e) => handleRecipientChange(index, e.target.value)}
                                            className={styles.input}
                                            placeholder="correo@ejemplo.com"
                                        />
                                        {scheduleForm.recipients.length > 1 && (
                                            <button
                                                onClick={() => handleRemoveRecipient(index)}
                                                className={styles.removeButton}
                                            >
                                                ❌
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    onClick={handleAddRecipient}
                                    className={styles.addButton}
                                >
                                    + Agregar destinatario
                                </button>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={scheduleForm.active}
                                        onChange={(e) => setScheduleForm(prev => ({ ...prev, active: e.target.checked }))}
                                    />
                                    <span>Activo</span>
                                </label>
                            </div>
                        </div>

                        <div className={styles.modalActions}>
                            <button
                                onClick={() => setShowScheduleModal(false)}
                                className={styles.cancelButton}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleScheduleReport}
                                className={styles.confirmButton}
                            >
                                Programar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showPreviewModal && previewData && (
                <div className={styles.modalOverlay}>
                    <div className={`${styles.modal} ${styles.previewModal}`}>
                        <h2 className={styles.modalTitle}>Vista Previa del Reporte</h2>
                        
                        <div className={styles.previewContent}>
                            <pre>{JSON.stringify(previewData, null, 2)}</pre>
                        </div>

                        <div className={styles.modalActions}>
                            <button
                                onClick={() => handleExportReport(previewData.id, reportForm.format)}
                                className={styles.downloadButton}
                            >
                                Descargar {reportForm.format.toUpperCase()}
                            </button>
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                className={styles.cancelButton}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsPage;