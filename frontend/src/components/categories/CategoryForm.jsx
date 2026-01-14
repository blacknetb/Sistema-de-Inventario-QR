import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/Categories.css';

/**
 * ✅ COMPONENTE CONTADOR DE CARACTERES OPTIMIZADO
 */
const CharacterCounter = ({ length, maxLength = 500 }) => {
  const counterClass = useMemo(() => {
    if (length >= maxLength) return 'counter-error';
    if (length >= maxLength * 0.9) return 'counter-warning';
    return '';
  }, [length, maxLength]);

  const counterMessage = useMemo(() => {
    if (length >= maxLength) {
      return <span>Límite alcanzado</span>;
    }
    if (length >= maxLength * 0.9) {
      return <span>{maxLength - length} caracteres restantes</span>;
    }
    return 'Máximo 500 caracteres';
  }, [length, maxLength]);

  return (
    <div className="character-counter">
      <span className={`counter-text ${counterClass}`}>
        {counterMessage}
      </span>
      <span className="counter-numbers">
        {length}/{maxLength}
      </span>
    </div>
  );
};

CharacterCounter.propTypes = {
  length: PropTypes.number.isRequired,
  maxLength: PropTypes.number,
};

CharacterCounter.defaultProps = {
  maxLength: 500,
};

/**
 * ✅ COMPONENTE INFORMACIÓN DE CATEGORÍA OPTIMIZADO
 */
const CategoryInfo = ({ category }) => {
  const formatDate = useCallback((dateString) => {
    if (!dateString) return '—';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Fecha inválida';
    }
  }, []);

  if (!category) return null;

  return (
    <div className="category-info">
      <h4 className="info-title">Información de la categoría</h4>
      <div className="info-grid">
        <div className="info-item">
          <span className="info-label">ID:</span>
          <span className="info-value">{category.id || '—'}</span>
        </div>

        <div className="info-item">
          <span className="info-label">Creada:</span>
          <span className="info-value">
            {formatDate(category.created_at)}
          </span>
        </div>

        <div className="info-item">
          <span className="info-label">Actualizada:</span>
          <span className="info-value">
            {formatDate(category.updated_at)}
          </span>
        </div>

        <div className="info-item">
          <span className="info-label">Productos:</span>
          <span className={`info-value ${category.product_count > 0 ? 'has-products' : ''}`}>
            {category.product_count || 0}
          </span>
        </div>
      </div>
    </div>
  );
};

CategoryInfo.propTypes = {
  category: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    created_at: PropTypes.string,
    updated_at: PropTypes.string,
    product_count: PropTypes.number
  })
};

/**
 * ✅ UTILIDADES OPTIMIZADAS
 */
const generateUniqueId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 11)}`;

const validateName = (name) => {
  if (!name.trim()) {
    return 'El nombre es requerido';
  }
  if (name.length < 2) {
    return 'El nombre debe tener al menos 2 caracteres';
  }
  if (name.length > 50) {
    return 'El nombre no puede exceder 50 caracteres';
  }
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s0-9\-_&.,()]+$/.test(name)) {
    return 'Caracteres especiales no permitidos (solo se permiten: -_&.,())';
  }
  return '';
};

const validateDescription = (description) => {
  if (description.length > 500) {
    return 'La descripción no puede exceder 500 caracteres';
  }
  return '';
};

/**
 * ✅ COMPONENTE PRINCIPAL CATEGORY FORM OPTIMIZADO
 */
const CategoryForm = ({
  category = null,
  onSubmit,
  onCancel,
  loading = false,
  showInfo = true
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const nameInputId = useMemo(() => 
    React.useId ? React.useId() : generateUniqueId('category-name'),
  []);
  
  const descriptionInputId = useMemo(() => 
    React.useId ? React.useId() : generateUniqueId('category-description'),
  []);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || ''
      });
    } else {
      setFormData({ name: '', description: '' });
    }
  }, [category]);

  const validate = useCallback(() => {
    const newErrors = {};
    const nameError = validateName(formData.name);
    const descriptionError = validateDescription(formData.description);

    if (nameError) {
      newErrors.name = nameError;
    }

    if (descriptionError) {
      newErrors.description = descriptionError;
    }

    return newErrors;
  }, [formData]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      
      setTimeout(() => {
        const firstError = Object.keys(validationErrors)[0];
        const errorElement = document.getElementById(
          firstError === 'name' ? nameInputId : descriptionInputId
        );
        errorElement?.focus();
      }, 100);
      
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await onSubmit(formData);
      setSuccessMessage(category ? 'Categoría actualizada exitosamente' : 'Categoría creada exitosamente');

      if (!category) {
        setFormData({ name: '', description: '' });
      }

      const timeoutId = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timeoutId);
    } catch (error) {
      setErrors({ 
        submit: error.message || 'Error al guardar la categoría' 
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validate, onSubmit, category, nameInputId, descriptionInputId]);

  const handleCancel = useCallback(() => {
    if (formData.name.trim() || formData.description.trim()) {
      if (!window.confirm('¿Estás seguro de cancelar? Los cambios no guardados se perderán.')) {
        return;
      }
    }
    onCancel();
  }, [formData, onCancel]);

  const currentLoading = loading || isSubmitting;
  const canSubmit = !currentLoading && formData.name.trim().length >= 2;

  return (
    <form onSubmit={handleSubmit} className="category-form" noValidate>
      {errors.submit && (
        <div className="form-alert form-error" role="alert">
          <span className="alert-icon" aria-hidden="true">⚠️</span>
          <span>{errors.submit}</span>
        </div>
      )}

      {successMessage && (
        <div className="form-alert form-success" role="status">
          <span className="alert-icon" aria-hidden="true">✅</span>
          <span>{successMessage}</span>
        </div>
      )}

      <div className="form-group">
        <label htmlFor={nameInputId} className="form-label">
          <span className="label-icon" aria-hidden="true">🏷️</span>
          {' '}
          Nombre de la categoría *
        </label>
        <input
          id={nameInputId}
          type="text"
          name="name"
          className={`form-input ${errors.name ? 'input-error' : ''}`}
          placeholder="Ej: Electrónica, Oficina, Ropa, etc."
          value={formData.name}
          onChange={handleChange}
          disabled={currentLoading}
          autoFocus={!category}
          maxLength={50}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? `${nameInputId}-error` : undefined}
          required
        />
        {errors.name && (
          <span id={`${nameInputId}-error`} className="error-message" role="alert">
            {errors.name}
          </span>
        )}
        <p className="form-hint">
          El nombre debe ser único y descriptivo (2-50 caracteres).
        </p>
      </div>

      <div className="form-group">
        <label htmlFor={descriptionInputId} className="form-label">
          <span className="label-icon" aria-hidden="true">📝</span>
          {' '}
          Descripción
        </label>
        <textarea
          id={descriptionInputId}
          name="description"
          className={`form-textarea ${errors.description ? 'input-error' : ''}`}
          placeholder="Describe esta categoría (opcional)..."
          value={formData.description}
          onChange={handleChange}
          disabled={currentLoading}
          maxLength={500}
          rows={4}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? `${descriptionInputId}-error` : undefined}
        />

        <CharacterCounter length={formData.description.length} />

        {errors.description && (
          <span id={`${descriptionInputId}-error`} className="error-message" role="alert">
            {errors.description}
          </span>
        )}
      </div>

      {showInfo && category && <CategoryInfo category={category} />}

      <div className={`validation-indicator ${Object.keys(errors).length > 0 ? 'invalid' : 'valid'}`}>
        <div className={`indicator-dot ${Object.keys(errors).length > 0 ? 'dot-error' : 'dot-success'}`} />
        <span className={`indicator-text ${Object.keys(errors).length > 0 ? 'text-error' : 'text-success'}`}>
          {Object.keys(errors).length > 0
            ? `Hay ${Object.keys(errors).length} error(es) en el formulario`
            : 'Formulario validado correctamente'}
        </span>
      </div>

      <div className="form-actions">
        <button
          type="button"
          onClick={handleCancel}
          disabled={currentLoading}
          className="btn btn-outline"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={!canSubmit}
          className={`btn btn-primary ${currentLoading ? 'btn-loading' : ''}`}
          title={Object.keys(errors).length > 0 ? 'Corrija los errores para guardar' : ''}
          aria-busy={currentLoading}
        >
          {currentLoading ? (
            <>
              <span className="loading-spinner-small" aria-hidden="true" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <span className="btn-icon" aria-hidden="true">💾</span>
              <span>{category ? 'Actualizar Categoría' : 'Crear Categoría'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

CategoryForm.propTypes = {
  category: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    description: PropTypes.string,
    product_count: PropTypes.number,
    created_at: PropTypes.string,
    updated_at: PropTypes.string
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  showInfo: PropTypes.bool
};

CategoryForm.defaultProps = {
  category: null,
  loading: false,
  showInfo: true
};

CategoryForm.CharacterCounter = CharacterCounter;
CategoryForm.CategoryInfo = CategoryInfo;

export default CategoryForm;