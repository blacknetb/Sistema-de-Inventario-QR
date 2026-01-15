import React from 'react';
import '../../assets/styles/categoria/CategoryCard.css';

const CategoryCard = ({ category, onEdit, onDelete }) => {
    // Función para obtener el color según el estado
    const getStatusColor = (status) => {
        return status === 'active' ? '#10b981' : '#ef4444';
    };

    // Función para obtener el texto del estado
    const getStatusText = (status) => {
        return status === 'active' ? 'Activo' : 'Inactivo';
    };

    // Formatear fecha
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Truncar descripción si es muy larga
    const truncateDescription = (description, maxLength = 100) => {
        if (!description) return 'Sin descripción';
        if (description.length <= maxLength) return description;
        return description.substring(0, maxLength) + '...';
    };

    return (
        <div className="category-card">
            <div className="card-header">
                <div className="category-icon">
                    📁
                </div>
                <div className="category-title">
                    <h3>{category.name}</h3>
                    <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(category.status) }}
                    >
                        {getStatusText(category.status)}
                    </span>
                </div>
            </div>

            <div className="card-body">
                <p className="category-description">
                    {truncateDescription(category.description)}
                </p>
                
                <div className="category-info">
                    <div className="info-item">
                        <span className="info-label">ID:</span>
                        <span className="info-value">
                            #{category._id ? category._id.substring(0, 8) : category.id}
                        </span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Creado:</span>
                        <span className="info-value">
                            {formatDate(category.createdAt)}
                        </span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Productos:</span>
                        <span className="info-value">
                            {category.productCount || 0}
                        </span>
                    </div>
                </div>
            </div>

            <div className="card-footer">
                <button
                    className="btn-card-edit"
                    onClick={() => onEdit(category)}
                    title="Editar categoría"
                >
                    ✏️ Editar
                </button>
                <button
                    className="btn-card-delete"
                    onClick={() => onDelete(category._id || category.id)}
                    title="Eliminar categoría"
                >
                    🗑️ Eliminar
                </button>
            </div>
        </div>
    );
};

export default CategoryCard;