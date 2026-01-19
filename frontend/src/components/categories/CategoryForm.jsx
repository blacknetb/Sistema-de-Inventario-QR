import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../../assets/styles/CATEGORIES/categories.css';

const CategoryForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);

    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        codigo: '',
        color: '#3b82f6',
        icono: '📦',
        estado: true
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Cargar datos si estamos en modo edición
    useEffect(() => {
        if (isEditMode) {
            fetchCategory();
        }
    }, [id]);

    const fetchCategory = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/api/categories/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar la categoría');
            }

            const data = await response.json();
            setFormData({
                nombre: data.nombre || '',
                descripcion: data.descripcion || '',
                codigo: data.codigo || '',
                color: data.color || '#3b82f6',
                icono: data.icono || '📦',
                estado: data.estado !== false
            });
        } catch (err) {
            alert(`Error: ${err.message}`);
            navigate('/categories');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Limpiar error del campo
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        } else if (formData.nombre.length < 2) {
            newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
        }

        if (!formData.codigo.trim()) {
            newErrors.codigo = 'El código es requerido';
        } else if (!/^[A-Z0-9-]+$/.test(formData.codigo)) {
            newErrors.codigo = 'Código inválido (solo mayúsculas, números y guiones)';
        }

        if (formData.descripcion && formData.descripcion.length > 500) {
            newErrors.descripcion = 'La descripción no puede exceder 500 caracteres';
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setSubmitting(true);

        try {
            const token = localStorage.getItem('token');
            const url = isEditMode 
                ? `http://localhost:3000/api/categories/${id}`
                : 'http://localhost:3000/api/categories';
            
            const method = isEditMode ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Error al guardar la categoría');
            }

            const result = await response.json();
            const message = isEditMode 
                ? 'Categoría actualizada exitosamente' 
                : 'Categoría creada exitosamente';
            
            alert(message);
            navigate('/categories');
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const iconosDisponibles = [
        '📦', '📁', '📂', '🗂️', '📊', '📈', '📉', '💻', '📱', '🖥️',
        '🖨️', '🎮', '📷', '🎥', '📺', '🔊', '🎧', '📚', '✏️', '📝',
        '🔧', '🔨', '⚙️', '🔩', '⚡', '🔋', '💡', '🔦', '🧰', '🛠️',
        '⚗️', '🧪', '🧫', '🔬', '💊', '🧴', '🧼', '🪒', '🧽', '🧹',
        '👕', '👖', '👔', '👗', '👞', '👟', '🧦', '🎩', '🧢', '👒',
        '🥾', '🧣', '🧤', '🥽', '👜', '💼', '🎒', '🧳', '☂️', '🧵',
        '🍎', '🍌', '🍇', '🍓', '🍊', '🥦', '🥕', '🌽', '🥔', '🍞',
        '🥩', '🥚', '🥛', '🧀', '🍯', '🍚', '🍜', '🍣', '🍕', '🍔',
        '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸'
    ];

    const coloresDisponibles = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
        '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
        '#14b8a6', '#f43f5e', '#0ea5e9', '#a855f7', '#d946ef',
        '#facc15', '#22c55e', '#eab308', '#ea580c', '#dc2626'
    ];

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Cargando categoría...</p>
            </div>
        );
    }

    return (
        <div className="category-form-container">
            <div className="form-header">
                <h2>
                    {isEditMode ? '✏️ Editar Categoría' : '➕ Nueva Categoría'}
                </h2>
                <p className="subtitle">
                    {isEditMode 
                        ? 'Modifica los datos de la categoría' 
                        : 'Completa el formulario para crear una nueva categoría'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="category-form">
                <div className="form-grid">
                    <div className="form-group">
                        <label htmlFor="nombre">
                            Nombre de la Categoría *
                        </label>
                        <input
                            type="text"
                            id="nombre"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            placeholder="Ej: Electrónica, Ropa, Alimentos"
                            className={errors.nombre ? 'input-error' : ''}
                            maxLength="100"
                        />
                        {errors.nombre && (
                            <span className="error-message">{errors.nombre}</span>
                        )}
                        <div className="char-count">
                            {formData.nombre.length}/100 caracteres
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="codigo">
                            Código Único *
                        </label>
                        <input
                            type="text"
                            id="codigo"
                            name="codigo"
                            value={formData.codigo}
                            onChange={handleChange}
                            placeholder="Ej: CAT-ELEC-001"
                            className={errors.codigo ? 'input-error' : ''}
                            maxLength="20"
                            style={{ textTransform: 'uppercase' }}
                        />
                        {errors.codigo && (
                            <span className="error-message">{errors.codigo}</span>
                        )}
                        <small className="form-help">
                            Solo mayúsculas, números y guiones
                        </small>
                    </div>

                    <div className="form-group full-width">
                        <label htmlFor="descripcion">
                            Descripción
                        </label>
                        <textarea
                            id="descripcion"
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            placeholder="Describe brevemente esta categoría..."
                            rows="4"
                            className={errors.descripcion ? 'input-error' : ''}
                            maxLength="500"
                        />
                        {errors.descripcion && (
                            <span className="error-message">{errors.descripcion}</span>
                        )}
                        <div className="char-count">
                            {formData.descripcion.length}/500 caracteres
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="icono">
                            Icono
                        </label>
                        <div className="icon-selector">
                            <div className="selected-icon">
                                <span className="icon-preview">{formData.icono}</span>
                                <input
                                    type="text"
                                    id="icono"
                                    name="icono"
                                    value={formData.icono}
                                    onChange={handleChange}
                                    maxLength="2"
                                />
                            </div>
                            <div className="icon-grid">
                                {iconosDisponibles.map((icono, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        className={`icon-option ${formData.icono === icono ? 'selected' : ''}`}
                                        onClick={() => setFormData(prev => ({ ...prev, icono }))}
                                        title={`Icono: ${icono}`}
                                    >
                                        {icono}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="color">
                            Color de Identificación
                        </label>
                        <div className="color-selector">
                            <input
                                type="color"
                                id="color"
                                name="color"
                                value={formData.color}
                                onChange={handleChange}
                                className="color-input"
                            />
                            <div className="color-preview" style={{ backgroundColor: formData.color }}></div>
                            <span className="color-value">{formData.color}</span>
                        </div>
                        <div className="color-grid">
                            {coloresDisponibles.map((color, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    className="color-option"
                                    style={{ backgroundColor: color }}
                                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="estado"
                                checked={formData.estado}
                                onChange={handleChange}
                            />
                            <span>Categoría Activa</span>
                        </label>
                        <small className="form-help">
                            Las categorías inactivas no aparecerán en las listas desplegables
                        </small>
                    </div>
                </div>

                <div className="form-preview">
                    <h4>Vista Previa:</h4>
                    <div 
                        className="preview-card"
                        style={{ 
                            borderLeftColor: formData.color,
                            backgroundColor: `${formData.color}10`
                        }}
                    >
                        <div className="preview-header">
                            <span className="preview-icon">{formData.icono}</span>
                            <div>
                                <h5>{formData.nombre || '[Nombre de la categoría]'}</h5>
                                <code>{formData.codigo || '[Código]'}</code>
                            </div>
                            <span className={`status-badge ${formData.estado ? 'active' : 'inactive'}`}>
                                {formData.estado ? 'Activa' : 'Inactiva'}
                            </span>
                        </div>
                        <p className="preview-description">
                            {formData.descripcion || '[Descripción de la categoría]'}
                        </p>
                        <div className="preview-stats">
                            <span>📦 0 productos</span>
                            <span>💰 $0.00 valor total</span>
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submitting}
                    >
                        {submitting ? (
                            <>
                                <span className="spinner-small"></span>
                                Guardando...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-save"></i>
                                {isEditMode ? 'Actualizar Categoría' : 'Crear Categoría'}
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => navigate('/categories')}
                        disabled={submitting}
                    >
                        <i className="fas fa-times"></i>
                        Cancelar
                    </button>

                    {isEditMode && (
                        <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => {
                                if (window.confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
                                    navigate(`/categories/delete/${id}`);
                                }
                            }}
                            disabled={submitting}
                        >
                            <i className="fas fa-trash"></i>
                            Eliminar
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default CategoryForm;