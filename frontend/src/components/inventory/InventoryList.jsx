/**
 * InventoryList.js
 * Componente para listar productos del inventario
 * Ubicación: E:\portafolio de desarrollo web\app web\proyectos basicos\inventarios basicos\frontend\src\components\inventory\InventoryList.js
 */

import React, { useState } from 'react';
import InventoryCard from './InventoryCard';
import InventoryTable from './InventoryTable';

const InventoryList = ({ 
    data, 
    loading, 
    selectedItems, 
    onSelectItem, 
    viewMode, 
    onEdit, 
    onDelete, 
    onViewDetails 
}) => {
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [expandedItem, setExpandedItem] = useState(null);

    // Ordenar datos
    const sortedData = [...data].sort((a, b) => {
        if (!sortConfig.key) return 0;

        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortConfig.direction === 'asc' 
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortConfig.direction === 'asc' 
                ? aValue - bValue
                : bValue - aValue;
        }

        return 0;
    });

    // Manejar ordenamiento
    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Manejar clic en item
    const handleItemClick = (itemId) => {
        onSelectItem(itemId);
    };

    // Manejar expansión de item
    const handleExpandItem = (itemId) => {
        setExpandedItem(expandedItem === itemId ? null : itemId);
    };

    // Obtener estado del stock
    const getStockStatus = (item) => {
        const percentage = (item.currentStock / item.maxStock) * 100;
        if (item.currentStock === 0) return 'out_of_stock';
        if (item.currentStock <= item.safetyStock) return 'critical';
        if (item.currentStock <= item.reorderPoint) return 'low';
        if (percentage <= 30) return 'warning';
        return 'good';
    };

    // Calcular valor total
    const calculateTotalValue = (item) => {
        return item.currentStock * item.unitPrice;
    };

    // Calcular días de inventario
    const calculateDaysOfInventory = (item) => {
        // Esto sería calculado con datos históricos de ventas
        const averageDailySales = 5; // Ejemplo
        return averageDailySales > 0 ? Math.floor(item.currentStock / averageDailySales) : 0;
    };

    if (loading) {
        return (
            <div className="inventory-list-loading">
                {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="loading-card">
                        <div className="loading-image"></div>
                        <div className="loading-content">
                            <div className="loading-title"></div>
                            <div className="loading-description"></div>
                            <div className="loading-stats"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (sortedData.length === 0) {
        return (
            <div className="inventory-empty">
                <div className="empty-icon">📦</div>
                <h3 className="empty-title">No hay productos en el inventario</h3>
                <p className="empty-message">
                    No se encontraron productos que coincidan con los filtros aplicados.
                </p>
                <button className="empty-action">
                    + Agregar primer producto
                </button>
            </div>
        );
    }

    return (
        <div className="inventory-list-container">
            {viewMode === 'table' ? (
                <InventoryTable
                    data={sortedData}
                    selectedItems={selectedItems}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    onSelectItem={handleItemClick}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onViewDetails={onViewDetails}
                    getStockStatus={getStockStatus}
                    calculateTotalValue={calculateTotalValue}
                    calculateDaysOfInventory={calculateDaysOfInventory}
                />
            ) : (
                <div className="inventory-grid">
                    {sortedData.map(item => (
                        <InventoryCard
                            key={item.id}
                            item={item}
                            isSelected={selectedItems.includes(item.id)}
                            isExpanded={expandedItem === item.id}
                            onSelect={() => handleItemClick(item.id)}
                            onExpand={() => handleExpandItem(item.id)}
                            onEdit={() => onEdit(item)}
                            onDelete={() => onDelete(item)}
                            onViewDetails={() => onViewDetails(item)}
                            stockStatus={getStockStatus(item)}
                            totalValue={calculateTotalValue(item)}
                            daysOfInventory={calculateDaysOfInventory(item)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default InventoryList;