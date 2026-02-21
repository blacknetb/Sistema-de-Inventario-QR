/**
 * Servicio de Excel para Inventory QR System
 * Proporciona funciones para exportar datos a archivos Excel.
 */

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

class ExcelService {
    /**
     * Convierte un array de datos en una hoja de cálculo y la descarga como archivo Excel.
     * @param {Array} data - Array de objetos a exportar.
     * @param {string} filename - Nombre del archivo (sin extensión).
     * @param {string} sheetName - Nombre de la hoja de cálculo.
     */
    exportToExcel(data, filename = 'export', sheetName = 'Datos') {
        try {
            if (!data || data.length === 0) {
                console.warn('No hay datos para exportar a Excel.');
                return;
            }

            // Crear una nueva hoja de trabajo
            const worksheet = XLSX.utils.json_to_sheet(data);
            
            // Crear un nuevo libro de trabajo
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
            
            // Generar el archivo Excel
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            
            // Crear un Blob y descargarlo
            const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
            saveAs(blob, `${filename}.xlsx`);
            
            console.log(`Archivo ${filename}.xlsx exportado con éxito.`);
        } catch (error) {
            console.error('Error al exportar a Excel:', error);
            throw error;
        }
    }

    /**
     * Exporta una lista de productos a Excel con un formato predefinido.
     * @param {Array} products - Lista de productos.
     * @param {string} filename - Nombre del archivo.
     */
    exportProducts(products, filename = 'productos') {
        const formattedData = products.map(p => ({
            ID: p.id,
            Nombre: p.name,
            Descripción: p.description,
            Precio: p.price,
            Stock: p.stock,
            Categoría: p.category?.name || 'N/A',
            Proveedor: p.supplier?.name || 'N/A',
            'Código de Barras': p.barcode,
            'Fecha de Creación': p.createdAt,
            Estado: p.isActive ? 'Activo' : 'Inactivo'
        }));
        this.exportToExcel(formattedData, filename, 'Productos');
    }

    /**
     * Exporta una lista de categorías a Excel.
     * @param {Array} categories - Lista de categorías.
     * @param {string} filename - Nombre del archivo.
     */
    exportCategories(categories, filename = 'categorias') {
        const formattedData = categories.map(c => ({
            ID: c.id,
            Nombre: c.name,
            Descripción: c.description,
            'Categoría Padre': c.parent?.name || 'N/A',
            '# Productos': c.productCount || 0,
            'Fecha de Creación': c.createdAt,
            Estado: c.isActive ? 'Activo' : 'Inactivo'
        }));
        this.exportToExcel(formattedData, filename, 'Categorías');
    }

    /**
     * Exporta una lista de proveedores a Excel.
     * @param {Array} suppliers - Lista de proveedores.
     * @param {string} filename - Nombre del archivo.
     */
    exportSuppliers(suppliers, filename = 'proveedores') {
        const formattedData = suppliers.map(s => ({
            ID: s.id,
            Nombre: s.name,
            Email: s.email,
            Teléfono: s.phone,
            Dirección: s.address,
            '# Productos': s.productCount || 0,
            'Fecha de Registro': s.createdAt,
            Estado: s.isActive ? 'Activo' : 'Inactivo'
        }));
        this.exportToExcel(formattedData, filename, 'Proveedores');
    }

    /**
     * Exporta una lista de usuarios a Excel.
     * @param {Array} users - Lista de usuarios.
     * @param {string} filename - Nombre del archivo.
     */
    exportUsers(users, filename = 'usuarios') {
        const formattedData = users.map(u => ({
            ID: u.id,
            Nombre: u.name,
            Email: u.email,
            Rol: u.role?.name || 'N/A',
            'Último Acceso': u.lastLogin,
            'Fecha de Creación': u.createdAt,
            Estado: u.isActive ? 'Activo' : 'Inactivo'
        }));
        this.exportToExcel(formattedData, filename, 'Usuarios');
    }

    /**
     * Exporta un reporte de inventario a Excel.
     * @param {Array} inventoryData - Datos del reporte de inventario.
     * @param {string} filename - Nombre del archivo.
     */
    exportInventoryReport(inventoryData, filename = 'reporte_inventario') {
        // Asume que inventoryData es un array de items de inventario
        const formattedData = inventoryData.map(item => ({
            'ID Producto': item.productId,
            Producto: item.productName,
            Categoría: item.category,
            'Stock Actual': item.currentStock,
            'Stock Mínimo': item.minStock,
            'Stock Máximo': item.maxStock,
            'Valor Unitario': item.unitValue,
            'Valor Total': item.totalValue,
            'Fecha Última Actualización': item.lastUpdated
        }));
        this.exportToExcel(formattedData, filename, 'Reporte Inventario');
    }
}

export default new ExcelService();