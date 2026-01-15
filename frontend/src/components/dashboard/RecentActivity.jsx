/**
 * RecentActivity.js
 * Componente de actividad reciente
 * Ubicación: E:\portafolio de desarrollo web\app web\proyectos basicos\inventarios basicos\frontend\src\components\dashboard\RecentActivity.js
 */

import React, { useState } from 'react';
import './RecentActivity.css';

const RecentActivity = ({ activities, loading }) => {
    const [filter, setFilter] = useState('all');
    const [expandedItem, setExpandedItem] = useState(null);

    // Actividades de ejemplo
    const sampleActivities = [
        {
            id: 1,
            type: 'sale',
            message: 'Venta realizada - Orden #12345',
            details: 'Productos: iPhone 14 (2), MacBook Pro (1). Total: $4,500',
            time: '2024-01-15T10:30:00Z',
            user: 'Juan Pérez',
            priority: 'high'
        },
        {
            id: 2,
            type: 'purchase',
            message: 'Compra recibida - Proveedor ABC',
            details: 'Productos recibidos: Teclados (50), Mouse (50). Factura #789',
            time: '2024-01-15T09:15:00Z',
            user: 'María García',
            priority: 'medium'
        },
        {
            id: 3,
            type: 'stock',
            message: 'Stock actualizado - Producto XYZ',
            details: 'Cantidad anterior: 45, Nueva cantidad: 85, Ajuste: +40',
            time: '2024-01-15T08:45:00Z',
            user: 'Carlos López',
            priority: 'low'
        },
        {
            id: 4,
            type: 'alert',
            message: 'Producto con stock bajo detectado',
            details: 'Producto: Monitor 27" - Stock actual: 5, Mínimo requerido: 20',
            time: '2024-01-15T08:00:00Z',
            user: 'Sistema',
            priority: 'high'
        },
        {
            id: 5,
            type: 'user',
            message: 'Nuevo usuario registrado',
            details: 'Usuario: ana.martinez, Rol: Vendedor, Departamento: Ventas',
            time: '2024-01-14T16:20:00Z',
            user: 'Ana Martínez',
            priority: 'medium'
        },
        {
            id: 6,
            type: 'system',
            message: 'Backup automático completado',
            details: 'Base de datos respaldada exitosamente. Tamaño: 2.4 GB',
            time: '2024-01-14T03:00:00Z',
            user: 'Sistema',
            priority: 'low'
        },
        {
            id: 7,
            type: 'return',
            message: 'Devolución procesada',
            details: 'Cliente: Luis González, Producto: Auriculares, Motivo: Defectuoso',
            time: '2024-01-14T14:30:00Z',
            user: 'Pedro Sánchez',
            priority: 'medium'
        }
    ];

    // Usar datos proporcionados o de ejemplo
    const activityData = activities && activities.length > 0 ? activities : sampleActivities;

    // Filtrar actividades
    const filteredActivities = filter === 'all' 
        ? activityData 
        : activityData.filter(activity => activity.type === filter);

    // Obtener ícono según tipo
    const getActivityIcon = (type) => {
        const icons = {
            sale: '💰',
            purchase: '🛒',
            stock: '📦',
            alert: '⚠️',
            user: '👤',
            system: '⚙️',
            return: '🔄'
        };
        return icons[type] || '📝';
    };

    // Obtener color según tipo
    const getActivityColor = (type) => {
        const colors = {
            sale: 'activity-sale',
            purchase: 'activity-purchase',
            stock: 'activity-stock',
            alert: 'activity-alert',
            user: 'activity-user',
            system: 'activity-system',
            return: 'activity-return'
        };
        return colors[type] || 'activity-default';
    };

    // Obtener etiqueta de prioridad
    const getPriorityLabel = (priority) => {
        const labels = {
            high: 'Alta',
            medium: 'Media',
            low: 'Baja'
        };
        return labels[priority] || 'Normal';
    };

    // Formatear fecha relativa
    const formatRelativeTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Justo ahora';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours} h`;
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} días`;
        
        return date.toLocaleDateString();
    };

    // Manejar clic en actividad
    const handleActivityClick = (id) => {
        setExpandedItem(expandedItem === id ? null : id);
    };

    // Manejar acción rápida
    const handleQuickAction = (activity, action) => {
        console.log(`Acción ${action} en actividad:`, activity);
        alert(`Acción ${action} ejecutada para: ${activity.message}`);
    };

    if (loading) {
        return (
            <div className="activities-loading">
                <div className="loading-spinner"></div>
                <p>Cargando actividades...</p>
            </div>
        );
    }

    return (
        <div className="recent-activities">
            <div className="activities-header">
                <h3 className="activities-title">
                    Actividad Reciente
                    <span className="activities-count">
                        {filteredActivities.length} actividades
                    </span>
                </h3>
                
                <div className="activities-controls">
                    <div className="activity-filters">
                        <button 
                            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            Todas
                        </button>
                        <button 
                            className={`filter-btn ${filter === 'sale' ? 'active' : ''}`}
                            onClick={() => setFilter('sale')}
                        >
                            Ventas
                        </button>
                        <button 
                            className={`filter-btn ${filter === 'purchase' ? 'active' : ''}`}
                            onClick={() => setFilter('purchase')}
                        >
                            Compras
                        </button>
                        <button 
                            className={`filter-btn ${filter === 'alert' ? 'active' : ''}`}
                            onClick={() => setFilter('alert')}
                        >
                            Alertas
                        </button>
                    </div>
                    
                    <button className="mark-all-read">
                        📌 Marcar todas como leídas
                    </button>
                </div>
            </div>

            <div className="activities-list">
                {filteredActivities.length === 0 ? (
                    <div className="no-activities">
                        <div className="no-activities-icon">📭</div>
                        <p className="no-activities-message">
                            No hay actividades {filter !== 'all' ? `de tipo ${filter}` : ''}
                        </p>
                    </div>
                ) : (
                    filteredActivities.map((activity) => (
                        <div 
                            key={activity.id}
                            className={`activity-item ${getActivityColor(activity.type)} ${expandedItem === activity.id ? 'expanded' : ''}`}
                            onClick={() => handleActivityClick(activity.id)}
                        >
                            <div className="activity-main">
                                <div className="activity-icon">
                                    {getActivityIcon(activity.type)}
                                </div>
                                
                                <div className="activity-content">
                                    <div className="activity-header">
                                        <h4 className="activity-title">{activity.message}</h4>
                                        <span className="activity-time">
                                            {formatRelativeTime(activity.time)}
                                        </span>
                                    </div>
                                    
                                    <div className="activity-meta">
                                        <span className="activity-user">
                                            👤 {activity.user}
                                        </span>
                                        <span className={`activity-priority priority-${activity.priority}`}>
                                            {getPriorityLabel(activity.priority)}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="activity-arrow">
                                    {expandedItem === activity.id ? '▲' : '▼'}
                                </div>
                            </div>

                            {/* Detalles expandidos */}
                            {expandedItem === activity.id && (
                                <div className="activity-details">
                                    <div className="details-content">
                                        <p className="details-text">{activity.details}</p>
                                        
                                        <div className="details-meta">
                                            <span className="meta-item">
                                                <strong>Hora exacta:</strong> {new Date(activity.time).toLocaleTimeString()}
                                            </span>
                                            <span className="meta-item">
                                                <strong>Fecha:</strong> {new Date(activity.time).toLocaleDateString()}
                                            </span>
                                        </div>
                                        
                                        <div className="details-actions">
                                            <button 
                                                className="action-btn view"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleQuickAction(activity, 'ver');
                                                }}
                                            >
                                                👁️ Ver detalles
                                            </button>
                                            <button 
                                                className="action-btn resolve"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleQuickAction(activity, 'resolver');
                                                }}
                                            >
                                                ✅ Marcar como resuelto
                                            </button>
                                            {activity.type === 'alert' && (
                                                <button 
                                                    className="action-btn restock"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleQuickAction(activity, 'reabastecer');
                                                    }}
                                                >
                                                    📦 Reabastecer
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div className="activities-footer">
                <div className="footer-stats">
                    <div className="stat-item">
                        <span className="stat-label">Total hoy:</span>
                        <span className="stat-value">
                            {activityData.filter(a => 
                                new Date(a.time).toDateString() === new Date().toDateString()
                            ).length}
                        </span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Alertas activas:</span>
                        <span className="stat-value">
                            {activityData.filter(a => a.type === 'alert').length}
                        </span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Por atender:</span>
                        <span className="stat-value">
                            {activityData.filter(a => a.priority === 'high').length}
                        </span>
                    </div>
                </div>
                
                <div className="footer-actions">
                    <button className="view-all-btn">
                        📋 Ver todas las actividades
                    </button>
                    <button className="clear-btn">
                        🗑️ Limpiar antiguas
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecentActivity;