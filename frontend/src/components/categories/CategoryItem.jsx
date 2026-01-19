import React from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/CATEGORIES/categories.css';

const CategoryItem = ({ category, onEdit, onDelete, onToggleStatus }) => {
    const {
        _id,
        nombre,
        descripcion,
        codigo,
        color,
        icono,
        estado,
        total_productos = 0,
        valor_total = 0,
        fecha_creacion,
        fecha_actualizacion
    } = category;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getProductCountClass = () => {
        if (total_productos === 0) return 'count-zero';
        if (total_productos <= 10) return 'count-low';
        if (total_productos <= 50) return 'count-medium';
        return 'count-high';
    };

    return (
        <div 
            className={`category-card ${!estado ? 'inactive' : ''}`}
            style={{ borderLeftColor: color }}
        >
            <div className="category-header">
                <div className="category-icon" style={{ backgroundColor: color }}>
                    {icono}
                </div>
                
                <div className="category-info">
                    <h3 className="category-name">{nombre}</h3>
                    <div className="category-code">
                        <code>{codigo}</code>
                        <span className={`status-badge ${estado ? 'active' : 'inactive'}`}>
                            {estado ? 'Activa' : 'Inactiva'}
                        </span>
                    </div>
                </div>

                <div className="category-actions">
                    <button 
                        onClick={() => onToggleStatus(_id, estado)}
                        className={`btn-status ${estado ? 'active' : 'inactive'}`}
                        title={estado ? 'Desactivar categoría' : 'Activar categoría'}
                    >
                        <i className={`fas ${estado ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                    </button>
                    
                    <button 
                        onClick={onEdit}
                        className="btn-action edit"
                        title="Editar categoría"
                    >
                        <i className="fas fa-edit"></i>
                    </button>
                    
                    <button 
                        onClick={onDelete}
                        className="btn-action delete"
                        title="Eliminar categoría"
                    >
                        <i className="fas fa-trash"></i>
                    </button>
                </div>
            </div>

            <div className="category-description">
                <p>{descripcion || 'Sin descripción'}</p>
            </div>

            <div className="category-stats">
                <div className="stat-item">
                    <div className="stat-icon">📦</div>
                    <div className="stat-content">
                        <span className="stat-label">Productos</span>
                        <span className={`stat-value ${getProductCountClass()}`}>
                            {total_productos}
                        </span>
                    </div>
                </div>
                
                <div className="stat-item">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                        <span className="stat-label">Valor Total</span>
                        <span className="stat-value">
                            {formatCurrency(valor_total)}
                        </span>
                    </div>
                </div>
                
                <div className="stat-item">
                    <div className="stat-icon">📅</div>
                    <div className="stat-content">
                        <span className="stat-label">Última Actualización</span>
                        <span className="stat-date">
                            {formatDate(fecha_actualizacion || fecha_creacion)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="category-footer">
                <div className="footer-actions">
                    <button 
                        onClick={onEdit}
                        className="btn btn-sm btn-outline"
                    >
                        <i className="fas fa-eye"></i> Ver Detalles
                    </button>
                    
                    <button 
                        onClick={() => {
                            // Navegar a productos de esta categoría
                            window.location.href = `/products?categoria=${_id}`;
                        }}
                        className="btn btn-sm btn-primary"
                    >
                        <i className="fas fa-boxes"></i> Ver Productos
                    </button>
                </div>
                
                <div className="category-id">
                    <small>ID: {_id?.substring(0, 8)}...</small>
                </div>
            </div>
        </div>
    );
};

CategoryItem.propTypes = {
    category: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        nombre: PropTypes.string.isRequired,
        descripcion: PropTypes.string,
        codigo: PropTypes.string.isRequired,
        color: PropTypes.string,
        icono: PropTypes.string,
        estado: PropTypes.bool,
        total_productos: PropTypes.number,
        valor_total: PropTypes.number,
        fecha_creacion: PropTypes.string,
        fecha_actualizacion: PropTypes.string
    }).isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onToggleStatus: PropTypes.func.isRequired
};

export default CategoryItem;