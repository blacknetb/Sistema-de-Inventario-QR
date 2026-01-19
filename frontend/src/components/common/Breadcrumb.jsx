import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import '../../assets/styles/Common/common.css';

const Breadcrumb = ({ customPath = null }) => {
    const location = useLocation();
    
    // Definir rutas con nombres amigables
    const routeNames = {
        '/dashboard': 'Dashboard',
        '/products': 'Productos',
        '/products/new': 'Nuevo Producto',
        '/products/edit': 'Editar Producto',
        '/categories': 'Categorías',
        '/categories/new': 'Nueva Categoría',
        '/suppliers': 'Proveedores',
        '/reports': 'Reportes',
        '/inventory': 'Inventario',
        '/users': 'Usuarios',
        '/profile': 'Perfil',
        '/settings': 'Configuración',
        '/help': 'Ayuda'
    };

    const getPathSegments = () => {
        if (customPath) return customPath;
        
        const path = location.pathname;
        const segments = path.split('/').filter(segment => segment);
        
        const breadcrumbs = [{ path: '/', label: 'Inicio' }];
        
        let currentPath = '';
        segments.forEach((segment, index) => {
            currentPath += `/${segment}`;
            
            // Buscar nombre en routeNames
            let label = routeNames[currentPath];
            
            // Si no existe, intentar capitalizar
            if (!label) {
                // Para IDs, mostrar "Detalles"
                if (!isNaN(segment) || segment.length > 20) {
                    const parentPath = `/${segments.slice(0, index).join('/')}`;
                    label = routeNames[parentPath] ? 'Detalles' : 'Item';
                } else {
                    // Capitalizar primera letra
                    label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
                }
            }
            
            breadcrumbs.push({
                path: currentPath,
                label: label
            });
        });
        
        return breadcrumbs;
    };

    const segments = getPathSegments();

    return (
        <nav className="breadcrumb" aria-label="breadcrumb">
            <ol className="breadcrumb-list">
                {segments.map((segment, index) => {
                    const isLast = index === segments.length - 1;
                    
                    return (
                        <li key={segment.path} className="breadcrumb-item">
                            {isLast ? (
                                <span className="breadcrumb-current" aria-current="page">
                                    {segment.label}
                                </span>
                            ) : (
                                <Link to={segment.path} className="breadcrumb-link">
                                    {segment.label}
                                </Link>
                            )}
                            
                            {!isLast && (
                                <span className="breadcrumb-separator">
                                    <i className="fas fa-chevron-right"></i>
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>
            
            {/* Acciones rápidas en breadcrumb */}
            {segments.length > 1 && (
                <div className="breadcrumb-actions">
                    <button
                        className="btn btn-sm btn-outline"
                        onClick={() => window.history.back()}
                    >
                        <i className="fas fa-arrow-left"></i>
                        Volver
                    </button>
                    
                    {segments[segments.length - 1].path.includes('/edit') && (
                        <button
                            className="btn btn-sm btn-primary"
                            onClick={() => {
                                // Lógica para guardar cambios
                                alert('Cambios guardados');
                            }}
                        >
                            <i className="fas fa-save"></i>
                            Guardar
                        </button>
                    )}
                    
                    {segments[segments.length - 1].path === '/dashboard' && (
                        <button
                            className="btn btn-sm btn-success"
                            onClick={() => window.location.reload()}
                        >
                            <i className="fas fa-sync-alt"></i>
                            Actualizar
                        </button>
                    )}
                </div>
            )}
        </nav>
    );
};

Breadcrumb.propTypes = {
    customPath: PropTypes.arrayOf(PropTypes.shape({
        path: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired
    }))
};

export default Breadcrumb;