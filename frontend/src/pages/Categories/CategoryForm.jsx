import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useLoading } from '../../contexts/LoadingContext';
import categoriesApi from '../../api/categoriesApi';
import styles from './CategoriesPage.module.css';

const CategoryForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { showNotification } = useNotification();
    const { withLoading } = useLoading();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        parentId: '',
        isActive: true
    });

    const [parentCategories, setParentCategories] = useState([]);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = Boolean(id);

    useEffect(() => {
        loadParentCategories();
        if (isEditing) {
            loadCategory();
        }
    }, [id]);

    const loadParentCategories = async () => {
        try {
            const response = await withLoading(categoriesApi.getParentCategories());
            if (response.success) {
                setParentCategories(response.data);
            }
        } catch (error) {
            showNotification('Error al cargar categorías padre', 'error');
        }
    };

    const loadCategory = async () => {
        try {
            const response = await withLoading(categoriesApi.getCategoryById(id));
            if (response.success) {
                const category = response.data;
                setFormData({
                    name: category.name || '',
                    description: category.description || '',
                    parentId: category.parentId || '',
                    isActive: category.isActive !== false
                });
            }
        } catch (error) {
            showNotification('Error al cargar la categoría', 'error');
            navigate('/categories');
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'El nombre es requerido';
        } else if (formData.name.length < 2) {
            newErrors.name = 'El nombre debe tener al menos 2 caracteres';
        }

        if (formData.parentId === id) {
            newErrors.parentId = 'Una categoría no puede ser padre de sí misma';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            showNotification('Por favor, corrige los errores en el formulario', 'warning');
            return;
        }

        setIsSubmitting(true);

        try {
            let response;
            if (isEditing) {
                response = await withLoading(categoriesApi.updateCategory(id, formData));
            } else {
                response = await withLoading(categoriesApi.createCategory(formData));
            }

            if (response.success) {
                showNotification(
                    isEditing ? 'Categoría actualizada exitosamente' : 'Categoría creada exitosamente',
                    'success'
                );
                navigate('/categories');
            }
        } catch (error) {
            showNotification(error.message || 'Error al guardar la categoría', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/categories');
    };

    return (
        <div className={styles.categoriesPage}>
            <div className={styles.header}>
                <h1 className={styles.title}>
                    {isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
                </h1>
            </div>

            <div className={styles.formContainer}>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="name" className={styles.label}>
                            Nombre <span className={styles.required}>*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                            placeholder="Ej: Electrónicos"
                            maxLength={50}
                        />
                        {errors.name && (
                            <span className={styles.errorMessage}>{errors.name}</span>
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="description" className={styles.label}>
                            Descripción
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className={styles.textarea}
                            placeholder="Descripción de la categoría"
                            rows={4}
                            maxLength={500}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="parentId" className={styles.label}>
                            Categoría Padre
                        </label>
                        <select
                            id="parentId"
                            name="parentId"
                            value={formData.parentId}
                            onChange={handleChange}
                            className={`${styles.select} ${errors.parentId ? styles.inputError : ''}`}
                        >
                            <option value="">-- Ninguna (Categoría Principal) --</option>
                            {parentCategories
                                .filter(cat => cat.id !== Number(id))
                                .map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                        </select>
                        {errors.parentId && (
                            <span className={styles.errorMessage}>{errors.parentId}</span>
                        )}
                        <small className={styles.helpText}>
                            Selecciona una categoría padre si esta es una subcategoría
                        </small>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleChange}
                                className={styles.checkbox}
                            />
                            <span>Categoría activa</span>
                        </label>
                    </div>

                    <div className={styles.formActions}>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className={`${styles.button} ${styles.cancelButton}`}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={`${styles.button} ${styles.submitButton}`}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CategoryForm;