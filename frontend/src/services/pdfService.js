/**
 * Servicio de PDF para Inventory QR System
 * Proporciona funciones para generar y descargar documentos PDF.
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable'; // Importar para funcionalidad de tablas

class PDFService {
    constructor() {
        // Configuración por defecto
        this.defaultConfig = {
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        };
    }

    /**
     * Genera un PDF simple a partir de un título y contenido.
     * @param {string} title - Título del documento.
     * @param {string} content - Contenido textual.
     * @param {string} filename - Nombre del archivo.
     */
    generateSimplePDF(title, content, filename = 'documento') {
        try {
            const doc = new jsPDF(this.defaultConfig);
            
            // Título
            doc.setFontSize(18);
            doc.text(title, 14, 22);
            
            // Contenido
            doc.setFontSize(12);
            const splitContent = doc.splitTextToSize(content, 180);
            doc.text(splitContent, 14, 40);
            
            doc.save(`${filename}.pdf`);
            console.log(`PDF ${filename}.pdf generado con éxito.`);
        } catch (error) {
            console.error('Error al generar PDF simple:', error);
            throw error;
        }
    }

    /**
     * Genera un PDF con una tabla de datos.
     * @param {string} title - Título del documento.
     * @param {Array} columns - Columnas de la tabla (ej. [{ header: 'ID', dataKey: 'id' }]).
     * @param {Array} rows - Datos de las filas.
     * @param {string} filename - Nombre del archivo.
     */
    generateTablePDF(title, columns, rows, filename = 'tabla') {
        try {
            const doc = new jsPDF(this.defaultConfig);
            
            // Título
            doc.setFontSize(18);
            doc.text(title, 14, 22);
            
            // Tabla
            doc.autoTable({
                head: [columns.map(col => col.header)],
                body: rows.map(row => columns.map(col => row[col.dataKey])),
                startY: 30,
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 185], textColor: 255 },
                styles: { fontSize: 10 }
            });
            
            doc.save(`${filename}.pdf`);
            console.log(`PDF con tabla ${filename}.pdf generado con éxito.`);
        } catch (error) {
            console.error('Error al generar PDF con tabla:', error);
            throw error;
        }
    }

    /**
     * Genera un reporte de productos en PDF.
     * @param {Array} products - Lista de productos.
     * @param {string} filename - Nombre del archivo.
     */
    generateProductsPDF(products, filename = 'reporte_productos') {
        const columns = [
            { header: 'ID', dataKey: 'id' },
            { header: 'Nombre', dataKey: 'name' },
            { header: 'Precio', dataKey: 'price' },
            { header: 'Stock', dataKey: 'stock' },
            { header: 'Categoría', dataKey: 'category' }
        ];
        
        const rows = products.map(p => ({
            id: p.id,
            name: p.name,
            price: `$${p.price}`,
            stock: p.stock,
            category: p.category?.name || 'N/A'
        }));
        
        this.generateTablePDF('Reporte de Productos', columns, rows, filename);
    }

    /**
     * Genera un reporte de inventario en PDF (resumen).
     * @param {Object} stats - Estadísticas de inventario.
     * @param {string} filename - Nombre del archivo.
     */
    generateInventorySummaryPDF(stats, filename = 'resumen_inventario') {
        try {
            const doc = new jsPDF(this.defaultConfig);
            
            // Título
            doc.setFontSize(20);
            doc.text('Resumen de Inventario', 14, 22);
            
            doc.setFontSize(12);
            doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 32);
            
            // Estadísticas
            doc.setFontSize(14);
            doc.text('Estadísticas Generales', 14, 45);
            
            doc.setFontSize(12);
            doc.text(`Total de Productos: ${stats.totalProducts || 0}`, 14, 55);
            doc.text(`Valor Total del Inventario: $${stats.totalValue?.toFixed(2) || '0.00'}`, 14, 62);
            doc.text(`Productos con Stock Bajo: ${stats.lowStockCount || 0}`, 14, 69);
            doc.text(`Productos por Vencer: ${stats.expiringCount || 0}`, 14, 76);
            doc.text(`Categorías Activas: ${stats.activeCategories || 0}`, 14, 83);
            doc.text(`Proveedores Activos: ${stats.activeSuppliers || 0}`, 14, 90);
            
            doc.save(`${filename}.pdf`);
            console.log(`PDF de resumen ${filename}.pdf generado con éxito.`);
        } catch (error) {
            console.error('Error al generar resumen de inventario PDF:', error);
            throw error;
        }
    }

    /**
     * Genera un PDF de etiquetas para productos (con QR).
     * @param {Array} products - Lista de productos con sus códigos QR.
     * @param {string} filename - Nombre del archivo.
     */
    async generateProductLabelsPDF(products, filename = 'etiquetas_productos') {
        try {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Configuración de la etiqueta (ej. 2 columnas, 5 filas)
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 10;
            const labelWidth = (pageWidth - 3 * margin) / 2;
            const labelHeight = (pageHeight - 4 * margin) / 5;
            
            let x = margin;
            let y = margin;
            let count = 0;

            for (const product of products) {
                if (count > 0 && count % 10 === 0) {
                    doc.addPage();
                    x = margin;
                    y = margin;
                } else if (count % 2 === 0 && count !== 0) {
                    x = margin;
                    y += labelHeight + margin;
                } else if (count % 2 !== 0) {
                    x = margin + labelWidth + margin;
                }

                // Borde de la etiqueta
                doc.setDrawColor(200, 200, 200);
                doc.rect(x, y, labelWidth, labelHeight);

                // Nombre del producto
                doc.setFontSize(10);
                doc.text(product.name.substring(0, 30), x + 2, y + 5);

                // Precio
                doc.setFontSize(12);
                doc.text(`$${product.price}`, x + 2, y + 12);

                // Aquí se insertaría el código QR si se tuviera la imagen
                // doc.addImage(product.qrImageData, 'PNG', x + labelWidth/2 - 10, y + 15, 20, 20);

                doc.text('QR', x + labelWidth/2 - 3, y + 40); // Placeholder

                count++;
            }

            doc.save(`${filename}.pdf`);
            console.log(`PDF de etiquetas ${filename}.pdf generado con éxito.`);
        } catch (error) {
            console.error('Error al generar etiquetas PDF:', error);
            throw error;
        }
    }
}

export default new PDFService();