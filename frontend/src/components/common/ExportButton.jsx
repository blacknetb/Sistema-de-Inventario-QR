import React, { useState } from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/Common/common.css';

const ExportButton = ({
    data,
    filename = 'export',
    formats = ['csv', 'excel', 'json', 'pdf'],
    buttonText = 'Exportar',
    buttonIcon = 'fas fa-download',
    buttonVariant = 'primary',
    buttonSize = 'medium',
    showFormatSelector = true,
    onExport,
    className = '',
    disabled = false,
    loading = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedFormat, setSelectedFormat] = useState(formats[0]);

    const formatConfigs = {
        csv: {
            label: 'CSV',
            icon: 'fas fa-file-csv',
            color: '#10b981',
            mimeType: 'text/csv',
            extension: 'csv'
        },
        excel: {
            label: 'Excel',
            icon: 'fas fa-file-excel',
            color: '#10b981',
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            extension: 'xlsx'
        },
        json: {
            label: 'JSON',
            icon: 'fas fa-file-code',
            color: '#f59e0b',
            mimeType: 'application/json',
            extension: 'json'
        },
        pdf: {
            label: 'PDF',
            icon: 'fas fa-file-pdf',
            color: '#ef4444',
            mimeType: 'application/pdf',
            extension: 'pdf'
        }
    };

    const convertToCSV = (data) => {
        if (!data || data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const cell = row[header];
                    return typeof cell === 'string' && cell.includes(',') 
                        ? `"${cell}"` 
                        : cell;
                }).join(',')
            )
        ];
        
        return csvRows.join('\n');
    };

    const downloadFile = (content, filename, mimeType) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    };

    const handleExport = (format) => {
        if (!data || data.length === 0) {
            alert('No hay datos para exportar');
            return;
        }

        if (onExport) {
            onExport(format, data);
            setIsOpen(false);
            return;
        }

        const config = formatConfigs[format];
        if (!config) return;

        let content;
        let finalFilename = `${filename}_${new Date().toISOString().split('T')[0]}.${config.extension}`;

        switch (format) {
            case 'csv':
                content = convertToCSV(data);
                downloadFile(content, finalFilename, config.mimeType);
                break;
                
            case 'json':
                content = JSON.stringify(data, null, 2);
                downloadFile(content, finalFilename, config.mimeType);
                break;
                
            case 'excel':
                // En un proyecto real, usarías una librería como xlsx
                alert('Para exportar a Excel, instala una librería como xlsx');
                break;
                
            case 'pdf':
                // En un proyecto real, usarías una librería como jsPDF
                alert('Para exportar a PDF, instala una librería como jsPDF');
                break;
                
            default:
                console.warn(`Formato no soportado: ${format}`);
                return;
        }

        setIsOpen(false);
    };

    const renderButtonContent = () => (
        <>
            {buttonIcon && <i className={`${buttonIcon} btn-icon-left`}></i>}
            <span className="btn-text">{buttonText}</span>
            {showFormatSelector && (
                <i className="fas fa-chevron-down btn-icon-right"></i>
            )}
        </>
    );

    return (
        <div className={`export-button-container ${className}`}>
            {showFormatSelector ? (
                <div className="dropdown">
                    <button
                        className={`btn btn-${buttonVariant} btn-${buttonSize} ${isOpen ? 'dropdown-open' : ''}`}
                        onClick={() => setIsOpen(!isOpen)}
                        disabled={disabled || loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-small"></span>
                                Exportando...
                            </>
                        ) : (
                            renderButtonContent()
                        )}
                    </button>
                    
                    {isOpen && (
                        <>
                            <div className="dropdown-overlay" onClick={() => setIsOpen(false)} />
                            <div className="dropdown-menu">
                                <div className="dropdown-header">
                                    <h5>Seleccionar formato</h5>
                                    <button
                                        className="dropdown-close"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                                
                                <div className="dropdown-content">
                                    {formats.map(format => {
                                        const config = formatConfigs[format];
                                        if (!config) return null;
                                        
                                        return (
                                            <button
                                                key={format}
                                                className="dropdown-item"
                                                onClick={() => handleExport(format)}
                                            >
                                                <i 
                                                    className={config.icon} 
                                                    style={{ color: config.color }}
                                                ></i>
                                                <span>{config.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                
                                <div className="dropdown-footer">
                                    <small>
                                        {data?.length || 0} registros disponibles
                                    </small>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <button
                    className={`btn btn-${buttonVariant} btn-${buttonSize}`}
                    onClick={() => handleExport(selectedFormat)}
                    disabled={disabled || loading}
                >
                    {loading ? (
                        <>
                            <span className="spinner-small"></span>
                            Exportando...
                        </>
                    ) : (
                        renderButtonContent()
                    )}
                </button>
            )}
            
            {/* Información de exportación */}
            <div className="export-info">
                <div className="export-stats">
                    <span className="stat-item">
                        <i className="fas fa-database"></i>
                        {data?.length || 0} registros
                    </span>
                    <span className="stat-item">
                        <i className="fas fa-file"></i>
                        {formats.length} formatos
                    </span>
                </div>
                
                <div className="export-tips">
                    <small>
                        <i className="fas fa-lightbulb"></i>
                        Elige el formato según cómo planeas usar los datos
                    </small>
                </div>
            </div>
        </div>
    );
};

ExportButton.propTypes = {
    data: PropTypes.array.isRequired,
    filename: PropTypes.string,
    formats: PropTypes.arrayOf(PropTypes.oneOf(['csv', 'excel', 'json', 'pdf'])),
    buttonText: PropTypes.string,
    buttonIcon: PropTypes.string,
    buttonVariant: PropTypes.oneOf(['primary', 'secondary', 'success', 'warning', 'danger', 'info']),
    buttonSize: PropTypes.oneOf(['small', 'medium', 'large']),
    showFormatSelector: PropTypes.bool,
    onExport: PropTypes.func,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    loading: PropTypes.bool
};

export default ExportButton;