import React, { useState, useEffect } from 'react';
import CategoryForm from './CategoryForm';
import CategoryEdit from './CategoryEdit';
import '../../assets/styles/categoria/CategoryList.css';

const CategoryList = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [categoriesPerPage] = useState(10);

    // Cargar categorías desde el backend
    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:3000/api/categories', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar las categorías');
            }

            const data = await response.json();
            setCategories(data);
            setError(null);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching categories:', err);
        } finally {
            setLoading(false);
        }
    };

    // Cargar categorías al montar el componente
    useEffect(() => {
        fetchCategories();
    }, []);

    // Manejar eliminación de categoría
    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar esta categoría?')) {
            try {
                const response = await fetch(`http://localhost:3000/api/categories/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Error al eliminar la categoría');
                }

                // Actualizar la lista de categorías
                fetchCategories();
            } catch (err) {
                setError(err.message);
                console.error('Error deleting category:', err);
            }
        }
    };

    // Manejar edición de categoría
    const handleEdit = (category) => {
        setEditingCategory(category);
    };

    // Manejar cancelar edición
    const handleCancelEdit = () => {
        setEditingCategory(null);
    };

    // Manejar éxito de operación
    const handleSuccess = () => {
        setShowForm(false);
        setEditingCategory(null);
        fetchCategories();
    };

    // Filtrar categorías por término de búsqueda
    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Paginación
    const indexOfLastCategory = currentPage * categoriesPerPage;
    const indexOfFirstCategory = indexOfLastCategory - categoriesPerPage;
    const currentCategories = filteredCategories.slice(indexOfFirstCategory, indexOfLastCategory);
    const totalPages = Math.ceil(filteredCategories.length / categoriesPerPage);

    // Cambiar página
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Cargando categorías...</p>
            </div>
        );
    }

    return (
        <div className="category-list-container">
            <div className="category-header">
                <h1>Gestor de Categorías</h1>
                <button 
                    className="btn-add-category"
                    onClick={() => setShowForm(true)}
                >
                    + Nueva Categoría
                </button>
            </div>

            {error && (
                <div className="error-alert">
                    <p>{error}</p>
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            <div className="search-container">
                <input
                    type="text"
                    placeholder="Buscar categoría por nombre o descripción..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <span className="search-icon">🔍</span>
            </div>

            {showForm && (
                <CategoryForm
                    onSuccess={handleSuccess}
                    onCancel={() => setShowForm(false)}
                />
            )}

            {editingCategory && (
                <CategoryEdit
                    category={editingCategory}
                    onSuccess={handleSuccess}
                    onCancel={handleCancelEdit}
                />
            )}

            {currentCategories.length === 0 ? (
                <div className="no-data">
                    <p>No hay categorías registradas.</p>
                </div>
            ) : (
                <>
                    <div className="table-responsive">
                        <table className="categories-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre</th>
                                    <th>Descripción</th>
                                    <th>Estado</th>
                                    <th>Fecha Creación</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentCategories.map((category) => (
                                    <tr key={category._id || category.id}>
                                        <td>#{category._id ? category._id.substring(0, 8) : category.id}</td>
                                        <td>{category.name}</td>
                                        <td>{category.description || 'Sin descripción'}</td>
                                        <td>
                                            <span className={`status-badge ${category.status === 'active' ? 'active' : 'inactive'}`}>
                                                {category.status === 'active' ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td>{new Date(category.createdAt).toLocaleDateString()}</td>
                                        <td className="actions">
                                            <button
                                                className="btn-edit"
                                                onClick={() => handleEdit(category)}
                                            >
                                                ✏️ Editar
                                            </button>
                                            <button
                                                className="btn-delete"
                                                onClick={() => handleDelete(category._id || category.id)}
                                            >
                                                🗑️ Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="page-btn"
                            >
                                ← Anterior
                            </button>
                            
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                                <button
                                    key={number}
                                    onClick={() => paginate(number)}
                                    className={`page-number ${currentPage === number ? 'active' : ''}`}
                                >
                                    {number}
                                </button>
                            ))}
                            
                            <button
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="page-btn"
                            >
                                Siguiente →
                            </button>
                        </div>
                    )}

                    <div className="summary">
                        <p>Mostrando {currentCategories.length} de {filteredCategories.length} categorías</p>
                        <p>Página {currentPage} de {totalPages}</p>
                    </div>
                </>
            )}
        </div>
    );
};

export default CategoryList;