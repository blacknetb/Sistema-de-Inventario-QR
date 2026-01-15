/**
 * QuickActions.js
 * Componente de acciones rápidas
 * Ubicación: E:\portafolio de desarrollo web\app web\proyectos basicos\inventarios basicos\frontend\src\components\dashboard\QuickActions.js
 */

import React, { useState } from 'react';
import './QuickActions.css';

const QuickActions = () => {
    const [activeCategory, setActiveCategory] = useState('all');
    const [recentActions, setRecentActions] = useState([]);

    // Categorías de acciones
    const actionCategories = [
        { id: 'all', label: 'Todas', icon: '📋' },
        { id: 'inventory', label: 'Inventario', icon: '📦' },
        { id: 'sales', label: 'Ventas', icon: '💰' },
        { id: 'purchases', label: 'Compras', icon: '🛒' },
        { id: 'reports', label: 'Reportes', icon: '📊' },
        { id: 'settings', label: 'Configuración', icon: '⚙️' }
    ];

    // Acciones disponibles
    const availableActions = [
        {
            id: 1,
            title: 'Agregar Nuevo Producto',
            description: 'Registrar un nuevo producto en el inventario',
            icon: '➕',
            category: 'inventory',
            color: '#3B82F6',
            shortcut: 'Ctrl+P',
            requiresConfirmation: false
        },
        {
            id: 2,
            title: 'Registrar Venta',
            description: 'Crear una nueva orden de venta',
            icon: '💰',
            category: 'sales',
            color: '#10B981',
            shortcut: 'Ctrl+S',
            requiresConfirmation: true
        },
        {
            id: 3,
            title: 'Realizar Compra',
            description: 'Crear orden de compra a proveedor',
            icon: '🛒',
            category: 'purchases',
            color: '#F59E0B',
            shortcut: 'Ctrl+O',
            requiresConfirmation: true
        },
        {
            id: 4,
            title: 'Ajustar Stock',
            description: 'Corregir cantidades de inventario',
            icon: '📊',
            category: 'inventory',
            color: '#8B5CF6',
            shortcut: 'Ctrl+A',
            requiresConfirmation: true
        },
        {
            id: 5,
            title: 'Generar Reporte',
            description: 'Crear reporte de ventas o inventario',
            icon: '📈',
            category: 'reports',
            color: '#EC4899',
            shortcut: 'Ctrl+R',
            requiresConfirmation: false
        },
        {
            id: 6,
            title: 'Enviar Recordatorio',
            description: 'Notificar a clientes o proveedores',
            icon: '📧',
            category: 'sales',
            color: '#06B6D4',
            shortcut: 'Ctrl+M',
            requiresConfirmation: true
        },
        {
            id: 7,
            title: 'Programar Backup',
            description: 'Programar copia de seguridad',
            icon: '💾',
            category: 'settings',
            color: '#14B8A6',
            shortcut: 'Ctrl+B',
            requiresConfirmation: false
        },
        {
            id: 8,
            title: 'Auditar Inventario',
            description: 'Iniciar auditoría de inventario',
            icon: '🔍',
            category: 'inventory',
            color: '#EF4444',
            shortcut: 'Ctrl+I',
            requiresConfirmation: true
        }
    ];

    // Filtrar acciones por categoría
    const filteredActions = activeCategory === 'all' 
        ? availableActions 
        : availableActions.filter(action => action.category === activeCategory);

    // Manejar clic en acción
    const handleActionClick = (action) => {
        console.log('Ejecutando acción:', action.title);
        
        // Agregar a acciones recientes
        const newAction = {
            ...action,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };
        
        setRecentActions(prev => [newAction, ...prev.slice(0, 4)]);
        
        // Simular ejecución
        setTimeout(() => {
            setRecentActions(prev => 
                prev.map(a => 
                    a.id === action.id && a.timestamp === newAction.timestamp
                        ? { ...a, status: 'completed' }
                        : a
                )
            );
        }, 1500);
        
        // Mostrar confirmación si es necesario
        if (action.requiresConfirmation) {
            if (window.confirm(`¿Estás seguro de ejecutar "${action.title}"?`)) {
                alert(`Acción "${action.title}" ejecutada exitosamente.`);
            }
        } else {
            alert(`Acción "${action.title}" iniciada.`);
        }
    };

    // Formatear tiempo relativo
    const formatRelativeTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Justo ahora';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Acciones favoritas (basado en uso reciente)
    const favoriteActions = availableActions.slice(0, 3);

    return (
        <div className="quick-actions">
            <div className="actions-header">
                <h3 className="actions-title">
                    Acciones Rápidas
                    <span className="actions-subtitle">
                        Tareas frecuentes de un solo clic
                    </span>
                </h3>
                
                <div className="shortcuts-info">
                    <span className="shortcuts-label">Atajos de teclado disponibles</span>
                </div>
            </div>

            {/* Acciones favoritas */}
            <div className="favorite-actions">
                <h4 className="favorite-title">
                    <span className="favorite-icon">⭐</span>
                    Acciones Frecuentes
                </h4>
                
                <div className="favorite-grid">
                    {favoriteActions.map(action => (
                        <button
                            key={action.id}
                            className="favorite-action"
                            style={{ borderLeftColor: action.color }}
                            onClick={() => handleActionClick(action)}
                        >
                            <div className="favorite-icon-wrapper">
                                <span className="action-icon">{action.icon}</span>
                            </div>
                            <div className="favorite-content">
                                <span className="action-title">{action.title}</span>
                                <span className="action-shortcut">{action.shortcut}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Filtro de categorías */}
            <div className="actions-categories">
                <div className="categories-list">
                    {actionCategories.map(category => (
                        <button
                            key={category.id}
                            className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
                            onClick={() => setActiveCategory(category.id)}
                        >
                            <span className="category-icon">{category.icon}</span>
                            <span className="category-label">{category.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid de acciones */}
            <div className="actions-grid">
                {filteredActions.map(action => (
                    <div
                        key={action.id}
                        className="action-card"
                        style={{ borderTopColor: action.color }}
                        onClick={() => handleActionClick(action)}
                    >
                        <div className="card-header">
                            <div 
                                className="action-icon-wrapper"
                                style={{ backgroundColor: `${action.color}20` }}
                            >
                                <span 
                                    className="action-icon"
                                    style={{ color: action.color }}
                                >
                                    {action.icon}
                                </span>
                            </div>
                            <span className="action-shortcut">{action.shortcut}</span>
                        </div>
                        
                        <div className="card-body">
                            <h4 className="action-title">{action.title}</h4>
                            <p className="action-description">{action.description}</p>
                        </div>
                        
                        <div className="card-footer">
                            <span className="action-category">
                                {actionCategories.find(c => c.id === action.category)?.label}
                            </span>
                            <span className="action-arrow">→</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Historial reciente */}
            {recentActions.length > 0 && (
                <div className="recent-actions">
                    <h4 className="recent-title">
                        <span className="recent-icon">🕒</span>
                        Acciones Recientes
                    </h4>
                    
                    <div className="recent-list">
                        {recentActions.map((action, index) => (
                            <div 
                                key={`${action.id}-${action.timestamp}`}
                                className="recent-item"
                            >
                                <div className="recent-icon-wrapper">
                                    <span className="action-icon">{action.icon}</span>
                                </div>
                                
                                <div className="recent-content">
                                    <div className="recent-header">
                                        <span className="recent-title">{action.title}</span>
                                        <span className="recent-time">
                                            {formatRelativeTime(action.timestamp)}
                                        </span>
                                    </div>
                                    
                                    <div className="recent-status">
                                        <span className={`status-badge ${action.status}`}>
                                            {action.status === 'pending' ? 'En proceso...' : 'Completado'}
                                        </span>
                                        <span className="recent-shortcut">{action.shortcut}</span>
                                    </div>
                                </div>
                                
                                <div className="recent-indicator">
                                    {action.status === 'pending' ? (
                                        <div className="spinner"></div>
                                    ) : (
                                        <span className="status-icon">✅</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="actions-footer">
                <div className="footer-info">
                    <span className="info-text">
                        <strong>Tip:</strong> Usa atajos de teclado para acceder más rápido
                    </span>
                </div>
                
                <div className="footer-actions">
                    <button className="footer-btn customize">
                        ⚙️ Personalizar acciones
                    </button>
                    <button className="footer-btn shortcuts">
                        ⌨️ Ver todos los atajos
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuickActions;