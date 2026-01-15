/**
 * InventoryActions.js
 * Componente de acciones para el inventario
 * Ubicación: E:\portafolio de desarrollo web\app web\proyectos basicos\inventarios basicos\frontend\src\components\inventory\InventoryActions.js
 */

import React, { useState } from 'react';

const InventoryActions = ({
    selectedCount,
    totalCount,
    onExport,
    onBulkAction,
    onSelectAll,
    isAllSelected,
    viewMode,
    onViewModeChange
}) => {
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showBulkMenu, setShowBulkMenu] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(false);

    // Acciones de exportación
    const exportOptions = [
        { id: 'csv', label: 'Exportar a CSV', icon: '📄', description: 'Formato compatible con Excel' },
        { id: 'excel', label: 'Exportar a Excel', icon: '📊', description: 'Archivo .xlsx con formato' },
        { id: 'pdf', label: 'Exportar a PDF', icon: '📑', description: 'Reporte listo para imprimir' },
        { id: 'json', label: 'Exportar a JSON', icon: '{}', description: 'Datos estructurados' }
    ];

    // Acciones masivas
    const bulkActions = [
        { 
            id: 'adjust_stock', 
            label: 'Ajustar Stock', 
            icon: '📊', 
            description: 'Ajustar cantidades de productos seleccionados',
            requiresSelection: true,
            color: 'blue'
        },
        { 
            id: 'update_status', 
            label: 'Actualizar Estado', 
            icon: '🔄', 
            description: 'Cambiar estado de productos',
            requiresSelection: true,
            color: 'green'
        },
        { 
            id: 'update_prices', 
            label: 'Actualizar Precios', 
            icon: '💰', 
            description: 'Modificar precios masivamente',
            requiresSelection: true,
            color: 'yellow'
        },
        { 
            id: 'move_location', 
            label: 'Mover Ubicación', 
            icon: '📍', 
            description: 'Cambiar ubicación en almacén',
            requiresSelection: true,
            color: 'purple'
        },
        { 
            id: 'print_labels', 
            label: 'Imprimir Etiquetas', 
            icon: '🏷️', 
            description: 'Generar etiquetas para productos',
            requiresSelection: true,
            color: 'teal'
        },
        { 
            id: 'delete_selected', 
            label: 'Eliminar Seleccionados', 
            icon: '🗑️', 
            description: 'Eliminar productos del inventario',
            requiresSelection: true,
            color: 'red'
        }
    ];

    // Acciones rápidas
    const quickActions = [
        {
            id: 'add_product',
            label: 'Agregar Producto',
            icon: '➕',
            shortcut: 'Ctrl+P',
            description: 'Agregar nuevo producto al inventario'
        },
        {
            id: 'import_data',
            label: 'Importar Datos',
            icon: '📥',
            shortcut: 'Ctrl+I',
            description: 'Importar productos desde archivo'
        },
        {
            id: 'stock_take',
            label: 'Realizar Conteo',
            icon: '🔍',
            shortcut: 'Ctrl+T',
            description: 'Iniciar conteo físico de inventario'
        },
        {
            id: 'generate_report',
            label: 'Generar Reporte',
            icon: '📈',
            shortcut: 'Ctrl+R',
            description: 'Crear reporte del inventario'
        },
        {
            id: 'reorder_items',
            label: 'Reordenar Productos',
            icon: '🛒',
            shortcut: 'Ctrl+O',
            description: 'Generar órdenes de reabastecimiento'
        },
        {
            id: 'audit_trail',
            label: 'Ver Historial',
            icon: '📜',
            shortcut: 'Ctrl+H',
            description: 'Ver historial de cambios'
        }
    ];

    // Manejar exportación
    const handleExport = (format) => {
        setShowExportMenu(false);
        onExport(format);
    };

    // Manejar acción masiva
    const handleBulkAction = (actionId) => {
        setShowBulkMenu(false);
        onBulkAction(actionId);
    };

    // Manejar acción rápida
    const handleQuickAction = (actionId) => {
        setShowQuickActions(false);
        console.log('Acción rápida:', actionId);
        // Implementar lógica de acción rápida
        alert(`Ejecutando acción: ${actionId}`);
    };

    // Manejar selección de todos
    const handleSelectAll = () => {
        onSelectAll();
    };

    return (
        <div className="inventory-actions">
            <div className="actions-header">
                <div className="selection-info">
                    <div className="checkbox-container">
                        <input
                            type="checkbox"
                            id="selectAll"
                            checked={isAllSelected}
                            onChange={handleSelectAll}
                            disabled={totalCount === 0}
                            className="select-all-checkbox"
                        />
                        <label htmlFor="selectAll" className="select-all-label">
                            Seleccionar todos
                        </label>
                    </div>
                    
                    <div className="selection-count">
                        <span className="selected-text">
                            {selectedCount} de {totalCount} productos seleccionados
                        </span>
                        {selectedCount > 0 && (
                            <button 
                                className="clear-selection"
                                onClick={() => onBulkAction('clear_selection')}
                            >
                                Limpiar selección
                            </button>
                        )}
                    </div>
                </div>

                <div className="view-controls">
                    <div className="view-toggle">
                        <button 
                            className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                            onClick={() => onViewModeChange('table')}
                            title="Vista de tabla"
                        >
                            📋 Tabla
                        </button>
                        <button 
                            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => onViewModeChange('grid')}
                            title="Vista de tarjetas"
                        >
                            🃏 Tarjetas
                        </button>
                    </div>
                </div>
            </div>

            <div className="actions-main">
                {/* Acciones rápidas */}
                <div className="quick-actions-section">
                    <button 
                        className="quick-actions-toggle"
                        onClick={() => setShowQuickActions(!showQuickActions)}
                    >
                        <span className="toggle-icon">⚡</span>
                        <span className="toggle-text">Acciones Rápidas</span>
                        <span className="toggle-arrow">
                            {showQuickActions ? '▲' : '▼'}
                        </span>
                    </button>

                    {showQuickActions && (
                        <div className="quick-actions-menu">
                            <div className="menu-header">
                                <h4>Acciones Rápidas</h4>
                                <span className="menu-subtitle">Atajos para tareas frecuentes</span>
                            </div>
                            
                            <div className="actions-grid">
                                {quickActions.map(action => (
                                    <button
                                        key={action.id}
                                        className="quick-action-btn"
                                        onClick={() => handleQuickAction(action.id)}
                                        title={`${action.description} (${action.shortcut})`}
                                    >
                                        <div className="action-icon">{action.icon}</div>
                                        <div className="action-content">
                                            <span className="action-label">{action.label}</span>
                                            <span className="action-shortcut">{action.shortcut}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Acciones principales */}
                <div className="main-actions">
                    <div className="action-group">
                        <button 
                            className="action-btn primary"
                            onClick={() => handleQuickAction('add_product')}
                        >
                            <span className="btn-icon">➕</span>
                            <span className="btn-text">Agregar Producto</span>
                        </button>
                        
                        <button 
                            className="action-btn secondary"
                            onClick={() => handleQuickAction('import_data')}
                        >
                            <span className="btn-icon">📥</span>
                            <span className="btn-text">Importar</span>
                        </button>
                        
                        <button 
                            className="action-btn secondary"
                            onClick={() => handleQuickAction('stock_take')}
                        >
                            <span className="btn-icon">🔍</span>
                            <span className="btn-text">Conteo Físico</span>
                        </button>
                    </div>

                    <div className="action-group">
                        {/* Menú de exportación */}
                        <div className="dropdown-container">
                            <button 
                                className="action-btn export"
                                onClick={() => setShowExportMenu(!showExportMenu)}
                            >
                                <span className="btn-icon">📤</span>
                                <span className="btn-text">Exportar</span>
                                <span className="btn-arrow">▼</span>
                            </button>
                            
                            {showExportMenu && (
                                <div className="dropdown-menu export-menu">
                                    <div className="menu-header">
                                        <h5>Exportar Datos</h5>
                                        <span className="menu-subtitle">Selecciona el formato</span>
                                    </div>
                                    
                                    <div className="menu-items">
                                        {exportOptions.map(option => (
                                            <button
                                                key={option.id}
                                                className="menu-item"
                                                onClick={() => handleExport(option.id)}
                                            >
                                                <span className="item-icon">{option.icon}</span>
                                                <div className="item-content">
                                                    <span className="item-label">{option.label}</span>
                                                    <span className="item-description">{option.description}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Menú de acciones masivas */}
                        <div className="dropdown-container">
                            <button 
                                className={`action-btn bulk ${selectedCount > 0 ? 'has-selection' : ''}`}
                                onClick={() => setShowBulkMenu(!showBulkMenu)}
                                disabled={selectedCount === 0}
                            >
                                <span className="btn-icon">⚡</span>
                                <span className="btn-text">
                                    Acciones Masivas
                                    {selectedCount > 0 && (
                                        <span className="selection-badge">{selectedCount}</span>
                                    )}
                                </span>
                                <span className="btn-arrow">▼</span>
                            </button>
                            
                            {showBulkMenu && (
                                <div className="dropdown-menu bulk-menu">
                                    <div className="menu-header">
                                        <h5>Acciones Masivas</h5>
                                        <span className="menu-subtitle">
                                            Aplicar a {selectedCount} productos seleccionados
                                        </span>
                                    </div>
                                    
                                    <div className="menu-items">
                                        {bulkActions.map(action => (
                                            <button
                                                key={action.id}
                                                className={`menu-item ${action.color}`}
                                                onClick={() => handleBulkAction(action.id)}
                                                disabled={action.requiresSelection && selectedCount === 0}
                                                title={action.description}
                                            >
                                                <span className="item-icon">{action.icon}</span>
                                                <div className="item-content">
                                                    <span className="item-label">{action.label}</span>
                                                    <span className="item-description">{action.description}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Acciones adicionales */}
            <div className="additional-actions">
                <div className="action-group">
                    <button className="action-btn tertiary">
                        <span className="btn-icon">🔄</span>
                        <span className="btn-text">Sincronizar</span>
                    </button>
                    
                    <button className="action-btn tertiary">
                        <span className="btn-icon">🔔</span>
                        <span className="btn-text">Alertas</span>
                    </button>
                    
                    <button className="action-btn tertiary">
                        <span className="btn-icon">⚙️</span>
                        <span className="btn-text">Configuración</span>
                    </button>
                </div>

                <div className="stats-preview">
                    <div className="stat-preview">
                        <span className="stat-label">Valor seleccionado:</span>
                        <span className="stat-value">$--</span>
                    </div>
                    <div className="stat-preview">
                        <span className="stat-label">Acción disponible:</span>
                        <span className="stat-value">{selectedCount > 0 ? 'Sí' : 'No'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryActions;