import React, { useState } from 'react';
import '../../assets/styles/categoria/CategoryForm.css';

const CategoryForm = ({ onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'active'
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Validar formulario
    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.name.trim()) {
            newErrors.name = 'El nombre es requerido';
        } else if (formData.name.length < 3) {
            newErrors.name = 'El nombre debe tener al menos 3 caracteres';
        }

        if (formData.description && formData.description.length > 500) {
            newErrors.description = 'La descripción no debe exceder 500 caracteres';
        }

        return newErrors;
    };

    // Manejar cambios en los inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Limpiar error del campo cuando el usuario comienza a escribir
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Manejar envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            const response = await fetch('http://localhost:3000/api/categories', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al crear la categoría');
            }

            setSuccessMessage('¡Categoría creada exitosamente!');
            setFormData({
                name: '',
                description: '',
                status: 'active'
            });

            // Esperar 2 segundos antes de llamar a onSuccess
            setTimeout(() => {
                if (onSuccess) onSuccess();
            }, 2000);

        } catch (err) {
            setErrors({ submit: err.message });
            console.error('Error creating category:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="category-form-overlay">
            <div className="category-form-container">
                <div className="form-header">
                    <h2>Crear Nueva Categoría</h2>
                    <button onClick={onCancel} className="close-btn">×</button>
                </div>

                {successMessage && (
                    <div className="success-message">
                        ✅ {successMessage}
                    </div>
                )}

                {errors.submit && (
                    <div className="error-message">
                        ❌ {errors.submit}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="category-form">
                    <div className="form-group">
                        <label htmlFor="name">
                            Nombre de la Categoría *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Ej: Electrónicos, Ropa, Alimentos"
                            className={errors.name ? 'error' : ''}
                            disabled={loading}
                        />
                        {errors.name && (
                            <span className="error-text">{errors.name}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">
                            Descripción
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Descripción detallada de la categoría (opcional)"
                            rows="4"
                            className={errors.description ? 'error' : ''}
                            disabled={loading}
                        />
                        {errors.description && (
                            <span className="error-text">{errors.description}</span>
                        )}
                        <div className="char-counter">
                            {formData.description.length}/500 caracteres
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="status">
                            Estado
                        </label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            disabled={loading}
                        >
                            <option value="active">Activo</option>
                            <option value="inactive">Inactivo</option>
                        </select>
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="btn-cancel"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn-submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Creando...
                                </>
                            ) : (
                                'Crear Categoría'
                            )}
                        </button>
                    </div>
                </form>

                <div className="form-help">
                    <p><strong>Nota:</strong> Los campos marcados con * son obligatorios.</p>
                    <p>Las categorías ayudan a organizar tus productos de manera eficiente.</p>
                </div>
            </div>
        </div>
    );
};

export default CategoryForm;