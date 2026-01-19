import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/Common/common.css';

const PrintButton = ({
    content,
    title = 'Imprimir',
    buttonText = 'Imprimir',
    buttonIcon = 'fas fa-print',
    buttonVariant = 'secondary',
    buttonSize = 'medium',
    showPreview = true,
    printOptions = {},
    className = '',
    disabled = false,
    loading = false,
    onBeforePrint,
    onAfterPrint
}) => {
    const printRef = useRef(null);

    const defaultPrintOptions = {
        header: null,
        footer: null,
        styles: `
            body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 20px;
                color: #333;
            }
            .print-container { 
                max-width: 800px; 
                margin: 0 auto;
            }
            .print-header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #eee;
            }
            .print-header h1 {
                color: #2563eb;
                margin: 0 0 10px 0;
            }
            .print-header .subtitle {
                color: #6b7280;
                font-size: 16px;
            }
            .print-info {
                background: #f9fafb;
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 20px;
                border-left: 4px solid #3b82f6;
            }
            .print-footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #eee;
                text-align: center;
                color: #6b7280;
                font-size: 14px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            th {
                background: #f3f4f6;
                padding: 12px;
                text-align: left;
                border-bottom: 2px solid #e5e7eb;
                font-weight: 600;
            }
            td {
                padding: 12px;
                border-bottom: 1px solid #e5e7eb;
            }
            tr:nth-child(even) {
                background: #f9fafb;
            }
            @media print {
                body { 
                    margin: 0; 
                    padding: 0;
                }
                .no-print {
                    display: none !important;
                }
            }
        `,
        ...printOptions
    };

    const getPrintContent = () => {
        if (typeof content === 'function') {
            return content();
        }
        
        if (typeof content === 'string') {
            return content;
        }
        
        return content;
    };

    const getPrintTitle = () => {
        if (typeof title === 'function') {
            return title();
        }
        return title;
    };

    const preparePrintContent = () => {
        const printContent = getPrintContent();
        const printTitle = getPrintTitle();
        const currentDate = new Date().toLocaleString();
        
        return `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>${printTitle}</title>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        ${defaultPrintOptions.styles}
                    </style>
                </head>
                <body>
                    <div class="print-container">
                        <div class="print-header">
                            <h1>${printTitle}</h1>
                            <div class="subtitle">
                                ${document.title} - ${window.location.hostname}
                            </div>
                            <div class="print-info">
                                <div><strong>Fecha de impresión:</strong> ${currentDate}</div>
                                <div><strong>URL:</strong> ${window.location.href}</div>
                                <div><strong>Página:</strong> <span class="page-number"></span></div>
                            </div>
                        </div>
                        
                        <div class="print-content">
                            ${printContent}
                        </div>
                        
                        <div class="print-footer">
                            <p>
                                Documento generado por Inventario Básico • 
                                ${currentDate} • 
                                Página <span class="page-number"></span>
                            </p>
                        </div>
                    </div>
                    
                    <script>
                        // Agregar números de página
                        document.addEventListener('DOMContentLoaded', function() {
                            const pageNumbers = document.querySelectorAll('.page-number');
                            pageNumbers.forEach(el => {
                                el.textContent = '1';
                            });
                        });
                    </script>
                </body>
            </html>
        `;
    };

    const handlePrintPreview = () => {
        if (!showPreview) {
            handlePrint();
            return;
        }

        const printWindow = window.open('', '_blank');
        const printContent = preparePrintContent();
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        printWindow.focus();
        
        // Agregar botones de impresión en la vista previa
        setTimeout(() => {
            const style = printWindow.document.createElement('style');
            style.textContent = `
                .print-preview-controls {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    padding: 15px;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    z-index: 1000;
                    display: flex;
                    gap: 10px;
                }
                .print-btn {
                    padding: 8px 16px;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .print-btn:hover {
                    background: #2563eb;
                }
                .close-btn {
                    background: #6b7280;
                }
                .close-btn:hover {
                    background: #4b5563;
                }
            `;
            
            printWindow.document.head.appendChild(style);
            
            const controls = printWindow.document.createElement('div');
            controls.className = 'print-preview-controls no-print';
            
            controls.innerHTML = `
                <button class="print-btn" onclick="window.print()">
                    <i class="fas fa-print"></i> Imprimir
                </button>
                <button class="print-btn close-btn" onclick="window.close()">
                    <i class="fas fa-times"></i> Cerrar
                </button>
            `;
            
            // Agregar Font Awesome
            const faLink = printWindow.document.createElement('link');
            faLink.rel = 'stylesheet';
            faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
            printWindow.document.head.appendChild(faLink);
            
            printWindow.document.body.appendChild(controls);
        }, 100);
    };

    const handlePrint = () => {
        if (onBeforePrint) {
            onBeforePrint();
        }

        const printWindow = window.open('', '_blank');
        const printContent = preparePrintContent();
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.print();
            
            if (onAfterPrint) {
                setTimeout(() => {
                    onAfterPrint();
                    printWindow.close();
                }, 100);
            } else {
                printWindow.close();
            }
        }, 250);
    };

    const renderButtonContent = () => (
        <>
            {buttonIcon && <i className={`${buttonIcon} btn-icon-left`}></i>}
            <span className="btn-text">{buttonText}</span>
        </>
    );

    return (
        <div className={`print-button-container ${className}`}>
            <button
                className={`btn btn-${buttonVariant} btn-${buttonSize}`}
                onClick={showPreview ? handlePrintPreview : handlePrint}
                disabled={disabled || loading}
            >
                {loading ? (
                    <>
                        <span className="spinner-small"></span>
                        Preparando impresión...
                    </>
                ) : (
                    renderButtonContent()
                )}
            </button>
            
            {/* Información de impresión */}
            <div className="print-info-panel">
                <div className="print-tips">
                    <h5>💡 Consejos para imprimir:</h5>
                    <ul>
                        <li>Revisa la vista previa antes de imprimir</li>
                        <li>Asegúrate de que la impresora tenga papel suficiente</li>
                        <li>Usa la orientación horizontal para tablas grandes</li>
                        <li>Verifica la configuración de márgenes</li>
                    </ul>
                </div>
                
                <div className="print-options">
                    <h5>⚙️ Opciones:</h5>
                    <div className="options-grid">
                        <div className="option-item">
                            <label>
                                <input 
                                    type="checkbox" 
                                    defaultChecked 
                                    onChange={(e) => {
                                        // Aquí manejarías la opción de encabezados
                                    }}
                                />
                                Incluir encabezado
                            </label>
                        </div>
                        <div className="option-item">
                            <label>
                                <input 
                                    type="checkbox" 
                                    defaultChecked 
                                    onChange={(e) => {
                                        // Aquí manejarías la opción de pie de página
                                    }}
                                />
                                Incluir pie de página
                            </label>
                        </div>
                    </div>
                </div>
            </div>
            
            <div ref={printRef} style={{ display: 'none' }}>
                {getPrintContent()}
            </div>
        </div>
    );
};

PrintButton.propTypes = {
    content: PropTypes.oneOfType([PropTypes.string, PropTypes.node, PropTypes.func]).isRequired,
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    buttonText: PropTypes.string,
    buttonIcon: PropTypes.string,
    buttonVariant: PropTypes.oneOf(['primary', 'secondary', 'success', 'warning', 'danger', 'info']),
    buttonSize: PropTypes.oneOf(['small', 'medium', 'large']),
    showPreview: PropTypes.bool,
    printOptions: PropTypes.shape({
        header: PropTypes.string,
        footer: PropTypes.string,
        styles: PropTypes.string
    }),
    className: PropTypes.string,
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    onBeforePrint: PropTypes.func,
    onAfterPrint: PropTypes.func
};

export default PrintButton;