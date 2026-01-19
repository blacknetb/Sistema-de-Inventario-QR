import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CategoryItem from './CategoryItem';
import CategoryFilters from './CategoryFilters';
import CategoryStats from './CategoryStats';
import '../../assets/styles/CATEGORIES/categories.css';

const CategoriesList = () => {
    const [categories, setCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('todos');
    const [sortBy, setSortBy] = useState('nombre');
    const [sortOrder, setSortOrder] = useState('asc');
    const navigate = useNavigate();

    // Cargar categorías al montar el componente
    useEffect(() => {
        fetchCategories();
    }, []);

    // Filtrar y ordenar categorías cuando cambian los filtros
    useEffect(() => {
        filterAndSortCategories();
    }, [categories, searchTerm, statusFilter, sortBy, sortOrder]);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/api/categories', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar las categorías');
            }

            const data = await response.json();
            setCategories(data);
            setFilteredCategories(data);
        } catch (err) {
            setError(err.message);
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const filterAndSortCategories = () => {
        let filtered = [...categories];

        // Filtrar por búsqueda
        if (searchTerm) {
            filtered = filtered.filter(category =>
                category.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                category.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                category.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtrar por estado
        if (statusFilter !== 'todos') {
            filtered = filtered.filter(category => 
                category.estado === (statusFilter === 'activo')
            );
        }

        // Ordenar
        filtered.sort((a, b) => {
            let aValue, bValue;

            if (sortBy === 'productos') {
                aValue = a.total_productos || 0;
                bValue = b.total_productos || 0;
            } else if (sortBy === 'valor') {
                aValue = a.valor_total || 0;
                bValue = b.valor_total || 0;
            } else if (sortBy === 'fecha') {
                aValue = new Date(a.fecha_creacion || a.updatedAt);
                bValue = new Date(b.fecha_creacion || b.updatedAt);
            } else {
                aValue = a[sortBy]?.toString().toLowerCase() || '';
                bValue = b[sortBy]?.toString().toLowerCase() || '';
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        setFilteredCategories(filtered);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/api/categories/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al eliminar la categoría');
            }

            // Actualizar la lista de categorías
            setCategories(categories.filter(category => category._id !== id));
            
            // Mostrar mensaje de éxito
            alert('Categoría eliminada exitosamente');
        } catch (err) {
            alert(`Error al eliminar: ${err.message}`);
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/api/categories/${id}/toggle-status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ estado: !currentStatus })
            });

            if (!response.ok) {
                throw new Error('Error al cambiar el estado');
            }

            // Actualizar el estado localmente
            setCategories(categories.map(category =>
                category._id === id 
                    ? { ...category, estado: !currentStatus }
                    : category
            ));

            alert('Estado actualizado exitosamente');
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(categories, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `categorias-inventario-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Cargando categorías...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error-icon">⚠️</div>
                <h3>Error al cargar categorías</h3>
                <p>{error}</p>
                <button 
                    onClick={fetchCategories}
                    className="btn btn-primary"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="categories-list-container">
            <div className="categories-toolbar">
                <div className="toolbar-left">
                    <h2>Lista de Categorías</h2>
                    <span className="badge badge-info">
                        {filteredCategories.length} categorías
                    </span>
                </div>
                
                <div className="toolbar-right">
                    <button
                        onClick={() => navigate('/categories/new')}
                        className="btn btn-primary"
                    >
                        <i className="fas fa-plus"></i>
                        Nueva Categoría
                    </button>
                    
                    <button
                        onClick={handleExport}
                        className="btn btn-secondary"
                    >
                        <i className="fas fa-download"></i>
                        Exportar
                    </button>
                </div>
            </div>

            <CategoryFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
            />

            <CategoryStats categories={categories} />

            {filteredCategories.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📁</div>
                    <h3>No se encontraron categorías</h3>
                    <p>
                        {searchTerm || statusFilter !== 'todos' 
                            ? 'Intenta con otros criterios de búsqueda' 
                            : 'Comienza creando tu primera categoría'}
                    </p>
                    <button
                        onClick={() => navigate('/categories/new')}
                        className="btn btn-primary"
                    >
                        <i className="fas fa-plus"></i>
                        Crear Categoría
                    </button>
                </div>
            ) : (
                <div className="categories-grid">
                    {filteredCategories.map(category => (
                        <CategoryItem
                            key={category._id}
                            category={category}
                            onEdit={() => navigate(`/categories/edit/${category._id}`)}
                            onDelete={() => handleDelete(category._id)}
                            onToggleStatus={() => handleToggleStatus(category._id, category.estado)}
                        />
                    ))}
                </div>
            )}

            <div className="pagination-controls">
                <div className="pagination-info">
                    Mostrando {filteredCategories.length} de {categories.length} categorías
                </div>
            </div>
        </div>
    );
};

export default CategoriesList;