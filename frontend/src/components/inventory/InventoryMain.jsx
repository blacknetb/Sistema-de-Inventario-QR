/**
 * InventoryMain.js
 * Componente principal del módulo de inventario
 * Ubicación: E:\portafolio de desarrollo web\app web\proyectos basicos\inventarios basicos\frontend\src\components\inventory\InventoryMain.js
 */

import React, { useState, useEffect } from 'react';
import '../../assets/styles/inventarios/inventory.css';

// Componentes del inventario
import InventoryList from './InventoryList';
import InventoryFilters from './InventoryFilters';
import InventoryStats from './InventoryStats';
import InventoryActions from './InventoryActions';
import InventoryReports from './InventoryReports';

const InventoryMain = () => {
    const [inventoryData, setInventoryData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        category: 'all',
        status: 'all',
        minStock: 0,
        maxStock: 1000,
        supplier: 'all',
        warehouse: 'all'
    });
    const [selectedItems, setSelectedItems] = useState([]);
    const [viewMode, setViewMode] = useState('table');
    const [refreshKey, setRefreshKey] = useState(0);

    // Cargar datos del inventario
    useEffect(() => {
        const fetchInventoryData = async () => {
            try {
                setLoading(true);
                setError(null);

                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:5000/api/inventory', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Error al cargar los datos del inventario');
                }

                const data = await response.json();
                setInventoryData(data);
                setFilteredData(data);

            } catch (err) {
                console.error('Error fetching inventory data:', err);
                setError(err.message);
                
                // Datos de ejemplo para desarrollo
                const sampleData = generateSampleData();
                setInventoryData(sampleData);
                setFilteredData(sampleData);
            } finally {
                setLoading(false);
            }
        };

        fetchInventoryData();
    }, [refreshKey]);

    // Generar datos de ejemplo
    const generateSampleData = () => {
        const categories = ['Electrónicos', 'Ropa', 'Alimentos', 'Hogar', 'Deportes', 'Juguetes'];
        const statuses = ['active', 'inactive', 'low_stock', 'out_of_stock'];
        const suppliers = ['Proveedor A', 'Proveedor B', 'Proveedor C', 'Proveedor D'];
        const warehouses = ['Almacén Central', 'Almacén Norte', 'Almacén Sur', 'Bodega Este'];
        
        return Array.from({ length: 50 }, (_, index) => ({
            id: `INV-${1000 + index}`,
            name: `Producto ${index + 1}`,
            sku: `SKU-${10000 + index}`,
            category: categories[Math.floor(Math.random() * categories.length)],
            description: `Descripción del producto ${index + 1}. Producto de alta calidad.`,
            currentStock: Math.floor(Math.random() * 500) + 1,
            minStock: 10,
            maxStock: 500,
            unitPrice: parseFloat((Math.random() * 1000 + 10).toFixed(2)),
            costPrice: parseFloat((Math.random() * 800 + 5).toFixed(2)),
            status: statuses[Math.floor(Math.random() * statuses.length)],
            supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
            warehouse: warehouses[Math.floor(Math.random() * warehouses.length)],
            location: `Pasillo ${Math.floor(Math.random() * 10) + 1}, Estante ${Math.floor(Math.random() * 5) + 1}`,
            lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000).toISOString(),
            barcode: `890123456789${index.toString().padStart(3, '0')}`,
            reorderPoint: 20,
            safetyStock: 5,
            unit: 'unidad',
            weight: parseFloat((Math.random() * 10 + 0.1).toFixed(2)),
            dimensions: `${Math.floor(Math.random() * 50) + 10}x${Math.floor(Math.random() * 30) + 5}x${Math.floor(Math.random() * 20) + 3} cm`,
            taxRate: 0.16,
            notes: 'Notas adicionales sobre el producto.'
        }));
    };

    // Aplicar filtros
    useEffect(() => {
        let result = [...inventoryData];

        // Filtro de búsqueda
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            result = result.filter(item => 
                item.name.toLowerCase().includes(searchLower) ||
                item.sku.toLowerCase().includes(searchLower) ||
                item.description.toLowerCase().includes(searchLower) ||
                item.barcode.toLowerCase().includes(searchLower)
            );
        }

        // Filtro de categoría
        if (filters.category !== 'all') {
            result = result.filter(item => item.category === filters.category);
        }

        // Filtro de estado
        if (filters.status !== 'all') {
            result = result.filter(item => item.status === filters.status);
        }

        // Filtro de stock
        result = result.filter(item => 
            item.currentStock >= filters.minStock && 
            item.currentStock <= filters.maxStock
        );

        // Filtro de proveedor
        if (filters.supplier !== 'all') {
            result = result.filter(item => item.supplier === filters.supplier);
        }

        // Filtro de almacén
        if (filters.warehouse !== 'all') {
            result = result.filter(item => item.warehouse === filters.warehouse);
        }

        setFilteredData(result);
    }, [filters, inventoryData]);

    // Manejar cambio de filtros
    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    // Manejar reset de filtros
    const handleResetFilters = () => {
        setFilters({
            search: '',
            category: 'all',
            status: 'all',
            minStock: 0,
            maxStock: 1000,
            supplier: 'all',
            warehouse: 'all'
        });
    };

    // Manejar selección de items
    const handleSelectItem = (itemId) => {
        setSelectedItems(prev => {
            if (prev.includes(itemId)) {
                return prev.filter(id => id !== itemId);
            } else {
                return [...prev, itemId];
            }
        });
    };

    // Manejar selección masiva
    const handleSelectAll = () => {
        if (selectedItems.length === filteredData.length) {
            setSelectedItems([]);
        } else {
            const allIds = filteredData.map(item => item.id);
            setSelectedItems(allIds);
        }
    };

    // Manejar refresco de datos
    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
        setSelectedItems([]);
    };

    // Manejar exportación
    const handleExport = (format) => {
        console.log(`Exportando en formato ${format}`);
        // Implementar lógica de exportación
        alert(`Exportando ${filteredData.length} items en formato ${format.toUpperCase()}`);
    };

    // Manejar acción masiva
    const handleBulkAction = (action) => {
        console.log(`Ejecutando acción masiva: ${action} en ${selectedItems.length} items`);
        alert(`Ejecutando ${action} en ${selectedItems.length} items seleccionados`);
    };

    if (loading && refreshKey === 0) {
        return (
            <div className="inventory-loading">
                <div className="loading-spinner"></div>
                <p>Cargando inventario...</p>
            </div>
        );
    }

    return (
        <div className="inventory-main">
            {/* Encabezado del inventario */}
            <div className="inventory-header">
                <div className="header-content">
                    <h1 className="inventory-title">Gestión de Inventario</h1>
                    <p className="inventory-subtitle">
                        Administra y controla tu inventario en tiempo real
                        <span className="item-count">
                            {filteredData.length} productos en stock
                        </span>
                    </p>
                </div>

                <div className="header-actions">
                    <button 
                        className="refresh-btn"
                        onClick={handleRefresh}
                        disabled={loading}
                    >
                        {loading ? '🔄 Actualizando...' : '🔄 Actualizar'}
                    </button>
                    <button className="help-btn">
                        ❓ Ayuda
                    </button>
                </div>
            </div>

            {/* Mensaje de error */}
            {error && (
                <div className="inventory-error">
                    <div className="error-content">
                        <span className="error-icon">⚠️</span>
                        <div className="error-message">
                            <strong>Error:</strong> {error}
                        </div>
                    </div>
                    <button className="error-dismiss" onClick={() => setError(null)}>
                        ×
                    </button>
                </div>
            )}

            {/* Estadísticas del inventario */}
            <InventoryStats 
                data={filteredData}
                loading={loading}
            />

            {/* Filtros del inventario */}
            <InventoryFilters 
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
                data={inventoryData}
            />

            {/* Acciones del inventario */}
            <InventoryActions 
                selectedCount={selectedItems.length}
                totalCount={filteredData.length}
                onExport={handleExport}
                onBulkAction={handleBulkAction}
                onSelectAll={handleSelectAll}
                isAllSelected={selectedItems.length === filteredData.length && filteredData.length > 0}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
            />

            {/* Lista principal del inventario */}
            <InventoryList 
                data={filteredData}
                loading={loading}
                selectedItems={selectedItems}
                onSelectItem={handleSelectItem}
                viewMode={viewMode}
                onEdit={(item) => console.log('Editar:', item)}
                onDelete={(item) => console.log('Eliminar:', item)}
                onViewDetails={(item) => console.log('Ver detalles:', item)}
            />

            {/* Reportes del inventario */}
            <InventoryReports 
                data={filteredData}
                selectedItems={selectedItems}
            />

            {/* Información del pie */}
            <div className="inventory-footer">
                <div className="footer-info">
                    <div className="info-item">
                        <span className="info-label">Valor total del inventario:</span>
                        <span className="info-value">
                            ${filteredData.reduce((sum, item) => sum + (item.currentStock * item.unitPrice), 0).toLocaleString()}
                        </span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Productos con stock bajo:</span>
                        <span className="info-value warning">
                            {filteredData.filter(item => item.currentStock < item.minStock).length}
                        </span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Sin stock:</span>
                        <span className="info-value danger">
                            {filteredData.filter(item => item.currentStock === 0).length}
                        </span>
                    </div>
                </div>

                <div className="footer-actions">
                    <button className="footer-btn backup">
                        💾 Backup de inventario
                    </button>
                    <button className="footer-btn audit">
                        🔍 Iniciar auditoría
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InventoryMain;