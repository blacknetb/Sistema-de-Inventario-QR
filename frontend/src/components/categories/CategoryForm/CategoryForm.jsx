import React, { useState, useEffect } from 'react';
import styles from './CategoryForm.module.css';

const CategoryForm = ({ category, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    color: '#3498db',
    icono: '📁',
    estado: 'activo'
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({});

  // Iconos disponibles
  const iconosDisponibles = [
    '📁', '📱', '💻', '👕', '👗', '👟', '🏠', '🪑', '🚗',
    '📚', '✏️', '🎓', '⚽', '🏀', '🎮', '🎵', '🎨', '🍎',
    '🥗', '☕', '💊', '🔧', '🌿', '🐕', '🐈', '💍', '⌚'
  ];

  // Colores predefinidos
  const coloresPredefinidos = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E2', '#D7BDE2'
  ];

  useEffect(() => {
    if (category) {
      setFormData({
        nombre: category.nombre || '',
        descripcion: category.descripcion || '',
        color: category.color || '#3498db',
        icono: category.icono || '📁',
        estado: category.estado || 'activo'
      });
    }
  }, [category]);

  const validateField = (name, value) => {
    switch (name) {
      case 'nombre':
        if (!value.trim()) return 'El nombre es requerido';
        if (value.length < 3) return 'El nombre debe tener al menos 3 caracteres';
        if (value.length > 50) return 'El nombre no puede exceder 50 caracteres';
        return '';
      
      case 'descripcion':
        if (value.length > 200) return 'La descripción no puede exceder 200 caracteres';
        return '';
      
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validar campo si ya fue tocado
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Marcar todos los campos como tocados
    const allTouched = {};
    Object.keys(formData).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);
    
    // Validar todos los campos
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSave(formData);
    } catch (error) {
      setErrors({ submit: 'Error al guardar la categoría' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h2>{category ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
        <button
          type="button"
          onClick={onCancel}
          className={styles.closeButton}
          disabled={isSubmitting}
        >
          ✕
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Previsualización */}
        <div className={styles.previewSection}>
          <h3>Vista previa</h3>
          <div 
            className={styles.previewCard}
            style={{ backgroundColor: `${formData.color}20`, borderColor: formData.color }}
          >
            <span className={styles.previewIcon}>{formData.icono}</span>
            <div className={styles.previewInfo}>
              <span className={styles.previewName}>{formData.nombre || 'Nombre'}</span>
              <span className={styles.previewBadge} style={{ backgroundColor: formData.color }}>
                {formData.estado === 'activo' ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>

        {/* Campos del formulario */}
        <div className={styles.formGroup}>
          <label htmlFor="nombre">
            Nombre <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Ej: Electrónicos"
            className={errors.nombre ? styles.inputError : ''}
            disabled={isSubmitting}
            maxLength={50}
          />
          {errors.nombre && (
            <span className={styles.errorMessage}>{errors.nombre}</span>
          )}
          <span className={styles.charCounter}>
            {formData.nombre.length}/50
          </span>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Descripción de la categoría..."
            className={errors.descripcion ? styles.inputError : ''}
            disabled={isSubmitting}
            maxLength={200}
            rows={3}
          />
          {errors.descripcion && (
            <span className={styles.errorMessage}>{errors.descripcion}</span>
          )}
          <span className={styles.charCounter}>
            {formData.descripcion.length}/200
          </span>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="icono">Icono</label>
            <div className={styles.iconSelector}>
              <div className={styles.selectedIcon}>
                <span>{formData.icono}</span>
              </div>
              <select
                id="icono"
                name="icono"
                value={formData.icono}
                onChange={handleChange}
                disabled={isSubmitting}
                className={styles.iconSelect}
              >
                {iconosDisponibles.map(icono => (
                  <option key={icono} value={icono}>
                    {icono}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="estado">Estado</label>
            <select
              id="estado"
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              disabled={isSubmitting}
              className={styles.statusSelect}
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Color</label>
          <div className={styles.colorPicker}>
            <input
              type="color"
              name="color"
              value={formData.color}
              onChange={handleChange}
              disabled={isSubmitting}
              className={styles.colorInput}
            />
            <div className={styles.colorPalette}>
              {coloresPredefinidos.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`${styles.colorOption} ${formData.color === color ? styles.active : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleChange({ target: { name: 'color', value: color } })}
                  disabled={isSubmitting}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>

        {errors.submit && (
          <div className={styles.submitError}>
            {errors.submit}
          </div>
        )}

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelButton}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className={styles.spinner}></span>
                Guardando...
              </>
            ) : (
              category ? 'Actualizar' : 'Crear'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CategoryForm;